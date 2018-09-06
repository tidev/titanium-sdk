/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

exports.bootstrap = function(Titanium) {
	var ListView = Titanium.UI.ListView;
	var Ti = Titanium;
	function createListView(scopeVars, options) {
		if (options !== void 0) {
			var templates = options.templates;
			if (templates !== void 0) {
				for (var binding in templates) {
					var currentTemplate = templates[binding];
					//process template
					processTemplate(currentTemplate);
					//process child templates
					processChildTemplates(currentTemplate);
				}
			}
		}
		var listView = new ListView(options);
		
		return listView;
	}
	
	//Create ListItemProxy, add events, then store it in 'tiProxy' property
	function processTemplate(properties) {
	   	var cellProxy = Titanium.UI.createListItem();
		properties.tiProxy = cellProxy;
		var events = properties.events;
		addEventListeners(events, cellProxy);
	}

	//Recursive function that process childTemplates and append corresponding proxies to
	//property 'tiProxy'. I.e: type: "Titanium.UI.Label" -> tiProxy: LabelProxy object
	function processChildTemplates(properties) {
		if (!properties.hasOwnProperty('childTemplates')) return;
		
		var childProperties = properties.childTemplates;
		if (childProperties === void 0 || childProperties === null) return;
		
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
				//append proxy to tiProxy property
				child.tiProxy = childProxy;
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
	function lookup(namespace) {

		// handle Titanium widgets
		if (/^(Ti|Titanium)/.test(namespace)) {
			const namespaceIndex = namespace.lastIndexOf('.'),
				  proxyName = namespace.slice(namespaceIndex + 1),
				  parentNamespace = namespace.substring(0, namespaceIndex),
				  parentProxy = eval(parentNamespace);
	
			if (parentProxy) {
				return parentProxy['create' + proxyName];
			}
	
		// handle Alloy widgets
		} else {
			let widget = Module.main.require('/alloy/widgets/' + namespace + '/controllers/widget');
			if (!widget) {
					Module.main.require(namespace);
			}
			if (widget) {
				return function (parameters) {
					const obj = new widget(parameters);
					return obj.getView();
				};
			}
		}
	}

	//overwrite list view constructor function with our own.
	Titanium.UI.createListView = createListView;

}

