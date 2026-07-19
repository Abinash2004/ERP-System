function newWalkInForm(data) {
  if (!data) {
    return { status: 0, message: "invalid payload" };
  }

  const payload = {
    visit_date: new Date().toISOString(),
    location: normalize(data.location),
    customer_name: normalize(data.customerName),
    mobile_number: normalize(data.mobileNumber),
    address: normalize(data.address),
    vehicle_details: normalize(data.vehicleDetails),
    status: "OPENED"
  };

  const requiredFields = [
    payload.location,
    payload.customer_name,
    payload.mobile_number
  ];

  if (requiredFields.some(v => !v)) {
    return { status: 0, message: "some fields are missing" };
  }

  const response = supabaseRequest("POST", "/rest/v1/follow_up", payload);

  if (response && response.message && !Array.isArray(response)) {
    if (
      response.status === 409 ||
      String(response.code || "").trim() === "23505" ||
      /duplicate key value violates unique constraint/i.test(response.message || "")
    ) {
      return { status: 0, message: "customer with this mobile number already exists" };
    }
    return { status: 0, message: response.message };
  }

  return { status: 1, message: "data added successfully" };
}

function getFollowUpList(data) {
  if (!data || !data.page || !data.limit) {
    return { status: 0, message: "invalid payload" };
  }

  const targetStatus = normalizeFollowUpStatus(data.status);
  const offset = (data.page - 1) * data.limit;

  let endpoint = "/rest/v1/follow_up?select=*";
  if (data.branch && String(data.branch).trim() !== "ALL") {
    const targetBranch = normalize(data.branch);
    endpoint += "&location=eq." + encodeURIComponent(targetBranch);
  }
  if (targetStatus && targetStatus !== "ALL") {
    endpoint += "&status=eq." + encodeURIComponent(targetStatus);
  }
  if (data.visitDateFrom) {
    endpoint += "&visit_date=gte." + encodeURIComponent(data.visitDateFrom);
  }
  if (data.visitDateTo) {
    endpoint += "&visit_date=lte." + encodeURIComponent(data.visitDateTo + "T23:59:59.999Z");
  }
  if (data.firstFeedbackDateFrom) {
    endpoint += "&first_feedback_date=gte." + encodeURIComponent(data.firstFeedbackDateFrom);
  }
  if (data.firstFeedbackDateTo) {
    endpoint += "&first_feedback_date=lte." + encodeURIComponent(data.firstFeedbackDateTo + "T23:59:59.999Z");
  }
  if (data.lastFeedbackDateFrom) {
    endpoint += "&last_feedback_date=gte." + encodeURIComponent(data.lastFeedbackDateFrom);
  }
  if (data.lastFeedbackDateTo) {
    endpoint += "&last_feedback_date=lte." + encodeURIComponent(data.lastFeedbackDateTo + "T23:59:59.999Z");
  }
  endpoint += "&order=visit_date.desc,serial_number.desc" + "&limit=" + data.limit + "&offset=" + offset;

  const response = supabaseRequest("GET", endpoint);

  if (!Array.isArray(response)) {
    return { status: 0, message: response.message };
  }

  return { status: 1, message: "success", data: response };
}

function updateFollowUpForm(data) {
  if (!data || !data.serialNumber) {
    return { status: 0, message: "invalid payload" };
  }

  const serialNumber = parseInt(data.serialNumber, 10);

  const existing = supabaseRequest(
    "GET",
    "/rest/v1/follow_up?select=first_feedback&serial_number=eq." + serialNumber
  );

  if (!Array.isArray(existing)) return { status: 0, message: existing.message };
  if (!existing.length) return { status: 0, message: "record not found" };

  const payload = {
    address: normalize(data.address),
    vehicle_details: normalize(data.vehicleDetails),
    status: normalizeFollowUpStatus(data.status)
  };

  if (!existing[0].first_feedback) {
    payload.first_feedback = normalize(data.firstFeedback);
    payload.first_feedback_date = new Date().toISOString();
  } else {
    payload.last_feedback = normalize(data.lastFeedback);
    payload.last_feedback_date = new Date().toISOString();
  }

  const response = supabaseRequest(
    "PATCH",
    "/rest/v1/follow_up?serial_number=eq." + serialNumber,
    payload
  );

  if (!Array.isArray(response)) {
    return { status: 0, message: response.message };
  }

  return { status: 1, message: "follow up updated successfully" };
}

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

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const stockStatus = normalize(row[MAIN["STOCK STATUS"] - 1]);
    if (stockStatus !== "STOCK") continue;

    if (targetBranch !== "ALL") {
      const currentCounter = normalize(row[MAIN["CURRENT COUNTER"] - 1]);
      if (currentCounter !== targetBranch) continue;
    }

    const invoiceDateVal = row[MAIN["INVOICE DATE"] - 1];
    let invoiceDateStr = "";
    if (invoiceDateVal instanceof Date) {
      invoiceDateStr = invoiceDateVal.toISOString();
    } else if (invoiceDateVal) {
      invoiceDateStr = String(invoiceDateVal);
    }

    filtered.push({
      serialNumber: row[MAIN["SERIAL NUMBER"] - 1],
      invoiceDate: invoiceDateStr,
      purchasedInvoiceNumber: row[MAIN["PURCHASED INVOICE NUMBER"] - 1],
      currentCounter: row[MAIN["CURRENT COUNTER"] - 1],
      keyNumber: row[MAIN["KEY NUMBER"] - 1],
      engineNumber: row[MAIN["ENGINE NUMBER"] - 1],
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1],
      model: row[MAIN["MODEL"] - 1],
      color: row[MAIN["COLOR"] - 1]
    });
  }

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}

