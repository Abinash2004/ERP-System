function doPost(e) {
    try {
        if (!e || !e.postData || !e.postData.contents) {
            return jsonResponse({ status: 0, message: "invalid request" });
        }
        
        const { action, token, data } = JSON.parse(e.postData.contents);
        return requestHandler(action, token, data);
        
    } catch (err) {
        return jsonResponse({ status: 0, message: err.message || "server error" });
    }
}

function doGet(e) {
    try {
        if (!e || !e.parameter) {
            return jsonResponse({ status: 0, message: "invalid request" });
        }
        
        const { action, token, data } = JSON.parse(e.parameter);
        return requestHandler(action, token, data);
    
    } catch (err) {
        return jsonResponse({ status: 0, message: err.message || "server error" });
    }
}

function requestHandler(action, token, data) {
    
    if (!token || token !== WEBAPP_TOKEN) {
        return jsonResponse({ status: 0, message: "invalid token" });
    }

    if (!action || !allowedActions[action]) {
        return jsonResponse({ status: 0, message: "invalid action" });
    }

    const result = this[action](data);
    return jsonResponse(result || { status: 1, message: "success" });
}

function verifyPassword(passcode) {
    passcode = String(passcode).trim();
    return USERS[passcode] ? 
    { status: 1, message: "authentication successful", data: {...USERS[passcode]} } : 
    { status: 0, message: "invalid password" };
}
