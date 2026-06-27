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
    "SERIAL NUMBER": nextRow - 1,
    "CHASSIS NUMBER": normalize(data.chassis),
    "ENGINE NUMBER": normalize(data.engine),
    "MODEL": normalize(data.model),
    "COLOR": normalize(data.color),
    "CURRENT COUNTER": normalize(data.counter),
    "KEY NUMBER": normalize(data.key),
    "STOCK STATUS": "STOCK"
  };

  const requiredFields = [
    payload["CHASSIS NUMBER"],
    payload["ENGINE NUMBER"],
    payload["MODEL"],
    payload["COLOR"],
    payload["CURRENT COUNTER"]
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
    "INVOICE DATE": new Date(data.date),
    "PURCHASED INVOICE NUMBER": normalize(data.invoice),
    "GROSS VALUE BEFORE DISCOUNT": normalize(data.gvbd)
  };

  const requiredFields = [
    chassis,
    payload["INVOICE DATE"],
    payload["PURCHASED INVOICE NUMBER"],
    payload["GROSS VALUE BEFORE DISCOUNT"]
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
    "CURRENT COUNTER": normalize(data.counter)
  };

  const requiredFields = [
    chassis,
    payload["CURRENT COUNTER"]
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
    "STOCK STATUS": normalize(data.stockStatus),
    "SALE DATE": new Date(data.saleDate),
    "CUSTOMER NAME": normalize(data.customerName),
    "SALES PERSON": normalize(data.salesPerson)
  };

  if (payload["STOCK STATUS"] === "B2C") {
    payload["MOBILE NUMBER"] = normalize(data.mobileNumber);
    payload["CASH / FINANCE"] = normalize(data.cashOrFinance);
    payload["FINANCER"] = normalize(data.financer);
  }

  const requiredFields = [
    chassis,
    payload["SALE COUNTER"],
    payload["STOCK STATUS"],
    payload["SALE DATE"],
    payload["CUSTOMER NAME"],
    payload["SALES PERSON"]
  ];

  if (payload["STOCK STATUS"] === "B2C") {
    requiredFields.push(
      payload["MOBILE NUMBER"],
      payload["CASH / FINANCE"]
    );
    if (payload["CASH / FINANCE"] !== "CASH") {
      requiredFields.push(payload["FINANCER"]);
    }
  }

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  if (payload["STOCK STATUS"] === "B2C") {
    payload["ALTERNATE MOBILE NUMBER"] = normalize(data.alternate_mobile_number);
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
    "PRICE TAG NUMBER": normalize(data.priceTagNumber),
    "TOTAL DP": normalize(data.totalDp),
    "RECEIVED DP": normalize(data.receivedDp),
    "ANY EXCHANGE": normalize(data.anyExchange),
    "ESTIMATED DISBURSEMENT": normalize(data.estimatedDisbursement),
    "CUSTOMER ON-ROAD PRICE": normalize(data.customerOnRoadPrice)
  };

  if (anyAdvance === "YES") {
    payload["ADVANCER NAME"] = normalize(data.advancerName);
    payload["ADVANCE AMOUNT"] = normalize(data.advanceAmount);
  }

  if (payload["ANY EXCHANGE"] === "YES") {
    payload["EXCHANGE MODEL"] = normalize(data.exchangeModel);
    payload["EXCHANGE REGISTER NUMBER"] = normalize(data.exchangeRegisterNumber);
    payload["CUSTOMER EXCHANGE VALUE"] = normalize(data.customerExchangeValue);
    payload["DEALER NAME"] = normalize(data.dealerName);
    payload["DEALER EXCHANGE VALUE"] = normalize(data.dealerExchangeValue);
  }

  const requiredFields = [
    chassis,
    anyAdvance,
    payload["PRICE TAG NUMBER"],
    payload["TOTAL DP"],
    payload["RECEIVED DP"],
    payload["ANY EXCHANGE"],
    payload["CUSTOMER ON-ROAD PRICE"]
  ];

  if (anyAdvance === "YES") {
    requiredFields.push(
      payload["ADVANCER NAME"],
      payload["ADVANCE AMOUNT"]
    );
  }

  if (payload["ANY EXCHANGE"] === "YES") {
    requiredFields.push(
      payload["EXCHANGE MODEL"],
      payload["EXCHANGE REGISTER NUMBER"],
      payload["CUSTOMER EXCHANGE VALUE"],
      payload["DEALER NAME"],
      payload["DEALER EXCHANGE VALUE"]
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
  const payload = {
    "REGISTRATION NUMBER": normalize(data.registrationNumber)
  };

  const requiredFields = [
    chassis,
    payload["REGISTRATION NUMBER"]
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
  return { status: 1, message: "registration number added successfully" };
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
      field: "KEY NUMBER",
      key: "keyNumber",
      map: MAIN
    },
    2: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "ALTERNATE MOBILE NUMBER",
      key: "alternateMobileNumber",
      map: MAIN
    },
    3: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "ESTIMATED DISBURSEMENT",
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
      field: "DISBURSEMENT TRANSACTION CODE",
      key: "disbursementTransactionCode",
      map: MAIN
    },
    7: {
      sheet: "MAIN",
      searchCol: MAIN["CHASSIS NUMBER"],
      field: "EXCHANGE TRANSACTION CODE",
      key: "exchangeTransactionCode",
      map: MAIN
    },
    8: {
      sheet: "DAILY TRANSACTION",
      searchCol: DAILY_TRANSACTION["SERIAL NUMBER"],
      field: "VERIFICATION CHASSIS NUMBER",
      key: "verificationChassisNumber",
      map: DAILY_TRANSACTION
    }
  };

  const config = configs[data.code];
  if (!config) return { status: 0, message: "invalid code" };

  const sheet = ss.getSheetByName(config.sheet);
  if (!sheet) return { status: 0, message: config.sheet + " not found" };

  const recordKey = normalize(config.sheet === "ADVANCE" ? data.advancerName : config.sheet === "DAILY TRANSACTION" ? data.serialNumber : data.chassis);
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