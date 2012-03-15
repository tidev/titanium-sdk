define(
	["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/_/dom"],
	function(_, Evented, lang, ready, style, dom) {

	var modules = "NavigationGroup",
		creators = {},
		setStyle = style.set,
		undef;

	require.each(modules.split(','), function(name) {
		creators['create' + name] = function(args) {
			var m = require("Ti/UI/MobileWeb/" + name);
			return new m(args);
		};
	});
	
	return lang.setObject("Ti.UI.MobileWeb", Evented, creators, {});
	
});