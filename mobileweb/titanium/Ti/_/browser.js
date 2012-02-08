define(["Ti/_"], function(_) {
	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/);
	return _.browser = {
		runtime: match ? match[0] : "unknown"
	};
});