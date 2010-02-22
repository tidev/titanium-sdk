var win = Titanium.UI.currentWindow;

var tf1 = Titanium.UI.createTextField({
	color:'#336699',
	height:35,
	top:10,
	left:10,
	width:250,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});

//
// TEXT FIELD EVENTS (return, focus, blur, change)
//
tf1.addEventListener('return',function(e)
{
	l.text = 'return received, val = ' + e.value;
	tf1.blur();
});
tf1.addEventListener('focus',function(e)
{
	l.text = 'focus received, val = ' + e.value;
});
tf1.addEventListener('blur',function(e)
{
	l.text = 'blur received, val = ' + e.value;	
});
tf1.addEventListener('change', function(e)
{
	l.text = 'change received, event val = ' + e.value + '\nfield val = ' + tf1.value;	
})

win.add(tf1);


var l = Titanium.UI.createLabel({
	top:50,
	left:10,
	width:300,
	height:'auto',
	color:'#777',
	height:'auto',
	font:{fontSize:13},
	text:'do something like click a button...'
});
win.add(l);

//
// FOCUS
//
var focus = Titanium.UI.createButton({
	top:100,
	height:40,
	width:200,
	title:'Focus'
});
win.add(focus);
focus.addEventListener('click', function()
{
	tf1.focus();
});

//
// BLUR
//
var blur = Titanium.UI.createButton({
	top:150,
	height:40,
	width:200,
	title:'Blur'
});
win.add(blur);
blur.addEventListener('click', function()
{
	tf1.blur();
});

//
// HIDE/SHOW
//
var showHide = Titanium.UI.createButton({
	top:200,
	height:40,
	width:200,
	title:'Hide/Show'
});
win.add(showHide);
var visible = true;
showHide.addEventListener('click', function()
{
	if (!visible)
	{
		tf1.show();
		visible = true;
	}
	else
	{
		tf1.hide();
		visible = false;
	}
});

