# PoGO Pal

A lightweight web app for Pokémon GO battle prep, collection management, and trade decisions.

**Live site:** https://pogo-pal.pages.dev

---

## What It Does

- **Versus** — Select opponent type(s) and get recommendations for which move types to use, which Pokémon types to bring, and which of your Pokémon are good picks
- **Collection** — (Coming soon) Organize and filter your Pokémon collection
- **Trade** — (Coming soon) Help decide what to trade or transfer
- **CSV Upload** — Optionally upload a Poke Genie CSV export to get personalized recommendations from your actual roster
- **No account needed** — Just open the site and start using it

---

## Project Status

**Prototype.** I'm building this in public as an indie project. The Versus tab is functional; Collection and Trade are placeholders for now.

---

## Local Development

**Prerequisites:**
- Python 3 (for local server)
- A modern browser

**Run locally:**

```bash
git clone https://github.com/david-steinbroner/pogo-pal.git
cd pogo-pal/app
python -m http.server 8000
# Open http://localhost:8000
```

No build step. It's all vanilla HTML, CSS, and ES modules.

---

## Data & Privacy

**All processing happens in your browser.** Your CSV data never leaves your device — no uploads, no server-side processing, no tracking. The app works entirely client-side.

---

## Roadmap

Pulled from the project manifest:

- [ ] Current Raid Bosses — quick-select UI for active raids
- [ ] Regional filter for budget counters
- [ ] Individual Pokémon Analysis — search/browse any Pokémon, see offensive/defensive profile
- [ ] Collection tab — full implementation
- [ ] Trade tab — full implementation

---

## Contributing

Issues and PRs welcome.

- Keep changes small and focused
- No frameworks — vanilla JS only
- Privacy-first (all processing stays client-side)
- Check CLAUDE.md for project context and current focus

---

## License

MIT License — see [LICENSE](LICENSE) for details.

© 2026 Skunk Den

---

*PoGO Pal is a fan-made project. Not affiliated with or endorsed by Niantic, Nintendo, The Pokémon Company, or any related entities.*
