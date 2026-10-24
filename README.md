# PlanCraft AI — Smart Event & Celebration Planner

PlanCraft AI is a GenAI-powered event planning workspace for weddings, birthdays, and community celebrations. It brings event details, budget tracking, scheduling, vendor coordination, and AI-generated inspiration together in one responsive dashboard.

## What it does

- **Event overview:** View the event concept, guest count, location, schedule highlights, and budget at a glance.
- **Create an event plan:** Generate a structured event plan from event details such as type, date, location, guest count, target budget, theme, and special requests.
- **Budget & expenses:** Track planned and actual costs, payment status, and budget totals.
- **Timeline & run of show:** Organize planning milestones and the event-day schedule.
- **Vendors & checklist:** Keep vendor details, statuses, questions, and follow-up tasks organized.
- **AI Idea Lab:** Brainstorm tailored ideas for food and drinks, decor, entertainment, saving costs, and contingency planning.
- **AI vendor guidance:** Generate vendor interview questions, contract red flags, and negotiation tips.
- **Export and share:** Print or save an event dossier as PDF, download the budget as CSV, or copy a Markdown summary.
- **Local persistence:** Events and the selected event are saved in the browser using local storage.

## Tech stack

- React 19 and TypeScript
- Vite 8 for the frontend build and development tooling
- Express for the application server and AI API routes
- Google GenAI SDK (`@google/genai`) for Gemini-powered planning, ideation, and vendor guidance
- Tailwind CSS 4 and `@tailwindcss/vite`
- Lucide React icons
- Node.js (`node:test` for unit & API integration tests) and dotenv for runtime configuration

## How the AI works

The frontend calls server-side endpoints; the Gemini API key is not intended to be exposed in browser code.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Returns service health status, security headers, and whether live AI is configured. |
| `POST /api/ai/generate-event` | Builds a complete event plan with theme, budget line items, timeline, vendor recommendations, and personalized ideas. |
| `POST /api/ai/brainstorm-ideas` | Generates ideas based on the event type, style, guest count, budget, and prompt. |
| `POST /api/ai/vendor-advice` | Produces vendor-vetting questions, potential red flags, and negotiation guidance. |

Fallback responses are implemented for AI flows so the app can still return a starter plan or guidance when model requests fail or the API key is unavailable. AI-generated suggestions should be reviewed and adjusted to fit real vendor pricing, venue policies, and event requirements.

## Requirements

- Node.js compatible with the project dependencies (Node.js 20.19+ or 22.12+ is recommended for modern Vite releases)
- npm
- A Google Gemini API key for live AI generation (optional; fallback responses are included)

## Run locally

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/rudraism19/Promptwar-Challenge-5.git
   cd Promptwar-Challenge-5
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables. Copy the example file and add your key:

   **macOS / Linux**
   ```bash
   cp .env.example .env
   ```

   **Windows PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

   In `.env`, set `GEMINI_API_KEY` to your Google Gemini API key. Do not commit your real `.env` file or publish the key. `APP_URL` is used by the application where applicable; set it to the URL where the app is hosted if needed.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

The `dev` script runs the Express server with Vite middleware. The default server port is `3000`; it can be overridden with the `PORT` environment variable.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express + Vite development server. |
| `npm run build` | Build the frontend for production into `dist/`. |
| `npm run preview` | Preview the Vite production build. |
| `npm start` | Start the server using Node.js. Set `NODE_ENV=production` to serve the built app from `dist/`. |
| `npm test` | Run the Node.js test runner for the project's tests. |
| `npm run lint` | Run TypeScript type checking with `tsc --noEmit`. |

For a production server start, build first:

```bash
npm run build
```

Then set `NODE_ENV=production` and start the server. On Windows PowerShell:

```powershell
$env:NODE_ENV = "production"
npm start
```

## Project structure

```text
.
├── server.ts                 # Express server and GenAI API endpoints
├── index.html                # HTML entry point and metadata
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite, React, and Tailwind configuration
├── src/
│   ├── App.tsx               # Main dashboard, tabs, and event state
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── EventOverview.tsx
│   │   ├── BudgetTracker.tsx
│   │   ├── TimelineView.tsx
│   │   ├── VendorChecklist.tsx
│   │   ├── AIIdeaLab.tsx
│   │   ├── CreateEventModal.tsx
│   │   ├── VendorAdviceModal.tsx
│   │   ├── ExportModal.tsx
│   │   └── DemoVideoModal.tsx
│   ├── data/                 # Seed event examples (Wedding, Birthday, Community)
│   ├── server/api.test.ts    # Express API & security header integration tests
│   ├── services/             # Frontend API client & unit tests (api.ts, api.test.ts)
│   ├── types.ts              # Shared TypeScript types
│   └── utils/                # Pure calculations, formatters, validators & unit tests
├── public/                   # Public assets and demo video
└── .env.example              # Environment variable template
```

## Demo

The repository includes a demo video at [`public/demo-video.mp4`](public/demo-video.mp4). Run the app locally to explore the interactive dashboard and planning flows.

## Security and data

- Keep `GEMINI_API_KEY` on the server and out of frontend code, screenshots, commits, and public logs.
- Event data currently persists in the browser's local storage; it is not a shared, account-based database.
- Avoid putting sensitive personal information into event descriptions or prompts.
- Confirm AI-generated estimates and recommendations before making purchases or signing vendor contracts.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Open a pull request with a clear description of the change.

## License

No license file is currently included in the repository. Unless a license is added, reuse and redistribution are not automatically granted.
