function getDropdown(columnIndex) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("COLLECTION");

  if (!sheet) {
    return { status: 0, message: "COLLECTION not found" };
  }

  const col = parseInt(columnIndex, 10);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [] };
  }

  const values = sheet
  .getRange(2, col, lastRow - 1, 1)
  .getValues()
  .flat()
  .filter(Boolean);
  
  const unique = [...new Set(values)];
  return { status: 1, data: unique };
}
