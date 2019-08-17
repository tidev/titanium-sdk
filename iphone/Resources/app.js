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
    title: 'Titanium rocks!',
    top: 100
});

btn.addEventListener('click', function() {
    alert('Hello world!');
});

win.add(Ti.UI.createImageView({
    image: 'example.png',
    top: 200
}))

win.add(btn);
win.open();