function getSalesList(data) {
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

  const values = mainSheet.getRange(2, 1, lastRow - 1, 31).getValues();
  const targetBranch = data.branch ? normalize(data.branch) : "ALL";

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const stockStatus = normalize(row[MAIN["STOCK STATUS"] - 1]);
    
    if (stockStatus === "STOCK" || !stockStatus) continue;

    if (targetBranch !== "ALL") {
      const saleCounter = normalize(row[MAIN["SALE COUNTER"] - 1]);
      const currentCounter = normalize(row[MAIN["CURRENT COUNTER"] - 1]);
      const matchBranch = saleCounter ? saleCounter : currentCounter;
      if (matchBranch !== targetBranch) continue;
    }

    const invoiceDateVal = row[MAIN["INVOICE DATE"] - 1];
    let invoiceDateStr = "";
    if (invoiceDateVal instanceof Date) {
      invoiceDateStr = invoiceDateVal.toISOString();
    } else if (invoiceDateVal) {
      invoiceDateStr = String(invoiceDateVal);
    }

    const saleDateVal = row[MAIN["SALE DATE"] - 1];
    let saleDateStr = "";
    if (saleDateVal instanceof Date) {
      saleDateStr = saleDateVal.toISOString();
    } else if (saleDateVal) {
      saleDateStr = String(saleDateVal);
    }

    filtered.push({
      serialNumber: row[MAIN["SERIAL NUMBER"] - 1],
      invoiceDate: invoiceDateStr,
      purchasedInvoiceNumber: row[MAIN["PURCHASED INVOICE NUMBER"] - 1],
      currentCounter: row[MAIN["CURRENT COUNTER"] - 1],
      keyNumber: row[MAIN["KEY NUMBER"] - 1],
      engineNumber: row[MAIN["ENGINE NUMBER"] - 1],
      chassisNumber: row[MAIN["CHASSIS NUMBER"] - 1],
      model: row[MAIN["MODEL"] - 1],
      color: row[MAIN["COLOR"] - 1],
      stockStatus: row[MAIN["STOCK STATUS"] - 1],
      saleDate: saleDateStr,
      customerOnRoadPrice: row[MAIN["CUSTOMER ON-ROAD PRICE"] - 1],
      saleCounter: row[MAIN["SALE COUNTER"] - 1],
      customerName: row[MAIN["CUSTOMER NAME"] - 1],
      mobileNumber: row[MAIN["MOBILE NUMBER"] - 1],
      alternateMobileNumber: row[MAIN["ALTERNATE MOBILE NUMBER"] - 1],
      cashFinance: row[MAIN["CASH / FINANCE"] - 1],
      financer: row[MAIN["FINANCER"] - 1],
      salesPerson: row[MAIN["SALES PERSON"] - 1],
      advancerName: row[MAIN["ADVANCER NAME"] - 1],
      totalDp: row[MAIN["TOTAL DP"] - 1],
      advanceAmount: row[MAIN["ADVANCE AMOUNT"] - 1],
      receivedDp: row[MAIN["RECEIVED DP"] - 1],
      totalReceived: row[MAIN["TOTAL RECEIVED"] - 1],
      due: row[MAIN["DUE"] - 1],
      anyExchange: row[MAIN["ANY EXCHANGE"] - 1],
      exchangeModel: row[MAIN["EXCHANGE MODEL"] - 1],
      exchangeRegisterNumber: row[MAIN["EXCHANGE REGISTER NUMBER"] - 1],
      customerExchangeValue: row[MAIN["CUSTOMER EXCHANGE VALUE"] - 1],
      dealerExchangeValue: row[MAIN["DEALER EXCHANGE VALUE"] - 1],
      dealerName: row[MAIN["DEALER NAME"] - 1]
    });
  }

  const page = parseInt(data.page, 10);
  const limit = parseInt(data.limit, 10);
  const offset = (page - 1) * limit;
  const sliced = filtered.slice(offset, offset + limit);

  return { status: 1, message: "success", data: sliced, total: filtered.length };
}
