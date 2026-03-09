import com.civfanatics.civ3.biqFile.BIQSection;
import com.civfanatics.civ3.biqFile.Section;
import java.io.File;
import java.util.List;

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

    public static void main(String[] args) {
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
                    if (!firstRecord) sb.append(',');
                    firstRecord = false;
                    sb.append("{\"index\":").append(i).append(',');
                    sb.append("\"name\":\"").append(jescape(entryName)).append("\",");
                    sb.append("\"english\":\"").append(jescape(english)).append("\"}");
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
