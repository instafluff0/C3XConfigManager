Here is a connected, scenario-maker’s walkthrough for **Civ III / Conquests** based on CivFanatics tutorials, with the parts tied together so you can see how a new unit, tech, resource, or civilization goes from “idea” to “working in-game content.” ([CivFanatics Forums][1])

## 1) Start with the scenario folder structure

The recurring CivFanatics advice is: **save your `.biq` in the Scenarios folder, then create a scenario folder with the same name**. Inside that folder, you usually create at least `Art` and `Text`, and then add subfolders as needed for the content you are adding. For units, tutorials add `Art\Units` and `Art\Civilopedia\Icons\Units`; for techs, `Art\tech chooser\Icons`; for civilizations, `Art\Advisors`, `Art\Flics`, and `Art\leaderheads`. Text-side, you copy the base game files you need into your scenario’s `Text` folder instead of editing the originals. ([CivFanatics Forums][1])

A very practical rule from these tutorials is: **treat the `.biq` as the rules database, `Art` as the graphics database, and `Text` as the Civilopedia / lookup database**. In other words, you do not just add something in the editor; you also give the game the graphics and text entries it expects, or it will show blanks or error out. ([CivFanatics Forums][1])

## 2) The core pattern for adding anything

For nearly everything in Civ III scenario work, the CivFanatics pattern is:

1. **Add or edit the object in the `.biq` editor** and give it the right internal label or Civilopedia entry.
2. **Create or copy the art files** into the correct scenario subfolder.
3. **Edit `Civilopedia.txt`** so the entry has text and links.
4. **Edit `PediaIcons.txt`** so the game knows where the icons/animations live.
5. For techs, also **edit `script.txt`** and often the science advisor screen graphics.
6. For civilizations, optionally **edit `diplomacy.txt`** if you want custom leader dialogue. ([CivFanatics Forums][1])

That is the big “connection” to keep in mind: **the editor creates the rules entry, but `PediaIcons.txt` and the art folders make it visible, and `Civilopedia.txt` makes it documented.** ([CivFanatics Forums][1])

---

# Units

## 3) How to add a unit

The CivFanatics unit tutorials set the process up like this:

### Step A: Prepare the unit folders

Create `Art\Units`, then create a folder for the specific unit. One tutorial’s example is a `Flamer` folder. Into that folder, place the unit’s “guts” — usually copied from an existing working unit or from a downloaded custom unit. The simplified tutorial explicitly says you can copy the files of an existing unit into the new folder if you are not building from scratch. ([CivFanatics Forums][1])

### Step B: Add the unit’s Civilopedia icon assets

Create `Art\Civilopedia\Icons\Units`, then place the unit’s large and small Civilopedia icons there. The tutorials also emphasize copying `unit_32.pcx` into your scenario’s `Art\Units` folder, because that file controls the build-list / unit icon display in-game. ([CivFanatics Forums][1])

### Step C: Copy text files into your scenario

Copy `Civilopedia.txt` and `PediaIcons.txt` from the game into your scenario’s `Text` folder. Then add the unit entry to `Civilopedia.txt` under the unit section. CivFanatics posters also discuss using templates like `#PRTO_...` and `#DESC_PRTO_...` to speed up a lot of unit-entry creation. ([CivFanatics Forums][1])

### Step D: Point `PediaIcons.txt` at the graphics

The simplified unit tutorial says to add the unit’s icon entry and then go to the **Unit Animation** section in `PediaIcons.txt` and add the `ANIMNAME_PRTO` name. It stresses that this animation name **must match the configuration file / unit folder naming you are using**. That is the crucial link between the editor’s unit entry and the actual animation files. ([CivFanatics Forums][1])

### Step E: Add the unit in the editor

Then add the unit in the `.biq`, assign stats/flags/costs/requirements, and make sure the unit is available to the right civs only. When you later add civilizations, CivFanatics notes that new civs may inherit unit availability, so you must review unit availability again. ([CivFanatics Forums][2])

## 4) How to create unit graphics

The tutorials and forum advice split this into two common cases:

### Case 1: Reuse or adapt an existing unit

