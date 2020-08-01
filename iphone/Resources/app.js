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

var btn = Ti.UI.createButton({
    title: 'Trigger'
});

btn.addEventListener('click', function() {
    Ti.API.info(L('hello_world'));
});

win.add(btn);
win.open();

console.log("@@@ OS_VERSION_MAJOR: " + OS_VERSION_MAJOR);
console.log("@@@ OS_VERSION_MINOR: " + OS_VERSION_MINOR);
