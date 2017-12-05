/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe.windowsBroken('Titanium.Geolocation', function () {
	
	it('reverseGeocoder', function (finish) {
		this.timeout(6e4); // 60 sec

		should(Ti.Geolocation.reverseGeocoder).be.a.Function;
		Ti.Geolocation.reverseGeocoder(37.3883645, -122.0512682, function (data) {
			try {
				should(data).have.property('success').which.is.a.Boolean;
				should(data.success).be.eql(true);
				should(data).have.property('code').which.is.a.Number;
				should(data.code).be.eql(0);
				// FIXME error property is missing altogether on success for iOS...
				// should(data).have.property('error'); // undefined on success, holds error message as String otherwise.
				should(data).have.property('places').which.is.an.Array;
				should(data.places[0].zipcode).be.eql('94043');
				should(data.places[0]).have.property('latitude').which.is.a.Number; // docs say String!
				should(data.places[0]).have.property('longitude').which.is.a.Number; // docs say String!
				should(data.places[0].country).be.eql('United States of America');
				should(data.places[0].state).be.eql('California');
				should(data.places[0].country_code).be.eql('US');
				should(data.places[0]).have.property('city').which.is.a.String;
				should(data.places[0]).have.property('address').which.is.a.String;

				finish();
			} catch (err) {
				finish(err);
			}
		});
	});
});
