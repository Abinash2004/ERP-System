// FETCH VALUES HANDLER
function getChassis(chassis) {
  if (!chassis) {
    return { status: 0, message: "invalid chassis number" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const rowIndex = getRowIndexHandler(
    mainSheet,
    chassis,
    MAIN["CHASSIS NUMBER"]
  );

  if (rowIndex === -1) {
    return { status: 0, message: "chassis does not exist" };
  }

  const modelCol = MAIN["MODEL"];
  const colorCol = MAIN["COLOR"];
  const customerCol = MAIN["CUSTOMER NAME"];
  const receivedDPCol = MAIN["RECEIVED DP"];

  const model = mainSheet.getRange(rowIndex, modelCol).getValue();
  const color = mainSheet.getRange(rowIndex, colorCol).getValue();
  const customer = mainSheet.getRange(rowIndex, customerCol).getValue();
  const receivedDP = mainSheet.getRange(rowIndex, receivedDPCol).getValue();

  return {
    status: 1,
    data: {
      model,
      color,
      customer,
      receivedDP
    }
  };
}

function getAdvance(advancer_name) {
  if (!advancer_name) {
    return { status: 0, message: "invalid advancer name" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const advanceSheet = ss.getSheetByName("ADVANCE");

  if (!advanceSheet) {
    return { status: 0, message: "ADVANCE not found" };
  }

  const rowIndex = getAdvancerRowIndexHandler(
    advanceSheet,
    advancer_name
  );

  if (rowIndex === -1) {
    return { status: 0, message: "advancer does not exist or not active" };
  }

  const amountCol = ADVANCE["AMOUNT"];
  const returnAmountCol = ADVANCE["ADVANCE RETURN"];
  const amount = advanceSheet.getRange(rowIndex, amountCol).getValue();
  const returnAmount = advanceSheet.getRange(rowIndex, returnAmountCol).getValue();

  return {
    status: 1,
    data: { amount, returnAmount }
  };
}

//  FORM HANDLERS
function addStockForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const nextRow = getFirstEmptyRow(mainSheet, "A2:A");
  const payload = {
    "SL NO": nextRow - 1,
    "CHASSIS NUMBER": normalize(data.chassis),
    "ENGINE NUMBER": normalize(data.engine),
    "MODEL": normalize(data.model),
    "COLOR": normalize(data.color),
    "CUR COUNTER": normalize(data.counter),
    "KEY NO": normalize(data.key),
    "ST STATUS": "STOCK"
  };

  const requiredFields = [
    payload["CHASSIS NUMBER"],
    payload["ENGINE NUMBER"],
    payload["MODEL"],
    payload["COLOR"],
    payload["CUR COUNTER"]
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }
  if (isDuplicateEntry(mainSheet, payload["CHASSIS NUMBER"], MAIN["CHASSIS NUMBER"])) {
    return { status: 0, message: "chassis number already exists" };
  }

  safeWriteRow(mainSheet, nextRow, payload, MAIN);
  return { status: 1, message: "stock data added successfully" };
}

function addInvoiceForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const chassis = normalize(data.chassis);
  const rowIndex = getRowIndexHandler(mainSheet, chassis, MAIN["CHASSIS NUMBER"]);

  if (rowIndex === -1) {
    return { status: 0, message: "chassis does not exist" };
  }

  const payload = {
    "INV DATE": new Date(data.date),
    "PURCHASED INV NO": normalize(data.invoice),
    "INV VAL": normalize(data.gvbd),
    "EX SR PRICE": normalize(data.exShowroomPrice),
    "DEALER": normalize(data.dealer)
  };

  const requiredFields = [
    chassis,
    payload["INV DATE"],
    payload["PURCHASED INV NO"],
    payload["INV VAL"],
    payload["EX SR PRICE"],
    payload["DEALER"]
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  safeWriteRow(mainSheet, rowIndex, payload, MAIN);
  return { status: 1, message: "invoice added successfully" };
}

function stockMovementForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const chassis = normalize(data.chassis);
  const payload = {
    "CUR COUNTER": normalize(data.counter)
  };

  const requiredFields = [
    chassis,
    payload["CUR COUNTER"]
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  const rowIndex = getRowIndexHandler(
    mainSheet,
    chassis,
    MAIN["CHASSIS NUMBER"]
  );

  if (rowIndex === -1) {
    return { status: 0, message: "chassis does not exist" };
  }

  safeWriteRow(mainSheet, rowIndex, payload, MAIN);
  return { status: 1, message: "stock moved successfully" };
}

function advanceReceiveForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const advanceSheet = ss.getSheetByName("ADVANCE");

  if (!advanceSheet) {
    return { status: 0, message: "ADVANCE not found" };
  }

  const nextRow = getFirstEmptyRow(advanceSheet, "A2:A");
  const payload = {
    "ADVANCE DATE": new Date(),
    "ADVANCER NAME": normalize(data.advancer_name),
    "MOBILE NUMBER": normalize(data.mobile_number),
    "AMOUNT": normalize(data.amount),
    "COUNTER": normalize(data.counter),
    "RECEIVER NAME": normalize(data.receiver_name),
    "MODEL": normalize(data.model),
    "STATUS": "RECEIVED",
    "ALTERNATE MOBILE NUMBER": normalize(data.alternate_mobile_number),
    "COLOR": normalize(data.color),
    "REMARK": normalize(data.remark)
  };

  const requiredFields = [
    payload["ADVANCER NAME"],
    payload["MOBILE NUMBER"],
    payload["AMOUNT"],
    payload["COUNTER"],
    payload["RECEIVER NAME"],
    payload["MODEL"]
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  if (isDuplicateAdvancerEntry(advanceSheet, payload["ADVANCER NAME"])) {
    return { status: 0, message: "advancer already exists" };
  }

  safeWriteRow(advanceSheet, nextRow, payload, ADVANCE);
  return { status: 1, message: "advance payment added successfully" };
}

function advanceReturnForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const advanceSheet = ss.getSheetByName("ADVANCE");

  if (!advanceSheet) {
    return { status: 0, message: "ADVANCE not found" };
  }

  const payload = {
    "ADVANCER NAME": normalize(data.advancer_name),
    "ADVANCE RETURN": normalize(data.advance_return),
    "RETURN PERSON": normalize(data.return_person),
    "STATUS": "RETURNED"
  };

  const requiredFields = [
    payload["ADVANCER NAME"],
    payload["ADVANCE RETURN"],
    payload["RETURN PERSON"]
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  const rowIndex = getAdvancerRowIndexHandler(
    advanceSheet,
    payload["ADVANCER NAME"]
  );

  if (rowIndex === -1) {
    return { status: 0, message: "advancer does not exist" };
  }

  safeWriteRow(advanceSheet, rowIndex, payload, ADVANCE);
  return { status: 1, message: "advance returned successfully" };
}

function addSaleForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const chassis = normalize(data.chassis);

  const payload = {
    "SALE COUNTER": normalize(data.saleCounter),
    "ST STATUS": normalize(data.stockStatus),
    "SALE DATE": new Date(data.saleDate),
    "CUSTOMER NAME": normalize(data.customerName),
    "SALES PERSON": normalize(data.salesPerson)
  };

  if (payload["ST STATUS"] === "B2C") {
    payload["MOBILE NO"] = normalize(data.mobileNumber);
    payload["CASH / FINANCE"] = normalize(data.cashOrFinance);
    payload["FINANCER"] = normalize(data.financer);
  }

  const requiredFields = [
    chassis,
    payload["SALE COUNTER"],
    payload["ST STATUS"],
    payload["SALE DATE"],
    payload["CUSTOMER NAME"],
    payload["SALES PERSON"]
  ];

  if (payload["ST STATUS"] === "B2C") {
    requiredFields.push(
      payload["MOBILE NO"],
      payload["CASH / FINANCE"]
    );
    if (payload["CASH / FINANCE"] !== "CASH") {
      requiredFields.push(payload["FINANCER"]);
    }
  }

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  if (payload["ST STATUS"] === "B2C") {
    payload["ALT MOBILE NO"] = normalize(data.alternate_mobile_number);
  }

  const rowIndex = getRowIndexHandler(
    mainSheet,
    chassis,
    MAIN["CHASSIS NUMBER"]
  );

  if (rowIndex === -1) {
    return { status: 0, message: "chassis does not exist" };
  }

  safeWriteRow(mainSheet, rowIndex, payload, MAIN);
  return { status: 1, message: "sale added successfully" };
}

function addSaleAccountForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");
  const advanceSheet = ss.getSheetByName("ADVANCE");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  } else if (!advanceSheet) {
    return { status: 0, message: "ADVANCE not found" };
  }

  const chassis = normalize(data.chassis);
  const anyAdvance = normalize(data.anyAdvance);
  const payload = {
    "PRC TAG NO": normalize(data.priceTagNumber),
    "TOTAL DP": normalize(data.totalDp),
    "RECEIVED DP": normalize(data.receivedDp),
    "ANY EXC": normalize(data.anyExchange),
    "EST DIS": normalize(data.estimatedDisbursement),
    "ON-ROAD PRICE": normalize(data.customerOnRoadPrice)
  };

  if (anyAdvance === "YES") {
    payload["ADVANCER NAME"] = normalize(data.advancerName);
    payload["ADV AMT"] = normalize(data.advanceAmount);
  }

  if (payload["ANY EXC"] === "YES") {
    payload["EXCHANGE MODEL"] = normalize(data.exchangeModel);
    payload["EX REG NO"] = normalize(data.exchangeRegisterNumber);
    payload["CUS EX VAL"] = normalize(data.customerExchangeValue);
    payload["DEALER NAME"] = normalize(data.dealerName);
    payload["DEALER EX VAL"] = normalize(data.dealerExchangeValue);
  }

  const requiredFields = [
    chassis,
    anyAdvance,
    payload["PRC TAG NO"],
    payload["TOTAL DP"],
    payload["RECEIVED DP"],
    payload["ANY EXC"],
    payload["ON-ROAD PRICE"]
  ];

  if (anyAdvance === "YES") {
    requiredFields.push(
      payload["ADVANCER NAME"],
      payload["ADV AMT"]
    );
  }

  if (payload["ANY EXC"] === "YES") {
    requiredFields.push(
      payload["EXCHANGE MODEL"],
      payload["EX REG NO"],
      payload["CUS EX VAL"],
      payload["DEALER NAME"],
      payload["DEALER EX VAL"]
    );
  }

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  const rowIndex = getRowIndexHandler(
    mainSheet,
    chassis,
    MAIN["CHASSIS NUMBER"]
  );

  if (rowIndex === -1) {
    return { status: 0, message: "chassis does not exist" };
  }

  safeWriteRow(mainSheet, rowIndex, payload, MAIN);

  if (anyAdvance === "YES") {
    const advanceRowIndex = getAdvancerRowIndexHandler(
      advanceSheet,
      payload["ADVANCER NAME"]
    );

    if (advanceRowIndex === -1) {
      return { status: 0, message: "advancer does not exist" };
    }

    safeWriteRow(
      advanceSheet,
      advanceRowIndex,
      { "STATUS": "PURCHASED" },
      ADVANCE
    );
  }

  return { status: 1, message: "sale account added successfully" };
}

function addRegistrationForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const chassis = normalize(data.chassis);
  const rowIndex = getRowIndexHandler(mainSheet, chassis, MAIN["CHASSIS NUMBER"]);

  if (rowIndex === -1) {
    return { status: 0, message: "chassis does not exist" };
  }

  const existingRtoEntryDate = mainSheet.getRange(rowIndex, MAIN["RTO ENT DT"]).getValue();
  const existingAppNumber = mainSheet.getRange(rowIndex, MAIN["APPLICATION  NO"]).getValue();
  const existingRegNumber = mainSheet.getRange(rowIndex, MAIN["REG NO"]).getValue();

  const payload = {};

  if (!existingRtoEntryDate && data.rtoEntryDate) {
    payload["RTO ENT DT"] = new Date(data.rtoEntryDate);
  }
  if (!existingAppNumber && data.applicationNumber) {
    payload["APPLICATION  NO"] = normalize(data.applicationNumber);
  }
  if (data.rtoStatus) {
    payload["RTO STATUS"] = normalize(data.rtoStatus);
  }
  if (!existingRegNumber && data.registrationNumber) {
    payload["REG NO"] = normalize(data.registrationNumber);
  }

  safeWriteRow(mainSheet, rowIndex, payload, MAIN);
  return { status: 1, message: "RTO details updated successfully" };
}