This is the most beginner-friendly route. Copy a working unit folder from the base game or another scenario/download, rename it consistently, and point the new unit’s `ANIMNAME_PRTO` entry to that configuration name. This is the easiest way to get a functioning unit into a scenario fast. ([CivFanatics Forums][1])

### Case 2: Make or edit animation yourself

CivFanatics’ unit-creation discussions explain that the normal workflow is to use **Flicster** to turn a unit `.flc` into a storyboard, edit the storyboard, then convert it back to a `.flc`. Another thread says the storyboard must preserve the special Civ-color palette handling, because bad palette/index handling can make the unit show as “static” or otherwise display incorrectly. ([CivFanatics Forums][3])

So the practical graphics rule is: **for units, folder naming + animation naming + palette correctness matter as much as the art itself.** ([CivFanatics Forums][1])

---

# Technologies

## 5) How to add a technology in the editor

The CivFanatics tech tutorial’s order is very direct:

1. Open the `.biq`.
2. Enable **Custom Rules**.
3. Edit **Civilization Advances**.
4. Create the tech and give it a Civilopedia entry like `TECH_Architecture`.
5. Set era, prerequisites, cost, and flags. ([CivFanatics Forums][4])

One tutorial also warns you to note the tech’s **position in the advance list**, because the science-advisor hover text in `script.txt` depends on **tech order**, not just the Civilopedia label. ([CivFanatics Forums][4])

## 6) Tech icon graphics and file placement

For techs, the tutorial says to create `Art\tech chooser\Icons`, then save your large and small tech icons there. It notes that the exact filename does not matter as long as your naming is consistent and your text entries point to the right files. ([CivFanatics Forums][4])

Then in `PediaIcons.txt` you add the small `TECH_...` icon entry and the large `TECH_[name]_Large` entry. In `Civilopedia.txt`, you add the tech entry itself, and the tutorial notes that while `TECH_` is not always required in the same way, the `DESC_TECH_...` convention matters for the proper description entry. ([CivFanatics Forums][4])

## 7) Tech tree placement and management

This is where scenario design starts becoming interconnected rather than just “data entry.”

### Coordinates

If you add a tech but do not give it screen coordinates, the game may place it awkwardly. One tutorial shows exactly this, then says to go back into the Advances editor and set the **X** and **Y** coordinates, with X being horizontal position and Y vertical. ([CivFanatics Forums][4])

### Science advisor hover text

To make the advisor say something when you hover over the tech, copy `script.txt` into your scenario `Text` folder and edit the `SCIENCEADVICETECH` entries. The tutorial says these must match the `.biq` tech list **exactly and in the same order**. That is one of the easiest places to break a custom tech tree if you are not careful. ([CivFanatics Forums][4])

### Screen graphics and arrows

If you want a fully custom visual tech tree, a CivFanatics tutorial uses GIMP layers to add arrows to the science screen graphics. It says to work with files in `Art\Advisors`, using names such as `science_ancient.pcx`, `science_middle.pcx`, `science_industrial_new.pcx`, and `science_modern.pcx`. The tutorial’s method is to copy a blank science image, build arrows on a transparent layer, merge them, and export the finished `.pcx`. ([CivFanatics Forums][5])

So for tech trees, think in three linked layers:

* rules in `.biq`
* icon references in `PediaIcons.txt` / `Civilopedia.txt`
* screen layout and advisor behavior in `script.txt` and `Art\Advisors` graphics. ([CivFanatics Forums][4])

---

# Resources

## 8) How to add resource graphics

The resource tutorial starts by copying `resources.pcx` and `resources_shadows.pcx` into the scenario `Art` folder. It says you can erase unused icons, draw into empty squares, and even add rows as needed. It also explains the shadow file: white pixels are light shadows, green pixels are dark shadows, and shadows are optional. ([CivFanatics Forums][6])

For luxury resources specifically, it also has you copy and edit `luxuryicons_small.pcx`, which is used in the city-screen luxury box. The tutorial warns that luxuries in that file must appear in the **same order as the main resource icon set**. ([CivFanatics Forums][6])

For Civilopedia resource icons, create `Art\Civilopedia\Icons\Resources` and save the icon files there. The tutorial recommends keeping background colors consistent by category:

