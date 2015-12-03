/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("Titanium.UI.ImageView", function () {
    this.timeout(6000);
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

    // TIMOB-18684
    it("layoutWithSIZE_and_fixed", function (finish) {
        var win = Ti.UI.createWindow();
        var view = Ti.UI.createView({
            backgroundColor: "green",
            width: 100,
            height: Ti.UI.SIZE
        });
        var innerView = Ti.UI.createImageView({
            image: 'http://api.randomuser.me/portraits/women/0.jpg',
            width: 100,
            height: Ti.UI.SIZE,
            top: 0,
            left: 0
        });
        view.add(innerView);
        innerView.addEventListener("load", function (e) {
            should(innerView.size.height).eql(100);
            should(view.size.height).eql(innerView.size.height);
            should(view.size.width).eql(innerView.size.width);
            setTimeout(function () {
                win.close();
                finish();
            }, 1000);
        });
        win.add(view);
        win.open();
    });
});
