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
    Ti.API.info('Hello world!');
        const url = "https://www.google.com/";
// above url have space after keyword google
    const client = Ti.Network.createHTTPClient({
        onload: function(e) {
            console.log("success");
        },
     
        onerror: function(e) {
            console.log("failure");
            console.error(e.error);
        },
    });
    client.open("GET", url);
    client.send();
});

win.add(btn);
win.open();
