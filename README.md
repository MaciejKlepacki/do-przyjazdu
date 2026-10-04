![Do przyjazdu. Pomoc jest w drodze. Historia zostaje.](docs/assets/readme-banner.png)

# Do przyjazdu

A HackYeah 2026 prototype for the time between calling for help and a responder arriving. A witness follows dispatcher-approved instructions, records observations and hands over the incident history.

## Features

- Witness access through a private link, without creating an account.
- Versioned instructions, dispatcher approval and witness responses.
- Cached instructions and a local queue for interrupted connections. Device time and server receipt time remain separate.
- Dispatcher review, incident timeline and responder handover, available without a language model.
- A guided demo with the witness and dispatcher side by side, a simulated connection interruption and a new fictional incident for each attempt.

## Run locally

Use Node.js 24 and npm. Install dependencies:

```bash
npm ci
```

Create the local configuration:

```bash
cp .env.example .env
```

Set your own `DISPATCHER_PASSWORD` and `SESSION_SECRET` in `.env`. Start the built application and API together:

```bash
npm run demo
```

Open `http://localhost:5174`. Sign in as `dyspozytor` or `ratownik` with `DISPATCHER_PASSWORD`. The demo uses its own `data/presentation.sqlite`, disables the optional model and keeps SMS simulated. Every new attempt preserves previous incident history. If the port is occupied:

```bash
npm run demo -- --port 5175
```

For development, `npm run dev` starts the API on port 3000 and Vite on 5173. Run `npm run db:migrate` and `npm run db:seed` first. Offline reopening requires a production build and a secure origin: localhost works on the same computer, while a separate phone requires HTTPS. A plain LAN address does not provide the full PWA offline behavior.

Checks: `npm run typecheck`, `npm test`, `npm run build`. No lint command is configured.

Presentation materials:

- [Hackathon submission: texts, cover, deck and recording script](docs/zgloszenie/ZGLOSZENIE.md).
- [Live demo walkthrough](docs/scenariusz-demo.md).
- [Narrated demo video script, about 2:30](docs/scenariusz-filmu-demo.md).
- [Full project guide](docs/przewodnik-projektu.md).
- [Scope and decisions](DO_PRZYJAZDU.md).

## Data and credits

All demo incidents are fictional. Scenario content in `apps/api/src/scenario/demoScenario.ts` is provisional and must be reviewed by the team's physician. This prototype does not call emergency services or integrate with TOPR. SMS delivery is not implemented in the local demo.

Built with React, Vite, Express and SQLite. Icons use Lucide; the interface uses the bundled Inter font. The brand symbol is in `apps/web/public/brand-symbol.svg`, and the repository banner is in `docs/assets/readme-banner.svg`. PWA icons can be regenerated with `node scripts/generate-icons.mjs`.
