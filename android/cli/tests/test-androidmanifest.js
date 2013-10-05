/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var AndroidManifest = require('../lib/AndroidManifest'),
	fs = require('fs'),
	path = require('path');

describe('AndroidManifest', function () {
	describe('Empty document', function () {
		var am = new AndroidManifest();

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal('{}');
		});

		it("toString('xml')", function () {
			am.toString('xml').should.equal('<?xml version="1.0" encoding="UTF-8"?>\n<manifest>\r\n</manifest>');
		});
	});

	describe('<application>', function () {
		// TODO
	});

	describe('<compatible-screens>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_compatible-screens.xml'));

		it('should match object', function () {
			am.should.eql({
				"compatible-screens": [
				{
					"screenSize": "small",
					"screenDensity": "ldpi"
				},
				{
					"screenSize": "small",
					"screenDensity": "mdpi"
				},
				{
					"screenSize": "small",
					"screenDensity": "hdpi"
				},
				{
					"screenSize": "small",
					"screenDensity": "xhdpi"
				},
				{
					"screenSize": "normal",
					"screenDensity": "ldpi"
				},
				{
					"screenSize": "normal",
					"screenDensity": "mdpi"
				},
				{
					"screenSize": "normal",
					"screenDensity": "hdpi"
				},
				{
					"screenSize": "normal",
					"screenDensity": "xhdpi"
				}
				]
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"compatible-screens":[{"screenSize":"small","screenDensity":"ldpi"},{"screenSize":"small","screenDensity":"mdpi"},{"screenSize":"small","screenDensity":"hdpi"},{"screenSize":"small","screenDensity":"xhdpi"},{"screenSize":"normal","screenDensity":"ldpi"},{"screenSize":"normal","screenDensity":"mdpi"},{"screenSize":"normal","screenDensity":"hdpi"},{"screenSize":"normal","screenDensity":"xhdpi"}]}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"compatible-screens": [',
				'		{',
				'			"screenSize": "small",',
				'			"screenDensity": "ldpi"',
				'		},',
				'		{',
				'			"screenSize": "small",',
				'			"screenDensity": "mdpi"',
				'		},',
				'		{',
				'			"screenSize": "small",',
				'			"screenDensity": "hdpi"',
				'		},',
				'		{',
				'			"screenSize": "small",',
				'			"screenDensity": "xhdpi"',
				'		},',
				'		{',
				'			"screenSize": "normal",',
				'			"screenDensity": "ldpi"',
				'		},',
				'		{',
				'			"screenSize": "normal",',
				'			"screenDensity": "mdpi"',
				'		},',
				'		{',
				'			"screenSize": "normal",',
				'			"screenDensity": "hdpi"',
				'		},',
				'		{',
				'			"screenSize": "normal",',
				'			"screenDensity": "xhdpi"',
				'		}',
				'	]',
				'}'
			].join('\n'));
		});
	});

	describe('<instrumentation>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_instrumentation.xml'));

		it('should match object', function () {
			am.should.eql({
				instrumentation: {
					'.app.LocalSampleInstrumentation': {
						name: '.app.LocalSampleInstrumentation',
						targetPackage: 'com.example.android.apis',
						label: 'Local Sample'
					},
					'.app.LocalTestInstrumentation': {
						name: '.app.LocalTestInstrumentation',
						targetPackage: 'com.example.test.apis',
						label: 'Local Test',
						functionalTest: true,
						handleProfiling: true,
						icon: 'drawable resource'
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"instrumentation":{".app.LocalSampleInstrumentation":{"name":".app.LocalSampleInstrumentation","targetPackage":"com.example.android.apis","label":"Local Sample"},".app.LocalTestInstrumentation":{"name":".app.LocalTestInstrumentation","targetPackage":"com.example.test.apis","label":"Local Test","functionalTest":true,"handleProfiling":true,"icon":"drawable resource"}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"instrumentation": {',
				'		".app.LocalSampleInstrumentation": {',
				'			"name": ".app.LocalSampleInstrumentation",',
				'			"targetPackage": "com.example.android.apis",',
				'			"label": "Local Sample"',
				'		},',
				'		".app.LocalTestInstrumentation": {',
				'			"name": ".app.LocalTestInstrumentation",',
				'			"targetPackage": "com.example.test.apis",',
				'			"label": "Local Test",',
				'			"functionalTest": true,',
				'			"handleProfiling": true,',
				'			"icon": "drawable resource"',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<permission>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_permission.xml'));

		it('should match object', function () {
			am.should.eql({
				permission: {
					test1: {
						description: 'test 1',
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test1',
						permissionGroup: 'string',
						protectionLevel: 'normal'
					},
					test2: {
						description: 'test 2',
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test2',
						permissionGroup: 'string',
						protectionLevel: 'normal'
					},
					test3: {
						description: 'test 3',
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test3',
						permissionGroup: 'string',
						protectionLevel: 'normal'
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"permission":{"test1":{"description":"test 1","icon":"drawable resource","label":"string resource","name":"test1","permissionGroup":"string","protectionLevel":"normal"},"test2":{"description":"test 2","icon":"drawable resource","label":"string resource","name":"test2","permissionGroup":"string","protectionLevel":"normal"},"test3":{"description":"test 3","icon":"drawable resource","label":"string resource","name":"test3","permissionGroup":"string","protectionLevel":"normal"}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"permission": {',
				'		"test1": {',
				'			"description": "test 1",',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test1",',
				'			"permissionGroup": "string",',
				'			"protectionLevel": "normal"',
				'		},',
				'		"test2": {',
				'			"description": "test 2",',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test2",',
				'			"permissionGroup": "string",',
				'			"protectionLevel": "normal"',
				'		},',
				'		"test3": {',
				'			"description": "test 3",',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test3",',
				'			"permissionGroup": "string",',
				'			"protectionLevel": "normal"',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<permission-group>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_permission-group.xml'));

		it('should match object', function () {
			am.should.eql({
				'permission-group': {
					test1: {
						description: 'string resource',
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test1'
					},
					test2: {
						description: 'string resource',
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test2'
					},
					test3: {
						description: 'string resource',
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test3'
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"permission-group":{"test1":{"description":"string resource","icon":"drawable resource","label":"string resource","name":"test1"},"test2":{"description":"string resource","icon":"drawable resource","label":"string resource","name":"test2"},"test3":{"description":"string resource","icon":"drawable resource","label":"string resource","name":"test3"}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"permission-group": {',
				'		"test1": {',
				'			"description": "string resource",',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test1"',
				'		},',
				'		"test2": {',
				'			"description": "string resource",',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test2"',
				'		},',
				'		"test3": {',
				'			"description": "string resource",',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test3"',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<permission-tree>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_permission-tree.xml'));

		it('should match object', function () {
			am.should.eql({
				'permission-tree': {
					test1: {
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test1'
					},
					test2: {
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test2'
					},
					test3: {
						icon: 'drawable resource',
						label: 'string resource',
						name: 'test3'
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"permission-tree":{"test1":{"icon":"drawable resource","label":"string resource","name":"test1"},"test2":{"icon":"drawable resource","label":"string resource","name":"test2"},"test3":{"icon":"drawable resource","label":"string resource","name":"test3"}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"permission-tree": {',
				'		"test1": {',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test1"',
				'		},',
				'		"test2": {',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test2"',
				'		},',
				'		"test3": {',
				'			"icon": "drawable resource",',
				'			"label": "string resource",',
				'			"name": "test3"',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<supports-gl-texture>', function () {
		// TODO
	});

	describe('<supports-screens>', function () {
		// TODO
	});

	describe('<uses-configuration>', function () {
		// TODO
	});

	describe('<uses-feature>', function () {
		// TODO
	});

	describe('<uses-permission>', function () {
		// TODO
	});

	describe('<uses-sdk>', function () {
		// TODO
	});
});
