'use strict';
/* globals OS_ANDROID,OS_IOS */
const should = require('should');
const utilities = require('./utilities');
const isIOSDevice = OS_IOS && !Ti.Platform.model.includes('(Simulator)');

// use pngjs and pixelmatch!
const zlib = require('browserify-zlib');
global.binding.register('zlib', zlib);
const PNG = require('pngjs').PNG;
const cgbiToPng = isIOSDevice ? require('cgbi-to-png') : { revert: buf => buf };
const pixelmatch = require('pixelmatch');

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
			should.fail(`Expected ${name}.${key} = ${expected}`);
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
			should.fail(`Unable to find property ${propName} up the prototype chain!`);
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
	this.params = { operator: `to have a read-only property with name: ${propName}` };
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
	this.params = { operator: `to have a read-write property with name: ${propName}` };
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

should.Assertion.add('enumeration', function (type, names) {
	this.params = { operator: `to have a set of enumerated constants with names: ${names}` };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	for (let i = 0; i < names.length; i++) {
		should(this.obj).have.constant(names[i]).which.is.a[type](); // eslint-disable-line no-unused-expressions
	}
}, false);

/**
 * @param {Ti.Blob} blob binary data to write
 * @param {string} imageFilePath relative file path to save image under
 * @returns {Ti.Filesystem.File}
 */
function saveImage(blob, imageFilePath) {
	const file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, imageFilePath);
	if (!file.parent.exists()) {
		file.parent.createDirectory();
	}
	file.write(blob);
	return file;
}

/**
 * @param {string|Ti.Blob} image path to image file on disk (relative), or an in-memory Ti.Blob instance (holding an image).
 * @param {object} [options] options for comparing images
 * @param {Number} [options.threshold=0.1] threshold for comparing images
 * @param {Number} [options.maxPixelMismatch=0] maximum number of pixels this match will tolerate
 */
should.Assertion.add('matchImage', function (image, options = { threshold: 0.1, maxPixelMismatch: 0 }) {
	options.maxPixelMismatch = options.maxPixelMismatch || 0;

	// Validate object is valid view.
	this.obj.should.have.property('toImage').which.is.a.Function();

	const actualBlob = this.obj.toImage();
	const isExpectedBlob = image.apiName === 'Ti.Blob';
	const platform = OS_ANDROID ? 'android' : 'ios';
	const now = Date.now();
	const density = Ti.Platform.displayCaps.logicalDensityFactor;
	const suffix = density === 1 ? '' : `@${density}x`;

	let expectedBlob = null;

	if (isExpectedBlob) {
		this.params = {
			obj: this.obj.apiName,
			operator: 'to match Ti.Blob'
		};
		expectedBlob = image;
		image = `snapshots/${now}_${expectedBlob.width}x${expectedBlob.height}${suffix}.png`;
	} else {

		// Amend image path for correct snapshot size.
		// TODO: Append @#x suffix if density is > 1
		image = `${image.substr(0, image.length - 4)}_${actualBlob.width}x${actualBlob.height}${suffix}.png`;

		this.params = {
			obj: this.obj.apiName,
			operator: `to match image ('${image}')`
		};

		// Attempt to load snapshot.
		const snapshot = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, image);
		try {
			should(snapshot.exists()).be.true(`No snapshot image to compare for platform '${platform}' ('${image}')`);
		} catch (err) {
			// No snapshot, save current view as snapshot for platform.
			const file = saveImage(actualBlob, image);
			console.log(`!IMAGE: {"path":"${file.nativePath}","platform":"${platform}","relativePath":"${image}"}`);

			throw err;
		}

		// Load expected snapshot blob.
		expectedBlob = snapshot.read();
	}

	// Validate size of blobs.
	try {
		should(actualBlob).have.property('width').equal(expectedBlob.width);
		should(actualBlob).have.property('height').equal(expectedBlob.height);
		should(actualBlob).have.property('size').equal(expectedBlob.size);
	} catch (e) {

		// Invalid size, save current view for investigation.
		const actualOut = saveImage(actualBlob, image);
		console.log(`!IMAGE: {"path":"${actualOut.nativePath}","platform":"${platform}","relativePath":"${image}"}`);

		// Save expected blob for investigation.
		const expectedPath = image.slice(0, -4) + '_expected.png';
		const expectedOut = saveImage(expectedBlob, expectedPath);
		console.log(`!IMG_DIFF: {"path":"${expectedOut.nativePath}","platform":"${platform}","relativePath":"${expectedPath}"}`);

		throw e;
	}

	// Create a Buffer around the contents of each snapshot.
	const expectedBuffer = Buffer.from(expectedBlob.toArrayBuffer());
	const expectedImg = PNG.sync.read(cgbiToPng.revert(expectedBuffer));

	const actualBuffer = Buffer.from(actualBlob.toArrayBuffer());
	const actualImg = PNG.sync.read(cgbiToPng.revert(actualBuffer));

	const { width, height } = actualImg;
	const diffImg = new PNG({ width, height });
	const diff = pixelmatch(actualImg.data, expectedImg.data, diffImg.data, width, height, { threshold: options.threshold });

	try {
		should(diff).be.belowOrEqual(options.maxPixelMismatch, 'mismatched pixels');
	} catch (err) {
		// Snapshots did not match, save current view.
		const actualOut = saveImage(actualBlob, image);
		console.log(`!IMAGE: {"path":"${actualOut.nativePath}","platform":"${platform}","relativePath":"${image}"}`);

		// Save expected blob for investigation.
		if (isExpectedBlob) {
			const expectedPath = `snapshots/${now}_${expectedBlob.width}x${expectedBlob.height}${suffix}_expected.png`;
			const expectedOut = saveImage(expectedBlob, expectedPath);
			console.log(`!IMG_DIFF: {"path":"${expectedOut.nativePath}","platform":"${platform}","relativePath":"${expectedPath}"}`);
		} else {
			const expectedPath = image.slice(0, -4) + '_expected.png';
			const expectedOut = saveImage(expectedBlob, expectedPath);
			console.log(`!IMG_DIFF: {"path":"${expectedOut.nativePath}","platform":"${platform}","relativePath":"${expectedPath}"}`);
		}

		const diffBuffer = PNG.sync.write(diffImg);
		const diffPath = image.slice(0, -4) + '_diff.png';

		// Save difference image for investigation.
		const diffOut = saveImage(diffBuffer.toTiBuffer().toBlob(), diffPath);
		console.log(`!IMG_DIFF: {"path":"${diffOut.nativePath}","platform":"${platform}","relativePath":"${diffPath}","blob":${isExpectedBlob}}`);

		throw err;
	}
}, false);

// TODO Add an assertion for "exclusive" group of constants: A set of constants whose values must be unique (basically an enum), i.e. Ti.UI.FILL vs SIZE vs UNKNOWN
// TODO Use more custom assertions for things like color properties?
module.exports = should;
