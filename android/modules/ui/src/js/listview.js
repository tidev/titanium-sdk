/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global Module */
'use strict';

exports.bootstrap = function (Titanium) {
	var ListView = Titanium.UI.ListView;

	function createListView(scopeVars, options) {
		if (options !== undefined) {
			var templates = options.templates;
			if (templates !== undefined) {
				for (var binding in templates) {
					var currentTemplate = templates[binding];
					// process template
					processTemplate(currentTemplate);
					// process child templates
					processChildTemplates(currentTemplate);
				}
			}
		}
		var listView = new ListView(options);

		return listView;
	}

	// Create ListItemProxy, add events, then store it in 'tiProxy' property
	function processTemplate(properties) {
		var cellProxy = Titanium.UI.createListItem();
		properties.tiProxy = cellProxy;
		var events = properties.events;
		addEventListeners(events, cellProxy);
	}

	// Recursive function that process childTemplates and append corresponding proxies to
	// property 'tiProxy'. I.e: type: "Titanium.UI.Label" -> tiProxy: LabelProxy object
	function processChildTemplates(properties) {
		if (!Object.prototype.hasOwnProperty.call(properties, 'childTemplates')) {
			return;
		}

		var childProperties = properties.childTemplates;
		if (childProperties === undefined || childProperties === null) {
			return;
		}

		for (var i = 0; i < childProperties.length; i++) {
			var child = childProperties[i];
			var proxyType = child.type;
			if (proxyType !== undefined) {
				var creationProperties = child.properties;
				var creationFunction = lookup(proxyType);
				var childProxy;
				// create the proxy
				if (creationProperties !== undefined) {
					childProxy = creationFunction(creationProperties);
				} else {
					childProxy = creationFunction();
				}
				// add event listeners
				var events = child.events;
				addEventListeners(events, childProxy);
				// append proxy to tiProxy property
				child.tiProxy = childProxy;
			}

			processChildTemplates(child);

		}

	}

	// add event listeners
	function addEventListeners(events, proxy) {
		if (events !== undefined) {
			for (var eventName in events) {
				proxy.addEventListener(eventName, events[eventName]);
			}
		}
	}

	function lookupProxyConstructor(namespace) {
		const namespaceIndex = namespace.lastIndexOf('.');
		const proxyName = namespace.slice(namespaceIndex + 1);
		const parentNamespace = namespace.substring(0, namespaceIndex);
		const segments = parentNamespace.split('.');
		let parentProxy = global;
		for (let i = 0; i < segments.length; i++) {
			parentProxy = parentProxy[segments[i]];
		}
		let method = null;
		if (parentProxy) {
			method = parentProxy['create' + proxyName];
		}
		if (method) {
			return method;
		} else {
			throw new Error('Could not lookup constructor for namespace: "' + namespace + '"');
		}
	}

	// convert name of UI elements into a constructor function.
	// I.e: lookup("Titanium.UI.Label") returns Titanium.UI.createLabel function
	function lookup(namespace) {

		// handle Titanium widgets
		if (/^(Ti|Titanium)/.test(namespace)) {
			return lookupProxyConstructor(namespace);

		// handle Alloy widgets
		} else {
			let widget;
			try {
				// attempt to load alloy widget
				widget = Module.main.require('/alloy/widgets/' + namespace + '/controllers/widget');
			} catch (e) {
				try {
					// widget does not exist, attempt to load namespace
					widget = Module.main.require(namespace);
				} catch (err) {
					// namespace does not exist, fall back to legacy behaviour
					return lookupProxyConstructor(namespace);
				}
			}
			if (widget) {
				return function (parameters) {
					const obj = new widget(parameters);
					return obj.getView();
				};
			}
		}
	}

	// overwrite list view constructor function with our own.
	Titanium.UI.createListView = createListView;

};
