
/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("Titanium.UI.Window", function () {
    it.skip("showToolbarHideToolbar", function (finish) {

        // This test is iOS-only, Android can succeed directly.
        if (Ti.Platform.osname == 'android') {
            finish();
        }

        // Create containers
        var win = Ti.UI.createWindow({backgroundColor: 'white'});
        var nav = Ti.UI.iOS.createNavigationWindow({window: win});

        // Set toolbar
        win.setToolbar([Ti.UI.createButton({title: "Toolbar"})]);
        nav.open();

        // Open window
        win.addEventListener("open", function() {

            // Show toolbar
            win.showToolbar({animated: false});
            should(win.toolbarHidden).eql(false);

            // Hide toolbar
            win.hideToolbar({animated: false});
            should(win.toolbarHidden).eql(true);

            // Finish test
            finish();
        });
    });

});
