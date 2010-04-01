var win = Titanium.UI.currentWindow;

var data = "abcdefg";
var encoded = Ti.Utils.base64encode(data);
win.add(Ti.UI.createLabel({
	top: 5,
	width: 'auto', height: 'auto',
	text: "base64 encode " + data + " => " + encoded
}));

win.add(Ti.UI.createLabel({
	top: 75,
	width: 'auto', height: 'auto',
	text: "base64 decode " + encoded + " => " + data + ", should be true: " + (Ti.Utils.base64decode(encoded)==data)
}));

win.add(Ti.UI.createLabel({
	top: 145,
	width: 'auto', height: 'auto',
	text: "md5 checksum " + data + " => " + Ti.Utils.md5HexDigest(data)
}));

win
