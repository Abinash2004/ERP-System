function normalize(v) {
  return v ? v.toString().trim().toUpperCase() : "";
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeWriteRow(sheet, rowIndex, dataObj, map) {
  for (const key in dataObj) {
    const colIndex = map[key];
    if (colIndex && dataObj[key] !== undefined) {
      sheet.getRange(rowIndex, colIndex).setValue(dataObj[key]);
    }
  }
}

function getFirstEmptyRow(sheet, columnRange) {
  const range = sheet.getRange(columnRange);
  const values = range.getValues();
  const startRow = range.getRow();
  for (let i = 0; i < values.length; i++) {
    if (!values[i][0]) return startRow + i;
  }
  return sheet.getLastRow() + 1;
}

function getRowIndexHandler(sheet, input, column) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const data = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (normalize(data[i][0]) === normalize(input)) {
      return i + 2;
    }
  }
  return -1;
}

function isDuplicateEntry(sheet, input, column) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const data = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === input) return true;
  }
  return false;
}

function getAdvancerRowIndexHandler(sheet, input) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const statusIndex = ADVANCE["STATUS"] - 2; 
  const numCols = ADVANCE["STATUS"] - 1;

  const data = sheet.getRange(2, 2, lastRow - 1, numCols).getValues();
  for (let i = 0; i < data.length; i++) {
    if (normalize(data[i][0]) === normalize(input)) {
      return i + 2;
    }
  }
  return -1;
}

function isDuplicateAdvancerEntry(sheet, input) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  
  const statusIndex = ADVANCE["STATUS"] - 2; 

  const numCols = ADVANCE["STATUS"] - 1; 
  const data = sheet.getRange(2, 2, lastRow - 1, numCols).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (
      String(data[i][0]).trim().toUpperCase() == input && 
      String(data[i][statusIndex]).trim().toUpperCase() == "RECEIVED"
    ) return true;
  }
  return false;
}

function normalizeFollowUpStatus(value) {
  const status = normalize(value);
  if (status === "OPEN" || status === "OPENED") return "OPENED";
  if (status === "CLOSE" || status === "CLOSED") return "CLOSED";
  if (status === "PURCHASED") return "PURCHASED";
  return status;
}