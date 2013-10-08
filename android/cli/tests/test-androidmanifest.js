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
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application.xml'));

		it('should match object', function () {
			am.should.eql({
				"application": {
					"allowTaskReparenting": false,
					"allowBackup": true,
					"backupAgent": ".MyBackupAgent",
					"debuggable": false,
					"description": "this is a test",
					"enabled": true,
					"hasCode": true,
					"hardwareAccelerated": false,
					"icon": "@drawable/icon",
					"killAfterRestore": true,
					"largeHeap": false,
					"label": "test",
					"logo": "@drawable/logo",
					"manageSpaceActivity": ".TestActivity",
					"name": "test",
					"permission": "testPermission",
					"persistent": true,
					"process": "test",
					"restoreAnyVersion": false,
					"requiredAccountType": "com.google",
					"restrictedAccountType": "com.google",
					"supportsRtl": false,
					"taskAffinity": "test",
					"testOnly": false,
					"theme": "testTheme",
					"uiOptions": "none",
					"vmSafeMode": false
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"application":{"allowTaskReparenting":false,"allowBackup":true,"backupAgent":".MyBackupAgent","debuggable":false,"description":"this is a test","enabled":true,"hasCode":true,"hardwareAccelerated":false,"icon":"@drawable/icon","killAfterRestore":true,"largeHeap":false,"label":"test","logo":"@drawable/logo","manageSpaceActivity":".TestActivity","name":"test","permission":"testPermission","persistent":true,"process":"test","restoreAnyVersion":false,"requiredAccountType":"com.google","restrictedAccountType":"com.google","supportsRtl":false,"taskAffinity":"test","testOnly":false,"theme":"testTheme","uiOptions":"none","vmSafeMode":false}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"application": {',
				'		"allowTaskReparenting": false,',
				'		"allowBackup": true,',
				'		"backupAgent": ".MyBackupAgent",',
				'		"debuggable": false,',
				'		"description": "this is a test",',
				'		"enabled": true,',
				'		"hasCode": true,',
				'		"hardwareAccelerated": false,',
				'		"icon": "@drawable/icon",',
				'		"killAfterRestore": true,',
				'		"largeHeap": false,',
				'		"label": "test",',
				'		"logo": "@drawable/logo",',
				'		"manageSpaceActivity": ".TestActivity",',
				'		"name": "test",',
				'		"permission": "testPermission",',
				'		"persistent": true,',
				'		"process": "test",',
				'		"restoreAnyVersion": false,',
				'		"requiredAccountType": "com.google",',
				'		"restrictedAccountType": "com.google",',
				'		"supportsRtl": false,',
				'		"taskAffinity": "test",',
				'		"testOnly": false,',
				'		"theme": "testTheme",',
				'		"uiOptions": "none",',
				'		"vmSafeMode": false',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<application> <activity>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_activity.xml'));

		it('should match object', function () {
			am.should.eql({
				"application": {
					"activity": {
						"TestActivity1": {
							"allowTaskReparenting": false,
							"alwaysRetainTaskState": false,
							"clearTaskOnLaunch": false,
							"configChanges": [ "mcc", "mnc", "locale", "touchscreen", "keyboard", "keyboardHidden", "navigation", "screenLayout", "fontScale", "uiMode", "orientation", "screenSize", "smallestScreenSize" ],
							"enabled": true,
							"excludeFromRecents": false,
							"exported": true,
							"finishOnTaskLaunch": false,
							"hardwareAccelerated": false,
							"icon": "@drawable/icon",
							"label": "Test Activity 1",
							"launchMode": "standard",
							"multiprocess": false,
							"name": "TestActivity1",
							"noHistory": false,
							"parentActivityName": "com.example.myfirstapp.MainActivity",
							"permission": "somePermission",
							"process": "someProcess",
							"screenOrientation": "landscape",
							"stateNotNeeded": false,
							"taskAffinity": "testAffinity",
							"theme": "mytheme",
							"uiOptions": "none",
							"windowSoftInputMode": [ "stateVisible", "adjustResize" ]
						},
						"TestActivity2": {
							"allowTaskReparenting": false,
							"alwaysRetainTaskState": false,
							"clearTaskOnLaunch": false,
							"configChanges": [ "mcc", "mnc", "locale", "touchscreen", "keyboard", "keyboardHidden", "navigation", "screenLayout", "fontScale", "uiMode", "orientation", "screenSize", "smallestScreenSize" ],
							"enabled": true,
							"excludeFromRecents": false,
							"exported": true,
							"finishOnTaskLaunch": false,
							"hardwareAccelerated": false,
							"icon": "@drawable/icon",
							"label": "Test Activity 2",
							"launchMode": "standard",
							"multiprocess": false,
							"name": "TestActivity2",
							"noHistory": false,
							"parentActivityName": "com.example.myfirstapp.MainActivity",
							"permission": "somePermission",
							"process": "someProcess",
							"screenOrientation": "landscape",
							"stateNotNeeded": false,
							"taskAffinity": "testAffinity",
							"theme": "mytheme",
							"uiOptions": "none",
							"windowSoftInputMode": [ "stateVisible", "adjustResize" ]
						}
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"application":{"activity":{"TestActivity1":{"allowTaskReparenting":false,"alwaysRetainTaskState":false,"clearTaskOnLaunch":false,"configChanges":["mcc","mnc","locale","touchscreen","keyboard","keyboardHidden","navigation","screenLayout","fontScale","uiMode","orientation","screenSize","smallestScreenSize"],"enabled":true,"excludeFromRecents":false,"exported":true,"finishOnTaskLaunch":false,"hardwareAccelerated":false,"icon":"@drawable/icon","label":"Test Activity 1","launchMode":"standard","multiprocess":false,"name":"TestActivity1","noHistory":false,"parentActivityName":"com.example.myfirstapp.MainActivity","permission":"somePermission","process":"someProcess","screenOrientation":"landscape","stateNotNeeded":false,"taskAffinity":"testAffinity","theme":"mytheme","uiOptions":"none","windowSoftInputMode":["stateVisible","adjustResize"]},"TestActivity2":{"allowTaskReparenting":false,"alwaysRetainTaskState":false,"clearTaskOnLaunch":false,"configChanges":["mcc","mnc","locale","touchscreen","keyboard","keyboardHidden","navigation","screenLayout","fontScale","uiMode","orientation","screenSize","smallestScreenSize"],"enabled":true,"excludeFromRecents":false,"exported":true,"finishOnTaskLaunch":false,"hardwareAccelerated":false,"icon":"@drawable/icon","label":"Test Activity 2","launchMode":"standard","multiprocess":false,"name":"TestActivity2","noHistory":false,"parentActivityName":"com.example.myfirstapp.MainActivity","permission":"somePermission","process":"someProcess","screenOrientation":"landscape","stateNotNeeded":false,"taskAffinity":"testAffinity","theme":"mytheme","uiOptions":"none","windowSoftInputMode":["stateVisible","adjustResize"]}}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"application": {',
				'		"activity": {',
				'			"TestActivity1": {',
				'				"allowTaskReparenting": false,',
				'				"alwaysRetainTaskState": false,',
				'				"clearTaskOnLaunch": false,',
				'				"configChanges": [',
				'					"mcc",',
				'					"mnc",',
				'					"locale",',
				'					"touchscreen",',
				'					"keyboard",',
				'					"keyboardHidden",',
				'					"navigation",',
				'					"screenLayout",',
				'					"fontScale",',
				'					"uiMode",',
				'					"orientation",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"enabled": true,',
				'				"excludeFromRecents": false,',
				'				"exported": true,',
				'				"finishOnTaskLaunch": false,',
				'				"hardwareAccelerated": false,',
				'				"icon": "@drawable/icon",',
				'				"label": "Test Activity 1",',
				'				"launchMode": "standard",',
				'				"multiprocess": false,',
				'				"name": "TestActivity1",',
				'				"noHistory": false,',
				'				"parentActivityName": "com.example.myfirstapp.MainActivity",',
				'				"permission": "somePermission",',
				'				"process": "someProcess",',
				'				"screenOrientation": "landscape",',
				'				"stateNotNeeded": false,',
				'				"taskAffinity": "testAffinity",',
				'				"theme": "mytheme",',
				'				"uiOptions": "none",',
				'				"windowSoftInputMode": [',
				'					"stateVisible",',
				'					"adjustResize"',
				'				]',
				'			},',
				'			"TestActivity2": {',
				'				"allowTaskReparenting": false,',
				'				"alwaysRetainTaskState": false,',
				'				"clearTaskOnLaunch": false,',
				'				"configChanges": [',
				'					"mcc",',
				'					"mnc",',
				'					"locale",',
				'					"touchscreen",',
				'					"keyboard",',
				'					"keyboardHidden",',
				'					"navigation",',
				'					"screenLayout",',
				'					"fontScale",',
				'					"uiMode",',
				'					"orientation",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"enabled": true,',
				'				"excludeFromRecents": false,',
				'				"exported": true,',
				'				"finishOnTaskLaunch": false,',
				'				"hardwareAccelerated": false,',
				'				"icon": "@drawable/icon",',
				'				"label": "Test Activity 2",',
				'				"launchMode": "standard",',
				'				"multiprocess": false,',
				'				"name": "TestActivity2",',
				'				"noHistory": false,',
				'				"parentActivityName": "com.example.myfirstapp.MainActivity",',
				'				"permission": "somePermission",',
				'				"process": "someProcess",',
				'				"screenOrientation": "landscape",',
				'				"stateNotNeeded": false,',
				'				"taskAffinity": "testAffinity",',
				'				"theme": "mytheme",',
				'				"uiOptions": "none",',
				'				"windowSoftInputMode": [',
				'					"stateVisible",',
				'					"adjustResize"',
				'				]',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<application> <activity> <intent-filter>', function () {
		//var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_activity_intent-filter.xml'));
	});

	describe('<application> <activity> <meta-data>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_activity_meta-data.xml'));
	});

	describe('<application> <activity-alias>', function () {
		//var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_activity-alias.xml'));
	});

	describe('<application> <provider>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_provider.xml'));

		it('should match object', function () {
			am.should.eql({
				"application": {
					"provider": {
						"testprovider1": {
							"authorities": "com.example.provider.cartoonprovider",
							"enabled": true,
							"exported": false,
							"grantUriPermissions": false,
							"icon": "@drawable/icon",
							"initOrder": 1,
							"label": "test provider 1",
							"multiprocess": false,
							"name": "testprovider1",
							"permission": "testPermission",
							"process": "testProcess",
							"readPermission": "somePermission",
							"syncable": false,
							"writePermission": "somePermission"
						},
						"testprovider2": {
							"authorities": "com.example.provider.cartoonprovider",
							"enabled": true,
							"exported": false,
							"grantUriPermissions": false,
							"icon": "@drawable/icon",
							"initOrder": 2,
							"label": "test provider 2",
							"multiprocess": false,
							"name": "testprovider2",
							"permission": "testPermission",
							"process": "testProcess",
							"readPermission": "somePermission",
							"syncable": false,
							"writePermission": "somePermission"
						}
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"application":{"provider":{"testprovider1":{"authorities":"com.example.provider.cartoonprovider","enabled":true,"exported":false,"grantUriPermissions":false,"icon":"@drawable/icon","initOrder":1,"label":"test provider 1","multiprocess":false,"name":"testprovider1","permission":"testPermission","process":"testProcess","readPermission":"somePermission","syncable":false,"writePermission":"somePermission"},"testprovider2":{"authorities":"com.example.provider.cartoonprovider","enabled":true,"exported":false,"grantUriPermissions":false,"icon":"@drawable/icon","initOrder":2,"label":"test provider 2","multiprocess":false,"name":"testprovider2","permission":"testPermission","process":"testProcess","readPermission":"somePermission","syncable":false,"writePermission":"somePermission"}}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"application": {',
				'		"provider": {',
				'			"testprovider1": {',
				'				"authorities": "com.example.provider.cartoonprovider",',
				'				"enabled": true,',
				'				"exported": false,',
				'				"grantUriPermissions": false,',
				'				"icon": "@drawable/icon",',
				'				"initOrder": 1,',
				'				"label": "test provider 1",',
				'				"multiprocess": false,',
				'				"name": "testprovider1",',
				'				"permission": "testPermission",',
				'				"process": "testProcess",',
				'				"readPermission": "somePermission",',
				'				"syncable": false,',
				'				"writePermission": "somePermission"',
				'			},',
				'			"testprovider2": {',
				'				"authorities": "com.example.provider.cartoonprovider",',
				'				"enabled": true,',
				'				"exported": false,',
				'				"grantUriPermissions": false,',
				'				"icon": "@drawable/icon",',
				'				"initOrder": 2,',
				'				"label": "test provider 2",',
				'				"multiprocess": false,',
				'				"name": "testprovider2",',
				'				"permission": "testPermission",',
				'				"process": "testProcess",',
				'				"readPermission": "somePermission",',
				'				"syncable": false,',
				'				"writePermission": "somePermission"',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<application> <provider> <grant-uri-permission>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_provider_grant-uri-permission.xml'));

		it('should match object', function () {
			am.should.eql({
				"application": {
					"provider": {
						"testprovider": {
							"name": "testprovider",
							"grant-uri-permission": [
								{
									"path": "/test",
									"pathPattern": ".*",
									"pathPrefix": "ti"
								},
								{
									"path": "/sample",
									"pathPattern": ".*",
									"pathPrefix": "test_"
								}
							]
						}
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"application":{"provider":{"testprovider":{"name":"testprovider","grant-uri-permission":[{"path":"/test","pathPattern":".*","pathPrefix":"ti"},{"path":"/sample","pathPattern":".*","pathPrefix":"test_"}]}}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"application": {',
				'		"provider": {',
				'			"testprovider": {',
				'				"name": "testprovider",',
				'				"grant-uri-permission": [',
				'					{',
				'						"path": "/test",',
				'						"pathPattern": ".*",',
				'						"pathPrefix": "ti"',
				'					},',
				'					{',
				'						"path": "/sample",',
				'						"pathPattern": ".*",',
				'						"pathPrefix": "test_"',
				'					}',
				'				]',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<application> <provider> <path-permission>', function () {
		 var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_provider_path-permission.xml'));

		it('should match object', function () {
			am.should.eql({
				"application": {
					"provider": {
						"testprovider": {
							"name": "testprovider",
							"path-permission": [
								{
									"path": "/test",
									"pathPrefix": "ti_",
									"pathPattern": ".*",
									"permission": "somePermission",
									"readPermission": "somePermission",
									"writePermission": "somePermission"
								},
								{
									"path": "/sample",
									"pathPrefix": "test_",
									"pathPattern": ".*",
									"permission": "somePermission",
									"readPermission": "somePermission",
									"writePermission": "somePermission"
								}
							]
						}
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"application":{"provider":{"testprovider":{"name":"testprovider","path-permission":[{"path":"/test","pathPrefix":"ti_","pathPattern":".*","permission":"somePermission","readPermission":"somePermission","writePermission":"somePermission"},{"path":"/sample","pathPrefix":"test_","pathPattern":".*","permission":"somePermission","readPermission":"somePermission","writePermission":"somePermission"}]}}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"application": {',
				'		"provider": {',
				'			"testprovider": {',
				'				"name": "testprovider",',
				'				"path-permission": [',
				'					{',
				'						"path": "/test",',
				'						"pathPrefix": "ti_",',
				'						"pathPattern": ".*",',
				'						"permission": "somePermission",',
				'						"readPermission": "somePermission",',
				'						"writePermission": "somePermission"',
				'					},',
				'					{',
				'						"path": "/sample",',
				'						"pathPrefix": "test_",',
				'						"pathPattern": ".*",',
				'						"permission": "somePermission",',
				'						"readPermission": "somePermission",',
				'						"writePermission": "somePermission"',
				'					}',
				'				]',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<application> <provider> <meta-data>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_provider_meta-data.xml'));

		it('should match object', function () {
			am.should.eql({
				"application": {
					"provider": {
						"testprovider": {
							"name": "testprovider",
							"meta-data": {
								"zooVal": {
									"name": "zooVal",
									"value": "@string/kangaroo"
								},
								"zooRes": {
									"name": "zooRes",
									"resource": "@string/kangaroo"
								}
							}
						}
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"application":{"provider":{"testprovider":{"name":"testprovider","meta-data":{"zooVal":{"name":"zooVal","value":"@string/kangaroo"},"zooRes":{"name":"zooRes","resource":"@string/kangaroo"}}}}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"application": {',
				'		"provider": {',
				'			"testprovider": {',
				'				"name": "testprovider",',
				'				"meta-data": {',
				'					"zooVal": {',
				'						"name": "zooVal",',
				'						"value": "@string/kangaroo"',
				'					},',
				'					"zooRes": {',
				'						"name": "zooRes",',
				'						"resource": "@string/kangaroo"',
				'					}',
				'				}',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<application> <reciever>', function () {
		//var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_reciever.xml'));
	});

	describe('<application> <service>', function () {
		//var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_service.xml'));
	});

	describe('<application> <uses-library>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_uses-library.xml'));

		it('should match object', function () {
			am.should.eql({
				"application": {
					"uses-library": {
						"lib1": {
							name: "lib1",
							required: true
						},
						"lib2": {
							name: "lib2",
							required: false
						}
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"application":{"uses-library":{"lib1":{"name":"lib1","required":true},"lib2":{"name":"lib2","required":false}}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"application": {',
				'		"uses-library": {',
				'			"lib1": {',
				'				"name": "lib1",',
				'				"required": true',
				'			},',
				'			"lib2": {',
				'				"name": "lib2",',
				'				"required": false',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
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
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_supports-gl-texture.xml'));

		it('should match object', function () {
			am.should.eql({
				'supports-gl-texture': [
					'GL_OES_compressed_ETC1_RGB8_texture',
					'GL_OES_compressed_paletted_texture'
				]
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"supports-gl-texture":["GL_OES_compressed_ETC1_RGB8_texture","GL_OES_compressed_paletted_texture"]}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"supports-gl-texture": [',
				'		"GL_OES_compressed_ETC1_RGB8_texture",',
				'		"GL_OES_compressed_paletted_texture"',
				'	]',
				'}'
			].join('\n'));
		});
	});

	describe('<supports-screens>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_supports-screens.xml'));

		it('should match object', function () {
			am.should.eql({
				'supports-screens': {
					'anyDensity': false,
					'resizeable': true,
					'smallScreens': true,
					'normalScreens': true,
					'largeScreens': true,
					'xlargeScreens': true,
					'requiresSmallestWidthDp': 320,
					'compatibleWidthLimitDp': 480,
					'largestWidthLimitDp': 2048
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"supports-screens":{"anyDensity":false,"resizeable":true,"smallScreens":true,"normalScreens":true,"largeScreens":true,"xlargeScreens":true,"requiresSmallestWidthDp":320,"compatibleWidthLimitDp":480,"largestWidthLimitDp":2048}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"supports-screens": {',
				'		"anyDensity": false,',
				'		"resizeable": true,',
				'		"smallScreens": true,',
				'		"normalScreens": true,',
				'		"largeScreens": true,',
				'		"xlargeScreens": true,',
				'		"requiresSmallestWidthDp": 320,',
				'		"compatibleWidthLimitDp": 480,',
				'		"largestWidthLimitDp": 2048',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<uses-configuration>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_uses-configuration.xml'));

		it('should match object', function () {
			am.should.eql({
				'uses-configuration': [
					{
						reqFiveWayNav: true,
						reqTouchScreen: 'finger',
						reqKeyboardType: 'qwerty'
					},
					{
						reqFiveWayNav: true,
						reqTouchScreen: 'finger',
						reqKeyboardType: 'twelvekey'
					}
				]
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"uses-configuration":[{"reqFiveWayNav":true,"reqTouchScreen":"finger","reqKeyboardType":"qwerty"},{"reqFiveWayNav":true,"reqTouchScreen":"finger","reqKeyboardType":"twelvekey"}]}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"uses-configuration": [',
				'		{',
				'			"reqFiveWayNav": true,',
				'			"reqTouchScreen": "finger",',
				'			"reqKeyboardType": "qwerty"',
				'		},',
				'		{',
				'			"reqFiveWayNav": true,',
				'			"reqTouchScreen": "finger",',
				'			"reqKeyboardType": "twelvekey"',
				'		}',
				'	]',
				'}'
			].join('\n'));
		});
	});

	describe('<uses-feature>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_uses-feature.xml'));

		it('should match object', function () {
			am.should.eql({
				'uses-feature': {
					"android.hardware.bluetooth": {
						name: "android.hardware.bluetooth",
						required: false,
						glEsVersion: 1
					},
					"android.hardware.camera": {
						name: "android.hardware.camera",
						required: true,
						glEsVersion: 2
					}
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"uses-feature":{"android.hardware.bluetooth":{"name":"android.hardware.bluetooth","required":false,"glEsVersion":1},"android.hardware.camera":{"name":"android.hardware.camera","required":true,"glEsVersion":2}}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"uses-feature": {',
				'		"android.hardware.bluetooth": {',
				'			"name": "android.hardware.bluetooth",',
				'			"required": false,',
				'			"glEsVersion": 1',
				'		},',
				'		"android.hardware.camera": {',
				'			"name": "android.hardware.camera",',
				'			"required": true,',
				'			"glEsVersion": 2',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});
	});

	describe('<uses-permission>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_uses-permission.xml'));

		it('should match object', function () {
			am.should.eql({
				'uses-permission': [
					"android.permission.CAMERA",
					"android.permission.READ_CONTACTS"
				]
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"uses-permission":["android.permission.CAMERA","android.permission.READ_CONTACTS"]}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"uses-permission": [',
				'		"android.permission.CAMERA",',
				'		"android.permission.READ_CONTACTS"',
				'	]',
				'}'
			].join('\n'));
		});
	});

	describe('<uses-sdk>', function () {
		var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_uses-sdk.xml'));

		it('should match object', function () {
			am.should.eql({
				'uses-sdk': {
					minSdkVersion: 10,
					targetSdkVersion: 14,
					maxSdkVersion: 18
				}
			});
		});

		it('toString()', function () {
			am.toString().should.equal('[object Object]');
		});

		it("toString('json')", function () {
			am.toString('json').should.equal('{"uses-sdk":{"minSdkVersion":10,"targetSdkVersion":14,"maxSdkVersion":18}}');
		});

		it("toString('pretty-json')", function () {
			am.toString('pretty-json').should.equal([
				'{',
				'	"uses-sdk": {',
				'		"minSdkVersion": 10,',
				'		"targetSdkVersion": 14,',
				'		"maxSdkVersion": 18',
				'	}',
				'}'
			].join('\n'));
		});
	});
});
