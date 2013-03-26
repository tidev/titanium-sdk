define(["Ti/_", "Ti/_/Evented", "Ti/_/lang"], function(_, Evented, lang) {

	return lang.mixProps(lang.setObject("Ti.App", Evented), {
		constants: require.mix({
			sessionId: function() {
				var ss = sessionStorage,
					sid = ss.getItem("ti:sessionId");
				sid || ss.setItem("ti:sessionId", sid = _.uuid());
				return sid;
			}
		}, require.config.app),
		
		getID: function() {
			return this.id;
		},
		
		getURL: function() {
			return this.url;
		},
		
		getGUID: function() {
			return this.guid;
		}
	}, true);

});