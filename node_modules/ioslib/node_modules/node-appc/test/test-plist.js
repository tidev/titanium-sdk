/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	fs = require('fs'),
	path = require('path'),
	temp = require('temp'),
	dt = new Date;

dt.setTime(1372893710058); // Wed Jul 03 2013 16:21:55 GMT-0700 (PDT)

describe('plist', function () {
	it('namespace exists', function () {
		appc.should.have.property('plist');
		appc.plist.should.be.a.Function;
	});

	it('create empty plist', function () {
		var plist = new appc.plist;
		plist.should.be.an.Object;

		plist.toString().should.equal('[object Object]');

		plist.toString('json').should.equal('{}');

		plist.toString('pretty-json').should.equal('{}');

		plist.toString('xml').should.equal(
			'<?xml version="1.0" encoding="UTF-8"?>\n' +
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
			'<plist version="1.0">\n' +
			'<dict>\n'+
			'</dict>\n'+
			'</plist>'
		);
	});

	it('create empty plist and populate', function () {
		var plist = new appc.plist;

		plist.testkey = 'testvalue';
		plist.testarray = ['testvalue1', 'testvalue2'];
		plist.testdict = {
			'testkey1': 'testvalue1',
			'testkey2': 'testvalue2',
		};
		plist.testnull = null;
		plist.testinteger = 13;
		plist.testfloat = 3.14;
		plist.testdate = dt;
		plist.testreal = plist.type('real', 3); // this should force it to 3.0

		plist.toString('json').should.equal('{"testkey":"testvalue","testarray":["testvalue1","testvalue2"],"testdict":{"testkey1":"testvalue1","testkey2":"testvalue2"},"testnull":null,"testinteger":13,"testfloat":3.14,"testdate":"2013-07-03T23:21:50.058Z","testreal":"3.0"}');

		plist.toString('pretty-json').should.equal([
			'{',
			'	"testkey": "testvalue",',
			'	"testarray": [',
			'		"testvalue1",',
			'		"testvalue2"',
			'	],',
			'	"testdict": {',
			'		"testkey1": "testvalue1",',
			'		"testkey2": "testvalue2"',
			'	},',
			'	"testnull": null,',
			'	"testinteger": 13,',
			'	"testfloat": 3.14,',
			'	"testdate": "2013-07-03T23:21:50.058Z",',
			'	"testreal": "3.0"',
			'}'
		].join('\n'));

		plist.toString('xml').should.equal([
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
			'<plist version="1.0">',
			'<dict>',
			'	<key>testkey</key>',
			'	<string>testvalue</string>',
			'	<key>testarray</key>',
			'	<array>',
			'		<string>testvalue1</string>',
			'		<string>testvalue2</string>',
			'	</array>',
			'	<key>testdict</key>',
			'	<dict>',
			'		<key>testkey1</key>',
			'		<string>testvalue1</string>',
			'		<key>testkey2</key>',
			'		<string>testvalue2</string>',
			'	</dict>',
			'	<key>testnull</key>',
			'	<key>testinteger</key>',
			'	<integer>13</integer>',
			'	<key>testfloat</key>',
			'	<real>3.14</real>',
			'	<key>testdate</key>',
			'	<date>2013-07-03T23:21:50Z</date>',
			'	<key>testreal</key>',
			'	<real>3.0</real>',
			'</dict>',
			'</plist>'
		].join('\n'));
	});

	it('read plist from file', function () {
		var plist = new appc.plist(path.join(__dirname, 'resources', 'Info.plist'));
		plist.should.be.an.Object;

		plist.should.eql({
			"CFBundleDevelopmentRegion": "English",
			"CFBundleDisplayName": "${PRODUCT_NAME}",
			"CFBundleExecutable": "${EXECUTABLE_NAME}",
			"CFBundleIconFile": "__APPICON__.png",
			"CFBundleURLTypes": [
				{
					"CFBundleURLName": "__URL__",
					"CFBundleURLSchemes": [
						"__URLSCHEME__"
					]
				}
			],
			"CFBundleIdentifier": "com.appcelerator.titanium",
			"CFBundleInfoDictionaryVersion": "6.0",
			"CFBundleName": "${PRODUCT_NAME}",
			"CFBundlePackageType": "APPL",
			"CFBundleSignature": "????",
			"CFBundleVersion": "1.0",
			"CFBundleShortVersionString": "1.0",
			"LSRequiresIPhoneOS": true
		});

		plist.toString().should.equal('[object Object]');

		plist.toString('json').should.equal('{"CFBundleDevelopmentRegion":"English","CFBundleDisplayName":"${PRODUCT_NAME}","CFBundleExecutable":"${EXECUTABLE_NAME}","CFBundleIconFile":"__APPICON__.png","CFBundleURLTypes":[{"CFBundleURLName":"__URL__","CFBundleURLSchemes":["__URLSCHEME__"]}],"CFBundleIdentifier":"com.appcelerator.titanium","CFBundleInfoDictionaryVersion":"6.0","CFBundleName":"${PRODUCT_NAME}","CFBundlePackageType":"APPL","CFBundleSignature":"????","CFBundleVersion":"1.0","CFBundleShortVersionString":"1.0","LSRequiresIPhoneOS":true}');

		plist.toString('pretty-json').should.equal([
			'{',
			'	"CFBundleDevelopmentRegion": "English",',
			'	"CFBundleDisplayName": "${PRODUCT_NAME}",',
			'	"CFBundleExecutable": "${EXECUTABLE_NAME}",',
			'	"CFBundleIconFile": "__APPICON__.png",',
			'	"CFBundleURLTypes": [',
			'		{',
			'			"CFBundleURLName": "__URL__",',
			'			"CFBundleURLSchemes": [',
			'				"__URLSCHEME__"',
			'			]',
			'		}',
			'	],',
			'	"CFBundleIdentifier": "com.appcelerator.titanium",',
			'	"CFBundleInfoDictionaryVersion": "6.0",',
			'	"CFBundleName": "${PRODUCT_NAME}",',
			'	"CFBundlePackageType": "APPL",',
			'	"CFBundleSignature": "????",',
			'	"CFBundleVersion": "1.0",',
			'	"CFBundleShortVersionString": "1.0",',
			'	"LSRequiresIPhoneOS": true',
			'}'
		].join('\n'));

		plist.toString('xml').should.equal([
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
			'<plist version="1.0">',
			'<dict>',
			'	<key>CFBundleDevelopmentRegion</key>',
			'	<string>English</string>',
			'	<key>CFBundleDisplayName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundleExecutable</key>',
			'	<string>${EXECUTABLE_NAME}</string>',
			'	<key>CFBundleIconFile</key>',
			'	<string>__APPICON__.png</string>',
			'	<key>CFBundleURLTypes</key>',
			'	<array>',
			'		<dict>',
			'			<key>CFBundleURLName</key>',
			'			<string>__URL__</string>',
			'			<key>CFBundleURLSchemes</key>',
			'			<array>',
			'				<string>__URLSCHEME__</string>',
			'			</array>',
			'		</dict>',
			'	</array>',
			'	<key>CFBundleIdentifier</key>',
			'	<string>com.appcelerator.titanium</string>',
			'	<key>CFBundleInfoDictionaryVersion</key>',
			'	<string>6.0</string>',
			'	<key>CFBundleName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundlePackageType</key>',
			'	<string>APPL</string>',
			'	<key>CFBundleSignature</key>',
			'	<string>????</string>',
			'	<key>CFBundleVersion</key>',
			'	<string>1.0</string>',
			'	<key>CFBundleShortVersionString</key>',
			'	<string>1.0</string>',
			'	<key>LSRequiresIPhoneOS</key>',
			'	<true/>',
			'</dict>',
			'</plist>'
		].join('\n'));
	});

	it('loading non-existent plist should throw error', function () {
		(function () {
			var plist = new appc.plist;
			plist.load(path.join(__dirname, 'resources', 'DoesNotExist.plist'));
		}).should.throw();
	});

	it('read bad plist should throw error', function () {
		(function () {
			var plist = new appc.plist(path.join(__dirname, 'resources', 'InfoBad.plist'));
		}).should.throw();
	});

	it('read big plist from file', function () {
		var plist = new appc.plist(path.join(__dirname, 'resources', 'InfoBig.plist'));
		plist.should.be.an.Object;

		// since plists do not support milliseconds, we have to force the milliseconds to zero
		dt.setTime(Math.floor(dt.getTime() / 1000) * 1000);

		plist.should.eql({
			"CFBundleDevelopmentRegion": "English",
			"CFBundleDisplayName": "${PRODUCT_NAME}",
			"CFBundleExecutable": "${EXECUTABLE_NAME}",
			"CFBundleIconFile": "appicon.png",
			"CFBundleURLTypes": [
				{
					"CFBundleURLName": "ti.testapp",
					"CFBundleURLSchemes": [
						"testapp"
					]
				}
			],
			"CFBundleIdentifier": "ti.testapp",
			"CFBundleInfoDictionaryVersion": "6.0",
			"CFBundleName": "${PRODUCT_NAME}",
			"CFBundlePackageType": "APPL",
			"CFBundleSignature": "????",
			"CFBundleVersion": "1.0",
			"CFBundleShortVersionString": "1.0",
			"LSRequiresIPhoneOS": true,
			"CFBundleIconFiles": [
				"appicon.png"
			],
			"UISupportedInterfaceOrientations~ipad": [
				"UIInterfaceOrientationPortrait",
				"UIInterfaceOrientationPortraitUpsideDown",
				"UIInterfaceOrientationLandscapeLeft",
				"UIInterfaceOrientationLandscapeRight"
			],
			"UISupportedInterfaceOrientations": [
				"UIInterfaceOrientationPortrait"
			],
			"UIStatusBarStyle": "UIStatusBarStyleDefault",
			"testnull": null,
			"testinteger": 13,
			"testfloat": 3.14,
			"testdate": dt,
			"testbooltrue": true,
			"testboolfalse": false,
			"testnesteddict": {
				"nesteddict": {
					"key": "value"
				}
			},
			"testarray": [
				13,
				3.14,
				dt,
				true,
				false,
				{ "key": "value" },
				[ true ],
				{
					"className": "PlistType",
					"type": "data",
					"value": "dGl0YW5pdW0K"
				}
			],
			"testdata": {
				"className": "PlistType",
				"type": "data",
				"value": "dGl0YW5pdW0K"
			}
		});

		plist.toString().should.equal('[object Object]');

		plist.toString('json').should.equal('{"CFBundleDevelopmentRegion":"English","CFBundleDisplayName":"${PRODUCT_NAME}","CFBundleExecutable":"${EXECUTABLE_NAME}","CFBundleIconFile":"appicon.png","CFBundleURLTypes":[{"CFBundleURLName":"ti.testapp","CFBundleURLSchemes":["testapp"]}],"CFBundleIdentifier":"ti.testapp","CFBundleInfoDictionaryVersion":"6.0","CFBundleName":"${PRODUCT_NAME}","CFBundlePackageType":"APPL","CFBundleSignature":"????","CFBundleVersion":"1.0","CFBundleShortVersionString":"1.0","LSRequiresIPhoneOS":true,"CFBundleIconFiles":["appicon.png"],"UISupportedInterfaceOrientations~ipad":["UIInterfaceOrientationPortrait","UIInterfaceOrientationPortraitUpsideDown","UIInterfaceOrientationLandscapeLeft","UIInterfaceOrientationLandscapeRight"],"UISupportedInterfaceOrientations":["UIInterfaceOrientationPortrait"],"UIStatusBarStyle":"UIStatusBarStyleDefault","testnull":null,"testinteger":13,"testfloat":3.14,"testdate":"2013-07-03T23:21:50.000Z","testbooltrue":true,"testboolfalse":false,"testnesteddict":{"nesteddict":{"key":"value"}},"testarray":[13,3.14,"2013-07-03T23:21:50.000Z",true,false,{"key":"value"},[true],"dGl0YW5pdW0K"],"testdata":"dGl0YW5pdW0K"}');

		plist.toString('pretty-json').should.equal([
			'{',
			'	"CFBundleDevelopmentRegion": "English",',
			'	"CFBundleDisplayName": "${PRODUCT_NAME}",',
			'	"CFBundleExecutable": "${EXECUTABLE_NAME}",',
			'	"CFBundleIconFile": "appicon.png",',
			'	"CFBundleURLTypes": [',
			'		{',
			'			"CFBundleURLName": "ti.testapp",',
			'			"CFBundleURLSchemes": [',
			'				"testapp"',
			'			]',
			'		}',
			'	],',
			'	"CFBundleIdentifier": "ti.testapp",',
			'	"CFBundleInfoDictionaryVersion": "6.0",',
			'	"CFBundleName": "${PRODUCT_NAME}",',
			'	"CFBundlePackageType": "APPL",',
			'	"CFBundleSignature": "????",',
			'	"CFBundleVersion": "1.0",',
			'	"CFBundleShortVersionString": "1.0",',
			'	"LSRequiresIPhoneOS": true,',
			'	"CFBundleIconFiles": [',
			'		"appicon.png"',
			'	],',
			'	"UISupportedInterfaceOrientations~ipad": [',
			'		"UIInterfaceOrientationPortrait",',
			'		"UIInterfaceOrientationPortraitUpsideDown",',
			'		"UIInterfaceOrientationLandscapeLeft",',
			'		"UIInterfaceOrientationLandscapeRight"',
			'	],',
			'	"UISupportedInterfaceOrientations": [',
			'		"UIInterfaceOrientationPortrait"',
			'	],',
			'	"UIStatusBarStyle": "UIStatusBarStyleDefault",',
			'	"testnull": null,',
			'	"testinteger": 13,',
			'	"testfloat": 3.14,',
			'	"testdate": "2013-07-03T23:21:50.000Z",',
			'	"testbooltrue": true,',
			'	"testboolfalse": false,',
			'	"testnesteddict": {',
			'		"nesteddict": {',
			'			"key": "value"',
			'		}',
			'	},',
			'	"testarray": [',
			'		13,',
			'		3.14,',
			'		"2013-07-03T23:21:50.000Z",',
			'		true,',
			'		false,',
			'		{',
			'			"key": "value"',
			'		},',
			'		[',
			'			true',
			'		],',
			'		"dGl0YW5pdW0K"',
			'	],',
			'	"testdata": "dGl0YW5pdW0K"',
			'}'
		].join('\n'));

		plist.toString('xml').should.equal([
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
			'<plist version="1.0">',
			'<dict>',
			'	<key>CFBundleDevelopmentRegion</key>',
			'	<string>English</string>',
			'	<key>CFBundleDisplayName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundleExecutable</key>',
			'	<string>${EXECUTABLE_NAME}</string>',
			'	<key>CFBundleIconFile</key>',
			'	<string>appicon.png</string>',
			'	<key>CFBundleURLTypes</key>',
			'	<array>',
			'		<dict>',
			'			<key>CFBundleURLName</key>',
			'			<string>ti.testapp</string>',
			'			<key>CFBundleURLSchemes</key>',
			'			<array>',
			'				<string>testapp</string>',
			'			</array>',
			'		</dict>',
			'	</array>',
			'	<key>CFBundleIdentifier</key>',
			'	<string>ti.testapp</string>',
			'	<key>CFBundleInfoDictionaryVersion</key>',
			'	<string>6.0</string>',
			'	<key>CFBundleName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundlePackageType</key>',
			'	<string>APPL</string>',
			'	<key>CFBundleSignature</key>',
			'	<string>????</string>',
			'	<key>CFBundleVersion</key>',
			'	<string>1.0</string>',
			'	<key>CFBundleShortVersionString</key>',
			'	<string>1.0</string>',
			'	<key>LSRequiresIPhoneOS</key>',
			'	<true/>',
			'	<key>CFBundleIconFiles</key>',
			'	<array>',
			'		<string>appicon.png</string>',
			'	</array>',
			'	<key>UISupportedInterfaceOrientations~ipad</key>',
			'	<array>',
			'		<string>UIInterfaceOrientationPortrait</string>',
			'		<string>UIInterfaceOrientationPortraitUpsideDown</string>',
			'		<string>UIInterfaceOrientationLandscapeLeft</string>',
			'		<string>UIInterfaceOrientationLandscapeRight</string>',
			'	</array>',
			'	<key>UISupportedInterfaceOrientations</key>',
			'	<array>',
			'		<string>UIInterfaceOrientationPortrait</string>',
			'	</array>',
			'	<key>UIStatusBarStyle</key>',
			'	<string>UIStatusBarStyleDefault</string>',
			'	<key>testnull</key>',
			'	<key>testinteger</key>',
			'	<integer>13</integer>',
			'	<key>testfloat</key>',
			'	<real>3.14</real>',
			'	<key>testdate</key>',
			'	<date>2013-07-03T23:21:50Z</date>',
			'	<key>testbooltrue</key>',
			'	<true/>',
			'	<key>testboolfalse</key>',
			'	<false/>',
			'	<key>testnesteddict</key>',
			'	<dict>',
			'		<key>nesteddict</key>',
			'		<dict>',
			'			<key>key</key>',
			'			<string>value</string>',
			'		</dict>',
			'	</dict>',
			'	<key>testarray</key>',
			'	<array>',
			'		<integer>13</integer>',
			'		<real>3.14</real>',
			'		<date>2013-07-03T23:21:50Z</date>',
			'		<true/>',
			'		<false/>',
			'		<dict>',
			'			<key>key</key>',
			'			<string>value</string>',
			'		</dict>',
			'		<array>',
			'			<true/>',
			'		</array>',
			'		<data>dGl0YW5pdW0K</data>',
			'	</array>',
			'	<key>testdata</key>',
			'	<data>dGl0YW5pdW0K</data>',
			'</dict>',
			'</plist>'
		].join('\n'));
	});

	it('read from file and modify', function () {
		var plist = new appc.plist(path.join(__dirname, 'resources', 'Info.plist'));
		plist.should.be.an.Object;

		plist.testkey = 'testvalue';
		plist.testarray = ['testvalue1', 'testvalue2'];
		plist.testdict = {
			'testkey1': 'testvalue1',
			'testkey2': 'testvalue2',
		};

		delete plist.CFBundleSignature;
		delete plist.CFBundleVersion;
		delete plist.CFBundleShortVersionString;
		delete plist.LSRequiresIPhoneOS;

		plist.toString('xml').should.equal([
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
			'<plist version="1.0">',
			'<dict>',
			'	<key>CFBundleDevelopmentRegion</key>',
			'	<string>English</string>',
			'	<key>CFBundleDisplayName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundleExecutable</key>',
			'	<string>${EXECUTABLE_NAME}</string>',
			'	<key>CFBundleIconFile</key>',
			'	<string>__APPICON__.png</string>',
			'	<key>CFBundleURLTypes</key>',
			'	<array>',
			'		<dict>',
			'			<key>CFBundleURLName</key>',
			'			<string>__URL__</string>',
			'			<key>CFBundleURLSchemes</key>',
			'			<array>',
			'				<string>__URLSCHEME__</string>',
			'			</array>',
			'		</dict>',
			'	</array>',
			'	<key>CFBundleIdentifier</key>',
			'	<string>com.appcelerator.titanium</string>',
			'	<key>CFBundleInfoDictionaryVersion</key>',
			'	<string>6.0</string>',
			'	<key>CFBundleName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundlePackageType</key>',
			'	<string>APPL</string>',
			'	<key>testkey</key>',
			'	<string>testvalue</string>',
			'	<key>testarray</key>',
			'	<array>',
			'		<string>testvalue1</string>',
			'		<string>testvalue2</string>',
			'	</array>',
			'	<key>testdict</key>',
			'	<dict>',
			'		<key>testkey1</key>',
			'		<string>testvalue1</string>',
			'		<key>testkey2</key>',
			'		<string>testvalue2</string>',
			'	</dict>',
			'</dict>',
			'</plist>'
		].join('\n'));

		plist.CFBundleVersion = '1.2.3';

		plist.toString('xml').should.equal([
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
			'<plist version="1.0">',
			'<dict>',
			'	<key>CFBundleDevelopmentRegion</key>',
			'	<string>English</string>',
			'	<key>CFBundleDisplayName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundleExecutable</key>',
			'	<string>${EXECUTABLE_NAME}</string>',
			'	<key>CFBundleIconFile</key>',
			'	<string>__APPICON__.png</string>',
			'	<key>CFBundleURLTypes</key>',
			'	<array>',
			'		<dict>',
			'			<key>CFBundleURLName</key>',
			'			<string>__URL__</string>',
			'			<key>CFBundleURLSchemes</key>',
			'			<array>',
			'				<string>__URLSCHEME__</string>',
			'			</array>',
			'		</dict>',
			'	</array>',
			'	<key>CFBundleIdentifier</key>',
			'	<string>com.appcelerator.titanium</string>',
			'	<key>CFBundleInfoDictionaryVersion</key>',
			'	<string>6.0</string>',
			'	<key>CFBundleName</key>',
			'	<string>${PRODUCT_NAME}</string>',
			'	<key>CFBundlePackageType</key>',
			'	<string>APPL</string>',
			'	<key>testkey</key>',
			'	<string>testvalue</string>',
			'	<key>testarray</key>',
			'	<array>',
			'		<string>testvalue1</string>',
			'		<string>testvalue2</string>',
			'	</array>',
			'	<key>testdict</key>',
			'	<dict>',
			'		<key>testkey1</key>',
			'		<string>testvalue1</string>',
			'		<key>testkey2</key>',
			'		<string>testvalue2</string>',
			'	</dict>',
			'	<key>CFBundleVersion</key>',
			'	<string>1.2.3</string>',
			'</dict>',
			'</plist>'
		].join('\n'));
	});

	it('create empty plist, populate, and save', function () {
		var plist = new appc.plist,
			tempDir = temp.mkdirSync(),
			file = path.join(tempDir, 'temp.plist');

		plist.testkey = 'testvalue';

		plist.save(file);

		fs.existsSync(file).should.be.ok;
		fs.unlinkSync(file);
	});
});
