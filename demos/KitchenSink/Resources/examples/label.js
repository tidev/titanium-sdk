var win = Titanium.UI.currentWindow;

var l1 = Titanium.UI.createLabel({
	text:'I am a really long piece of text that should wrap. I really love you and you know that. Go Navy!',
	width:200,
	height:200
});

win.add(l1);