define(function() {
	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/);
	return {
		runtime: match ? match[0] : "unknown"
	};
});