/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

exports.bootstrap = function(Titanium) {
	var ListView = Titanium.UI.ListView;

	function createListView(scopeVars, options) {
		var templates = options.templates;
		if (templates !== undefined) {
			for (var template in templates) {
				processProperties(templates[template]);
			}
		}
		var listView = new ListView(options);
		return listView;
	}

	function processProperties(properties) {
		if (!properties.hasOwnProperty('childTemplates')) return;
		
		var childProperties = properties.childTemplates;
		for (var i = 0; i < childProperties.length; i++) {
			var child = childProperties[i];
			if (child.hasOwnProperty('type')) {
				var childProxy = lookup(child.type)();
				child.type = childProxy;
			}
			if (child.hasOwnProperty('childTemplates')) {
				processProperties(child);
			}
		}
		
		
	}
	
	function lookup(name) {
		var lastDotIndex = name.lastIndexOf('.');
		var proxy = eval(name.substring(0, lastDotIndex));
		if (typeof(proxy) == undefined) return;

		var proxyName = name.slice(lastDotIndex + 1);
		return proxy['create' + proxyName];
	}

	Titanium.UI.createListView = createListView;

}

