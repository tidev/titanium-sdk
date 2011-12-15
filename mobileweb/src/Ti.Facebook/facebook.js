(function(api){

	var undef,
		facebookInitialized = false,
		loginAfterInitialization = false,
		appid = null,
		notLoggedInMessage = "not logged in",
		facebookDiv = document.createElement("div"),
		facebookScriptTagID = "facebook-jssdk",
		facebookLoaded = false;

	// Interfaces
	Ti._5.EventDriven(api);

	function initFacebook() {
		FB.init({
			appId: appid, // App ID
			status: false, // do NOT check login status because we're gonna do it after init() anyways
			cookie: true, // enable cookies to allow the server to access the session
			oauth: true, // enable OAuth 2.0
			xfbml: true  // parse XFBML
		});
		FB.getLoginStatus(function(response){
			facebookInitialized = true;
			(response.status == "connected" && initSession(response)) || loginAfterInitialization && loginInternal();
		});
	}

	function initSession(response) {
		var ar = response.authResponse;
		if (ar) {
			// Set the various status members
			loggedIn = true;
			api.uid = ar.userID;
			api.expirationDate = new Date((new Date()).getTime() + ar.expiresIn * 1000);

			// Set a timeout to match when the token expires
			ar.expiresIn && setTimeout(function(){ 
				api.logout();
			}, ar.expiresIn * 1000);

			// Fire the login event
			api.fireEvent("login", {
				cancelled: false,
				data: response,
				success: true,
				uid: api.uid
			});

			return true;
		}
	}

	// Properties
	Ti._5.prop(api, {
		accessToken: undef,
		appid: {
			get: function(){return appid;},
			set: function(val){
				appid = val;
				facebookLoaded && initFacebook();
			}
		},
		expirationDate: undef,
		forceDialogAuth: {
			get: function(){return true;},
			set: function(){}
		},
		loggedIn: false,
		permissions: undef,
		uid: undef
	});

	// Create the div required by Facebook
	facebookDiv.id = "fb-root";
	document.body.appendChild(facebookDiv);

	// Load the Facebook SDK Asynchronously.
	if (!document.getElementById(facebookScriptTagID)) {
		var facebookScriptTag = document.createElement("script"),
			head = document.getElementsByTagName("head")[0];
		facebookScriptTag.id = facebookScriptTagID; 
		facebookScriptTag.async = true;
		facebookScriptTag.src = "//connect.facebook.net/en_US/all.js";
		head.insertBefore(facebookScriptTag, head.firstChild);
	}

	window.fbAsyncInit = function() {
		facebookLoaded = true;
		appid && initFacebook();
	};

	function processResponse(response, requestParamName, requestParamValue, callback) {
		result = {source:api,success:false};
		result[requestParamName] = requestParamValue;
		if (!response || response.error) {
			response && (result["error"] = response.error);
		} else {
			result["success"] = true;
			result["result"] = JSON.stringify(response);
		}
		callback(result);
	}
		
	function loginInternal() {
		FB.login(function(response) {
			initSession(response) || api.fireEvent("login", {
				cancelled	: true,
				data		: response,
				error		: "user cancelled or an internal error occured.",
				success		: false,
				uid			: response.id
			});
		}, {"scope":api.permissions.join()});
	}

	// Methods
	api.authorize = function() {
		// Sanity check
		if (appid == null) {
			throw new Error("App ID not set. Facebook authorization cancelled.");
		}

		// Check if facebook is still initializing, and if so queue the auth request
		if (facebookInitialized) {
			// Authorize
			loginInternal();
		} else {
			loginAfterInitialization = true;
		}
	};
	api.createLoginButton = function(parameters) {
		throw new Error('Method "Titanium.Facebook.createLoginButton" is not implemented yet.');
	};
	api.dialog = function(action, params, callback) {
		if (loggedIn) {
			params.method = action;
			FB.ui(params,function(response){
				processResponse(response,"action",action,callback);
			});
		} else {
			callback({
				success	: false,
				error	: notLoggedInMessage,
				action	: action,
				source	: api
			});
		}
	};
	api.logout = function() {
		loggedIn && FB.logout(function(response) {
			loggedIn = false;
			api.fireEvent("logout", {
				success	: true
			});
		});
	};
	api.request = function(method, params, callback) {
		if (loggedIn) {
			params.method = method;
			params.urls = "facebook.com,developers.facebook.com";
			FB.api(params,function(response){
				processResponse(response,"method",method,callback);
			});
		} else {
			callback({
				success	: false,
				error	: notLoggedInMessage,
				method	: method,
				source	: api
			});
		}
	};
	api.requestWithGraphPath = function(path, params, httpMethod, callback) {
		if (loggedIn) {
			FB.api(path,httpMethod,params,function(response){
				processResponse(response,"path",path,callback);
			});
		} else {
			callback({
				success	: false,
				error	: notLoggedInMessage,
				path	: path,
				source	: api
			});
		}
	};
})(Ti._5.createClass("Ti.Facebook"));