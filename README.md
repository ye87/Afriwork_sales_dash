# Afriwork Sales Dashboard

A live dashboard over the **Afriwork Master CRM** Google Sheet, built from three tabs: `Sales_call_log`, `Reactivation` and `LEAD-GEN`.

It shows:
- Daily calls per tab (stacked bar)
- KPIs: calls, decision-maker reach rate, interested leads, won revenue, pipeline, follow-ups due
- Agent leaderboard
- Sales call outcomes and reactivation responses
- Follow-ups that are due or overdue
- Latest entries

You can filter by date range (Today / Yesterday / 7 days / 30 days / This month / custom) and by agent. The data refreshes every 5 minutes.

## How it works

```
Browser ──► /api/sheet?tab=… (Vercel function) ──► Google Sheets CSV export
```

- `index.html` is a static page (Chart.js from CDN), so there is no build step.
- `api/sheet.js` downloads a tab as CSV, **drops every phone and email column**, and returns JSON. Vercel caches it for 60 seconds.
- The sheet has to stay shared as **"Anyone with the link → Viewer"**.

## Deploy on Vercel (free)

1. Go to https://vercel.com and sign up with GitHub.
2. Click **Add New → Project**, then import `ye87/Afriwork_sales_dash`.
3. Leave every setting at its default (Framework: *Other*, no build command) and click **Deploy**.
4. You get a URL like `https://afriwork-sales-dash.vercel.app`. Every push to the repo redeploys it.

### Optional environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Purpose |
|---|---|
| `DASHBOARD_PASSWORD` | When set, the page asks for this password before it shows any data. Recommended, because the dashboard URL is public. |
| `SHEET_ID` | Use a different spreadsheet. |

## Run locally

```
npm i -g vercel
vercel dev
```

## Notes for the sales team

- **Always fill the date column** (`Date` in Sales_call_log, `Date called` in Reactivation, `Contact date` in LEAD-GEN). Rows without a date can't be placed on a day. The dashboard shows a warning with the count of such rows.
- Dates are read as `MM-DD-YYYY` (e.g. `09-24-2026`) or `26-Sep-2026`. Both formats already used in the sheet work.
- Use real numbers in *Won revenue* / *Estimated deal value* (e.g. `9890`, not `9.9k`).
