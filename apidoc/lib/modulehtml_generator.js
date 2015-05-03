/**
 * Script to export JSON to HTML-annotated JSON for EJS templates
 */
var exporter = require('./html_generator.js');

/**
 * Returns a JSON object formatted for HTML EJS templates
 * @param {Object} apis
 */
exports.exportData = function exportModuleHTML (apis) {
	var rv = {
			'proxy': [],
			'event': [],
			'method': [],
			'property': []
		},
		data = exporter.exportData(apis),
		modules = apis.__modules;

	for (var cls in data.proxy) {
		if (~modules.indexOf(data.proxy[cls].name)) {
			data.proxy[cls].isModule = true;
			rv.proxy = rv.proxy.concat(data.proxy[cls]);
		}
	}
	return rv;
};
