/**
 * Titanium SDK Library for Node.js
 * Copyright (c) 2012-2017 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

'use strict';

const appc = require('node-appc'),
	DOMParser = require('xmldom').DOMParser,
	fs = require('fs-extra'),
	path = require('path'),
	xml = appc.xml,
	__ = appc.i18n(__dirname).__,

	androidAttrPrefixRegExp = /^android:/,
	defaultDOMParserArgs = { errorHandler: function () {} },

	tags = {
		// according to http://developer.android.com/guide/topics/manifest/meta-data-element.html,
		// <meta-data> is not intended to be a direct descendent of <application> but it is required
		// that we support it so that we can pass a Google Maps API key to their library
		application: /^(activity|activity-alias|meta-data|provider|receiver|service|uses-library)$/
	},

	tagAttrs = {
		application: /^(allowTaskReparenting|allowBackup|allowClearUserData|backupAgent|backupInForeground|banner|debuggable|description|directBootAware|enabled|extractNativeLibs|fullBackupContent|fullBackupOnly|hasCode|hardwareAccelerated|icon|isGame|killAfterRestore|largeHeap|label|logo|manageSpaceActivity|name|networkSecurityConfig|permission|persistent|process|restoreAnyVersion|requiredAccountType|resizeableActivity|restrictedAccountType|roundIcon|supportsRtl|taskAffinity|testOnly|theme|uiOptions|usesCleartextTraffic|vmSafeMode)$/, // eslint-disable-line max-len
		activity: /^(allowEmbedded|allowTaskReparenting|alwaysRetainTaskState|autoRemoveFromRecents|banner|clearTaskOnLaunch|colorMode|configChanges|density|directBootAware|documentLaunchMode|enabled|excludeFromRecents|exported|finishOnTaskLaunch|hardwareAccelerated|icon|immersive|label|launchMode|lockTaskMode|maxRecents|maxAspectRatio|multiprocess|name|noHistory|parentActivityName|permission|persistableMode|process|relinquishTaskIdentity|resizeableActivity|screenOrientation|showForAllUsers|stateNotNeeded|supportsPictureInPicture|taskAffinity|theme|uiOptions|windowSoftInputMode)$/, // eslint-disable-line max-len
		'activity-alias': /^(enabled|exported|icon|label|name|permission|targetActivity)$/,
		data: /^(host|mimeType|path|pathPattern|pathPrefix|port|scheme)$/,
		'intent-filter': /^(icon|label|priority)$/,
		'meta-data': /^(name|resource|value)$/,
		'path-permission': /^(path|pathPrefix|pathPattern|permission|readPermissions|writePermissions)$/,
		provider: /^(authorities|directBootAware|enabled|exported|grantUriPermissions|icon|initOrder|label|multiprocess|name|permission|process|readPermission|syncable|writePermission)$/,
		receiver: /^(directBootAware|enabled|exported|icon|label|name|permission|process)$/,
		service: /^(description|directBootAware|enabled|exported|icon|isolatedProcess|label|name|permission|process)$/,
		'uses-library': /^(name|required)$/,
		'uses-sdk': /^(maxSdkVersion|minSdkVersion|targetSdkVersion)$/
	};

module.exports = AndroidManifest;

function toXml(dom, parent, name, value) {
	let node;

	switch (name) {
		case '__attr__':
			Object.keys(value).forEach(function (attr) {
				parent.setAttribute(attr, value[attr]);
			});
			break;

		case 'application':
			node = dom.create(name, null, parent);
			Object.keys(value).forEach(function (attr) {
				const tag = attr;

				if (tags.application.test(tag)) {
					if (tag === 'provider') {
						Object.keys(value[tag]).forEach(function (name) {
							const providerNode = dom.create(tag, null, node);
							let children = 0;
							Object.keys(value[tag][name]).forEach(function (attr) {
								const val = value[tag][name][attr];

								if (tagAttrs.provider.test(attr)) {
									providerNode.setAttribute('android:' + attr, val);
								} else if ((attr === 'grant-uri-permission' || attr === 'path-permission') && Array.isArray(val)) {
									val.forEach(function (perm) {
										const childNode = dom.create(attr, null, providerNode);
										Object.keys(perm).forEach(function (attr) {
											childNode.setAttribute('android:' + attr, perm[attr]);
										});
										children++;
									});
								} else if (attr === 'meta-data') {
									Object.keys(val).forEach(function (name) {
										const metaDataNode = dom.create('meta-data', null, providerNode);
										Object.keys(val[name]).forEach(function (attr) {
											if (tagAttrs['meta-data'].test(attr)) {
												metaDataNode.setAttribute('android:' + attr, val[name][attr]);
											}
										});
										children++;
									});
								}
							});
							children && providerNode.appendChild(dom.createTextNode('\r\n' + new Array(3).join('\t')));
						});
					} else if (tag === 'meta-data') {
						Object.keys(value['meta-data']).forEach(function (name) {
							const metaDataNode = dom.create('meta-data', null, node);
							Object.keys(value['meta-data'][name]).forEach(function (attr) {
								if (tagAttrs['meta-data'].test(attr)) {
									metaDataNode.setAttribute('android:' + attr, value['meta-data'][name][attr]);
								}
							});
						});
					} else if (tag === 'uses-library') {
						Object.keys(value['uses-library']).forEach(function (name) {
							const usesLibraryNode = dom.create('uses-library', null, node);
							Object.keys(value['uses-library'][name]).forEach(function (attr) {
								if (tagAttrs['uses-library'].test(attr)) {
									usesLibraryNode.setAttribute('android:' + attr, value['uses-library'][name][attr]);
								}
							});
						});
					} else {
						// activity, activity-alias, receiver, service
						Object.keys(value[tag]).forEach(function (name) {
							const childNode = dom.create(tag, null, node);
							let children = 0;
							Object.keys(value[tag][name]).forEach(function (attr) {
								let val = value[tag][name][attr];

								if (tagAttrs[tag].test(attr)) {
									if (/^(configChanges|windowSoftInputMode)$/.test(attr) && Array.isArray(val)) {
										val = val.join('|');
									}
									childNode.setAttribute('android:' + attr, val);
								} else if (attr === 'intent-filter' && Array.isArray(val)) {
									val.forEach(function (intentFilter) {
										const intentFilterNode = dom.create('intent-filter', null, childNode);
										Object.keys(intentFilter).forEach(function (attr) {
											if (tagAttrs['intent-filter'].test(attr)) {
												intentFilterNode.setAttribute('android:' + attr, intentFilter[attr]);
											} else if ((attr === 'action' || attr === 'category') && Array.isArray(intentFilter[attr])) {
												intentFilter[attr].forEach(function (name) {
													dom.create(attr, { 'android:name': name }, intentFilterNode);
												});
											} else if (attr === 'data' && Array.isArray(intentFilter.data)) {
												intentFilter[attr].forEach(function (obj) {
													const dataNode = dom.create('data', null, intentFilterNode);
													Object.keys(obj).forEach(function (key) {
														if (tagAttrs.data.test(key)) {
															dataNode.setAttribute('android:' + key, obj[key]);
														}
													});
												});
											}
										});
										intentFilterNode.appendChild(dom.createTextNode('\r\n' + new Array(4).join('\t')));
										children++;
									});
								} else if (attr === 'meta-data') {
									Object.keys(val).forEach(function (key) {
										const metaDataNode = dom.create('meta-data', null, childNode);
										Object.keys(val[key]).forEach(function (attr) {
											if (tagAttrs['meta-data'].test(attr)) {
												metaDataNode.setAttribute('android:' + attr, val[key][attr]);
											}
										});
										children++;
									});
								}
							});
							children && childNode.appendChild(dom.createTextNode('\r\n' + new Array(3).join('\t')));
						});
					}

				} else if (tagAttrs.application.test(attr)) {
					node.setAttribute('android:' + attr, value[attr]);
				}
			});
			break;

		case 'compatible-screens':
			node = dom.create(name, null, parent);
			Array.isArray(value) && value.forEach(function (screen) {
				const screenNode = dom.create('screen', null, node);
				Object.keys(screen).forEach(function (key) {
					screenNode.setAttribute('android:' + key, screen[key]);
				});
			});
			break;

		case 'instrumentation':
		case 'permission':
		case 'permission-group':
		case 'permission-tree':
		case 'uses-feature':
			Object.keys(value).forEach(function (key) {
				const childNode = dom.create(name, null, parent);
				Object.keys(value[key]).forEach(function (attr) {
					childNode.setAttribute('android:' + attr, value[key][attr]);
				});
			});
			break;

		case 'supports-gl-texture':
		case 'uses-permission':
			Array.isArray(value) && value.forEach(function (n) {
				dom.create(name, { 'android:name': n }, parent);
			});
			break;

		case 'supports-screens':
		case 'uses-sdk':
			node = dom.create(name, null, parent);
			Object.keys(value).forEach(function (attr) {
				node.setAttribute('android:' + attr, value[attr]);
			});
			break;

		case 'uses-configuration':
			value.forEach(function (uses) {
				const usesNode = dom.create('uses-configuration', null, parent);
				Object.keys(uses).forEach(function (attr) {
					usesNode.setAttribute('android:' + attr, uses[attr]);
				});
			});
			break;

		default:
			node = dom.create(name, null, parent);
			node.appendChild(dom.createTextNode(value));
			return;
	}

	if (node) {
		let children = 0;
		xml.forEachElement(node, function () {
			children++;
		});
		children && node.appendChild(dom.createTextNode('\r\n' + new Array(2).join('\t')));
	}
}

function initAttr(node, obj) {
	xml.forEachAttr(node, function (attr) {
		obj.__attr__ || (obj.__attr__ = {});
		if (attr.name === 'android:versionName') {
			obj.__attr__[attr.name] = attr.value;
		} else {
			obj.__attr__[attr.name] = xml.parse(attr.value);
		}
	});
	return obj;
}

function attrsToObj(node) {
	const a = {};
	xml.forEachAttr(node, function (attr) {
		a[attr.name.replace(androidAttrPrefixRegExp, '')] = xml.parse(attr.value);
	});
	return a;
}

function initObjectByName(node, obj) {
	const tmp = obj[node.tagName] || (obj[node.tagName] = {}),
		a = attrsToObj(node);
	if (a.name) {
		tmp[a.name] = a;
		return a;
	}
}

function toJS(obj, doc) {
	initAttr(doc, obj);

	xml.forEachElement(doc, function (node) {
		switch (node.tagName) {
			case 'application':
				// application object
				const app = obj[node.tagName] = attrsToObj(node);

				xml.forEachElement(node, function (node) {
					switch (node.tagName) {
						case 'activity':
						case 'activity-alias':
						case 'receiver':
						case 'service':
							const it = initObjectByName(node, app);
							if (it) {
								if (node.tagName === 'activity') {
									it.configChanges && (it.configChanges = it.configChanges.split('|'));
									it.windowSoftInputMode && (it.windowSoftInputMode = it.windowSoftInputMode.split('|'));
								}

								xml.forEachElement(node, function (node) {
									switch (node.tagName) {
										case 'intent-filter':
											Array.isArray(it['intent-filter']) || (it['intent-filter'] = []);
											const intentFilter = attrsToObj(node);
											it['intent-filter'].push(intentFilter);

											xml.forEachElement(node, function (node) {
												switch (node.tagName) {
													case 'action':
													case 'category':
														Array.isArray(intentFilter[node.tagName]) || (intentFilter[node.tagName] = []);
														const name = node.getAttribute('android:name');
														if (name && intentFilter[node.tagName].indexOf(name) === -1) {
															intentFilter[node.tagName].push(name);
														}
														break;

													case 'data':
														Array.isArray(intentFilter[node.tagName]) || (intentFilter[node.tagName] = []);
														intentFilter[node.tagName].push(attrsToObj(node));
														break;
												}
											});
											break;

										case 'meta-data':
											Object.prototype.toString.call(it['meta-data']) === '[object Object]' || (it['meta-data'] = {});
											initObjectByName(node, it);
											break;
									}
								});
							}
							break;

						case 'meta-data':
							Object.prototype.toString.call(app['meta-data']) === '[object Object]' || (app['meta-data'] = {});
							initObjectByName(node, app);
							break;

						case 'provider':
							const provider = initObjectByName(node, app);
							provider && xml.forEachElement(node, function (node) {
								switch (node.tagName) {
									case 'grant-uri-permission':
									case 'path-permission':
										Array.isArray(provider[node.tagName]) || (provider[node.tagName] = []);
										provider[node.tagName].push(attrsToObj(node));
										break;

									case 'meta-data':
										Object.prototype.toString.call(provider['meta-data']) === '[object Object]' || (provider['meta-data'] = {});
										initObjectByName(node, provider);
										break;
								}
							});
							break;

						case 'uses-library':
							Object.prototype.toString.call(app['uses-library']) === '[object Object]' || (app['uses-library'] = {});
							const a = attrsToObj(node);
							a.name && (app['uses-library'][a.name] = a);
							break;
					}
				});
				break;

			case 'compatible-screens':
				// array of screen objects
				const tmp = obj[node.tagName] || (obj[node.tagName] = []);
				initAttr(node, tmp);
				xml.forEachElement(node, function (node) {
					node.tagName === 'screen' && tmp.push(attrsToObj(node));
				});
				break;

			case 'uses-feature':
				// array of features that if it has a name, must be unique
				const tmp2 = obj[node.tagName] || (obj[node.tagName] = []),
					a = attrsToObj(node);

				// remove old one to prevent dupe
				if (a.name) {
					for (let i = 0; i < tmp2.length; i++) {
						if (tmp2[i].name && tmp2[i].name == a.name) { // eslint-disable-line eqeqeq
							tmp2.splice(i--, 1);
						}
					}
				}
				tmp2.push(a);
				break;

			case 'instrumentation':
			case 'permission':
			case 'permission-group':
			case 'permission-tree':
			case 'uses-library':
				// object with objects keyed by name
				initObjectByName(node, obj);
				break;

			case 'supports-screens':
			case 'uses-sdk':
				// single instance tags
				const tmp3 = obj[node.tagName] = {};
				xml.forEachAttr(node, function (attr) {
					tmp3[attr.name.replace(androidAttrPrefixRegExp, '')] = xml.parse(attr.value);
				});
				break;

			case 'uses-configuration':
				// array of objects
				Array.isArray(obj[node.tagName]) || (obj[node.tagName] = []);
				obj[node.tagName].push(attrsToObj(node));
				break;

			case 'supports-gl-texture':
			case 'uses-permission':
				// array of names
				const an = node.getAttribute('android:name');
				if (an) {
					Array.isArray(obj[node.tagName]) || (obj[node.tagName] = []);
					obj[node.tagName].push(an.replace(androidAttrPrefixRegExp, ''));
				}
				break;
		}
	});
}

function AndroidManifest(filename) {
	Object.defineProperty(this, 'load', {
		value: function (file) {
			if (!fs.existsSync(file)) {
				throw new Error(__('AndroidManifest.xml file does not exist'));
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

	Object.defineProperty(this, 'merge', {
		value: function (src) {
			if (!src) {
				return this;
			}

			if (!(src instanceof AndroidManifest)) {
				throw new Error(__('Failed to merge, source must be an AndroidManifest object'));
			}

			src && Object.keys(src).forEach(function (tag) {
				switch (tag) {
					case '__attr__':
						Object.keys(src.__attr__).forEach(function (key) {
							this.__attr__[key] = src.__attr__[key];
						}, this);
						break;

					case 'application':
						this[tag] || (this[tag] = {});
						Object.keys(src[tag]).forEach(function (subtag) {
							switch (subtag) {
								case 'activity':
								case 'activity-alias':
								case 'meta-data':
								case 'receiver':
								case 'service':
								case 'provider':
								case 'uses-library':
									this[tag][subtag] || (this[tag][subtag] = {});
									Object.keys(src[tag][subtag]).forEach(function (key) {
										// Copy source's XML tag attributes and child tags to target.
										const nextSource = src[tag][subtag][key];
										const nextTarget = this[tag][subtag][key];
										if (!nextTarget) {
											// Insert source's attribute or sub tag to target.
											this[tag][subtag][key] = nextSource;
										} else {
											Object.keys(nextSource).forEach(function (subKey) {
												if (subKey === 'configChanges') {
													// For <activity/> "android:configChanges" attribute, only copy
													// the attribute values from source that are missing in target.
													const sourceArray = nextSource[subKey];
													if (Array.isArray(sourceArray)) {
														const targetArray = nextTarget[subKey];
														if (Array.isArray(targetArray)) {
															for (let nextValue of sourceArray) {
																if (!targetArray.includes(nextValue)) {
																	targetArray.push(nextValue);
																}
															}
														} else {
															nextSource[subKey] = sourceArray;
														}
													}
												} else {
													// Overwrite target's attribute or sub tag with source.
													nextTarget[subKey] = nextSource[subKey];
												}
											});
										}
									}, this);
									break;
								default:
									if (tagAttrs.application.test(subtag)) {
										this[tag][subtag] = src[tag][subtag];
									}
							}
						}, this);
						break;

					case 'compatible-screens':
						Array.isArray(this[tag]) || (this[tag] = []);
						const tmp = {};
						this[tag].forEach(function (s) {
							tmp[s.screenSize + '|' + s.screenDensity] = 1;
						});
						src[tag].forEach(function (s) {
							const n = s.screenSize + '|' + s.screenDensity;
							if (!tmp[n]) {
								tmp[n] = 1;
								this[tag].push(s);
							}
						}, this);
						break;

					case 'uses-feature':
						this[tag] || (this[tag] = []);
						src[tag].forEach(function (tagItem) {
							// If given "uses-feature" name has already been added, then fetch its object.
							const duplicateItem = this[tag].find(function (nextItem) {
								// Compare them directly or by name.
								return (nextItem === tagItem) || (nextItem.name === tagItem.name);
							});
							if (duplicateItem === tagItem) {
								// Given reference was already added. Do nothing.
							} else if (duplicateItem) {
								// This is a duplicate "uses-feature" element name. Merge its settings.
								if (typeof tagItem['tools:replace'] === 'string') {
									// This attribute provides an array of other attributes that must be replaced.
									tagItem['tools:replace'].split(',').forEach(function (attributeName) {
										attributeName = attributeName.replace(androidAttrPrefixRegExp, '');
										if (attributeName !== 'name') {
											const value = tagItem[attributeName];
											if (typeof value === 'undefined') {
												delete duplicateItem[attributeName];
											} else {
												duplicateItem[attributeName] = value;
											}
										}
									});
								} else if (duplicateItem.required === false) {
									// Do a logical OR on the "required" attribute value.
									// If the "required" attribute is not defined, then it is considered true.
									if (typeof tagItem.required === 'undefined') {
										delete duplicateItem.required;
									} else if (tagItem.required) {
										duplicateItem.required = tagItem.required;
									}
								}
							} else {
								// The given "uses-feature" name has not been added yet. Do so now.
								this[tag].push(tagItem);
							}
						}, this);
						break;

					case 'instrumentation':
					case 'permission':
					case 'permission-group':
					case 'permission-tree':
					case 'uses-library':
						this[tag] || (this[tag] = {});
						Object.keys(src[tag]).forEach(function (name) {
							this[tag][name] = src[tag][name];
						}, this);
						break;

					case 'supports-screens':
					case 'uses-sdk':
						this[tag] || (this[tag] = {});
						Object.keys(src[tag]).forEach(function (attr) {
							this[tag][attr] = src[tag][attr];
						}, this);
						break;

					case 'uses-configuration':
						Array.isArray(this[tag]) || (this[tag] = []);
						const tmp2 = {};
						this[tag].forEach(function (s) {
							tmp2[s.reqFiveWayNav + '|' + s.reqTouchScreen + '|' + s.reqKeyboardType] = 1;
						});
						src[tag].forEach(function (s) {
							const n = s.reqFiveWayNav + '|' + s.reqTouchScreen + '|' + s.reqKeyboardType;
							if (!tmp2[n]) {
								tmp2[n] = 1;
								this[tag].push(s);
							}
						}, this);
						break;

					case 'supports-gl-texture':
					case 'uses-permission':
						Array.isArray(this[tag]) || (this[tag] = []);
						src[tag].forEach(function (s) {
							if (this[tag].indexOf(s) === -1) {
								this[tag].push(s);
							}
						}, this);
						break;
				}
			}, this);

			return this;
		}
	});

	Object.defineProperty(this, 'toString', {
		value: function (fmt) {
			if (fmt === 'xml') {
				const dom = new DOMParser(defaultDOMParserArgs).parseFromString('<manifest>', 'text/xml');

				dom.create = function (tag, attrs, parent, callback) {
					const node = dom.createElement(tag);
					let i = 0,
						p = parent;

					attrs && Object.keys(attrs).forEach(function (attr) {
						if (attr === 'nodeValue') {
							node.appendChild(dom.createTextNode('' + attrs[attr]));
						} else {
							attrs[attr] != undefined && node.setAttribute(attr, '' + attrs[attr]); // eslint-disable-line eqeqeq
						}
					});

					if (p) {
						while (p.parentNode) {
							i++;
							p = p.parentNode;
						}
						parent.appendChild(dom.createTextNode('\r\n' + new Array(i + 1).join('\t')));
					}

					parent && parent.appendChild(node);
					if (callback) {
						callback(node);
						node.appendChild(dom.createTextNode('\r\n' + new Array(i + 1).join('\t')));
					}
					return node;
				};

				Object.keys(this).forEach(function (key) {
					toXml(dom, dom.documentElement, key, this[key]);
				}, this);

				dom.documentElement.appendChild(dom.createTextNode('\r\n'));

				return '<?xml version="1.0" encoding="UTF-8"?>\r\n' + dom.documentElement.toString();
			} else if (fmt === 'pretty-json') {
				return JSON.stringify(this, null, '\t');
			} else if (fmt === 'json') {
				return JSON.stringify(this);
			}
			return Object.prototype.toString.call(this);
		}
	});

	Object.defineProperty(this, 'save', {
		value: function (file) {
			if (file) {
				fs.ensureDirSync(path.dirname(file));
				fs.writeFileSync(file, this.toString('xml'));
			}
			return this;
		}
	});

	filename && this.load(filename);
}
