/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */
 
var test = require('ti.test');

var example = test.createExample();

var win = Ti.UI.createWindow({
    backgroundColor: '#fff'
});

var btn = Ti.UI.createButton({
    title: 'Trigger'
});

btn.addEventListener('click', function() {
    alert(test.tryThis('Titanium rocks'));
    Ti.API.warn('Test number: ' + example.testNumber());
    Ti.API.warn('Test string: ' + example.testString());
    Ti.API.warn('Test dictionary: ' + JSON.stringify(example.testDictionary()));
    Ti.API.warn('Test array: ' + example.testArray());
    Ti.API.warn('Test null: ' + example.testNull());
});

win.add(btn);
win.open();
