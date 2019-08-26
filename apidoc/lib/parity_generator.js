/**
* Copyright (c) 2015-2017 Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License.
*/
'use strict';

if (!String.prototype.contains) {
	/**
	 * Add contains function
	 * @param {string} arg substring to search for
	 * @return {boolean}
	 */
	String.prototype.contains = function (arg) {
		return !!~this.indexOf(arg);
	};
}

/**
 * Sort the object by its keys
 * @param {object} object the object
 * @return {object}
 */
function sort(object) {
	const sorted = {};
	const array = [];
	for (const key in object) {
		if (Object.prototype.hasOwnProperty.call(object, key)) {
			array.push(key);
		}
	}
	array.sort();
	for (let x = 0; x < array.length; x++) {
		sorted[array[x]] = object[array[x]];
	}
	return sorted;
}

/**
 * Sort object by keys
 * @param {array} array the array to sort
 * @param {object} key property to use to sort
 * @return {array} sorted array
 */
function sortByKey(array, key) {
	return array.sort(
		function (a, b) {
			const x = a[key],
				y = b[key];
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
	);
}

/**
 * Remove keys
 * @param {array} arrayA array to trim
 * @param {array} arrayB array of items to remove
 */
function removeKeys (arrayA, arrayB) {
	for (const elt in arrayB) {
		const index = arrayA.indexOf(elt);
		if (index !== -1) {
			arrayA.splice(index, 1);
		}
	}
}

/**
 * Process API data into a parsable format
 * @param {object[]} apis full api tree
 * @return {object}
 */
exports.exportData = function exportHTML(apis) {
	// Define return object
	const rv = {
		coverage: [],
		proxies: [],
		totalAPIs: 0
	};

	// Sort proxies
	apis = sort(apis);

	// Iterate through proxies
	for (const className in apis) {

		// Skip platform specific proxies
		/* if (className == 'Titanium'
			|| className.contains('iOS') || className.contains('iPhone') || className.contains('iPad')
			|| className.contains('Android') || className.contains('Tizen')
		) continue;*/

		const api = apis[className];
		const pseudo = (api.__subtype === 'pseudo');
		const proxy = { name: className, pseudo: pseudo, platforms: api.platforms, properties: [], methods: [], events: [] };

		// Sort property, method and event arrays
		api.properties = sortByKey(api.properties, 'name');
		api.methods = sortByKey(api.methods, 'name');
		api.events = sortByKey(api.events, 'name');

		// Add property, method, and event data into proxy object
		for (const property of api.properties) {
			if (property.__hide) {
				continue;
			}
			proxy.properties.push({ name: property.name, platforms: property.platforms });
			if (!pseudo) {
				updateCoverage(rv.coverage, property.platforms);
			}
		}
		for (const method of api.methods) {
			if (method.__hide) {
				continue;
			}
			proxy.methods.push({ name: method.name, platforms: method.platforms });
			if (!pseudo) {
				updateCoverage(rv.coverage, method.platforms);
			}
		}
		for (const event of api.events) {
			if (event.__hide) {
				continue;
			}
			proxy.events.push({ name: event.name, platforms: event.platforms });
			if (!pseudo) {
				updateCoverage(rv.coverage, event.platforms);
			}
		}
		// Update return object
		rv.proxies.push(proxy);
		// Skip platform specific proxies from api count
		if (!className.contains('iOS') && !className.contains('iPhone')
			&& !className.contains('iPad') && !className.contains('Android')
			&& !className.contains('Tizen')) {
			rv.totalAPIs += api.properties.length + api.methods.length + api.events.length + 1;
		}

		if (!pseudo) {
			updateCoverage(rv.coverage, api.platforms);
		}
	}

	const coverage = {};
	[ 'iphone', 'ipad', 'android', 'windowsphone' ].forEach(function (platform) {
		if (platform in rv.coverage) {
			coverage[platform] = rv.coverage[platform];
			delete rv.coverage[platform];
		}
	});

	for (const name in rv.proxies) {
		removeKeys(rv.proxies[name].platforms, rv.coverage);
	}

	rv.coverage = coverage;

	return rv;
};

/**
 * Update API coverage statistic for each platform
 * @param {Object} coverage coverage object
 * @param {string[]} platforms list of platform
 */
function updateCoverage(coverage, platforms) {
	for (const platform of platforms) {
		if (platform in coverage) {
			coverage[platform] += 1;
		} else {
			coverage[platform] = 1;
		}
	}
}
