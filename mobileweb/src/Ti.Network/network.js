(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Properties
	api.INADDR_ANY = null;
	api.NETWORK_LAN = 1;
	api.NETWORK_MOBILE = 3;
	api.NETWORK_NONE = 0;
	api.NETWORK_UNKNOWN = -1;
	api.NETWORK_WIFI = 2;
	api.NOTIFICATION_TYPE_ALERT = null;
	api.NOTIFICATION_TYPE_BADGE = null;
	api.NOTIFICATION_TYPE_SOUND = null;
	api.READ_MODE = 0;
	api.READ_WRITE_MODE = 2;
	api.WRITE_MODE = 1;
	
	Ti._5.prop(api, 'networkType', {
		get: function() {
			if (!api.online) {
				return api.NETWORK_NONE;
			}		
			if (navigator.connection && navigator.connection.type == navigator.connection.WIFI) {
				return api.NETWORK_WIFI;
			}
			if (navigator.connection && navigator.connection.type == navigator.connection.ETHERNET) {
				return api.NETWORK_LAN;
			}
			if (
				navigator.connection &&
				(navigator.connection.type == navigator.connection.CELL_2G ||
				navigator.connection.type == navigator.connection.CELL_3G)			
			) {
				return api.NETWORK_MOBILE;
			}
			
			return api.NETWORK_UNKNOWN;
		},
		set: function() { return false; }
	});
	
	Ti._5.prop(api, 'networkTypeName', {
		get: function() {
			if (!api.online) {
				return 'NONE';
			}		
			if (navigator.connection && navigator.connection.type == navigator.connection.WIFI) {
				return 'WIFI';
			}
			if (navigator.connection && navigator.connection.type == navigator.connection.ETHERNET) {
				return 'LAN';
			}
			if (
				navigator.connection &&
				(navigator.connection.type == navigator.connection.CELL_2G ||
				navigator.connection.type == navigator.connection.CELL_3G)			
			) {
				return 'MOBILE';
			}
			
			return 'UNKNOWN';
		},
		set: function() { return false; }
	});
		
	Ti._5.prop(api, 'online', {
		get: function() {return navigator.onLine},
		set: function() { return false; }
	});
	// IPhone
	api.remoteDeviceUUID = null;
	// IPhone
	api.remoteNotificationTypes = null;
	// IPhone
	api.remoteNotificationsEnabled = null;

	// Methods
	api.createHTTPClient = function(args) {
		return new Ti.Network.HTTPClient(args);
	};

	// deprecated since 1.7.0
	api.addConnectivityListener = function(){
		console.debug('Method "Titanium.Network.addConnectivityListener" is not implemented yet.');
	};

	api.createBonjourBrowser = function(args) {
		console.debug('Method "Titanium.Network.createBonjourBrowser" is not implemented yet.');
	};
	api.createBonjourService = function(args) {
		console.debug('Method "Titanium.Network.createBonjourService" is not implemented yet.');
	};
	
	// deprecated since 1.7.0
	api.createTCPSocket = function(args){
		return new Ti.Network.TCPSocket(args);
	};

	api.decodeURIComponent = function(value) {
		return decodeURIComponent(value);
	};
	api.encodeURIComponent = function(value) {
		return encodeURIComponent(value);
	};
	
	// IPhone only
	api.registerForPushNotifications = function(){
		console.debug('Method "Titanium.Network.registerForPushNotifications" is not implemented yet.');
	};

	// deprecated since 1.7.0
	api.removeConnectivityListener = function(){
		console.debug('Method "Titanium.Network.removeConnectivityListener" is not implemented yet.');
	};

	// Events
	window.addEventListener('online', function(event) {
		var oEvent = {
			networkType		: api.networkType,
			networkTypeName	: api.networkTypeName,
			online			: true,
			source			: event.target,
			type			: event.type
		};
		if (!api.online) {
			api.fireEvent('change', oEvent);
		}
		api.online = true;
	}, false);
	
	window.addEventListener('offline', function(event) {
		var oEvent = {
			networkType		: api.networkType,
			networkTypeName	: api.networkTypeName,
			online			: false,
			source			: event.target,
			type			: event.type
		};
		if (!api.online) {
			api.fireEvent('change', oEvent);
		}
		if (api.online) {
			api.fireEvent('change', oEvent);
		}
		api.online = false;
	}, false);
})(Ti._5.createClass('Ti.Network'));
