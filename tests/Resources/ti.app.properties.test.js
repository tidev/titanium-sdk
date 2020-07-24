/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

Array.prototype.contains = function (obj) {
	var i = this.length;
	while  (i--) {
		if (this[i] === obj) {
			return true;
		}
	}
	return false;
};

describe('Titanium.App.Properties', function () {

	it('apiName', function () {
		should(Ti.App.Properties).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.App.Properties.apiName).be.eql('Ti.App.Properties');
	});

	it('getBool default', function () {
		Ti.App.Properties.removeProperty('test_bool');
		should(Ti.App.Properties.getBool('test_bool')).be.eql(null);
		should(Ti.App.Properties.getBool('test_bool', true)).be.eql(true);
	});

	it('set and getBool', function () {
		Ti.App.Properties.setBool('test_bool', true);
		should(Ti.App.Properties.getBool('test_bool')).be.eql(true);
	});

	it('setBool on property from tiapp doesnt change value', function () {
		should(Ti.App.Properties.getBool('presetBool')).be.eql(true);
		Ti.App.Properties.setBool('presetBool', false); // should log warning
		should(Ti.App.Properties.getBool('presetBool')).be.eql(true);
	});

	it('getDouble default', function () {
		Ti.App.Properties.removeProperty('test_double');
		should(Ti.App.Properties.getDouble('test_double')).be.eql(null);
		should(Ti.App.Properties.getDouble('test_double', 3.14)).be.eql(3.14);
	});

	it('set and getDouble', function () {
		Ti.App.Properties.setDouble('test_double', 1.321);
		should(Ti.App.Properties.getDouble('test_double')).be.eql(1.321);
	});

	it('setDouble on property from tiapp doesnt change value', function () {
		should(Ti.App.Properties.getDouble('presetDouble')).be.eql(1.23456);
		Ti.App.Properties.setDouble('presetDouble', 6.54321); // should log warning
		should(Ti.App.Properties.getDouble('presetDouble')).be.eql(1.23456);
	});

	it('getInt default', function () {
		Ti.App.Properties.removeProperty('test_int');
		should(Ti.App.Properties.getInt('test_int')).be.eql(null);
		should(Ti.App.Properties.getInt('test_int', 3)).be.eql(3);
	});

	it('set and getInt', function () {
		Ti.App.Properties.setInt('test_int', 1);
		should(Ti.App.Properties.getInt('test_int')).be.eql(1);
	});

	it('setInt on property from tiapp doesnt change value', function () {
		should(Ti.App.Properties.getInt('presetInt')).be.eql(1337);
		Ti.App.Properties.setInt('presetInt', 666); // should log warning
		should(Ti.App.Properties.getInt('presetInt')).be.eql(1337);
	});

	it('List default to null', function () {
		should(Ti.App.Properties.getList('test_list_null', null)).be.eql(null);
	});

	it('List', function () {
		var test_list = [ 'item1', 'item2', 'item3' ];
		Ti.App.Properties.setList('test_list', test_list);
		should(Ti.App.Properties.getList('test_list')).be.eql(test_list);

		var names = [ { name: 'One' }, { name: 1 }, { name: '' }, null, { name: true }, 1, '', null, false ];
		Ti.App.Properties.setList('names', names);
		should(JSON.stringify(Ti.App.Properties.getList('names'))).be.eql(JSON.stringify(names));
	});

	it('Object', function () {
		var test_object = { item: 'item1' };
		Ti.App.Properties.setObject('test_object', test_object);
		should(Ti.App.Properties.getObject('test_object')).be.eql(test_object);
	});

	it('Object default to null', function () {
		should(Ti.App.Properties.getObject('test_object_null')).be.eql(null);
	});

	it('getString default', function () {
		Ti.App.Properties.removeProperty('test_string');
		should(Ti.App.Properties.getString('test_string')).be.eql(null);
		should(Ti.App.Properties.getString('test_string', 'defaultString')).be.eql('defaultString');
	});

	it('set and getString', function () {
		Ti.App.Properties.setString('test_string', 'some test string');
		should(Ti.App.Properties.getString('test_string')).be.eql('some test string');
	});

	it('setString on property from tiapp doesnt change value', function () {
		should(Ti.App.Properties.getString('presetString')).be.eql('Hello!');
		Ti.App.Properties.setString('presetString', 'a new value'); // should log warning
		should(Ti.App.Properties.getString('presetString')).be.eql('Hello!');
	});

	it('listProperties', function () {
		Ti.App.Properties.setBool('test_property', true);
		var properties = Ti.App.Properties.listProperties();
		should(properties).be.a.Object();
		should(properties.contains('test_property')).be.eql(true);
	});

	// FIXME Get working on iOS
	it.iosBroken('listProperties contains tiapp properties', function () {
		var properties = Ti.App.Properties.listProperties();
		should(properties).be.a.Object();
		should(properties.contains('ti.ui.defaultunit')).be.eql(true);
		should(properties.contains('ti.deploytype')).be.eql(true); // This isn't present on iOS!
		should(properties.contains('presetBool')).be.eql(true);
	});

	it('removeProperty', function () {
		Ti.App.Properties.setBool('test_property', true);
		var properties = Ti.App.Properties.listProperties();
		should(properties).be.a.Object();
		should(properties.contains('test_property')).be.eql(true);
		Ti.App.Properties.removeProperty('test_property');
		properties = Ti.App.Properties.listProperties();
		should(properties.contains('test_property')).be.eql(false);
	});

	it('removeProperty doesnt remove properties from tiapp', function () {
		var properties = Ti.App.Properties.listProperties();
		should(properties).be.a.Object();
		should(properties.contains('presetString')).be.eql(true);
		Ti.App.Properties.removeProperty('presetString');
		properties = Ti.App.Properties.listProperties();
		should(properties.contains('presetString')).be.eql(true);
	});

	it('hasProperty', function () {
		Ti.App.Properties.removeProperty('test_has_property');
		should(Ti.App.Properties.hasProperty('test_has_property')).be.eql(false);
		Ti.App.Properties.setBool('test_has_property', true);
		should(Ti.App.Properties.hasProperty('test_has_property')).be.eql(true);
	});

	it('hasProperty returns true for tiapp properties', function () {
		should(Ti.App.Properties.hasProperty('presetString')).be.eql(true);
	});

	// FIXME Get working on Android and iOS
	it.androidAndIosBroken('change events', function (finish) {
		var eventCount = 0;
		Ti.App.Properties.addEventListener('change', function (properties) {
			should(properties.source).be.a.Object();
			should(properties.type).be.eql('change');
			eventCount++;
		});
		Ti.App.Properties.setBool('test_bool', true);
		Ti.App.Properties.setDouble('test_double', 1.23);
		Ti.App.Properties.setInt('test_int', 1);
		Ti.App.Properties.setString('test_string', 'test');
		Ti.App.Properties.setList('test_list', [ 1, 2, 3 ]);
		Ti.App.Properties.setObject('test_object', { test: 'test' });

		// verify all change events have fired
		setTimeout(function () {
			should(eventCount).be.eql(6); // Android and iOS only get 4!
			finish();
		}, 800);

	});

	it('set and get large String (256)', function () {
		var char256 = 'cdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhr';
		Ti.App.Properties.setString('char256', char256);
		should(Ti.App.Properties.getString('char256')).be.eql(char256);

		Ti.App.Properties.removeProperty('char256');
		should(Ti.App.Properties.hasProperty('char256')).be.false();
	});

	it('set and get large String (512)', function () {
		var char512 = 'cdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflha';
		Ti.App.Properties.setString('char512', char512);
		should(Ti.App.Properties.getString('char512')).be.eql(char512);

		Ti.App.Properties.removeProperty('char512');
		should(Ti.App.Properties.hasProperty('char512')).be.false();
	});

	it('set and get large String (1024)', function () {
		var char1024 = 'cdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflha';
		Ti.App.Properties.setString('char1024', char1024);
		should(Ti.App.Properties.getString('char1024')).be.eql(char1024);

		Ti.App.Properties.removeProperty('char1024');
		should(Ti.App.Properties.hasProperty('char1024')).be.false();
	});

	it('set and get large String (2048)', function () {
		var char2048 = 'cdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflha';
		Ti.App.Properties.setString('char2048', char2048);
		should(Ti.App.Properties.getString('char2048')).be.eql(char2048);

		Ti.App.Properties.removeProperty('char2048');
		should(Ti.App.Properties.hasProperty('char2048')).be.false();
	});

	it('set and get large String (4096)', function () {
		var char4096 = 'cdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhacdsahiifrfuvvppfxugqtmywibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflhrcdsaibuostrytsozhdopcznjtjfadbgrjewakvlhinrvwcorcxhacapoeflhrwfmrturarlkhpcxsnwjkvlhinrvwcorcxhahinrvwcorcxhacapoeflha';
		Ti.App.Properties.setString('char4096', char4096);
		should(Ti.App.Properties.getString('char4096')).be.eql(char4096);

		Ti.App.Properties.removeProperty('char4096');
		should(Ti.App.Properties.hasProperty('char4096')).be.false();
	});

	it('#removeAllProperties() should remove all properties', function () {
		Ti.App.Properties.setString('test_removeAllProperties1', 'test1');
		Ti.App.Properties.setString('test_removeAllProperties2', 'test2');
		should(Ti.App.Properties.hasProperty('test_removeAllProperties1')).be.true();
		should(Ti.App.Properties.hasProperty('test_removeAllProperties2')).be.true();
		Ti.App.Properties.removeAllProperties();
		should(Ti.App.Properties.hasProperty('test_removeAllProperties1')).be.false();
		should(Ti.App.Properties.hasProperty('test_removeAllProperties2')).be.false();
	});
});
