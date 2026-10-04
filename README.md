![Do przyjazdu. Pomoc jest w drodze. Historia zostaje.](.github/readme-banner.png)

# Do przyjazdu

A HackYeah 2026 prototype for the time between calling for help and a responder arriving. A witness follows dispatcher-approved instructions, records observations and hands over the incident history.

## Features

- Witness access through a private link, without creating an account.
- Versioned instructions, dispatcher approval and witness responses.
- Cached instructions and a local queue for interrupted connections. Device time and server receipt time remain separate.
- Dispatcher review, incident timeline and responder handover, available without a language model.
- A guided demo with the witness and dispatcher side by side, a simulated connection interruption and a new fictional incident for each attempt.

## Run locally

You need Node.js 22.13 or newer (24 recommended) and npm. From the repository folder:

```bash
npm ci
npm run demo
```

The first command installs dependencies. The second builds the app and starts it, which takes about 30 seconds. Then:

1. Open `http://localhost:5174`.
2. Click **Otwórz demo**, choose **Dyspozytor (demo)** and sign in with the password `hackyeah` (also printed in the terminal).
3. Click **Rozpocznij pokaz**. The witness phone is on the left, the dispatcher panel on the right. The page guides you through each step.

Stop the server with `Ctrl+C`. If port 5174 is busy, run `npm run demo -- --port 5175`.

The demo uses its own database in `data/presentation.sqlite`, keeps SMS simulated and disables the optional AI summary. The default password only applies on `localhost` when `DISPATCHER_PASSWORD` is not set. To use your own, copy `.env.example` to `.env` and set `DISPATCHER_PASSWORD` and `SESSION_SECRET`.

For development, `npm run dev` starts the API on port 3000 and Vite on 5173 (requires `.env`, `npm run db:migrate` and `npm run db:seed` first). Offline reopening of the witness page requires a production build and a secure origin: localhost works on the same computer, a separate phone requires HTTPS.

Checks: `npm run typecheck`, `npm test`, `npm run build`.

Project scope and decisions: [DO_PRZYJAZDU.md](DO_PRZYJAZDU.md).

## Data and credits

All demo incidents are fictional. Scenario content in `apps/api/src/scenario/demoScenario.ts` is provisional and must be reviewed by the team's physician. This prototype does not call emergency services or integrate with TOPR. SMS delivery is not implemented in the local demo.

Built with React, Vite, Express and SQLite. Icons use Lucide; the interface uses the bundled Inter font. The brand symbol is in `apps/web/public/brand-symbol.svg`, and the repository banner is in `.github/readme-banner.png`. PWA icons can be regenerated with `node scripts/generate-icons.mjs`.
