define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var conn = navigator.connection,
		online = navigator.onLine,
		Network = lang.setObject("Ti.Network", Evented, {

			constants: {
				NETWORK_LAN: 1,
				NETWORK_MOBILE: 3,
				NETWORK_NONE: 0,
				NETWORK_UNKNOWN: -1,
				NETWORK_WIFI: 2,
				networkType: function() {
					if (!online) {
						return Network.NETWORK_NONE;
					}		
					if (conn && conn.type == conn.WIFI) {
						return Network.NETWORK_WIFI;
					}
					if (conn && conn.type == conn.ETHERNET) {
						return Network.NETWORK_LAN;
					}
					if (conn && (conn.type == conn.CELL_2G || conn.type == conn.CELL_3G)) {
						return Network.NETWORK_MOBILE;
					}
					return Network.NETWORK_UNKNOWN;
				},
				networkTypeName: function() {
					if (!online) {
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
				return new (require("Ti/Network/HTTPClient"))(args);
			},

			decodeURIComponent: function(value) {
				return decodeURIComponent(value);
			},

			encodeURIComponent: function(value) {
				return encodeURIComponent(value);
			}

		});

	function onlineChange(evt) {
		evt.type === "online" && !online && (online = 1);
		evt.type === "offline" && online && (online = 0);

		Network.fireEvent("change", {
			networkType		: Network.networkType,
			networkTypeName	: Network.networkTypeName,
			online			: online
		});
	}

	require.on(window, "online", onlineChange);
	require.on(window, "offline", onlineChange);

	return Network;

});