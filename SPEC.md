# Claude Code Prompt: PoGO Tools - CSV to JSON Converter

## What This Is

This prompt instructs Claude Code to build a simple, open-source, static web tool that converts Pokémon Genie CSV exports into JSON. It's the first tool in what will become a suite of Pokémon GO management tools.

---

## Instructions for Claude Code

You are Claude Code running in my terminal. Build the following project from scratch in the current directory.

### Project Overview

Create a static web tool suite for Pokémon GO players. The first tool converts Poke Genie CSV exports to JSON. The site should be:

- **Static only** - no backend, no build step
- **Vanilla HTML + JS** - no frameworks
- **Functional over pretty** - minimal styling, just make it work
- **Privacy-first** - all processing happens in the browser, nothing uploaded
- **Open-source friendly** - MIT license, community-focused
- **Hostable on Cloudflare Pages** - direct from GitHub

### Folder Structure

Create this exact structure:
```
/
├── index.html                      # Homepage listing available tools
├── README.md                       # Project documentation
├── LICENSE                         # MIT license
├── SPEC.md                         # This spec document (copy this entire prompt)
├── .gitignore                      # Git ignore file
├── samples/
│   └── sample.csv                  # Minimal test CSV file
└── tools/
    └── csv-to-json/
        ├── index.html              # The converter tool
        ├── app.js                  # Converter logic (separate file)
        └── vendor/
            └── papaparse.min.js    # CSV parsing library (vendored locally)
```

### File Requirements

#### `/index.html` (Homepage)

Simple landing page with:
- Title: "PoGO Tools" (placeholder name, will change later)
- Brief description: "Open-source tools for Pokémon GO management"
- List of tools with links (just CSV to JSON for now)
- Footer note: "All tools run locally in your browser. Your data never leaves your device."

#### `/tools/csv-to-json/index.html` (Converter Tool)

Minimal UI with:
- Back link to homepage
- Title: "CSV to JSON Converter"
- File input (accept `.csv` only)
- Status line showing: "No file loaded" → "Parsing..." → "Loaded N rows"
- Textarea displaying the JSON output (readonly, monospace font)
- Two buttons: "Download JSON" and "Copy to Clipboard"
- After copy, status should briefly show "Copied!"
- Downloaded filename should match the original CSV name but with `.json` extension

#### `/tools/csv-to-json/app.js` (Converter Logic)

Implement these parsing rules:

1. **Use PapaParse** for CSV parsing (loaded from local vendor file)
2. **First row = headers** - use as JSON keys
3. **Trim everything** - header names and cell values
4. **Empty strings → null** - convert `""` to `null`
5. **Booleans** - convert `TRUE`/`FALSE` (case-insensitive) to `true`/`false`
6. **Numbers** - convert plain numeric strings to numbers:
   - Integers: `"42"` → `42`
   - Decimals: `"3.14"` → `3.14`
   - Negative: `"-5"` → `-5`
7. **Leave as strings**:
   - Dates: `"2026-01-10 23:26"`
   - Fractions/IVs: `"15/15/15"`
   - Numbers with commas: `"1,234"`
   - Percentages: `"95.5%"`
   - Empty-ish values that aren't pure empty string
8. **Skip empty rows** - rows where all values are empty after trimming
9. **Output format**:
```json
{
  "meta": {
    "source": "PoGO Tools CSV to JSON Converter",
    "filename": "original_filename.csv",
    "exportedAt": "2026-01-12T15:30:00.000Z",
    "rowCount": 123
  },
  "pokemon": [
    { "column1": "value1", "column2": 42, ... },
    ...
  ]
}
```

#### `/samples/sample.csv` (Test File)

Create a minimal synthetic CSV that tests all parsing rules:
```csv
Index,Name,CP,IV Avg,Shadow/Purified,Lucky,Catch Date,Scan Date,Notes
1,Pikachu,500,82.2,0,FALSE,9/15/2022,2026-01-10 23:26,
2,Charizard,2500,95.6,1,TRUE,10/1/2022,2026-01-10 23:26,Great Pokemon
3,Mewtwo,4000,100.0,0,false,12/25/2022,2026-01-10 23:26,15/15/15
4,Bulbasaur,123,45.5,2,False,1/1/2023,2026-01-10 23:26,Needs candy
```

This tests: integers, decimals, booleans (various cases), dates, empty values, text with special chars.

#### `/vendor/papaparse.min.js`

Download PapaParse from: https://unpkg.com/papaparse@5.4.1/papaparse.min.js

Store it locally in the vendor folder. Do NOT use a CDN link.

#### `/.gitignore`
```
.DS_Store
node_modules/
.env
*.log
```

#### `/LICENSE`

Standard MIT License with year 2025 and no specific author (community project).

#### `/README.md`

Include these sections:

1. **Title**: PoGO Tools
2. **Description**: Open-source browser-based tools for Pokémon GO management
3. **Privacy**: Emphasize all processing is local, no data leaves the browser
4. **Available Tools**: List with brief descriptions
5. **How to Use**: Just visit the hosted site (link TBD)
6. **Development**:
   - Clone the repo
   - Push to GitHub
   - Connect to Cloudflare Pages (instructions below)
7. **Deploying to Cloudflare Pages**:
   - Step 1: Push repo to GitHub
   - Step 2: Go to Cloudflare Dashboard → Pages → Create a project
   - Step 3: Connect your GitHub account and select the repo
   - Step 4: Configure build settings:
     - Framework preset: None
     - Build command: (leave blank)
     - Build output directory: `/`
   - Step 5: Deploy. Auto-deploys on every push to main.
8. **Contributing**: PRs welcome, keep it simple
9. **License**: MIT

#### `/SPEC.md`

Copy this entire prompt into SPEC.md so the repo contains its own specification.

### Code Style

- **Readable over clever** - use clear variable names
- **Light comments** - explain the "why" not the "what"
- **No minification** - keep source readable
- **Consistent formatting** - 2-space indents

### Git Setup

1. Initialize git repo: `git init`
2. Add all files: `git add .`
3. Initial commit: `git commit -m "Initial CSV to JSON converter tool"`

### After Creating Files

1. Print the complete file tree
2. Show the contents of `/samples/sample.csv` and what it should parse to
3. Provide exact commands to:
   - Create a new GitHub repo (via `gh` CLI or manual instructions)
   - Push the code
   - Remind me to connect Cloudflare Pages via dashboard

---

## Future Vision (Do Not Implement Yet)

This is context for future development. The suite will eventually include:

- **IV Analysis**: Identify best Pokemon for PvP leagues
- **Trade Recommendations**: Find lucky trade candidates
- **Evolution Planner**: Optimize candy/stardust spending
- **Team Builder**: Build raid and PvP teams
- **Goal Wizard**: User selects goals (raids, PvP, collection) and gets recommended tool workflow

For now, just build the CSV to JSON converter as described above.

---

## Execute Now

Create all files and folders as specified. Start with the folder structure, then create each file with complete, working code. Do not use placeholders or TODOs - implement everything fully.

Begin.
