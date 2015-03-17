/**
* Copyright (c) 2015 Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License.
*/

if (!String.prototype.contains) {
	/**
	 * Add contains function
	 */
	String.prototype.contains = function (arg) {
		return !!~this.indexOf(arg);
	};
}

/**
 * Sort the object by its keys
 */
function sort(object) {
	var sorted = {}, key, array = [];
	for (key in object) {
		if (object.hasOwnProperty(key)) {
			array.push(key);
		}
	}
	array.sort();
	for (key = 0; key < array.length; key++) {
		sorted[array[key]] = object[array[key]];
	}
	return sorted;
}

/**
 * Sort object by keys
 */
function sortByKey(array, key) {
	return array.sort(
		function (a, b) {
			var x = a[key], y = b[key];
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
	);
}

/**
 * Remove keys
 */
function removeKeys (arrayA, arrayB) {
	for (var i in arrayB) {
		i = arrayA.indexOf(i);
		if (i !== -1) {
			arrayA.splice(i, 1);
		}
	}
}

/**
 * Process API data into a parsable format
 */
exports.exportData = function exportHTML(apis) {

	// Define return object
	var rv = {coverage:[], proxies:[], totalAPIs:0};

	// Sort proxies
	apis = sort(apis);

	// Iterate through proxies
	for (var className in apis) {

		// Skip platform specific proxies
		/*if (className == 'Titanium'
			|| className.contains('iOS') || className.contains('iPhone') || className.contains('iPad')
			|| className.contains('Android') || className.contains('Tizen')
		) continue;*/

		var api = apis[className];
		var pseudo = (api.__subtype === 'pseudo');
		var proxy = {name:className, pseudo : pseudo, platforms:api.platforms, properties:[], methods:[], events:[]};
		var i = 0;

		// Sort property, method and event arrays
		api.properties = sortByKey(api.properties, 'name');
		api.methods = sortByKey(api.methods, 'name');
		api.events = sortByKey(api.events, 'name');

		// Add property, method, and event data into proxy object
		for (i in api.properties) {
			var property = api.properties[i];
			proxy.properties.push({name:property.name, platforms:property.platforms});
			if (!pseudo) {
				updateCoverage(rv.coverage, property.platforms);
			}
		}
		for (i in api.methods) {
			var method = api.methods[i];
			proxy.methods.push({name:method.name, platforms:method.platforms});
			if (!pseudo) {
				updateCoverage(rv.coverage, method.platforms);
			}
		}
		for (i in api.events) {
			var event = api.events[i];
			proxy.events.push({name:event.name, platforms:event.platforms});
			if (!pseudo) {
				updateCoverage(rv.coverage, event.platforms);
			}
		}
		// Update return object
		rv.proxies.push(proxy);
		// Skip platform specific proxies from api count
		if (!className.contains('iOS') && !className.contains('iPhone') &&
			!className.contains('iPad') && !className.contains('Android') &&
			!className.contains('Tizen')) {
			rv.totalAPIs += api.properties.length + api.methods.length + api.events.length + 1;
		}

		if (!pseudo) {
			updateCoverage(rv.coverage, api.platforms);
		}
	}

	var coverage = {};

	if ('iphone' in rv.coverage) { coverage.iphone = rv.coverage.iphone; delete rv.coverage.iphone; }
	if ('ipad' in rv.coverage) { coverage.ipad = rv.coverage.ipad; delete rv.coverage.ipad; }
	if ('android' in rv.coverage) { coverage.android = rv.coverage.android; delete rv.coverage.android; }
	if ('windowsphone' in rv.coverage) { coverage.windowsphone = rv.coverage.windowsphone; delete rv.coverage.windowsphone; }
	if ('blackberry' in rv.coverage) { coverage.blackberry = rv.coverage.blackberry; delete rv.coverage.blackberry; }
	if ('mobileweb' in rv.coverage) { coverage.mobileweb = rv.coverage.mobileweb; delete rv.coverage.mobileweb; }

	for (var name in rv.proxies) {
		removeKeys(rv.proxies[name].platforms, rv.coverage);
	}

	rv.coverage = coverage;

	return rv;
};

/**
 * Update API coverage statistic for each platform
 * @param {Object} coverage
 * @param {Object} platforms
 */
function updateCoverage(coverage, platforms) {
	for (var i in platforms) {
		var platform = platforms[i];
		if (platform in coverage) {
			coverage[platform] += 1;
		} else {
			coverage[platform] = 1;
		}
	}
}
