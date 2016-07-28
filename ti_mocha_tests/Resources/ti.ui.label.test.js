
/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("Titanium.UI.Label", function () {
    it("text", function (finish) {
        var label = Ti.UI.createLabel({
            text: "this is some text"
        });
        should(label.text).be.a.String;
        should(label.getText).be.a.Function;
        should(label.text).eql('this is some text');
        should(label.getText()).eql('this is some text');
        label.text = 'other text';
        should(label.text).eql('other text');
        should(label.getText()).eql('other text');
        finish();
    });

    it("textAlign", function (finish) {
        var label = Ti.UI.createLabel({
            text: "this is some text",
            textAlign: Titanium.UI.TEXT_ALIGNMENT_CENTER
        });
        if (Ti.Platform.osname == 'android') {
            should(label.textAlign).be.a.String; // String on Android
        } 
        else {
            should(label.textAlign).be.a.Number;
        }
        should(label.getTextAlign).be.a.Function;
        should(label.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
        should(label.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_CENTER);
        label.textAlign = Titanium.UI.TEXT_ALIGNMENT_RIGHT;
        should(label.textAlign).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
        should(label.getTextAlign()).eql(Titanium.UI.TEXT_ALIGNMENT_RIGHT);
        finish();
    });

    it("verticalAlign", function (finish) {
        var label = Ti.UI.createLabel({
            text: "this is some text",
            verticalAlign: Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM
        });
        if (Ti.Platform.osname == 'android') {
            should(label.verticalAlign).be.a.String; // String on Android
        } 
        else {
            should(label.verticalAlign).be.a.Number;
        }
        should(label.getVerticalAlign).be.a.Function;
        should(label.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
        should(label.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM);
        label.verticalAlign = Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP;
        should(label.verticalAlign).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
        should(label.getVerticalAlign()).eql(Titanium.UI.TEXT_VERTICAL_ALIGNMENT_TOP);
        finish();
    });
});
