var require = {
	analytics: ${app_analytics | jsQuoteEscapeFilter},
	app: {
		copyright: "${app_copyright | jsQuoteEscapeFilter}",
		description: "${app_description | jsQuoteEscapeFilter}",
		guid: "${app_guid | jsQuoteEscapeFilter}",
		id: "${app_name | jsQuoteEscapeFilter}",
		name: "${app_name | jsQuoteEscapeFilter}",
		publisher: "${app_publisher | jsQuoteEscapeFilter}",
		url: "${app_url | jsQuoteEscapeFilter}",
		version: "${app_version | jsQuoteEscapeFilter}"
	},
	deployType: "${deploy_type | jsQuoteEscapeFilter}",
	has: {
		"analytics-use-xhr": false,
		"declare-property-methods": true,
		"json-stringify": function(g) {
	        return ("JSON" in window) && JSON.toString() == "[object Function]" && JSON.stringify({a:0}, function(k,v){return v||1;}) !== '{"a":1}'
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
	},
	packages: ${packages},
	project: {
		id: "${project_id | jsQuoteEscapeFilter}",
		name: "${project_name | jsQuoteEscapeFilter}"
	},
	ti: {
		buildHash: "${ti_githash | jsQuoteEscapeFilter}",
		buildDate: "${ti_timestamp | jsQuoteEscapeFilter}",
		version: "${ti_version | jsQuoteEscapeFilter}"
	},
	vendorPrefixes: {
		css: ["", "-webkit-", "-moz-", "-ms-", "-o-", "-khtml-"],
		dom: ["", "Webkit", "Moz", "ms", "O", "Khtml"]
	}
};