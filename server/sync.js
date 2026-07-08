function syncSheet() {
  try {
    const records = fetchAllRecordsFromSupabase();

    if (records === null) {
      Logger.log("syncSheet: aborted because Supabase fetch failed");
      return { status: 0, message: "sync failed" };
    }

    syncMainFollowUpSheet(records);

    return { status: 1, message: "sync completed" };
  } catch (err) {
    Logger.log("syncSheet: %s", err && err.stack ? err.stack : err);
    return { status: 0, message: err.message || "sync failed" };
  }
}

function syncMainFollowUpSheet(records) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getSyncSheetByName(ss, SYNC_FOLLOW_UP_SHEET_NAME);
  if (!sheet) {
    Logger.log("syncMainFollowUpSheet: sheet not found");
    return;
  }

  ensureHeader(sheet, FOLLOW_UP_COLUMNS);
  clearSheetData(sheet);

  const values = buildSheetValues(records, FOLLOW_UP_SCHEMA);
  writeSheetData(sheet, values);
}

function fetchAllRecordsFromSupabase() {
  const endpoint =
    "/rest/v1/follow_up" +
    "?select=*" +
    "&order=serial_number.asc";

  const response = supabaseRequest("GET", endpoint);

  if (!Array.isArray(response)) {
    Logger.log(
      "fetchAllRecordsFromSupabase: %s",
      response && response.message ? response.message : "unexpected response"
    );
    return null;
  }

  return response;
}

function clearSheetData(sheet) {
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return;
  }

  sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
}

function writeSheetData(sheet, values) {
  if (!values.length) {
    return;
  }

  const rows = values.length;
  const cols = values[0].length;
  sheet.getRange(2, 1, rows, cols).setValues(values);
}

function getSyncSheetByName(spreadsheet, sheetName) {
  const namedSheet = spreadsheet.getSheetByName(sheetName);
  if (namedSheet) {
    return namedSheet;
  }

  const firstSheet = spreadsheet.getSheets()[0] || null;
  if (firstSheet) {
    Logger.log("getSyncSheetByName: using first sheet because '%s' was not found", sheetName);
  }
  return firstSheet;
}

function ensureHeader(sheet, columns) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    return;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, Math.max(lastColumn, columns.length)).getValues()[0];
  const normalizedExisting = existingHeaders.map(normalizeHeaderKey);
  const normalizedExpected = columns.map(normalizeHeaderKey);

  const matches = normalizedExpected.every((col, index) => normalizedExisting[index] === col);
  if (!matches) {
    sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
  }
}

function buildSheetValues(records, schema) {
  if (!schema.length) {
    return [];
  }

  return records.map(record => schema.map(column => formatSheetCellValue(record[column.key], column.key)));
}

function normalizeHeaderKey(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatSheetCellValue(value, fieldKey) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, TIMEZONE, "dd / MM / yyyy");
  }

  if (isFollowUpDateField(fieldKey)) {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      return Utilities.formatDate(parsedDate, TIMEZONE, "dd / MM / yyyy");
    }
  }

  return String(value);
}

function isFollowUpDateField(fieldKey) {
  return fieldKey === "visit_date" ||
    fieldKey === "first_feedback_date" ||
    fieldKey === "last_feedback_date";
}

const FOLLOW_UP_SCHEMA = [
  { key: "serial_number", header: "SERIAL NUMBER" },
  { key: "visit_date", header: "VISIT DATE" },
  { key: "location", header: "LOCATION" },
  { key: "customer_name", header: "CUSTOMER NAME" },
  { key: "mobile_number", header: "MOBILE NUMBER" },
  { key: "address", header: "ADDRESS" },
  { key: "vehicle_details", header: "VEHICLE DETAILS" },
  { key: "status", header: "STATUS" },
  { key: "first_feedback", header: "FIRST FEEDBACK" },
  { key: "first_feedback_date", header: "FIRST FEEDBACK DATE" },
  { key: "last_feedback", header: "LAST FEEDBACK" },
  { key: "last_feedback_date", header: "LAST FEEDBACK DATE" }
];

const FOLLOW_UP_COLUMNS = FOLLOW_UP_SCHEMA.map(column => column.header);
