var win = Titanium.UI.currentWindow;

var l1 = Titanium.UI.createLabel({
	id:'font_label_test',
	text:'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
//	width:200,
	height:150,
	top:10,
	color:'#336699',
	textAlign:'center'
});

win.add(l1);

var l2 = Titanium.UI.createLabel({
	id:'label_two',
	text:'Appcelerator',
	shadowColor:'#aaa',
	shadowOffset:{x:5,y:5},
});

win.add(l2);

var b1 = Titanium.UI.createButton({
	title:'Hide/Show',
	height:40,
	width:200,
	top:230
});
var visible=true;
b1.addEventListener('click', function()
{
	if (visible)
	{
		l1.hide();
		l2.hide();
	}
	else
	{
		l1.show();
		l2.show();
	}
	visible = !visible;
});
win.add(b1);

var b2 = Titanium.UI.createButton({
	title:'Change Label 2',
	height:40,
	width:200,
	top:280
});
var changed=false;
b2.addEventListener('click', function()
{
	l2.fontStyle   = (!changed) ? 'normal'  : 'italic';
	l2.fontSize    = (!changed) ? 20 : 48;
	l2.shadowColor = (!changed) ? '#336699' : '#aaa';
	l2.color       = (!changed) ? '#ff9900' : '#900';
	
	changed = !changed;
	size.text = l2.size.height + ' ' + l2.size.width;
});
win.add(b2);

var b3 = Titanium.UI.createButton({
	title:'Label 1 background',
	height:40,
	width:200,
	top:330
});
var bg = false;
b3.addEventListener('click', function()
{
	if (!bg) {
		l1.backgroundPaddingLeft = 10;
		l1.backgroundPaddingRight = 10;
		l1.backgroundPaddingTop = 10;
		l1.backgroundPaddingBottom = 10;
		l1.backgroundImage = '../images/chat.png';
		bg = true;
	}
	else {
		l1.backgroundImage = null;
		bg = false;
	}
});
win.add(b3);

var size = Ti.UI.createLabel({
	height:30,
	width:300,
	font:{fontSize:14},
	color:'#777',
	bottom:10
});
win.add(size);
