/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("Titanium.UI.AttributedString", function() {
    ("android" === Ti.Platform.osname ? it.skip : it)("attributedStringLinkTest", function(finish) {    
        var win = Titanium.UI.createWindow({
            backgroundColor: '#ddd',
        });
        var string = Ti.UI.createAttributedString({
            text: 'Appcelerator always blue and underlined',
            attributes: [{
                type: Ti.UI.ATTRIBUTE_LINK,
                value: 'http://www.appcelerator.com',
                range: [0, 12]
            }, {
                type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
                value: 'red',
                range: [0, 12]
            }, {
                type: Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
                value: Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_NONE,
                range: [0, 12]
            }, {
                type: Ti.UI.ATTRIBUTE_LINK,
                value: 'https://www.youtube.com',
                range: [20, 4]
            }]
        });

        var label = Ti.UI.createLabel({
            top: 100,
            attributedString: string
        });

        win.add(label);
        win.open();

        label.addEventListener("link", function(e) {
            win.add(Titanium.UI.createWebView({
                url: e.url,
                height: 300,
                width: 300
            }));
        });

        var attributes = [];
        attributes = string.getAttributes();
        should(attributes[0].value).eql("http://www.appcelerator.com");
        should(attributes[1].value).eql("red");
        should(attributes[3].value).eql("https://www.youtube.com");
        finish();
    });

});