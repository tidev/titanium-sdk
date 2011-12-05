(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	Ti._5.prop(api, 'accessToken');
	
	var _facebookInitialized = false;
	var _loginAfterInitialization = false;
	function _initFacebook() {
		FB.init({
			appId  : _appid, // App ID
			status : true, // check login status
			cookie : true, // enable cookies to allow the server to access the session
			oauth  : true, // enable OAuth 2.0
			xfbml  : true  // parse XFBML
		});
		FB.getLoginStatus(function(response){
			var connected = response.status == "connected" && _initSession(response);
			_facebookInitialized = true;
			if(!connected && _loginAfterInitialization) {
				_loginInternal();
			}
		});
	}

	var _appid = null;
	Ti._5.prop(api, 'appid', {
		get: function(){return _appid;},
		set: function(val){
			if (_facebookLoaded) {
				_initFacebook();
			}
			return _appid = val;
		}
	});

	Ti._5.prop(api, 'expirationDate');

	Ti._5.prop(api, 'forceDialogAuth', {
		get: function(){return true;},
		set: function(){return true;}
	});

	Ti._5.prop(api, 'loggedIn', false);

	Ti._5.prop(api, 'permissions');

	Ti._5.prop(api, 'uid');
	
	var _notLoggedInMessage = "not logged in";
	
	function _initSession(response) {
		var ar = response.authResponse;
		if (ar) {
			// Set the various status members
			_loggedIn = true;
			api.uid = ar.userID;
			api.expirationDate = new Date((new Date()).getTime() + ar.expiresIn * 1000);
			
			// Set a timeout to match when the token expires
			ar.expiresIn && setTimeout(function(){ 
				api.logout();
			}, ar.expiresIn * 1000);
			
			// Fire the login event
			api.fireEvent('login', {
				cancelled	: false,
				data		: response,
				success		: true,
				uid			: api.uid,
				source		: api
			});

			return true;
		}
	};
	
	// Create the div required by Facebook
	var _facebookDiv = document.createElement('div');
	_facebookDiv.id = 'fb-root';
	document.body.appendChild(_facebookDiv);
	
	// Load the Facebook SDK Asynchronously.
	var _facebookScriptTagID = 'facebook-jssdk'; 
	if (!document.getElementById(_facebookScriptTagID)) {
		var _facebookScriptTag = document.createElement('script');
		_facebookScriptTag.id = _facebookScriptTagID; 
		_facebookScriptTag.async = true;
		_facebookScriptTag.src = "//connect.facebook.net/en_US/all.js";
		var _head = document.getElementsByTagName ("head")[0];
		_head.insertBefore(_facebookScriptTag, _head.firstChild);
	}
	
	var _facebookLoaded = false;
	window.fbAsyncInit = function() {
		_facebookLoaded = true;
		if (_appid) {
			_initFacebook();
		}
	}
	
	var _processResponse = function(response,requestParamName,requestParamValue,callback) {
		result = {source:api,success:false};
		result[requestParamName] = requestParamValue;
		if (!response || response.error) {
			response && (result['error'] = response.error);
		} else {
			result['success'] = true;
			result['result'] = JSON.stringify(response);
		}
		callback(result);
	}
		
	function _loginInternal() {
		FB.login(function(response) {
			_initSession(response) || api.fireEvent('login', {
				cancelled	: true,
				data		: response,
				error		: "user cancelled or an internal error occured.",
				success		: false,
				uid			: response.id,
				source		: api
			});
		}, {'scope':api.permissions.join()});
	}

	// Methods
	api.authorize = function(){
		
		// Sanity check
		if (_appid == null) {
			throw new Error('App ID not set. Facebook authorization cancelled.');
		}
		
		// Check if facebook is still initializing, and if so queue the auth request
		if (_facebookInitialized) {
			// Authorize
			_loginInternal();
		} else {
			_loginAfterInitialization = true;
		}
	};
	api.createLoginButton = function(parameters){
		throw new Error('Method "Titanium.Facebook.createLoginButton" is not implemented yet.');
	};
	api.dialog = function(action,params,callback){
		if (_loggedIn) {
			params.method = action;
			FB.ui(params,function(response){
				_processResponse(response,'action',action,callback);
			});
		} else {
			callback({
				success	: false,
				error	: _notLoggedInMessage,
				action	: action,
				source	: api
			});
		}
	};
	api.logout = function(){
		if (_loggedIn) {
			FB.logout(function(response) {
				_loggedIn = false;
				api.fireEvent('logout', {
					success	: true,
					source	: api
				});
			});
		} else {
			callback({
				success	: false,
				error	: _notLoggedInMessage,
				source	: api
			});
		}
	};
	api.request = function(method,params,callback){
		if (_loggedIn) {
			params.method = method;
			params.urls = 'facebook.com,developers.facebook.com';
			FB.api(params,function(response){
				_processResponse(response,'method',method,callback);
			});
		} else {
			callback({
				success	: false,
				error	: _notLoggedInMessage,
				method	: method,
				source	: api
			});
		}
	};
	api.requestWithGraphPath = function(path,params,httpMethod,callback){
		if (_loggedIn) {
			FB.api(path,httpMethod,params,function(response){
				_processResponse(response,'path',path,callback);
			});
		} else {
			callback({
				success	: false,
				error	: _notLoggedInMessage,
				path	: path,
				source	: api
			});
		}
	};
})(Ti._5.createClass('Titanium.Facebook'));