function getRTODetails(data) {
  if (!data || !data.chassis) {
    return { status: 0, message: "invalid chassis number" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const chassis = normalize(data.chassis);
  const rowIndex = getRowIndexHandler(mainSheet, chassis, MAIN["CHASSIS NUMBER"]);

  if (rowIndex === -1) {
    return { status: 0, message: "chassis does not exist" };
  }

  const customerName = mainSheet.getRange(rowIndex, MAIN["CUSTOMER NAME"]).getValue();
  const rtoEntryDateVal = mainSheet.getRange(rowIndex, MAIN["RTO ENT DT"]).getValue();
  const applicationNumber = mainSheet.getRange(rowIndex, MAIN["APPLICATION  NO"]).getValue();
  const rtoStatus = mainSheet.getRange(rowIndex, MAIN["RTO STATUS"]).getValue();
  const registrationNumber = mainSheet.getRange(rowIndex, MAIN["REG NO"]).getValue();

  let rtoEntryDateStr = "";
  if (rtoEntryDateVal instanceof Date) {
    const year = rtoEntryDateVal.getFullYear();
    const month = String(rtoEntryDateVal.getMonth() + 1).padStart(2, "0");
    const day = String(rtoEntryDateVal.getDate()).padStart(2, "0");
    rtoEntryDateStr = `${year}-${month}-${day}`;
  } else if (rtoEntryDateVal) {
    rtoEntryDateStr = String(rtoEntryDateVal);
  }

  return {
    status: 1,
    data: {
      customerName: customerName ? String(customerName) : "",
      rtoEntryDate: rtoEntryDateStr,
      applicationNumber: applicationNumber ? String(applicationNumber) : "",
      rtoStatus: rtoStatus ? String(rtoStatus) : "",
      registrationNumber: registrationNumber ? String(registrationNumber) : ""
    }
  };
}

function optionalFieldForm(data) {
  if (!data || !data.code) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const configs = {
    1: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "KEY NO",
      key: "keyNumber",
      map: MAIN
    },
    2: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "ALT MOBILE NO",
      key: "alternateMobileNumber",
      map: MAIN
    },
    3: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "EST DIS",
      key: "estimatedDisbursement",
      map: MAIN
    },
    4: {
      sheet: "ADVANCE",
      searchCol: ADVANCE["ADVANCER NAME"],
      field: "ALTERNATE MOBILE NUMBER",
      key: "alternateMobileNumber",
      map: ADVANCE
    }
  };

  const config = configs[data.code];
  if (!config) return { status: 0, message: "invalid code" };

  const sheet = ss.getSheetByName(config.sheet);
  if (!sheet) return { status: 0, message: config.sheet + " not found" };

  const recordKey = normalize(config.sheet === "ADVANCE" ? data.advancerName : data.chassis);
  const fieldValue = normalize(data[config.key]);

  if (!recordKey || !fieldValue) {
    return { status: 0, message: "required fields are missing" };
  }

  const rowIndex = getRowIndexHandler(sheet, recordKey, config.searchCol);

  if (rowIndex === -1) {
    return { status: 0, message: "record does not exist" };
  }

  const payload = {};
  payload[config.field] = fieldValue;

  safeWriteRow(sheet, rowIndex, payload, config.map);
  return { status: 1, message: "optional field updated successfully" };
}

