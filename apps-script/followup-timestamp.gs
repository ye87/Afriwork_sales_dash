/**
 * Stamps the day a follow-up call was made.
 *
 * When someone sets "Follow-up Status" to Done or no answer on the Sales_call_log tab,
 * this fills "Follow-up done on" on the same row with today's date (only if it is empty,
 * so an existing date is never overwritten). The dashboard then counts the follow-up on
 * that day instead of the planned "Next Follow-up Date".
 *
 * Setup (once):
 *   1. In the sheet, add a column header "Follow-up done on" (any free column, e.g. X).
 *   2. Extensions → Apps Script, paste this file, click Save.
 * It runs automatically for everyone who edits the sheet. No other setup needed.
 */
const TAB = "Sales_call_log";
const STATUS_HEADER = "follow-up status";
const DONE_ON_HEADER = "follow-up done on";
const CALLED = ["done", "no answer"];

function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== TAB) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map((h) => String(h).trim().toLowerCase());
  const statusCol = headers.indexOf(STATUS_HEADER) + 1;
  const doneCol = headers.indexOf(DONE_ON_HEADER) + 1;
  if (!statusCol || !doneCol) return;

  const firstRow = Math.max(e.range.getRow(), 2);
  const lastRow = e.range.getLastRow();
  const editedStatus = statusCol >= e.range.getColumn() && statusCol <= e.range.getLastColumn();
  if (!editedStatus || lastRow < firstRow) return;

  // Works for single edits and for pasting into several rows at once.
  const n = lastRow - firstRow + 1;
  const statuses = sheet.getRange(firstRow, statusCol, n, 1).getValues();
  const doneCells = sheet.getRange(firstRow, doneCol, n, 1);
  const done = doneCells.getValues();
  let changed = false;
  for (let i = 0; i < n; i++) {
    const status = String(statuses[i][0]).trim().toLowerCase();
    if (CALLED.includes(status) && !done[i][0]) { done[i][0] = new Date(); changed = true; }
  }
  if (changed) doneCells.setValues(done).setNumberFormat("dd-mmm-yyyy");
}
