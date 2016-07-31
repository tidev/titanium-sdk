/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("Titanium.UI.ImageView", function () {
    it("image", function (finish) {
        var label = Ti.UI.createImageView({
            image: "https://www.google.com/images/srpr/logo11w.png"
        });
        should(label.image).be.a.String;
        should(label.getImage).be.a.Function;
        should(label.image).eql('https://www.google.com/images/srpr/logo11w.png');
        should(label.getImage()).eql('https://www.google.com/images/srpr/logo11w.png');
        label.image = 'path/to/logo.png';
        should(label.image).eql('path/to/logo.png');
        should(label.getImage()).eql('path/to/logo.png');
        finish();
    });
});
