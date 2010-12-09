var win = Titanium.UI.currentWindow;

var tf1 = Titanium.UI.createTextField({
	color:'#336699',
	top:10,
	left:10,
	width:250,
	height:40,
	hintText:'hintText',
	keyboardType:Titanium.UI.KEYBOARD_DEFAULT,
	returnKeyType:Titanium.UI.RETURNKEY_DEFAULT,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});
tf1.addEventListener('return', function()
{
	tf1.blur();
});

win.add(tf1);

var b1 = Titanium.UI.createButton({
	title:'Enabled',
	height:40,
	width:145,
	left:10,
	top:55
});
b1.addEventListener('click', function()
{
	Ti.API.info('enabled ' + tf1.enabled);
	tf1.enabled = (tf1.enabled)?false:true;
});
win.add(b1);

var b2 = Titanium.UI.createButton({
	title:'Background Image',
	height:40,
	width:145,
	right:10,
	top:55
});
var bgi = 0;
b2.addEventListener('click', function()
{
	switch (bgi) {
		case 0:
			Ti.API.info('No cap');
			tf1.backgroundLeftCap = 0;
			tf1.backgroundTopCap = 0;
			tf1.backgroundImage = '../images/chat.png';
			bgi++;
			break;
		case 1:
			Ti.API.info('Capped');
			tf1.backgroundLeftCap = 12;
			tf1.backgroundTopCap = 9;
			bgi++;
			break;
		case 2:
			tf1.backgroundImage = null;
			tf1.borderStyle = Titanium.UI.INPUT_BORDERSTYLE_ROUNDED;
			bgi=0;
			break;
	}
	Ti.API.info('backgroundImage ' + tf1.backgroundImage);
});
win.add(b2);

tf1.autocorrect = true; // Need to specify an absolute value or we're at the mercy of iOS' default (and maybe android's)
var b3 = Titanium.UI.createButton({
	title:'Autocorrect',
	height:40,
	width:145,
	left:10,
	top:105
});
b3.addEventListener('click', function()
{
	Ti.API.info('autocorrect ' + tf1.autocorrect);
	tf1.autocorrect = (tf1.autocorrect)?false:true;
});
win.add(b3);

var b4 = Titanium.UI.createButton({
	title:'Clear on Edit',
	height:40,
	width:145,
	right:10,
	top:105
});
b4.addEventListener('click', function()
{
	Ti.API.info('clearOnEdit ' + tf1.clearOnEdit);
	tf1.clearOnEdit = (tf1.clearOnEdit)?false:true;
});
win.add(b4);

var b5 = Titanium.UI.createButton({
	title:'Password Mask',
	height:40,
	width:145,
	left:10,
	top:155
});
b5.addEventListener('click', function()
{
	Ti.API.info('passwordMask ' + tf1.passwordMask);
	tf1.passwordMask = (tf1.passwordMask)?false:true;
});
win.add(b5);

tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE;
var b6 = Titanium.UI.createButton({
	title:'Capital (none)',
	height:40,
	width:145,
	right:10,
	top:155
});
var auto = 1;
b6.addEventListener('click', function()
{
	Ti.API.info('autocapitalization ' + tf1.autocapitalization);

	switch (auto)
	{
		case 0:
		{
			tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE;
			b6.title = 'Capital (none)';
			auto++;
			break;
		}
		case 1:
		{
			tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_WORDS;
			b6.title = 'Capital (words)';
			auto++;
			break;
		}
		case 2:
		{
			tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_SENTENCES;
			b6.title = 'Capital (sent.)';
			auto++;
			break;
		}
		case 3:
		{
			tf1.autocapitalization = Titanium.UI.TEXT_AUTOCAPITALIZATION_ALL;
			b6.title = 'Capital (all)';
			auto=0;
			break;
		}
	}
});
win.add(b6);

var b7 = Titanium.UI.createButton({
	title:'Clear Button',
	height:40,
	width:145,
	left:10,
	top:205
});
var clear =0;
b7.addEventListener('click', function()
{
	Ti.API.info('clearButtonMode ' + tf1.clearButtonMode);

	switch (clear)
	{
		case 0:
		{
			tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_ALWAYS;
			b7.title = 'Clear Button (A)';
			clear++;
			break;
		}
		case 1:
		{
			b7.title = 'Clear Button (N)';
			tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_NEVER;
			clear++;
			break;
		}
		case 2:
		{
			b7.title = 'Clear Button (F)';
			tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_ONFOCUS;
			clear++;
			break;
		}
		case 3:
		{
			b7.title = 'Clear Button (B)';
			tf1.clearButtonMode = Titanium.UI.INPUT_BUTTONMODE_ONBLUR;
			clear=0;
			break;
		}
	}
});
win.add(b7);

var b8 = Titanium.UI.createButton({
	title:'Text Align',
	height:40,
	width:145,
	right:10,
	top:205
});
var align =0;
b8.addEventListener('click', function()
{
	switch (align)
	{
		case 0:
		{
			tf1.textAlign = 'left';
			tf1.value = 'text align left, marker 10 bold';
			tf1.font = {fontSize:10,fontFamily:'Marker Felt', fontWeight:'bold'};
			align++;
			break;
		}
		case 1:
		{
			tf1.textAlign = 'center';
			tf1.value = 'text align center, arial 12';
			tf1.font = {fontSize:12,fontFamily:'Arial', fontWeight:'normal'};
			align++;
			break;
		}
		case 2:
		{
			tf1.textAlign = 'right';
			tf1.value = 'text align right, hel 14';
			tf1.font = {fontSize:14,fontFamily:'Helvetica', fontWeight:'bold'};
			align=0;
			break;
		}
	}
});
win.add(b8);

var b8 = Titanium.UI.createButton({
	title:'Vertical Align',
	height:40,
	width:145,
	left:10,
	top:255
});
var vAlign =0;
b8.addEventListener('click', function()
{
	switch (vAlign)
	{
		case 0:
		{
			tf1.verticalAlign = 'top';
			b8.title = 'Vertical Align (T)';
			vAlign++;
			break;
		}
		case 1:
		{
			tf1.verticalAlign = 'middle';
			b8.title = 'Vertical Align (M)';
			vAlign++;
			break;
		}
		case 2:
		{
			tf1.verticalAlign = 'bottom';
			b8.title = 'Vertical Align (B)';
			vAlign=0;
			break;
		}

	}
});
win.add(b8);

var b9 = Titanium.UI.createButton({
	title:'Allow resizing',
	height:40,
	width:145,
	right:10,
	top:255
});

var resizing = false;
b9.addEventListener('click', function()
{
	if (!resizing) {
		tf1.minimumFontSize = 8;
		resizing = true;
	}
	else {
		tf1.minimumFontSize = 0;
		resizing = false;
	}
});
win.add(b9);

var l = Titanium.UI.createLabel({
	text:'Click buttons to toggle properties',
	left:10,
	top:305,
	color:'#777',
	width:'auto',
	height:'auto'
});

win.add(l);