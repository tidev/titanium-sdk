/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */


var win = Ti.UI.createWindow({
    backgroundColor: 'green',
    translucent:  true,
   barColor: 'transparent',
    extendEdges: [
        Ti.UI.EXTEND_EDGE_TOP
    ],
    barImage: 'transparent.png',
    hideShadow: true
});

var navWindow = Ti.UI.createNavigationWindow({
//   barColor: '#182426',
    window: win
});

var btn = Ti.UI.createButton({
    title: 'Trigger'
});

btn.addEventListener('click', function() {
    Ti.API.info('Hello world!');
});

win.add(btn);
navWindow.open();
