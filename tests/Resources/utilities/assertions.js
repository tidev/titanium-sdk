'use strict';
var should = require('../should'),
	utilities = require('./utilities');

// Copied from newer should.js
// Verifies the descriptor for an own property on a target
should.Assertion.add('ownPropertyWithDescriptor', function (name, desc) {
	this.params = { actual: this.obj, operator: 'to have own property `' + name + '` with descriptor ' + JSON.stringify(desc) };

	// descriptors do have default values! If not specified, they're treated as false
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor
	const keys = [ 'writable', 'configurable', 'enumerable' ];
	const descriptor = Object.getOwnPropertyDescriptor(Object(this.obj), name);

	for (let key in keys) {
		const expected = (desc[key] || false);
		const actual = (descriptor[key] || false);
		if (expected !== actual) {
			should.fail('Expected ' + name + '.' + key + ' = ' + expected);
		}
	}
}, false);

// Finds a property up the prototype chain with a given descriptor
should.Assertion.add('propertyWithDescriptor', function (propName, desc) {
	var target = this.obj;
	this.params = { actual: this.obj, operator: 'to have property `' + propName + '` with descriptor ' + JSON.stringify(desc) };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	// first let's see if we can find the property up the prototype chain...
	// need to call hasOwnProperty in a funky way due to https://jira.appcelerator.org/browse/TIMOB-23504
	while (!Object.prototype.hasOwnProperty.call(target, propName)) {
		target = Object.getPrototypeOf(target); // go up the prototype chain
		if (!target) {
			should.fail('Unable to find property ' + propName + ' up the prototype chain!');
			break;
		}
	}

	// Now verify the property descriptor for it
	should(target).have.ownPropertyWithDescriptor(propName, desc);
}, false);

/**
 * Use this to test for read-only, non-configurable properties on an Object. We
 * will look up the prototype chain to find the owner of the property.
 *
 * @param {String} propName     Name of the property to test for.
 */
should.Assertion.add('readOnlyProperty', function (propName) {
	this.params = { operator: 'to have a read-only property with name: ' + propName };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	// Now verify the property descriptor for it
	const props = { writable: false };
	// FIXME read-only properties should also be non-configurable on iOS and Windows (JSC)!
	if (!utilities.isIOS() && !utilities.isWindows()) {
		props.configurable = false;
	}
	this.have.propertyWithDescriptor(propName, props);

	// lastly swap over to the property itself (on our original object)
	this.have.property(propName);
}, false);

// Is this needed? Why not just test for 'property'?
should.Assertion.add('readWriteProperty', function (propName) {
	this.params = { operator: 'to have a read-write property with name: ' + propName };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	// Now verify the property descriptor for it
	const props = {
		writable: true,
		enumerable: true,
		configurable: true,
	};
	this.have.propertyWithDescriptor(propName, props);

	// lastly swap over to the property itself (on our original object)
	this.have.property(propName);
}, false);

// TODO Do we need to distinguish between constant and readOnlyproperty?
should.Assertion.alias('readOnlyProperty', 'constant');

// TODO Add an assertion for "exclusive" group of constants: A set of constants whose values must be unique (basically an enum), i.e. Ti.UI.FILL vs SIZE vs UNKNOWN
// TODO Use more custom assertions for things like color properties?
module.exports = should;
