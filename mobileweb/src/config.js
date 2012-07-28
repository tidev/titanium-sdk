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
		"declare-property-methods": true,
		"js-btoa": function(g) {
			return "btoa" in g;
		},
		"json-stringify": function(g) {
			return ("JSON" in g) && typeof JSON.stringify === "function" && JSON.stringify({a:0}, function(k,v){return v||1;}) === '{"a":1}';
		},
		"native-localstorage": function(g) {
			return "localStorage" in g && "setItem" in localStorage;
		},
		"object-defineproperty": function() {
			return (function (odp, obj) {
				try {
					odp && odp(obj, "x", {});
					return obj.hasOwnProperty("x");
				} catch (e) {}
			}(Object.defineProperty, {}));
		},
		"opera": typeof opera === "undefined" || opera.toString() != "[object Opera]",
		"ti-analytics-use-xhr": ${has_analytics_use_xhr | jsQuoteEscapeFilter},
		"ti-show-errors": ${has_show_errors | jsQuoteEscapeFilter},
		"ti-instrumentation": function(g) {
				return ${has_instrumentation | jsQuoteEscapeFilter} && g.instrumentation;
		}
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