/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */

Ti.App.iOS.registerBackgroundTask({
    type: 'refresh',
    identifier: 'com.appc.test',
    interval: 15 * 60,
    url: './task.js'
});

global.foo = 'test';
Ti.API.debug(console);
Ti.API.debug(global.foo);