* strategic = red background
* luxury = yellow background
* bonus = blue background. ([CivFanatics Forums][6])

## 9) How to add resources in the editor

The resource tutorial then says:

1. Open `.biq`
2. Enable **Custom Rules**
3. Edit **Natural Resources**
4. Create the resource with label `GOOD_[name]`
5. Set icon, bonuses, prerequisite tech, appearance ratio, disappearance probability, and placement. ([CivFanatics Forums][6])

It also includes an important map-design warning: by default, because roads cannot be built on water, you should **not assign strategic or luxury resources to coast/sea/ocean** unless you are doing special workaround design. ([CivFanatics Forums][6])

A key balancing point from CivFanatics: an **appearance ratio of 1** means only one tile of that resource will appear on the whole map at a time. ([CivFanatics Forums][6])

## 10) Resource Civilopedia and cross-linking

This is where resources connect to the rest of the scenario.

The tutorial has you add entries in `Civilopedia.txt` for **strategic**, **luxury**, and **bonus** resources separately, then update the **GCON Natural Resources**, **GCON Bonus Resources**, **GCON Luxury Resources**, and **GCON Strategic Resources** sections so the encyclopedia lists and summary pages remain correct. ([CivFanatics Forums][6])

Then it explicitly says to update:

* **tech entries for revealed resources**, and
* **improvement/unit entries for required resources**. ([CivFanatics Forums][6])

That is one of the most useful “scenario thinking” lessons in the tutorial: **a resource is not finished when it appears on the map. It also needs to be documented wherever it is revealed, required, or consumed.** ([CivFanatics Forums][6])

Finally, in `PediaIcons.txt`, add the `ICON_GOOD_[resource]` image pair, with the **large icon first and the small icon second**. ([CivFanatics Forums][6])

---

# Civilizations, leaders, and descriptions

## 11) Civ graphics: advisors, diplomacy heads, and leaderhead art

The civilization tutorial breaks civ art into several different pieces:

* `Art\Advisors` for the `[leader]_all` image
* `Art\Flics` for the leaderhead diplomacy animations
* `Art\leaderheads` for victory images. ([CivFanatics Forums][2])

The editor then lets you assign era-specific diplomacy animations for Ancient, Middle, Industrial, and Modern eras. The tutorial notes that if the leaderhead stays visually the same across eras, you can reuse the same art files. ([CivFanatics Forums][2])

That means a civ leader in Civ III is not a single graphic; it is a **set** of graphics used in different places. ([CivFanatics Forums][2])

## 12) Adding the civilization in the editor

The civ tutorial’s editor sequence is:

1. Open `.biq`
2. Enable **Custom Rules**
3. Edit **Civilizations**
4. Change diplomacy text indexes for existing civs if needed
5. Create or replace a civilization and set **names, label `RACE_[name]`, culture, and index**
6. Add traits, free techs, colors, AI behavior
7. Add city names, military leaders, and scientific leaders
8. Assign era animations
9. Review which units are available to the civ. ([CivFanatics Forums][2])

The tutorial specifically recommends **replacing** a civ rather than adding blindly when modifying the vanilla setup, partly to preserve unit availability logic. ([CivFanatics Forums][2])

## 13) Civilopedia and PediaIcons entries for civilizations

On the text side, copy `Civilopedia.txt`, `PediaIcons.txt`, and optionally `diplomacy.txt` into your scenario `Text` folder. Then add the civilization entry to `Civilopedia.txt`. After that, in `PediaIcons.txt`, add the `RACE_[Civ]` entry for the victory-neutral and advisor images. The tutorial notes that the advisor images show on the Foreign Advisor page. ([CivFanatics Forums][2])

So the civ’s editor label `RACE_[name]` is not just bookkeeping. It is the bridge between the civilization rules entry and the art/text references. ([CivFanatics Forums][2])

## 14) Diplomacy text and diplomacy index

If you want custom diplomatic language, CivFanatics says to edit `diplomacy.txt`. The important technical rule is that the **diplomacy index is zero-based**. Another tutorial explains that an index value selects which civ-specific dialogue lines are used, and that with `-1` or careless reshuffling you can cause civs to speak the wrong dialogue. ([CivFanatics Forums][7])

