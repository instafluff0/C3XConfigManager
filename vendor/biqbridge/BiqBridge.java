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
import java.util.ArrayList;

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

    private static String canonicalFieldKey(String raw) {
        if (raw == null) return "";
        return raw.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private static String aliasCanonicalFieldKey(String canonical) {
        if (canonical == null) return "";
        // Known typo in Civ3 English dump for this field.
        if (canonical.equals("disapperanceprobability")) return "disappearanceprobability";
        return canonical;
    }

    private static Method findSetterByCanonicalFieldKey(Class<?> clazz, String fieldKey) {
        String requested = aliasCanonicalFieldKey(canonicalFieldKey(fieldKey));
        if (requested.isEmpty()) return null;
        Method partialMatch = null;
        for (Method m : clazz.getMethods()) {
            if (!m.getName().startsWith("set")) continue;
            if (m.getParameterCount() != 1) continue;
            String setterKey = canonicalFieldKey(toSnakeLowerFromSetterName(m.getName()));
            if (setterKey.isEmpty()) continue;
            if (setterKey.equals(requested)) {
                return m;
            }
            if (partialMatch == null && (setterKey.contains(requested) || requested.contains(setterKey))) {
                partialMatch = m;
            }
        }
        return partialMatch;
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

    private static BIQSection findRecordByRef(List<?> records, String recordRef) {
        if (records == null) return null;
        String key = recordRef == null ? "" : recordRef.trim();
        String upper = key.toUpperCase();
        if (upper.startsWith("@INDEX:")) {
            String idxRaw = key.substring("@INDEX:".length()).trim();
            try {
                int idx = Integer.parseInt(idxRaw);
                if (idx >= 0 && idx < records.size()) {
                    Object obj = records.get(idx);
                    if (obj instanceof BIQSection) return (BIQSection) obj;
                }
            } catch (Throwable ignored) {
                // fall through to civilopedia lookup
            }
        }
        String civKey = upper;
        for (Object obj : records) {
            if (!(obj instanceof BIQSection)) continue;
            BIQSection rec = (BIQSection) obj;
            String recKey = rec.getCivilopediaEntry();
            if (recKey != null && recKey.trim().toUpperCase().equals(civKey)) {
                return rec;
            }
        }
        return null;
    }

    private static String toDisplayNameFromCivilopediaKey(String key) {
        String raw = key == null ? "" : key.trim().toUpperCase();
        if (raw.startsWith("RACE_")) raw = raw.substring(5);
        else if (raw.startsWith("TECH_")) raw = raw.substring(5);
        else if (raw.startsWith("GOOD_")) raw = raw.substring(5);
        else if (raw.startsWith("BLDG_")) raw = raw.substring(5);
        else if (raw.startsWith("GOVT_")) raw = raw.substring(5);
        else if (raw.startsWith("PRTO_")) raw = raw.substring(5);
        raw = raw.replace('_', ' ').trim();
        if (raw.isEmpty()) return "New Entry";
        StringBuilder out = new StringBuilder();
        boolean cap = true;
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            if (Character.isWhitespace(c)) {
                out.append(c);
                cap = true;
                continue;
            }
            out.append(cap ? Character.toUpperCase(c) : Character.toLowerCase(c));
            cap = false;
        }
        return out.toString();
    }

    private static BIQSection instantiateRecord(Section section, com.civfanatics.civ3.biqFile.IO io, String civilopediaKey) {
        String name = toDisplayNameFromCivilopediaKey(civilopediaKey);
        int idx = 0;
        List<?> existing = io.getSection(section);
        if (existing != null) idx = existing.size();
        try {
            switch (section) {
                case RACE:
                    return new com.civfanatics.civ3.biqFile.RACE(name, idx, io);
                case TECH:
                    return new com.civfanatics.civ3.biqFile.TECH(name, idx, io);
                case GOOD:
                    return new com.civfanatics.civ3.biqFile.GOOD(name, io);
                case BLDG:
                    return new com.civfanatics.civ3.biqFile.BLDG(name, idx, io);
                case GOVT:
                    return new com.civfanatics.civ3.biqFile.GOVT(name, idx, io);
                case PRTO:
                    return new com.civfanatics.civ3.biqFile.PRTO(name, io, idx);
                default:
                    return null;
            }
        } catch (Throwable t) {
            return null;
        }
    }

    private static void copySettableFields(BIQSection source, BIQSection target) {
        if (source == null || target == null) return;
        Class<?> srcClass = source.getClass();
        Class<?> dstClass = target.getClass();
        for (Method setter : dstClass.getMethods()) {
            if (!setter.getName().startsWith("set")) continue;
            if (setter.getParameterCount() != 1) continue;
            Class<?> pType = setter.getParameterTypes()[0];
            String suffix = setter.getName().substring(3);
            Method getter = null;
            try {
                getter = srcClass.getMethod("get" + suffix);
            } catch (Throwable ignored) {
                // ignore
            }
            if (getter == null) {
                try {
                    getter = srcClass.getMethod("is" + suffix);
                } catch (Throwable ignored) {
                    // ignore
                }
            }
            if (getter == null) continue;
            if (!pType.isAssignableFrom(getter.getReturnType())
                && !(pType.isPrimitive() && (
                    (pType == int.class && getter.getReturnType() == Integer.class)
                    || (pType == short.class && getter.getReturnType() == Short.class)
                    || (pType == byte.class && getter.getReturnType() == Byte.class)
                    || (pType == boolean.class && getter.getReturnType() == Boolean.class)
                ))) {
                continue;
            }
            try {
                Object v = getter.invoke(source);
                if (v != null) setter.invoke(target, v);
            } catch (Throwable ignored) {
                // best effort copy
            }
        }
    }

    private static boolean setCivilopediaEntrySafe(BIQSection rec, String key) {
        if (rec == null || key == null || key.trim().isEmpty()) return false;
        Method setter = findSetter(rec.getClass(), "setCivilopediaEntry");
        if (setter == null) return false;
        try {
            setter.invoke(rec, key.trim().toUpperCase());
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    private static boolean addRecord(com.civfanatics.civ3.biqFile.IO io, Section section, String newRef, String copyFromRef, StringBuilder warnings) {
        List<?> listAny = io.getSection(section);
        if (!(listAny instanceof List)) return false;
        @SuppressWarnings("unchecked")
        List<BIQSection> list = (List<BIQSection>) listAny;
        String newKey = newRef == null ? "" : newRef.trim().toUpperCase();
        if (newKey.isEmpty()) {
            warnings.append("missing new record key for section ").append(section.name()).append("; ");
            return false;
        }
        if (findRecordByRef(list, newKey) != null) {
            warnings.append("record already exists ").append(newKey).append(" in ").append(section.name()).append("; ");
            return false;
        }
        BIQSection created = instantiateRecord(section, io, newKey);
        if (created == null) {
            warnings.append("cannot instantiate new record ").append(newKey).append(" for ").append(section.name()).append("; ");
            return false;
        }
        if (copyFromRef != null && !copyFromRef.trim().isEmpty()) {
            BIQSection src = findRecordByRef(list, copyFromRef.trim());
            if (src != null) {
                copySettableFields(src, created);
            } else {
                warnings.append("copy source missing ").append(copyFromRef).append(" in ").append(section.name()).append("; ");
            }
        }
        setCivilopediaEntrySafe(created, newKey);
        list.add(created);
        return true;
    }

    private static boolean deleteRecord(com.civfanatics.civ3.biqFile.IO io, Section section, String recordRef, StringBuilder warnings) {
        List<?> listAny = io.getSection(section);
        if (!(listAny instanceof List)) return false;
        @SuppressWarnings("unchecked")
        List<BIQSection> list = (List<BIQSection>) listAny;
        BIQSection rec = findRecordByRef(list, recordRef);
        if (rec == null) {
            warnings.append("missing record ").append(recordRef).append(" in ").append(section.name()).append("; ");
            return false;
        }
        int deletedIndex = list.indexOf(rec);
        if (deletedIndex < 0) {
            warnings.append("cannot resolve delete index for ").append(recordRef).append(" in ").append(section.name()).append("; ");
            return false;
        }
        switch (section) {
            case TECH:
                cascadeDeleteTech(io, deletedIndex);
                break;
            case GOOD:
                cascadeDeleteGood(io, deletedIndex);
                break;
            case BLDG:
                cascadeDeleteBuilding(io, deletedIndex);
                break;
            case GOVT:
                cascadeDeleteGovernment(io, deletedIndex);
                break;
            case PRTO:
                if (hasScenarioMapData(io)) {
                    warnings.append("cannot delete ").append(recordRef).append(" from PRTO when custom map data exists; ");
                    return false;
                }
                cascadeDeleteUnit(io, deletedIndex);
                break;
            case RACE:
                if (hasScenarioMapData(io)) {
                    warnings.append("cannot delete ").append(recordRef).append(" from RACE when custom map data exists; ");
                    return false;
                }
                cascadeDeleteCiv(io, deletedIndex, list.size());
                break;
            default:
                break;
        }
        if (!list.remove(rec)) return false;
        return true;
    }

    private static boolean hasScenarioMapData(com.civfanatics.civ3.biqFile.IO io) {
        Section[] sections = new Section[] { Section.TILE, Section.CITY, Section.UNIT, Section.CLNY, Section.CONT, Section.SLOC };
        for (Section s : sections) {
            List<?> list = io.getSection(s);
            if (list != null && !list.isEmpty()) return true;
        }
        return false;
    }

    private static void invokeIntMethod(BIQSection target, String methodName, int value) {
        if (target == null || methodName == null || methodName.isEmpty()) return;
        try {
            Method m = target.getClass().getMethod(methodName, int.class);
            m.invoke(target, value);
            return;
        } catch (Throwable ignored) {
            // try Integer overload
        }
        try {
            Method m = target.getClass().getMethod(methodName, Integer.class);
            m.invoke(target, Integer.valueOf(value));
        } catch (Throwable ignored) {
            // best effort
        }
    }

    private static void invokeOnSectionList(com.civfanatics.civ3.biqFile.IO io, Section section, String methodName, int value) {
        List<?> list = io.getSection(section);
        if (list == null) return;
        for (Object obj : list) {
            if (!(obj instanceof BIQSection)) continue;
            invokeIntMethod((BIQSection) obj, methodName, value);
        }
    }

    private static void invokeIntIntMethod(BIQSection target, String methodName, int valueA, int valueB) {
        if (target == null || methodName == null || methodName.isEmpty()) return;
        try {
            Method m = target.getClass().getMethod(methodName, int.class, int.class);
            m.invoke(target, valueA, valueB);
            return;
        } catch (Throwable ignored) {
            // best effort
        }
        try {
            Method m = target.getClass().getMethod(methodName, Integer.class, Integer.class);
            m.invoke(target, Integer.valueOf(valueA), Integer.valueOf(valueB));
        } catch (Throwable ignored) {
            // best effort
        }
    }

    @SuppressWarnings("unchecked")
    private static void cascadeDeleteTech(com.civfanatics.civ3.biqFile.IO io, int index) {
        invokeOnSectionList(io, Section.GOOD, "handleDeletedTechnology", index);
        invokeOnSectionList(io, Section.RACE, "handleDeletedTechnology", index);
        invokeOnSectionList(io, Section.PRTO, "handleDeletedTechnology", index);
        invokeOnSectionList(io, Section.CTZN, "handleDeletedTech", index);
        invokeOnSectionList(io, Section.GOVT, "handleDeletedTech", index);
        invokeOnSectionList(io, Section.TFRM, "handleDeletedTech", index);
        invokeOnSectionList(io, Section.TECH, "handleDeletedTechnology", index);
        invokeOnSectionList(io, Section.BLDG, "handleDeletedTech", index);
        invokeOnSectionList(io, Section.LEAD, "handleDeletedTech", index);
    }

    @SuppressWarnings("unchecked")
    private static void cascadeDeleteGood(com.civfanatics.civ3.biqFile.IO io, int index) {
        List<?> tiles = io.getSection(Section.TILE);
        if (tiles != null) {
            for (Object obj : tiles) {
                if (!(obj instanceof BIQSection)) continue;
                BIQSection tile = (BIQSection) obj;
                Integer resourceInt = null;
                try {
                    Method getter = tile.getClass().getMethod("getResource");
                    Object v = getter.invoke(tile);
                    if (v instanceof Number) resourceInt = Integer.valueOf(((Number) v).intValue());
                } catch (Throwable ignored) {
                    // fallback to field
                }
                if (resourceInt == null) {
                    try {
                        java.lang.reflect.Field f = tile.getClass().getField("resourceInt");
                        Object v = f.get(tile);
                        if (v instanceof Number) resourceInt = Integer.valueOf(((Number) v).intValue());
                    } catch (Throwable ignored) {
                        // best effort
                    }
                }
                if (resourceInt == null) continue;
                if (resourceInt.intValue() == index) {
                    invokeIntMethod(tile, "setResource", -1);
                } else if (resourceInt.intValue() > index) {
                    invokeIntMethod(tile, "setResource", resourceInt.intValue() - 1);
                }
            }
        }

        List<?> rules = io.getSection(Section.RULE);
        if (rules != null && !rules.isEmpty() && rules.get(0) instanceof BIQSection) {
            BIQSection rule = (BIQSection) rules.get(0);
            try {
                Method getter = rule.getClass().getMethod("getDefaultMoneyResource");
                Object v = getter.invoke(rule);
                if (v instanceof Number) {
                    int current = ((Number) v).intValue();
                    if (current == index) invokeIntMethod(rule, "setDefaultMoneyResource", -1);
                    else if (current > index) invokeIntMethod(rule, "setDefaultMoneyResource", current - 1);
                }
            } catch (Throwable ignored) {
                // best effort
            }
        }

        invokeOnSectionList(io, Section.TFRM, "handleDeletedGood", index);
        invokeOnSectionList(io, Section.PRTO, "handleDeletedResource", index);

        List<?> bldgs = io.getSection(Section.BLDG);
        if (bldgs != null) {
            for (Object obj : bldgs) {
                if (!(obj instanceof BIQSection)) continue;
                BIQSection b = (BIQSection) obj;
                adjustIndexedField(b, "getReqResource1", "setReqResource1", index);
                adjustIndexedField(b, "getReqResource2", "setReqResource2", index);
            }
        }

        List<?> terrs = io.getSection(Section.TERR);
        if (terrs != null) {
            for (Object obj : terrs) {
                if (!(obj instanceof BIQSection)) continue;
                BIQSection terr = (BIQSection) obj;
                try {
                    Method getAllowed = terr.getClass().getMethod("getAllowedResources");
                    Object v = getAllowed.invoke(terr);
                    if (!(v instanceof List)) continue;
                    List<Integer> allowed = (List<Integer>) v;
                    int removed = 0;
                    for (int i = 0; i < allowed.size(); i++) {
                        Integer val = allowed.get(i);
                        if (val == null) continue;
                        if (val.intValue() == index) {
                            allowed.remove(i);
                            i--;
                            removed++;
                        } else if (val.intValue() > index) {
                            allowed.set(i, Integer.valueOf(val.intValue() - 1));
                        }
                    }
                    if (removed > 0) {
                        try {
                            Method getNum = terr.getClass().getMethod("getNumPossibleResources");
                            Object n = getNum.invoke(terr);
                            if (n instanceof Number) {
                                invokeIntMethod(terr, "setNumPossibleResources", ((Number) n).intValue() - removed);
                            }
                        } catch (Throwable ignored) {
                            invokeIntMethod(terr, "setNumPossibleResources", Math.max(0, allowed.size()));
                        }
                    }
                } catch (Throwable ignored) {
                    // best effort
                }
            }
        }
    }

    private static void adjustIndexedField(BIQSection rec, String getterName, String setterName, int deletedIndex) {
        try {
            Method getter = rec.getClass().getMethod(getterName);
            Object v = getter.invoke(rec);
            if (!(v instanceof Number)) return;
            int current = ((Number) v).intValue();
            if (current == deletedIndex) invokeIntMethod(rec, setterName, -1);
            else if (current > deletedIndex) invokeIntMethod(rec, setterName, current - 1);
        } catch (Throwable ignored) {
            // best effort
        }
    }

    private static void cascadeDeleteBuilding(com.civfanatics.civ3.biqFile.IO io, int index) {
        invokeOnSectionList(io, Section.CITY, "handleDeletedBuilding", index);
        invokeOnSectionList(io, Section.BLDG, "handleDeletedBuilding", index);
    }

    @SuppressWarnings("unchecked")
    private static void cascadeDeleteGovernment(com.civfanatics.civ3.biqFile.IO io, int index) {
        invokeOnSectionList(io, Section.BLDG, "handleDeletedGovernment", index);
        invokeOnSectionList(io, Section.RACE, "handleDeletedGovernment", index);
        List<?> govts = io.getSection(Section.GOVT);
        if (govts == null) return;
        int newCount = Math.max(0, govts.size() - 1);
        for (Object obj : govts) {
            if (!(obj instanceof BIQSection)) continue;
            BIQSection govt = (BIQSection) obj;
            invokeIntMethod(govt, "setNumberOfGovernments", newCount);
            try {
                java.lang.reflect.Field dataLength = govt.getClass().getField("dataLength");
                Object dl = dataLength.get(govt);
                if (dl instanceof Number) {
                    dataLength.set(govt, Integer.valueOf(((Number) dl).intValue() - 12));
                }
            } catch (Throwable ignored) {
                // best effort
            }
            try {
                java.lang.reflect.Field relations = govt.getClass().getField("relations");
                Object relObj = relations.get(govt);
                if (relObj instanceof List) {
                    List<?> rel = (List<?>) relObj;
                    if (index >= 0 && index < rel.size()) rel.remove(index);
                }
            } catch (Throwable ignored) {
                // best effort
            }
        }
    }

    private static void cascadeDeleteUnit(com.civfanatics.civ3.biqFile.IO io, int index) {
        invokeOnSectionList(io, Section.RACE, "handleDeletedUnit", index);
        invokeOnSectionList(io, Section.BLDG, "handleDeleteUnit", index);
        invokeOnSectionList(io, Section.PRTO, "handleDeletedUnit", index);
        invokeOnSectionList(io, Section.RULE, "handleDeletedUnit", index);
        invokeOnSectionList(io, Section.UNIT, "handleDeletedUnit", index);
        List<?> prtos = io.getSection(Section.PRTO);
        if (prtos != null && index >= 0 && index < prtos.size()) {
            Object target = prtos.get(index);
            if (target instanceof com.civfanatics.civ3.biqFile.PRTO) {
                com.civfanatics.civ3.biqFile.PRTO p = (com.civfanatics.civ3.biqFile.PRTO) target;
                List<?> leads = io.getSection(Section.LEAD);
                if (leads != null) {
                    for (Object obj : leads) {
                        if (!(obj instanceof BIQSection)) continue;
                        try {
                            Method m = obj.getClass().getMethod("handleDeletedUnit", com.civfanatics.civ3.biqFile.PRTO.class);
                            m.invoke(obj, p);
                        } catch (Throwable ignored) {
                            // best effort
                        }
                    }
                }
            }
        }
    }

    private static void cascadeDeleteCiv(com.civfanatics.civ3.biqFile.IO io, int index, int civCountBeforeDelete) {
        List<?> prtos = io.getSection(Section.PRTO);
        if (prtos != null) {
            for (Object obj : prtos) {
                if (!(obj instanceof BIQSection)) continue;
                invokeIntIntMethod((BIQSection) obj, "handleDeletedCivilization", index, civCountBeforeDelete);
            }
        }
        List<?> races = io.getSection(Section.RACE);
        if (races != null) {
            for (int i = index + 1; i < races.size(); i++) {
                Object obj = races.get(i);
                if (!(obj instanceof BIQSection)) continue;
                BIQSection race = (BIQSection) obj;
                try {
                    Method getter = race.getClass().getMethod("getUniqueCivilizationCounter");
                    Object v = getter.invoke(race);
                    if (v instanceof Number) {
                        invokeIntMethod(race, "setUniqueCivilizationCounter", ((Number) v).intValue() - 1);
                    }
                } catch (Throwable ignored) {
                    // best effort
                }
            }
        }
        List<?> games = io.getSection(Section.GAME);
        if (games != null && !games.isEmpty() && games.get(0) instanceof BIQSection) {
            BIQSection game = (BIQSection) games.get(0);
            try {
                java.lang.reflect.Field alliances = game.getClass().getField("civPartOfWhichAlliance");
                Object data = alliances.get(game);
                if (data instanceof List) {
                    List<?> list = (List<?>) data;
                    int removeAt = index - 1;
                    if (removeAt >= 0 && removeAt < list.size()) list.remove(removeAt);
                }
            } catch (Throwable ignored) {
                // best effort
            }
            try {
                Method getPlayable = game.getClass().getMethod("getNumberOfPlayableCivs");
                Object v = getPlayable.invoke(game);
                if (v instanceof Number) {
                    invokeIntMethod(game, "setNumberOfPlayableCivs", Math.max(0, ((Number) v).intValue() - 1));
                }
            } catch (Throwable ignored) {
                // best effort
            }
            try {
                java.lang.reflect.Field dataLength = game.getClass().getField("dataLength");
                Object v = dataLength.get(game);
                if (v instanceof Number) {
                    int next = ((Number) v).intValue() - (4 * civCountBeforeDelete) - 4;
                    dataLength.set(game, Integer.valueOf(next));
                }
            } catch (Throwable ignored) {
                // best effort
            }
        }
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
        List<String[]> setOps = new ArrayList<>();
        for (String line : lines) {
            if (line == null || line.trim().isEmpty()) continue;
            String[] parts = line.split("\t", -1);
            if (parts.length < 1) {
                skipped++;
                continue;
            }
            String op = parts[0].trim().toUpperCase();
            if (op.equals("SET")) {
                if (parts.length < 5) {
                    skipped++;
                    continue;
                }
                setOps.add(parts);
                continue;
            }
            if (op.equals("ADD")) {
                if (parts.length < 3) {
                    skipped++;
                    continue;
                }
                String sectionCode = parts[1].trim();
                String newRef = parts[2].trim();
                String copyFromRef = parts.length >= 4 ? parts[3].trim() : "";
                Section section;
                try {
                    section = Section.valueOf(sectionCode);
                } catch (Throwable t) {
                    skipped++;
                    warnings.append("unknown section ").append(sectionCode).append("; ");
                    continue;
                }
                if (addRecord(io, section, newRef, copyFromRef, warnings)) {
                    applied++;
                } else {
                    skipped++;
                }
                continue;
            }
            if (op.equals("COPY")) {
                if (parts.length < 4) {
                    skipped++;
                    continue;
                }
                String sectionCode = parts[1].trim();
                String fromRef = parts[2].trim();
                String newRef = parts[3].trim();
                Section section;
                try {
                    section = Section.valueOf(sectionCode);
                } catch (Throwable t) {
                    skipped++;
                    warnings.append("unknown section ").append(sectionCode).append("; ");
                    continue;
                }
                if (addRecord(io, section, newRef, fromRef, warnings)) {
                    applied++;
                } else {
                    skipped++;
                }
                continue;
            }
            if (op.equals("DELETE")) {
                if (parts.length < 3) {
                    skipped++;
                    continue;
                }
                String sectionCode = parts[1].trim();
                String recordRef = parts[2].trim();
                Section section;
                try {
                    section = Section.valueOf(sectionCode);
                } catch (Throwable t) {
                    skipped++;
                    warnings.append("unknown section ").append(sectionCode).append("; ");
                    continue;
                }
                if (deleteRecord(io, section, recordRef, warnings)) {
                    applied++;
                    warnings.append("deleted ").append(recordRef).append(" in ").append(sectionCode).append("; ");
                } else {
                    skipped++;
                }
                continue;
            }
            // Backward compatibility with legacy 4-column set line.
            if (parts.length == 4) {
                setOps.add(new String[] { "SET", parts[0], parts[1], parts[2], parts[3] });
                continue;
            }
            skipped++;
        }

        for (String[] parts : setOps) {
            String sectionCode = parts[1].trim();
            String recordRef = parts[2].trim();
            String fieldKey = parts[3].trim();
            String rawValue = new String(Base64.getDecoder().decode(parts[4].trim()), StandardCharsets.UTF_8);
            Section section;
            try {
                section = Section.valueOf(sectionCode);
            } catch (Throwable t) {
                skipped++;
                warnings.append("unknown section ").append(sectionCode).append("; ");
                continue;
            }
            List<?> records = io.getSection(section);
            BIQSection rec = findRecordByRef(records, recordRef);
            if (rec == null) {
                skipped++;
                warnings.append("missing record ").append(recordRef).append(" in ").append(sectionCode).append("; ");
                continue;
            }
            String setterName = toSetterName(fieldKey);
            if (setterName.isEmpty()) {
                skipped++;
                continue;
            }
            Method setter = findSetter(rec.getClass(), setterName);
            if (setter == null) {
                setter = findSetterByCanonicalFieldKey(rec.getClass(), fieldKey);
            }
            if (setter == null) {
                skipped++;
                warnings.append("no setter for field ").append(fieldKey).append(" in ").append(recordRef).append("; ");
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
