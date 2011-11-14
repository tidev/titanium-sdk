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
		_facebookInitialized = true;
		if (_authAfterInitialized) {
			api.authorize();
		}
	};
	
	// Create the div required by Facebook
	fbDiv = document.createElement('div');
	fbDiv.id = 'fb-root';
	document.getElementsByTagName('body')[0].appendChild(fbDiv);
	
	// Load the Facebook SDK Asynchronously.
	var fbScriptTag, id = 'facebook-jssdk'; 
	if (!document.getElementById(id)) {
		fbScriptTag = document.createElement('script');
		fbScriptTag.id = id; 
		fbScriptTag.async = true;
		fbScriptTag.src = "//connect.facebook.net/en_US/all.js";
		document.getElementsByTagName('head')[0].appendChild(fbScriptTag);
	}

	// Methods
	api.authorize = function(){
		
		// Sanity check
		if (_appid == null) {
			console.debug('App ID not set. Facebook authorization cancelled.');
			return;
		}
		
		// Check if facebook is still initializing, and if so queue the auth request
		if (!_facebookInitialized) {
			_authAfterInitialized = true;
			return;
		}
		
		// Authorize
		FB.login(function(response) {
			if (response.authResponse) {
				_expirationDate = new Date((new Date()).getTime() + response.authResponse.expiresIn * 1000);
				FB.api('/me', function(response) {
					_loggedIn = true;
					_uid = response.id;
					var undef;
					var oEvent = {
						cancelled	: false,
						data		: response,
						error		: undef,
						source		: undef,
						success		: true,
						type		: undef,
						uid			: _uid
					};
					api.fireEvent('login', oEvent);
				});
			} else {
				var undef;
				var oEvent = {
					cancelled	: true,
					data		: response,
					error		: "The user cancelled or there was an internal error",
					source		: undef,
					success		: false,
					type		: undef,
					uid			: response.id
				};
				api.fireEvent('login', oEvent);
			}
		}, {'scope':_permissions.join()});
	};
	api.createLoginButton = function(parameters){
		console.debug('Method "Titanium.Facebook.createLoginButton" is not implemented yet.');
	};
	api.dialog = function(action,params,callback){
		console.debug('Method "Titanium.Facebook.dialog" is not implemented yet.');
	};
	api.logout = function(){
		FB.logout(function(response) {
			_loggedIn = false;
			var undef;
			var oEvent = {
				source		: undef,
				type		: undef
			};
			api.fireEvent('logout', oEvent);
		});
	};
	api.request = function(method,params,callback){
		console.debug('Method "Titanium.Facebook.request" is not implemented yet.');
	};
	api.requestWithGraphPath = function(path,params,httpMethod,callback){
		console.debug('Method "Titanium.Facebook.requestWithGraphPath" is not implemented yet.');
	};
})(Ti._5.createClass('Titanium.Facebook'));