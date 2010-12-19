var win = Titanium.UI.currentWindow;
var scrollView = Titanium.UI.createScrollView({
	contentWidth:Ti.Platform.displayCaps.platformWidth,
	contentHeight:'auto',
	top:0,
	showVerticalScrollIndicator:true,
	showHorizontalScrollIndicator:true
});
win.add(scrollView);

var data = "abcdefg";
var encoded = Ti.Utils.base64encode(data);
scrollView.add(Ti.UI.createLabel({
	top: 5,
	textAlign:'left',
	width: Ti.Platform.displayCaps.platformWidth, 
	height: 'auto',
	text: "base64 encode " + data + " => " + encoded
}));

var encoded = Ti.Utils.base64decode(encoded.toString());

scrollView.add(Ti.UI.createLabel({
	top: 75,
	textAlign:'left',
	width: Ti.Platform.displayCaps.platformWidth, 
	height: 'auto',
	text: "base64 decode " + encoded + " => " + data + ", decoded: " + encoded.toString()
}));

scrollView.add(Ti.UI.createLabel({
	top: 145,
	textAlign:'left',
	width: Ti.Platform.displayCaps.platformWidth, 
	height: 'auto',
	text: "md5 checksum " + data + " => " + Ti.Utils.md5HexDigest(data)+", should be => 7ac66c0f148de9519b8bd264312c4d64"
}));

var s = " ♥Amanda22♥".toUpperCase();
scrollView.add(Ti.UI.createLabel({
	top: 235,
	textAlign:'left',
	width: Ti.Platform.displayCaps.platformWidth, 
	height: 'auto',
	text: "toUpper test => " +s
}));

var sha1 = Ti.Utils.sha1("abc");
scrollView.add(Ti.UI.createLabel({
	top: 285,
	textAlign:'left',
	width: Ti.Platform.displayCaps.platformWidth, 
	height: 'auto',
	text: "sha1 test => " +sha1 +" should be => a9993e364706816aba3e25717850c26c9cd0d89d: " + (sha1 == 'a9993e364706816aba3e25717850c26c9cd0d89d')
}));
