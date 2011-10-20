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

	var _forceDialogAuth = null;
	Object.defineProperty(api, 'forceDialogAuth', {
		get: function(){return _forceDialogAuth;},
		set: function(val){return _forceDialogAuth = val;}
	});

	var _loggedIn = null;
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

	// Methods
	api.authorize = function(){
		console.debug('Method "Titanium.Facebook..authorize" is not implemented yet.');
	};
	api.createLoginButton = function(){
		console.debug('Method "Titanium.Facebook..createLoginButton" is not implemented yet.');
	};
	api.dialog = function(){
		console.debug('Method "Titanium.Facebook..dialog" is not implemented yet.');
	};
	api.logout = function(){
		console.debug('Method "Titanium.Facebook..logout" is not implemented yet.');
	};
	api.request = function(){
		console.debug('Method "Titanium.Facebook..request" is not implemented yet.');
	};
	api.requestWithGraphPath = function(){
		console.debug('Method "Titanium.Facebook..requestWithGraphPath" is not implemented yet.');
	};

	// Events
	api.addEventListener('login', function(){
		console.debug('Event "login" is not implemented yet.');
	});
	api.addEventListener('logout', function(){
		console.debug('Event "logout" is not implemented yet.');
	});
})(Ti._5.createClass('Titanium.Facebook'));