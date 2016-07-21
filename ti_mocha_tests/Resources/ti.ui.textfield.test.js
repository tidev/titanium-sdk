
/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("Titanium.UI.TextField", function () {
    it("textfield", function (finish) {
        var passwordField = Ti.UI.createTextField({
            passwordMask : true,
            value : "this is a secret",
            editable : false,
            top : 100,
            width : Ti.UI.FILL
        });
        should(passwordField.editable).eql(false);
        should(passwordField.passwordMask).eql(true);

        passwordField.editable = true;

        should(passwordField.editable).eql(true);
        should(passwordField.passwordMask).eql(true);

        finish();
    });

});
