/**
 * Titanium SDK Library for Node.js
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var appc = require('node-appc'),
	DOMParser = require('xmldom').DOMParser,
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	xml = appc.xml,

	androidAttrPrefixRegExp = /^android\:/,
	defaultDOMParserArgs = { errorHandler: function(){} };

module.exports = AndroidManifest;

/*
function toXml(dom, parent, name, value) {
	// properties is a super special case
	if (name == 'properties') {
		Object.keys(value).forEach(function (v) {
			dom.create('property', {
				name: v,
				type: value[v].type || 'string',
				nodeValue: value[v].value
			}, parent);
		});
		return;
	}

	var node = dom.create(name, null, parent);

	switch (name) {
		case 'deployment-targets':
			Object.keys(value).forEach(function (v) {
				dom.create('target', {
					device: v,
					nodeValue: value[v]
				}, node);
			});
			break;

		case 'android':
			node.setAttribute('xmlns:android', 'http://schemas.android.com/apk/res/android');

			if (value.manifest) {
				node.appendChild(dom.createTextNode('\r\n' + new Array(3).join('\t')));
				node.appendChild(new DOMParser(defaultDOMParserArgs).parseFromString(value.manifest))
			}

			if (value.hasOwnProperty('tool-api-level')) {
				dom.create('tool-api-level', { nodeValue: value['tool-api-level'] }, node);
			}

			if (value.hasOwnProperty('proguard')) {
				dom.create('proguard', { nodeValue: !!value.proguard }, node);
			}

			if (value.hasOwnProperty('abi')) {
				dom.create('abi', { nodeValue: value.abi }, node);
			}

			if (value.activities) {
				dom.create('activities', null, node, function (node) {
					Object.keys(value.activities).forEach(function (url) {
						var attrs = {};
						Object.keys(value.activities[url]).forEach(function (attr) {
							attr != 'classname' && (attrs[attr] = value.activities[url][attr]);
						});
						dom.create('activity', attrs, node);
					});
				});
			}

			if (value.services) {
				dom.create('services', null, node, function (node) {
					Object.keys(value.services).forEach(function (url) {
						var attrs = {};
						Object.keys(value.services[url]).forEach(function (attr) {
							attr != 'classname' && (attrs[attr] = value.services[url][attr]);
						});
						dom.create('service', attrs, node);
					});
				});
			}
			break;

		case 'mobileweb':
			Object.keys(value).forEach(function (prop) {
				switch (prop) {
					case 'build':
						dom.create('build', null, node, function (build) {
							Object.keys(value.build).forEach(function (name) {
								dom.create(name, null, build, function (deployment) {
									Object.keys(value.build[name]).forEach(function (d) {
										var val = value.build[name][d];
										switch (d) {
											case 'js':
											case 'css':
											case 'html':
												dom.create(d, null, deployment, function (type) {
													Object.keys(val).forEach(function (v) {
														dom.create(v, { nodeValue: val[v] }, type);
													});
												});
												break;

											default:
												dom.create(d, { nodeValue: val }, deployment);
										}
									});
								});
							});
						});
						break;

					case 'analytics':
					case 'filesystem':
					case 'map':
					case 'splash':
					case 'unsupported-platforms':
						dom.create(prop, null, node, function (section) {
							Object.keys(value[prop]).forEach(function (key) {
								dom.create(key, { nodeValue: value[prop][key] }, section);
							});
						});
						break;

					case 'precache':
						dom.create('precache', null, node, function (precache) {
							Object.keys(value[prop]).forEach(function (type) {
								value[prop][type].forEach(function (n) {
									dom.create(type, { nodeValue: n }, precache);
								});
							});
						});
						break;

					default:
						dom.create(prop, { nodeValue: value[prop] }, node);
				}
			});
			break;

		default:
			node.appendChild(dom.createTextNode(value));
			return;
	}

	node.appendChild(dom.createTextNode('\r\n' + new Array(2).join('\t')));
}
*/

function initAttr(node, obj) {
	xml.forEachAttr(node, function (attr) {
		obj.__attr__ || (obj.__attr__ = {});
		obj.__attr__[attr.name] = xml.parse(attr.value);
	});
	return obj;
}

function initSingleObject(node, obj) {
	var tmp = obj[node.tagName] = {};
	xml.forEachAttr(node, function (attr) {
		tmp[attr.name.replace(androidAttrPrefixRegExp, '')] = xml.parse(attr.value);
	});
}

function attrsToObj(node) {
	var a = {};
	xml.forEachAttr(node, function (attr) {
		a[attr.name.replace(androidAttrPrefixRegExp, '')] = xml.parse(attr.value);
	});
	return a;
}

function initObjectByName(node, obj) {
	var tmp = obj[node.tagName] || (obj[node.tagName] = {}),
		a = attrsToObj(node);
	if (a.name) {
		tmp[a.name] = a;
		return a;
	}
}

function initArray(node, obj, fn) {
	var tmp = obj[node.tagName] || (obj[node.tagName] = []);
	initAttr(node, tmp);
	fn(tmp);
}

