# PoGO Tools

Open-source browser-based tools for Pokémon GO management.

## Privacy

**All processing happens locally in your browser.** Your data never leaves your device. No uploads, no tracking, no servers involved in data processing.

## Available Tools

### CSV to JSON Converter
Convert Poke Genie CSV exports to JSON format for use with other tools and scripts. Features:
- Automatic type detection (numbers, booleans, nulls)
- Preserves dates and special formats as strings
- Clean JSON output with metadata
- Download or copy to clipboard

## How to Use

Visit the hosted site (link TBD) and select a tool. All tools work entirely in your browser.

## Development

### Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pogo-tools.git
   cd pogo-tools
   ```

2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Then visit http://localhost:8000
   ```

No build step required - it's all static HTML and JavaScript.

### Project Structure

```
/
├── index.html                      # Homepage
├── README.md                       # This file
├── LICENSE                         # MIT license
├── SPEC.md                         # Project specification
├── .gitignore                      # Git ignore file
├── samples/
│   └── sample.csv                  # Test CSV file
└── tools/
    └── csv-to-json/
        ├── index.html              # Converter tool UI
        ├── app.js                  # Converter logic
        └── vendor/
            └── papaparse.min.js    # CSV parsing library
```

## Deploying to Cloudflare Pages

1. **Push to GitHub**: Create a new repository and push this code
   ```bash
   gh repo create pogo-tools --public --source=. --push
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
   - Click "Connect to Git" and authorize GitHub access
   - Select the `pogo-tools` repository

3. **Configure build settings**:
   - Framework preset: None
   - Build command: (leave blank)
   - Build output directory: `/`

4. **Deploy**: Click "Save and Deploy"

The site will auto-deploy on every push to the main branch.

## Contributing

Pull requests welcome! Please keep things simple:
- No frameworks or build tools
- Vanilla HTML, CSS, and JavaScript only
- Functional over pretty
- Privacy-first (all processing stays in the browser)

## License

MIT License - see [LICENSE](LICENSE) for details.
