var require = {
	app: {
		analytics: <%- appAnalytics %>,
		copyright: "<%- escapeQuotes(appCopyright) %>",
		deployType: "<%- deployType %>",
		description: "<%- escapeQuotes(appDescription) %>",
		guid: "<%- escapeQuotes(appGuid) %>",
		id: "<%- escapeQuotes(appId) %>",
		name: "<%- escapeQuotes(appName) %>",
		names: <%- appNames %>,
		publisher: "<%- escapeQuotes(appPublisher) %>",
		url: "<%- escapeQuotes(appUrl) %>",
		version: "<%- escapeQuotes(appVersion) %>"
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
		id: "<%- escapeQuotes(projectId) %>",
		name: "<%- escapeQuotes(projectName) %>"
	},
	ti: {
		analyticsPlatformName: "<%- escapeQuotes(tiAnalyticsPlatformName) %>",
		buildHash: "<%- escapeQuotes(tiGithash) %>",
		buildDate: "<%- escapeQuotes(tiTimestamp) %>",
		buildType: "<%- buildType %>",
		colorsModule: "Ti/_/colors",
		filesystem: {
			registry: "<%- escapeQuotes(tiFsRegistry) %>"
		},
		osName: "<%- escapeQuotes(tiOsName) %>",
		platformName: "<%- escapeQuotes(tiPlatformName) %>",
		theme: "<%- escapeQuotes(tiTheme) %>",
		version: "<%- escapeQuotes(tiVersion) %>"
	},
	vendorPrefixes: {
		css: ["", "-webkit-", "-moz-", "-ms-", "-o-", "-khtml-"],
		dom: ["", "Webkit", "Moz", "ms", "O", "Khtml"]
	}
};