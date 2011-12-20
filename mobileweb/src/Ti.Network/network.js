(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	var _httpURLFormatter = null;

	// Properties
	Ti._5.propReadOnly(api, {
		INADDR_ANY: null,
		NETWORK_LAN: 1,
		NETWORK_MOBILE: 3,
		NETWORK_NONE: 0,
		NETWORK_UNKNOWN: -1,
		NETWORK_WIFI: 2,
		NOTIFICATION_TYPE_ALERT: 0,
		NOTIFICATION_TYPE_BADGE: 1,
		NOTIFICATION_TYPE_SOUND: 2,
		READ_MODE: 0,
		READ_WRITE_MODE: 2,
		WRITE_MODE: 1,
		networkType: function() {
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
		networkTypeName: function() {
			if (!api.online) {
				return "NONE";
			}		
			if (navigator.connection && navigator.connection.type == navigator.connection.WIFI) {
				return "WIFI";
			}
			if (navigator.connection && navigator.connection.type == navigator.connection.ETHERNET) {
				return "LAN";
			}
			if (
				navigator.connection &&
				(navigator.connection.type == navigator.connection.CELL_2G ||
				navigator.connection.type == navigator.connection.CELL_3G)			
			) {
				return "MOBILE";
			}
			
			return "UNKNOWN";
		},
		online: function() {
			return navigator.onLine;
		}
	});
	
	Ti._5.prop(api, "httpURLFormatter", {
		get: function() {return _httpURLFormatter;},
		set: function(val) {_httpURLFormatter = val;}
	});

	// Methods
	api.createHTTPClient = function(args) {
		return new Ti.Network.HTTPClient(args);
	};

	api.decodeURIComponent = function(value) {
		return decodeURIComponent(value);
	};

	api.encodeURIComponent = function(value) {
		return encodeURIComponent(value);
	};

	// Events
	require.on(window, "online", function(evt) {
		api.online || api.fireEvent("change", {
			networkType		: api.networkType,
			networkTypeName	: api.networkTypeName,
			online			: true,
			source			: evt.target,
			type			: evt.type
		});
		api.online = true;
	});
	
	require.on(window, "offline", function(evt) {
		api.online && api.fireEvent("change", {
			networkType		: api.networkType,
			networkTypeName	: api.networkTypeName,
			online			: false,
			source			: evt.target,
			type			: evt.type
		});
		api.online = false;
	});
})(Ti._5.createClass("Ti.Network"));
