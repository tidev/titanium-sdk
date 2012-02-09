define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	return lang.mixProps(lang.setObject("Ti.App", Evented), {
		constants: require.config.app
	});

});