var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';

var base64en = Ti.UI.createButton({
	title: 'encode base64',
	left: 100,
	top: 60,
	width: 120,
	height: 45
});

var base64de = Ti.UI.createButton({
	title: 'decode base64',
	left: 100,
	top: 110,
	width: 120,
	height: 45
});

var md5 = Ti.UI.createButton({
	title: 'get MD5 hash',
	left: 100,
	top: 160,
	width: 120,
	height: 45
});

var tf = Ti.UI.createTextField({
	value: 'text to encode',
	backgroundColor: 'white',
	left: 30,
	width:260,
	height:45,
	top: 5
})

var close = Ti.UI.createButton({
	title: 'Close',
	left: 100,
	top: 210,
	width: 120,
	height: 45
});

win.add(close);
win.add(base64en);
win.add(base64de);
win.add(md5);
win.add(tf);

close.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

base64en.addEventListener('click', function(){
	tf.value = Ti.Utils.base64encode(tf.value);
});

base64de.addEventListener('click', function(){
	tf.value = Ti.Utils.base64decode(tf.value);
});

md5.addEventListener('click', function(){
	tf.value = Ti.Utils.md5HexDigest(tf.value);
});

