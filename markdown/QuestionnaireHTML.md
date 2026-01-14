# PDF Template – FTS Client Questionnaire (Jinja2 + Playwright)

This file is the **HTML template** used to generate the final **A4 PDF questionnaire**.  
It is rendered using **Jinja2** (injecting data values) and converted to PDF using **Playwright**.

---

## What this file does (in simple terms)

1. Defines **print/PDF-safe CSS** (A4 page size, margins, page-break rules)
2. Uses **Jinja2 macros** to safely display values and format dates
3. Lays out the questionnaire into sections:
   - Personal details (compact grid)
   - Drug Use (table)
   - Drug Exposure (table)
   - Medication (grid)
   - Alcohol (grid)
   - Hair & Influencing Factors (conditional blocks)
   - Signatures (signature images + refusal block)
4. Optionally renders logos at top and bottom

---

## How data gets into this template

At the top:

```jinja2
{% set d = data %}
The template expects a data object that contains all questionnaire fields.
So all questionnaire fields are marked with d and are pulled through to the template

These are small helper functions used to keep the HTML clean.
show(v)
Safely prints a value:
-Booleans become Yes/No
-None or empty becomes —
-Otherwise prints the trimmed string
Used everywhere to prevent blank ugly output.

uk_date(iso)
Converts an ISO date (YYYY-MM-DD) to UK format (DD/MM/YYYY).
If empty or None, shows —.

show_date(date_str, unsure_flag)
Used for fields where the user can tick “Unsure”.
If unsure = true → shows Unsure
Otherwise formats the date via uk_date()
-This is used in Drug Use / Exposure and other date fields.


join_list(v)
Used for fields that might be a list (multi-select fields).
If list → joins with commas
If empty list → —
If not a list → falls back to show()
Used for things like:
-Alcohol weekly options
-Drug exposure "type_of_exposure"

The remainder is styling and organisation of the template outlining the rules for how things will look.