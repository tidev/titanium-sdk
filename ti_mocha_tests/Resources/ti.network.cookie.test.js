
/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("Titanium.Network.Cookie", function () {
    it("cookie", function (finish) {
        var url = 'http://www.appcelerator.com/'; 
        var d = new Date();
        d.setTime(d.getTime() + (2 * 24 * 60 * 60 * 1000));
        var cookie = Ti.Network.createCookie({
        name : 'helloWorld',
        domain : url,
        value : "testCookie",
        expiryDate : d,
        });
        should(cookie.name).eql('helloWorld');
        should(cookie.getName()).eql('helloWorld');
        should(cookie.url).eql(url);
        should(cookie.getUrl()).eql(url);
        finish();
    });
});
