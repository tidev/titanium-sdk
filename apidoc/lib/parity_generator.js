if (!String.prototype.contains) {
    String.prototype.contains = function (arg) {
        return !!~this.indexOf(arg);
    };
}
function sort(object) {
    var sorted = {}, key, array = [];
    for (key in object)
		if (object.hasOwnProperty(key))
			array.push(key);
    array.sort();
    for (key=0;key<array.length;key++)
		sorted[array[key]] = object[array[key]];
    return sorted;
}
function sortByKey(array, key) {
    return array.sort(
		function(a, b) {
			var x = a[key], y = b[key];
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		}
	);
}

// Process api data into a parsable format
exports.exportData = function exportHTML(apis) {

	// Define return object
	var rv = { coverage:[], proxies:[], total_apis:0};
	
	// Sort proxies
	apis = sort(apis);
	
	// Iterate through proxies
	for (className in apis) {
		
		// Skip platform specific proxies
		/*if (className == 'Titanium'
			|| className.contains('iOS') || className.contains('iPhone') || className.contains('iPad')
			|| className.contains('Android') || className.contains('Tizen')
		) continue;*/
	    
		var api = apis[className];
		var pseudo = (api.__subtype == 'pseudo');
		var proxy = {name:className, pseudo : pseudo, platforms:api.platforms, properties:[], methods:[], events:[]};
		
		// Sort property, method and event arrays
		api.properties = sortByKey(api.properties, 'name');
		api.methods = sortByKey(api.methods, 'name');
		api.events = sortByKey(api.events, 'name');
		
		// Add property, method, and event data into proxy object
		for (i in api.properties) {
			var property = api.properties[i];
			proxy.properties.push({name:property.name, platforms:property.platforms});
			if (!pseudo) updateCoverage(rv.coverage, property.platforms);
		}
		for (i in api.methods) {
			var method = api.methods[i];
			proxy.methods.push({name:method.name, platforms:method.platforms});
			if (!pseudo) updateCoverage(rv.coverage, method.platforms);
		}
		for (i in api.events) {
			var event = api.events[i];
			proxy.events.push({name:event.name, platforms:event.platforms});
			if (!pseudo) updateCoverage(rv.coverage, event.platforms);
		}
		
		// Update return object
		rv.proxies.push(proxy);
		rv.total_apis += api.properties.length + api.methods.length + api.events.length + 1;
		
		if (!pseudo) updateCoverage(rv.coverage, api.platforms);
	}
	
	return rv;
}

// Update API coverage statistic for each platform
function updateCoverage(coverage, platforms) {
	for (i in platforms) {
		var platform = platforms[i];
		if (platform in coverage) {
			coverage[platform] += 1;
		} else {
			coverage[platform] = 1;
		}
	}
}