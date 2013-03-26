define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var facebookInitialized = false,
		loginAfterInitialization = false,
		appid = null,
		notLoggedInMessage = "not logged in",
		facebookDiv = document.createElement("div"),
		facebookScriptTagID = "facebook-jssdk",
		facebookLoaded = false,
		api;
		
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
		}, true);
	}

	function initSession(response) {
		var authResponse = response.authResponse;
		if (authResponse) {
			// Set the various status members
			api.loggedIn = true;
			api.uid = authResponse.userID;
			api.expirationDate = new Date(Date.now() + authResponse.expiresIn * 1000);
			api.accessToken = authResponse.accessToken;

			// Set a timeout to match when the token expires
			authResponse.expiresIn && setTimeout(function(){ 
				api.logout();
			}, authResponse.expiresIn * 1000);

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

	api = lang.setObject("Ti.Facebook", Evented, {
		
		authorize: function() {
			// Sanity check
			if (!appid) {
				throw new Error("App ID not set. Facebook authorization cancelled.");
			}
	
			// Check if facebook is still initializing, and if so queue the auth request
			if (facebookInitialized) {
				// Authorize
				loginInternal();
			} else {
				loginAfterInitialization = true;
			}
		},
		
		createLoginButton: function(parameters) {
			return new (require("Ti/Facebook/LoginButton"))(parameters);
		},
		
		dialog: function(action, params, callback) {
			if (api.loggedIn) {
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
		},
		
		logout: function() {
			api.loggedIn && FB.logout(function(response) {
				api.loggedIn = false;
				api.fireEvent("logout", {
					success	: true
				});
			});
		},
		
		request: function(method, params, callback) {
			if (api.loggedIn) {
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
		},
		
		requestWithGraphPath: function(path, params, httpMethod, callback) {
			if (api.loggedIn) {
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
		},
		
		constants: {
			
			
			BUTTON_STYLE_NORMAL: 1,
			
			BUTTON_STYLE_WIDE: 2
		},
		
		properties: {
			
			accessToken: void 0,
			
			appid: {
				set: function(value){
					appid = value;
					facebookLoaded && initFacebook();
					return value;
				}
			},
			
			expirationDate: void 0,
			
			forceDialogAuth: true,
			
			loggedIn: false,
			
			permissions: void 0,
			
			uid: void 0
		}
		
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
	
	return api;

});