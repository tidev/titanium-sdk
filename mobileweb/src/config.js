var require = {
	app: {
		analytics: ${app_analytics | jsQuoteEscapeFilter},
		copyright: "${app_copyright | jsQuoteEscapeFilter}",
		deployType: "${deploy_type | jsQuoteEscapeFilter}",
		description: "${app_description | jsQuoteEscapeFilter}",
		guid: "${app_guid | jsQuoteEscapeFilter}",
		id: "${app_id | jsQuoteEscapeFilter}",
		name: "${app_name | jsQuoteEscapeFilter}",
		names: ${app_names},
		publisher: "${app_publisher | jsQuoteEscapeFilter}",
		url: "${app_url | jsQuoteEscapeFilter}",
		version: "${app_version | jsQuoteEscapeFilter}"
	},
	has: {
		"touch": function (g) {
			return ${has_allow_touch | jsQuoteEscapeFilter} && 'ontouchstart' in g;
		},
		"js-btoa": function (g) {
			return "btoa" in g;
		},
		"native-localstorage": function (g) {
			return "localStorage" in g && "setItem" in localStorage;
		},
		"function-bind": function () {
			return !!Function.prototype.bind;
		},
		"opera": typeof opera === "undefined" || opera.toString() != "[object Opera]",
		"ti-analytics-use-xhr": ${has_analytics_use_xhr | jsQuoteEscapeFilter},
		"ti-show-errors": ${has_show_errors | jsQuoteEscapeFilter},
		"ti-instrumentation": function(g) {
				return ${has_instrumentation | jsQuoteEscapeFilter} && g.instrumentation;
		},
		"winstore_extensions": ${has_winstore_extensions}
	},
	locales: ${locales},
	packages: ${packages},
	project: {
		id: "${project_id | jsQuoteEscapeFilter}",
		name: "${project_name | jsQuoteEscapeFilter}"
	},
	ti: {
		buildHash: "${ti_githash | jsQuoteEscapeFilter}",
		buildDate: "${ti_timestamp | jsQuoteEscapeFilter}",
		colorsModule: "Ti/_/colors",
		filesystem: {
			registry: "${ti_fs_registry}"
		},
		theme: "${ti_theme | jsQuoteEscapeFilter}",
		version: "${ti_version | jsQuoteEscapeFilter}"
	},
	vendorPrefixes: {
		css: ["", "-webkit-", "-moz-", "-ms-", "-o-", "-khtml-"],
		dom: ["", "Webkit", "Moz", "ms", "O", "Khtml"]
	}
};

window.hasWP8Extensions = ${has_wp8_extensions};