This is why the civ tutorial has a specific step for **changing diplomacy text index for existing civs** before replacing or adding civs. It is trying to stop accidental dialogue drift in the scenario. ([CivFanatics Forums][2])

---

# How it all connects in a real scenario workflow

## 15) The best order to build a scenario

Based on how these tutorials fit together, the strongest order is:

### First: build the skeleton

Create the `.biq`, scenario folder, `Art`, and `Text`. Copy in the base text files you know you will edit. ([CivFanatics Forums][1])

### Second: build the rules web in the editor

Add your **tech tree**, then resources, then units, then civilizations. That order is practical because:

* techs reveal resources and unlock units,
* resources gate units/buildings,
* civs need final tech/unit availability review. ([CivFanatics Forums][4])

### Third: add the graphics in matching folder trees

* Units → `Art\Units`, `Art\Civilopedia\Icons\Units`, `unit_32.pcx`
* Techs → `Art\tech chooser\Icons`, maybe `Art\Advisors`
* Resources → `resources.pcx`, `resources_shadows.pcx`, `luxuryicons_small.pcx`, `Art\Civilopedia\Icons\Resources`
* Civs → `Art\Advisors`, `Art\Flics`, `Art\leaderheads` ([CivFanatics Forums][1])

### Fourth: wire up the text

* `Civilopedia.txt` for descriptions and encyclopedia structure
* `PediaIcons.txt` for icon and animation lookup
* `script.txt` for tech hover text
* `diplomacy.txt` for civ-specific dialogue. ([CivFanatics Forums][1])

### Fifth: do the cross-links

This is the part that separates a “working object” from a clean scenario:

* add revealed resources to the relevant tech entries
* add required resources to unit/improvement entries
* review unit availability after adding/replacing civs
* review `script.txt` order after changing the tech list
* review diplomacy index after changing civ order. ([CivFanatics Forums][6])

---

# A compact checklist by object type

## 16) Units

* Add in editor
* Put animations/config in `Art\Units\[UnitName]`
* Put Civilopedia icons in `Art\Civilopedia\Icons\Units`
* Copy/update `unit_32.pcx`
* Add unit text to `Civilopedia.txt`
* Add icon + `ANIMNAME_PRTO` entries to `PediaIcons.txt`. ([CivFanatics Forums][1])

## 17) Technologies

* Add in editor with `TECH_...` Civilopedia entry
* Set era, prereqs, cost, flags
* Put large/small icons in `Art\tech chooser\Icons`
* Add tech text to `Civilopedia.txt`
* Add small/large tech icon entries to `PediaIcons.txt`
* Update `script.txt`
* Set X/Y coordinates
* Optionally edit advisor screen arrows in `Art\Advisors`. ([CivFanatics Forums][4])

## 18) Resources

* Edit `resources.pcx` / `resources_shadows.pcx`
* Edit `luxuryicons_small.pcx` for luxuries
* Put Civilopedia resource icons in `Art\Civilopedia\Icons\Resources`
* Add resource in editor as `GOOD_[name]`
* Set appearance/disappearance/prereq/bonuses
* Add entries to `Civilopedia.txt`
* Update GCON resource sections
* Update related tech/unit/improvement entries
* Add `ICON_GOOD_[resource]` entries to `PediaIcons.txt`. ([CivFanatics Forums][6])

## 19) Civilizations

* Create leader/advisor/victory art in `Art\Advisors`, `Art\Flics`, `Art\leaderheads`
* Add/replace civ in editor
* Set `RACE_[name]`, culture, traits, colors, AI, leaders, city names
* Assign era leader animations
* Review unit availability
* Add civ entry to `Civilopedia.txt`
* Add `RACE_[Civ]` art references in `PediaIcons.txt`
* Edit `diplomacy.txt` and diplomacy index if you want custom dialogue. ([CivFanatics Forums][2])

The strongest mental model is: **every scenario object in Civ III has three lives — rules, art, and text — and you must finish all three for the object to feel complete.** ([CivFanatics Forums][1])

I can also turn this into a one-page “modder’s master checklist” organized by folder and file.

