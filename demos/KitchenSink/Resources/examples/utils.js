var win = Titanium.UI.currentWindow;

var data = "abcdefg";
var encoded = Ti.Utils.base64encode(data);
win.add(Ti.UI.createLabel({
	top: 5,
	width: 'auto', height: 'auto',
	text: "base64 encode " + data + " => " + encoded
}));

var encoded = Ti.Utils.base64decode(encoded.toString());

win.add(Ti.UI.createLabel({
	top: 75,
	width: 'auto', height: 'auto',
	text: "base64 decode " + encoded + " => " + data + ", decoded: " + encoded.toString()
}));

win.add(Ti.UI.createLabel({
	top: 145,
	width: 'auto', height: 'auto',
	text: "md5 checksum " + data + " => " + Ti.Utils.md5HexDigest(data)
}));

var s = " ♥Amanda22♥".toUpperCase();
win.add(Ti.UI.createLabel({
	top: 215,
	width: 'auto', height: 'auto',
	text: "toUpper test => " +s
}));
