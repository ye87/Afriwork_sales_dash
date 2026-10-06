# Afriwork Sales Dashboard

A live dashboard over the **Afriwork Master CRM** Google Sheet, built from three tabs: `Sales_call_log`, `Reactivation` and `LEAD-GEN`.

## Definitions

Three kinds of call count toward an agent's day:

| Call | Tab | Counts when | Counted on |
|---|---|---|---|
| **Sales call** | Sales_call_log | `Date` is filled **and** `Phone Number Called` has 7+ digits | `Date` |
| **Follow-up call** | Sales_call_log | `Follow-up Status` (col T) is **Done** or **no answer** | `Follow-up done on` if that column exists, otherwise the planned `Next Follow-up Date` (col R) |
| **Reactivation call** | Reactivation | `Date called` **and** `Status` are filled | `Date called` |

LEAD-GEN rows count when they have a `Contact date` and a phone number.

- **Daily target**: 20 calls per agent per day, all kinds combined.
- **Overdue follow-up**: `Next Follow-up Date` has passed and `Follow-up Status` is blank or Pending (and the deal isn't closed).
- **Complete**: a counted row that also has a call summary.
- **Empty row**: only a date (and maybe an agent) is filled in. Flagged, never counted.
- A lead gets **one** follow-up. A second follow-up would overwrite the first.

### Recording the real follow-up day

Column R is the *planned* day. To count a follow-up on the day it was actually made, and to show how late it was:

1. Add a column with the header **Follow-up done on** to Sales_call_log.
2. Paste `apps-script/followup-timestamp.gs` into **Extensions → Apps Script** and save.

From then on, setting `Follow-up Status` to Done / no answer stamps today's date in that column automatically. Older rows keep using the planned date.

These live at the top of the `<script>` in `index.html` (`DAILY_TARGET`, `FOLLOWUP_CALLED`, `MIN_SUMMARY`, `AGENT_ALIASES`, `VALUE_FIXES`) if you want to change them.

## What it shows

- KPI tiles: total calls, then sales / follow-up / reactivation calls separately; agent-days at target, rows not counted, overdue follow-ups, % complete, decision maker reach, won revenue, data warnings
- **Calls per agent per day** grid (green = target met, amber = under), with "+N not counted" under each cell. Switch between all calls or one kind; hover a cell for the split.
- Agent summary: average per active day, days at target, completeness %, overdue follow-ups
- Overdue follow-ups (follow-up date passed, Follow-up Status not "Done"), and interested leads with no follow-up date
- **Warnings and unfilled info**: each check lists the exact sheet row numbers to fix. It covers empty rows, missing or invalid phone numbers, missing dates, unreadable dates, missing summaries or outcomes, no agent, revenue that doesn't match the stage, and more.
- Successful calls per day by tab, sales call outcomes, and the full entry log with a Complete / No summary / Not counted status

Filter by date range and by agent. The data refreshes every 5 minutes.

### Workarounds for hand-typed data

- Outcomes and responses are cleaned up: "NO answer", "no answer " and "No Answer" all become "No answer", and common typos are fixed.
- Agent names are trimmed and capitalised. Nicknames can be merged via `AGENT_ALIASES`.
- Dates are read in all the formats the team uses: `09-24-2026`, `26-Sep-2026`, `9/24/2026`, `Sep 27`, `Sep27`, `September 9`.
- Rows with no readable date can't go on a day, so they are always shown in the warnings, whatever the date filter.

## How it works

```
Browser ──► /api/sheet?tab=… (Vercel function) ──► Google Sheets CSV export
```

- `index.html` is a static page (Chart.js from CDN), so there is no build step.
- `api/sheet.js` downloads a tab as CSV and returns JSON. **Email columns are dropped and phone numbers are replaced by `valid` / `invalid`**, so no contact details reach the browser. Vercel caches it for 60 seconds.
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

- A call only counts when it has **a date and the phone number called**. Don't pre-fill dates on empty rows.
- Dates are read as `MM-DD-YYYY` (e.g. `09-24-2026`) or `26-Sep-2026`. Both formats already used in the sheet work.
- Use real numbers in *Won revenue* / *Estimated deal value* (e.g. `9890`, not `9.9k`).
