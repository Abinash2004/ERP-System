function getStockList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const lastRow = mainSheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = mainSheet.getRange(2, 1, lastRow - 1, 10).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";
  const targetModel = data.model ? normalize(data.model) : "ALL";

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const stockStatus = normalize(row[MAIN["ST STATUS"] - 1]);
    if (stockStatus !== "STOCK") continue;

    if (targetBranch !== "ALL") {
      const currentCounter = normalize(row[MAIN["CUR COUNTER"] - 1]);
      if (currentCounter !== targetBranch) continue;
    }

    if (targetModel !== "ALL") {
      const modelVal = normalize(row[MAIN["MODEL"] - 1]);
      if (modelVal !== targetModel) continue;
    }

    const invoiceDateVal = row[MAIN["INV DATE"] - 1];
    let invoiceDateStr = "";
    if (invoiceDateVal instanceof Date) {
      invoiceDateStr = invoiceDateVal.toISOString();
    } else if (invoiceDateVal) {
      invoiceDateStr = String(invoiceDateVal);
    }

    filtered.push({
      serialNumber: row[MAIN["SL NO"] - 1],
      invoiceDate: invoiceDateStr,
      purchasedInvoiceNumber: row[MAIN["PURCHASED INV NO"] - 1],
      currentCounter: row[MAIN["CUR COUNTER"] - 1],
      keyNumber: row[MAIN["KEY NO"] - 1],
      engineNumber: row[MAIN["ENGINE NUMBER"] - 1],
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1],
      model: row[MAIN["MODEL"] - 1],
      color: row[MAIN["COLOR"] - 1]
    });
  }

  filtered.sort((a, b) => {
    const modelA = String(a.model || "").toLowerCase();
    const modelB = String(b.model || "").toLowerCase();
    return modelA.localeCompare(modelB);
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getPendingDisbursementList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const lastRow = mainSheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = mainSheet.getRange(2, 1, lastRow - 1, 41).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";
  const targetFinancer = data.financer ? normalize(data.financer) : "ALL";

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    // ST STATUS must be B2C
    const stockStatus = normalize(row[MAIN["ST STATUS"] - 1]);
    if (stockStatus !== "B2C") continue;

    // CASH / FINANCE must not be empty or "CASH"
    const cashFinance = normalize(row[MAIN["CASH / FINANCE"] - 1]);
    if (!cashFinance || cashFinance === "CASH") continue;

    // DIS TNC AMT must be empty
    const disTncAmt = normalize(row[MAIN["DIS TNC AMT"] - 1]);
    if (disTncAmt !== "") continue;

    // Filter by branch
    const saleCounter = normalize(row[MAIN["SALE COUNTER"] - 1]);
    const currentCounter = normalize(row[MAIN["CUR COUNTER"] - 1]);
    const matchBranch = saleCounter ? saleCounter : currentCounter;
    if (targetBranch !== "ALL" && matchBranch !== targetBranch) continue;

    // Filter by financer
    if (targetFinancer !== "ALL") {
      const cashFinanceColVal = normalize(row[MAIN["CASH / FINANCE"] - 1]);
      if (cashFinanceColVal !== targetFinancer && !cashFinanceColVal.includes(targetFinancer) && !targetFinancer.includes(cashFinanceColVal)) {
        continue;
      }
    }

    const saleDateVal = row[MAIN["SALE DATE"] - 1];
    let saleDateStr = "";
    if (saleDateVal instanceof Date) {
      saleDateStr = saleDateVal.toISOString();
    } else if (saleDateVal) {
      saleDateStr = String(saleDateVal);
    }

    filtered.push({
      saleDate: saleDateStr,
      branch: matchBranch,
      customerName: row[MAIN["CUSTOMER NAME"] - 1],
      cashFinance: row[MAIN["CASH / FINANCE"] - 1],
      financerName: row[MAIN["FINANCER"] - 1],
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1],
      model: row[MAIN["MODEL"] - 1]
    });
  }

  filtered.sort((a, b) => {
    const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
    const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
    return dateA - dateB;
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getNewSalesReport(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const lastRow = mainSheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = mainSheet.getRange(2, 1, lastRow - 1, 20).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";
  const targetMonth = data.month ? normalize(data.month) : "ALL";
  const fromDateStr = data.fromDate ? String(data.fromDate) : "";
  const toDateStr = data.toDate ? String(data.toDate) : "";
  const isShowroom = data.isShowroom === true || data.isShowroom === "true";

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  let lastYear = thisYear;
  let lastMonth = thisMonth - 1;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastYear = thisYear - 1;
  }

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    const stockStatus = normalize(row[MAIN["ST STATUS"] - 1]);
    if (stockStatus === "STOCK" || !stockStatus) continue;

    const saleCounter = normalize(row[MAIN["SALE COUNTER"] - 1]);
    const currentCounter = normalize(row[MAIN["CUR COUNTER"] - 1]);
    const matchBranch = saleCounter ? saleCounter : currentCounter;
    if (targetBranch !== "ALL" && matchBranch !== targetBranch) continue;

    const saleDateVal = row[MAIN["SALE DATE"] - 1];
    if (saleDateVal instanceof Date) {
      if (isShowroom) {
        const rYear = saleDateVal.getFullYear();
        const rMonth = saleDateVal.getMonth();

        if (targetMonth === "THIS_MONTH") {
          if (rYear !== thisYear || rMonth !== thisMonth) continue;
        } else if (targetMonth === "LAST_MONTH") {
          if (rYear !== lastYear || rMonth !== lastMonth) continue;
        } else {
          const isThisMonth = (rYear === thisYear && rMonth === thisMonth);
          const isLastMonth = (rYear === lastYear && rMonth === lastMonth);
          if (!isThisMonth && !isLastMonth) continue;
        }
      } else {
        if (fromDateStr) {
          const fromTime = new Date(fromDateStr).getTime();
          if (saleDateVal.getTime() < fromTime) continue;
        }
        if (toDateStr) {
          const toTime = new Date(toDateStr).getTime();
          if (saleDateVal.getTime() > toTime) continue;
        }
      }
    } else {
      if (isShowroom || fromDateStr || toDateStr) {
        continue;
      }
    }

    let saleDateStr = "";
    if (saleDateVal instanceof Date) {
      saleDateStr = saleDateVal.toISOString();
    } else if (saleDateVal) {
      saleDateStr = String(saleDateVal);
    }

    filtered.push({
      saleDate: saleDateStr,
      customerName: row[MAIN["CUSTOMER NAME"] - 1],
      mobileNo: row[MAIN["MOBILE NO"] - 1],
      model: row[MAIN["MODEL"] - 1],
      color: row[MAIN["COLOR"] - 1],
      cashFinance: row[MAIN["CASH / FINANCE"] - 1],
      salesPerson: row[MAIN["SALES PERSON"] - 1],
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1],
      branch: matchBranch
    });
  }

  filtered.sort((a, b) => {
    const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
    const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
    return dateA - dateB;
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getAdvanceReportList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const advanceSheet = ss.getSheetByName("ADVANCE");

  if (!advanceSheet) {
    return { status: 0, message: "ADVANCE not found" };
  }

  const lastRow = advanceSheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = advanceSheet.getRange(2, 1, lastRow - 1, 10).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";
  const fromDateStr = data.fromDate ? String(data.fromDate) : "";
  const toDateStr = data.toDate ? String(data.toDate) : "";

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    const advancerName = row[ADVANCE["ADVANCER NAME"] - 1];
    if (!advancerName) continue;

    const branch = normalize(row[ADVANCE["COUNTER"] - 1]);
    if (targetBranch !== "ALL" && branch !== targetBranch) continue;

    const advanceDateVal = row[ADVANCE["ADVANCE DATE"] - 1];
    if (advanceDateVal instanceof Date) {
      if (fromDateStr) {
        const fromTime = new Date(fromDateStr).getTime();
        if (advanceDateVal.getTime() < fromTime) continue;
      }
      if (toDateStr) {
        const toTime = new Date(toDateStr).getTime();
        if (advanceDateVal.getTime() > toTime) continue;
      }
    } else if (fromDateStr || toDateStr) {
      continue;
    }

    let advanceDateStr = "";
    if (advanceDateVal instanceof Date) {
      advanceDateStr = advanceDateVal.toISOString();
    } else if (advanceDateVal) {
      advanceDateStr = String(advanceDateVal);
    }

    filtered.push({
      advanceDate: advanceDateStr,
      advancerName: row[ADVANCE["ADVANCER NAME"] - 1],
      mobileNumber: row[ADVANCE["MOBILE NUMBER"] - 1],
      amount: row[ADVANCE["AMOUNT"] - 1],
      model: row[ADVANCE["MODEL"] - 1],
      color: row[ADVANCE["COLOR"] - 1],
      branch: row[ADVANCE["COUNTER"] - 1]
    });
  }

  filtered.sort((a, b) => {
    const dateA = a.advanceDate ? new Date(a.advanceDate).getTime() : 0;
    const dateB = b.advanceDate ? new Date(b.advanceDate).getTime() : 0;
    return dateA - dateB;
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getRTOReportList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const lastRow = mainSheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = mainSheet.getRange(2, 1, lastRow - 1, 46).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    // RTO STATUS must exist and not be FIT
    const rtoStatus = normalize(row[MAIN["RTO STATUS"] - 1]);
    if (!rtoStatus || rtoStatus === "FIT") continue;

    // Filter by branch
    const saleCounter = normalize(row[MAIN["SALE COUNTER"] - 1]);
    const currentCounter = normalize(row[MAIN["CUR COUNTER"] - 1]);
    const matchBranch = saleCounter ? saleCounter : currentCounter;
    if (targetBranch !== "ALL" && matchBranch !== targetBranch) continue;

    const rtoEntDtVal = row[MAIN["RTO ENT DT"] - 1];
    let rtoEntDtStr = "";
    if (rtoEntDtVal instanceof Date) {
      rtoEntDtStr = rtoEntDtVal.toISOString();
    } else if (rtoEntDtVal) {
      rtoEntDtStr = String(rtoEntDtVal);
    }

    filtered.push({
      rtoEntDt: rtoEntDtStr,
      customerName: row[MAIN["CUSTOMER NAME"] - 1],
      rtoStatus: row[MAIN["RTO STATUS"] - 1],
      regNo: row[MAIN["REG NO"] - 1],
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1]
    });
  }

  // Sort by rtoEntDt ascending (old to new)
  filtered.sort((a, b) => {
    const dateA = a.rtoEntDt ? new Date(a.rtoEntDt).getTime() : 0;
    const dateB = b.rtoEntDt ? new Date(b.rtoEntDt).getTime() : 0;
    return dateA - dateB;
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getDueReportList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const lastRow = mainSheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = mainSheet.getRange(2, 1, lastRow - 1, 25).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";
  const targetStatus = data.dueStatus ? normalize(data.dueStatus) : "UNPAID";

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    const dueVal = row[MAIN["DUE"] - 1];
    if (dueVal === "" || dueVal === undefined || dueVal === null) continue;
    const dueNum = parseFloat(dueVal);
    if (isNaN(dueNum) || dueNum === 0) continue;

    const rawStatus = normalize(row[MAIN["DUE_STATUS"] - 1]);
    const isPaid = rawStatus === "PAID";
    const statusText = isPaid ? "PAID" : "UNPAID";

    if (targetStatus === "UNPAID" && isPaid) continue;
    if (targetStatus === "PAID" && !isPaid) continue;

    const saleCounter = normalize(row[MAIN["SALE COUNTER"] - 1]);
    const currentCounter = normalize(row[MAIN["CUR COUNTER"] - 1]);
    const matchBranch = saleCounter ? saleCounter : currentCounter;
    if (targetBranch !== "ALL" && matchBranch !== targetBranch) continue;

    const saleDateVal = row[MAIN["SALE DATE"] - 1];
    let saleDateStr = "";
    if (saleDateVal instanceof Date) {
      saleDateStr = saleDateVal.toISOString();
    } else if (saleDateVal) {
      saleDateStr = String(saleDateVal);
    }

    filtered.push({
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1],
      saleDate: saleDateStr,
      customerName: row[MAIN["CUSTOMER NAME"] - 1],
      mobileNumber: row[MAIN["MOBILE NO"] - 1],
      due: dueVal,
      dueStatus: statusText,
      model: row[MAIN["MODEL"] - 1],
      color: row[MAIN["COLOR"] - 1],
      branch: matchBranch
    });
  }

  filtered.sort((a, b) => {
    const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
    const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
    return dateA - dateB;
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getPendingDPVerificationList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const mainSheet = ss.getSheetByName("MAIN");

  if (!mainSheet) {
    return { status: 0, message: "MAIN not found" };
  }

  const lastRow = mainSheet.getLastRow();
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = mainSheet.getRange(2, 1, lastRow - 1, 27).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    // ST STATUS must be B2C
    const stockStatus = normalize(row[MAIN["ST STATUS"] - 1]);
    if (stockStatus !== "B2C") continue;

    // DP TNC AMT must be non-empty
    const dpTncAmt = String(row[MAIN["DP TNC AMT"] - 1]).trim();
    if (dpTncAmt !== "") continue;

    // Filter by branch
    const saleCounter = normalize(row[MAIN["SALE COUNTER"] - 1]);
    const currentCounter = normalize(row[MAIN["CUR COUNTER"] - 1]);
    const matchBranch = saleCounter ? saleCounter : currentCounter;
    if (targetBranch !== "ALL" && matchBranch !== targetBranch) continue;

    const saleDateVal = row[MAIN["SALE DATE"] - 1];
    let saleDateStr = "";
    if (saleDateVal instanceof Date) {
      saleDateStr = saleDateVal.toISOString();
    } else if (saleDateVal) {
      saleDateStr = String(saleDateVal);
    }

    filtered.push({
      saleDate: saleDateStr,
      customerName: row[MAIN["CUSTOMER NAME"] - 1],
      receivedDp: row[MAIN["RECEIVED DP"] - 1],
      model: row[MAIN["MODEL"] - 1],
      color: row[MAIN["COLOR"] - 1],
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1],
      branch: matchBranch
    });
  }

  // Sort by saleDate ascending (old to new)
  filtered.sort((a, b) => {
    const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
    const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
    return dateA - dateB;
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getAccountReportList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const ss = SpreadsheetApp.openById(ADMINSHEET_ID);
  const sheet = ss.getSheetByName("ACCOUNT");

  if (!sheet) {
    return { status: 0, message: "ACCOUNT sheet not found in ADMINSHEET_ID" };
  }

  const lastRow = getFirstEmptyRow(sheet, "C2:C" + sheet.getMaxRows()) - 1;
  if (lastRow < 2) {
    return { status: 1, data: [], total: 0 };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 31).getValues();

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];

    // Filter out rows where the VERIFY column is already populated
    const verifyVal = normalize(row[ADMIN_ACCOUNT["VERIFY"] - 1]);
    if (verifyVal !== "") continue;

    const saleDateVal = row[ADMIN_ACCOUNT["SALE DATE"] - 1];
    let saleDateStr = "";
    if (saleDateVal instanceof Date) {
      saleDateStr = saleDateVal.toISOString();
    } else if (saleDateVal) {
      saleDateStr = String(saleDateVal);
    }

    filtered.push({
      saleDate: saleDateStr,
      customerName: row[ADMIN_ACCOUNT["CUSTOMER NAME"] - 1],
      saleCounter: row[ADMIN_ACCOUNT["SALE COUNTER"] - 1],
      model: row[ADMIN_ACCOUNT["MODEL"] - 1],
      color: row[ADMIN_ACCOUNT["COLOR"] - 1],
      cashFinance: row[ADMIN_ACCOUNT["CASH / FINANCE"] - 1],
      onRoad: row[ADMIN_ACCOUNT["ON-ROAD PRICE"] - 1],
      chassisNumber: row[ADMIN_ACCOUNT["CHASSIS NUMBER"] - 1],
      receivedDp: row[ADMIN_ACCOUNT["RECEIVED DP"] - 1],
      callDp: row[ADMIN_ACCOUNT["CALL DP"] - 1],
      dpTncAmt: row[ADMIN_ACCOUNT["DP TNC AMT"] - 1],
      dpGap: row[ADMIN_ACCOUNT["DP GAP"] - 1],
      advAmt: row[ADMIN_ACCOUNT["ADV AMT"] - 1],
      advTncAmt: row[ADMIN_ACCOUNT["ADV TNC AMT"] - 1],
      estDis: row[ADMIN_ACCOUNT["EST DIS"] - 1],
      disTncAmt: row[ADMIN_ACCOUNT["DIS TNC AMT"] - 1],
      disGap: row[ADMIN_ACCOUNT["DIS GAP"] - 1],
      cusExVal: row[ADMIN_ACCOUNT["CUS EX VAL"] - 1],
      dealerExVal: row[ADMIN_ACCOUNT["DEALER EX VAL"] - 1],
      exTncAmt: row[ADMIN_ACCOUNT["EX TNC AMT"] - 1],
      invVal: row[ADMIN_ACCOUNT["INV VAL"] - 1],
      insTncAmt: row[ADMIN_ACCOUNT["INS TNC AMT"] - 1],
      rtoTncAmt: row[ADMIN_ACCOUNT["RTO TNC AMT"] - 1],
      due: row[ADMIN_ACCOUNT["DUE"] - 1]
    });
  }

  // Sort by saleDate ascending (old to new)
  filtered.sort((a, b) => {
    const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
    const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
    return dateA - dateB;
  });

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function submitAdminVerification(data) {
  if (!data || !data.chassisNumber) {
    return { status: 0, message: "chassisNumber is required" };
  }

  const ss = SpreadsheetApp.openById(ADMINSHEET_ID);
  const sheet = ss.getSheetByName("ACCOUNT");

  if (!sheet) {
    return { status: 0, message: "ACCOUNT sheet not found in ADMINSHEET_ID" };
  }

  const rowIndex = getRowIndexHandler(sheet, data.chassisNumber, ADMIN_ACCOUNT["CHASSIS NUMBER"]);
  if (rowIndex === -1) {
    return { status: 0, message: "Record not found in ACCOUNT sheet" };
  }

  sheet.getRange(rowIndex, ADMIN_ACCOUNT["VERIFY"]).setValue("VERIFIED");
  sheet.getRange(rowIndex, ADMIN_ACCOUNT["REMARK"]).setValue(data.remark || "");

  return { status: 1, message: "Record verified successfully" };
}
