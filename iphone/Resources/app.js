/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */
'use strict';
var result = Ti.Platform.canOpenURL('http://www.appcelerator.com/');
Ti.API.info(typeof result);
Ti.API.info('Can open url: ' + result);
Ti.API.info(result);

var win = Ti.UI.createWindow({
	backgroundColor: '#fff'
});

var btn = Ti.UI.createButton({
	title: 'Trigger'
});

btn.addEventListener('click', function () {
	Ti.API.info(Ti.Platform.canOpenURL('http://www.appcelerator.com/'));
	// Ti.API.info('Hello world!');
	// var buffer1 = Ti.createBuffer({ value: 'hello world' });
	// Ti.API.info(buffer1[0]);
	// Ti.API.info(buffer1.byteOrder);
	// Ti.API.info(buffer1.apiName);
	// Ti.API.info(buffer1.length);
	// Ti.API.info(buffer1.toString());
	// Ti.API.info('Creating buffer2');
	// var buffer2 = Ti.createBuffer({ value: '... and again' });
	// Ti.API.info('Length:');
	// Ti.API.info(buffer2.length);
	// Ti.API.info(buffer2.toString());
	//
	// var n = buffer1.append(buffer2);
	// Ti.API.info(buffer1.length); // .eql(25);
	// Ti.API.info(n); // .eql(buffer2.length);
	// Ti.API.info(buffer1); // .eql(buffer2.length);
});

win.add(btn);
win.open();
