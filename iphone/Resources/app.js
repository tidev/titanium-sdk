/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */

'use strict';

var win = Ti.UI.createWindow({
	backgroundColor: '#fff'
});

var btn = Ti.UI.createButton({
	title: 'Trigger'
});

btn.addEventListener('click', function () {
    var win2 = Ti.UI.createWindow({
        backgroundColor: '#fff'
    });
    win2.addEventListener('close', function () {
        console.log('CLOSE  WINDOW 2');
    });
    var btn2 = Ti.UI.createButton({
        title: 'Trigger'
    });
    btn2.addEventListener('click', function () {
        var win3 = Ti.UI.createWindow({
            backgroundColor: '#fff'
        });
        win3.addEventListener('close', function () {
            console.log('CLOSE  WINDOW 3');
        });
    
        tabGroup.activeTab.open(win3);
    });
    win2.add(btn2);
	tabGroup.activeTab.open(win2);
});

win.add(btn);

var tabGroup = Ti.UI.createTabGroup();
var tab = Ti.UI.createTab({ title: 'Home', window: win });

tabGroup.addTab(tab);
tabGroup.open();
