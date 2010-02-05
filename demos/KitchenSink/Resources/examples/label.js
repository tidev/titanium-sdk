var win = Titanium.UI.currentWindow;

var l1 = Titanium.UI.createLabel({
	text:'I am a really long piece of text that should wrap. I really love you and you know that. Go Navy!',
	width:200,
	height:200,
	top:40
});

win.add(l1);

var l1 = Titanium.UI.createLabel({
	text:'Appcelerator',
	height:200,
	left:0,
	right:0,
	shadowColor:'#aaa',
	shadowOffset:{x:2,y:2},
	color:'#900',
	font:{fontSize:48},
	bottom:10
});

win.add(l1);