function toJS(obj, doc) {
	initAttr(doc, obj);

	xml.forEachElement(doc, function (node) {
		switch (node.tagName) {
			case 'application':
				// application object
				var app = obj[node.tagName] = attrsToObj(node);

				xml.forEachElement(node, function (node) {
					switch (node.tagName) {
						case 'activity':
						case 'activity-alias':
						case 'receiver':
						case 'service':
							var it = initObjectByName(node, app);
							if (it) {
								if (node.tagName == 'activity') {
									it.configChanges && (it.configChanges = it.configChanges.split('|'));
									it.windowSoftInputMode && (it.windowSoftInputMode = it.windowSoftInputMode.split('|'));
								}

								xml.forEachElement(node, function (node) {
									switch (node.tagName) {
										case 'intent-filter':
											// action, category, data
											break;

										case 'meta-data':
											Object.prototype.toString.call(it['meta-data']) == '[object Object]' || (it['meta-data'] = {});
											initObjectByName(node, it);
											break;
									}
								});
							}
							break;

						case 'provider':
							var provider = initObjectByName(node, app);
							provider && xml.forEachElement(node, function (node) {
								switch (node.tagName) {
									case 'grant-uri-permission':
									case 'path-permission':
										Array.isArray(provider[node.tagName]) || (provider[node.tagName] = []);
										provider[node.tagName].push(attrsToObj(node));
										break;

									case 'meta-data':
										Object.prototype.toString.call(provider['meta-data']) == '[object Object]' || (provider['meta-data'] = {});
										initObjectByName(node, provider);
										break;
								}
							});
							break;

						case 'uses-library':
							Object.prototype.toString.call(app['uses-library']) == '[object Object]' || (app['uses-library'] = {});
							var a = attrsToObj(node);
							a.name && (app['uses-library'][a.name] = a);
							break;
					}
				});
				break;

			case 'compatible-screens':
				// array of screen objects
				initArray(node, obj, function (compatibleScreens) {
					xml.forEachElement(node, function (node) {
						node.tagName == 'screen' && compatibleScreens.push(attrsToObj(node));
					});
				});
				break;

			case 'instrumentation':
			case 'permission':
			case 'permission-group':
			case 'permission-tree':
			case 'uses-feature':
			case 'uses-library':
				// object with objects keyed by name
				initObjectByName(node, obj);
				break;

			case 'supports-screens':
			case 'uses-sdk':
				// single instance tags
				initSingleObject(node, obj);
				break;

			case 'uses-configuration':
				// array of objects
				Array.isArray(obj[node.tagName]) || (obj[node.tagName] = []);
				obj[node.tagName].push(attrsToObj(node));
				break;

			case 'supports-gl-texture':
			case 'uses-permission':
				// array of names
				var a = node.getAttribute('android:name');
				if (a) {
					Array.isArray(obj[node.tagName]) || (obj[node.tagName] = []);
					obj[node.tagName].push(a.replace(androidAttrPrefixRegExp, ''));
				}
				break;
		}
	});
}

function AndroidManifest(filename) {
	Object.defineProperty(this, 'load', {
		value: function (file) {
			if (!fs.existsSync(file)) {
				throw new Error('AndroidManifest.xml file does not exist');
			}
			toJS(this, (new DOMParser(defaultDOMParserArgs).parseFromString(fs.readFileSync(file).toString(), 'text/xml')).documentElement);
			return this;
		}
	});

	Object.defineProperty(this, 'parse', {
		value: function (str) {
			toJS(this, (new DOMParser(defaultDOMParserArgs).parseFromString(str, 'text/xml')).documentElement);
			return this;
		}
	});

	Object.defineProperty(this, 'toString', {
		value: function (fmt) {
			if (fmt == 'xml') {
				var dom = new DOMParser(defaultDOMParserArgs).parseFromString('<manifest>', 'text/xml');

				dom.create = function (tag, attrs, parent, callback) {
					var node = dom.createElement(tag),
						i = 0,
						p = parent;

					attrs && Object.keys(attrs).forEach(function (attr) {
						if (attr == 'nodeValue') {
							node.appendChild(dom.createTextNode(''+attrs[attr]));
						} else {
							attrs[attr] != void 0 && node.setAttribute(attr, ''+attrs[attr]);
						}
					});

					if (p) {
						while (p.parentNode) {
							i++;
							p = p.parentNode;
						}
						parent.appendChild(dom.createTextNode('\r\n' + new Array(i+1).join('\t')));
					}

					parent && parent.appendChild(node);
					if (callback) {
						callback(node);
						node.appendChild(dom.createTextNode('\r\n' + new Array(i+1).join('\t')));
					}
					return node;
				};

				Object.keys(this).forEach(function (key) {
					//toXml(dom, dom.documentElement, key, this[key]);
				}, this);

				dom.documentElement.appendChild(dom.createTextNode('\r\n'));

				return '<?xml version="1.0" encoding="UTF-8"?>\n' + dom.documentElement.toString();
			} else if (fmt == 'pretty-json') {
				return JSON.stringify(this, null, '\t');
			} else if (fmt == 'json') {
				return JSON.stringify(this);
			}
			return Object.prototype.toString.call(this);
		}
	});

	Object.defineProperty(this, 'save', {
		value: function (file) {
			if (file) {
				wrench.mkdirSyncRecursive(path.dirname(file));
				fs.writeFileSync(file, this.toString('xml'));
			}
			return this;
		}
	});

	filename && this.load(filename);
}
