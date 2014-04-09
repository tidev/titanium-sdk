var require = {
	app: {
		analytics: <%- appAnalytics %>,
		copyright: "<%-: appCopyright | escapeQuotes %>",
		deployType: "<%- deployType %>",
		description: "<%-: appDescription | escapeQuotes %>",
		guid: "<%-: appGuid | escapeQuotes %>",
		id: "<%-: appId | escapeQuotes %>",
		name: "<%-: appName | escapeQuotes %>",
		names: <%- appNames %>,
		publisher: "<%-: appPublisher | escapeQuotes %>",
		url: "<%-: appUrl | escapeQuotes %>",
		version: "<%-: appVersion | escapeQuotes %>"
	},
	has: {
		"native-localstorage": function (g) {
			return "localStorage" in g && "setItem" in localStorage;
		},
		"js-btoa": function (g) {
			return "btoa" in g;
		},
		"opera": typeof opera === "undefined" || opera.toString() != "[object Opera]",
		"ti-analytics-use-xhr": <%- hasAnalyticsUseXhr %>,
		"ti-show-errors": <%- hasShowErrors %>,
		"ti-instrumentation": function(g) {
				return <%- hasInstrumentation %> && g.instrumentation;
		},
		"touch": function (g) {
			return <%- hasAllowTouch %> && 'ontouchstart' in g;
		}
	},
	locales: <%- locales %>,
	packages: <%- packages %>,
	project: {
		id: "<%-: projectId | escapeQuotes %>",
		name: "<%-: projectName | escapeQuotes %>"
	},
	ti: {
		analyticsPlatformName: "<%-: tiAnalyticsPlatformName | escapeQuotes %>",
		buildHash: "<%-: tiGithash | escapeQuotes %>",
		buildDate: "<%-: tiTimestamp | escapeQuotes %>",
		colorsModule: "Ti/_/colors",
		filesystem: {
			registry: "<%-: tiFsRegistry | escapeQuotes %>"
		},
		osName: "<%-: tiOsName | escapeQuotes %>",
		platformName: "<%-: tiPlatformName | escapeQuotes %>",
		theme: "<%-: tiTheme | escapeQuotes %>",
		version: "<%-: tiVersion | escapeQuotes %>"
	},
	vendorPrefixes: {
		css: ["", "-webkit-", "-moz-", "-ms-", "-o-", "-khtml-"],
		dom: ["", "Webkit", "Moz", "ms", "O", "Khtml"]
	}
};