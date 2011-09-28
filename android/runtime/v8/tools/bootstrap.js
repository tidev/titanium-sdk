
var customProperties = {};

function lazyGet(object, binding, name) {
	delete object[name];
	object[name] = kroll.binding(binding)[name];
	if (binding in customProperties) {
		Object.defineProperties(object[name], customProperties[binding]);
	}
	return object[name];
}

exports.defineProperties = function(binding, properties) {
	if (!(binding in customProperties)) {
		customProperties[binding] = {};
	}

	customProperties[binding].extend(properties);
};

exports.bootstrap = function(Titanium) {
	// Below this is where the generated code
	// from genBootstrap.py goes
	// ----
	%(bootstrap)s
};
