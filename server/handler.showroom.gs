// FETCH VALUES HANDLER
function getOpeningBalance(data) {
  if (!data || !data.branch) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("DAILY TRANSACTION");

  if (!sheet) {
    return { status: 0, message: "DAILY TRANSACTION sheet not found" };
  }

  const nextRow = getFirstEmptyRow(sheet, "A2:A");
  const lastRow = nextRow - 1;

  if (lastRow < 2) {
    return { status: 1, message: "success", openingBalance: 0 };
  }

  const locationCol = DAILY_TRANSACTION["LOCATION"];
  const closingCol = DAILY_TRANSACTION["CLOSING BALANCE"];

  const locations = sheet.getRange(2, locationCol, lastRow - 1, 1).getValues();
  const closingBalances = sheet.getRange(2, closingCol, lastRow - 1, 1).getValues();

  const targetBranch = normalize(data.branch);

  for (let i = locations.length - 1; i >= 0; i--) {
    if (normalize(locations[i][0]) === targetBranch) {
      return {
        status: 1,
        message: "success",
        openingBalance: closingBalances[i][0] || 0
      };
    }
  }

  return { status: 1, message: "success", openingBalance: 0 };
}

// FROM HANDLERS
function dailyTransactionForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("DAILY TRANSACTION");

  if (!sheet) {
    return { status: 0, message: "DAILY TRANSACTION sheet not found" };
  }

  const nextRow = getFirstEmptyRow(sheet, "A2:A");
  const payload = {
    "SERIAL NUMBER": nextRow - 1,
    "DATE": formatDate(),
    "LOCATION": normalize(data.location),
    "OPENING BALANCE": normalize(data.openingBalance) || 0,
    "CASH IN": normalize(data.cashIn) || 0,
    "CASH OUT": normalize(data.cashOut) || 0,
    "CASH LEISURE": normalize(data.cashLeisure),
    "REMARK": normalize(data.remark)
  };

  const requiredFields = [
    payload["SERIAL NUMBER"],
    payload["DATE"],
    payload["LOCATION"],
    payload["CASH LEISURE"],
    payload["REMARK"]
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  if (payload["CASH IN"] === 0 && payload["CASH OUT"] === 0) {
    return { status: 0, message: "both cash in and cash out cannot be zero" };
  }

  safeWriteRow(sheet, nextRow, payload, DAILY_TRANSACTION);
  return { status: 1, message: "daily transaction added successfully" };
}

function newWalkInForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("FOLLOW UP");

  if (!sheet) {
    return { status: 0, message: "FOLLOW UP sheet not found" };
  }

  const nextRow = getFirstEmptyRow(sheet, "A2:A");
  const payload = {
    "SERIAL NUMBER": nextRow - 1,
    "VISIT DATE": formatDate(),
    "LOCATION": normalize(data.location),
    "CUSTOMER NAME": normalize(data.customerName),
    "MOBILE NUMBER": normalize(data.mobileNumber),
    "ALTERNATE MOBILE NUMBER": normalize(data.alternateMobileNumber),
    "ADDRESS": normalize(data.address),
    "VEHICLE DETAILS": normalize(data.vehicleDetails),
    "STATUS": "OPENED"
  };

  const requiredFields = [
    payload["SERIAL NUMBER"],
    payload["VISIT DATE"],
    payload["LOCATION"],
    payload["CUSTOMER NAME"],
    payload["MOBILE NUMBER"]
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  safeWriteRow(sheet, nextRow, payload, FOLLOW_UP);
  return { status: 1, message: "new walk in data added successfully" };
}

function getFollowUpList(data) {
  if (!data || !data.branch || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("FOLLOW UP");

  if (!sheet) {
    return { status: 0, message: "FOLLOW UP sheet not found" };
  }

  const nextRow = getFirstEmptyRow(sheet, "A2:A");
  const lastRow = nextRow - 1;

  if (lastRow < 2) {
    return { status: 1, message: "success", data: [] };
  }

  const locationCol = FOLLOW_UP["LOCATION"];
  const statusCol = FOLLOW_UP["STATUS"];
  const targetBranch = normalize(data.branch);
  const targetStatus = normalizeFollowUpStatus(data.status);
  const filterByStatus = targetStatus && targetStatus !== "ALL";

  const locationValues = sheet.getRange(2, locationCol, lastRow - 1, 1).getValues();
  const statusValues = sheet.getRange(2, statusCol, lastRow - 1, 1).getValues();

  const matchingRowIndexes = [];
  for (let i = locationValues.length - 1; i >= 0; i--) {
    const locationMatch = normalize(locationValues[i][0]) === targetBranch;
    const statusMatch = !filterByStatus || normalizeFollowUpStatus(statusValues[i][0]) === targetStatus;
    if (locationMatch && statusMatch) {
      matchingRowIndexes.push(i + 2);
    }
  }

  const start = (data.page - 1) * data.limit;
  const end = start + data.limit;
  const paginatedIndexes = matchingRowIndexes.slice(start, end);

  const resultData = [];
  const lastColumn = Object.keys(FOLLOW_UP).length;

  for (let i = 0; i < paginatedIndexes.length; i++) {
    const rowIndex = paginatedIndexes[i];
    const rowData = sheet.getRange(rowIndex, 1, 1, lastColumn).getValues()[0];
    resultData.push(rowData);
  }

  return {
    status: 1,
    message: "success",
    data: resultData
  };
}

function updateFollowUpForm(data) {
  if (!data || !data.serialNumber) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("FOLLOW UP");

  if (!sheet) {
    return { status: 0, message: "FOLLOW UP sheet not found" };
  }

  const serialCol = FOLLOW_UP["SERIAL NUMBER"];
  const nextRow = getFirstEmptyRow(sheet, "A2:A");
  const lastRow = nextRow - 1;

  if (lastRow < 2) {
    return { status: 0, message: "record not found" };
  }

  const serialValues = sheet.getRange(2, serialCol, lastRow - 1, 1).getValues();
  let rowIndex = -1;
  const targetSerial = parseInt(data.serialNumber, 10);

  for (let i = 0; i < serialValues.length; i++) {
    if (parseInt(serialValues[i][0], 10) === targetSerial) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) {
    return { status: 0, message: "record not found" };
  }

  const existingFirstFeedback = sheet.getRange(rowIndex, FOLLOW_UP["FIRST FEEDBACK"]).getValue();

  const payload = {
    "ALTERNATE MOBILE NUMBER": normalize(data.alternateMobileNumber),
    "ADDRESS": normalize(data.address),
    "VEHICLE DETAILS": normalize(data.vehicleDetails),
    "STATUS": normalizeFollowUpStatus(data.status),
    "REMARKS": normalize(data.remarks)
  };

  if (!existingFirstFeedback) {
    payload["FIRST FEEDBACK"] = normalize(data.firstFeedback);
    payload["FIRST FEEDBACK DATE"] = formatDate();
  } else {
    payload["LAST FEEDBACK"] = normalize(data.lastFeedback);
    payload["LAST FEEDBACK DATE"] = formatDate();
  }

  safeWriteRow(sheet, rowIndex, payload, FOLLOW_UP);
  return { status: 1, message: "follow up updated successfully" };
}
