(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	var _accessToken = null;
	Object.defineProperty(api, 'accessToken', {
		get: function(){return _accessToken;},
		set: function(val){return _accessToken = val;}
	});

	var _appid = null;
	Object.defineProperty(api, 'appid', {
		get: function(){return _appid;},
		set: function(val){return _appid = val;}
	});

	var _expirationDate = null;
	Object.defineProperty(api, 'expirationDate', {
		get: function(){return _expirationDate;},
		set: function(val){return _expirationDate = val;}
	});

	Object.defineProperty(api, 'forceDialogAuth', {
		get: function(){return true;},
		set: function(val){return true;}
	});

	var _loggedIn = false;
	Object.defineProperty(api, 'loggedIn', {
		get: function(){return _loggedIn;},
		set: function(val){return _loggedIn = val;}
	});

	var _permissions = null;
	Object.defineProperty(api, 'permissions', {
		get: function(){return _permissions;},
		set: function(val){return _permissions = val;}
	});

	var _uid = null;
	Object.defineProperty(api, 'uid', {
		get: function(){return _uid;},
		set: function(val){return _uid = val;}
	});
	
	var _notLoggedInMessage = "not logged in";
	
	var _initSession = function(response) {
		var ar = response.authResponse
		if (ar) {
			// Set the various status members
			_loggedIn = true;
			_uid = response.authResponse.userID;
			_expirationDate = new Date((new Date()).getTime() + response.authResponse.expiresIn * 1000);
			
			// Set a timeout to match when the token expires
			response.authResponse.expiresIn && setTimeout(function(){ 
				api.logout();
			}, response.authResponse.expiresIn * 1000);
			
			// Fire the login event
			api.fireEvent('login', {
				cancelled	: false,
				data		: response,
				success		: true,
				uid			: _uid,
				source		: api
			});
			
			return true;
		} else {
			return false;
		}
	};

	// Setup the Facebook initialization callback
	var _facebookInitialized = false;
	var _authAfterInitialized = false;
	window.fbAsyncInit = function() {
		FB.init({
			appId  : _appid, // App ID
			status : true, // check login status
			cookie : true, // enable cookies to allow the server to access the session
			oauth  : true, // enable OAuth 2.0
			xfbml  : true  // parse XFBML
		});
		FB.getLoginStatus(function(response){
			// Calculate connected outside of the if statement to ensure that _initSession runs and isn't optimized out if _authAfterInitialized is false
			var connected = (response.status == "connected") && (_initSession(response));
			if (!connected && _authAfterInitialized) {
				api.authorize();
			}
			_facebookInitialized = true;
		});
	};
	
	// Create the div required by Facebook
	var _fbDiv = document.createElement('div');
	_fbDiv.id = 'fb-root';
	document.body.appendChild(_fbDiv);
	
	// Load the Facebook SDK Asynchronously.
	
	var _fbDivID = 'facebook-jssdk'; 
	if (!document.getElementById(_fbDivID)) {
		var _fbScriptTag = document.createElement('script');
		_fbScriptTag.id = _fbDivID; 
		_fbScriptTag.async = true;
		_fbScriptTag.src = "//connect.facebook.net/en_US/all.js";
		var _head = document.getElementsByTagName ("head")[0];
		_head.insertBefore(_fbScriptTag, _head.firstChild);
	}

	// Methods
	api.authorize = function(){
		
		// Sanity check
		if (_appid == null) {
			throw new Error('App ID not set. Facebook authorization cancelled.');
		}
		
		// Check if facebook is still initializing, and if so queue the auth request
		if (!_facebookInitialized) {
			_authAfterInitialized = true;
			return;
		}
		
		// Authorize
		FB.login(function(response) {
			if (!_initSession(response)) {
				api.fireEvent('login', {
					cancelled	: true,
					data		: response,
					error		: "user cancelled or an internal error occured.",
					success		: false,
					uid			: response.id,
					source		: api
				});
			}
		}, {'scope':_permissions.join()});
	};
	api.createLoginButton = function(parameters){
		throw new Error('Method "Titanium.Facebook.createLoginButton" is not implemented yet.');
	};
	api.dialog = function(action,params,callback){
		if (!_loggedIn) {
			callback({
				'success'	: false,
				'error'		: _notLoggedInMessage,
				'action'	: action,
				'source'	: api
			});
			return;
		}
		params.method = action;
		FB.ui(params,function(response){
			if (!response) {
				callback({
					'success'	: false,
					'action'	: action,
					'source'	: api
				});
			} else if (response.error) {
				callback({
					'success'	: false,
					'error'		: response.error,
					'action'	: action,
					'source'	: api
				});
			} else {
				callback({
					'success'	: true,
					'result'	: response,
					'action'	: action,
					'source'	: api
				});
			}
		});
	};
	api.logout = function(){
		if (!_loggedIn) {
			callback({
				'success'	: false,
				'error'		: _notLoggedInMessage,
				'source'	: api
			});
			return;
		}
		FB.logout(function(response) {
			_loggedIn = false;
			api.fireEvent('logout', {
				'success'	: true,
				source		: api
			});
		});
	};
	api.request = function(method,params,callback){
		if (!_loggedIn) {
			callback({
				'success'	: false,
				'error'		: _notLoggedInMessage,
				'method'	: method,
				'source'	: api
			});
			return;
		}
		params.method = method;
		params.urls = 'facebook.com,developers.facebook.com';
		FB.api(params,function(response){
			if (!response) {
				callback({
					'success'	: false,
					'method'	: method,
					'source'	: api
				});
			} else if (response.error) {
				callback({
					'success'	: false,
					'error'		: response.error,
					'method'	: method,
					'source'	: api
				});
			} else {
				callback({
					'success'	: true,
					'result'	: JSON.stringify(response),
					'method'	: method,
					'source'	: api
				});
			}
		});
	};
	api.requestWithGraphPath = function(path,params,httpMethod,callback){
		if (!_loggedIn) {
			callback({
				'success'	: false,
				'error'		: _notLoggedInMessage,
				'path'		: path,
				'source'	: api
			});
			return;
		}
		FB.api(path,httpMethod,params,function(response){
			if (!response) {
				callback({
					'success'	: false,
					'path'		: path,
					'source'	: api});
			} else if (response.error) {
				callback({
					'success'	: false,
					'error'		: response.error,
					'path'		: path,
					'source'	: api});
			} else {
				callback({
					'success'	: true,
					'result'	: JSON.stringify(response),
					'path'		: path,
					'source'	: api});
			}
		});
	};
})(Ti._5.createClass('Titanium.Facebook'));