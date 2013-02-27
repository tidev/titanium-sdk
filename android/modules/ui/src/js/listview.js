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
		if (templates !== void 0) {
			for (var template in templates) {
				//process template
				processTemplate(templates[template]);
				//process child templates
				processChildTemplates(templates[template]);
			}
		}
		var listView = new ListView(options);
		return listView;
	}
	
	function processTemplate(properties) {
	   	var cellProxy = Titanium.UI.createListItem();
		properties.type = cellProxy;
    	var events = properties.events;
    	addEventListeners(events, cellProxy);
	}

    //Recursive function to process childTemplates and change the value of 'type'
    //property to the corresponding proxy. I.e: type: "Titanium.UI.Label" -> type: LabelProxy object
	function processChildTemplates(properties) {
		if (!properties.hasOwnProperty('childTemplates')) return;
		
		var childProperties = properties.childTemplates;
		for (var i = 0; i < childProperties.length; i++) {
			var child = childProperties[i];
			var proxyType = child.type;
			if (proxyType !== void 0) {
				var creationProperties = child.properties;
				var creationFunction = lookup(proxyType);
				var childProxy;
				//create the proxy
				if (creationProperties !== void 0) {
					childProxy = creationFunction(creationProperties);
				} else {
					childProxy = creationFunction();
				}
				//add event listeners
				var events = child.events;
				addEventListeners(events, childProxy);
				//change value of 'type' to proxy
				child.type = childProxy;
			}

			processChildTemplates(child);
			
		}
		
		
	}
	
	//add event listeners
	function addEventListeners(events, proxy) {
		if (events !== void 0) {
			for (var eventName in events) {
				proxy.addEventListener(eventName, events[eventName]);
			}
		}
	}
	
	//convert name of UI elements into a constructor function.
	//I.e: lookup("Titanium.UI.Label") returns Titanium.UI.createLabel function
	function lookup(name) {
		var lastDotIndex = name.lastIndexOf('.');
		var proxy = eval(name.substring(0, lastDotIndex));
		if (typeof(proxy) == undefined) return;

		var proxyName = name.slice(lastDotIndex + 1);
		return proxy['create' + proxyName];
	}

	//overwrite list view constructor function with our own.
	Titanium.UI.createListView = createListView;

}

