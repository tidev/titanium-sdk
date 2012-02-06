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
		"declare-property-methods": true
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