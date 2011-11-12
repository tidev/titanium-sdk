var win = Titanium.UI.currentWindow;

var search = Titanium.UI.createSearchBar({
	barColor:'#000',
	showCancel:true,
	height:43,
	top:0,
	softKeyboardOnFocus: Titanium.UI.Android.SOFT_KEYBOARD_SHOW_ON_FOCUS
});

win.add(search);

// dynamically set value
search.value = 'foo';

//
// FOCUS
//
var b1 = Titanium.UI.createButton({
	title:'Focus Search Bar',
	height:40,
	width:200,
	top:60
});
win.add(b1);
b1.addEventListener('click', function()
{
	search.focus();
});

//
// BLUR
//
var b2 = Titanium.UI.createButton({
	title:'Blur Search Bar',
	height:40,
	width:200,
	top:110
});
win.add(b2);
b2.addEventListener('click', function()
{
	search.blur();
});

//
// TOGGLE CANCEL BUTTON
//
var b3 = Titanium.UI.createButton({
	title:'Toggle Cancel',
	height:40,
	width:200,
	top:160
});
win.add(b3);
b3.addEventListener('click', function()
{
	search.showCancel = (search.showCancel === true)?false:true;
});

//
// CHANGE THE VALUE
//
var b4 = Titanium.UI.createButton({
	title:'Change Value',
	height:40,
	width:200,
	top:210
});
win.add(b4);
b4.addEventListener('click', function()
{
	search.value = 'I have changed';
});

//
// HIDE/SHOW
//
var b5 = Titanium.UI.createButton({
	title:'Hide/Show',
	height:40,
	width:200,
	top:260
});
win.add(b5);
var visible = true;
b5.addEventListener('click', function()
{
	if (!visible)
	{
		search.show();
		visible=true;
	}
	else
	{
		search.hide();
		visible=false;
	}
});

//
// SEARCH BAR EVENTS
//
search.addEventListener('change', function(e)
{
	Titanium.API.info('search bar: you type ' + e.value + ' act val ' + search.value);

});
search.addEventListener('cancel', function(e)
{
	Titanium.API.info('search bar cancel fired');
	search.blur();
});
search.addEventListener('return', function(e)
{
	Titanium.UI.createAlertDialog({title:'Search Bar', message:'You typed ' + e.value, buttonNames:['OK'] }).show();
	search.blur();
});
search.addEventListener('focus', function(e)
{
	Titanium.API.info('search bar: focus received');
});
search.addEventListener('blur', function(e)
{
	Titanium.API.info('search bar:blur received');
});