[1]: https://forums.civfanatics.com/threads/how-to-add-a-unit-to-sid-meiers-civilization-iii-conquests-v01-simplified.667235/ "[TUTORIAL] - How to Add a Unit to Sid Meier's Civilization III Conquests v01 (Simplified) | CivFanatics Forums"
[2]: https://forums.civfanatics.com/threads/how-to-add-a-civilization-to-sid-meiers-civilization-iii-conquests-part-1-adding-the-civ-v01.667242/ "[TUTORIAL] - How to Add a Civilization to Sid Meier's Civilization III Conquests Part 1: Adding the Civ v01 | CivFanatics Forums"
[3]: https://forums.civfanatics.com/threads/3d-unit-tutorial.25254/?utm_source=chatgpt.com "3D Unit tutorial"
[4]: https://forums.civfanatics.com/threads/how-to-add-new-advancement-tech-to-sid-meiers-civilization-iii-conquests-v01.667241/ "[TUTORIAL] - How to Add New Advancement/Tech to Sid Meier's Civilization III Conquests v01 | CivFanatics Forums"
[5]: https://forums.civfanatics.com/threads/tech-tree-and-script-txt-tutorial.499663/ "Tech Tree and Script.txt Tutorial | CivFanatics Forums"
[6]: https://forums.civfanatics.com/threads/how-to-add-natural-resources-to-sid-meiers-civilization-iii-conquests-v01.667246/ "[TUTORIAL] - How to Add Natural Resources to Sid Meier's Civilization III Conquests v01 | CivFanatics Forums"
[7]: https://forums.civfanatics.com/threads/diplomacy-txt-tutorial.499667/ "Diplomacy.txt Tutorial | CivFanatics Forums"

Below is a **compact one-page “Civ III Scenario Modder’s Master Checklist”** organized by **folder → file → action**. It’s designed to match the workflow recommended in many CivFanatics tutorials and help you quickly verify that every part of a new feature (rules, art, and text) is correctly connected.

---

# Civilization III Scenario Modder’s Master Checklist

## 1. Scenario Root Setup

Create your scenario in:

```
Civilization III\Conquests\Scenarios\[ScenarioName]
```

Inside the scenario folder create:

```
[ScenarioName]
 ├─ Art
 ├─ Text
 └─ [ScenarioName].biq
```

Copy these base files into `Text` so you can edit them without affecting the base game:

```
Civilopedia.txt
PediaIcons.txt
script.txt
diplomacy.txt (optional but recommended)
```

---

# 2. Rules Database (BIQ Editor)

Open the `.biq` in the **Civ3Conquests Editor** and enable:

```
Scenario → Custom Rules
```

All scenario objects are created here first.

| Object        | Editor Section        | Important Fields              |
| ------------- | --------------------- | ----------------------------- |
| Units         | Units                 | Stats, tech prereq, resources |
| Technologies  | Civilization Advances | Era, prereqs, cost            |
| Resources     | Natural Resources     | Appearance ratio, tech reveal |
| Civilizations | Civilizations         | Traits, leader, color         |

After creating an object, **record the Civilopedia key** because it links to text and graphics.

Examples:

```
PRTO_MyUnit
TECH_MyTech
GOOD_MyResource
RACE_MyCiv
```

---

# 3. Text System (Text Folder)

## Civilopedia.txt

Purpose: **descriptions and encyclopedia entries**

Add entries for every new object.

Examples:

```
#PRTO_MyUnit
[text description]

#DESC_PRTO_MyUnit
[long unit description]

#TECH_MyTech
[text description]

#GOOD_MyResource
[text description]

#RACE_MyCiv
[text description]
```

Also update category lists:

```
GCON Strategic Resources
GCON Luxury Resources
GCON Bonus Resources
GCON Natural Resources
```

Update cross-references:

* techs revealing resources
* units requiring resources
* improvements requiring resources

---

## PediaIcons.txt

Purpose: **links Civilopedia keys to graphics and animations**

Add icon entries for every new object.

### Units

```
#ICON_PRTO_MyUnit
art\civilopedia\icons\units\myunitlarge.pcx
art\civilopedia\icons\units\myunitsmall.pcx
```

Animation link:

```
#ANIMNAME_PRTO_MyUnit
MyUnit
```

---

### Technologies