function verifyTransactionForm(data) {
  if (!data || !data.code) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const configs = {
    1: {
      sheet: "ADVANCE",
      searchCol: ADVANCE["ADVANCER NAME"],
      field: "RECEIVED TRANSACTION CODE",
      key: "receivedTransactionCode",
      map: ADVANCE
    },
    2: {
      sheet: "ADVANCE",
      searchCol: ADVANCE["ADVANCER NAME"],
      field: "RETURNED TRANSACTION CODE",
      key: "returnedTransactionCode",
      map: ADVANCE
    },
    3: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "DP TRANSACTION CODE",
      key: "dpTransactionCode",
      map: MAIN
    },
    4: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "INSURANCE TRANSACTION CODE",
      key: "insuranceTransactionCode",
      map: MAIN
    },
    5: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "RTO TRANSACTION CODE",
      key: "rtoTransactionCode",
      map: MAIN
    },
    6: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "DISBURSEMENT TRANSACTION  CODE",
      key: "disbursementTransactionCode",
      map: MAIN
    },
    7: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "EXCHANGE TRANSACTION CODE",
      key: "exchangeTransactionCode",
      map: MAIN
    }
  };

  const config = configs[data.code];
  if (!config) return { status: 0, message: "invalid code" };

  const sheet = ss.getSheetByName(config.sheet);
  if (!sheet) return { status: 0, message: config.sheet + " not found" };

  const recordKey = normalize(config.sheet === "ADVANCE" ? data.advancerName : data.chassis);
  const fieldValue = normalize(data[config.key]);

  if (!recordKey || !fieldValue) {
    return { status: 0, message: "required fields are missing" };
  }

  const rowIndex = getRowIndexHandler(sheet, recordKey, config.searchCol);

  if (rowIndex === -1) {
    return { status: 0, message: "record does not exist" };
  }

  const payload = {};
  payload[config.field] = fieldValue;

  safeWriteRow(sheet, rowIndex, payload, config.map);
  return { status: 1, message: "verified successfully" };
}