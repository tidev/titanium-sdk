var url = require("url"),
	Script = kroll.binding("evals").Script;

function include(filename, baseUrl, sandbox) {
	var path = filename;
	var sourceUrl = url.resolve(baseUrl, filename);

	if (sourceUrl.assetPath) {
		path = url.toAssetPath(sourceUrl);

	} else if (sourceUrl.filePath) {
		path = url.toFilePath(sourceUrl);
	}

	// Delegate back to Java for evaluation in Rhino to correctly
	// handle pre-compiled JS classes
	Script.runInSandbox(path, getSourceUrl(sourceUrl), sandbox);
}
exports.include = include;


// De-mangle appdata://*.jar based URLs to look like "*.js"
// This is currently only used for Drillbit
function getSourceUrl(sourceUrl) {
	var tiUrl = sourceUrl.href;
	var jarIndex = -1;

	if ((jarIndex = tiUrl.indexOf(".jar:")) >= 0) {
		tiUrl = "app://" + tiUrl.substring(jarIndex + 5) + ".js";
	}
	return tiUrl;
}
exports.getSourceUrl = getSourceUrl;