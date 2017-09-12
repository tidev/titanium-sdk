'use strict';
var should = require('../should'),
	utilities = require('./utilities');

// Copied from newer should.js
should.Assertion.add('propertyWithDescriptor', function (name, desc) {
	var obj;
	this.params = { actual: this.obj, operator: 'to have own property with descriptor ' + JSON.stringify(desc) };
	obj = this.obj;

	this.have.ownProperty(name);
	should(Object.getOwnPropertyDescriptor(Object(obj), name)).have.properties(desc);
}, false);

/**
 * Use this to test for read-only, non-configurable properties on an Object. We
 * will look up the prototype chain to find the owner of the property.
 *
 * @param {String} propName     Name of the property to test for.
 */
should.Assertion.add('readOnlyProperty', function (propName) {
	var target = this.obj,
		props = { writable: false };
	this.params = { operator: 'to have a read-only property with name: ' + propName };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	// need to call hasOwnProperty in a funky way due to https://jira.appcelerator.org/browse/TIMOB-23504
	while (!Object.prototype.hasOwnProperty.call(target, propName)) {
		target = Object.getPrototypeOf(target); // go up the prototype chain
		if (!target) {
			return this.fail();
		}
	}

	if (!utilities.isIOS() && !utilities.isWindows()) { // FIXME read-only properties should also be non-configurable on iOS and Windows (JSC)!
		props.configurable = false;
	}
	should(target).have.propertyWithDescriptor(propName, props);
	this.obj = this.obj[propName];
}, false);

// TODO Do we need to distinguish between constant and readOnlyproperty?
should.Assertion.alias('readOnlyProperty', 'constant');

// TODO Add an assertion for "exclusive" group of constants: A set of constants whose values must be unique (basically an enum), i.e. Ti.UI.FILL vs SIZE vs UNKNOWN
// TODO Use more custom assertions for things like color properties?
module.exports = should;
