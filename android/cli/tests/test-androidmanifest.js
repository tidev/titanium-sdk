/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint no-template-curly-in-string: "off" */
'use strict';

const AndroidManifest = require('../lib/AndroidManifest'),
	path = require('path'),
	expect = require('chai').expect;

describe('AndroidManifest', function () {
	describe('Empty document', function () {
		var am = new AndroidManifest();

		it('should match object', function () {
			expect(am).to.deep.equal({});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal('{}');
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application>', function () {
		const manifest = path.join(__dirname, './resources/AndroidManifest_application.xml');
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					allowTaskReparenting: false,
					allowBackup: true,
					backupAgent: '.MyBackupAgent',
					debuggable: false,
					description: 'this is a test',
					enabled: true,
					hasCode: true,
					hardwareAccelerated: false,
					icon: '@drawable/icon',
					killAfterRestore: true,
					largeHeap: false,
					label: 'test',
					logo: '@drawable/logo',
					manageSpaceActivity: '.TestActivity',
					name: 'test',
					permission: 'testPermission',
					persistent: true,
					process: 'test',
					restoreAnyVersion: false,
					requiredAccountType: 'com.google',
					restrictedAccountType: 'com.google',
					supportsRtl: false,
					taskAffinity: 'test',
					testOnly: false,
					theme: 'testTheme',
					uiOptions: 'none',
					vmSafeMode: false
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"allowTaskReparenting":false,"allowBackup":true,"backupAgent":".MyBackupAgent","debuggable":false,"description":"this is a test","enabled":true,"hasCode":true,"hardwareAccelerated":false,"icon":"@drawable/icon","killAfterRestore":true,"largeHeap":false,"label":"test","logo":"@drawable/logo","manageSpaceActivity":".TestActivity","name":"test","permission":"testPermission","persistent":true,"process":"test","restoreAnyVersion":false,"requiredAccountType":"com.google","restrictedAccountType":"com.google","supportsRtl":false,"taskAffinity":"test","testOnly":false,"theme":"testTheme","uiOptions":"none","vmSafeMode":false}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application android:allowTaskReparenting="false" android:allowBackup="true" android:backupAgent=".MyBackupAgent" android:debuggable="false" android:description="this is a test" android:enabled="true" android:hasCode="true" android:hardwareAccelerated="false" android:icon="@drawable/icon" android:killAfterRestore="true" android:largeHeap="false" android:label="test" android:logo="@drawable/logo" android:manageSpaceActivity=".TestActivity" android:name="test" android:permission="testPermission" android:persistent="true" android:process="test" android:restoreAnyVersion="false" android:requiredAccountType="com.google" android:restrictedAccountType="com.google" android:supportsRtl="false" android:taskAffinity="test" android:testOnly="false" android:theme="testTheme" android:uiOptions="none" android:vmSafeMode="false"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <activity>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_activity.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					activity: {
						TestActivity1: {
							allowTaskReparenting: false,
							alwaysRetainTaskState: false,
							clearTaskOnLaunch: false,
							configChanges: [ 'mcc', 'mnc', 'locale', 'touchscreen', 'keyboard', 'keyboardHidden', 'navigation', 'screenLayout', 'fontScale', 'uiMode', 'orientation', 'screenSize', 'smallestScreenSize' ],
							enabled: true,
							excludeFromRecents: false,
							exported: true,
							finishOnTaskLaunch: false,
							hardwareAccelerated: false,
							icon: '@drawable/icon',
							label: 'Test Activity 1',
							launchMode: 'standard',
							multiprocess: false,
							name: 'TestActivity1',
							noHistory: false,
							parentActivityName: 'com.example.myfirstapp.MainActivity',
							permission: 'somePermission',
							process: 'someProcess',
							screenOrientation: 'landscape',
							stateNotNeeded: false,
							taskAffinity: 'testAffinity',
							theme: 'mytheme',
							uiOptions: 'none',
							windowSoftInputMode: [ 'stateVisible', 'adjustResize' ]
						},
						TestActivity2: {
							allowTaskReparenting: false,
							alwaysRetainTaskState: false,
							clearTaskOnLaunch: false,
							configChanges: [ 'mcc', 'mnc', 'locale', 'touchscreen', 'keyboard', 'keyboardHidden', 'navigation', 'screenLayout', 'fontScale', 'uiMode', 'orientation', 'screenSize', 'smallestScreenSize' ],
							enabled: true,
							excludeFromRecents: false,
							exported: true,
							finishOnTaskLaunch: false,
							hardwareAccelerated: false,
							icon: '@drawable/icon',
							label: 'Test Activity 2',
							launchMode: 'standard',
							multiprocess: false,
							name: 'TestActivity2',
							noHistory: false,
							parentActivityName: 'com.example.myfirstapp.MainActivity',
							permission: 'somePermission',
							process: 'someProcess',
							screenOrientation: 'landscape',
							stateNotNeeded: false,
							taskAffinity: 'testAffinity',
							theme: 'mytheme',
							uiOptions: 'none',
							windowSoftInputMode: [ 'stateVisible', 'adjustResize' ]
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"activity":{"TestActivity1":{"allowTaskReparenting":false,"alwaysRetainTaskState":false,"clearTaskOnLaunch":false,"configChanges":["mcc","mnc","locale","touchscreen","keyboard","keyboardHidden","navigation","screenLayout","fontScale","uiMode","orientation","screenSize","smallestScreenSize"],"enabled":true,"excludeFromRecents":false,"exported":true,"finishOnTaskLaunch":false,"hardwareAccelerated":false,"icon":"@drawable/icon","label":"Test Activity 1","launchMode":"standard","multiprocess":false,"name":"TestActivity1","noHistory":false,"parentActivityName":"com.example.myfirstapp.MainActivity","permission":"somePermission","process":"someProcess","screenOrientation":"landscape","stateNotNeeded":false,"taskAffinity":"testAffinity","theme":"mytheme","uiOptions":"none","windowSoftInputMode":["stateVisible","adjustResize"]},"TestActivity2":{"allowTaskReparenting":false,"alwaysRetainTaskState":false,"clearTaskOnLaunch":false,"configChanges":["mcc","mnc","locale","touchscreen","keyboard","keyboardHidden","navigation","screenLayout","fontScale","uiMode","orientation","screenSize","smallestScreenSize"],"enabled":true,"excludeFromRecents":false,"exported":true,"finishOnTaskLaunch":false,"hardwareAccelerated":false,"icon":"@drawable/icon","label":"Test Activity 2","launchMode":"standard","multiprocess":false,"name":"TestActivity2","noHistory":false,"parentActivityName":"com.example.myfirstapp.MainActivity","permission":"somePermission","process":"someProcess","screenOrientation":"landscape","stateNotNeeded":false,"taskAffinity":"testAffinity","theme":"mytheme","uiOptions":"none","windowSoftInputMode":["stateVisible","adjustResize"]}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<activity android:allowTaskReparenting="false" android:alwaysRetainTaskState="false" android:clearTaskOnLaunch="false" android:configChanges="mcc|mnc|locale|touchscreen|keyboard|keyboardHidden|navigation|screenLayout|fontScale|uiMode|orientation|screenSize|smallestScreenSize" android:enabled="true" android:excludeFromRecents="false" android:exported="true" android:finishOnTaskLaunch="false" android:hardwareAccelerated="false" android:icon="@drawable/icon" android:label="Test Activity 1" android:launchMode="standard" android:multiprocess="false" android:name="TestActivity1" android:noHistory="false" android:parentActivityName="com.example.myfirstapp.MainActivity" android:permission="somePermission" android:process="someProcess" android:screenOrientation="landscape" android:stateNotNeeded="false" android:taskAffinity="testAffinity" android:theme="mytheme" android:uiOptions="none" android:windowSoftInputMode="stateVisible|adjustResize"/>',
				'		<activity android:allowTaskReparenting="false" android:alwaysRetainTaskState="false" android:clearTaskOnLaunch="false" android:configChanges="mcc|mnc|locale|touchscreen|keyboard|keyboardHidden|navigation|screenLayout|fontScale|uiMode|orientation|screenSize|smallestScreenSize" android:enabled="true" android:excludeFromRecents="false" android:exported="true" android:finishOnTaskLaunch="false" android:hardwareAccelerated="false" android:icon="@drawable/icon" android:label="Test Activity 2" android:launchMode="standard" android:multiprocess="false" android:name="TestActivity2" android:noHistory="false" android:parentActivityName="com.example.myfirstapp.MainActivity" android:permission="somePermission" android:process="someProcess" android:screenOrientation="landscape" android:stateNotNeeded="false" android:taskAffinity="testAffinity" android:theme="mytheme" android:uiOptions="none" android:windowSoftInputMode="stateVisible|adjustResize"/>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <activity> <intent-filter>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_activity_intent-filter.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					activity: {
						TestActivity1: {
							name: 'TestActivity1',
							'intent-filter': [
								{
									icon: '@drawable/icon',
									label: 'testFilter',
									priority: 123,
									action: [ 'android.intent.action.MAIN' ],
									category: [ 'android.intent.category.LAUNCHER' ]
								},
								{
									action: [ 'android.intent.action.VIEW', 'android.intent.action.EDIT', 'android.intent.action.PICK' ],
									category: [ 'android.intent.category.DEFAULT' ],
									data: [
										{ mimeType: 'vnd.android.cursor.dir/vnd.google.note' }
									]
								},
								{
									action: [ 'android.intent.action.GET_CONTENT' ],
									category: [ 'android.intent.category.DEFAULT' ],
									data: [
										{ mimeType: 'vnd.android.cursor.item/vnd.google.note' }
									]
								},
								{
									action: [ 'android.intent.action.SEND', 'android.intent.action.SEND_MULTIPLE' ],
									category: [ 'android.intent.category.DEFAULT' ],
									data: [
										{ mimeType: 'application/vnd.google.panorama360+jpg' },
										{ mimeType: 'image/*' },
										{ mimeType: 'video/*' }
									]
								},
								{
									action: [ 'android.intent.action.VIEW' ],
									category: [ 'android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE' ]
								}
							]
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"activity":{"TestActivity1":{"name":"TestActivity1","intent-filter":[{"icon":"@drawable/icon","label":"testFilter","priority":123,"action":["android.intent.action.MAIN"],"category":["android.intent.category.LAUNCHER"]},{"action":["android.intent.action.VIEW","android.intent.action.EDIT","android.intent.action.PICK"],"category":["android.intent.category.DEFAULT"],"data":[{"mimeType":"vnd.android.cursor.dir/vnd.google.note"}]},{"action":["android.intent.action.GET_CONTENT"],"category":["android.intent.category.DEFAULT"],"data":[{"mimeType":"vnd.android.cursor.item/vnd.google.note"}]},{"action":["android.intent.action.SEND","android.intent.action.SEND_MULTIPLE"],"category":["android.intent.category.DEFAULT"],"data":[{"mimeType":"application/vnd.google.panorama360+jpg"},{"mimeType":"image/*"},{"mimeType":"video/*"}]},{"category":["android.intent.category.DEFAULT","android.intent.category.BROWSABLE"],"action":["android.intent.action.VIEW"]}]}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"application": {',
				'		"activity": {',
				'			"TestActivity1": {',
				'				"name": "TestActivity1",',
				'				"intent-filter": [',
				'					{',
				'						"icon": "@drawable/icon",',
				'						"label": "testFilter",',
				'						"priority": 123,',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.LAUNCHER"',
				'						]',
				'					},',
				'					{',
				'						"action": [',
				'							"android.intent.action.VIEW",',
				'							"android.intent.action.EDIT",',
				'							"android.intent.action.PICK"',
				'						],',
				'						"category": [',
				'							"android.intent.category.DEFAULT"',
				'						],',
				'						"data": [',
				'							{',
				'								"mimeType": "vnd.android.cursor.dir/vnd.google.note"',
				'							}',
				'						]',
				'					},',
				'					{',
				'						"action": [',
				'							"android.intent.action.GET_CONTENT"',
				'						],',
				'						"category": [',
				'							"android.intent.category.DEFAULT"',
				'						],',
				'						"data": [',
				'							{',
				'								"mimeType": "vnd.android.cursor.item/vnd.google.note"',
				'							}',
				'						]',
				'					},',
				'					{',
				'						"action": [',
				'							"android.intent.action.SEND",',
				'							"android.intent.action.SEND_MULTIPLE"',
				'						],',
				'						"category": [',
				'							"android.intent.category.DEFAULT"',
				'						],',
				'						"data": [',
				'							{',
				'								"mimeType": "application/vnd.google.panorama360+jpg"',
				'							},',
				'							{',
				'								"mimeType": "image/*"',
				'							},',
				'							{',
				'								"mimeType": "video/*"',
				'							}',
				'						]',
				'					},',
				'					{',
				'						"category": [',
				'							"android.intent.category.DEFAULT",',
				'							"android.intent.category.BROWSABLE"',
				'						],',
				'						"action": [',
				'							"android.intent.action.VIEW"',
				'						]',
				'					}',
				'				]',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<activity android:name="TestActivity1">',
				'			<intent-filter android:icon="@drawable/icon" android:label="testFilter" android:priority="123">',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.LAUNCHER"/>',
				'			</intent-filter>',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.VIEW"/>',
				'				<action android:name="android.intent.action.EDIT"/>',
				'				<action android:name="android.intent.action.PICK"/>',
				'				<category android:name="android.intent.category.DEFAULT"/>',
				'				<data android:mimeType="vnd.android.cursor.dir/vnd.google.note"/>',
				'			</intent-filter>',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.GET_CONTENT"/>',
				'				<category android:name="android.intent.category.DEFAULT"/>',
				'				<data android:mimeType="vnd.android.cursor.item/vnd.google.note"/>',
				'			</intent-filter>',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.SEND"/>',
				'				<action android:name="android.intent.action.SEND_MULTIPLE"/>',
				'				<category android:name="android.intent.category.DEFAULT"/>',
				'				<data android:mimeType="application/vnd.google.panorama360+jpg"/>',
				'				<data android:mimeType="image/*"/>',
				'				<data android:mimeType="video/*"/>',
				'			</intent-filter>',
				'			<intent-filter>',
				'				<category android:name="android.intent.category.DEFAULT"/>',
				'				<category android:name="android.intent.category.BROWSABLE"/>',
				'				<action android:name="android.intent.action.VIEW"/>',
				'			</intent-filter>',
				'		</activity>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <activity> <meta-data>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_activity_meta-data.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					activity: {
						testactivity: {
							name: 'testactivity',
							'meta-data': {
								zooVal: {
									name: 'zooVal',
									value: '@string/kangaroo'
								},
								zooRes: {
									name: 'zooRes',
									resource: '@string/kangaroo'
								}
							}
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"activity":{"testactivity":{"name":"testactivity","meta-data":{"zooVal":{"name":"zooVal","value":"@string/kangaroo"},"zooRes":{"name":"zooRes","resource":"@string/kangaroo"}}}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"application": {',
				'		"activity": {',
				'			"testactivity": {',
				'				"name": "testactivity",',
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<activity android:name="testactivity">',
				'			<meta-data android:name="zooVal" android:value="@string/kangaroo"/>',
				'			<meta-data android:name="zooRes" android:resource="@string/kangaroo"/>',
				'		</activity>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <activity-alias>', function () {
		// var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_activity-alias.xml'));
	});

	describe('<application> <meta-data>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_meta-data.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					'meta-data': {
						zooVal: {
							name: 'zooVal',
							value: '@string/kangaroo'
						},
						zooRes: {
							name: 'zooRes',
							resource: '@string/kangaroo'
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"meta-data":{"zooVal":{"name":"zooVal","value":"@string/kangaroo"},"zooRes":{"name":"zooRes","resource":"@string/kangaroo"}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"application": {',
				'		"meta-data": {',
				'			"zooVal": {',
				'				"name": "zooVal",',
				'				"value": "@string/kangaroo"',
				'			},',
				'			"zooRes": {',
				'				"name": "zooRes",',
				'				"resource": "@string/kangaroo"',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<meta-data android:name="zooVal" android:value="@string/kangaroo"/>',
				'		<meta-data android:name="zooRes" android:resource="@string/kangaroo"/>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <provider>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_provider.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					provider: {
						testprovider1: {
							authorities: 'com.example.provider.cartoonprovider',
							enabled: true,
							exported: false,
							grantUriPermissions: false,
							icon: '@drawable/icon',
							initOrder: 1,
							label: 'test provider 1',
							multiprocess: false,
							name: 'testprovider1',
							permission: 'testPermission',
							process: 'testProcess',
							readPermission: 'somePermission',
							syncable: false,
							writePermission: 'somePermission'
						},
						testprovider2: {
							authorities: 'com.example.provider.cartoonprovider',
							enabled: true,
							exported: false,
							grantUriPermissions: false,
							icon: '@drawable/icon',
							initOrder: 2,
							label: 'test provider 2',
							multiprocess: false,
							name: 'testprovider2',
							permission: 'testPermission',
							process: 'testProcess',
							readPermission: 'somePermission',
							syncable: false,
							writePermission: 'somePermission'
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"provider":{"testprovider1":{"authorities":"com.example.provider.cartoonprovider","enabled":true,"exported":false,"grantUriPermissions":false,"icon":"@drawable/icon","initOrder":1,"label":"test provider 1","multiprocess":false,"name":"testprovider1","permission":"testPermission","process":"testProcess","readPermission":"somePermission","syncable":false,"writePermission":"somePermission"},"testprovider2":{"authorities":"com.example.provider.cartoonprovider","enabled":true,"exported":false,"grantUriPermissions":false,"icon":"@drawable/icon","initOrder":2,"label":"test provider 2","multiprocess":false,"name":"testprovider2","permission":"testPermission","process":"testProcess","readPermission":"somePermission","syncable":false,"writePermission":"somePermission"}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<provider android:authorities="com.example.provider.cartoonprovider" android:enabled="true" android:exported="false" android:grantUriPermissions="false" android:icon="@drawable/icon" android:initOrder="1" android:label="test provider 1" android:multiprocess="false" android:name="testprovider1" android:permission="testPermission" android:process="testProcess" android:readPermission="somePermission" android:syncable="false" android:writePermission="somePermission"/>',
				'		<provider android:authorities="com.example.provider.cartoonprovider" android:enabled="true" android:exported="false" android:grantUriPermissions="false" android:icon="@drawable/icon" android:initOrder="2" android:label="test provider 2" android:multiprocess="false" android:name="testprovider2" android:permission="testPermission" android:process="testProcess" android:readPermission="somePermission" android:syncable="false" android:writePermission="somePermission"/>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <provider> <grant-uri-permission>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_provider_grant-uri-permission.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					provider: {
						testprovider: {
							name: 'testprovider',
							'grant-uri-permission': [
								{
									path: '/test',
									pathPattern: '.*',
									pathPrefix: 'ti'
								},
								{
									path: '/sample',
									pathPattern: '.*',
									pathPrefix: 'test_'
								}
							]
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"provider":{"testprovider":{"name":"testprovider","grant-uri-permission":[{"path":"/test","pathPattern":".*","pathPrefix":"ti"},{"path":"/sample","pathPattern":".*","pathPrefix":"test_"}]}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<provider android:name="testprovider">',
				'			<grant-uri-permission android:path="/test" android:pathPattern=".*" android:pathPrefix="ti"/>',
				'			<grant-uri-permission android:path="/sample" android:pathPattern=".*" android:pathPrefix="test_"/>',
				'		</provider>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <provider> <meta-data>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_provider_meta-data.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					provider: {
						testprovider: {
							name: 'testprovider',
							'meta-data': {
								zooVal: {
									name: 'zooVal',
									value: '@string/kangaroo'
								},
								zooRes: {
									name: 'zooRes',
									resource: '@string/kangaroo'
								}
							}
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"provider":{"testprovider":{"name":"testprovider","meta-data":{"zooVal":{"name":"zooVal","value":"@string/kangaroo"},"zooRes":{"name":"zooRes","resource":"@string/kangaroo"}}}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<provider android:name="testprovider">',
				'			<meta-data android:name="zooVal" android:value="@string/kangaroo"/>',
				'			<meta-data android:name="zooRes" android:resource="@string/kangaroo"/>',
				'		</provider>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <provider> <path-permission>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_provider_path-permission.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					provider: {
						testprovider: {
							name: 'testprovider',
							'path-permission': [
								{
									path: '/test',
									pathPrefix: 'ti_',
									pathPattern: '.*',
									permission: 'somePermission',
									readPermission: 'somePermission',
									writePermission: 'somePermission'
								},
								{
									path: '/sample',
									pathPrefix: 'test_',
									pathPattern: '.*',
									permission: 'somePermission',
									readPermission: 'somePermission',
									writePermission: 'somePermission'
								}
							]
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"provider":{"testprovider":{"name":"testprovider","path-permission":[{"path":"/test","pathPrefix":"ti_","pathPattern":".*","permission":"somePermission","readPermission":"somePermission","writePermission":"somePermission"},{"path":"/sample","pathPrefix":"test_","pathPattern":".*","permission":"somePermission","readPermission":"somePermission","writePermission":"somePermission"}]}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<provider android:name="testprovider">',
				'			<path-permission android:path="/test" android:pathPrefix="ti_" android:pathPattern=".*" android:permission="somePermission" android:readPermission="somePermission" android:writePermission="somePermission"/>',
				'			<path-permission android:path="/sample" android:pathPrefix="test_" android:pathPattern=".*" android:permission="somePermission" android:readPermission="somePermission" android:writePermission="somePermission"/>',
				'		</provider>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<application> <reciever>', function () {
		// var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_reciever.xml'));
	});

	describe('<application> <service>', function () {
		// var am = new AndroidManifest(path.resolve('./resources/AndroidManifest_application_service.xml'));
	});

	describe('<application> <uses-library>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application_uses-library.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					'uses-library': {
						lib1: {
							name: 'lib1',
							required: true
						},
						lib2: {
							name: 'lib2',
							required: false
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"uses-library":{"lib1":{"name":"lib1","required":true},"lib2":{"name":"lib2","required":false}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<uses-library android:name="lib1" android:required="true"/>',
				'		<uses-library android:name="lib2" android:required="false"/>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<compatible-screens>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_compatible-screens.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				'compatible-screens': [
					{
						screenSize: 'small',
						screenDensity: 'ldpi'
					},
					{
						screenSize: 'small',
						screenDensity: 'mdpi'
					},
					{
						screenSize: 'small',
						screenDensity: 'hdpi'
					},
					{
						screenSize: 'small',
						screenDensity: 'xhdpi'
					},
					{
						screenSize: 'normal',
						screenDensity: 'ldpi'
					},
					{
						screenSize: 'normal',
						screenDensity: 'mdpi'
					},
					{
						screenSize: 'normal',
						screenDensity: 'hdpi'
					},
					{
						screenSize: 'normal',
						screenDensity: 'xhdpi'
					}
				]
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"compatible-screens":[{"screenSize":"small","screenDensity":"ldpi"},{"screenSize":"small","screenDensity":"mdpi"},{"screenSize":"small","screenDensity":"hdpi"},{"screenSize":"small","screenDensity":"xhdpi"},{"screenSize":"normal","screenDensity":"ldpi"},{"screenSize":"normal","screenDensity":"mdpi"},{"screenSize":"normal","screenDensity":"hdpi"},{"screenSize":"normal","screenDensity":"xhdpi"}]}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<compatible-screens>',
				'		<screen android:screenSize="small" android:screenDensity="ldpi"/>',
				'		<screen android:screenSize="small" android:screenDensity="mdpi"/>',
				'		<screen android:screenSize="small" android:screenDensity="hdpi"/>',
				'		<screen android:screenSize="small" android:screenDensity="xhdpi"/>',
				'		<screen android:screenSize="normal" android:screenDensity="ldpi"/>',
				'		<screen android:screenSize="normal" android:screenDensity="mdpi"/>',
				'		<screen android:screenSize="normal" android:screenDensity="hdpi"/>',
				'		<screen android:screenSize="normal" android:screenDensity="xhdpi"/>',
				'	</compatible-screens>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<instrumentation>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_instrumentation.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
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
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"instrumentation":{".app.LocalSampleInstrumentation":{"name":".app.LocalSampleInstrumentation","targetPackage":"com.example.android.apis","label":"Local Sample"},".app.LocalTestInstrumentation":{"name":".app.LocalTestInstrumentation","targetPackage":"com.example.test.apis","label":"Local Test","functionalTest":true,"handleProfiling":true,"icon":"drawable resource"}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<instrumentation android:name=".app.LocalSampleInstrumentation" android:targetPackage="com.example.android.apis" android:label="Local Sample"/>',
				'	<instrumentation android:name=".app.LocalTestInstrumentation" android:targetPackage="com.example.test.apis" android:label="Local Test" android:functionalTest="true" android:handleProfiling="true" android:icon="drawable resource"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<permission>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_permission.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
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
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"permission":{"test1":{"description":"test 1","icon":"drawable resource","label":"string resource","name":"test1","permissionGroup":"string","protectionLevel":"normal"},"test2":{"description":"test 2","icon":"drawable resource","label":"string resource","name":"test2","permissionGroup":"string","protectionLevel":"normal"},"test3":{"description":"test 3","icon":"drawable resource","label":"string resource","name":"test3","permissionGroup":"string","protectionLevel":"normal"}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<permission android:description="test 1" android:icon="drawable resource" android:label="string resource" android:name="test1" android:permissionGroup="string" android:protectionLevel="normal"/>',
				'	<permission android:description="test 2" android:icon="drawable resource" android:label="string resource" android:name="test2" android:permissionGroup="string" android:protectionLevel="normal"/>',
				'	<permission android:description="test 3" android:icon="drawable resource" android:label="string resource" android:name="test3" android:permissionGroup="string" android:protectionLevel="normal"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<permission-group>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_permission-group.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
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
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"permission-group":{"test1":{"description":"string resource","icon":"drawable resource","label":"string resource","name":"test1"},"test2":{"description":"string resource","icon":"drawable resource","label":"string resource","name":"test2"},"test3":{"description":"string resource","icon":"drawable resource","label":"string resource","name":"test3"}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<permission-group android:description="string resource" android:icon="drawable resource" android:label="string resource" android:name="test1"/>',
				'	<permission-group android:description="string resource" android:icon="drawable resource" android:label="string resource" android:name="test2"/>',
				'	<permission-group android:description="string resource" android:icon="drawable resource" android:label="string resource" android:name="test3"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<permission-tree>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_permission-tree.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
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
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"permission-tree":{"test1":{"icon":"drawable resource","label":"string resource","name":"test1"},"test2":{"icon":"drawable resource","label":"string resource","name":"test2"},"test3":{"icon":"drawable resource","label":"string resource","name":"test3"}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<permission-tree android:icon="drawable resource" android:label="string resource" android:name="test1"/>',
				'	<permission-tree android:icon="drawable resource" android:label="string resource" android:name="test2"/>',
				'	<permission-tree android:icon="drawable resource" android:label="string resource" android:name="test3"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<supports-gl-texture>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_supports-gl-texture.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				'supports-gl-texture': [
					'GL_OES_compressed_ETC1_RGB8_texture',
					'GL_OES_compressed_paletted_texture'
				]
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"supports-gl-texture":["GL_OES_compressed_ETC1_RGB8_texture","GL_OES_compressed_paletted_texture"]}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"supports-gl-texture": [',
				'		"GL_OES_compressed_ETC1_RGB8_texture",',
				'		"GL_OES_compressed_paletted_texture"',
				'	]',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<supports-gl-texture android:name="GL_OES_compressed_ETC1_RGB8_texture"/>',
				'	<supports-gl-texture android:name="GL_OES_compressed_paletted_texture"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<supports-screens>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_supports-screens.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				'supports-screens': {
					anyDensity: false,
					resizeable: true,
					smallScreens: true,
					normalScreens: true,
					largeScreens: true,
					xlargeScreens: true,
					requiresSmallestWidthDp: 320,
					compatibleWidthLimitDp: 480,
					largestWidthLimitDp: 2048
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"supports-screens":{"anyDensity":false,"resizeable":true,"smallScreens":true,"normalScreens":true,"largeScreens":true,"xlargeScreens":true,"requiresSmallestWidthDp":320,"compatibleWidthLimitDp":480,"largestWidthLimitDp":2048}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<supports-screens android:anyDensity="false" android:resizeable="true" android:smallScreens="true" android:normalScreens="true" android:largeScreens="true" android:xlargeScreens="true" android:requiresSmallestWidthDp="320" android:compatibleWidthLimitDp="480" android:largestWidthLimitDp="2048"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<uses-configuration>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_uses-configuration.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
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
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"uses-configuration":[{"reqFiveWayNav":true,"reqTouchScreen":"finger","reqKeyboardType":"qwerty"},{"reqFiveWayNav":true,"reqTouchScreen":"finger","reqKeyboardType":"twelvekey"}]}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<uses-configuration android:reqFiveWayNav="true" android:reqTouchScreen="finger" android:reqKeyboardType="qwerty"/>',
				'	<uses-configuration android:reqFiveWayNav="true" android:reqTouchScreen="finger" android:reqKeyboardType="twelvekey"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<uses-feature>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_uses-feature.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				'uses-feature': [
					{
						name: 'android.hardware.bluetooth',
						required: false,
						glEsVersion: 1
					},
					{
						name: 'android.hardware.camera',
						required: true,
						glEsVersion: 1
					},
					{
						required: true,
						glEsVersion: '0x00020000'
					},
					{
						required: true,
						glEsVersion: '0x00030000'
					}
				]
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"uses-feature":[{"name":"android.hardware.bluetooth","required":false,"glEsVersion":1},{"name":"android.hardware.camera","required":true,"glEsVersion":1},{"glEsVersion":"0x00020000","required":true},{"glEsVersion":"0x00030000","required":true}]}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"uses-feature": [',
				'		{',
				'			"name": "android.hardware.bluetooth",',
				'			"required": false,',
				'			"glEsVersion": 1',
				'		},',
				'		{',
				'			"name": "android.hardware.camera",',
				'			"required": true,',
				'			"glEsVersion": 1',
				'		},',
				'		{',
				'			"glEsVersion": "0x00020000",',
				'			"required": true',
				'		},',
				'		{',
				'			"glEsVersion": "0x00030000",',
				'			"required": true',
				'		}',
				'	]',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<uses-feature android:name="android.hardware.bluetooth" android:required="false" android:glEsVersion="1"/>',
				'	<uses-feature android:name="android.hardware.camera" android:required="true" android:glEsVersion="1"/>',
				'	<uses-feature android:glEsVersion="0x00020000" android:required="true"/>',
				'	<uses-feature android:glEsVersion="0x00030000" android:required="true"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<uses-permission>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_uses-permission.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				'uses-permission': [
					'android.permission.CAMERA',
					'android.permission.READ_CONTACTS'
				]
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"uses-permission":["android.permission.CAMERA","android.permission.READ_CONTACTS"]}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"uses-permission": [',
				'		"android.permission.CAMERA",',
				'		"android.permission.READ_CONTACTS"',
				'	]',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<uses-permission android:name="android.permission.CAMERA"/>',
				'	<uses-permission android:name="android.permission.READ_CONTACTS"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('<uses-sdk>', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_uses-sdk.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				'uses-sdk': {
					minSdkVersion: 10,
					targetSdkVersion: 14,
					maxSdkVersion: 18
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"uses-sdk":{"minSdkVersion":10,"targetSdkVersion":14,"maxSdkVersion":18}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"uses-sdk": {',
				'		"minSdkVersion": 10,',
				'		"targetSdkVersion": 14,',
				'		"maxSdkVersion": 18',
				'	}',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<uses-sdk android:minSdkVersion="10" android:targetSdkVersion="14" android:maxSdkVersion="18"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('AndroidManifest.xml Sample 1', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample1.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				__attr__: {
					'xmlns:android': 'http://schemas.android.com/apk/res/android',
					package: 'com.appcelerator.testapp',
					'android:versionCode': 1,
					'android:versionName': '1.0'
				},
				'uses-sdk': { minSdkVersion: 10, targetSdkVersion: 14, maxSdkVersion: 18 },
				application: {
					icon: '@drawable/appicon',
					label: 'Testapp',
					name: 'TestappApplication',
					debuggable: false,
					activity: {
						'.TestappActivity': {
							name: '.TestappActivity',
							label: 'Testapp',
							theme: '@style/Theme.Titanium',
							configChanges: [ 'keyboardHidden', 'orientation' ],
							'intent-filter': [
								{
									action: [ 'android.intent.action.MAIN' ],
									category: [ 'android.intent.category.LAUNCHER' ]
								}
							]
						},
						'org.appcelerator.titanium.TiActivity': {
							name: 'org.appcelerator.titanium.TiActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ]
						},
						'org.appcelerator.titanium.TiTranslucentActivity': {
							name: 'org.appcelerator.titanium.TiTranslucentActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ],
							theme: '@android:style/Theme.Translucent'
						},
						'ti.modules.titanium.ui.android.TiPreferencesActivity': {
							name: 'ti.modules.titanium.ui.android.TiPreferencesActivity'
						}
					},
					service: {
						'org.appcelerator.titanium.analytics.TiAnalyticsService': {
							name: 'org.appcelerator.titanium.analytics.TiAnalyticsService',
							exported: false
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"__attr__":{"xmlns:android":"http://schemas.android.com/apk/res/android","package":"com.appcelerator.testapp","android:versionCode":1,"android:versionName":"1.0"},"uses-sdk":{"minSdkVersion":10,"targetSdkVersion":14,"maxSdkVersion":18},"application":{"icon":"@drawable/appicon","label":"Testapp","name":"TestappApplication","debuggable":false,"activity":{".TestappActivity":{"name":".TestappActivity","label":"Testapp","theme":"@style/Theme.Titanium","configChanges":["keyboardHidden","orientation"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.LAUNCHER"]}]},"org.appcelerator.titanium.TiActivity":{"name":"org.appcelerator.titanium.TiActivity","configChanges":["keyboardHidden","orientation"]},"org.appcelerator.titanium.TiTranslucentActivity":{"name":"org.appcelerator.titanium.TiTranslucentActivity","configChanges":["keyboardHidden","orientation"],"theme":"@android:style/Theme.Translucent"},"ti.modules.titanium.ui.android.TiPreferencesActivity":{"name":"ti.modules.titanium.ui.android.TiPreferencesActivity"}},"service":{"org.appcelerator.titanium.analytics.TiAnalyticsService":{"name":"org.appcelerator.titanium.analytics.TiAnalyticsService","exported":false}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"__attr__": {',
				'		"xmlns:android": "http://schemas.android.com/apk/res/android",',
				'		"package": "com.appcelerator.testapp",',
				'		"android:versionCode": 1,',
				'		"android:versionName": "1.0"',
				'	},',
				'	"uses-sdk": {',
				'		"minSdkVersion": 10,',
				'		"targetSdkVersion": 14,',
				'		"maxSdkVersion": 18',
				'	},',
				'	"application": {',
				'		"icon": "@drawable/appicon",',
				'		"label": "Testapp",',
				'		"name": "TestappApplication",',
				'		"debuggable": false,',
				'		"activity": {',
				'			".TestappActivity": {',
				'				"name": ".TestappActivity",',
				'				"label": "Testapp",',
				'				"theme": "@style/Theme.Titanium",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.LAUNCHER"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			"org.appcelerator.titanium.TiActivity": {',
				'				"name": "org.appcelerator.titanium.TiActivity",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				]',
				'			},',
				'			"org.appcelerator.titanium.TiTranslucentActivity": {',
				'				"name": "org.appcelerator.titanium.TiTranslucentActivity",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"theme": "@android:style/Theme.Translucent"',
				'			},',
				'			"ti.modules.titanium.ui.android.TiPreferencesActivity": {',
				'				"name": "ti.modules.titanium.ui.android.TiPreferencesActivity"',
				'			}',
				'		},',
				'		"service": {',
				'			"org.appcelerator.titanium.analytics.TiAnalyticsService": {',
				'				"name": "org.appcelerator.titanium.analytics.TiAnalyticsService",',
				'				"exported": false',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.appcelerator.testapp" android:versionCode="1" android:versionName="1.0">',
				'	<uses-sdk android:minSdkVersion="10" android:targetSdkVersion="14" android:maxSdkVersion="18"/>',
				'	<application android:icon="@drawable/appicon" android:label="Testapp" android:name="TestappApplication" android:debuggable="false">',
				'		<activity android:name=".TestappActivity" android:label="Testapp" android:theme="@style/Theme.Titanium" android:configChanges="keyboardHidden|orientation">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.LAUNCHER"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name="org.appcelerator.titanium.TiActivity" android:configChanges="keyboardHidden|orientation"/>',
				'		<activity android:name="org.appcelerator.titanium.TiTranslucentActivity" android:configChanges="keyboardHidden|orientation" android:theme="@android:style/Theme.Translucent"/>',
				'		<activity android:name="ti.modules.titanium.ui.android.TiPreferencesActivity"/>',
				'		<service android:name="org.appcelerator.titanium.analytics.TiAnalyticsService" android:exported="false"/>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('AndroidManifest.xml Sample 2', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample2.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				__attr__: {
					'android:versionCode': 1,
					'android:versionName': '1',
					package: 'com.appcelerator.testapp2',
					'xmlns:android': 'http://schemas.android.com/apk/res/android'
				},
				'uses-sdk': { minSdkVersion: 10, targetSdkVersion: 17 },
				permission: {
					'com.appcelerator.testapp2.permission.C2D_MESSAGE': {
						name: 'com.appcelerator.testapp2.permission.C2D_MESSAGE',
						protectionLevel: 'signature'
					}
				},
				application: {
					debuggable: false,
					icon: '@drawable/appicon',
					label: 'testapp2',
					name: 'Testapp2Application',
					activity: {
						'.TestappActivity': {
							alwaysRetainTaskState: true,
							configChanges: [ 'keyboardHidden', 'orientation' ],
							label: 'testapp',
							name: '.TestappActivity',
							theme: '@style/Theme.Titanium',
							'intent-filter': [
								{
									action: [ 'android.intent.action.MAIN' ],
									category: [ 'android.intent.category.LAUNCHER' ]
								}
							]
						},
						'.Testapp2Activity': {
							configChanges: [ 'keyboardHidden', 'orientation' ],
							label: 'testapp2',
							name: '.Testapp2Activity',
							theme: '@style/Theme.Titanium',
							'intent-filter': [
								{
									action: [ 'android.intent.action.MAIN' ],
									category: [ 'android.intent.category.LAUNCHER' ]
								}
							]
						},
						'com.appcelerator.testapp2.TestactivityActivity': {
							configChanges: [ 'keyboardHidden', 'orientation' ],
							name: 'com.appcelerator.testapp2.TestactivityActivity'
						},
						'org.appcelerator.titanium.TiActivity': {
							configChanges: [ 'keyboardHidden', 'orientation' ],
							name: 'org.appcelerator.titanium.TiActivity'
						},
						'org.appcelerator.titanium.TiTranslucentActivity': {
							configChanges: [ 'keyboardHidden', 'orientation' ],
							name: 'org.appcelerator.titanium.TiTranslucentActivity',
							theme: '@android:style/Theme.Translucent'
						},
						'ti.modules.titanium.ui.android.TiPreferencesActivity': {
							name: 'ti.modules.titanium.ui.android.TiPreferencesActivity'
						}
					},
					service: {
						'com.appcelerator.cloud.push.PushService': {
							name: 'com.appcelerator.cloud.push.PushService'
						},
						'org.appcelerator.titanium.analytics.TiAnalyticsService': {
							exported: false,
							name: 'org.appcelerator.titanium.analytics.TiAnalyticsService'
						},
						'com.appcelerator.testapp2.TestserviceService': {
							name: 'com.appcelerator.testapp2.TestserviceService'
						}
					},
					receiver: {
						'ti.cloudpush.IntentReceiver': {
							name: 'ti.cloudpush.IntentReceiver'
						},
						'ti.cloudpush.MQTTReceiver': {
							name: 'ti.cloudpush.MQTTReceiver',
							'intent-filter': [
								{
									action: [
										'android.intent.action.BOOT_COMPLETED',
										'android.intent.action.USER_PRESENT',
										'com.appcelerator.cloud.push.PushService.MSG_ARRIVAL'
									],
									category: [ 'android.intent.category.HOME' ]
								}
							],
							'meta-data': {
								'com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity': {
									name: 'com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity',
									value: 'ti.cloudpush.MQTTReceiver'
								}
							}
						},
						'ti.cloudpush.GCMReceiver': {
							name: 'ti.cloudpush.GCMReceiver',
							permission: 'com.google.android.c2dm.permission.SEND',
							'intent-filter': [
								{
									action: [ 'com.google.android.c2dm.intent.RECEIVE' ],
									category: [ 'com.appcelerator.testapp2' ]
								}
							]
						},
						'com.appcelerator.cloud.push.PushBroadcastReceiver': {
							name: 'com.appcelerator.cloud.push.PushBroadcastReceiver',
							permission: 'com.google.android.c2dm.permission.SEND',
							'intent-filter': [
								{
									action: [ 'com.google.android.c2dm.intent.REGISTRATION' ],
									category: [ 'com.appcelerator.testapp2' ]
								}
							]

						}
					}
				},
				'uses-permission': [
					'android.permission.VIBRATE',
					'android.permission.ACCESS_NETWORK_STATE',
					'android.permission.WRITE_EXTERNAL_STORAGE',
					'com.google.android.c2dm.permission.RECEIVE',
					'android.permission.WAKE_LOCK',
					'android.permission.ACCESS_WIFI_STATE',
					'android.permission.RECEIVE_BOOT_COMPLETED',
					'com.appcelerator.testapp2.permission.C2D_MESSAGE',
					'android.permission.READ_PHONE_STATE',
					'android.permission.INTERNET',
					'android.permission.GET_ACCOUNTS'
				]
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"__attr__":{"android:versionCode":1,"android:versionName":"1","package":"com.appcelerator.testapp2","xmlns:android":"http://schemas.android.com/apk/res/android"},"uses-sdk":{"minSdkVersion":10,"targetSdkVersion":17},"permission":{"com.appcelerator.testapp2.permission.C2D_MESSAGE":{"name":"com.appcelerator.testapp2.permission.C2D_MESSAGE","protectionLevel":"signature"}},"application":{"debuggable":false,"icon":"@drawable/appicon","label":"testapp2","name":"Testapp2Application","activity":{".TestappActivity":{"alwaysRetainTaskState":true,"configChanges":["keyboardHidden","orientation"],"label":"testapp","name":".TestappActivity","theme":"@style/Theme.Titanium","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.LAUNCHER"]}]},".Testapp2Activity":{"configChanges":["keyboardHidden","orientation"],"label":"testapp2","name":".Testapp2Activity","theme":"@style/Theme.Titanium","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.LAUNCHER"]}]},"com.appcelerator.testapp2.TestactivityActivity":{"configChanges":["keyboardHidden","orientation"],"name":"com.appcelerator.testapp2.TestactivityActivity"},"org.appcelerator.titanium.TiActivity":{"configChanges":["keyboardHidden","orientation"],"name":"org.appcelerator.titanium.TiActivity"},"org.appcelerator.titanium.TiTranslucentActivity":{"configChanges":["keyboardHidden","orientation"],"name":"org.appcelerator.titanium.TiTranslucentActivity","theme":"@android:style/Theme.Translucent"},"ti.modules.titanium.ui.android.TiPreferencesActivity":{"name":"ti.modules.titanium.ui.android.TiPreferencesActivity"}},"service":{"com.appcelerator.cloud.push.PushService":{"name":"com.appcelerator.cloud.push.PushService"},"org.appcelerator.titanium.analytics.TiAnalyticsService":{"exported":false,"name":"org.appcelerator.titanium.analytics.TiAnalyticsService"},"com.appcelerator.testapp2.TestserviceService":{"name":"com.appcelerator.testapp2.TestserviceService"}},"receiver":{"ti.cloudpush.IntentReceiver":{"name":"ti.cloudpush.IntentReceiver"},"ti.cloudpush.MQTTReceiver":{"name":"ti.cloudpush.MQTTReceiver","intent-filter":[{"action":["android.intent.action.BOOT_COMPLETED","android.intent.action.USER_PRESENT","com.appcelerator.cloud.push.PushService.MSG_ARRIVAL"],"category":["android.intent.category.HOME"]}],"meta-data":{"com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity":{"name":"com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity","value":"ti.cloudpush.MQTTReceiver"}}},"ti.cloudpush.GCMReceiver":{"name":"ti.cloudpush.GCMReceiver","permission":"com.google.android.c2dm.permission.SEND","intent-filter":[{"action":["com.google.android.c2dm.intent.RECEIVE"],"category":["com.appcelerator.testapp2"]}]},"com.appcelerator.cloud.push.PushBroadcastReceiver":{"name":"com.appcelerator.cloud.push.PushBroadcastReceiver","permission":"com.google.android.c2dm.permission.SEND","intent-filter":[{"action":["com.google.android.c2dm.intent.REGISTRATION"],"category":["com.appcelerator.testapp2"]}]}}},"uses-permission":["android.permission.VIBRATE","android.permission.ACCESS_NETWORK_STATE","android.permission.WRITE_EXTERNAL_STORAGE","com.google.android.c2dm.permission.RECEIVE","android.permission.WAKE_LOCK","android.permission.ACCESS_WIFI_STATE","android.permission.RECEIVE_BOOT_COMPLETED","com.appcelerator.testapp2.permission.C2D_MESSAGE","android.permission.READ_PHONE_STATE","android.permission.INTERNET","android.permission.GET_ACCOUNTS"]}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"__attr__": {',
				'		"android:versionCode": 1,',
				'		"android:versionName": "1",',
				'		"package": "com.appcelerator.testapp2",',
				'		"xmlns:android": "http://schemas.android.com/apk/res/android"',
				'	},',
				'	"uses-sdk": {',
				'		"minSdkVersion": 10,',
				'		"targetSdkVersion": 17',
				'	},',
				'	"permission": {',
				'		"com.appcelerator.testapp2.permission.C2D_MESSAGE": {',
				'			"name": "com.appcelerator.testapp2.permission.C2D_MESSAGE",',
				'			"protectionLevel": "signature"',
				'		}',
				'	},',
				'	"application": {',
				'		"debuggable": false,',
				'		"icon": "@drawable/appicon",',
				'		"label": "testapp2",',
				'		"name": "Testapp2Application",',
				'		"activity": {',
				'			".TestappActivity": {',
				'				"alwaysRetainTaskState": true,',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"label": "testapp",',
				'				"name": ".TestappActivity",',
				'				"theme": "@style/Theme.Titanium",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.LAUNCHER"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".Testapp2Activity": {',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"label": "testapp2",',
				'				"name": ".Testapp2Activity",',
				'				"theme": "@style/Theme.Titanium",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.LAUNCHER"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			"com.appcelerator.testapp2.TestactivityActivity": {',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"name": "com.appcelerator.testapp2.TestactivityActivity"',
				'			},',
				'			"org.appcelerator.titanium.TiActivity": {',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"name": "org.appcelerator.titanium.TiActivity"',
				'			},',
				'			"org.appcelerator.titanium.TiTranslucentActivity": {',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"name": "org.appcelerator.titanium.TiTranslucentActivity",',
				'				"theme": "@android:style/Theme.Translucent"',
				'			},',
				'			"ti.modules.titanium.ui.android.TiPreferencesActivity": {',
				'				"name": "ti.modules.titanium.ui.android.TiPreferencesActivity"',
				'			}',
				'		},',
				'		"service": {',
				'			"com.appcelerator.cloud.push.PushService": {',
				'				"name": "com.appcelerator.cloud.push.PushService"',
				'			},',
				'			"org.appcelerator.titanium.analytics.TiAnalyticsService": {',
				'				"exported": false,',
				'				"name": "org.appcelerator.titanium.analytics.TiAnalyticsService"',
				'			},',
				'			"com.appcelerator.testapp2.TestserviceService": {',
				'				"name": "com.appcelerator.testapp2.TestserviceService"',
				'			}',
				'		},',
				'		"receiver": {',
				'			"ti.cloudpush.IntentReceiver": {',
				'				"name": "ti.cloudpush.IntentReceiver"',
				'			},',
				'			"ti.cloudpush.MQTTReceiver": {',
				'				"name": "ti.cloudpush.MQTTReceiver",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.BOOT_COMPLETED",',
				'							"android.intent.action.USER_PRESENT",',
				'							"com.appcelerator.cloud.push.PushService.MSG_ARRIVAL"',
				'						],',
				'						"category": [',
				'							"android.intent.category.HOME"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity": {',
				'						"name": "com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity",',
				'						"value": "ti.cloudpush.MQTTReceiver"',
				'					}',
				'				}',
				'			},',
				'			"ti.cloudpush.GCMReceiver": {',
				'				"name": "ti.cloudpush.GCMReceiver",',
				'				"permission": "com.google.android.c2dm.permission.SEND",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"com.google.android.c2dm.intent.RECEIVE"',
				'						],',
				'						"category": [',
				'							"com.appcelerator.testapp2"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			"com.appcelerator.cloud.push.PushBroadcastReceiver": {',
				'				"name": "com.appcelerator.cloud.push.PushBroadcastReceiver",',
				'				"permission": "com.google.android.c2dm.permission.SEND",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"com.google.android.c2dm.intent.REGISTRATION"',
				'						],',
				'						"category": [',
				'							"com.appcelerator.testapp2"',
				'						]',
				'					}',
				'				]',
				'			}',
				'		}',
				'	},',
				'	"uses-permission": [',
				'		"android.permission.VIBRATE",',
				'		"android.permission.ACCESS_NETWORK_STATE",',
				'		"android.permission.WRITE_EXTERNAL_STORAGE",',
				'		"com.google.android.c2dm.permission.RECEIVE",',
				'		"android.permission.WAKE_LOCK",',
				'		"android.permission.ACCESS_WIFI_STATE",',
				'		"android.permission.RECEIVE_BOOT_COMPLETED",',
				'		"com.appcelerator.testapp2.permission.C2D_MESSAGE",',
				'		"android.permission.READ_PHONE_STATE",',
				'		"android.permission.INTERNET",',
				'		"android.permission.GET_ACCOUNTS"',
				'	]',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest android:versionCode="1" android:versionName="1" package="com.appcelerator.testapp2" xmlns:android="http://schemas.android.com/apk/res/android">',
				'	<uses-sdk android:minSdkVersion="10" android:targetSdkVersion="17"/>',
				'	<permission android:name="com.appcelerator.testapp2.permission.C2D_MESSAGE" android:protectionLevel="signature"/>',
				'	<application android:debuggable="false" android:icon="@drawable/appicon" android:label="testapp2" android:name="Testapp2Application">',
				'		<activity android:alwaysRetainTaskState="true" android:configChanges="keyboardHidden|orientation" android:label="testapp" android:name=".TestappActivity" android:theme="@style/Theme.Titanium">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.LAUNCHER"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:configChanges="keyboardHidden|orientation" android:label="testapp2" android:name=".Testapp2Activity" android:theme="@style/Theme.Titanium">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.LAUNCHER"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:configChanges="keyboardHidden|orientation" android:name="com.appcelerator.testapp2.TestactivityActivity"/>',
				'		<activity android:configChanges="keyboardHidden|orientation" android:name="org.appcelerator.titanium.TiActivity"/>',
				'		<activity android:configChanges="keyboardHidden|orientation" android:name="org.appcelerator.titanium.TiTranslucentActivity" android:theme="@android:style/Theme.Translucent"/>',
				'		<activity android:name="ti.modules.titanium.ui.android.TiPreferencesActivity"/>',
				'		<service android:name="com.appcelerator.cloud.push.PushService"/>',
				'		<service android:exported="false" android:name="org.appcelerator.titanium.analytics.TiAnalyticsService"/>',
				'		<service android:name="com.appcelerator.testapp2.TestserviceService"/>',
				'		<receiver android:name="ti.cloudpush.IntentReceiver"/>',
				'		<receiver android:name="ti.cloudpush.MQTTReceiver">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.BOOT_COMPLETED"/>',
				'				<action android:name="android.intent.action.USER_PRESENT"/>',
				'				<action android:name="com.appcelerator.cloud.push.PushService.MSG_ARRIVAL"/>',
				'				<category android:name="android.intent.category.HOME"/>',
				'			</intent-filter>',
				'			<meta-data android:name="com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity" android:value="ti.cloudpush.MQTTReceiver"/>',
				'		</receiver>',
				'		<receiver android:name="ti.cloudpush.GCMReceiver" android:permission="com.google.android.c2dm.permission.SEND">',
				'			<intent-filter>',
				'				<action android:name="com.google.android.c2dm.intent.RECEIVE"/>',
				'				<category android:name="com.appcelerator.testapp2"/>',
				'			</intent-filter>',
				'		</receiver>',
				'		<receiver android:name="com.appcelerator.cloud.push.PushBroadcastReceiver" android:permission="com.google.android.c2dm.permission.SEND">',
				'			<intent-filter>',
				'				<action android:name="com.google.android.c2dm.intent.REGISTRATION"/>',
				'				<category android:name="com.appcelerator.testapp2"/>',
				'			</intent-filter>',
				'		</receiver>',
				'	</application>',
				'	<uses-permission android:name="android.permission.VIBRATE"/>',
				'	<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>',
				'	<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>',
				'	<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>',
				'	<uses-permission android:name="android.permission.WAKE_LOCK"/>',
				'	<uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>',
				'	<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>',
				'	<uses-permission android:name="com.appcelerator.testapp2.permission.C2D_MESSAGE"/>',
				'	<uses-permission android:name="android.permission.READ_PHONE_STATE"/>',
				'	<uses-permission android:name="android.permission.INTERNET"/>',
				'	<uses-permission android:name="android.permission.GET_ACCOUNTS"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('AndroidManifest.xml Sample 3', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample3.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				'uses-sdk': { minSdkVersion: 10, targetSdkVersion: 17 },
				'supports-screens': { anyDensity: false, xlargeScreens: true },
				application: {
					activity: {
						'.TestappActivity': {
							alwaysRetainTaskState: true,
							configChanges: [ 'keyboardHidden', 'orientation' ],
							label: 'testapp',
							name: '.TestappActivity',
							theme: '@style/Theme.Titanium',
							'intent-filter': [
								{
									action: [ 'android.intent.action.MAIN' ],
									category: [ 'android.intent.category.LAUNCHER' ]
								}
							]
						},
						'ti.modules.titanium.facebook.FBActivity': {
							screenOrientation: 'landscape',
							name: 'ti.modules.titanium.facebook.FBActivity',
							theme: '@android:style/Theme.Translucent.NoTitleBar'
						},
						'org.appcelerator.titanium.TiActivity': {
							screenOrientation: 'landscape',
							name: 'org.appcelerator.titanium.TiActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ]
						},
						'org.appcelerator.titanium.TiModalActivity': {
							screenOrientation: 'landscape',
							name: 'org.appcelerator.titanium.TiModalActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ],
							theme: '@android:style/Theme.Translucent.NoTitleBar.Fullscreen'
						},
						'ti.modules.titanium.ui.TiTabActivity': {
							screenOrientation: 'landscape',
							name: 'ti.modules.titanium.ui.TiTabActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ]
						},
						'ti.modules.titanium.media.TiVideoActivity': {
							screenOrientation: 'landscape',
							name: 'ti.modules.titanium.media.TiVideoActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ],
							theme: '@android:style/Theme.NoTitleBar.Fullscreen'
						},
						'ti.modules.titanium.ui.android.TiPreferencesActivity': {
							name: 'ti.modules.titanium.ui.android.TiPreferencesActivity'
						}
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"uses-sdk":{"minSdkVersion":10,"targetSdkVersion":17},"supports-screens":{"anyDensity":false,"xlargeScreens":true},"application":{"activity":{".TestappActivity":{"alwaysRetainTaskState":true,"configChanges":["keyboardHidden","orientation"],"label":"testapp","name":".TestappActivity","theme":"@style/Theme.Titanium","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.LAUNCHER"]}]},"ti.modules.titanium.facebook.FBActivity":{"screenOrientation":"landscape","name":"ti.modules.titanium.facebook.FBActivity","theme":"@android:style/Theme.Translucent.NoTitleBar"},"org.appcelerator.titanium.TiActivity":{"screenOrientation":"landscape","name":"org.appcelerator.titanium.TiActivity","configChanges":["keyboardHidden","orientation"]},"org.appcelerator.titanium.TiModalActivity":{"screenOrientation":"landscape","name":"org.appcelerator.titanium.TiModalActivity","configChanges":["keyboardHidden","orientation"],"theme":"@android:style/Theme.Translucent.NoTitleBar.Fullscreen"},"ti.modules.titanium.ui.TiTabActivity":{"screenOrientation":"landscape","name":"ti.modules.titanium.ui.TiTabActivity","configChanges":["keyboardHidden","orientation"]},"ti.modules.titanium.media.TiVideoActivity":{"screenOrientation":"landscape","name":"ti.modules.titanium.media.TiVideoActivity","configChanges":["keyboardHidden","orientation"],"theme":"@android:style/Theme.NoTitleBar.Fullscreen"},"ti.modules.titanium.ui.android.TiPreferencesActivity":{"name":"ti.modules.titanium.ui.android.TiPreferencesActivity"}}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"uses-sdk": {',
				'		"minSdkVersion": 10,',
				'		"targetSdkVersion": 17',
				'	},',
				'	"supports-screens": {',
				'		"anyDensity": false,',
				'		"xlargeScreens": true',
				'	},',
				'	"application": {',
				'		"activity": {',
				'			".TestappActivity": {',
				'				"alwaysRetainTaskState": true,',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"label": "testapp",',
				'				"name": ".TestappActivity",',
				'				"theme": "@style/Theme.Titanium",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.LAUNCHER"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			"ti.modules.titanium.facebook.FBActivity": {',
				'				"screenOrientation": "landscape",',
				'				"name": "ti.modules.titanium.facebook.FBActivity",',
				'				"theme": "@android:style/Theme.Translucent.NoTitleBar"',
				'			},',
				'			"org.appcelerator.titanium.TiActivity": {',
				'				"screenOrientation": "landscape",',
				'				"name": "org.appcelerator.titanium.TiActivity",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				]',
				'			},',
				'			"org.appcelerator.titanium.TiModalActivity": {',
				'				"screenOrientation": "landscape",',
				'				"name": "org.appcelerator.titanium.TiModalActivity",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"theme": "@android:style/Theme.Translucent.NoTitleBar.Fullscreen"',
				'			},',
				'			"ti.modules.titanium.ui.TiTabActivity": {',
				'				"screenOrientation": "landscape",',
				'				"name": "ti.modules.titanium.ui.TiTabActivity",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				]',
				'			},',
				'			"ti.modules.titanium.media.TiVideoActivity": {',
				'				"screenOrientation": "landscape",',
				'				"name": "ti.modules.titanium.media.TiVideoActivity",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation"',
				'				],',
				'				"theme": "@android:style/Theme.NoTitleBar.Fullscreen"',
				'			},',
				'			"ti.modules.titanium.ui.android.TiPreferencesActivity": {',
				'				"name": "ti.modules.titanium.ui.android.TiPreferencesActivity"',
				'			}',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<uses-sdk android:minSdkVersion="10" android:targetSdkVersion="17"/>',
				'	<supports-screens android:anyDensity="false" android:xlargeScreens="true"/>',
				'	<application>',
				'		<activity android:alwaysRetainTaskState="true" android:configChanges="keyboardHidden|orientation" android:label="testapp" android:name=".TestappActivity" android:theme="@style/Theme.Titanium">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.LAUNCHER"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:screenOrientation="landscape" android:name="ti.modules.titanium.facebook.FBActivity" android:theme="@android:style/Theme.Translucent.NoTitleBar"/>',
				'		<activity android:screenOrientation="landscape" android:name="org.appcelerator.titanium.TiActivity" android:configChanges="keyboardHidden|orientation"/>',
				'		<activity android:screenOrientation="landscape" android:name="org.appcelerator.titanium.TiModalActivity" android:configChanges="keyboardHidden|orientation" android:theme="@android:style/Theme.Translucent.NoTitleBar.Fullscreen"/>',
				'		<activity android:screenOrientation="landscape" android:name="ti.modules.titanium.ui.TiTabActivity" android:configChanges="keyboardHidden|orientation"/>',
				'		<activity android:screenOrientation="landscape" android:name="ti.modules.titanium.media.TiVideoActivity" android:configChanges="keyboardHidden|orientation" android:theme="@android:style/Theme.NoTitleBar.Fullscreen"/>',
				'		<activity android:name="ti.modules.titanium.ui.android.TiPreferencesActivity"/>',
				'	</application>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('AndroidManifest.xml Sample 4', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample4.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					service: {
						'com.appcelerator.cloud.push.PushService': {
							name: 'com.appcelerator.cloud.push.PushService'
						}
					},
					receiver: {
						'ti.cloudpush.IntentReceiver': {
							name: 'ti.cloudpush.IntentReceiver'
						},
						'ti.cloudpush.MQTTReceiver': {
							name: 'ti.cloudpush.MQTTReceiver',
							'intent-filter': [
								{
									action: [
										'android.intent.action.BOOT_COMPLETED',
										'android.intent.action.USER_PRESENT',
										'com.appcelerator.cloud.push.PushService.MSG_ARRIVAL'
									],
									category: [
										'android.intent.category.HOME'
									]
								}
							],
							'meta-data': {
								'com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity': {
									name: 'com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity',
									value: 'ti.cloudpush.MQTTReceiver'
								}
							}
						},
						'ti.cloudpush.GCMReceiver': {
							name: 'ti.cloudpush.GCMReceiver',
							permission: 'com.google.android.c2dm.permission.SEND',
							'intent-filter': [
								{
									action: [ 'com.google.android.c2dm.intent.RECEIVE' ],
									category: [ '${tiapp.properties[\'id\']}' ]
								}
							]
						},
						'com.appcelerator.cloud.push.PushBroadcastReceiver': {
							name: 'com.appcelerator.cloud.push.PushBroadcastReceiver',
							permission: 'com.google.android.c2dm.permission.SEND',
							'intent-filter': [
								{
									action: [ 'com.google.android.c2dm.intent.REGISTRATION' ],
									category: [ '${tiapp.properties[\'id\']}' ]
								}
							]
						}
					}
				},
				'uses-permission': [
					'android.permission.INTERNET',
					'android.permission.GET_ACCOUNTS',
					'android.permission.WAKE_LOCK',
					'com.google.android.c2dm.permission.RECEIVE',
					'android.permission.ACCESS_NETWORK_STATE',
					'android.permission.RECEIVE_BOOT_COMPLETED',
					'android.permission.READ_PHONE_STATE',
					'android.permission.VIBRATE',
					'android.permission.WRITE_EXTERNAL_STORAGE',
					'${tiapp.properties[\'id\']}.permission.C2D_MESSAGE'
				],
				permission: {
					'${tiapp.properties[\'id\']}.permission.C2D_MESSAGE': {
						name: '${tiapp.properties[\'id\']}.permission.C2D_MESSAGE',
						protectionLevel: 'signature'
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"service":{"com.appcelerator.cloud.push.PushService":{"name":"com.appcelerator.cloud.push.PushService"}},"receiver":{"ti.cloudpush.IntentReceiver":{"name":"ti.cloudpush.IntentReceiver"},"ti.cloudpush.MQTTReceiver":{"name":"ti.cloudpush.MQTTReceiver","intent-filter":[{"action":["android.intent.action.BOOT_COMPLETED","android.intent.action.USER_PRESENT","com.appcelerator.cloud.push.PushService.MSG_ARRIVAL"],"category":["android.intent.category.HOME"]}],"meta-data":{"com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity":{"name":"com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity","value":"ti.cloudpush.MQTTReceiver"}}},"ti.cloudpush.GCMReceiver":{"name":"ti.cloudpush.GCMReceiver","permission":"com.google.android.c2dm.permission.SEND","intent-filter":[{"action":["com.google.android.c2dm.intent.RECEIVE"],"category":["${tiapp.properties[\'id\']}"]}]},"com.appcelerator.cloud.push.PushBroadcastReceiver":{"name":"com.appcelerator.cloud.push.PushBroadcastReceiver","permission":"com.google.android.c2dm.permission.SEND","intent-filter":[{"action":["com.google.android.c2dm.intent.REGISTRATION"],"category":["${tiapp.properties[\'id\']}"]}]}}},"uses-permission":["android.permission.INTERNET","android.permission.GET_ACCOUNTS","android.permission.WAKE_LOCK","com.google.android.c2dm.permission.RECEIVE","android.permission.ACCESS_NETWORK_STATE","android.permission.RECEIVE_BOOT_COMPLETED","android.permission.READ_PHONE_STATE","android.permission.VIBRATE","android.permission.WRITE_EXTERNAL_STORAGE","${tiapp.properties[\'id\']}.permission.C2D_MESSAGE"],"permission":{"${tiapp.properties[\'id\']}.permission.C2D_MESSAGE":{"name":"${tiapp.properties[\'id\']}.permission.C2D_MESSAGE","protectionLevel":"signature"}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"application": {',
				'		"service": {',
				'			"com.appcelerator.cloud.push.PushService": {',
				'				"name": "com.appcelerator.cloud.push.PushService"',
				'			}',
				'		},',
				'		"receiver": {',
				'			"ti.cloudpush.IntentReceiver": {',
				'				"name": "ti.cloudpush.IntentReceiver"',
				'			},',
				'			"ti.cloudpush.MQTTReceiver": {',
				'				"name": "ti.cloudpush.MQTTReceiver",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.BOOT_COMPLETED",',
				'							"android.intent.action.USER_PRESENT",',
				'							"com.appcelerator.cloud.push.PushService.MSG_ARRIVAL"',
				'						],',
				'						"category": [',
				'							"android.intent.category.HOME"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity": {',
				'						"name": "com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity",',
				'						"value": "ti.cloudpush.MQTTReceiver"',
				'					}',
				'				}',
				'			},',
				'			"ti.cloudpush.GCMReceiver": {',
				'				"name": "ti.cloudpush.GCMReceiver",',
				'				"permission": "com.google.android.c2dm.permission.SEND",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"com.google.android.c2dm.intent.RECEIVE"',
				'						],',
				'						"category": [',
				'							"${tiapp.properties[\'id\']}"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			"com.appcelerator.cloud.push.PushBroadcastReceiver": {',
				'				"name": "com.appcelerator.cloud.push.PushBroadcastReceiver",',
				'				"permission": "com.google.android.c2dm.permission.SEND",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"com.google.android.c2dm.intent.REGISTRATION"',
				'						],',
				'						"category": [',
				'							"${tiapp.properties[\'id\']}"',
				'						]',
				'					}',
				'				]',
				'			}',
				'		}',
				'	},',
				'	"uses-permission": [',
				'		"android.permission.INTERNET",',
				'		"android.permission.GET_ACCOUNTS",',
				'		"android.permission.WAKE_LOCK",',
				'		"com.google.android.c2dm.permission.RECEIVE",',
				'		"android.permission.ACCESS_NETWORK_STATE",',
				'		"android.permission.RECEIVE_BOOT_COMPLETED",',
				'		"android.permission.READ_PHONE_STATE",',
				'		"android.permission.VIBRATE",',
				'		"android.permission.WRITE_EXTERNAL_STORAGE",',
				'		"${tiapp.properties[\'id\']}.permission.C2D_MESSAGE"',
				'	],',
				'	"permission": {',
				'		"${tiapp.properties[\'id\']}.permission.C2D_MESSAGE": {',
				'			"name": "${tiapp.properties[\'id\']}.permission.C2D_MESSAGE",',
				'			"protectionLevel": "signature"',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application>',
				'		<service android:name="com.appcelerator.cloud.push.PushService"/>',
				'		<receiver android:name="ti.cloudpush.IntentReceiver"/>',
				'		<receiver android:name="ti.cloudpush.MQTTReceiver">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.BOOT_COMPLETED"/>',
				'				<action android:name="android.intent.action.USER_PRESENT"/>',
				'				<action android:name="com.appcelerator.cloud.push.PushService.MSG_ARRIVAL"/>',
				'				<category android:name="android.intent.category.HOME"/>',
				'			</intent-filter>',
				'			<meta-data android:name="com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity" android:value="ti.cloudpush.MQTTReceiver"/>',
				'		</receiver>',
				'		<receiver android:name="ti.cloudpush.GCMReceiver" android:permission="com.google.android.c2dm.permission.SEND">',
				'			<intent-filter>',
				'				<action android:name="com.google.android.c2dm.intent.RECEIVE"/>',
				'				<category android:name="${tiapp.properties[\'id\']}"/>',
				'			</intent-filter>',
				'		</receiver>',
				'		<receiver android:name="com.appcelerator.cloud.push.PushBroadcastReceiver" android:permission="com.google.android.c2dm.permission.SEND">',
				'			<intent-filter>',
				'				<action android:name="com.google.android.c2dm.intent.REGISTRATION"/>',
				'				<category android:name="${tiapp.properties[\'id\']}"/>',
				'			</intent-filter>',
				'		</receiver>',
				'	</application>',
				'	<uses-permission android:name="android.permission.INTERNET"/>',
				'	<uses-permission android:name="android.permission.GET_ACCOUNTS"/>',
				'	<uses-permission android:name="android.permission.WAKE_LOCK"/>',
				'	<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>',
				'	<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>',
				'	<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>',
				'	<uses-permission android:name="android.permission.READ_PHONE_STATE"/>',
				'	<uses-permission android:name="android.permission.VIBRATE"/>',
				'	<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>',
				'	<uses-permission android:name="${tiapp.properties[\'id\']}.permission.C2D_MESSAGE"/>',
				'	<permission android:name="${tiapp.properties[\'id\']}.permission.C2D_MESSAGE" android:protectionLevel="signature"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('AndroidManifest.xml Sample 5', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample5.xml'));

		it('should match object', function () {
			expect(am).to.deep.equal({
				__attr__: {
					'xmlns:android': 'http://schemas.android.com/apk/res/android',
					package: 'com.example.android.apis'
				},
				'uses-permission': [
					'android.permission.READ_CONTACTS',
					'android.permission.WRITE_CONTACTS',
					'android.permission.VIBRATE',
					'android.permission.ACCESS_COARSE_LOCATION',
					'android.permission.INTERNET',
					'android.permission.SET_WALLPAPER',
					'android.permission.WRITE_EXTERNAL_STORAGE',
					'android.permission.SEND_SMS',
					'android.permission.RECEIVE_SMS',
					'android.permission.NFC',
					'android.permission.RECORD_AUDIO',
					'android.permission.CAMERA'
				],
				'uses-sdk': {
					minSdkVersion: 4,
					targetSdkVersion: 17
				},
				'uses-feature': [
					{
						name: 'android.hardware.camera'
					},
					{
						name: 'android.hardware.camera.autofocus',
						required: false
					}
				],
				application: {
					name: 'ApiDemosApplication',
					label: '@string/activity_sample_code',
					icon: '@drawable/app_sample_code',
					hardwareAccelerated: true,
					supportsRtl: true,
					'uses-library': {
						'com.example.will.never.exist': {
							name: 'com.example.will.never.exist',
							required: false
						}
					},
					activity: {
						ApiDemos: {
							name: 'ApiDemos',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.DEFAULT',
										'android.intent.category.LAUNCHER'
									]
								}
							]
						},
						'.app.HelloWorld': {
							name: '.app.HelloWorld',
							label: '@string/activity_hello_world',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.DialogActivity': {
							name: '.app.DialogActivity',
							label: '@string/activity_dialog',
							theme: '@android:style/Theme.Holo.Dialog',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.CustomDialogActivity': {
							name: '.app.CustomDialogActivity',
							label: '@string/activity_custom_dialog',
							theme: '@style/Theme.CustomDialog',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.OverscanActivity': {
							name: '.app.OverscanActivity',
							label: '@string/activity_overscan',
							theme: '@android:style/Theme.Holo.NoActionBar.Overscan',
							enabled: '@bool/atLeastJellyBeanMR2',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.QuickContactsDemo': {
							name: '.app.QuickContactsDemo',
							label: '@string/quick_contacts_demo',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.WallpaperActivity': {
							name: '.app.WallpaperActivity',
							label: '@string/activity_wallpaper',
							theme: '@style/Theme.Wallpaper',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.TranslucentActivity': {
							name: '.app.TranslucentActivity',
							label: '@string/activity_translucent',
							theme: '@style/Theme.Translucent',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.TranslucentBlurActivity': {
							name: '.app.TranslucentBlurActivity',
							label: '@string/activity_translucent_blur',
							theme: '@style/Theme.Transparent',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.Animation': {
							name: '.app.Animation',
							label: '@string/activity_animation',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.SaveRestoreState': {
							name: '.app.SaveRestoreState',
							label: '@string/activity_save_restore',
							windowSoftInputMode: [
								'stateVisible',
								'adjustResize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.PersistentState': {
							name: '.app.PersistentState',
							label: '@string/activity_persistent',
							windowSoftInputMode: [
								'stateVisible',
								'adjustResize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ActivityRecreate': {
							name: '.app.ActivityRecreate',
							label: '@string/activity_recreate',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FinishAffinity': {
							name: '.app.FinishAffinity',
							label: '@string/activity_finish_affinity',
							taskAffinity: ':finishing',
							enabled: '@bool/atLeastJellyBean',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.SoftInputModes': {
							name: '.app.SoftInputModes',
							label: '@string/soft_input_modes',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ReceiveResult': {
							name: '.app.ReceiveResult',
							label: '@string/activity_receive_result',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.SendResult': {
							name: '.app.SendResult',
							theme: '@style/ThemeDialogWhenLarge'
						},
						'.app.Forwarding': {
							name: '.app.Forwarding',
							label: '@string/activity_forwarding',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ForwardTarget': {
							name: '.app.ForwardTarget'
						},
						'.app.RedirectEnter': {
							name: '.app.RedirectEnter',
							label: '@string/activity_redirect',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.RedirectMain': {
							name: '.app.RedirectMain'
						},
						'.app.RedirectGetter': {
							name: '.app.RedirectGetter'
						},
						'.app.CustomTitle': {
							name: '.app.CustomTitle',
							label: '@string/activity_custom_title',
							windowSoftInputMode: [
								'stateVisible',
								'adjustPan'
							],
							theme: '@android:style/Theme',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ReorderOnLaunch': {
							name: '.app.ReorderOnLaunch',
							label: '@string/activity_reorder',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.RotationAnimation': {
							name: '.app.RotationAnimation',
							label: '@string/activity_rotation_animation',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ReorderTwo': {
							name: '.app.ReorderTwo'
						},
						'.app.ReorderThree': {
							name: '.app.ReorderThree'
						},
						'.app.ReorderFour': {
							name: '.app.ReorderFour'
						},
						'.app.SetWallpaperActivity': {
							name: '.app.SetWallpaperActivity',
							label: '@string/activity_setwallpaper',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ScreenOrientation': {
							name: '.app.ScreenOrientation',
							label: '@string/activity_screen_orientation',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.PresentationActivity': {
							name: '.app.PresentationActivity',
							label: '@string/activity_presentation',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.PresentationWithMediaRouterActivity': {
							name: '.app.PresentationWithMediaRouterActivity',
							label: '@string/activity_presentation_with_media_router',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.SecureWindowActivity': {
							name: '.app.SecureWindowActivity',
							label: '@string/activity_secure_window',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.SecureDialogActivity': {
							name: '.app.SecureDialogActivity',
							label: '@string/activity_secure_dialog',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.SecureSurfaceViewActivity': {
							name: '.app.SecureSurfaceViewActivity',
							label: '@string/activity_secure_surface_view',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentAlertDialog': {
							name: '.app.FragmentAlertDialog',
							label: '@string/fragment_alert_dialog',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentArguments': {
							name: '.app.FragmentArguments',
							label: '@string/fragment_arguments',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentCustomAnimations': {
							name: '.app.FragmentCustomAnimations',
							label: '@string/fragment_custom_animations',
							enabled: '@bool/atLeastHoneycombMR2',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentHideShow': {
							name: '.app.FragmentHideShow',
							label: '@string/fragment_hide_show',
							windowSoftInputMode: [
								'stateUnchanged'
							],
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentContextMenu': {
							name: '.app.FragmentContextMenu',
							label: '@string/fragment_context_menu',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentDialog': {
							name: '.app.FragmentDialog',
							label: '@string/fragment_dialog',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentDialogOrActivity': {
							name: '.app.FragmentDialogOrActivity',
							label: '@string/fragment_dialog_or_activity',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentLayout': {
							name: '.app.FragmentLayout',
							label: '@string/fragment_layout',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentLayout$DetailsActivity': {
							name: '.app.FragmentLayout$DetailsActivity',
							enabled: '@bool/atLeastHoneycomb'
						},
						'.app.FragmentListArray': {
							name: '.app.FragmentListArray',
							label: '@string/fragment_list_array',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentMenu': {
							name: '.app.FragmentMenu',
							label: '@string/fragment_menu',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentNestingTabs': {
							name: '.app.FragmentNestingTabs',
							label: '@string/fragment_nesting_tabs',
							enabled: '@bool/atLeastJellyBeanMR1',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentRetainInstance': {
							name: '.app.FragmentRetainInstance',
							label: '@string/fragment_retain_instance',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentReceiveResult': {
							name: '.app.FragmentReceiveResult',
							label: '@string/fragment_receive_result',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentStack': {
							name: '.app.FragmentStack',
							label: '@string/fragment_stack',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.FragmentTabs': {
							name: '.app.FragmentTabs',
							label: '@string/fragment_tabs',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.LoaderCursor': {
							name: '.app.LoaderCursor',
							label: '@string/loader_cursor',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.LoaderCustom': {
							name: '.app.LoaderCustom',
							label: '@string/loader_custom',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.LoaderThrottle': {
							name: '.app.LoaderThrottle',
							label: '@string/loader_throttle',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.LoaderRetained': {
							name: '.app.LoaderRetained',
							label: '@string/loader_retained',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.Intents': {
							name: '.app.Intents',
							label: '@string/activity_intents',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.IntentActivityFlags': {
							name: '.app.IntentActivityFlags',
							label: '@string/activity_intent_activity_flags',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.LocalServiceActivities$Controller': {
							name: '.app.LocalServiceActivities$Controller',
							label: '@string/activity_local_service_controller',
							launchMode: 'singleTop',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.LocalServiceActivities$Binding': {
							name: '.app.LocalServiceActivities$Binding',
							label: '@string/activity_local_service_binding',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.MessengerServiceActivities$Binding': {
							name: '.app.MessengerServiceActivities$Binding',
							label: '@string/activity_messenger_service_binding',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.RemoteService$Controller': {
							name: '.app.RemoteService$Controller',
							label: '@string/activity_remote_service_controller',
							launchMode: 'singleTop',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.RemoteService$Binding': {
							name: '.app.RemoteService$Binding',
							label: '@string/activity_remote_service_binding',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.RemoteService$BindingOptions': {
							name: '.app.RemoteService$BindingOptions',
							label: '@string/activity_remote_service_binding_options',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ServiceStartArguments$Controller': {
							name: '.app.ServiceStartArguments$Controller',
							label: '@string/activity_service_start_arguments_controller',
							launchMode: 'singleTop',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ForegroundService$Controller': {
							name: '.app.ForegroundService$Controller',
							label: '@string/activity_foreground_service_controller',
							launchMode: 'singleTop',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.IsolatedService$Controller': {
							name: '.app.IsolatedService$Controller',
							label: '@string/activity_isolated_service_controller',
							launchMode: 'singleTop',
							enabled: '@bool/atLeastJellyBean',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.AlarmController': {
							name: '.app.AlarmController',
							label: '@string/activity_alarm_controller',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.AlarmService': {
							name: '.app.AlarmService',
							label: '@string/activity_alarm_service',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.accessibility.ClockBackActivity': {
							name: '.accessibility.ClockBackActivity',
							label: '@string/accessibility_service',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.accessibility.TaskListActivity': {
							name: '.accessibility.TaskListActivity',
							label: '@string/accessibility_query_window',
							enabled: '@bool/atLeastIceCreamSandwich',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.accessibility.CustomViewAccessibilityActivity': {
							name: '.accessibility.CustomViewAccessibilityActivity',
							label: '@string/accessibility_custom_view',
							enabled: '@bool/atLeastIceCreamSandwich',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.LocalSample': {
							name: '.app.LocalSample',
							label: '@string/activity_local_sample',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									]
								}
							]
						},
						'.app.ContactsFilter': {
							name: '.app.ContactsFilter',
							label: '@string/activity_contacts_filter',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									]
								}
							]
						},
						'.app.NotifyWithText': {
							name: '.app.NotifyWithText',
							label: 'App/Notification/NotifyWithText',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.IncomingMessage': {
							name: '.app.IncomingMessage',
							label: 'App/Notification/IncomingMessage',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.IncomingMessageView': {
							name: '.app.IncomingMessageView',
							label: 'App/Notification/IncomingMessageView'
						},
						'.app.IncomingMessageInterstitial': {
							name: '.app.IncomingMessageInterstitial',
							label: 'You have messages',
							theme: '@style/ThemeHoloDialog',
							launchMode: 'singleTask',
							taskAffinity: '',
							excludeFromRecents: true
						},
						'.app.NotificationDisplay': {
							name: '.app.NotificationDisplay',
							theme: '@style/Theme.Transparent',
							taskAffinity: '',
							excludeFromRecents: true,
							noHistory: true
						},
						'.app.StatusBarNotifications': {
							name: '.app.StatusBarNotifications',
							label: 'App/Notification/Status Bar',
							launchMode: 'singleTop',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.NotifyingController': {
							name: '.app.NotifyingController',
							label: 'App/Notification/Notifying Service Controller',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.AlertDialogSamples': {
							name: '.app.AlertDialogSamples',
							label: '@string/activity_alert_dialog',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.SearchInvoke': {
							name: '.app.SearchInvoke',
							label: '@string/search_invoke',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							],
							'meta-data': {
								'android.app.default_searchable': {
									name: 'android.app.default_searchable',
									value: '.app.SearchQueryResults'
								}
							}
						},
						'.app.SearchQueryResults': {
							name: '.app.SearchQueryResults',
							label: '@string/search_query_results',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								},
								{
									action: [
										'android.intent.action.SEARCH'
									],
									category: [
										'android.intent.category.DEFAULT'
									]
								}
							],
							'meta-data': {
								'android.app.searchable': {
									name: 'android.app.searchable',
									resource: '@xml/searchable'
								}
							}
						},
						'.app.LauncherShortcuts': {
							name: '.app.LauncherShortcuts',
							label: '@string/shortcuts',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.MenuInflateFromXml': {
							name: '.app.MenuInflateFromXml',
							label: '@string/menu_from_xml_title',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.DeviceAdminSample': {
							name: '.app.DeviceAdminSample',
							label: '@string/activity_sample_device_admin',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.VoiceRecognition': {
							name: '.app.VoiceRecognition',
							label: '@string/voice_recognition',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.TextToSpeechActivity': {
							name: '.app.TextToSpeechActivity',
							label: '@string/text_to_speech',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ActionBarMechanics': {
							name: '.app.ActionBarMechanics',
							label: '@string/action_bar_mechanics',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ActionBarUsage': {
							name: '.app.ActionBarUsage',
							label: '@string/action_bar_usage',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ActionBarDisplayOptions': {
							name: '.app.ActionBarDisplayOptions',
							label: '@string/action_bar_display_options',
							logo: '@drawable/apidemo_androidlogo',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ActionBarTabs': {
							name: '.app.ActionBarTabs',
							label: '@string/action_bar_tabs',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ActionBarSettingsActionProviderActivity': {
							name: '.app.ActionBarSettingsActionProviderActivity',
							label: '@string/action_bar_settings_action_provider',
							enabled: '@bool/atLeastIceCreamSandwich',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.app.ActionBarShareActionProviderActivity': {
							name: '.app.ActionBarShareActionProviderActivity',
							label: '@string/action_bar_share_action_provider',
							enabled: '@bool/atLeastIceCreamSandwich',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.accessibility.AccessibilityNodeProviderActivity': {
							name: '.accessibility.AccessibilityNodeProviderActivity',
							label: '@string/accessibility_node_provider',
							enabled: '@bool/atLeastIceCreamSandwich',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.FragmentPreferences': {
							name: '.preference.FragmentPreferences',
							label: '@string/fragment_preferences',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.PreferenceWithHeaders': {
							name: '.preference.PreferenceWithHeaders',
							label: '@string/preference_with_headers',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.PreferencesFromXml': {
							name: '.preference.PreferencesFromXml',
							label: '@string/preferences_from_xml',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.PreferencesFromCode': {
							name: '.preference.PreferencesFromCode',
							label: '@string/preferences_from_code',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.AdvancedPreferences': {
							name: '.preference.AdvancedPreferences',
							label: '@string/advanced_preferences',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.LaunchingPreferences': {
							name: '.preference.LaunchingPreferences',
							label: '@string/launching_preferences',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.PreferenceDependencies': {
							name: '.preference.PreferenceDependencies',
							label: '@string/preference_dependencies',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.DefaultValues': {
							name: '.preference.DefaultValues',
							label: '@string/default_values',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.preference.SwitchPreference': {
							name: '.preference.SwitchPreference',
							label: '@string/switch_preference',
							enabled: '@bool/atLeastIceCreamSandwich',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.content.ClipboardSample': {
							name: '.content.ClipboardSample',
							label: '@string/activity_clipboard',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.content.ExternalStorage': {
							name: '.content.ExternalStorage',
							label: '@string/activity_external_storage',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE',
										'android.intent.category.EMBED'
									]
								}
							]
						},
						'.content.StyledText': {
							name: '.content.StyledText',
							label: '@string/activity_styled_text',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE',
										'android.intent.category.EMBED'
									]
								}
							]
						},
						'.content.ResourcesLayoutReference': {
							name: '.content.ResourcesLayoutReference',
							label: '@string/activity_resources_layout_reference',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE',
										'android.intent.category.EMBED'
									]
								}
							]
						},
						'.content.ResourcesWidthAndHeight': {
							name: '.content.ResourcesWidthAndHeight',
							label: '@string/activity_resources_width_and_height',
							enabled: '@bool/atLeastHoneycombMR2',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE',
										'android.intent.category.EMBED'
									]
								}
							]
						},
						'.content.ResourcesSmallestWidth': {
							name: '.content.ResourcesSmallestWidth',
							label: '@string/activity_resources_smallest_width',
							enabled: '@bool/atLeastHoneycombMR2',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE',
										'android.intent.category.EMBED'
									]
								}
							]
						},
						'.content.ReadAsset': {
							name: '.content.ReadAsset',
							label: '@string/activity_read_asset',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE',
										'android.intent.category.EMBED'
									]
								}
							]
						},
						'.content.ResourcesSample': {
							name: '.content.ResourcesSample',
							label: '@string/activity_resources',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.content.PickContact': {
							name: '.content.PickContact',
							label: '@string/activity_pick_contact',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.content.ChangedContacts': {
							name: '.content.ChangedContacts',
							label: '@string/activity_changed_contact',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.content.InstallApk': {
							name: '.content.InstallApk',
							label: '@string/activity_install_apk',
							enabled: '@bool/atLeastHoneycombMR2',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.os.MorseCode': {
							name: '.os.MorseCode',
							label: 'OS/Morse Code',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.os.Sensors': {
							name: '.os.Sensors',
							label: 'OS/Sensors',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.os.TriggerSensors': {
							name: '.os.TriggerSensors',
							label: 'OS/TriggerSensors',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.os.RotationVectorDemo': {
							name: '.os.RotationVectorDemo',
							label: 'OS/Rotation Vector',
							screenOrientation: 'nosensor',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.os.SmsMessagingDemo': {
							name: '.os.SmsMessagingDemo',
							label: 'OS/SMS Messaging',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.os.SmsReceivedDialog': {
							name: '.os.SmsReceivedDialog',
							theme: '@android:style/Theme.Translucent.NoTitleBar',
							launchMode: 'singleInstance'
						},
						'.animation.AnimationLoading': {
							name: '.animation.AnimationLoading',
							label: 'Animation/Loading',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.AnimationCloning': {
							name: '.animation.AnimationCloning',
							label: 'Animation/Cloning',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.AnimationSeeking': {
							name: '.animation.AnimationSeeking',
							label: 'Animation/Seeking',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.AnimatorEvents': {
							name: '.animation.AnimatorEvents',
							label: 'Animation/Events',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.BouncingBalls': {
							name: '.animation.BouncingBalls',
							label: 'Animation/Bouncing Balls',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.CustomEvaluator': {
							name: '.animation.CustomEvaluator',
							label: 'Animation/Custom Evaluator',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.ListFlipper': {
							name: '.animation.ListFlipper',
							label: 'Animation/View Flip',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.ReversingAnimation': {
							name: '.animation.ReversingAnimation',
							label: 'Animation/Reversing',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.MultiPropertyAnimation': {
							name: '.animation.MultiPropertyAnimation',
							label: 'Animation/Multiple Properties',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.LayoutAnimations': {
							name: '.animation.LayoutAnimations',
							label: 'Animation/Layout Animations',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.LayoutAnimationsHideShow': {
							name: '.animation.LayoutAnimationsHideShow',
							label: 'Animation/Hide-Show Animations',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.LayoutAnimationsByDefault': {
							name: '.animation.LayoutAnimationsByDefault',
							label: 'Animation/Default Layout Animations',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.animation.Transition3d': {
							name: '.animation.Transition3d',
							label: 'Views/Animation/3D Transition',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TextClockDemo': {
							name: '.view.TextClockDemo',
							label: 'Views/TextClock',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ChronometerDemo': {
							name: '.view.ChronometerDemo',
							label: 'Views/Chronometer',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.WebView1': {
							name: '.view.WebView1',
							label: 'Views/WebView',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.RelativeLayout1': {
							name: '.view.RelativeLayout1',
							label: 'Views/Layouts/RelativeLayout/1. Vertical',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.RelativeLayout2': {
							name: '.view.RelativeLayout2',
							label: 'Views/Layouts/RelativeLayout/2. Simple Form',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout1': {
							name: '.view.LinearLayout1',
							label: 'Views/Layouts/LinearLayout/01. Vertical',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout2': {
							name: '.view.LinearLayout2',
							label: 'Views/Layouts/LinearLayout/02. Vertical (Fill Screen)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout3': {
							name: '.view.LinearLayout3',
							label: 'Views/Layouts/LinearLayout/03. Vertical (Padded)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout4': {
							name: '.view.LinearLayout4',
							label: 'Views/Layouts/LinearLayout/04. Horizontal',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout5': {
							name: '.view.LinearLayout5',
							label: 'Views/Layouts/LinearLayout/05. Simple Form',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout6': {
							name: '.view.LinearLayout6',
							label: 'Views/Layouts/LinearLayout/06. Uniform Size',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout7': {
							name: '.view.LinearLayout7',
							label: 'Views/Layouts/LinearLayout/07. Fill Parent',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout8': {
							name: '.view.LinearLayout8',
							label: 'Views/Layouts/LinearLayout/08. Gravity',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout9': {
							name: '.view.LinearLayout9',
							label: 'Views/Layouts/LinearLayout/09. Layout Weight',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LinearLayout10': {
							name: '.view.LinearLayout10',
							label: 'Views/Layouts/LinearLayout/10. Background Image',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.CustomLayoutActivity': {
							name: '.view.CustomLayoutActivity',
							label: 'Views/Layouts/CustomLayout',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.RadioGroup1': {
							name: '.view.RadioGroup1',
							label: 'Views/Radio Group',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ScrollView1': {
							name: '.view.ScrollView1',
							label: 'Views/Layouts/ScrollView/1. Short',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ScrollView2': {
							name: '.view.ScrollView2',
							label: 'Views/Layouts/ScrollView/2. Long',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.HorizontalScrollView1': {
							name: '.view.HorizontalScrollView1',
							label: 'Views/Layouts/HorizontalScrollView',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Tabs1': {
							name: '.view.Tabs1',
							label: 'Views/Tabs/1. Content By Id',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Tabs2': {
							name: '.view.Tabs2',
							label: 'Views/Tabs/2. Content By Factory',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Tabs3': {
							name: '.view.Tabs3',
							label: 'Views/Tabs/3. Content By Intent',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Tabs4': {
							name: '.view.Tabs4',
							label: 'Views/Tabs/4. Non Holo theme',
							theme: '@android:style/Theme',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Tabs5': {
							name: '.view.Tabs5',
							label: 'Views/Tabs/5. Scrollable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Tabs6': {
							name: '.view.Tabs6',
							label: 'Views/Tabs/6. Right aligned',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.InternalSelectionScroll': {
							name: '.view.InternalSelectionScroll',
							label: 'Views/Layouts/ScrollView/3. Internal Selection',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout1': {
							name: '.view.TableLayout1',
							label: 'Views/Layouts/TableLayout/01. Basic',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout2': {
							name: '.view.TableLayout2',
							label: 'Views/Layouts/TableLayout/02. Empty Cells',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout3': {
							name: '.view.TableLayout3',
							label: 'Views/Layouts/TableLayout/03. Long Content',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout4': {
							name: '.view.TableLayout4',
							label: 'Views/Layouts/TableLayout/04. Stretchable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout5': {
							name: '.view.TableLayout5',
							label: 'Views/Layouts/TableLayout/05. Spanning and Stretchable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout6': {
							name: '.view.TableLayout6',
							label: 'Views/Layouts/TableLayout/06. More Spanning and Stretchable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout7': {
							name: '.view.TableLayout7',
							label: 'Views/Layouts/TableLayout/07. Column Collapse',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout8': {
							name: '.view.TableLayout8',
							label: 'Views/Layouts/TableLayout/08. Toggle Stretch',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout9': {
							name: '.view.TableLayout9',
							label: 'Views/Layouts/TableLayout/09. Toggle Shrink',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout10': {
							name: '.view.TableLayout10',
							label: 'Views/Layouts/TableLayout/10. Simple Form',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout11': {
							name: '.view.TableLayout11',
							label: 'Views/Layouts/TableLayout/11. Gravity',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TableLayout12': {
							name: '.view.TableLayout12',
							label: 'Views/Layouts/TableLayout/12. Cell Spanning',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.GridLayout1': {
							name: '.view.GridLayout1',
							label: 'Views/Layouts/GridLayout/1. Simple Form',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.GridLayout2': {
							name: '.view.GridLayout2',
							label: 'Views/Layouts/GridLayout/2. Form (XML)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.GridLayout3': {
							name: '.view.GridLayout3',
							label: 'Views/Layouts/GridLayout/3. Form (Java)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Baseline1': {
							name: '.view.Baseline1',
							label: 'Views/Layouts/Baseline/1. Top',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Baseline2': {
							name: '.view.Baseline2',
							label: 'Views/Layouts/Baseline/2. Bottom',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Baseline3': {
							name: '.view.Baseline3',
							label: 'Views/Layouts/Baseline/3. Center',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Baseline4': {
							name: '.view.Baseline4',
							label: 'Views/Layouts/Baseline/4. Everywhere',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Baseline6': {
							name: '.view.Baseline6',
							label: 'Views/Layouts/Baseline/5. Multi-line',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Baseline7': {
							name: '.view.Baseline7',
							label: 'Views/Layouts/Baseline/6. Relative',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.BaselineNested1': {
							name: '.view.BaselineNested1',
							label: 'Views/Layouts/Baseline/Nested Example 1',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.BaselineNested2': {
							name: '.view.BaselineNested2',
							label: 'Views/Layouts/Baseline/Nested Example 2',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.BaselineNested3': {
							name: '.view.BaselineNested3',
							label: 'Views/Layouts/Baseline/Nested Example 3',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ScrollBar1': {
							name: '.view.ScrollBar1',
							label: 'Views/ScrollBars/1. Basic',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ScrollBar2': {
							name: '.view.ScrollBar2',
							label: 'Views/ScrollBars/2. Fancy',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ScrollBar3': {
							name: '.view.ScrollBar3',
							label: 'Views/ScrollBars/3. Style',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Visibility1': {
							name: '.view.Visibility1',
							label: 'Views/Visibility',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List1': {
							name: '.view.List1',
							label: 'Views/Lists/01. Array',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List2': {
							name: '.view.List2',
							label: 'Views/Lists/02. Cursor (People)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List3': {
							name: '.view.List3',
							label: 'Views/Lists/03. Cursor (Phones)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List4': {
							name: '.view.List4',
							label: 'Views/Lists/04. ListAdapter',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List5': {
							name: '.view.List5',
							label: 'Views/Lists/05. Separators',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List6': {
							name: '.view.List6',
							label: 'Views/Lists/06. ListAdapter Collapsed',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List7': {
							name: '.view.List7',
							label: 'Views/Lists/07. Cursor (Phones)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List8': {
							name: '.view.List8',
							label: 'Views/Lists/08. Photos',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List9': {
							name: '.view.List9',
							label: 'Views/Lists/09. Array (Overlay)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List10': {
							name: '.view.List10',
							label: 'Views/Lists/10. Single choice list',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List11': {
							name: '.view.List11',
							label: 'Views/Lists/11. Multiple choice list',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List12': {
							name: '.view.List12',
							label: 'Views/Lists/12. Transcript',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List13': {
							name: '.view.List13',
							label: 'Views/Lists/13. Slow Adapter',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List14': {
							name: '.view.List14',
							label: 'Views/Lists/14. Efficient Adapter',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List15': {
							name: '.view.List15',
							label: 'Views/Lists/15. Selection Mode',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List16': {
							name: '.view.List16',
							label: 'Views/Lists/16. Border selection mode',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.List17': {
							name: '.view.List17',
							label: 'Views/Lists/17. Activate items',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ExpandableList1': {
							name: '.view.ExpandableList1',
							label: 'Views/Expandable Lists/1. Custom Adapter',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ExpandableList2': {
							name: '.view.ExpandableList2',
							label: 'Views/Expandable Lists/2. Cursor (People)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ExpandableList3': {
							name: '.view.ExpandableList3',
							label: 'Views/Expandable Lists/3. Simple Adapter',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.CustomView1': {
							name: '.view.CustomView1',
							label: 'Views/Custom',
							theme: '@android:style/Theme.Light',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Gallery1': {
							name: '.view.Gallery1',
							label: 'Views/Gallery/1. Photos',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Gallery2': {
							name: '.view.Gallery2',
							label: 'Views/Gallery/2. People',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Spinner1': {
							name: '.view.Spinner1',
							label: 'Views/Spinner',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Grid1': {
							name: '.view.Grid1',
							label: 'Views/Grid/1. Icon Grid',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Grid2': {
							name: '.view.Grid2',
							label: 'Views/Grid/2. Photo Grid',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Grid3': {
							name: '.view.Grid3',
							label: 'Views/Grid/3. Selection Mode',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ImageView1': {
							name: '.view.ImageView1',
							label: 'Views/ImageView',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ImageSwitcher1': {
							name: '.view.ImageSwitcher1',
							label: 'Views/ImageSwitcher',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.TextSwitcher1': {
							name: '.view.TextSwitcher1',
							label: 'Views/TextSwitcher',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ImageButton1': {
							name: '.view.ImageButton1',
							label: 'Views/ImageButton',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Animation1': {
							name: '.view.Animation1',
							label: 'Views/Animation/Shake',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Animation2': {
							name: '.view.Animation2',
							label: 'Views/Animation/Push',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Animation3': {
							name: '.view.Animation3',
							label: 'Views/Animation/Interpolators',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LayoutAnimation1': {
							name: '.view.LayoutAnimation1',
							label: 'Views/Layout Animation/1. Grid Fade',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LayoutAnimation2': {
							name: '.view.LayoutAnimation2',
							label: 'Views/Layout Animation/2. List Cascade',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LayoutAnimation3': {
							name: '.view.LayoutAnimation3',
							label: 'Views/Layout Animation/3. Reverse Order',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LayoutAnimation4': {
							name: '.view.LayoutAnimation4',
							label: 'Views/Layout Animation/4. Randomize',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LayoutAnimation5': {
							name: '.view.LayoutAnimation5',
							label: 'Views/Layout Animation/5. Grid Direction',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LayoutAnimation6': {
							name: '.view.LayoutAnimation6',
							label: 'Views/Layout Animation/6. Wave Scale',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.LayoutAnimation7': {
							name: '.view.LayoutAnimation7',
							label: 'Views/Layout Animation/7. Nested Animations',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Controls1': {
							name: '.view.Controls1',
							label: 'Views/Controls/1. Light Theme',
							theme: '@android:style/Theme.Light',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Controls2': {
							name: '.view.Controls2',
							label: 'Views/Controls/2. Dark Theme',
							theme: '@android:style/Theme',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Controls3': {
							name: '.view.Controls3',
							label: 'Views/Controls/3. Holo Light Theme',
							theme: '@android:style/Theme.Holo.Light',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Controls4': {
							name: '.view.Controls4',
							label: 'Views/Controls/4. Holo Dark Theme',
							theme: '@android:style/Theme.Holo',
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Controls5': {
							name: '.view.Controls5',
							label: 'Views/Controls/5. Custom Theme',
							theme: '@style/CustomTheme',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Controls6': {
							name: '.view.Controls6',
							label: 'Views/Controls/6. Holo or Old Theme',
							theme: '@style/ThemeHolo',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Buttons1': {
							name: '.view.Buttons1',
							label: 'Views/Buttons',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.AutoComplete1': {
							name: '.view.AutoComplete1',
							label: 'Views/Auto Complete/1. Screen Top',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.AutoComplete2': {
							name: '.view.AutoComplete2',
							label: 'Views/Auto Complete/2. Screen Bottom',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.AutoComplete3': {
							name: '.view.AutoComplete3',
							label: 'Views/Auto Complete/3. Scroll',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.AutoComplete4': {
							name: '.view.AutoComplete4',
							label: 'Views/Auto Complete/4. Contacts',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.AutoComplete5': {
							name: '.view.AutoComplete5',
							label: 'Views/Auto Complete/5. Contacts with Hint',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.AutoComplete6': {
							name: '.view.AutoComplete6',
							label: 'Views/Auto Complete/6. Multiple items',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ProgressBar1': {
							name: '.view.ProgressBar1',
							label: 'Views/Progress Bar/1. Incremental',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ProgressBar2': {
							name: '.view.ProgressBar2',
							label: 'Views/Progress Bar/2. Smooth',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ProgressBar3': {
							name: '.view.ProgressBar3',
							label: 'Views/Progress Bar/3. Dialogs',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ProgressBar4': {
							name: '.view.ProgressBar4',
							label: 'Views/Progress Bar/4. In Title Bar',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.SeekBar1': {
							name: '.view.SeekBar1',
							label: 'Views/Seek Bar',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.RatingBar1': {
							name: '.view.RatingBar1',
							label: 'Views/Rating Bar',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Focus1': {
							name: '.view.Focus1',
							label: 'Views/Focus/1. Vertical',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Focus2': {
							name: '.view.Focus2',
							label: 'Views/Focus/2. Horizontal',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Focus3': {
							name: '.view.Focus3',
							label: 'Views/Focus/3. Circular',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.InternalSelectionFocus': {
							name: '.view.InternalSelectionFocus',
							label: 'Views/Focus/4. Internal Selection',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Focus5': {
							name: '.view.Focus5',
							label: 'Views/Focus/5. Sequential (Tab Order)',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.WindowFocusObserver': {
							name: '.view.WindowFocusObserver',
							label: 'Views/Focus/6. Window Focus Observer',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.DateWidgets1': {
							name: '.view.DateWidgets1',
							label: 'Views/Date Widgets/1. Dialog',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.DateWidgets2': {
							name: '.view.DateWidgets2',
							label: 'Views/Date Widgets/2. Inline',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.PopupMenu1': {
							name: '.view.PopupMenu1',
							label: 'Views/Popup Menu',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.SearchViewActionBar': {
							name: '.view.SearchViewActionBar',
							label: 'Views/Search View/Action Bar',
							theme: '@android:style/Theme.Holo',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							],
							'meta-data': {
								'android.app.default_searchable': {
									name: 'android.app.default_searchable',
									value: '.app.SearchQueryResults'
								}
							}
						},
						'.view.SearchViewAlwaysVisible': {
							name: '.view.SearchViewAlwaysVisible',
							label: 'Views/Search View/Always Expanded',
							theme: '@android:style/Theme.Holo',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							],
							'meta-data': {
								'android.app.default_searchable': {
									name: 'android.app.default_searchable',
									value: '.app.SearchQueryResults'
								}
							}
						},
						'.view.SearchViewFilterMode': {
							name: '.view.SearchViewFilterMode',
							label: 'Views/Search View/Filter',
							theme: '@android:style/Theme.Holo',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.RotatingButton': {
							name: '.view.RotatingButton',
							label: 'Views/Rotating Button',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.SecureView': {
							name: '.view.SecureView',
							label: 'Views/Secure View',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.SplitTouchView': {
							name: '.view.SplitTouchView',
							label: 'Views/Splitting Touches across Views',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.DragAndDropDemo': {
							name: '.view.DragAndDropDemo',
							label: 'Views/Drag and Drop',
							hardwareAccelerated: false,
							enabled: '@bool/atLeastHoneycomb',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.GameControllerInput': {
							name: '.view.GameControllerInput',
							label: 'Views/Game Controller Input',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Hover': {
							name: '.view.Hover',
							label: 'Views/Hover Events',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.SystemUIModes': {
							name: '.view.SystemUIModes',
							label: 'Views/System UI Visibility/System UI Modes',
							uiOptions: 'splitActionBarWhenNarrow',
							enabled: '@bool/atLeastJellyBeanMR2',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.SystemUIModesOverlay': {
							name: '.view.SystemUIModesOverlay',
							label: 'Views/System UI Visibility/System UI Modes Overlay',
							uiOptions: 'splitActionBarWhenNarrow',
							enabled: '@bool/atLeastJellyBean',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.ContentBrowserActivity': {
							name: '.view.ContentBrowserActivity',
							label: 'Views/System UI Visibility/Content Browser',
							theme: '@android:style/Theme.Holo.Light.DarkActionBar',
							uiOptions: 'splitActionBarWhenNarrow',
							enabled: '@bool/atLeastJellyBean',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.VideoPlayerActivity': {
							name: '.view.VideoPlayerActivity',
							label: 'Views/System UI Visibility/Video Player',
							theme: '@android:style/Theme.Holo',
							uiOptions: 'splitActionBarWhenNarrow',
							enabled: '@bool/atLeastJellyBean',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.view.Switches': {
							name: '.view.Switches',
							label: 'Views/Switches',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.kube.Kube': {
							name: '.graphics.kube.Kube',
							label: 'Graphics/OpenGL ES/Kube',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Compass': {
							name: '.graphics.Compass',
							label: 'Graphics/Compass',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.CameraPreview': {
							name: '.graphics.CameraPreview',
							label: 'Graphics/CameraPreview',
							screenOrientation: 'landscape',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.CompressedTextureActivity': {
							name: '.graphics.CompressedTextureActivity',
							label: 'Graphics/OpenGL ES/Compressed Texture',
							theme: '@android:style/Theme.NoTitleBar',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.CubeMapActivity': {
							name: '.graphics.CubeMapActivity',
							label: 'Graphics/OpenGL ES/Cube Map',
							theme: '@android:style/Theme.NoTitleBar',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.FrameBufferObjectActivity': {
							name: '.graphics.FrameBufferObjectActivity',
							label: 'Graphics/OpenGL ES/Frame Buffer Object',
							theme: '@android:style/Theme.NoTitleBar',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.GLSurfaceViewActivity': {
							name: '.graphics.GLSurfaceViewActivity',
							label: 'Graphics/OpenGL ES/GLSurfaceView',
							theme: '@android:style/Theme.NoTitleBar',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.GLES20Activity': {
							name: '.graphics.GLES20Activity',
							label: 'Graphics/OpenGL ES/OpenGL ES 2.0',
							theme: '@android:style/Theme.NoTitleBar',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.MatrixPaletteActivity': {
							name: '.graphics.MatrixPaletteActivity',
							label: 'Graphics/OpenGL ES/Matrix Palette Skinning',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.TranslucentGLSurfaceViewActivity': {
							name: '.graphics.TranslucentGLSurfaceViewActivity',
							label: 'Graphics/OpenGL ES/Translucent GLSurfaceView',
							theme: '@style/Theme.Translucent',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.TriangleActivity': {
							name: '.graphics.TriangleActivity',
							label: 'Graphics/OpenGL ES/Textured Triangle',
							theme: '@android:style/Theme.Holo.Dialog',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.spritetext.SpriteTextActivity': {
							name: '.graphics.spritetext.SpriteTextActivity',
							label: 'Graphics/OpenGL ES/Sprite Text',
							theme: '@android:style/Theme.NoTitleBar',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.TouchRotateActivity': {
							name: '.graphics.TouchRotateActivity',
							label: 'Graphics/OpenGL ES/Touch Rotate',
							theme: '@android:style/Theme.NoTitleBar',
							configChanges: [
								'keyboardHidden',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.PolyToPoly': {
							name: '.graphics.PolyToPoly',
							label: 'Graphics/PolyToPoly',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.ScaleToFit': {
							name: '.graphics.ScaleToFit',
							label: 'Graphics/ScaleToFit',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.RoundRects': {
							name: '.graphics.RoundRects',
							label: 'Graphics/RoundRects',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.ShapeDrawable1': {
							name: '.graphics.ShapeDrawable1',
							label: 'Graphics/Drawable/ShapeDrawable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.SurfaceViewOverlay': {
							name: '.graphics.SurfaceViewOverlay',
							label: 'Graphics/SurfaceView Overlay',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.WindowSurface': {
							name: '.graphics.WindowSurface',
							label: 'Graphics/Surface Window',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.TextAlign': {
							hardwareAccelerated: false,
							name: '.graphics.TextAlign',
							label: 'Graphics/Text Align',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Arcs': {
							name: '.graphics.Arcs',
							label: 'Graphics/Arcs',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Patterns': {
							name: '.graphics.Patterns',
							label: 'Graphics/Patterns',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Clipping': {
							hardwareAccelerated: false,
							name: '.graphics.Clipping',
							label: 'Graphics/Clipping',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Layers': {
							name: '.graphics.Layers',
							label: 'Graphics/Layers',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.UnicodeChart': {
							hardwareAccelerated: false,
							name: '.graphics.UnicodeChart',
							label: 'Graphics/UnicodeChart',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.PathFillTypes': {
							name: '.graphics.PathFillTypes',
							label: 'Graphics/PathFillTypes',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Pictures': {
							hardwareAccelerated: false,
							name: '.graphics.Pictures',
							label: 'Graphics/Pictures',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Vertices': {
							hardwareAccelerated: false,
							name: '.graphics.Vertices',
							label: 'Graphics/Vertices',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.AnimateDrawables': {
							name: '.graphics.AnimateDrawables',
							label: 'Graphics/AnimateDrawables',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.SensorTest': {
							name: '.graphics.SensorTest',
							label: 'Graphics/SensorTest',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.AlphaBitmap': {
							name: '.graphics.AlphaBitmap',
							label: 'Graphics/AlphaBitmap',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Regions': {
							name: '.graphics.Regions',
							label: 'Graphics/Regions',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Sweep': {
							name: '.graphics.Sweep',
							label: 'Graphics/Sweep',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.BitmapMesh': {
							name: '.graphics.BitmapMesh',
							label: 'Graphics/BitmapMesh',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.MeasureText': {
							name: '.graphics.MeasureText',
							label: 'Graphics/MeasureText',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Typefaces': {
							name: '.graphics.Typefaces',
							label: 'Graphics/Typefaces',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.FingerPaint': {
							name: '.graphics.FingerPaint',
							label: 'Graphics/FingerPaint',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.ColorMatrixSample': {
							name: '.graphics.ColorMatrixSample',
							label: 'Graphics/ColorMatrix',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.BitmapDecode': {
							hardwareAccelerated: false,
							name: '.graphics.BitmapDecode',
							label: 'Graphics/BitmapDecode',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.ColorFilters': {
							name: '.graphics.ColorFilters',
							label: 'Graphics/ColorFilters',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.CreateBitmap': {
							name: '.graphics.CreateBitmap',
							label: 'Graphics/CreateBitmap',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.DrawPoints': {
							hardwareAccelerated: false,
							name: '.graphics.DrawPoints',
							label: 'Graphics/Points',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.TouchPaint': {
							name: '.graphics.TouchPaint',
							label: 'Graphics/Touch Paint',
							theme: '@style/Theme.Black',
							configChanges: [
								'keyboard',
								'keyboardHidden',
								'navigation',
								'orientation',
								'screenLayout',
								'screenSize',
								'smallestScreenSize'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.BitmapPixels': {
							name: '.graphics.BitmapPixels',
							label: 'Graphics/BitmapPixels',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.Xfermodes': {
							name: '.graphics.Xfermodes',
							label: 'Graphics/Xfermodes',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.PathEffects': {
							name: '.graphics.PathEffects',
							label: 'Graphics/PathEffects',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.GradientDrawable1': {
							name: '.graphics.GradientDrawable1',
							label: 'Graphics/Drawable/GradientDrawable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.PurgeableBitmap': {
							name: '.graphics.PurgeableBitmap',
							label: 'Graphics/PurgeableBitmap/NonPurgeable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.graphics.DensityActivity': {
							name: '.graphics.DensityActivity',
							label: 'Graphics/Density',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.media.MediaPlayerDemo': {
							name: '.media.MediaPlayerDemo',
							label: 'Media/MediaPlayer',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.media.MediaPlayerDemo_Audio': {
							name: '.media.MediaPlayerDemo_Audio',
							label: 'Media/MediaPlayer',
							'intent-filter': [
								{
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.media.MediaPlayerDemo_Video': {
							name: '.media.MediaPlayerDemo_Video',
							label: 'Media/MediaPlayer',
							'intent-filter': [
								{
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.media.VideoViewDemo': {
							name: '.media.VideoViewDemo',
							label: 'Media/VideoView',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.media.AudioFxDemo': {
							name: '.media.AudioFxDemo',
							label: 'Media/AudioFx',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.appwidget.ExampleAppWidgetConfigure': {
							name: '.appwidget.ExampleAppWidgetConfigure',
							'intent-filter': [
								{
									action: [
										'android.appwidget.action.APPWIDGET_CONFIGURE'
									]
								}
							]
						},
						'.text.Link': {
							name: '.text.Link',
							label: 'Text/Linkify',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.text.Marquee': {
							name: '.text.Marquee',
							label: 'Text/Marquee',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.text.LogTextBox1': {
							name: '.text.LogTextBox1',
							label: 'Text/LogTextBox',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.nfc.ForegroundDispatch': {
							name: '.nfc.ForegroundDispatch',
							label: 'NFC/ForegroundDispatch',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.nfc.TechFilter': {
							name: '.nfc.TechFilter',
							label: 'NFC/TechFilter',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								},
								{
									action: [
										'android.nfc.action.TECH_DISCOVERED'
									]
								}
							],
							'meta-data': {
								'android.nfc.action.TECH_DISCOVERED': {
									name: 'android.nfc.action.TECH_DISCOVERED',
									resource: '@xml/filter_nfc'
								}
							}
						},
						'.nfc.ForegroundNdefPush': {
							name: '.nfc.ForegroundNdefPush',
							label: 'NFC/ForegroundNdefPush',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						},
						'.security.KeyStoreUsage': {
							name: '.security.KeyStoreUsage',
							label: 'Security/KeyStore',
							windowSoftInputMode: [
								'adjustPan'
							],
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						}
					},
					provider: {
						'.app.LoaderThrottle$SimpleProvider': {
							name: '.app.LoaderThrottle$SimpleProvider',
							authorities: 'com.example.android.apis.app.LoaderThrottle',
							enabled: '@bool/atLeastHoneycomb'
						},
						'.app.SearchSuggestionSampleProvider': {
							name: '.app.SearchSuggestionSampleProvider',
							authorities: 'com.example.android.apis.SuggestionProvider'
						},
						'.content.FileProvider': {
							name: '.content.FileProvider',
							authorities: 'com.example.android.apis.content.FileProvider',
							enabled: '@bool/atLeastHoneycombMR2'
						}
					},
					service: {
						'.app.LocalService': {
							name: '.app.LocalService',
							stopWithTask: true
						},
						'.app.MessengerService': {
							name: '.app.MessengerService',
							process: ':remote'
						},
						'.app.RemoteService': {
							name: '.app.RemoteService',
							process: ':remote',
							'intent-filter': [
								{
									action: [
										'com.example.android.apis.app.IRemoteService',
										'com.example.android.apis.app.ISecondary',
										'com.example.android.apis.app.REMOTE_SERVICE'
									]
								}
							]
						},
						'.app.ServiceStartArguments': {
							name: '.app.ServiceStartArguments'
						},
						'.app.ForegroundService': {
							name: '.app.ForegroundService'
						},
						'.app.IsolatedService': {
							name: '.app.IsolatedService',
							isolatedProcess: true,
							enabled: '@bool/atLeastJellyBean'
						},
						'.app.IsolatedService2': {
							name: '.app.IsolatedService2',
							isolatedProcess: true,
							enabled: '@bool/atLeastJellyBean'
						},
						'.app.AlarmService_Service': {
							name: '.app.AlarmService_Service',
							process: ':remote'
						},
						'.accessibility.ClockBackService': {
							name: '.accessibility.ClockBackService',
							label: '@string/accessibility_service_label',
							permission: 'android.permission.BIND_ACCESSIBILITY_SERVICE',
							'intent-filter': [
								{
									action: [
										'android.accessibilityservice.AccessibilityService'
									]
								}
							]
						},
						'.accessibility.TaskBackService': {
							name: '.accessibility.TaskBackService',
							label: '@string/accessibility_query_window_label',
							enabled: '@bool/atLeastIceCreamSandwich',
							permission: 'android.permission.BIND_ACCESSIBILITY_SERVICE',
							'intent-filter': [
								{
									action: [
										'android.accessibilityservice.AccessibilityService'
									]
								}
							],
							'meta-data': {
								'android.accessibilityservice': {
									name: 'android.accessibilityservice',
									resource: '@xml/taskbackconfig'
								}
							}
						},
						'.app.NotifyingService': {
							name: '.app.NotifyingService'
						}
					},
					receiver: {
						'.app.OneShotAlarm': {
							name: '.app.OneShotAlarm',
							process: ':remote'
						},
						'.app.RepeatingAlarm': {
							name: '.app.RepeatingAlarm',
							process: ':remote'
						},
						'.app.DeviceAdminSample$DeviceAdminSampleReceiver': {
							name: '.app.DeviceAdminSample$DeviceAdminSampleReceiver',
							label: '@string/sample_device_admin',
							description: '@string/sample_device_admin_description',
							permission: 'android.permission.BIND_DEVICE_ADMIN',
							'meta-data': {
								'android.app.device_admin': {
									name: 'android.app.device_admin',
									resource: '@xml/device_admin_sample'
								}
							},
							'intent-filter': [
								{
									action: [
										'android.app.action.DEVICE_ADMIN_ENABLED'
									]
								}
							]
						},
						'.app.AppUpdateReceiver': {
							name: '.app.AppUpdateReceiver',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MY_PACKAGE_REPLACED'
									]
								}
							]
						},
						'.os.SmsMessageReceiver': {
							name: '.os.SmsMessageReceiver',
							enabled: false,
							'intent-filter': [
								{
									action: [
										'android.provider.Telephony.SMS_RECEIVED'
									]
								}
							]
						},
						'.appwidget.ExampleAppWidgetProvider': {
							name: '.appwidget.ExampleAppWidgetProvider',
							'meta-data': {
								'android.appwidget.provider': {
									name: 'android.appwidget.provider',
									resource: '@xml/appwidget_provider'
								}
							},
							'intent-filter': [
								{
									action: [
										'android.appwidget.action.APPWIDGET_UPDATE'
									]
								}
							]
						},
						'.appwidget.ExampleBroadcastReceiver': {
							name: '.appwidget.ExampleBroadcastReceiver',
							enabled: false,
							'intent-filter': [
								{
									action: [
										'android.intent.ACTION_TIMEZONE_CHANGED',
										'android.intent.ACTION_TIME'
									]
								}
							]
						}
					},
					'activity-alias': {
						'.app.CreateShortcuts': {
							name: '.app.CreateShortcuts',
							targetActivity: '.app.LauncherShortcuts',
							label: '@string/sample_shortcuts',
							'intent-filter': [
								{
									action: [
										'android.intent.action.CREATE_SHORTCUT'
									],
									category: [
										'android.intent.category.DEFAULT'
									]
								}
							]
						},
						Purgeable: {
							targetActivity: '.graphics.PurgeableBitmap',
							name: 'Purgeable',
							label: 'Graphics/PurgeableBitmap/Purgeable',
							'intent-filter': [
								{
									action: [
										'android.intent.action.MAIN'
									],
									category: [
										'android.intent.category.SAMPLE_CODE'
									]
								}
							]
						}
					}
				},
				instrumentation: {
					'.app.LocalSampleInstrumentation': {
						name: '.app.LocalSampleInstrumentation',
						targetPackage: 'com.example.android.apis',
						label: 'Local Sample'
					}
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"__attr__":{"xmlns:android":"http://schemas.android.com/apk/res/android","package":"com.example.android.apis"},"uses-permission":["android.permission.READ_CONTACTS","android.permission.WRITE_CONTACTS","android.permission.VIBRATE","android.permission.ACCESS_COARSE_LOCATION","android.permission.INTERNET","android.permission.SET_WALLPAPER","android.permission.WRITE_EXTERNAL_STORAGE","android.permission.SEND_SMS","android.permission.RECEIVE_SMS","android.permission.NFC","android.permission.RECORD_AUDIO","android.permission.CAMERA"],"uses-sdk":{"minSdkVersion":4,"targetSdkVersion":17},"uses-feature":[{"name":"android.hardware.camera"},{"name":"android.hardware.camera.autofocus","required":false}],"application":{"name":"ApiDemosApplication","label":"@string/activity_sample_code","icon":"@drawable/app_sample_code","hardwareAccelerated":true,"supportsRtl":true,"uses-library":{"com.example.will.never.exist":{"name":"com.example.will.never.exist","required":false}},"activity":{"ApiDemos":{"name":"ApiDemos","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.DEFAULT","android.intent.category.LAUNCHER"]}]},".app.HelloWorld":{"name":".app.HelloWorld","label":"@string/activity_hello_world","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.DialogActivity":{"name":".app.DialogActivity","label":"@string/activity_dialog","theme":"@android:style/Theme.Holo.Dialog","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.CustomDialogActivity":{"name":".app.CustomDialogActivity","label":"@string/activity_custom_dialog","theme":"@style/Theme.CustomDialog","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.OverscanActivity":{"name":".app.OverscanActivity","label":"@string/activity_overscan","theme":"@android:style/Theme.Holo.NoActionBar.Overscan","enabled":"@bool/atLeastJellyBeanMR2","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.QuickContactsDemo":{"name":".app.QuickContactsDemo","label":"@string/quick_contacts_demo","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.WallpaperActivity":{"name":".app.WallpaperActivity","label":"@string/activity_wallpaper","theme":"@style/Theme.Wallpaper","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.TranslucentActivity":{"name":".app.TranslucentActivity","label":"@string/activity_translucent","theme":"@style/Theme.Translucent","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.TranslucentBlurActivity":{"name":".app.TranslucentBlurActivity","label":"@string/activity_translucent_blur","theme":"@style/Theme.Transparent","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.Animation":{"name":".app.Animation","label":"@string/activity_animation","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.SaveRestoreState":{"name":".app.SaveRestoreState","label":"@string/activity_save_restore","windowSoftInputMode":["stateVisible","adjustResize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.PersistentState":{"name":".app.PersistentState","label":"@string/activity_persistent","windowSoftInputMode":["stateVisible","adjustResize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ActivityRecreate":{"name":".app.ActivityRecreate","label":"@string/activity_recreate","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FinishAffinity":{"name":".app.FinishAffinity","label":"@string/activity_finish_affinity","taskAffinity":":finishing","enabled":"@bool/atLeastJellyBean","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.SoftInputModes":{"name":".app.SoftInputModes","label":"@string/soft_input_modes","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ReceiveResult":{"name":".app.ReceiveResult","label":"@string/activity_receive_result","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.SendResult":{"name":".app.SendResult","theme":"@style/ThemeDialogWhenLarge"},".app.Forwarding":{"name":".app.Forwarding","label":"@string/activity_forwarding","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ForwardTarget":{"name":".app.ForwardTarget"},".app.RedirectEnter":{"name":".app.RedirectEnter","label":"@string/activity_redirect","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.RedirectMain":{"name":".app.RedirectMain"},".app.RedirectGetter":{"name":".app.RedirectGetter"},".app.CustomTitle":{"name":".app.CustomTitle","label":"@string/activity_custom_title","windowSoftInputMode":["stateVisible","adjustPan"],"theme":"@android:style/Theme","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ReorderOnLaunch":{"name":".app.ReorderOnLaunch","label":"@string/activity_reorder","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.RotationAnimation":{"name":".app.RotationAnimation","label":"@string/activity_rotation_animation","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ReorderTwo":{"name":".app.ReorderTwo"},".app.ReorderThree":{"name":".app.ReorderThree"},".app.ReorderFour":{"name":".app.ReorderFour"},".app.SetWallpaperActivity":{"name":".app.SetWallpaperActivity","label":"@string/activity_setwallpaper","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ScreenOrientation":{"name":".app.ScreenOrientation","label":"@string/activity_screen_orientation","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.PresentationActivity":{"name":".app.PresentationActivity","label":"@string/activity_presentation","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.PresentationWithMediaRouterActivity":{"name":".app.PresentationWithMediaRouterActivity","label":"@string/activity_presentation_with_media_router","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.SecureWindowActivity":{"name":".app.SecureWindowActivity","label":"@string/activity_secure_window","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.SecureDialogActivity":{"name":".app.SecureDialogActivity","label":"@string/activity_secure_dialog","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.SecureSurfaceViewActivity":{"name":".app.SecureSurfaceViewActivity","label":"@string/activity_secure_surface_view","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentAlertDialog":{"name":".app.FragmentAlertDialog","label":"@string/fragment_alert_dialog","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentArguments":{"name":".app.FragmentArguments","label":"@string/fragment_arguments","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentCustomAnimations":{"name":".app.FragmentCustomAnimations","label":"@string/fragment_custom_animations","enabled":"@bool/atLeastHoneycombMR2","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentHideShow":{"name":".app.FragmentHideShow","label":"@string/fragment_hide_show","windowSoftInputMode":["stateUnchanged"],"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentContextMenu":{"name":".app.FragmentContextMenu","label":"@string/fragment_context_menu","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentDialog":{"name":".app.FragmentDialog","label":"@string/fragment_dialog","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentDialogOrActivity":{"name":".app.FragmentDialogOrActivity","label":"@string/fragment_dialog_or_activity","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentLayout":{"name":".app.FragmentLayout","label":"@string/fragment_layout","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentLayout$DetailsActivity":{"name":".app.FragmentLayout$DetailsActivity","enabled":"@bool/atLeastHoneycomb"},".app.FragmentListArray":{"name":".app.FragmentListArray","label":"@string/fragment_list_array","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentMenu":{"name":".app.FragmentMenu","label":"@string/fragment_menu","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentNestingTabs":{"name":".app.FragmentNestingTabs","label":"@string/fragment_nesting_tabs","enabled":"@bool/atLeastJellyBeanMR1","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentRetainInstance":{"name":".app.FragmentRetainInstance","label":"@string/fragment_retain_instance","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentReceiveResult":{"name":".app.FragmentReceiveResult","label":"@string/fragment_receive_result","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentStack":{"name":".app.FragmentStack","label":"@string/fragment_stack","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.FragmentTabs":{"name":".app.FragmentTabs","label":"@string/fragment_tabs","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.LoaderCursor":{"name":".app.LoaderCursor","label":"@string/loader_cursor","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.LoaderCustom":{"name":".app.LoaderCustom","label":"@string/loader_custom","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.LoaderThrottle":{"name":".app.LoaderThrottle","label":"@string/loader_throttle","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.LoaderRetained":{"name":".app.LoaderRetained","label":"@string/loader_retained","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.Intents":{"name":".app.Intents","label":"@string/activity_intents","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.IntentActivityFlags":{"name":".app.IntentActivityFlags","label":"@string/activity_intent_activity_flags","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.LocalServiceActivities$Controller":{"name":".app.LocalServiceActivities$Controller","label":"@string/activity_local_service_controller","launchMode":"singleTop","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.LocalServiceActivities$Binding":{"name":".app.LocalServiceActivities$Binding","label":"@string/activity_local_service_binding","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.MessengerServiceActivities$Binding":{"name":".app.MessengerServiceActivities$Binding","label":"@string/activity_messenger_service_binding","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.RemoteService$Controller":{"name":".app.RemoteService$Controller","label":"@string/activity_remote_service_controller","launchMode":"singleTop","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.RemoteService$Binding":{"name":".app.RemoteService$Binding","label":"@string/activity_remote_service_binding","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.RemoteService$BindingOptions":{"name":".app.RemoteService$BindingOptions","label":"@string/activity_remote_service_binding_options","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ServiceStartArguments$Controller":{"name":".app.ServiceStartArguments$Controller","label":"@string/activity_service_start_arguments_controller","launchMode":"singleTop","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ForegroundService$Controller":{"name":".app.ForegroundService$Controller","label":"@string/activity_foreground_service_controller","launchMode":"singleTop","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.IsolatedService$Controller":{"name":".app.IsolatedService$Controller","label":"@string/activity_isolated_service_controller","launchMode":"singleTop","enabled":"@bool/atLeastJellyBean","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.AlarmController":{"name":".app.AlarmController","label":"@string/activity_alarm_controller","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.AlarmService":{"name":".app.AlarmService","label":"@string/activity_alarm_service","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".accessibility.ClockBackActivity":{"name":".accessibility.ClockBackActivity","label":"@string/accessibility_service","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".accessibility.TaskListActivity":{"name":".accessibility.TaskListActivity","label":"@string/accessibility_query_window","enabled":"@bool/atLeastIceCreamSandwich","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".accessibility.CustomViewAccessibilityActivity":{"name":".accessibility.CustomViewAccessibilityActivity","label":"@string/accessibility_custom_view","enabled":"@bool/atLeastIceCreamSandwich","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.LocalSample":{"name":".app.LocalSample","label":"@string/activity_local_sample","intent-filter":[{"action":["android.intent.action.MAIN"]}]},".app.ContactsFilter":{"name":".app.ContactsFilter","label":"@string/activity_contacts_filter","intent-filter":[{"action":["android.intent.action.MAIN"]}]},".app.NotifyWithText":{"name":".app.NotifyWithText","label":"App/Notification/NotifyWithText","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.IncomingMessage":{"name":".app.IncomingMessage","label":"App/Notification/IncomingMessage","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.IncomingMessageView":{"name":".app.IncomingMessageView","label":"App/Notification/IncomingMessageView"},".app.IncomingMessageInterstitial":{"name":".app.IncomingMessageInterstitial","label":"You have messages","theme":"@style/ThemeHoloDialog","launchMode":"singleTask","taskAffinity":"","excludeFromRecents":true},".app.NotificationDisplay":{"name":".app.NotificationDisplay","theme":"@style/Theme.Transparent","taskAffinity":"","excludeFromRecents":true,"noHistory":true},".app.StatusBarNotifications":{"name":".app.StatusBarNotifications","label":"App/Notification/Status Bar","launchMode":"singleTop","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.NotifyingController":{"name":".app.NotifyingController","label":"App/Notification/Notifying Service Controller","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.AlertDialogSamples":{"name":".app.AlertDialogSamples","label":"@string/activity_alert_dialog","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.SearchInvoke":{"name":".app.SearchInvoke","label":"@string/search_invoke","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}],"meta-data":{"android.app.default_searchable":{"name":"android.app.default_searchable","value":".app.SearchQueryResults"}}},".app.SearchQueryResults":{"name":".app.SearchQueryResults","label":"@string/search_query_results","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]},{"action":["android.intent.action.SEARCH"],"category":["android.intent.category.DEFAULT"]}],"meta-data":{"android.app.searchable":{"name":"android.app.searchable","resource":"@xml/searchable"}}},".app.LauncherShortcuts":{"name":".app.LauncherShortcuts","label":"@string/shortcuts","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.MenuInflateFromXml":{"name":".app.MenuInflateFromXml","label":"@string/menu_from_xml_title","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.DeviceAdminSample":{"name":".app.DeviceAdminSample","label":"@string/activity_sample_device_admin","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.VoiceRecognition":{"name":".app.VoiceRecognition","label":"@string/voice_recognition","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.TextToSpeechActivity":{"name":".app.TextToSpeechActivity","label":"@string/text_to_speech","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ActionBarMechanics":{"name":".app.ActionBarMechanics","label":"@string/action_bar_mechanics","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ActionBarUsage":{"name":".app.ActionBarUsage","label":"@string/action_bar_usage","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ActionBarDisplayOptions":{"name":".app.ActionBarDisplayOptions","label":"@string/action_bar_display_options","logo":"@drawable/apidemo_androidlogo","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ActionBarTabs":{"name":".app.ActionBarTabs","label":"@string/action_bar_tabs","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ActionBarSettingsActionProviderActivity":{"name":".app.ActionBarSettingsActionProviderActivity","label":"@string/action_bar_settings_action_provider","enabled":"@bool/atLeastIceCreamSandwich","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".app.ActionBarShareActionProviderActivity":{"name":".app.ActionBarShareActionProviderActivity","label":"@string/action_bar_share_action_provider","enabled":"@bool/atLeastIceCreamSandwich","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".accessibility.AccessibilityNodeProviderActivity":{"name":".accessibility.AccessibilityNodeProviderActivity","label":"@string/accessibility_node_provider","enabled":"@bool/atLeastIceCreamSandwich","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.FragmentPreferences":{"name":".preference.FragmentPreferences","label":"@string/fragment_preferences","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.PreferenceWithHeaders":{"name":".preference.PreferenceWithHeaders","label":"@string/preference_with_headers","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.PreferencesFromXml":{"name":".preference.PreferencesFromXml","label":"@string/preferences_from_xml","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.PreferencesFromCode":{"name":".preference.PreferencesFromCode","label":"@string/preferences_from_code","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.AdvancedPreferences":{"name":".preference.AdvancedPreferences","label":"@string/advanced_preferences","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.LaunchingPreferences":{"name":".preference.LaunchingPreferences","label":"@string/launching_preferences","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.PreferenceDependencies":{"name":".preference.PreferenceDependencies","label":"@string/preference_dependencies","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.DefaultValues":{"name":".preference.DefaultValues","label":"@string/default_values","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".preference.SwitchPreference":{"name":".preference.SwitchPreference","label":"@string/switch_preference","enabled":"@bool/atLeastIceCreamSandwich","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".content.ClipboardSample":{"name":".content.ClipboardSample","label":"@string/activity_clipboard","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".content.ExternalStorage":{"name":".content.ExternalStorage","label":"@string/activity_external_storage","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE","android.intent.category.EMBED"]}]},".content.StyledText":{"name":".content.StyledText","label":"@string/activity_styled_text","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE","android.intent.category.EMBED"]}]},".content.ResourcesLayoutReference":{"name":".content.ResourcesLayoutReference","label":"@string/activity_resources_layout_reference","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE","android.intent.category.EMBED"]}]},".content.ResourcesWidthAndHeight":{"name":".content.ResourcesWidthAndHeight","label":"@string/activity_resources_width_and_height","enabled":"@bool/atLeastHoneycombMR2","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE","android.intent.category.EMBED"]}]},".content.ResourcesSmallestWidth":{"name":".content.ResourcesSmallestWidth","label":"@string/activity_resources_smallest_width","enabled":"@bool/atLeastHoneycombMR2","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE","android.intent.category.EMBED"]}]},".content.ReadAsset":{"name":".content.ReadAsset","label":"@string/activity_read_asset","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE","android.intent.category.EMBED"]}]},".content.ResourcesSample":{"name":".content.ResourcesSample","label":"@string/activity_resources","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".content.PickContact":{"name":".content.PickContact","label":"@string/activity_pick_contact","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".content.ChangedContacts":{"name":".content.ChangedContacts","label":"@string/activity_changed_contact","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".content.InstallApk":{"name":".content.InstallApk","label":"@string/activity_install_apk","enabled":"@bool/atLeastHoneycombMR2","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".os.MorseCode":{"name":".os.MorseCode","label":"OS/Morse Code","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".os.Sensors":{"name":".os.Sensors","label":"OS/Sensors","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".os.TriggerSensors":{"name":".os.TriggerSensors","label":"OS/TriggerSensors","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".os.RotationVectorDemo":{"name":".os.RotationVectorDemo","label":"OS/Rotation Vector","screenOrientation":"nosensor","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".os.SmsMessagingDemo":{"name":".os.SmsMessagingDemo","label":"OS/SMS Messaging","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".os.SmsReceivedDialog":{"name":".os.SmsReceivedDialog","theme":"@android:style/Theme.Translucent.NoTitleBar","launchMode":"singleInstance"},".animation.AnimationLoading":{"name":".animation.AnimationLoading","label":"Animation/Loading","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.AnimationCloning":{"name":".animation.AnimationCloning","label":"Animation/Cloning","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.AnimationSeeking":{"name":".animation.AnimationSeeking","label":"Animation/Seeking","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.AnimatorEvents":{"name":".animation.AnimatorEvents","label":"Animation/Events","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.BouncingBalls":{"name":".animation.BouncingBalls","label":"Animation/Bouncing Balls","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.CustomEvaluator":{"name":".animation.CustomEvaluator","label":"Animation/Custom Evaluator","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.ListFlipper":{"name":".animation.ListFlipper","label":"Animation/View Flip","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.ReversingAnimation":{"name":".animation.ReversingAnimation","label":"Animation/Reversing","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.MultiPropertyAnimation":{"name":".animation.MultiPropertyAnimation","label":"Animation/Multiple Properties","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.LayoutAnimations":{"name":".animation.LayoutAnimations","label":"Animation/Layout Animations","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.LayoutAnimationsHideShow":{"name":".animation.LayoutAnimationsHideShow","label":"Animation/Hide-Show Animations","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.LayoutAnimationsByDefault":{"name":".animation.LayoutAnimationsByDefault","label":"Animation/Default Layout Animations","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".animation.Transition3d":{"name":".animation.Transition3d","label":"Views/Animation/3D Transition","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TextClockDemo":{"name":".view.TextClockDemo","label":"Views/TextClock","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ChronometerDemo":{"name":".view.ChronometerDemo","label":"Views/Chronometer","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.WebView1":{"name":".view.WebView1","label":"Views/WebView","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.RelativeLayout1":{"name":".view.RelativeLayout1","label":"Views/Layouts/RelativeLayout/1. Vertical","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.RelativeLayout2":{"name":".view.RelativeLayout2","label":"Views/Layouts/RelativeLayout/2. Simple Form","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout1":{"name":".view.LinearLayout1","label":"Views/Layouts/LinearLayout/01. Vertical","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout2":{"name":".view.LinearLayout2","label":"Views/Layouts/LinearLayout/02. Vertical (Fill Screen)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout3":{"name":".view.LinearLayout3","label":"Views/Layouts/LinearLayout/03. Vertical (Padded)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout4":{"name":".view.LinearLayout4","label":"Views/Layouts/LinearLayout/04. Horizontal","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout5":{"name":".view.LinearLayout5","label":"Views/Layouts/LinearLayout/05. Simple Form","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout6":{"name":".view.LinearLayout6","label":"Views/Layouts/LinearLayout/06. Uniform Size","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout7":{"name":".view.LinearLayout7","label":"Views/Layouts/LinearLayout/07. Fill Parent","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout8":{"name":".view.LinearLayout8","label":"Views/Layouts/LinearLayout/08. Gravity","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout9":{"name":".view.LinearLayout9","label":"Views/Layouts/LinearLayout/09. Layout Weight","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LinearLayout10":{"name":".view.LinearLayout10","label":"Views/Layouts/LinearLayout/10. Background Image","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.CustomLayoutActivity":{"name":".view.CustomLayoutActivity","label":"Views/Layouts/CustomLayout","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.RadioGroup1":{"name":".view.RadioGroup1","label":"Views/Radio Group","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ScrollView1":{"name":".view.ScrollView1","label":"Views/Layouts/ScrollView/1. Short","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ScrollView2":{"name":".view.ScrollView2","label":"Views/Layouts/ScrollView/2. Long","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.HorizontalScrollView1":{"name":".view.HorizontalScrollView1","label":"Views/Layouts/HorizontalScrollView","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Tabs1":{"name":".view.Tabs1","label":"Views/Tabs/1. Content By Id","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Tabs2":{"name":".view.Tabs2","label":"Views/Tabs/2. Content By Factory","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Tabs3":{"name":".view.Tabs3","label":"Views/Tabs/3. Content By Intent","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Tabs4":{"name":".view.Tabs4","label":"Views/Tabs/4. Non Holo theme","theme":"@android:style/Theme","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Tabs5":{"name":".view.Tabs5","label":"Views/Tabs/5. Scrollable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Tabs6":{"name":".view.Tabs6","label":"Views/Tabs/6. Right aligned","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.InternalSelectionScroll":{"name":".view.InternalSelectionScroll","label":"Views/Layouts/ScrollView/3. Internal Selection","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout1":{"name":".view.TableLayout1","label":"Views/Layouts/TableLayout/01. Basic","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout2":{"name":".view.TableLayout2","label":"Views/Layouts/TableLayout/02. Empty Cells","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout3":{"name":".view.TableLayout3","label":"Views/Layouts/TableLayout/03. Long Content","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout4":{"name":".view.TableLayout4","label":"Views/Layouts/TableLayout/04. Stretchable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout5":{"name":".view.TableLayout5","label":"Views/Layouts/TableLayout/05. Spanning and Stretchable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout6":{"name":".view.TableLayout6","label":"Views/Layouts/TableLayout/06. More Spanning and Stretchable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout7":{"name":".view.TableLayout7","label":"Views/Layouts/TableLayout/07. Column Collapse","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout8":{"name":".view.TableLayout8","label":"Views/Layouts/TableLayout/08. Toggle Stretch","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout9":{"name":".view.TableLayout9","label":"Views/Layouts/TableLayout/09. Toggle Shrink","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout10":{"name":".view.TableLayout10","label":"Views/Layouts/TableLayout/10. Simple Form","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout11":{"name":".view.TableLayout11","label":"Views/Layouts/TableLayout/11. Gravity","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TableLayout12":{"name":".view.TableLayout12","label":"Views/Layouts/TableLayout/12. Cell Spanning","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.GridLayout1":{"name":".view.GridLayout1","label":"Views/Layouts/GridLayout/1. Simple Form","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.GridLayout2":{"name":".view.GridLayout2","label":"Views/Layouts/GridLayout/2. Form (XML)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.GridLayout3":{"name":".view.GridLayout3","label":"Views/Layouts/GridLayout/3. Form (Java)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Baseline1":{"name":".view.Baseline1","label":"Views/Layouts/Baseline/1. Top","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Baseline2":{"name":".view.Baseline2","label":"Views/Layouts/Baseline/2. Bottom","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Baseline3":{"name":".view.Baseline3","label":"Views/Layouts/Baseline/3. Center","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Baseline4":{"name":".view.Baseline4","label":"Views/Layouts/Baseline/4. Everywhere","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Baseline6":{"name":".view.Baseline6","label":"Views/Layouts/Baseline/5. Multi-line","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Baseline7":{"name":".view.Baseline7","label":"Views/Layouts/Baseline/6. Relative","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.BaselineNested1":{"name":".view.BaselineNested1","label":"Views/Layouts/Baseline/Nested Example 1","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.BaselineNested2":{"name":".view.BaselineNested2","label":"Views/Layouts/Baseline/Nested Example 2","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.BaselineNested3":{"name":".view.BaselineNested3","label":"Views/Layouts/Baseline/Nested Example 3","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ScrollBar1":{"name":".view.ScrollBar1","label":"Views/ScrollBars/1. Basic","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ScrollBar2":{"name":".view.ScrollBar2","label":"Views/ScrollBars/2. Fancy","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ScrollBar3":{"name":".view.ScrollBar3","label":"Views/ScrollBars/3. Style","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Visibility1":{"name":".view.Visibility1","label":"Views/Visibility","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List1":{"name":".view.List1","label":"Views/Lists/01. Array","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List2":{"name":".view.List2","label":"Views/Lists/02. Cursor (People)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List3":{"name":".view.List3","label":"Views/Lists/03. Cursor (Phones)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List4":{"name":".view.List4","label":"Views/Lists/04. ListAdapter","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List5":{"name":".view.List5","label":"Views/Lists/05. Separators","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List6":{"name":".view.List6","label":"Views/Lists/06. ListAdapter Collapsed","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List7":{"name":".view.List7","label":"Views/Lists/07. Cursor (Phones)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List8":{"name":".view.List8","label":"Views/Lists/08. Photos","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List9":{"name":".view.List9","label":"Views/Lists/09. Array (Overlay)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List10":{"name":".view.List10","label":"Views/Lists/10. Single choice list","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List11":{"name":".view.List11","label":"Views/Lists/11. Multiple choice list","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List12":{"name":".view.List12","label":"Views/Lists/12. Transcript","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List13":{"name":".view.List13","label":"Views/Lists/13. Slow Adapter","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List14":{"name":".view.List14","label":"Views/Lists/14. Efficient Adapter","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List15":{"name":".view.List15","label":"Views/Lists/15. Selection Mode","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List16":{"name":".view.List16","label":"Views/Lists/16. Border selection mode","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.List17":{"name":".view.List17","label":"Views/Lists/17. Activate items","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ExpandableList1":{"name":".view.ExpandableList1","label":"Views/Expandable Lists/1. Custom Adapter","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ExpandableList2":{"name":".view.ExpandableList2","label":"Views/Expandable Lists/2. Cursor (People)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ExpandableList3":{"name":".view.ExpandableList3","label":"Views/Expandable Lists/3. Simple Adapter","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.CustomView1":{"name":".view.CustomView1","label":"Views/Custom","theme":"@android:style/Theme.Light","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Gallery1":{"name":".view.Gallery1","label":"Views/Gallery/1. Photos","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Gallery2":{"name":".view.Gallery2","label":"Views/Gallery/2. People","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Spinner1":{"name":".view.Spinner1","label":"Views/Spinner","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Grid1":{"name":".view.Grid1","label":"Views/Grid/1. Icon Grid","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Grid2":{"name":".view.Grid2","label":"Views/Grid/2. Photo Grid","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Grid3":{"name":".view.Grid3","label":"Views/Grid/3. Selection Mode","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ImageView1":{"name":".view.ImageView1","label":"Views/ImageView","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ImageSwitcher1":{"name":".view.ImageSwitcher1","label":"Views/ImageSwitcher","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.TextSwitcher1":{"name":".view.TextSwitcher1","label":"Views/TextSwitcher","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ImageButton1":{"name":".view.ImageButton1","label":"Views/ImageButton","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Animation1":{"name":".view.Animation1","label":"Views/Animation/Shake","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Animation2":{"name":".view.Animation2","label":"Views/Animation/Push","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Animation3":{"name":".view.Animation3","label":"Views/Animation/Interpolators","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LayoutAnimation1":{"name":".view.LayoutAnimation1","label":"Views/Layout Animation/1. Grid Fade","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LayoutAnimation2":{"name":".view.LayoutAnimation2","label":"Views/Layout Animation/2. List Cascade","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LayoutAnimation3":{"name":".view.LayoutAnimation3","label":"Views/Layout Animation/3. Reverse Order","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LayoutAnimation4":{"name":".view.LayoutAnimation4","label":"Views/Layout Animation/4. Randomize","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LayoutAnimation5":{"name":".view.LayoutAnimation5","label":"Views/Layout Animation/5. Grid Direction","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LayoutAnimation6":{"name":".view.LayoutAnimation6","label":"Views/Layout Animation/6. Wave Scale","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.LayoutAnimation7":{"name":".view.LayoutAnimation7","label":"Views/Layout Animation/7. Nested Animations","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Controls1":{"name":".view.Controls1","label":"Views/Controls/1. Light Theme","theme":"@android:style/Theme.Light","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Controls2":{"name":".view.Controls2","label":"Views/Controls/2. Dark Theme","theme":"@android:style/Theme","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Controls3":{"name":".view.Controls3","label":"Views/Controls/3. Holo Light Theme","theme":"@android:style/Theme.Holo.Light","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Controls4":{"name":".view.Controls4","label":"Views/Controls/4. Holo Dark Theme","theme":"@android:style/Theme.Holo","enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Controls5":{"name":".view.Controls5","label":"Views/Controls/5. Custom Theme","theme":"@style/CustomTheme","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Controls6":{"name":".view.Controls6","label":"Views/Controls/6. Holo or Old Theme","theme":"@style/ThemeHolo","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Buttons1":{"name":".view.Buttons1","label":"Views/Buttons","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.AutoComplete1":{"name":".view.AutoComplete1","label":"Views/Auto Complete/1. Screen Top","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.AutoComplete2":{"name":".view.AutoComplete2","label":"Views/Auto Complete/2. Screen Bottom","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.AutoComplete3":{"name":".view.AutoComplete3","label":"Views/Auto Complete/3. Scroll","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.AutoComplete4":{"name":".view.AutoComplete4","label":"Views/Auto Complete/4. Contacts","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.AutoComplete5":{"name":".view.AutoComplete5","label":"Views/Auto Complete/5. Contacts with Hint","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.AutoComplete6":{"name":".view.AutoComplete6","label":"Views/Auto Complete/6. Multiple items","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ProgressBar1":{"name":".view.ProgressBar1","label":"Views/Progress Bar/1. Incremental","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ProgressBar2":{"name":".view.ProgressBar2","label":"Views/Progress Bar/2. Smooth","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ProgressBar3":{"name":".view.ProgressBar3","label":"Views/Progress Bar/3. Dialogs","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ProgressBar4":{"name":".view.ProgressBar4","label":"Views/Progress Bar/4. In Title Bar","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.SeekBar1":{"name":".view.SeekBar1","label":"Views/Seek Bar","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.RatingBar1":{"name":".view.RatingBar1","label":"Views/Rating Bar","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Focus1":{"name":".view.Focus1","label":"Views/Focus/1. Vertical","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Focus2":{"name":".view.Focus2","label":"Views/Focus/2. Horizontal","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Focus3":{"name":".view.Focus3","label":"Views/Focus/3. Circular","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.InternalSelectionFocus":{"name":".view.InternalSelectionFocus","label":"Views/Focus/4. Internal Selection","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Focus5":{"name":".view.Focus5","label":"Views/Focus/5. Sequential (Tab Order)","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.WindowFocusObserver":{"name":".view.WindowFocusObserver","label":"Views/Focus/6. Window Focus Observer","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.DateWidgets1":{"name":".view.DateWidgets1","label":"Views/Date Widgets/1. Dialog","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.DateWidgets2":{"name":".view.DateWidgets2","label":"Views/Date Widgets/2. Inline","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.PopupMenu1":{"name":".view.PopupMenu1","label":"Views/Popup Menu","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.SearchViewActionBar":{"name":".view.SearchViewActionBar","label":"Views/Search View/Action Bar","theme":"@android:style/Theme.Holo","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}],"meta-data":{"android.app.default_searchable":{"name":"android.app.default_searchable","value":".app.SearchQueryResults"}}},".view.SearchViewAlwaysVisible":{"name":".view.SearchViewAlwaysVisible","label":"Views/Search View/Always Expanded","theme":"@android:style/Theme.Holo","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}],"meta-data":{"android.app.default_searchable":{"name":"android.app.default_searchable","value":".app.SearchQueryResults"}}},".view.SearchViewFilterMode":{"name":".view.SearchViewFilterMode","label":"Views/Search View/Filter","theme":"@android:style/Theme.Holo","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.RotatingButton":{"name":".view.RotatingButton","label":"Views/Rotating Button","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.SecureView":{"name":".view.SecureView","label":"Views/Secure View","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.SplitTouchView":{"name":".view.SplitTouchView","label":"Views/Splitting Touches across Views","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.DragAndDropDemo":{"name":".view.DragAndDropDemo","label":"Views/Drag and Drop","hardwareAccelerated":false,"enabled":"@bool/atLeastHoneycomb","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.GameControllerInput":{"name":".view.GameControllerInput","label":"Views/Game Controller Input","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Hover":{"name":".view.Hover","label":"Views/Hover Events","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.SystemUIModes":{"name":".view.SystemUIModes","label":"Views/System UI Visibility/System UI Modes","uiOptions":"splitActionBarWhenNarrow","enabled":"@bool/atLeastJellyBeanMR2","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.SystemUIModesOverlay":{"name":".view.SystemUIModesOverlay","label":"Views/System UI Visibility/System UI Modes Overlay","uiOptions":"splitActionBarWhenNarrow","enabled":"@bool/atLeastJellyBean","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.ContentBrowserActivity":{"name":".view.ContentBrowserActivity","label":"Views/System UI Visibility/Content Browser","theme":"@android:style/Theme.Holo.Light.DarkActionBar","uiOptions":"splitActionBarWhenNarrow","enabled":"@bool/atLeastJellyBean","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.VideoPlayerActivity":{"name":".view.VideoPlayerActivity","label":"Views/System UI Visibility/Video Player","theme":"@android:style/Theme.Holo","uiOptions":"splitActionBarWhenNarrow","enabled":"@bool/atLeastJellyBean","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".view.Switches":{"name":".view.Switches","label":"Views/Switches","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.kube.Kube":{"name":".graphics.kube.Kube","label":"Graphics/OpenGL ES/Kube","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Compass":{"name":".graphics.Compass","label":"Graphics/Compass","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.CameraPreview":{"name":".graphics.CameraPreview","label":"Graphics/CameraPreview","screenOrientation":"landscape","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.CompressedTextureActivity":{"name":".graphics.CompressedTextureActivity","label":"Graphics/OpenGL ES/Compressed Texture","theme":"@android:style/Theme.NoTitleBar","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.CubeMapActivity":{"name":".graphics.CubeMapActivity","label":"Graphics/OpenGL ES/Cube Map","theme":"@android:style/Theme.NoTitleBar","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.FrameBufferObjectActivity":{"name":".graphics.FrameBufferObjectActivity","label":"Graphics/OpenGL ES/Frame Buffer Object","theme":"@android:style/Theme.NoTitleBar","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.GLSurfaceViewActivity":{"name":".graphics.GLSurfaceViewActivity","label":"Graphics/OpenGL ES/GLSurfaceView","theme":"@android:style/Theme.NoTitleBar","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.GLES20Activity":{"name":".graphics.GLES20Activity","label":"Graphics/OpenGL ES/OpenGL ES 2.0","theme":"@android:style/Theme.NoTitleBar","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.MatrixPaletteActivity":{"name":".graphics.MatrixPaletteActivity","label":"Graphics/OpenGL ES/Matrix Palette Skinning","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.TranslucentGLSurfaceViewActivity":{"name":".graphics.TranslucentGLSurfaceViewActivity","label":"Graphics/OpenGL ES/Translucent GLSurfaceView","theme":"@style/Theme.Translucent","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.TriangleActivity":{"name":".graphics.TriangleActivity","label":"Graphics/OpenGL ES/Textured Triangle","theme":"@android:style/Theme.Holo.Dialog","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.spritetext.SpriteTextActivity":{"name":".graphics.spritetext.SpriteTextActivity","label":"Graphics/OpenGL ES/Sprite Text","theme":"@android:style/Theme.NoTitleBar","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.TouchRotateActivity":{"name":".graphics.TouchRotateActivity","label":"Graphics/OpenGL ES/Touch Rotate","theme":"@android:style/Theme.NoTitleBar","configChanges":["keyboardHidden","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.PolyToPoly":{"name":".graphics.PolyToPoly","label":"Graphics/PolyToPoly","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.ScaleToFit":{"name":".graphics.ScaleToFit","label":"Graphics/ScaleToFit","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.RoundRects":{"name":".graphics.RoundRects","label":"Graphics/RoundRects","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.ShapeDrawable1":{"name":".graphics.ShapeDrawable1","label":"Graphics/Drawable/ShapeDrawable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.SurfaceViewOverlay":{"name":".graphics.SurfaceViewOverlay","label":"Graphics/SurfaceView Overlay","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.WindowSurface":{"name":".graphics.WindowSurface","label":"Graphics/Surface Window","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.TextAlign":{"hardwareAccelerated":false,"name":".graphics.TextAlign","label":"Graphics/Text Align","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Arcs":{"name":".graphics.Arcs","label":"Graphics/Arcs","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Patterns":{"name":".graphics.Patterns","label":"Graphics/Patterns","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Clipping":{"hardwareAccelerated":false,"name":".graphics.Clipping","label":"Graphics/Clipping","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Layers":{"name":".graphics.Layers","label":"Graphics/Layers","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.UnicodeChart":{"hardwareAccelerated":false,"name":".graphics.UnicodeChart","label":"Graphics/UnicodeChart","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.PathFillTypes":{"name":".graphics.PathFillTypes","label":"Graphics/PathFillTypes","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Pictures":{"hardwareAccelerated":false,"name":".graphics.Pictures","label":"Graphics/Pictures","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Vertices":{"hardwareAccelerated":false,"name":".graphics.Vertices","label":"Graphics/Vertices","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.AnimateDrawables":{"name":".graphics.AnimateDrawables","label":"Graphics/AnimateDrawables","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.SensorTest":{"name":".graphics.SensorTest","label":"Graphics/SensorTest","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.AlphaBitmap":{"name":".graphics.AlphaBitmap","label":"Graphics/AlphaBitmap","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Regions":{"name":".graphics.Regions","label":"Graphics/Regions","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Sweep":{"name":".graphics.Sweep","label":"Graphics/Sweep","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.BitmapMesh":{"name":".graphics.BitmapMesh","label":"Graphics/BitmapMesh","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.MeasureText":{"name":".graphics.MeasureText","label":"Graphics/MeasureText","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Typefaces":{"name":".graphics.Typefaces","label":"Graphics/Typefaces","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.FingerPaint":{"name":".graphics.FingerPaint","label":"Graphics/FingerPaint","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.ColorMatrixSample":{"name":".graphics.ColorMatrixSample","label":"Graphics/ColorMatrix","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.BitmapDecode":{"hardwareAccelerated":false,"name":".graphics.BitmapDecode","label":"Graphics/BitmapDecode","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.ColorFilters":{"name":".graphics.ColorFilters","label":"Graphics/ColorFilters","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.CreateBitmap":{"name":".graphics.CreateBitmap","label":"Graphics/CreateBitmap","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.DrawPoints":{"hardwareAccelerated":false,"name":".graphics.DrawPoints","label":"Graphics/Points","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.TouchPaint":{"name":".graphics.TouchPaint","label":"Graphics/Touch Paint","theme":"@style/Theme.Black","configChanges":["keyboard","keyboardHidden","navigation","orientation","screenLayout","screenSize","smallestScreenSize"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.BitmapPixels":{"name":".graphics.BitmapPixels","label":"Graphics/BitmapPixels","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.Xfermodes":{"name":".graphics.Xfermodes","label":"Graphics/Xfermodes","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.PathEffects":{"name":".graphics.PathEffects","label":"Graphics/PathEffects","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.GradientDrawable1":{"name":".graphics.GradientDrawable1","label":"Graphics/Drawable/GradientDrawable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.PurgeableBitmap":{"name":".graphics.PurgeableBitmap","label":"Graphics/PurgeableBitmap/NonPurgeable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".graphics.DensityActivity":{"name":".graphics.DensityActivity","label":"Graphics/Density","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".media.MediaPlayerDemo":{"name":".media.MediaPlayerDemo","label":"Media/MediaPlayer","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".media.MediaPlayerDemo_Audio":{"name":".media.MediaPlayerDemo_Audio","label":"Media/MediaPlayer","intent-filter":[{"category":["android.intent.category.SAMPLE_CODE"]}]},".media.MediaPlayerDemo_Video":{"name":".media.MediaPlayerDemo_Video","label":"Media/MediaPlayer","intent-filter":[{"category":["android.intent.category.SAMPLE_CODE"]}]},".media.VideoViewDemo":{"name":".media.VideoViewDemo","label":"Media/VideoView","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".media.AudioFxDemo":{"name":".media.AudioFxDemo","label":"Media/AudioFx","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".appwidget.ExampleAppWidgetConfigure":{"name":".appwidget.ExampleAppWidgetConfigure","intent-filter":[{"action":["android.appwidget.action.APPWIDGET_CONFIGURE"]}]},".text.Link":{"name":".text.Link","label":"Text/Linkify","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".text.Marquee":{"name":".text.Marquee","label":"Text/Marquee","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".text.LogTextBox1":{"name":".text.LogTextBox1","label":"Text/LogTextBox","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".nfc.ForegroundDispatch":{"name":".nfc.ForegroundDispatch","label":"NFC/ForegroundDispatch","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".nfc.TechFilter":{"name":".nfc.TechFilter","label":"NFC/TechFilter","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]},{"action":["android.nfc.action.TECH_DISCOVERED"]}],"meta-data":{"android.nfc.action.TECH_DISCOVERED":{"name":"android.nfc.action.TECH_DISCOVERED","resource":"@xml/filter_nfc"}}},".nfc.ForegroundNdefPush":{"name":".nfc.ForegroundNdefPush","label":"NFC/ForegroundNdefPush","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]},".security.KeyStoreUsage":{"name":".security.KeyStoreUsage","label":"Security/KeyStore","windowSoftInputMode":["adjustPan"],"intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]}},"provider":{".app.LoaderThrottle$SimpleProvider":{"name":".app.LoaderThrottle$SimpleProvider","authorities":"com.example.android.apis.app.LoaderThrottle","enabled":"@bool/atLeastHoneycomb"},".app.SearchSuggestionSampleProvider":{"name":".app.SearchSuggestionSampleProvider","authorities":"com.example.android.apis.SuggestionProvider"},".content.FileProvider":{"name":".content.FileProvider","authorities":"com.example.android.apis.content.FileProvider","enabled":"@bool/atLeastHoneycombMR2"}},"service":{".app.LocalService":{"name":".app.LocalService","stopWithTask":true},".app.MessengerService":{"name":".app.MessengerService","process":":remote"},".app.RemoteService":{"name":".app.RemoteService","process":":remote","intent-filter":[{"action":["com.example.android.apis.app.IRemoteService","com.example.android.apis.app.ISecondary","com.example.android.apis.app.REMOTE_SERVICE"]}]},".app.ServiceStartArguments":{"name":".app.ServiceStartArguments"},".app.ForegroundService":{"name":".app.ForegroundService"},".app.IsolatedService":{"name":".app.IsolatedService","isolatedProcess":true,"enabled":"@bool/atLeastJellyBean"},".app.IsolatedService2":{"name":".app.IsolatedService2","isolatedProcess":true,"enabled":"@bool/atLeastJellyBean"},".app.AlarmService_Service":{"name":".app.AlarmService_Service","process":":remote"},".accessibility.ClockBackService":{"name":".accessibility.ClockBackService","label":"@string/accessibility_service_label","permission":"android.permission.BIND_ACCESSIBILITY_SERVICE","intent-filter":[{"action":["android.accessibilityservice.AccessibilityService"]}]},".accessibility.TaskBackService":{"name":".accessibility.TaskBackService","label":"@string/accessibility_query_window_label","enabled":"@bool/atLeastIceCreamSandwich","permission":"android.permission.BIND_ACCESSIBILITY_SERVICE","intent-filter":[{"action":["android.accessibilityservice.AccessibilityService"]}],"meta-data":{"android.accessibilityservice":{"name":"android.accessibilityservice","resource":"@xml/taskbackconfig"}}},".app.NotifyingService":{"name":".app.NotifyingService"}},"receiver":{".app.OneShotAlarm":{"name":".app.OneShotAlarm","process":":remote"},".app.RepeatingAlarm":{"name":".app.RepeatingAlarm","process":":remote"},".app.DeviceAdminSample$DeviceAdminSampleReceiver":{"name":".app.DeviceAdminSample$DeviceAdminSampleReceiver","label":"@string/sample_device_admin","description":"@string/sample_device_admin_description","permission":"android.permission.BIND_DEVICE_ADMIN","meta-data":{"android.app.device_admin":{"name":"android.app.device_admin","resource":"@xml/device_admin_sample"}},"intent-filter":[{"action":["android.app.action.DEVICE_ADMIN_ENABLED"]}]},".app.AppUpdateReceiver":{"name":".app.AppUpdateReceiver","intent-filter":[{"action":["android.intent.action.MY_PACKAGE_REPLACED"]}]},".os.SmsMessageReceiver":{"name":".os.SmsMessageReceiver","enabled":false,"intent-filter":[{"action":["android.provider.Telephony.SMS_RECEIVED"]}]},".appwidget.ExampleAppWidgetProvider":{"name":".appwidget.ExampleAppWidgetProvider","meta-data":{"android.appwidget.provider":{"name":"android.appwidget.provider","resource":"@xml/appwidget_provider"}},"intent-filter":[{"action":["android.appwidget.action.APPWIDGET_UPDATE"]}]},".appwidget.ExampleBroadcastReceiver":{"name":".appwidget.ExampleBroadcastReceiver","enabled":false,"intent-filter":[{"action":["android.intent.ACTION_TIMEZONE_CHANGED","android.intent.ACTION_TIME"]}]}},"activity-alias":{".app.CreateShortcuts":{"name":".app.CreateShortcuts","targetActivity":".app.LauncherShortcuts","label":"@string/sample_shortcuts","intent-filter":[{"action":["android.intent.action.CREATE_SHORTCUT"],"category":["android.intent.category.DEFAULT"]}]},"Purgeable":{"targetActivity":".graphics.PurgeableBitmap","name":"Purgeable","label":"Graphics/PurgeableBitmap/Purgeable","intent-filter":[{"action":["android.intent.action.MAIN"],"category":["android.intent.category.SAMPLE_CODE"]}]}}},"instrumentation":{".app.LocalSampleInstrumentation":{"name":".app.LocalSampleInstrumentation","targetPackage":"com.example.android.apis","label":"Local Sample"}}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"__attr__": {',
				'		"xmlns:android": "http://schemas.android.com/apk/res/android",',
				'		"package": "com.example.android.apis"',
				'	},',
				'	"uses-permission": [',
				'		"android.permission.READ_CONTACTS",',
				'		"android.permission.WRITE_CONTACTS",',
				'		"android.permission.VIBRATE",',
				'		"android.permission.ACCESS_COARSE_LOCATION",',
				'		"android.permission.INTERNET",',
				'		"android.permission.SET_WALLPAPER",',
				'		"android.permission.WRITE_EXTERNAL_STORAGE",',
				'		"android.permission.SEND_SMS",',
				'		"android.permission.RECEIVE_SMS",',
				'		"android.permission.NFC",',
				'		"android.permission.RECORD_AUDIO",',
				'		"android.permission.CAMERA"',
				'	],',
				'	"uses-sdk": {',
				'		"minSdkVersion": 4,',
				'		"targetSdkVersion": 17',
				'	},',
				'	"uses-feature": [',
				'		{',
				'			"name": "android.hardware.camera"',
				'		},',
				'		{',
				'			"name": "android.hardware.camera.autofocus",',
				'			"required": false',
				'		}',
				'	],',
				'	"application": {',
				'		"name": "ApiDemosApplication",',
				'		"label": "@string/activity_sample_code",',
				'		"icon": "@drawable/app_sample_code",',
				'		"hardwareAccelerated": true,',
				'		"supportsRtl": true,',
				'		"uses-library": {',
				'			"com.example.will.never.exist": {',
				'				"name": "com.example.will.never.exist",',
				'				"required": false',
				'			}',
				'		},',
				'		"activity": {',
				'			"ApiDemos": {',
				'				"name": "ApiDemos",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.DEFAULT",',
				'							"android.intent.category.LAUNCHER"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.HelloWorld": {',
				'				"name": ".app.HelloWorld",',
				'				"label": "@string/activity_hello_world",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.DialogActivity": {',
				'				"name": ".app.DialogActivity",',
				'				"label": "@string/activity_dialog",',
				'				"theme": "@android:style/Theme.Holo.Dialog",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.CustomDialogActivity": {',
				'				"name": ".app.CustomDialogActivity",',
				'				"label": "@string/activity_custom_dialog",',
				'				"theme": "@style/Theme.CustomDialog",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.OverscanActivity": {',
				'				"name": ".app.OverscanActivity",',
				'				"label": "@string/activity_overscan",',
				'				"theme": "@android:style/Theme.Holo.NoActionBar.Overscan",',
				'				"enabled": "@bool/atLeastJellyBeanMR2",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.QuickContactsDemo": {',
				'				"name": ".app.QuickContactsDemo",',
				'				"label": "@string/quick_contacts_demo",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.WallpaperActivity": {',
				'				"name": ".app.WallpaperActivity",',
				'				"label": "@string/activity_wallpaper",',
				'				"theme": "@style/Theme.Wallpaper",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.TranslucentActivity": {',
				'				"name": ".app.TranslucentActivity",',
				'				"label": "@string/activity_translucent",',
				'				"theme": "@style/Theme.Translucent",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.TranslucentBlurActivity": {',
				'				"name": ".app.TranslucentBlurActivity",',
				'				"label": "@string/activity_translucent_blur",',
				'				"theme": "@style/Theme.Transparent",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.Animation": {',
				'				"name": ".app.Animation",',
				'				"label": "@string/activity_animation",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.SaveRestoreState": {',
				'				"name": ".app.SaveRestoreState",',
				'				"label": "@string/activity_save_restore",',
				'				"windowSoftInputMode": [',
				'					"stateVisible",',
				'					"adjustResize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.PersistentState": {',
				'				"name": ".app.PersistentState",',
				'				"label": "@string/activity_persistent",',
				'				"windowSoftInputMode": [',
				'					"stateVisible",',
				'					"adjustResize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ActivityRecreate": {',
				'				"name": ".app.ActivityRecreate",',
				'				"label": "@string/activity_recreate",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FinishAffinity": {',
				'				"name": ".app.FinishAffinity",',
				'				"label": "@string/activity_finish_affinity",',
				'				"taskAffinity": ":finishing",',
				'				"enabled": "@bool/atLeastJellyBean",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.SoftInputModes": {',
				'				"name": ".app.SoftInputModes",',
				'				"label": "@string/soft_input_modes",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ReceiveResult": {',
				'				"name": ".app.ReceiveResult",',
				'				"label": "@string/activity_receive_result",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.SendResult": {',
				'				"name": ".app.SendResult",',
				'				"theme": "@style/ThemeDialogWhenLarge"',
				'			},',
				'			".app.Forwarding": {',
				'				"name": ".app.Forwarding",',
				'				"label": "@string/activity_forwarding",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ForwardTarget": {',
				'				"name": ".app.ForwardTarget"',
				'			},',
				'			".app.RedirectEnter": {',
				'				"name": ".app.RedirectEnter",',
				'				"label": "@string/activity_redirect",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.RedirectMain": {',
				'				"name": ".app.RedirectMain"',
				'			},',
				'			".app.RedirectGetter": {',
				'				"name": ".app.RedirectGetter"',
				'			},',
				'			".app.CustomTitle": {',
				'				"name": ".app.CustomTitle",',
				'				"label": "@string/activity_custom_title",',
				'				"windowSoftInputMode": [',
				'					"stateVisible",',
				'					"adjustPan"',
				'				],',
				'				"theme": "@android:style/Theme",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ReorderOnLaunch": {',
				'				"name": ".app.ReorderOnLaunch",',
				'				"label": "@string/activity_reorder",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.RotationAnimation": {',
				'				"name": ".app.RotationAnimation",',
				'				"label": "@string/activity_rotation_animation",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ReorderTwo": {',
				'				"name": ".app.ReorderTwo"',
				'			},',
				'			".app.ReorderThree": {',
				'				"name": ".app.ReorderThree"',
				'			},',
				'			".app.ReorderFour": {',
				'				"name": ".app.ReorderFour"',
				'			},',
				'			".app.SetWallpaperActivity": {',
				'				"name": ".app.SetWallpaperActivity",',
				'				"label": "@string/activity_setwallpaper",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ScreenOrientation": {',
				'				"name": ".app.ScreenOrientation",',
				'				"label": "@string/activity_screen_orientation",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.PresentationActivity": {',
				'				"name": ".app.PresentationActivity",',
				'				"label": "@string/activity_presentation",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.PresentationWithMediaRouterActivity": {',
				'				"name": ".app.PresentationWithMediaRouterActivity",',
				'				"label": "@string/activity_presentation_with_media_router",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.SecureWindowActivity": {',
				'				"name": ".app.SecureWindowActivity",',
				'				"label": "@string/activity_secure_window",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.SecureDialogActivity": {',
				'				"name": ".app.SecureDialogActivity",',
				'				"label": "@string/activity_secure_dialog",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.SecureSurfaceViewActivity": {',
				'				"name": ".app.SecureSurfaceViewActivity",',
				'				"label": "@string/activity_secure_surface_view",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentAlertDialog": {',
				'				"name": ".app.FragmentAlertDialog",',
				'				"label": "@string/fragment_alert_dialog",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentArguments": {',
				'				"name": ".app.FragmentArguments",',
				'				"label": "@string/fragment_arguments",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentCustomAnimations": {',
				'				"name": ".app.FragmentCustomAnimations",',
				'				"label": "@string/fragment_custom_animations",',
				'				"enabled": "@bool/atLeastHoneycombMR2",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentHideShow": {',
				'				"name": ".app.FragmentHideShow",',
				'				"label": "@string/fragment_hide_show",',
				'				"windowSoftInputMode": [',
				'					"stateUnchanged"',
				'				],',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentContextMenu": {',
				'				"name": ".app.FragmentContextMenu",',
				'				"label": "@string/fragment_context_menu",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentDialog": {',
				'				"name": ".app.FragmentDialog",',
				'				"label": "@string/fragment_dialog",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentDialogOrActivity": {',
				'				"name": ".app.FragmentDialogOrActivity",',
				'				"label": "@string/fragment_dialog_or_activity",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentLayout": {',
				'				"name": ".app.FragmentLayout",',
				'				"label": "@string/fragment_layout",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentLayout$DetailsActivity": {',
				'				"name": ".app.FragmentLayout$DetailsActivity",',
				'				"enabled": "@bool/atLeastHoneycomb"',
				'			},',
				'			".app.FragmentListArray": {',
				'				"name": ".app.FragmentListArray",',
				'				"label": "@string/fragment_list_array",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentMenu": {',
				'				"name": ".app.FragmentMenu",',
				'				"label": "@string/fragment_menu",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentNestingTabs": {',
				'				"name": ".app.FragmentNestingTabs",',
				'				"label": "@string/fragment_nesting_tabs",',
				'				"enabled": "@bool/atLeastJellyBeanMR1",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentRetainInstance": {',
				'				"name": ".app.FragmentRetainInstance",',
				'				"label": "@string/fragment_retain_instance",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentReceiveResult": {',
				'				"name": ".app.FragmentReceiveResult",',
				'				"label": "@string/fragment_receive_result",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentStack": {',
				'				"name": ".app.FragmentStack",',
				'				"label": "@string/fragment_stack",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.FragmentTabs": {',
				'				"name": ".app.FragmentTabs",',
				'				"label": "@string/fragment_tabs",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.LoaderCursor": {',
				'				"name": ".app.LoaderCursor",',
				'				"label": "@string/loader_cursor",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.LoaderCustom": {',
				'				"name": ".app.LoaderCustom",',
				'				"label": "@string/loader_custom",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.LoaderThrottle": {',
				'				"name": ".app.LoaderThrottle",',
				'				"label": "@string/loader_throttle",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.LoaderRetained": {',
				'				"name": ".app.LoaderRetained",',
				'				"label": "@string/loader_retained",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.Intents": {',
				'				"name": ".app.Intents",',
				'				"label": "@string/activity_intents",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.IntentActivityFlags": {',
				'				"name": ".app.IntentActivityFlags",',
				'				"label": "@string/activity_intent_activity_flags",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.LocalServiceActivities$Controller": {',
				'				"name": ".app.LocalServiceActivities$Controller",',
				'				"label": "@string/activity_local_service_controller",',
				'				"launchMode": "singleTop",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.LocalServiceActivities$Binding": {',
				'				"name": ".app.LocalServiceActivities$Binding",',
				'				"label": "@string/activity_local_service_binding",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.MessengerServiceActivities$Binding": {',
				'				"name": ".app.MessengerServiceActivities$Binding",',
				'				"label": "@string/activity_messenger_service_binding",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.RemoteService$Controller": {',
				'				"name": ".app.RemoteService$Controller",',
				'				"label": "@string/activity_remote_service_controller",',
				'				"launchMode": "singleTop",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.RemoteService$Binding": {',
				'				"name": ".app.RemoteService$Binding",',
				'				"label": "@string/activity_remote_service_binding",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.RemoteService$BindingOptions": {',
				'				"name": ".app.RemoteService$BindingOptions",',
				'				"label": "@string/activity_remote_service_binding_options",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ServiceStartArguments$Controller": {',
				'				"name": ".app.ServiceStartArguments$Controller",',
				'				"label": "@string/activity_service_start_arguments_controller",',
				'				"launchMode": "singleTop",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ForegroundService$Controller": {',
				'				"name": ".app.ForegroundService$Controller",',
				'				"label": "@string/activity_foreground_service_controller",',
				'				"launchMode": "singleTop",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.IsolatedService$Controller": {',
				'				"name": ".app.IsolatedService$Controller",',
				'				"label": "@string/activity_isolated_service_controller",',
				'				"launchMode": "singleTop",',
				'				"enabled": "@bool/atLeastJellyBean",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.AlarmController": {',
				'				"name": ".app.AlarmController",',
				'				"label": "@string/activity_alarm_controller",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.AlarmService": {',
				'				"name": ".app.AlarmService",',
				'				"label": "@string/activity_alarm_service",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".accessibility.ClockBackActivity": {',
				'				"name": ".accessibility.ClockBackActivity",',
				'				"label": "@string/accessibility_service",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".accessibility.TaskListActivity": {',
				'				"name": ".accessibility.TaskListActivity",',
				'				"label": "@string/accessibility_query_window",',
				'				"enabled": "@bool/atLeastIceCreamSandwich",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".accessibility.CustomViewAccessibilityActivity": {',
				'				"name": ".accessibility.CustomViewAccessibilityActivity",',
				'				"label": "@string/accessibility_custom_view",',
				'				"enabled": "@bool/atLeastIceCreamSandwich",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.LocalSample": {',
				'				"name": ".app.LocalSample",',
				'				"label": "@string/activity_local_sample",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ContactsFilter": {',
				'				"name": ".app.ContactsFilter",',
				'				"label": "@string/activity_contacts_filter",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.NotifyWithText": {',
				'				"name": ".app.NotifyWithText",',
				'				"label": "App/Notification/NotifyWithText",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.IncomingMessage": {',
				'				"name": ".app.IncomingMessage",',
				'				"label": "App/Notification/IncomingMessage",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.IncomingMessageView": {',
				'				"name": ".app.IncomingMessageView",',
				'				"label": "App/Notification/IncomingMessageView"',
				'			},',
				'			".app.IncomingMessageInterstitial": {',
				'				"name": ".app.IncomingMessageInterstitial",',
				'				"label": "You have messages",',
				'				"theme": "@style/ThemeHoloDialog",',
				'				"launchMode": "singleTask",',
				'				"taskAffinity": "",',
				'				"excludeFromRecents": true',
				'			},',
				'			".app.NotificationDisplay": {',
				'				"name": ".app.NotificationDisplay",',
				'				"theme": "@style/Theme.Transparent",',
				'				"taskAffinity": "",',
				'				"excludeFromRecents": true,',
				'				"noHistory": true',
				'			},',
				'			".app.StatusBarNotifications": {',
				'				"name": ".app.StatusBarNotifications",',
				'				"label": "App/Notification/Status Bar",',
				'				"launchMode": "singleTop",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.NotifyingController": {',
				'				"name": ".app.NotifyingController",',
				'				"label": "App/Notification/Notifying Service Controller",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.AlertDialogSamples": {',
				'				"name": ".app.AlertDialogSamples",',
				'				"label": "@string/activity_alert_dialog",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.SearchInvoke": {',
				'				"name": ".app.SearchInvoke",',
				'				"label": "@string/search_invoke",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"android.app.default_searchable": {',
				'						"name": "android.app.default_searchable",',
				'						"value": ".app.SearchQueryResults"',
				'					}',
				'				}',
				'			},',
				'			".app.SearchQueryResults": {',
				'				"name": ".app.SearchQueryResults",',
				'				"label": "@string/search_query_results",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					},',
				'					{',
				'						"action": [',
				'							"android.intent.action.SEARCH"',
				'						],',
				'						"category": [',
				'							"android.intent.category.DEFAULT"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"android.app.searchable": {',
				'						"name": "android.app.searchable",',
				'						"resource": "@xml/searchable"',
				'					}',
				'				}',
				'			},',
				'			".app.LauncherShortcuts": {',
				'				"name": ".app.LauncherShortcuts",',
				'				"label": "@string/shortcuts",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.MenuInflateFromXml": {',
				'				"name": ".app.MenuInflateFromXml",',
				'				"label": "@string/menu_from_xml_title",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.DeviceAdminSample": {',
				'				"name": ".app.DeviceAdminSample",',
				'				"label": "@string/activity_sample_device_admin",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.VoiceRecognition": {',
				'				"name": ".app.VoiceRecognition",',
				'				"label": "@string/voice_recognition",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.TextToSpeechActivity": {',
				'				"name": ".app.TextToSpeechActivity",',
				'				"label": "@string/text_to_speech",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ActionBarMechanics": {',
				'				"name": ".app.ActionBarMechanics",',
				'				"label": "@string/action_bar_mechanics",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ActionBarUsage": {',
				'				"name": ".app.ActionBarUsage",',
				'				"label": "@string/action_bar_usage",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ActionBarDisplayOptions": {',
				'				"name": ".app.ActionBarDisplayOptions",',
				'				"label": "@string/action_bar_display_options",',
				'				"logo": "@drawable/apidemo_androidlogo",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ActionBarTabs": {',
				'				"name": ".app.ActionBarTabs",',
				'				"label": "@string/action_bar_tabs",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ActionBarSettingsActionProviderActivity": {',
				'				"name": ".app.ActionBarSettingsActionProviderActivity",',
				'				"label": "@string/action_bar_settings_action_provider",',
				'				"enabled": "@bool/atLeastIceCreamSandwich",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ActionBarShareActionProviderActivity": {',
				'				"name": ".app.ActionBarShareActionProviderActivity",',
				'				"label": "@string/action_bar_share_action_provider",',
				'				"enabled": "@bool/atLeastIceCreamSandwich",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".accessibility.AccessibilityNodeProviderActivity": {',
				'				"name": ".accessibility.AccessibilityNodeProviderActivity",',
				'				"label": "@string/accessibility_node_provider",',
				'				"enabled": "@bool/atLeastIceCreamSandwich",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.FragmentPreferences": {',
				'				"name": ".preference.FragmentPreferences",',
				'				"label": "@string/fragment_preferences",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.PreferenceWithHeaders": {',
				'				"name": ".preference.PreferenceWithHeaders",',
				'				"label": "@string/preference_with_headers",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.PreferencesFromXml": {',
				'				"name": ".preference.PreferencesFromXml",',
				'				"label": "@string/preferences_from_xml",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.PreferencesFromCode": {',
				'				"name": ".preference.PreferencesFromCode",',
				'				"label": "@string/preferences_from_code",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.AdvancedPreferences": {',
				'				"name": ".preference.AdvancedPreferences",',
				'				"label": "@string/advanced_preferences",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.LaunchingPreferences": {',
				'				"name": ".preference.LaunchingPreferences",',
				'				"label": "@string/launching_preferences",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.PreferenceDependencies": {',
				'				"name": ".preference.PreferenceDependencies",',
				'				"label": "@string/preference_dependencies",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.DefaultValues": {',
				'				"name": ".preference.DefaultValues",',
				'				"label": "@string/default_values",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".preference.SwitchPreference": {',
				'				"name": ".preference.SwitchPreference",',
				'				"label": "@string/switch_preference",',
				'				"enabled": "@bool/atLeastIceCreamSandwich",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ClipboardSample": {',
				'				"name": ".content.ClipboardSample",',
				'				"label": "@string/activity_clipboard",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ExternalStorage": {',
				'				"name": ".content.ExternalStorage",',
				'				"label": "@string/activity_external_storage",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE",',
				'							"android.intent.category.EMBED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.StyledText": {',
				'				"name": ".content.StyledText",',
				'				"label": "@string/activity_styled_text",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE",',
				'							"android.intent.category.EMBED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ResourcesLayoutReference": {',
				'				"name": ".content.ResourcesLayoutReference",',
				'				"label": "@string/activity_resources_layout_reference",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE",',
				'							"android.intent.category.EMBED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ResourcesWidthAndHeight": {',
				'				"name": ".content.ResourcesWidthAndHeight",',
				'				"label": "@string/activity_resources_width_and_height",',
				'				"enabled": "@bool/atLeastHoneycombMR2",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE",',
				'							"android.intent.category.EMBED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ResourcesSmallestWidth": {',
				'				"name": ".content.ResourcesSmallestWidth",',
				'				"label": "@string/activity_resources_smallest_width",',
				'				"enabled": "@bool/atLeastHoneycombMR2",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE",',
				'							"android.intent.category.EMBED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ReadAsset": {',
				'				"name": ".content.ReadAsset",',
				'				"label": "@string/activity_read_asset",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE",',
				'							"android.intent.category.EMBED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ResourcesSample": {',
				'				"name": ".content.ResourcesSample",',
				'				"label": "@string/activity_resources",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.PickContact": {',
				'				"name": ".content.PickContact",',
				'				"label": "@string/activity_pick_contact",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.ChangedContacts": {',
				'				"name": ".content.ChangedContacts",',
				'				"label": "@string/activity_changed_contact",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".content.InstallApk": {',
				'				"name": ".content.InstallApk",',
				'				"label": "@string/activity_install_apk",',
				'				"enabled": "@bool/atLeastHoneycombMR2",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".os.MorseCode": {',
				'				"name": ".os.MorseCode",',
				'				"label": "OS/Morse Code",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".os.Sensors": {',
				'				"name": ".os.Sensors",',
				'				"label": "OS/Sensors",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".os.TriggerSensors": {',
				'				"name": ".os.TriggerSensors",',
				'				"label": "OS/TriggerSensors",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".os.RotationVectorDemo": {',
				'				"name": ".os.RotationVectorDemo",',
				'				"label": "OS/Rotation Vector",',
				'				"screenOrientation": "nosensor",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".os.SmsMessagingDemo": {',
				'				"name": ".os.SmsMessagingDemo",',
				'				"label": "OS/SMS Messaging",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".os.SmsReceivedDialog": {',
				'				"name": ".os.SmsReceivedDialog",',
				'				"theme": "@android:style/Theme.Translucent.NoTitleBar",',
				'				"launchMode": "singleInstance"',
				'			},',
				'			".animation.AnimationLoading": {',
				'				"name": ".animation.AnimationLoading",',
				'				"label": "Animation/Loading",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.AnimationCloning": {',
				'				"name": ".animation.AnimationCloning",',
				'				"label": "Animation/Cloning",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.AnimationSeeking": {',
				'				"name": ".animation.AnimationSeeking",',
				'				"label": "Animation/Seeking",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.AnimatorEvents": {',
				'				"name": ".animation.AnimatorEvents",',
				'				"label": "Animation/Events",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.BouncingBalls": {',
				'				"name": ".animation.BouncingBalls",',
				'				"label": "Animation/Bouncing Balls",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.CustomEvaluator": {',
				'				"name": ".animation.CustomEvaluator",',
				'				"label": "Animation/Custom Evaluator",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.ListFlipper": {',
				'				"name": ".animation.ListFlipper",',
				'				"label": "Animation/View Flip",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.ReversingAnimation": {',
				'				"name": ".animation.ReversingAnimation",',
				'				"label": "Animation/Reversing",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.MultiPropertyAnimation": {',
				'				"name": ".animation.MultiPropertyAnimation",',
				'				"label": "Animation/Multiple Properties",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.LayoutAnimations": {',
				'				"name": ".animation.LayoutAnimations",',
				'				"label": "Animation/Layout Animations",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.LayoutAnimationsHideShow": {',
				'				"name": ".animation.LayoutAnimationsHideShow",',
				'				"label": "Animation/Hide-Show Animations",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.LayoutAnimationsByDefault": {',
				'				"name": ".animation.LayoutAnimationsByDefault",',
				'				"label": "Animation/Default Layout Animations",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".animation.Transition3d": {',
				'				"name": ".animation.Transition3d",',
				'				"label": "Views/Animation/3D Transition",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TextClockDemo": {',
				'				"name": ".view.TextClockDemo",',
				'				"label": "Views/TextClock",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ChronometerDemo": {',
				'				"name": ".view.ChronometerDemo",',
				'				"label": "Views/Chronometer",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.WebView1": {',
				'				"name": ".view.WebView1",',
				'				"label": "Views/WebView",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.RelativeLayout1": {',
				'				"name": ".view.RelativeLayout1",',
				'				"label": "Views/Layouts/RelativeLayout/1. Vertical",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.RelativeLayout2": {',
				'				"name": ".view.RelativeLayout2",',
				'				"label": "Views/Layouts/RelativeLayout/2. Simple Form",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout1": {',
				'				"name": ".view.LinearLayout1",',
				'				"label": "Views/Layouts/LinearLayout/01. Vertical",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout2": {',
				'				"name": ".view.LinearLayout2",',
				'				"label": "Views/Layouts/LinearLayout/02. Vertical (Fill Screen)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout3": {',
				'				"name": ".view.LinearLayout3",',
				'				"label": "Views/Layouts/LinearLayout/03. Vertical (Padded)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout4": {',
				'				"name": ".view.LinearLayout4",',
				'				"label": "Views/Layouts/LinearLayout/04. Horizontal",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout5": {',
				'				"name": ".view.LinearLayout5",',
				'				"label": "Views/Layouts/LinearLayout/05. Simple Form",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout6": {',
				'				"name": ".view.LinearLayout6",',
				'				"label": "Views/Layouts/LinearLayout/06. Uniform Size",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout7": {',
				'				"name": ".view.LinearLayout7",',
				'				"label": "Views/Layouts/LinearLayout/07. Fill Parent",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout8": {',
				'				"name": ".view.LinearLayout8",',
				'				"label": "Views/Layouts/LinearLayout/08. Gravity",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout9": {',
				'				"name": ".view.LinearLayout9",',
				'				"label": "Views/Layouts/LinearLayout/09. Layout Weight",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LinearLayout10": {',
				'				"name": ".view.LinearLayout10",',
				'				"label": "Views/Layouts/LinearLayout/10. Background Image",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.CustomLayoutActivity": {',
				'				"name": ".view.CustomLayoutActivity",',
				'				"label": "Views/Layouts/CustomLayout",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.RadioGroup1": {',
				'				"name": ".view.RadioGroup1",',
				'				"label": "Views/Radio Group",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ScrollView1": {',
				'				"name": ".view.ScrollView1",',
				'				"label": "Views/Layouts/ScrollView/1. Short",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ScrollView2": {',
				'				"name": ".view.ScrollView2",',
				'				"label": "Views/Layouts/ScrollView/2. Long",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.HorizontalScrollView1": {',
				'				"name": ".view.HorizontalScrollView1",',
				'				"label": "Views/Layouts/HorizontalScrollView",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Tabs1": {',
				'				"name": ".view.Tabs1",',
				'				"label": "Views/Tabs/1. Content By Id",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Tabs2": {',
				'				"name": ".view.Tabs2",',
				'				"label": "Views/Tabs/2. Content By Factory",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Tabs3": {',
				'				"name": ".view.Tabs3",',
				'				"label": "Views/Tabs/3. Content By Intent",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Tabs4": {',
				'				"name": ".view.Tabs4",',
				'				"label": "Views/Tabs/4. Non Holo theme",',
				'				"theme": "@android:style/Theme",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Tabs5": {',
				'				"name": ".view.Tabs5",',
				'				"label": "Views/Tabs/5. Scrollable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Tabs6": {',
				'				"name": ".view.Tabs6",',
				'				"label": "Views/Tabs/6. Right aligned",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.InternalSelectionScroll": {',
				'				"name": ".view.InternalSelectionScroll",',
				'				"label": "Views/Layouts/ScrollView/3. Internal Selection",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout1": {',
				'				"name": ".view.TableLayout1",',
				'				"label": "Views/Layouts/TableLayout/01. Basic",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout2": {',
				'				"name": ".view.TableLayout2",',
				'				"label": "Views/Layouts/TableLayout/02. Empty Cells",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout3": {',
				'				"name": ".view.TableLayout3",',
				'				"label": "Views/Layouts/TableLayout/03. Long Content",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout4": {',
				'				"name": ".view.TableLayout4",',
				'				"label": "Views/Layouts/TableLayout/04. Stretchable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout5": {',
				'				"name": ".view.TableLayout5",',
				'				"label": "Views/Layouts/TableLayout/05. Spanning and Stretchable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout6": {',
				'				"name": ".view.TableLayout6",',
				'				"label": "Views/Layouts/TableLayout/06. More Spanning and Stretchable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout7": {',
				'				"name": ".view.TableLayout7",',
				'				"label": "Views/Layouts/TableLayout/07. Column Collapse",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout8": {',
				'				"name": ".view.TableLayout8",',
				'				"label": "Views/Layouts/TableLayout/08. Toggle Stretch",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout9": {',
				'				"name": ".view.TableLayout9",',
				'				"label": "Views/Layouts/TableLayout/09. Toggle Shrink",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout10": {',
				'				"name": ".view.TableLayout10",',
				'				"label": "Views/Layouts/TableLayout/10. Simple Form",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout11": {',
				'				"name": ".view.TableLayout11",',
				'				"label": "Views/Layouts/TableLayout/11. Gravity",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TableLayout12": {',
				'				"name": ".view.TableLayout12",',
				'				"label": "Views/Layouts/TableLayout/12. Cell Spanning",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.GridLayout1": {',
				'				"name": ".view.GridLayout1",',
				'				"label": "Views/Layouts/GridLayout/1. Simple Form",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.GridLayout2": {',
				'				"name": ".view.GridLayout2",',
				'				"label": "Views/Layouts/GridLayout/2. Form (XML)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.GridLayout3": {',
				'				"name": ".view.GridLayout3",',
				'				"label": "Views/Layouts/GridLayout/3. Form (Java)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Baseline1": {',
				'				"name": ".view.Baseline1",',
				'				"label": "Views/Layouts/Baseline/1. Top",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Baseline2": {',
				'				"name": ".view.Baseline2",',
				'				"label": "Views/Layouts/Baseline/2. Bottom",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Baseline3": {',
				'				"name": ".view.Baseline3",',
				'				"label": "Views/Layouts/Baseline/3. Center",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Baseline4": {',
				'				"name": ".view.Baseline4",',
				'				"label": "Views/Layouts/Baseline/4. Everywhere",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Baseline6": {',
				'				"name": ".view.Baseline6",',
				'				"label": "Views/Layouts/Baseline/5. Multi-line",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Baseline7": {',
				'				"name": ".view.Baseline7",',
				'				"label": "Views/Layouts/Baseline/6. Relative",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.BaselineNested1": {',
				'				"name": ".view.BaselineNested1",',
				'				"label": "Views/Layouts/Baseline/Nested Example 1",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.BaselineNested2": {',
				'				"name": ".view.BaselineNested2",',
				'				"label": "Views/Layouts/Baseline/Nested Example 2",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.BaselineNested3": {',
				'				"name": ".view.BaselineNested3",',
				'				"label": "Views/Layouts/Baseline/Nested Example 3",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ScrollBar1": {',
				'				"name": ".view.ScrollBar1",',
				'				"label": "Views/ScrollBars/1. Basic",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ScrollBar2": {',
				'				"name": ".view.ScrollBar2",',
				'				"label": "Views/ScrollBars/2. Fancy",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ScrollBar3": {',
				'				"name": ".view.ScrollBar3",',
				'				"label": "Views/ScrollBars/3. Style",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Visibility1": {',
				'				"name": ".view.Visibility1",',
				'				"label": "Views/Visibility",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List1": {',
				'				"name": ".view.List1",',
				'				"label": "Views/Lists/01. Array",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List2": {',
				'				"name": ".view.List2",',
				'				"label": "Views/Lists/02. Cursor (People)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List3": {',
				'				"name": ".view.List3",',
				'				"label": "Views/Lists/03. Cursor (Phones)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List4": {',
				'				"name": ".view.List4",',
				'				"label": "Views/Lists/04. ListAdapter",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List5": {',
				'				"name": ".view.List5",',
				'				"label": "Views/Lists/05. Separators",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List6": {',
				'				"name": ".view.List6",',
				'				"label": "Views/Lists/06. ListAdapter Collapsed",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List7": {',
				'				"name": ".view.List7",',
				'				"label": "Views/Lists/07. Cursor (Phones)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List8": {',
				'				"name": ".view.List8",',
				'				"label": "Views/Lists/08. Photos",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List9": {',
				'				"name": ".view.List9",',
				'				"label": "Views/Lists/09. Array (Overlay)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List10": {',
				'				"name": ".view.List10",',
				'				"label": "Views/Lists/10. Single choice list",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List11": {',
				'				"name": ".view.List11",',
				'				"label": "Views/Lists/11. Multiple choice list",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List12": {',
				'				"name": ".view.List12",',
				'				"label": "Views/Lists/12. Transcript",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List13": {',
				'				"name": ".view.List13",',
				'				"label": "Views/Lists/13. Slow Adapter",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List14": {',
				'				"name": ".view.List14",',
				'				"label": "Views/Lists/14. Efficient Adapter",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List15": {',
				'				"name": ".view.List15",',
				'				"label": "Views/Lists/15. Selection Mode",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List16": {',
				'				"name": ".view.List16",',
				'				"label": "Views/Lists/16. Border selection mode",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.List17": {',
				'				"name": ".view.List17",',
				'				"label": "Views/Lists/17. Activate items",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ExpandableList1": {',
				'				"name": ".view.ExpandableList1",',
				'				"label": "Views/Expandable Lists/1. Custom Adapter",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ExpandableList2": {',
				'				"name": ".view.ExpandableList2",',
				'				"label": "Views/Expandable Lists/2. Cursor (People)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ExpandableList3": {',
				'				"name": ".view.ExpandableList3",',
				'				"label": "Views/Expandable Lists/3. Simple Adapter",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.CustomView1": {',
				'				"name": ".view.CustomView1",',
				'				"label": "Views/Custom",',
				'				"theme": "@android:style/Theme.Light",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Gallery1": {',
				'				"name": ".view.Gallery1",',
				'				"label": "Views/Gallery/1. Photos",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Gallery2": {',
				'				"name": ".view.Gallery2",',
				'				"label": "Views/Gallery/2. People",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Spinner1": {',
				'				"name": ".view.Spinner1",',
				'				"label": "Views/Spinner",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Grid1": {',
				'				"name": ".view.Grid1",',
				'				"label": "Views/Grid/1. Icon Grid",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Grid2": {',
				'				"name": ".view.Grid2",',
				'				"label": "Views/Grid/2. Photo Grid",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Grid3": {',
				'				"name": ".view.Grid3",',
				'				"label": "Views/Grid/3. Selection Mode",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ImageView1": {',
				'				"name": ".view.ImageView1",',
				'				"label": "Views/ImageView",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ImageSwitcher1": {',
				'				"name": ".view.ImageSwitcher1",',
				'				"label": "Views/ImageSwitcher",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.TextSwitcher1": {',
				'				"name": ".view.TextSwitcher1",',
				'				"label": "Views/TextSwitcher",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ImageButton1": {',
				'				"name": ".view.ImageButton1",',
				'				"label": "Views/ImageButton",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Animation1": {',
				'				"name": ".view.Animation1",',
				'				"label": "Views/Animation/Shake",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Animation2": {',
				'				"name": ".view.Animation2",',
				'				"label": "Views/Animation/Push",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Animation3": {',
				'				"name": ".view.Animation3",',
				'				"label": "Views/Animation/Interpolators",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LayoutAnimation1": {',
				'				"name": ".view.LayoutAnimation1",',
				'				"label": "Views/Layout Animation/1. Grid Fade",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LayoutAnimation2": {',
				'				"name": ".view.LayoutAnimation2",',
				'				"label": "Views/Layout Animation/2. List Cascade",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LayoutAnimation3": {',
				'				"name": ".view.LayoutAnimation3",',
				'				"label": "Views/Layout Animation/3. Reverse Order",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LayoutAnimation4": {',
				'				"name": ".view.LayoutAnimation4",',
				'				"label": "Views/Layout Animation/4. Randomize",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LayoutAnimation5": {',
				'				"name": ".view.LayoutAnimation5",',
				'				"label": "Views/Layout Animation/5. Grid Direction",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LayoutAnimation6": {',
				'				"name": ".view.LayoutAnimation6",',
				'				"label": "Views/Layout Animation/6. Wave Scale",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.LayoutAnimation7": {',
				'				"name": ".view.LayoutAnimation7",',
				'				"label": "Views/Layout Animation/7. Nested Animations",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Controls1": {',
				'				"name": ".view.Controls1",',
				'				"label": "Views/Controls/1. Light Theme",',
				'				"theme": "@android:style/Theme.Light",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Controls2": {',
				'				"name": ".view.Controls2",',
				'				"label": "Views/Controls/2. Dark Theme",',
				'				"theme": "@android:style/Theme",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Controls3": {',
				'				"name": ".view.Controls3",',
				'				"label": "Views/Controls/3. Holo Light Theme",',
				'				"theme": "@android:style/Theme.Holo.Light",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Controls4": {',
				'				"name": ".view.Controls4",',
				'				"label": "Views/Controls/4. Holo Dark Theme",',
				'				"theme": "@android:style/Theme.Holo",',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Controls5": {',
				'				"name": ".view.Controls5",',
				'				"label": "Views/Controls/5. Custom Theme",',
				'				"theme": "@style/CustomTheme",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Controls6": {',
				'				"name": ".view.Controls6",',
				'				"label": "Views/Controls/6. Holo or Old Theme",',
				'				"theme": "@style/ThemeHolo",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Buttons1": {',
				'				"name": ".view.Buttons1",',
				'				"label": "Views/Buttons",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.AutoComplete1": {',
				'				"name": ".view.AutoComplete1",',
				'				"label": "Views/Auto Complete/1. Screen Top",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.AutoComplete2": {',
				'				"name": ".view.AutoComplete2",',
				'				"label": "Views/Auto Complete/2. Screen Bottom",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.AutoComplete3": {',
				'				"name": ".view.AutoComplete3",',
				'				"label": "Views/Auto Complete/3. Scroll",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.AutoComplete4": {',
				'				"name": ".view.AutoComplete4",',
				'				"label": "Views/Auto Complete/4. Contacts",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.AutoComplete5": {',
				'				"name": ".view.AutoComplete5",',
				'				"label": "Views/Auto Complete/5. Contacts with Hint",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.AutoComplete6": {',
				'				"name": ".view.AutoComplete6",',
				'				"label": "Views/Auto Complete/6. Multiple items",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ProgressBar1": {',
				'				"name": ".view.ProgressBar1",',
				'				"label": "Views/Progress Bar/1. Incremental",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ProgressBar2": {',
				'				"name": ".view.ProgressBar2",',
				'				"label": "Views/Progress Bar/2. Smooth",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ProgressBar3": {',
				'				"name": ".view.ProgressBar3",',
				'				"label": "Views/Progress Bar/3. Dialogs",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ProgressBar4": {',
				'				"name": ".view.ProgressBar4",',
				'				"label": "Views/Progress Bar/4. In Title Bar",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.SeekBar1": {',
				'				"name": ".view.SeekBar1",',
				'				"label": "Views/Seek Bar",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.RatingBar1": {',
				'				"name": ".view.RatingBar1",',
				'				"label": "Views/Rating Bar",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Focus1": {',
				'				"name": ".view.Focus1",',
				'				"label": "Views/Focus/1. Vertical",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Focus2": {',
				'				"name": ".view.Focus2",',
				'				"label": "Views/Focus/2. Horizontal",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Focus3": {',
				'				"name": ".view.Focus3",',
				'				"label": "Views/Focus/3. Circular",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.InternalSelectionFocus": {',
				'				"name": ".view.InternalSelectionFocus",',
				'				"label": "Views/Focus/4. Internal Selection",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Focus5": {',
				'				"name": ".view.Focus5",',
				'				"label": "Views/Focus/5. Sequential (Tab Order)",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.WindowFocusObserver": {',
				'				"name": ".view.WindowFocusObserver",',
				'				"label": "Views/Focus/6. Window Focus Observer",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.DateWidgets1": {',
				'				"name": ".view.DateWidgets1",',
				'				"label": "Views/Date Widgets/1. Dialog",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.DateWidgets2": {',
				'				"name": ".view.DateWidgets2",',
				'				"label": "Views/Date Widgets/2. Inline",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.PopupMenu1": {',
				'				"name": ".view.PopupMenu1",',
				'				"label": "Views/Popup Menu",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.SearchViewActionBar": {',
				'				"name": ".view.SearchViewActionBar",',
				'				"label": "Views/Search View/Action Bar",',
				'				"theme": "@android:style/Theme.Holo",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"android.app.default_searchable": {',
				'						"name": "android.app.default_searchable",',
				'						"value": ".app.SearchQueryResults"',
				'					}',
				'				}',
				'			},',
				'			".view.SearchViewAlwaysVisible": {',
				'				"name": ".view.SearchViewAlwaysVisible",',
				'				"label": "Views/Search View/Always Expanded",',
				'				"theme": "@android:style/Theme.Holo",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"android.app.default_searchable": {',
				'						"name": "android.app.default_searchable",',
				'						"value": ".app.SearchQueryResults"',
				'					}',
				'				}',
				'			},',
				'			".view.SearchViewFilterMode": {',
				'				"name": ".view.SearchViewFilterMode",',
				'				"label": "Views/Search View/Filter",',
				'				"theme": "@android:style/Theme.Holo",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.RotatingButton": {',
				'				"name": ".view.RotatingButton",',
				'				"label": "Views/Rotating Button",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.SecureView": {',
				'				"name": ".view.SecureView",',
				'				"label": "Views/Secure View",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.SplitTouchView": {',
				'				"name": ".view.SplitTouchView",',
				'				"label": "Views/Splitting Touches across Views",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.DragAndDropDemo": {',
				'				"name": ".view.DragAndDropDemo",',
				'				"label": "Views/Drag and Drop",',
				'				"hardwareAccelerated": false,',
				'				"enabled": "@bool/atLeastHoneycomb",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.GameControllerInput": {',
				'				"name": ".view.GameControllerInput",',
				'				"label": "Views/Game Controller Input",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Hover": {',
				'				"name": ".view.Hover",',
				'				"label": "Views/Hover Events",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.SystemUIModes": {',
				'				"name": ".view.SystemUIModes",',
				'				"label": "Views/System UI Visibility/System UI Modes",',
				'				"uiOptions": "splitActionBarWhenNarrow",',
				'				"enabled": "@bool/atLeastJellyBeanMR2",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.SystemUIModesOverlay": {',
				'				"name": ".view.SystemUIModesOverlay",',
				'				"label": "Views/System UI Visibility/System UI Modes Overlay",',
				'				"uiOptions": "splitActionBarWhenNarrow",',
				'				"enabled": "@bool/atLeastJellyBean",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.ContentBrowserActivity": {',
				'				"name": ".view.ContentBrowserActivity",',
				'				"label": "Views/System UI Visibility/Content Browser",',
				'				"theme": "@android:style/Theme.Holo.Light.DarkActionBar",',
				'				"uiOptions": "splitActionBarWhenNarrow",',
				'				"enabled": "@bool/atLeastJellyBean",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.VideoPlayerActivity": {',
				'				"name": ".view.VideoPlayerActivity",',
				'				"label": "Views/System UI Visibility/Video Player",',
				'				"theme": "@android:style/Theme.Holo",',
				'				"uiOptions": "splitActionBarWhenNarrow",',
				'				"enabled": "@bool/atLeastJellyBean",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".view.Switches": {',
				'				"name": ".view.Switches",',
				'				"label": "Views/Switches",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.kube.Kube": {',
				'				"name": ".graphics.kube.Kube",',
				'				"label": "Graphics/OpenGL ES/Kube",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Compass": {',
				'				"name": ".graphics.Compass",',
				'				"label": "Graphics/Compass",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.CameraPreview": {',
				'				"name": ".graphics.CameraPreview",',
				'				"label": "Graphics/CameraPreview",',
				'				"screenOrientation": "landscape",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.CompressedTextureActivity": {',
				'				"name": ".graphics.CompressedTextureActivity",',
				'				"label": "Graphics/OpenGL ES/Compressed Texture",',
				'				"theme": "@android:style/Theme.NoTitleBar",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.CubeMapActivity": {',
				'				"name": ".graphics.CubeMapActivity",',
				'				"label": "Graphics/OpenGL ES/Cube Map",',
				'				"theme": "@android:style/Theme.NoTitleBar",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.FrameBufferObjectActivity": {',
				'				"name": ".graphics.FrameBufferObjectActivity",',
				'				"label": "Graphics/OpenGL ES/Frame Buffer Object",',
				'				"theme": "@android:style/Theme.NoTitleBar",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.GLSurfaceViewActivity": {',
				'				"name": ".graphics.GLSurfaceViewActivity",',
				'				"label": "Graphics/OpenGL ES/GLSurfaceView",',
				'				"theme": "@android:style/Theme.NoTitleBar",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.GLES20Activity": {',
				'				"name": ".graphics.GLES20Activity",',
				'				"label": "Graphics/OpenGL ES/OpenGL ES 2.0",',
				'				"theme": "@android:style/Theme.NoTitleBar",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.MatrixPaletteActivity": {',
				'				"name": ".graphics.MatrixPaletteActivity",',
				'				"label": "Graphics/OpenGL ES/Matrix Palette Skinning",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.TranslucentGLSurfaceViewActivity": {',
				'				"name": ".graphics.TranslucentGLSurfaceViewActivity",',
				'				"label": "Graphics/OpenGL ES/Translucent GLSurfaceView",',
				'				"theme": "@style/Theme.Translucent",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.TriangleActivity": {',
				'				"name": ".graphics.TriangleActivity",',
				'				"label": "Graphics/OpenGL ES/Textured Triangle",',
				'				"theme": "@android:style/Theme.Holo.Dialog",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.spritetext.SpriteTextActivity": {',
				'				"name": ".graphics.spritetext.SpriteTextActivity",',
				'				"label": "Graphics/OpenGL ES/Sprite Text",',
				'				"theme": "@android:style/Theme.NoTitleBar",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.TouchRotateActivity": {',
				'				"name": ".graphics.TouchRotateActivity",',
				'				"label": "Graphics/OpenGL ES/Touch Rotate",',
				'				"theme": "@android:style/Theme.NoTitleBar",',
				'				"configChanges": [',
				'					"keyboardHidden",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.PolyToPoly": {',
				'				"name": ".graphics.PolyToPoly",',
				'				"label": "Graphics/PolyToPoly",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.ScaleToFit": {',
				'				"name": ".graphics.ScaleToFit",',
				'				"label": "Graphics/ScaleToFit",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.RoundRects": {',
				'				"name": ".graphics.RoundRects",',
				'				"label": "Graphics/RoundRects",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.ShapeDrawable1": {',
				'				"name": ".graphics.ShapeDrawable1",',
				'				"label": "Graphics/Drawable/ShapeDrawable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.SurfaceViewOverlay": {',
				'				"name": ".graphics.SurfaceViewOverlay",',
				'				"label": "Graphics/SurfaceView Overlay",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.WindowSurface": {',
				'				"name": ".graphics.WindowSurface",',
				'				"label": "Graphics/Surface Window",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.TextAlign": {',
				'				"hardwareAccelerated": false,',
				'				"name": ".graphics.TextAlign",',
				'				"label": "Graphics/Text Align",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Arcs": {',
				'				"name": ".graphics.Arcs",',
				'				"label": "Graphics/Arcs",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Patterns": {',
				'				"name": ".graphics.Patterns",',
				'				"label": "Graphics/Patterns",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Clipping": {',
				'				"hardwareAccelerated": false,',
				'				"name": ".graphics.Clipping",',
				'				"label": "Graphics/Clipping",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Layers": {',
				'				"name": ".graphics.Layers",',
				'				"label": "Graphics/Layers",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.UnicodeChart": {',
				'				"hardwareAccelerated": false,',
				'				"name": ".graphics.UnicodeChart",',
				'				"label": "Graphics/UnicodeChart",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.PathFillTypes": {',
				'				"name": ".graphics.PathFillTypes",',
				'				"label": "Graphics/PathFillTypes",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Pictures": {',
				'				"hardwareAccelerated": false,',
				'				"name": ".graphics.Pictures",',
				'				"label": "Graphics/Pictures",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Vertices": {',
				'				"hardwareAccelerated": false,',
				'				"name": ".graphics.Vertices",',
				'				"label": "Graphics/Vertices",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.AnimateDrawables": {',
				'				"name": ".graphics.AnimateDrawables",',
				'				"label": "Graphics/AnimateDrawables",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.SensorTest": {',
				'				"name": ".graphics.SensorTest",',
				'				"label": "Graphics/SensorTest",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.AlphaBitmap": {',
				'				"name": ".graphics.AlphaBitmap",',
				'				"label": "Graphics/AlphaBitmap",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Regions": {',
				'				"name": ".graphics.Regions",',
				'				"label": "Graphics/Regions",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Sweep": {',
				'				"name": ".graphics.Sweep",',
				'				"label": "Graphics/Sweep",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.BitmapMesh": {',
				'				"name": ".graphics.BitmapMesh",',
				'				"label": "Graphics/BitmapMesh",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.MeasureText": {',
				'				"name": ".graphics.MeasureText",',
				'				"label": "Graphics/MeasureText",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Typefaces": {',
				'				"name": ".graphics.Typefaces",',
				'				"label": "Graphics/Typefaces",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.FingerPaint": {',
				'				"name": ".graphics.FingerPaint",',
				'				"label": "Graphics/FingerPaint",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.ColorMatrixSample": {',
				'				"name": ".graphics.ColorMatrixSample",',
				'				"label": "Graphics/ColorMatrix",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.BitmapDecode": {',
				'				"hardwareAccelerated": false,',
				'				"name": ".graphics.BitmapDecode",',
				'				"label": "Graphics/BitmapDecode",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.ColorFilters": {',
				'				"name": ".graphics.ColorFilters",',
				'				"label": "Graphics/ColorFilters",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.CreateBitmap": {',
				'				"name": ".graphics.CreateBitmap",',
				'				"label": "Graphics/CreateBitmap",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.DrawPoints": {',
				'				"hardwareAccelerated": false,',
				'				"name": ".graphics.DrawPoints",',
				'				"label": "Graphics/Points",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.TouchPaint": {',
				'				"name": ".graphics.TouchPaint",',
				'				"label": "Graphics/Touch Paint",',
				'				"theme": "@style/Theme.Black",',
				'				"configChanges": [',
				'					"keyboard",',
				'					"keyboardHidden",',
				'					"navigation",',
				'					"orientation",',
				'					"screenLayout",',
				'					"screenSize",',
				'					"smallestScreenSize"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.BitmapPixels": {',
				'				"name": ".graphics.BitmapPixels",',
				'				"label": "Graphics/BitmapPixels",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.Xfermodes": {',
				'				"name": ".graphics.Xfermodes",',
				'				"label": "Graphics/Xfermodes",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.PathEffects": {',
				'				"name": ".graphics.PathEffects",',
				'				"label": "Graphics/PathEffects",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.GradientDrawable1": {',
				'				"name": ".graphics.GradientDrawable1",',
				'				"label": "Graphics/Drawable/GradientDrawable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.PurgeableBitmap": {',
				'				"name": ".graphics.PurgeableBitmap",',
				'				"label": "Graphics/PurgeableBitmap/NonPurgeable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".graphics.DensityActivity": {',
				'				"name": ".graphics.DensityActivity",',
				'				"label": "Graphics/Density",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".media.MediaPlayerDemo": {',
				'				"name": ".media.MediaPlayerDemo",',
				'				"label": "Media/MediaPlayer",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".media.MediaPlayerDemo_Audio": {',
				'				"name": ".media.MediaPlayerDemo_Audio",',
				'				"label": "Media/MediaPlayer",',
				'				"intent-filter": [',
				'					{',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".media.MediaPlayerDemo_Video": {',
				'				"name": ".media.MediaPlayerDemo_Video",',
				'				"label": "Media/MediaPlayer",',
				'				"intent-filter": [',
				'					{',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".media.VideoViewDemo": {',
				'				"name": ".media.VideoViewDemo",',
				'				"label": "Media/VideoView",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".media.AudioFxDemo": {',
				'				"name": ".media.AudioFxDemo",',
				'				"label": "Media/AudioFx",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".appwidget.ExampleAppWidgetConfigure": {',
				'				"name": ".appwidget.ExampleAppWidgetConfigure",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.appwidget.action.APPWIDGET_CONFIGURE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".text.Link": {',
				'				"name": ".text.Link",',
				'				"label": "Text/Linkify",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".text.Marquee": {',
				'				"name": ".text.Marquee",',
				'				"label": "Text/Marquee",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".text.LogTextBox1": {',
				'				"name": ".text.LogTextBox1",',
				'				"label": "Text/LogTextBox",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".nfc.ForegroundDispatch": {',
				'				"name": ".nfc.ForegroundDispatch",',
				'				"label": "NFC/ForegroundDispatch",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".nfc.TechFilter": {',
				'				"name": ".nfc.TechFilter",',
				'				"label": "NFC/TechFilter",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					},',
				'					{',
				'						"action": [',
				'							"android.nfc.action.TECH_DISCOVERED"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"android.nfc.action.TECH_DISCOVERED": {',
				'						"name": "android.nfc.action.TECH_DISCOVERED",',
				'						"resource": "@xml/filter_nfc"',
				'					}',
				'				}',
				'			},',
				'			".nfc.ForegroundNdefPush": {',
				'				"name": ".nfc.ForegroundNdefPush",',
				'				"label": "NFC/ForegroundNdefPush",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".security.KeyStoreUsage": {',
				'				"name": ".security.KeyStoreUsage",',
				'				"label": "Security/KeyStore",',
				'				"windowSoftInputMode": [',
				'					"adjustPan"',
				'				],',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			}',
				'		},',
				'		"provider": {',
				'			".app.LoaderThrottle$SimpleProvider": {',
				'				"name": ".app.LoaderThrottle$SimpleProvider",',
				'				"authorities": "com.example.android.apis.app.LoaderThrottle",',
				'				"enabled": "@bool/atLeastHoneycomb"',
				'			},',
				'			".app.SearchSuggestionSampleProvider": {',
				'				"name": ".app.SearchSuggestionSampleProvider",',
				'				"authorities": "com.example.android.apis.SuggestionProvider"',
				'			},',
				'			".content.FileProvider": {',
				'				"name": ".content.FileProvider",',
				'				"authorities": "com.example.android.apis.content.FileProvider",',
				'				"enabled": "@bool/atLeastHoneycombMR2"',
				'			}',
				'		},',
				'		"service": {',
				'			".app.LocalService": {',
				'				"name": ".app.LocalService",',
				'				"stopWithTask": true',
				'			},',
				'			".app.MessengerService": {',
				'				"name": ".app.MessengerService",',
				'				"process": ":remote"',
				'			},',
				'			".app.RemoteService": {',
				'				"name": ".app.RemoteService",',
				'				"process": ":remote",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"com.example.android.apis.app.IRemoteService",',
				'							"com.example.android.apis.app.ISecondary",',
				'							"com.example.android.apis.app.REMOTE_SERVICE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.ServiceStartArguments": {',
				'				"name": ".app.ServiceStartArguments"',
				'			},',
				'			".app.ForegroundService": {',
				'				"name": ".app.ForegroundService"',
				'			},',
				'			".app.IsolatedService": {',
				'				"name": ".app.IsolatedService",',
				'				"isolatedProcess": true,',
				'				"enabled": "@bool/atLeastJellyBean"',
				'			},',
				'			".app.IsolatedService2": {',
				'				"name": ".app.IsolatedService2",',
				'				"isolatedProcess": true,',
				'				"enabled": "@bool/atLeastJellyBean"',
				'			},',
				'			".app.AlarmService_Service": {',
				'				"name": ".app.AlarmService_Service",',
				'				"process": ":remote"',
				'			},',
				'			".accessibility.ClockBackService": {',
				'				"name": ".accessibility.ClockBackService",',
				'				"label": "@string/accessibility_service_label",',
				'				"permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.accessibilityservice.AccessibilityService"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".accessibility.TaskBackService": {',
				'				"name": ".accessibility.TaskBackService",',
				'				"label": "@string/accessibility_query_window_label",',
				'				"enabled": "@bool/atLeastIceCreamSandwich",',
				'				"permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.accessibilityservice.AccessibilityService"',
				'						]',
				'					}',
				'				],',
				'				"meta-data": {',
				'					"android.accessibilityservice": {',
				'						"name": "android.accessibilityservice",',
				'						"resource": "@xml/taskbackconfig"',
				'					}',
				'				}',
				'			},',
				'			".app.NotifyingService": {',
				'				"name": ".app.NotifyingService"',
				'			}',
				'		},',
				'		"receiver": {',
				'			".app.OneShotAlarm": {',
				'				"name": ".app.OneShotAlarm",',
				'				"process": ":remote"',
				'			},',
				'			".app.RepeatingAlarm": {',
				'				"name": ".app.RepeatingAlarm",',
				'				"process": ":remote"',
				'			},',
				'			".app.DeviceAdminSample$DeviceAdminSampleReceiver": {',
				'				"name": ".app.DeviceAdminSample$DeviceAdminSampleReceiver",',
				'				"label": "@string/sample_device_admin",',
				'				"description": "@string/sample_device_admin_description",',
				'				"permission": "android.permission.BIND_DEVICE_ADMIN",',
				'				"meta-data": {',
				'					"android.app.device_admin": {',
				'						"name": "android.app.device_admin",',
				'						"resource": "@xml/device_admin_sample"',
				'					}',
				'				},',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.app.action.DEVICE_ADMIN_ENABLED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".app.AppUpdateReceiver": {',
				'				"name": ".app.AppUpdateReceiver",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MY_PACKAGE_REPLACED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".os.SmsMessageReceiver": {',
				'				"name": ".os.SmsMessageReceiver",',
				'				"enabled": false,',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.provider.Telephony.SMS_RECEIVED"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".appwidget.ExampleAppWidgetProvider": {',
				'				"name": ".appwidget.ExampleAppWidgetProvider",',
				'				"meta-data": {',
				'					"android.appwidget.provider": {',
				'						"name": "android.appwidget.provider",',
				'						"resource": "@xml/appwidget_provider"',
				'					}',
				'				},',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.appwidget.action.APPWIDGET_UPDATE"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			".appwidget.ExampleBroadcastReceiver": {',
				'				"name": ".appwidget.ExampleBroadcastReceiver",',
				'				"enabled": false,',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.ACTION_TIMEZONE_CHANGED",',
				'							"android.intent.ACTION_TIME"',
				'						]',
				'					}',
				'				]',
				'			}',
				'		},',
				'		"activity-alias": {',
				'			".app.CreateShortcuts": {',
				'				"name": ".app.CreateShortcuts",',
				'				"targetActivity": ".app.LauncherShortcuts",',
				'				"label": "@string/sample_shortcuts",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.CREATE_SHORTCUT"',
				'						],',
				'						"category": [',
				'							"android.intent.category.DEFAULT"',
				'						]',
				'					}',
				'				]',
				'			},',
				'			"Purgeable": {',
				'				"targetActivity": ".graphics.PurgeableBitmap",',
				'				"name": "Purgeable",',
				'				"label": "Graphics/PurgeableBitmap/Purgeable",',
				'				"intent-filter": [',
				'					{',
				'						"action": [',
				'							"android.intent.action.MAIN"',
				'						],',
				'						"category": [',
				'							"android.intent.category.SAMPLE_CODE"',
				'						]',
				'					}',
				'				]',
				'			}',
				'		}',
				'	},',
				'	"instrumentation": {',
				'		".app.LocalSampleInstrumentation": {',
				'			"name": ".app.LocalSampleInstrumentation",',
				'			"targetPackage": "com.example.android.apis",',
				'			"label": "Local Sample"',
				'		}',
				'	}',
				'}'
			].join('\n'));
		});

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.android.apis">',
				'	<uses-permission android:name="android.permission.READ_CONTACTS"/>',
				'	<uses-permission android:name="android.permission.WRITE_CONTACTS"/>',
				'	<uses-permission android:name="android.permission.VIBRATE"/>',
				'	<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>',
				'	<uses-permission android:name="android.permission.INTERNET"/>',
				'	<uses-permission android:name="android.permission.SET_WALLPAPER"/>',
				'	<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>',
				'	<uses-permission android:name="android.permission.SEND_SMS"/>',
				'	<uses-permission android:name="android.permission.RECEIVE_SMS"/>',
				'	<uses-permission android:name="android.permission.NFC"/>',
				'	<uses-permission android:name="android.permission.RECORD_AUDIO"/>',
				'	<uses-permission android:name="android.permission.CAMERA"/>',
				'	<uses-sdk android:minSdkVersion="4" android:targetSdkVersion="17"/>',
				'	<uses-feature android:name="android.hardware.camera"/>',
				'	<uses-feature android:name="android.hardware.camera.autofocus" android:required="false"/>',
				'	<application android:name="ApiDemosApplication" android:label="@string/activity_sample_code" android:icon="@drawable/app_sample_code" android:hardwareAccelerated="true" android:supportsRtl="true">',
				'		<uses-library android:name="com.example.will.never.exist" android:required="false"/>',
				'		<activity android:name="ApiDemos">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.DEFAULT"/>',
				'				<category android:name="android.intent.category.LAUNCHER"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.HelloWorld" android:label="@string/activity_hello_world">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.DialogActivity" android:label="@string/activity_dialog" android:theme="@android:style/Theme.Holo.Dialog">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.CustomDialogActivity" android:label="@string/activity_custom_dialog" android:theme="@style/Theme.CustomDialog">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.OverscanActivity" android:label="@string/activity_overscan" android:theme="@android:style/Theme.Holo.NoActionBar.Overscan" android:enabled="@bool/atLeastJellyBeanMR2">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.QuickContactsDemo" android:label="@string/quick_contacts_demo">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.WallpaperActivity" android:label="@string/activity_wallpaper" android:theme="@style/Theme.Wallpaper">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.TranslucentActivity" android:label="@string/activity_translucent" android:theme="@style/Theme.Translucent">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.TranslucentBlurActivity" android:label="@string/activity_translucent_blur" android:theme="@style/Theme.Transparent">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.Animation" android:label="@string/activity_animation">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.SaveRestoreState" android:label="@string/activity_save_restore" android:windowSoftInputMode="stateVisible|adjustResize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.PersistentState" android:label="@string/activity_persistent" android:windowSoftInputMode="stateVisible|adjustResize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ActivityRecreate" android:label="@string/activity_recreate" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FinishAffinity" android:label="@string/activity_finish_affinity" android:taskAffinity=":finishing" android:enabled="@bool/atLeastJellyBean">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.SoftInputModes" android:label="@string/soft_input_modes">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ReceiveResult" android:label="@string/activity_receive_result">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.SendResult" android:theme="@style/ThemeDialogWhenLarge"/>',
				'		<activity android:name=".app.Forwarding" android:label="@string/activity_forwarding">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ForwardTarget"/>',
				'		<activity android:name=".app.RedirectEnter" android:label="@string/activity_redirect">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.RedirectMain"/>',
				'		<activity android:name=".app.RedirectGetter"/>',
				'		<activity android:name=".app.CustomTitle" android:label="@string/activity_custom_title" android:windowSoftInputMode="stateVisible|adjustPan" android:theme="@android:style/Theme">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ReorderOnLaunch" android:label="@string/activity_reorder">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.RotationAnimation" android:label="@string/activity_rotation_animation">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ReorderTwo"/>',
				'		<activity android:name=".app.ReorderThree"/>',
				'		<activity android:name=".app.ReorderFour"/>',
				'		<activity android:name=".app.SetWallpaperActivity" android:label="@string/activity_setwallpaper">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ScreenOrientation" android:label="@string/activity_screen_orientation">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.PresentationActivity" android:label="@string/activity_presentation">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.PresentationWithMediaRouterActivity" android:label="@string/activity_presentation_with_media_router">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.SecureWindowActivity" android:label="@string/activity_secure_window">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.SecureDialogActivity" android:label="@string/activity_secure_dialog">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.SecureSurfaceViewActivity" android:label="@string/activity_secure_surface_view">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentAlertDialog" android:label="@string/fragment_alert_dialog" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentArguments" android:label="@string/fragment_arguments" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentCustomAnimations" android:label="@string/fragment_custom_animations" android:enabled="@bool/atLeastHoneycombMR2">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentHideShow" android:label="@string/fragment_hide_show" android:windowSoftInputMode="stateUnchanged" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentContextMenu" android:label="@string/fragment_context_menu" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentDialog" android:label="@string/fragment_dialog" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentDialogOrActivity" android:label="@string/fragment_dialog_or_activity" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentLayout" android:label="@string/fragment_layout" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentLayout$DetailsActivity" android:enabled="@bool/atLeastHoneycomb"/>',
				'		<activity android:name=".app.FragmentListArray" android:label="@string/fragment_list_array" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentMenu" android:label="@string/fragment_menu" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentNestingTabs" android:label="@string/fragment_nesting_tabs" android:enabled="@bool/atLeastJellyBeanMR1">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentRetainInstance" android:label="@string/fragment_retain_instance" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentReceiveResult" android:label="@string/fragment_receive_result" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentStack" android:label="@string/fragment_stack" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.FragmentTabs" android:label="@string/fragment_tabs" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.LoaderCursor" android:label="@string/loader_cursor" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.LoaderCustom" android:label="@string/loader_custom" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.LoaderThrottle" android:label="@string/loader_throttle" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.LoaderRetained" android:label="@string/loader_retained" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.Intents" android:label="@string/activity_intents">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.IntentActivityFlags" android:label="@string/activity_intent_activity_flags">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.LocalServiceActivities$Controller" android:label="@string/activity_local_service_controller" android:launchMode="singleTop">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.LocalServiceActivities$Binding" android:label="@string/activity_local_service_binding">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.MessengerServiceActivities$Binding" android:label="@string/activity_messenger_service_binding">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.RemoteService$Controller" android:label="@string/activity_remote_service_controller" android:launchMode="singleTop">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.RemoteService$Binding" android:label="@string/activity_remote_service_binding">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.RemoteService$BindingOptions" android:label="@string/activity_remote_service_binding_options">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ServiceStartArguments$Controller" android:label="@string/activity_service_start_arguments_controller" android:launchMode="singleTop">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ForegroundService$Controller" android:label="@string/activity_foreground_service_controller" android:launchMode="singleTop">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.IsolatedService$Controller" android:label="@string/activity_isolated_service_controller" android:launchMode="singleTop" android:enabled="@bool/atLeastJellyBean">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.AlarmController" android:label="@string/activity_alarm_controller">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.AlarmService" android:label="@string/activity_alarm_service">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".accessibility.ClockBackActivity" android:label="@string/accessibility_service">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".accessibility.TaskListActivity" android:label="@string/accessibility_query_window" android:enabled="@bool/atLeastIceCreamSandwich">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".accessibility.CustomViewAccessibilityActivity" android:label="@string/accessibility_custom_view" android:enabled="@bool/atLeastIceCreamSandwich">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.LocalSample" android:label="@string/activity_local_sample">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ContactsFilter" android:label="@string/activity_contacts_filter">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.NotifyWithText" android:label="App/Notification/NotifyWithText">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.IncomingMessage" android:label="App/Notification/IncomingMessage">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.IncomingMessageView" android:label="App/Notification/IncomingMessageView"/>',
				'		<activity android:name=".app.IncomingMessageInterstitial" android:label="You have messages" android:theme="@style/ThemeHoloDialog" android:launchMode="singleTask" android:taskAffinity="" android:excludeFromRecents="true"/>',
				'		<activity android:name=".app.NotificationDisplay" android:theme="@style/Theme.Transparent" android:taskAffinity="" android:excludeFromRecents="true" android:noHistory="true"/>',
				'		<activity android:name=".app.StatusBarNotifications" android:label="App/Notification/Status Bar" android:launchMode="singleTop">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.NotifyingController" android:label="App/Notification/Notifying Service Controller">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.AlertDialogSamples" android:label="@string/activity_alert_dialog">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.SearchInvoke" android:label="@string/search_invoke">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'			<meta-data android:name="android.app.default_searchable" android:value=".app.SearchQueryResults"/>',
				'		</activity>',
				'		<activity android:name=".app.SearchQueryResults" android:label="@string/search_query_results">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.SEARCH"/>',
				'				<category android:name="android.intent.category.DEFAULT"/>',
				'			</intent-filter>',
				'			<meta-data android:name="android.app.searchable" android:resource="@xml/searchable"/>',
				'		</activity>',
				'		<activity android:name=".app.LauncherShortcuts" android:label="@string/shortcuts">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.MenuInflateFromXml" android:label="@string/menu_from_xml_title">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.DeviceAdminSample" android:label="@string/activity_sample_device_admin">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.VoiceRecognition" android:label="@string/voice_recognition">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.TextToSpeechActivity" android:label="@string/text_to_speech">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ActionBarMechanics" android:label="@string/action_bar_mechanics" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ActionBarUsage" android:label="@string/action_bar_usage" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ActionBarDisplayOptions" android:label="@string/action_bar_display_options" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ActionBarTabs" android:label="@string/action_bar_tabs" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ActionBarSettingsActionProviderActivity" android:label="@string/action_bar_settings_action_provider" android:enabled="@bool/atLeastIceCreamSandwich">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".app.ActionBarShareActionProviderActivity" android:label="@string/action_bar_share_action_provider" android:enabled="@bool/atLeastIceCreamSandwich">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".accessibility.AccessibilityNodeProviderActivity" android:label="@string/accessibility_node_provider" android:enabled="@bool/atLeastIceCreamSandwich">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.FragmentPreferences" android:label="@string/fragment_preferences" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.PreferenceWithHeaders" android:label="@string/preference_with_headers" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.PreferencesFromXml" android:label="@string/preferences_from_xml">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.PreferencesFromCode" android:label="@string/preferences_from_code">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.AdvancedPreferences" android:label="@string/advanced_preferences">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.LaunchingPreferences" android:label="@string/launching_preferences">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.PreferenceDependencies" android:label="@string/preference_dependencies">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.DefaultValues" android:label="@string/default_values">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".preference.SwitchPreference" android:label="@string/switch_preference" android:enabled="@bool/atLeastIceCreamSandwich">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ClipboardSample" android:label="@string/activity_clipboard" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ExternalStorage" android:label="@string/activity_external_storage">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'				<category android:name="android.intent.category.EMBED"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.StyledText" android:label="@string/activity_styled_text">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'				<category android:name="android.intent.category.EMBED"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ResourcesLayoutReference" android:label="@string/activity_resources_layout_reference">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'				<category android:name="android.intent.category.EMBED"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ResourcesWidthAndHeight" android:label="@string/activity_resources_width_and_height" android:enabled="@bool/atLeastHoneycombMR2">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'				<category android:name="android.intent.category.EMBED"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ResourcesSmallestWidth" android:label="@string/activity_resources_smallest_width" android:enabled="@bool/atLeastHoneycombMR2">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'				<category android:name="android.intent.category.EMBED"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ReadAsset" android:label="@string/activity_read_asset">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'				<category android:name="android.intent.category.EMBED"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ResourcesSample" android:label="@string/activity_resources">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.PickContact" android:label="@string/activity_pick_contact">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.ChangedContacts" android:label="@string/activity_changed_contact">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".content.InstallApk" android:label="@string/activity_install_apk" android:enabled="@bool/atLeastHoneycombMR2">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".os.MorseCode" android:label="OS/Morse Code">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".os.Sensors" android:label="OS/Sensors">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".os.TriggerSensors" android:label="OS/TriggerSensors">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".os.RotationVectorDemo" android:label="OS/Rotation Vector" android:screenOrientation="nosensor">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".os.SmsMessagingDemo" android:label="OS/SMS Messaging">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".os.SmsReceivedDialog" android:theme="@android:style/Theme.Translucent.NoTitleBar" android:launchMode="singleInstance"/>',
				'		<activity android:name=".animation.AnimationLoading" android:label="Animation/Loading" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.AnimationCloning" android:label="Animation/Cloning" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.AnimationSeeking" android:label="Animation/Seeking" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.AnimatorEvents" android:label="Animation/Events" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.BouncingBalls" android:label="Animation/Bouncing Balls" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.CustomEvaluator" android:label="Animation/Custom Evaluator" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.ListFlipper" android:label="Animation/View Flip" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.ReversingAnimation" android:label="Animation/Reversing" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.MultiPropertyAnimation" android:label="Animation/Multiple Properties" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.LayoutAnimations" android:label="Animation/Layout Animations" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.LayoutAnimationsHideShow" android:label="Animation/Hide-Show Animations" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.LayoutAnimationsByDefault" android:label="Animation/Default Layout Animations" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".animation.Transition3d" android:label="Views/Animation/3D Transition">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TextClockDemo" android:label="Views/TextClock">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ChronometerDemo" android:label="Views/Chronometer">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.WebView1" android:label="Views/WebView">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.RelativeLayout1" android:label="Views/Layouts/RelativeLayout/1. Vertical">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.RelativeLayout2" android:label="Views/Layouts/RelativeLayout/2. Simple Form">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout1" android:label="Views/Layouts/LinearLayout/01. Vertical">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout2" android:label="Views/Layouts/LinearLayout/02. Vertical (Fill Screen)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout3" android:label="Views/Layouts/LinearLayout/03. Vertical (Padded)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout4" android:label="Views/Layouts/LinearLayout/04. Horizontal">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout5" android:label="Views/Layouts/LinearLayout/05. Simple Form">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout6" android:label="Views/Layouts/LinearLayout/06. Uniform Size">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout7" android:label="Views/Layouts/LinearLayout/07. Fill Parent">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout8" android:label="Views/Layouts/LinearLayout/08. Gravity">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout9" android:label="Views/Layouts/LinearLayout/09. Layout Weight">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LinearLayout10" android:label="Views/Layouts/LinearLayout/10. Background Image">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.CustomLayoutActivity" android:label="Views/Layouts/CustomLayout">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.RadioGroup1" android:label="Views/Radio Group">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ScrollView1" android:label="Views/Layouts/ScrollView/1. Short">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ScrollView2" android:label="Views/Layouts/ScrollView/2. Long">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.HorizontalScrollView1" android:label="Views/Layouts/HorizontalScrollView">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Tabs1" android:label="Views/Tabs/1. Content By Id">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Tabs2" android:label="Views/Tabs/2. Content By Factory">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Tabs3" android:label="Views/Tabs/3. Content By Intent">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Tabs4" android:label="Views/Tabs/4. Non Holo theme" android:theme="@android:style/Theme">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Tabs5" android:label="Views/Tabs/5. Scrollable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Tabs6" android:label="Views/Tabs/6. Right aligned">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.InternalSelectionScroll" android:label="Views/Layouts/ScrollView/3. Internal Selection">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout1" android:label="Views/Layouts/TableLayout/01. Basic">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout2" android:label="Views/Layouts/TableLayout/02. Empty Cells">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout3" android:label="Views/Layouts/TableLayout/03. Long Content">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout4" android:label="Views/Layouts/TableLayout/04. Stretchable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout5" android:label="Views/Layouts/TableLayout/05. Spanning and Stretchable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout6" android:label="Views/Layouts/TableLayout/06. More Spanning and Stretchable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout7" android:label="Views/Layouts/TableLayout/07. Column Collapse">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout8" android:label="Views/Layouts/TableLayout/08. Toggle Stretch">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout9" android:label="Views/Layouts/TableLayout/09. Toggle Shrink">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout10" android:label="Views/Layouts/TableLayout/10. Simple Form">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout11" android:label="Views/Layouts/TableLayout/11. Gravity">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TableLayout12" android:label="Views/Layouts/TableLayout/12. Cell Spanning">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.GridLayout1" android:label="Views/Layouts/GridLayout/1. Simple Form">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.GridLayout2" android:label="Views/Layouts/GridLayout/2. Form (XML)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.GridLayout3" android:label="Views/Layouts/GridLayout/3. Form (Java)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Baseline1" android:label="Views/Layouts/Baseline/1. Top">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Baseline2" android:label="Views/Layouts/Baseline/2. Bottom">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Baseline3" android:label="Views/Layouts/Baseline/3. Center">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Baseline4" android:label="Views/Layouts/Baseline/4. Everywhere">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Baseline6" android:label="Views/Layouts/Baseline/5. Multi-line">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Baseline7" android:label="Views/Layouts/Baseline/6. Relative">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.BaselineNested1" android:label="Views/Layouts/Baseline/Nested Example 1">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.BaselineNested2" android:label="Views/Layouts/Baseline/Nested Example 2">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.BaselineNested3" android:label="Views/Layouts/Baseline/Nested Example 3">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ScrollBar1" android:label="Views/ScrollBars/1. Basic">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ScrollBar2" android:label="Views/ScrollBars/2. Fancy">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ScrollBar3" android:label="Views/ScrollBars/3. Style">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Visibility1" android:label="Views/Visibility">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List1" android:label="Views/Lists/01. Array">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List2" android:label="Views/Lists/02. Cursor (People)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List3" android:label="Views/Lists/03. Cursor (Phones)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List4" android:label="Views/Lists/04. ListAdapter">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List5" android:label="Views/Lists/05. Separators">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List6" android:label="Views/Lists/06. ListAdapter Collapsed">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List7" android:label="Views/Lists/07. Cursor (Phones)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List8" android:label="Views/Lists/08. Photos">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List9" android:label="Views/Lists/09. Array (Overlay)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List10" android:label="Views/Lists/10. Single choice list">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List11" android:label="Views/Lists/11. Multiple choice list">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List12" android:label="Views/Lists/12. Transcript">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List13" android:label="Views/Lists/13. Slow Adapter">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List14" android:label="Views/Lists/14. Efficient Adapter">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List15" android:label="Views/Lists/15. Selection Mode">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List16" android:label="Views/Lists/16. Border selection mode">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.List17" android:label="Views/Lists/17. Activate items">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ExpandableList1" android:label="Views/Expandable Lists/1. Custom Adapter">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ExpandableList2" android:label="Views/Expandable Lists/2. Cursor (People)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ExpandableList3" android:label="Views/Expandable Lists/3. Simple Adapter">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.CustomView1" android:label="Views/Custom" android:theme="@android:style/Theme.Light">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Gallery1" android:label="Views/Gallery/1. Photos">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Gallery2" android:label="Views/Gallery/2. People">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Spinner1" android:label="Views/Spinner">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Grid1" android:label="Views/Grid/1. Icon Grid">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Grid2" android:label="Views/Grid/2. Photo Grid">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Grid3" android:label="Views/Grid/3. Selection Mode">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ImageView1" android:label="Views/ImageView">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ImageSwitcher1" android:label="Views/ImageSwitcher">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.TextSwitcher1" android:label="Views/TextSwitcher">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ImageButton1" android:label="Views/ImageButton">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Animation1" android:label="Views/Animation/Shake">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Animation2" android:label="Views/Animation/Push">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Animation3" android:label="Views/Animation/Interpolators">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LayoutAnimation1" android:label="Views/Layout Animation/1. Grid Fade">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LayoutAnimation2" android:label="Views/Layout Animation/2. List Cascade">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LayoutAnimation3" android:label="Views/Layout Animation/3. Reverse Order">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LayoutAnimation4" android:label="Views/Layout Animation/4. Randomize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LayoutAnimation5" android:label="Views/Layout Animation/5. Grid Direction">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LayoutAnimation6" android:label="Views/Layout Animation/6. Wave Scale">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.LayoutAnimation7" android:label="Views/Layout Animation/7. Nested Animations">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Controls1" android:label="Views/Controls/1. Light Theme" android:theme="@android:style/Theme.Light">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Controls2" android:label="Views/Controls/2. Dark Theme" android:theme="@android:style/Theme">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Controls3" android:label="Views/Controls/3. Holo Light Theme" android:theme="@android:style/Theme.Holo.Light" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Controls4" android:label="Views/Controls/4. Holo Dark Theme" android:theme="@android:style/Theme.Holo" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Controls5" android:label="Views/Controls/5. Custom Theme" android:theme="@style/CustomTheme">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Controls6" android:label="Views/Controls/6. Holo or Old Theme" android:theme="@style/ThemeHolo">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Buttons1" android:label="Views/Buttons">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.AutoComplete1" android:label="Views/Auto Complete/1. Screen Top">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.AutoComplete2" android:label="Views/Auto Complete/2. Screen Bottom">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.AutoComplete3" android:label="Views/Auto Complete/3. Scroll">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.AutoComplete4" android:label="Views/Auto Complete/4. Contacts">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.AutoComplete5" android:label="Views/Auto Complete/5. Contacts with Hint">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.AutoComplete6" android:label="Views/Auto Complete/6. Multiple items">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ProgressBar1" android:label="Views/Progress Bar/1. Incremental">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ProgressBar2" android:label="Views/Progress Bar/2. Smooth">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ProgressBar3" android:label="Views/Progress Bar/3. Dialogs">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ProgressBar4" android:label="Views/Progress Bar/4. In Title Bar">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.SeekBar1" android:label="Views/Seek Bar">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.RatingBar1" android:label="Views/Rating Bar">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Focus1" android:label="Views/Focus/1. Vertical">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Focus2" android:label="Views/Focus/2. Horizontal">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Focus3" android:label="Views/Focus/3. Circular">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.InternalSelectionFocus" android:label="Views/Focus/4. Internal Selection">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Focus5" android:label="Views/Focus/5. Sequential (Tab Order)">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.WindowFocusObserver" android:label="Views/Focus/6. Window Focus Observer">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.DateWidgets1" android:label="Views/Date Widgets/1. Dialog">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.DateWidgets2" android:label="Views/Date Widgets/2. Inline">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.PopupMenu1" android:label="Views/Popup Menu">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.SearchViewActionBar" android:label="Views/Search View/Action Bar" android:theme="@android:style/Theme.Holo">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'			<meta-data android:name="android.app.default_searchable" android:value=".app.SearchQueryResults"/>',
				'		</activity>',
				'		<activity android:name=".view.SearchViewAlwaysVisible" android:label="Views/Search View/Always Expanded" android:theme="@android:style/Theme.Holo">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'			<meta-data android:name="android.app.default_searchable" android:value=".app.SearchQueryResults"/>',
				'		</activity>',
				'		<activity android:name=".view.SearchViewFilterMode" android:label="Views/Search View/Filter" android:theme="@android:style/Theme.Holo">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.RotatingButton" android:label="Views/Rotating Button">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.SecureView" android:label="Views/Secure View">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.SplitTouchView" android:label="Views/Splitting Touches across Views">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.DragAndDropDemo" android:label="Views/Drag and Drop" android:hardwareAccelerated="false" android:enabled="@bool/atLeastHoneycomb">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.GameControllerInput" android:label="Views/Game Controller Input">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Hover" android:label="Views/Hover Events">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.SystemUIModes" android:label="Views/System UI Visibility/System UI Modes" android:uiOptions="splitActionBarWhenNarrow" android:enabled="@bool/atLeastJellyBeanMR2">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.SystemUIModesOverlay" android:label="Views/System UI Visibility/System UI Modes Overlay" android:uiOptions="splitActionBarWhenNarrow" android:enabled="@bool/atLeastJellyBean">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.ContentBrowserActivity" android:label="Views/System UI Visibility/Content Browser" android:theme="@android:style/Theme.Holo.Light.DarkActionBar" android:uiOptions="splitActionBarWhenNarrow" android:enabled="@bool/atLeastJellyBean">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.VideoPlayerActivity" android:label="Views/System UI Visibility/Video Player" android:theme="@android:style/Theme.Holo" android:uiOptions="splitActionBarWhenNarrow" android:enabled="@bool/atLeastJellyBean">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".view.Switches" android:label="Views/Switches">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.kube.Kube" android:label="Graphics/OpenGL ES/Kube" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Compass" android:label="Graphics/Compass">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.CameraPreview" android:label="Graphics/CameraPreview" android:screenOrientation="landscape">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.CompressedTextureActivity" android:label="Graphics/OpenGL ES/Compressed Texture" android:theme="@android:style/Theme.NoTitleBar" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.CubeMapActivity" android:label="Graphics/OpenGL ES/Cube Map" android:theme="@android:style/Theme.NoTitleBar" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.FrameBufferObjectActivity" android:label="Graphics/OpenGL ES/Frame Buffer Object" android:theme="@android:style/Theme.NoTitleBar" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.GLSurfaceViewActivity" android:label="Graphics/OpenGL ES/GLSurfaceView" android:theme="@android:style/Theme.NoTitleBar" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.GLES20Activity" android:label="Graphics/OpenGL ES/OpenGL ES 2.0" android:theme="@android:style/Theme.NoTitleBar" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.MatrixPaletteActivity" android:label="Graphics/OpenGL ES/Matrix Palette Skinning" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.TranslucentGLSurfaceViewActivity" android:label="Graphics/OpenGL ES/Translucent GLSurfaceView" android:theme="@style/Theme.Translucent" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.TriangleActivity" android:label="Graphics/OpenGL ES/Textured Triangle" android:theme="@android:style/Theme.Holo.Dialog" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.spritetext.SpriteTextActivity" android:label="Graphics/OpenGL ES/Sprite Text" android:theme="@android:style/Theme.NoTitleBar" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.TouchRotateActivity" android:label="Graphics/OpenGL ES/Touch Rotate" android:theme="@android:style/Theme.NoTitleBar" android:configChanges="keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.PolyToPoly" android:label="Graphics/PolyToPoly">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.ScaleToFit" android:label="Graphics/ScaleToFit">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.RoundRects" android:label="Graphics/RoundRects">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.ShapeDrawable1" android:label="Graphics/Drawable/ShapeDrawable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.SurfaceViewOverlay" android:label="Graphics/SurfaceView Overlay">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.WindowSurface" android:label="Graphics/Surface Window">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:hardwareAccelerated="false" android:name=".graphics.TextAlign" android:label="Graphics/Text Align">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Arcs" android:label="Graphics/Arcs">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Patterns" android:label="Graphics/Patterns">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:hardwareAccelerated="false" android:name=".graphics.Clipping" android:label="Graphics/Clipping">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Layers" android:label="Graphics/Layers">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:hardwareAccelerated="false" android:name=".graphics.UnicodeChart" android:label="Graphics/UnicodeChart">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.PathFillTypes" android:label="Graphics/PathFillTypes">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:hardwareAccelerated="false" android:name=".graphics.Pictures" android:label="Graphics/Pictures">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:hardwareAccelerated="false" android:name=".graphics.Vertices" android:label="Graphics/Vertices">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.AnimateDrawables" android:label="Graphics/AnimateDrawables">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.SensorTest" android:label="Graphics/SensorTest">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.AlphaBitmap" android:label="Graphics/AlphaBitmap">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Regions" android:label="Graphics/Regions">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Sweep" android:label="Graphics/Sweep">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.BitmapMesh" android:label="Graphics/BitmapMesh">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.MeasureText" android:label="Graphics/MeasureText">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Typefaces" android:label="Graphics/Typefaces">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.FingerPaint" android:label="Graphics/FingerPaint">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.ColorMatrixSample" android:label="Graphics/ColorMatrix">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:hardwareAccelerated="false" android:name=".graphics.BitmapDecode" android:label="Graphics/BitmapDecode">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.ColorFilters" android:label="Graphics/ColorFilters">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.CreateBitmap" android:label="Graphics/CreateBitmap">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:hardwareAccelerated="false" android:name=".graphics.DrawPoints" android:label="Graphics/Points">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.TouchPaint" android:label="Graphics/Touch Paint" android:theme="@style/Theme.Black" android:configChanges="keyboard|keyboardHidden|navigation|orientation|screenLayout|screenSize|smallestScreenSize">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.BitmapPixels" android:label="Graphics/BitmapPixels">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.Xfermodes" android:label="Graphics/Xfermodes">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.PathEffects" android:label="Graphics/PathEffects">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.GradientDrawable1" android:label="Graphics/Drawable/GradientDrawable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.PurgeableBitmap" android:label="Graphics/PurgeableBitmap/NonPurgeable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".graphics.DensityActivity" android:label="Graphics/Density">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".media.MediaPlayerDemo" android:label="Media/MediaPlayer">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".media.MediaPlayerDemo_Audio" android:label="Media/MediaPlayer">',
				'			<intent-filter>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".media.MediaPlayerDemo_Video" android:label="Media/MediaPlayer">',
				'			<intent-filter>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".media.VideoViewDemo" android:label="Media/VideoView">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".media.AudioFxDemo" android:label="Media/AudioFx">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".appwidget.ExampleAppWidgetConfigure">',
				'			<intent-filter>',
				'				<action android:name="android.appwidget.action.APPWIDGET_CONFIGURE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".text.Link" android:label="Text/Linkify">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".text.Marquee" android:label="Text/Marquee">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".text.LogTextBox1" android:label="Text/LogTextBox">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".nfc.ForegroundDispatch" android:label="NFC/ForegroundDispatch">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".nfc.TechFilter" android:label="NFC/TechFilter">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'			<intent-filter>',
				'				<action android:name="android.nfc.action.TECH_DISCOVERED"/>',
				'			</intent-filter>',
				'			<meta-data android:name="android.nfc.action.TECH_DISCOVERED" android:resource="@xml/filter_nfc"/>',
				'		</activity>',
				'		<activity android:name=".nfc.ForegroundNdefPush" android:label="NFC/ForegroundNdefPush">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<activity android:name=".security.KeyStoreUsage" android:label="Security/KeyStore" android:windowSoftInputMode="adjustPan">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity>',
				'		<provider android:name=".app.LoaderThrottle$SimpleProvider" android:authorities="com.example.android.apis.app.LoaderThrottle" android:enabled="@bool/atLeastHoneycomb"/>',
				'		<provider android:name=".app.SearchSuggestionSampleProvider" android:authorities="com.example.android.apis.SuggestionProvider"/>',
				'		<provider android:name=".content.FileProvider" android:authorities="com.example.android.apis.content.FileProvider" android:enabled="@bool/atLeastHoneycombMR2"/>',
				'		<service android:name=".app.LocalService"/>',
				'		<service android:name=".app.MessengerService" android:process=":remote"/>',
				'		<service android:name=".app.RemoteService" android:process=":remote">',
				'			<intent-filter>',
				'				<action android:name="com.example.android.apis.app.IRemoteService"/>',
				'				<action android:name="com.example.android.apis.app.ISecondary"/>',
				'				<action android:name="com.example.android.apis.app.REMOTE_SERVICE"/>',
				'			</intent-filter>',
				'		</service>',
				'		<service android:name=".app.ServiceStartArguments"/>',
				'		<service android:name=".app.ForegroundService"/>',
				'		<service android:name=".app.IsolatedService" android:isolatedProcess="true" android:enabled="@bool/atLeastJellyBean"/>',
				'		<service android:name=".app.IsolatedService2" android:isolatedProcess="true" android:enabled="@bool/atLeastJellyBean"/>',
				'		<service android:name=".app.AlarmService_Service" android:process=":remote"/>',
				'		<service android:name=".accessibility.ClockBackService" android:label="@string/accessibility_service_label" android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">',
				'			<intent-filter>',
				'				<action android:name="android.accessibilityservice.AccessibilityService"/>',
				'			</intent-filter>',
				'		</service>',
				'		<service android:name=".accessibility.TaskBackService" android:label="@string/accessibility_query_window_label" android:enabled="@bool/atLeastIceCreamSandwich" android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">',
				'			<intent-filter>',
				'				<action android:name="android.accessibilityservice.AccessibilityService"/>',
				'			</intent-filter>',
				'			<meta-data android:name="android.accessibilityservice" android:resource="@xml/taskbackconfig"/>',
				'		</service>',
				'		<service android:name=".app.NotifyingService"/>',
				'		<receiver android:name=".app.OneShotAlarm" android:process=":remote"/>',
				'		<receiver android:name=".app.RepeatingAlarm" android:process=":remote"/>',
				'		<receiver android:name=".app.DeviceAdminSample$DeviceAdminSampleReceiver" android:label="@string/sample_device_admin" android:permission="android.permission.BIND_DEVICE_ADMIN">',
				'			<meta-data android:name="android.app.device_admin" android:resource="@xml/device_admin_sample"/>',
				'			<intent-filter>',
				'				<action android:name="android.app.action.DEVICE_ADMIN_ENABLED"/>',
				'			</intent-filter>',
				'		</receiver>',
				'		<receiver android:name=".app.AppUpdateReceiver">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MY_PACKAGE_REPLACED"/>',
				'			</intent-filter>',
				'		</receiver>',
				'		<receiver android:name=".os.SmsMessageReceiver" android:enabled="false">',
				'			<intent-filter>',
				'				<action android:name="android.provider.Telephony.SMS_RECEIVED"/>',
				'			</intent-filter>',
				'		</receiver>',
				'		<receiver android:name=".appwidget.ExampleAppWidgetProvider">',
				'			<meta-data android:name="android.appwidget.provider" android:resource="@xml/appwidget_provider"/>',
				'			<intent-filter>',
				'				<action android:name="android.appwidget.action.APPWIDGET_UPDATE"/>',
				'			</intent-filter>',
				'		</receiver>',
				'		<receiver android:name=".appwidget.ExampleBroadcastReceiver" android:enabled="false">',
				'			<intent-filter>',
				'				<action android:name="android.intent.ACTION_TIMEZONE_CHANGED"/>',
				'				<action android:name="android.intent.ACTION_TIME"/>',
				'			</intent-filter>',
				'		</receiver>',
				'		<activity-alias android:name=".app.CreateShortcuts" android:targetActivity=".app.LauncherShortcuts" android:label="@string/sample_shortcuts">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.CREATE_SHORTCUT"/>',
				'				<category android:name="android.intent.category.DEFAULT"/>',
				'			</intent-filter>',
				'		</activity-alias>',
				'		<activity-alias android:targetActivity=".graphics.PurgeableBitmap" android:name="Purgeable" android:label="Graphics/PurgeableBitmap/Purgeable">',
				'			<intent-filter>',
				'				<action android:name="android.intent.action.MAIN"/>',
				'				<category android:name="android.intent.category.SAMPLE_CODE"/>',
				'			</intent-filter>',
				'		</activity-alias>',
				'	</application>',
				'	<instrumentation android:name=".app.LocalSampleInstrumentation" android:targetPackage="com.example.android.apis" android:label="Local Sample"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('Merge multiple <application> tags', function () {
		var am = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application.xml'));
		var am2 = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest_application2.xml'));

		am.merge(am2);

		it('should match object', function () {
			expect(am).to.deep.equal({
				application: {
					allowTaskReparenting: false,
					allowBackup: true,
					backupAgent: '.MyBackupAgent',
					debuggable: true,
					description: 'this is a test',
					enabled: true,
					hasCode: true,
					hardwareAccelerated: true,
					icon: '@drawable/icon',
					killAfterRestore: true,
					largeHeap: false,
					label: 'test',
					logo: '@drawable/logo',
					manageSpaceActivity: '.TestActivity',
					name: 'test',
					permission: 'testPermission',
					persistent: true,
					process: 'test',
					restoreAnyVersion: false,
					requiredAccountType: 'com.google',
					restrictedAccountType: 'com.google',
					supportsRtl: false,
					taskAffinity: 'test',
					testOnly: false,
					theme: 'testTheme',
					uiOptions: 'none',
					vmSafeMode: false
				}
			});
		});

		it('toString()', function () {
			expect(am.toString()).to.equal('[object Object]');
		});

		it('toString(\'json\')', function () {
			expect(am.toString('json')).to.equal('{"application":{"allowTaskReparenting":false,"allowBackup":true,"backupAgent":".MyBackupAgent","debuggable":true,"description":"this is a test","enabled":true,"hasCode":true,"hardwareAccelerated":true,"icon":"@drawable/icon","killAfterRestore":true,"largeHeap":false,"label":"test","logo":"@drawable/logo","manageSpaceActivity":".TestActivity","name":"test","permission":"testPermission","persistent":true,"process":"test","restoreAnyVersion":false,"requiredAccountType":"com.google","restrictedAccountType":"com.google","supportsRtl":false,"taskAffinity":"test","testOnly":false,"theme":"testTheme","uiOptions":"none","vmSafeMode":false}}');
		});

		it('toString(\'pretty-json\')', function () {
			expect(am.toString('pretty-json')).to.equal([
				'{',
				'	"application": {',
				'		"allowTaskReparenting": false,',
				'		"allowBackup": true,',
				'		"backupAgent": ".MyBackupAgent",',
				'		"debuggable": true,',
				'		"description": "this is a test",',
				'		"enabled": true,',
				'		"hasCode": true,',
				'		"hardwareAccelerated": true,',
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

		it('toString(\'xml\')', function () {
			expect(am.toString('xml')).to.equal([
				'<?xml version="1.0" encoding="UTF-8"?>',
				'<manifest>',
				'	<application android:allowTaskReparenting="false" android:allowBackup="true" android:backupAgent=".MyBackupAgent" android:debuggable="true" android:description="this is a test" android:enabled="true" android:hasCode="true" android:hardwareAccelerated="true" android:icon="@drawable/icon" android:killAfterRestore="true" android:largeHeap="false" android:label="test" android:logo="@drawable/logo" android:manageSpaceActivity=".TestActivity" android:name="test" android:permission="testPermission" android:persistent="true" android:process="test" android:restoreAnyVersion="false" android:requiredAccountType="com.google" android:restrictedAccountType="com.google" android:supportsRtl="false" android:taskAffinity="test" android:testOnly="false" android:theme="testTheme" android:uiOptions="none" android:vmSafeMode="false"/>',
				'</manifest>'
			].join('\r\n'));
		});
	});

	describe('Merge AndroidManifest.xml Sample 2, 3, and 4', function () {
		var am2 = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample2.xml'));
		var am3 = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample3.xml'));
		var am4 = new AndroidManifest(path.join(__dirname, './resources/AndroidManifest-sample4.xml'));

		am2.merge(am3).merge(am4);

		it('should match object', function () {
			expect(am2).to.deep.equal({
				__attr__: {
					'android:versionCode': 1,
					'android:versionName': '1',
					package: 'com.appcelerator.testapp2',
					'xmlns:android': 'http://schemas.android.com/apk/res/android'
				},
				'uses-sdk': { minSdkVersion: 10, targetSdkVersion: 17 },
				permission: {
					'com.appcelerator.testapp2.permission.C2D_MESSAGE': {
						name: 'com.appcelerator.testapp2.permission.C2D_MESSAGE',
						protectionLevel: 'signature'
					},
					'${tiapp.properties[\'id\']}.permission.C2D_MESSAGE': {
						name: '${tiapp.properties[\'id\']}.permission.C2D_MESSAGE',
						protectionLevel: 'signature'
					}
				},
				application: {
					debuggable: false,
					icon: '@drawable/appicon',
					label: 'testapp2',
					name: 'Testapp2Application',
					activity: {
						'.TestappActivity': {
							alwaysRetainTaskState: true,
							configChanges: [ 'keyboardHidden', 'orientation' ],
							label: 'testapp',
							name: '.TestappActivity',
							theme: '@style/Theme.Titanium',
							'intent-filter': [
								{
									action: [ 'android.intent.action.MAIN' ],
									category: [ 'android.intent.category.LAUNCHER' ]
								}
							]
						},
						'.Testapp2Activity': {
							configChanges: [ 'keyboardHidden', 'orientation' ],
							label: 'testapp2',
							name: '.Testapp2Activity',
							theme: '@style/Theme.Titanium',
							'intent-filter': [
								{
									action: [ 'android.intent.action.MAIN' ],
									category: [ 'android.intent.category.LAUNCHER' ]
								}
							]
						},
						'com.appcelerator.testapp2.TestactivityActivity': {
							configChanges: [ 'keyboardHidden', 'orientation' ],
							name: 'com.appcelerator.testapp2.TestactivityActivity'
						},
						'org.appcelerator.titanium.TiActivity': {
							screenOrientation: 'landscape',
							name: 'org.appcelerator.titanium.TiActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ]
						},
						'org.appcelerator.titanium.TiTranslucentActivity': {
							configChanges: [ 'keyboardHidden', 'orientation' ],
							name: 'org.appcelerator.titanium.TiTranslucentActivity',
							theme: '@android:style/Theme.Translucent'
						},
						'ti.modules.titanium.ui.android.TiPreferencesActivity': {
							name: 'ti.modules.titanium.ui.android.TiPreferencesActivity'
						},
						'ti.modules.titanium.facebook.FBActivity': {
							screenOrientation: 'landscape',
							name: 'ti.modules.titanium.facebook.FBActivity',
							theme: '@android:style/Theme.Translucent.NoTitleBar'
						},
						'org.appcelerator.titanium.TiModalActivity': {
							screenOrientation: 'landscape',
							name: 'org.appcelerator.titanium.TiModalActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ],
							theme: '@android:style/Theme.Translucent.NoTitleBar.Fullscreen'
						},
						'ti.modules.titanium.ui.TiTabActivity': {
							screenOrientation: 'landscape',
							name: 'ti.modules.titanium.ui.TiTabActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ]
						},
						'ti.modules.titanium.media.TiVideoActivity': {
							screenOrientation: 'landscape',
							name: 'ti.modules.titanium.media.TiVideoActivity',
							configChanges: [ 'keyboardHidden', 'orientation' ],
							theme: '@android:style/Theme.NoTitleBar.Fullscreen'
						}
					},
					service: {
						'com.appcelerator.cloud.push.PushService': {
							name: 'com.appcelerator.cloud.push.PushService'
						},
						'org.appcelerator.titanium.analytics.TiAnalyticsService': {
							exported: false,
							name: 'org.appcelerator.titanium.analytics.TiAnalyticsService'
						},
						'com.appcelerator.testapp2.TestserviceService': {
							name: 'com.appcelerator.testapp2.TestserviceService'
						}
					},
					receiver: {
						'ti.cloudpush.IntentReceiver': {
							name: 'ti.cloudpush.IntentReceiver'
						},
						'ti.cloudpush.MQTTReceiver': {
							name: 'ti.cloudpush.MQTTReceiver',
							'intent-filter': [
								{
									action: [
										'android.intent.action.BOOT_COMPLETED',
										'android.intent.action.USER_PRESENT',
										'com.appcelerator.cloud.push.PushService.MSG_ARRIVAL'
									],
									category: [ 'android.intent.category.HOME' ]
								}
							],
							'meta-data': {
								'com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity': {
									name: 'com.appcelerator.cloud.push.BroadcastReceiver.ArrivalActivity',
									value: 'ti.cloudpush.MQTTReceiver'
								}
							}
						},
						'ti.cloudpush.GCMReceiver': {
							name: 'ti.cloudpush.GCMReceiver',
							permission: 'com.google.android.c2dm.permission.SEND',
							'intent-filter': [
								{
									action: [ 'com.google.android.c2dm.intent.RECEIVE' ],
									category: [ '${tiapp.properties[\'id\']}' ]
								}
							]
						},
						'com.appcelerator.cloud.push.PushBroadcastReceiver': {
							name: 'com.appcelerator.cloud.push.PushBroadcastReceiver',
							permission: 'com.google.android.c2dm.permission.SEND',
							'intent-filter': [
								{
									action: [ 'com.google.android.c2dm.intent.REGISTRATION' ],
									category: [ '${tiapp.properties[\'id\']}' ]
								}
							]
						}
					}
				},
				'uses-permission': [
					'android.permission.VIBRATE',
					'android.permission.ACCESS_NETWORK_STATE',
					'android.permission.WRITE_EXTERNAL_STORAGE',
					'com.google.android.c2dm.permission.RECEIVE',
					'android.permission.WAKE_LOCK',
					'android.permission.ACCESS_WIFI_STATE',
					'android.permission.RECEIVE_BOOT_COMPLETED',
					'com.appcelerator.testapp2.permission.C2D_MESSAGE',
					'android.permission.READ_PHONE_STATE',
					'android.permission.INTERNET',
					'android.permission.GET_ACCOUNTS',
					'${tiapp.properties[\'id\']}.permission.C2D_MESSAGE'
				],
				'supports-screens': { anyDensity: false, xlargeScreens: true }
			});
		});
	});
});
