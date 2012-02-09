define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var conn = navigator.connection,
		online = navigator.onLine,
		api = lang.setObject("Ti.Network", Evented, {

			constants: {
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
					if (!_online) {
						return api.NETWORK_NONE;
					}		
					if (conn && conn.type == conn.WIFI) {
						return api.NETWORK_WIFI;
					}
					if (conn && conn.type == conn.ETHERNET) {
						return api.NETWORK_LAN;
					}
					if (conn && (conn.type == conn.CELL_2G || conn.type == conn.CELL_3G)) {
						return api.NETWORK_MOBILE;
					}
					return api.NETWORK_UNKNOWN;
				},
				networkTypeName: function() {
					if (!_online) {
						return "NONE";
					}		
					if (conn && conn.type == conn.WIFI) {
						return "WIFI";
					}
					if (conn && conn.type == conn.ETHERNET) {
						return "LAN";
					}
					if (conn && (conn.type == conn.CELL_2G || conn.type == conn.CELL_3G)) {
						return "MOBILE";
					}
					return "UNKNOWN";
				},
				online: function() {
					return online;
				}
			},

			properties: {
				httpURLFormatter: null
			},

			createHTTPClient: function(args) {
				var HTTPClient = require("Ti/Network/HTTPClient");
				return new HTTPClient(args);
			},

			decodeURIComponent: function(value) {
				return decodeURIComponent(value);
			},

			encodeURIComponent: function(value) {
				return encodeURIComponent(value);
			}

		});

	require.on(window, "online", function(evt) {
		if (!online) {
			online = true;
			api.fireEvent("change", {
				networkType		: api.networkType,
				networkTypeName	: api.networkTypeName,
				online			: true,
				source			: evt.target,
				type			: evt.type
			});
		}
	});

	require.on(window, "offline", function(evt) {
		if (online) {
			online = false;
			api.fireEvent("change", {
				networkType		: api.networkType,
				networkTypeName	: api.networkTypeName,
				online			: false,
				source			: evt.target,
				type			: evt.type
			});
		}
	});

});