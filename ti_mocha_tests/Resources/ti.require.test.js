/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("require", function () {
    it("loads package.json main property when requiring directory", function (finish) {
        var with_package = require('./with_package');
        should(with_package).have.property('name');
        should(with_package.name).be.eql('main.js');
        finish();
    });

    it("falls back to index.js when requiring directory with no package.json", function (finish) {
        var with_index_js = require('./with_index_js');
        should(with_index_js).have.property('name');
        should(with_index_js.name).be.eql('index.js');
        finish();
    });

    it("falls back to index.json when requiring directory with no package.json or index.js", function (finish) {
        var with_index_json = require('./with_index_json');
        should(with_index_json).have.property('name');
        should(with_index_json.name).be.eql('index.json');
        finish();
    });

    it("loads exact match JS file", function (finish) {
        var exact_js = require('./with_package/index.js');
        should(exact_js).have.property('name');
        should(exact_js.name).be.eql('index.js');
        finish();
    });

    it("loads exact match JSON file", function (finish) {
        var package_json = require('./with_package/package.json');
        should(package_json).have.property('main');
        should(package_json.main).be.eql('./main.js');
        finish();
    });

    it("loads .js with matching file basename if no exact match", function (finish) {
        var with_index_js = require('./with_index_js/index');
        should(with_index_js).have.property('name');
        should(with_index_js.name).be.eql('index.js');
        finish();
    });

    it("loads .json with matching file basename if no exact or .js match", function (finish) {
        var with_index_json = require('./with_index_json/index');
        should(with_index_json).have.property('name');
        should(with_index_json.name).be.eql('index.json');
        finish();
    });
});
