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
  if (targetStatus && targetStatus !== "ALL") endpoint += "&status=eq." + encodeURIComponent(targetStatus);
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
