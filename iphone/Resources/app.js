/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */

var win = Ti.UI.createWindow({
    backgroundColor: '#fff'
});

var table = Ti.UI.createTableView();
table.add(Ti.UI.createView({backgroundColor: 'red'}));
alert(table.children);

win.add(table);
win.open();
