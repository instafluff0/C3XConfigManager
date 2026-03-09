import com.civfanatics.civ3.biqFile.BIQSection;
import com.civfanatics.civ3.biqFile.Section;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.lang.reflect.Method;

public class BiqBridge {
    private static String jescape(String s) {
        if (s == null) return "";
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\': out.append("\\\\"); break;
                case '"': out.append("\\\""); break;
                case '\n': out.append("\\n"); break;
                case '\r': out.append("\\r"); break;
                case '\t': out.append("\\t"); break;
                default:
                    if (c < 0x20) out.append(String.format("\\u%04x", (int)c));
                    else out.append(c);
            }
        }
        return out.toString();
    }

    private static String parseEntryName(String sectionCode, int index, BIQSection section, String english) {
        String name = section.getName();
        if (name != null && !name.trim().isEmpty()) return name.trim();
        String[] lines = english.split("\\r?\\n");
        for (String line : lines) {
            String t = line.trim();
            int colon = t.indexOf(':');
            if (colon <= 0) continue;
            String key = t.substring(0, colon).trim().toLowerCase();
            String val = t.substring(colon + 1).trim();
            if ((key.equals("name") || key.equals("description")) && !val.isEmpty()) return val;
        }
        return sectionCode + " " + (index + 1);
    }

    private static String toSetterName(String fieldKey) {
        String base = fieldKey == null ? "" : fieldKey.trim();
        if (base.isEmpty()) return "";
        base = base.replaceAll("_\\d+$", "");
        String[] parts = base.split("_+");
        StringBuilder sb = new StringBuilder("set");
        for (String p : parts) {
            if (p == null || p.isEmpty()) continue;
            sb.append(Character.toUpperCase(p.charAt(0)));
            if (p.length() > 1) sb.append(p.substring(1));
        }
        return sb.toString();
    }

    private static Integer parseIntLoose(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        if (t.isEmpty()) return null;
        if (t.matches("[-+]?\\d+")) {
            return Integer.parseInt(t);
        }
        int sign = 1;
        int start = t.lastIndexOf('(');
        int end = t.lastIndexOf(')');
        if (start >= 0 && end > start + 1) {
            String inner = t.substring(start + 1, end).trim();
            if (inner.matches("[-+]?\\d+")) return Integer.parseInt(inner);
        }
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if ((c == '-' || c == '+') && digits.length() == 0) {
                digits.append(c);
            } else if (Character.isDigit(c)) {
                digits.append(c);
            } else if (digits.length() > 0) {
                break;
            }
        }
        if (digits.length() > 0 && digits.toString().matches("[-+]?\\d+")) {
            return Integer.parseInt(digits.toString());
        }
        return null;
    }

    private static Boolean parseBoolLoose(String raw) {
        if (raw == null) return null;
        String t = raw.trim().toLowerCase();
        if (t.equals("true") || t.equals("1") || t.equals("yes")) return Boolean.TRUE;
        if (t.equals("false") || t.equals("0") || t.equals("no")) return Boolean.FALSE;
        return null;
    }

    private static Method findSetter(Class<?> clazz, String name) {
        for (Method m : clazz.getMethods()) {
            if (!m.getName().equals(name)) continue;
            if (m.getParameterCount() != 1) continue;
            return m;
        }
        return null;
    }

    private static String toSnakeLowerFromSetterName(String setterName) {
        if (setterName == null || !setterName.startsWith("set") || setterName.length() <= 3) return "";
        String camel = setterName.substring(3);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < camel.length(); i++) {
            char c = camel.charAt(i);
            if (Character.isUpperCase(c) && i > 0) out.append('_');
            out.append(Character.toLowerCase(c));
        }
        return out.toString();
    }

    private static Set<String> writableBaseKeysForRecord(BIQSection rec) {
        Set<String> keys = new TreeSet<>();
        if (rec == null) return keys;
        Class<?> c = rec.getClass();
        for (Method m : c.getMethods()) {
            if (!m.getName().startsWith("set")) continue;
            if (m.getParameterCount() != 1) continue;
            if (m.getDeclaringClass() == BIQSection.class) continue;
            String key = toSnakeLowerFromSetterName(m.getName());
            if (key.isEmpty()) continue;
            keys.add(key);
        }
        return keys;
    }

    private static Object convertValue(Class<?> type, String raw) {
        if (type == String.class) {
            return raw;
        }
        if (type == int.class || type == Integer.class) {
            Integer n = parseIntLoose(raw);
            return n == null ? null : n;
        }
        if (type == short.class || type == Short.class) {
            Integer n = parseIntLoose(raw);
            return n == null ? null : Short.valueOf((short)(int)n);
        }
        if (type == byte.class || type == Byte.class) {
            Integer n = parseIntLoose(raw);
            return n == null ? null : Byte.valueOf((byte)(int)n);
        }
        if (type == boolean.class || type == Boolean.class) {
            return parseBoolLoose(raw);
        }
        return null;
    }

    private static BIQSection findRecordByCivilopedia(List<?> records, String civilopediaKey) {
        if (records == null) return null;
        String key = civilopediaKey == null ? "" : civilopediaKey.trim().toUpperCase();
        for (Object obj : records) {
            if (!(obj instanceof BIQSection)) continue;
            BIQSection rec = (BIQSection) obj;
            String recKey = rec.getCivilopediaEntry();
            if (recKey != null && recKey.trim().toUpperCase().equals(key)) {
                return rec;
            }
        }
        return null;
    }

    private static String applyEdits(String biqPath, String patchPath, String outPath) throws Exception {
        com.civfanatics.civ3.biqFile.IO io = new com.civfanatics.civ3.biqFile.IO();
        if (!io.inputBIQ(new File(biqPath))) {
            return "{\"ok\":false,\"error\":\"IO.inputBIQ returned false\"}";
        }
        List<String> lines = Files.readAllLines(Paths.get(patchPath), StandardCharsets.UTF_8);
        int applied = 0;
        int skipped = 0;
        StringBuilder warnings = new StringBuilder();
        for (String line : lines) {
            if (line == null || line.trim().isEmpty()) continue;
            String[] parts = line.split("\t", 4);
            if (parts.length < 4) {
                skipped++;
                continue;
            }
            String sectionCode = parts[0].trim();
            String civKey = parts[1].trim();
            String fieldKey = parts[2].trim();
            String rawValue = new String(Base64.getDecoder().decode(parts[3].trim()), StandardCharsets.UTF_8);
            Section section;
            try {
                section = Section.valueOf(sectionCode);
            } catch (Throwable t) {
                skipped++;
                warnings.append("unknown section ").append(sectionCode).append("; ");
                continue;
            }
            List<?> records = io.getSection(section);
            BIQSection rec = findRecordByCivilopedia(records, civKey);
            if (rec == null) {
                skipped++;
                warnings.append("missing record ").append(civKey).append(" in ").append(sectionCode).append("; ");
                continue;
            }
            String setterName = toSetterName(fieldKey);
            if (setterName.isEmpty()) {
                skipped++;
                continue;
            }
            Method setter = findSetter(rec.getClass(), setterName);
            if (setter == null) {
                skipped++;
                warnings.append("no setter ").append(setterName).append(" for ").append(civKey).append("; ");
                continue;
            }
            Object converted = convertValue(setter.getParameterTypes()[0], rawValue);
            if (converted == null) {
                skipped++;
                warnings.append("bad value ").append(rawValue).append(" for ").append(setterName).append("; ");
                continue;
            }
            setter.invoke(rec, converted);
            applied++;
        }
        if (!io.outputBIQ(new File(outPath))) {
            return "{\"ok\":false,\"error\":\"IO.outputBIQ returned false\"}";
        }
        return "{\"ok\":true,\"applied\":" + applied + ",\"skipped\":" + skipped + ",\"warning\":\"" + jescape(warnings.toString()) + "\"}";
    }

    public static void main(String[] args) {
        if (args.length >= 1 && "--apply".equals(args[0])) {
            if (args.length < 4) {
                System.out.println("{\"ok\":false,\"error\":\"usage: --apply <biqPath> <patchPath> <outPath>\"}");
                return;
            }
            try {
                System.out.println(applyEdits(args[1], args[2], args[3]));
            } catch (Throwable t) {
                System.out.println("{\"ok\":false,\"error\":\"" + jescape(String.valueOf(t)) + "\"}");
            }
            return;
        }
        if (args.length < 1) {
            System.out.println("{\"ok\":false,\"error\":\"missing biq path\"}");
            return;
        }
        try {
            com.civfanatics.civ3.biqFile.IO io = new com.civfanatics.civ3.biqFile.IO();
            if (!io.inputBIQ(new File(args[0]))) {
                System.out.println("{\"ok\":false,\"error\":\"IO.inputBIQ returned false\"}");
                return;
            }
            StringBuilder sb = new StringBuilder();
            sb.append("{\"ok\":true,\"sections\":[");
            boolean firstSection = true;
            for (Section s : Section.values()) {
                List<?> list = io.getSection(s);
                if (list == null || list.isEmpty()) continue;
                if (!firstSection) sb.append(',');
                firstSection = false;
                String code = s.name();
                sb.append("{\"code\":\"").append(jescape(code)).append("\",");
                sb.append("\"title\":\"").append(jescape(s.toString())).append("\",");
                sb.append("\"count\":").append(list.size()).append(',');
                sb.append("\"records\":[");

                boolean firstRecord = true;
                for (int i = 0; i < list.size(); i++) {
                    BIQSection rec = (BIQSection) list.get(i);
                    String english = rec.toEnglish();
                    String entryName = parseEntryName(code, i, rec, english);
                    Set<String> writable = writableBaseKeysForRecord(rec);
                    if (!firstRecord) sb.append(',');
                    firstRecord = false;
                    sb.append("{\"index\":").append(i).append(',');
                    sb.append("\"name\":\"").append(jescape(entryName)).append("\",");
                    sb.append("\"english\":\"").append(jescape(english)).append("\",");
                    sb.append("\"writableBaseKeys\":[");
                    boolean firstWritable = true;
                    for (String w : writable) {
                        if (!firstWritable) sb.append(',');
                        firstWritable = false;
                        sb.append('"').append(jescape(w)).append('"');
                    }
                    sb.append("]}");
                }
                sb.append("]}");
            }
            sb.append("]}");
            System.out.println(sb.toString());
        } catch (Throwable t) {
            System.out.println("{\"ok\":false,\"error\":\"" + jescape(String.valueOf(t)) + "\"}");
        }
    }
}