```
#ICON_TECH_MyTech
art\tech chooser\icons\mytechsmall.pcx
art\tech chooser\icons\mytechlarge.pcx
```

---

### Resources

```
#ICON_GOOD_MyResource
art\civilopedia\icons\resources\myresource_large.pcx
art\civilopedia\icons\resources\myresource_small.pcx
```

---

### Civilizations

```
#RACE_MyCiv
art\advisors\myciv_all.pcx
art\advisors\myciv_all.pcx
```

---

## script.txt

Purpose: **science advisor hover text**

Add entries in the **same order as techs appear in the BIQ**.

Example:

```
SCIENCEADVICETECH
"MyTech"
```

---

## diplomacy.txt

Purpose: **leader dialogue**

Check diplomacy index values in the editor.

Remember:

* indexes start at **0**
* changing civ order can break dialogue mapping.

---

# 4. Graphics System (Art Folder)

## Units

```
Art
 ├─ Units
 │   └─ MyUnit
 │       ├─ MyUnit.ini
 │       ├─ Attack.flc
 │       ├─ Run.flc
 │       └─ etc
```

Also copy/edit:

```
Art\Units\unit_32.pcx
```

Add your unit icon to the grid.

Civilopedia icons:

```
Art\Civilopedia\Icons\Units
  myunitlarge.pcx
  myunitsmall.pcx
```

---

## Technologies

Icons:

```
Art\tech chooser\Icons
   mytechlarge.pcx
   mytechsmall.pcx
```

Optional tech tree graphics:

```
Art\Advisors
   science_ancient.pcx
   science_middle.pcx
   science_industrial_new.pcx
   science_modern.pcx
```

Edit these to draw new tech arrows.

---

## Resources

Main map icons:

```
Art\resources.pcx
Art\resources_shadows.pcx
```

Luxury display icons:

```
Art\luxuryicons_small.pcx
```

Civilopedia icons:

```
Art\Civilopedia\Icons\Resources
   myresource_large.pcx
   myresource_small.pcx
```

---

## Civilizations

Leader graphics:

```
Art
 ├─ Advisors
 │   myciv_all.pcx
 │
 ├─ Flics
 │   myleader_ancient.flc
 │   myleader_middle.flc
 │   myleader_industrial.flc
 │   myleader_modern.flc
 │
 └─ leaderheads
     myleader_victory.pcx
```

---

# 5. Tech Tree Layout

Inside the editor:

```
Civilization Advances → MyTech
```

Set:

```
X position
Y position
```

These control the tech’s position on the science screen.

Then update:

```
script.txt
science advisor graphics
```

if arrows change.

---

# 6. Resource Balancing Checklist

For each resource verify:

* appearance ratio
* disappearance probability
* allowed terrain
* required tech
* improvement bonuses
* AI trade value

Important rule:

```
appearance ratio = 1
→ only one instance on entire map
```

---

# 7. Civilization Setup Checklist

Inside **Civilizations tab** confirm:

* civ name + adjective
* label (`RACE_`)
* traits
* culture group
* AI aggression
* colors
* city name list
* leader name
* military/scientific leaders
* era leader animations

Then review:

```
Units tab → check which civs can build which units
```

Adding a civ can accidentally give it **all units by default**.

---

# 8. Final Scenario Integrity Check

Before launching the scenario verify:

### Editor

* Custom Rules enabled
* all objects have Civilopedia keys
* tech coordinates set

### Text

* Civilopedia entries exist
* PediaIcons links exist
* script.txt tech order correct

### Graphics

* all referenced files exist
* correct folder paths
* PCX palette preserved

### Gameplay

* resources appear
* tech tree works
* civ diplomacy text correct
* units animate properly

---

✅ **The golden rule of Civ III modding**

Every object must exist in **three places simultaneously**:

```
1. Rules → BIQ editor
2. Art → Art folder graphics
3. Text → Civilopedia + PediaIcons
```

If any of those three are missing, the game will show **missing icons, blank Civilopedia pages, or crashes**.

---

If you'd like, I can also make a **visual “scenario architecture diagram”** that shows exactly how **Units, Techs, Resources, and Civs interlink inside a Civ III scenario**, which is extremely helpful when designing large mods.
