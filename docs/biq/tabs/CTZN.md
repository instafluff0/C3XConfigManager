# CTZN Tab

## Source
- `../Quint_Editor/Shared/Civ3_Editor/src/main/java/com/civfanatics/civ3/xplatformeditor/CTZNTab.java`

## Backing BIQ Sections
- `CTZN`

## Data Dependencies
- `TECH`

## Quint Layout Contract
Quint uses a citizen list on the left and a compact form on the right.

### Top-Level Fields
- `Plural Name`: text field
- `Civilopedia Entry`: text field
- `Default Citizen`: checkbox
- `Prerequisite`: technology dropdown

### Panel
- `Bonuses`
  - Numeric/text fields for:
    - `Entertainment`
    - `Science`
    - `Taxes`
    - `Corruption`
    - `Construction`

## Notes
- The CTZN tab is one of the simplest tabs in Quint: a few identity fields plus one titled numeric-bonus panel.
