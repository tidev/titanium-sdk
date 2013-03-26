define(["Ti/_/Evented", "Ti/_/lang", "Ti/UI/MobileWeb/NavigationGroup"],
	function(Evented, lang, NavigationGroup) {

	return lang.setObject("Ti.UI.MobileWeb", Evented, {
		createNavigationGroup: function(args) {
			return new NavigationGroup(args);
		}
	});

});