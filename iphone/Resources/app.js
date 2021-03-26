/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */

const win = Ti.UI.createWindow({
	backgroundColor: '#fff'
});

const btn = Ti.UI.createButton({
	image: Ti.UI.iOS.systemImage('greetingcard', { weight: 'light', size: 60 }),
    backgroundColor: 'green',
	width: 80,
	height: 80
});

win.add(btn);
win.open();
