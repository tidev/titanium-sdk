/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global Module */
'use strict';

exports.bootstrap = function (Titanium) {
	const ListView = Titanium.UI.ListView;
	const defaultTemplate = {
		properties: {
			height: '45dp'
		},
		childTemplates: [
			{
				type: 'Ti.UI.Label',
				bindId: 'title',
				properties: {
					left: '6dp',
					width: '75%'
				}
			},
			{
				type: 'Ti.UI.ImageView',
				bindId: 'image',
				properties: {
					right: '25dp',
					width: '15%'
				}
			}
		]
	};

	function createListView(scopeVars, options) {
		if (!options) {
			options = {};
		}
		options.templates = {
			[Titanium.UI.LIST_ITEM_TEMPLATE_DEFAULT]: defaultTemplate,
			...options.templates
		};

		const templates = options.templates;
		for (const binding in templates) {
			const currentTemplate = templates[binding];

			processTemplate(currentTemplate);
			processChildTemplates(currentTemplate);
		}

		return new ListView(options);
	}

	// Create ListItemProxy, add events, then store it in 'tiProxy' property
	function processTemplate(properties) {
		const cellProxy = Titanium.UI.createListItem();
		const events = properties.events;

		properties.tiProxy = cellProxy;
		addEventListeners(events, cellProxy);
	}

	// Recursive function that process childTemplates and append corresponding proxies to
	// property 'tiProxy'. I.e: type: "Titanium.UI.Label" -> tiProxy: LabelProxy object
	function processChildTemplates(properties) {
		if (!Object.prototype.hasOwnProperty.call(properties, 'childTemplates')) {
			return;
		}

		const childProperties = properties.childTemplates;
		if (!childProperties) {
			return;
		}

		for (let i = 0; i < childProperties.length; i++) {
			const child = childProperties[i];
			const proxyType = child.type;

			if (proxyType) {
				const creationProperties = child.properties;
				const creationFunction = lookup(proxyType);

				// Create proxy.
				let childProxy;
				if (creationProperties) {
					childProxy = creationFunction(creationProperties);
				} else {
					childProxy = creationFunction();
				}
				// Add event listeners.
				const events = child.events;
				addEventListeners(events, childProxy);

				// Append proxy to tiProxy property.
				child.tiProxy = childProxy;
			}

			processChildTemplates(child);
		}

	}

	// Add event listeners.
	function addEventListeners(events, proxy) {
		if (events !== undefined) {
			for (const eventName in events) {
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

	// Convert name of UI elements into a constructor function.
	// i.e: lookup("Titanium.UI.Label") returns Titanium.UI.createLabel function.
	function lookup(namespace) {

		// Handle Titanium widgets.
		if (/^(Ti|Titanium)/.test(namespace)) {
			return lookupProxyConstructor(namespace);

		// Handle Alloy widgets.
		} else {
			let widget;
			try {
				// Attempt to load alloy widget.
				widget = Module.main.require('/alloy/widgets/' + namespace + '/controllers/widget');
			} catch (e) {
				try {
					// Widget does not exist, attempt to load namespace.
					widget = Module.main.require(namespace);
				} catch (err) {
					// Namespace does not exist, fall back to legacy behaviour.
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

	// Overwrite list view constructor function with our own.
	Titanium.UI.createListView = createListView;
};
