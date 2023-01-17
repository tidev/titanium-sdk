/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */

Ti.App.iOS.addEventListener('traitcollectionchange', event => {
	console.warn('Ti.App.iOS');
	console.warn(event);
});

Ti.UI.addEventListener('userinterfacestyle', event => {
	console.warn('Ti.UI');
	console.warn(event);
});

const win = Ti.UI.createWindow({
	backgroundColor: '#fff'
});

const btn = Ti.UI.createButton({
	title: 'Trigger'
});

btn.addEventListener('click', () => {
	const videoPlayer = Ti.Media.createVideoPlayer({
		url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
		fairPlayConfiguration: {
			certificate: '<cert>',
			callback: ({ spc }) => {
				return 'ckc'; // TODO: Fetch ASYNC
			}
		}
	});

    win.add(videoPlayer);
});

win.add(btn);
win.open();
