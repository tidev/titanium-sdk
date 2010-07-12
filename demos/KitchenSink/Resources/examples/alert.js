var win = Titanium.UI.currentWindow;

//
// GENERIC ALERT
//
var a = Titanium.UI.createAlertDialog({
	title:'Alert Test',
	message:'Hello World'
});

var l = Titanium.UI.createLabel({
	text:'I will tell you which alert buttons you clicked',
	textAlign:'center',
	bottom:80,
	color:'#336699',
	font:{fontSize:13},
	width:'auto',
	height:'auto'
});

a.addEventListener('click', function(e)
{
	l.text = 'You clicked ' + e.index;
});

//
// GENERIC LABEL
//
win.add(l);

//
// SIMPLE ALERT
//
var button1 = Titanium.UI.createButton({
	title:'Basic Alert',
	height:40,
	width:200,
	top:10
});

button1.addEventListener('click', function()
{
	a.buttonNames = null; // unset in case you did 2/3rd and then back to 1st
	a.message = 'One Button';
	a.show();
});

win.add(button1);

//
//  ALERT WITH 2 BUTTONS
//
var button2 = Titanium.UI.createButton({
	title:'Alert 2 Buttons',
	height:40,
	width:200,
	top:60
});

button2.addEventListener('click', function()
{
	a.message = 'Two Buttons';
	a.buttonNames = ['OK','Cancel'];
	a.cancel = 1;
	a.show();
	
});

win.add(button2);


//
//  ALERT WITH 4 BUTTONS
//
var button3 = Titanium.UI.createButton({
	title:'Alert 3 Buttons',
	height:40,
	width:200,
	top:110
});

button3.addEventListener('click', function()
{
	a.message = 'Three Buttons';
	a.buttonNames = ['One', 'Two','Three'];
	a.cancel = 1;
	a.show();
});

win.add(button3);


//
//  Double alert
//
var button4 = Titanium.UI.createButton({
	title:'Double Alert',
	height:40,
	width:200,
	top:160
});

button4.addEventListener('click', function()
{
	// test firing 2 alerts in a row, should show the
	// first and after you click OK, should then show the next
	alert("You should see this first");
	alert("Now you should see this one, assuming you dismissed the first alert");
});

win.add(button4);


//
//  Cancellable alert
//
var button5 = Titanium.UI.createButton({
	title:'Cancel Alert',
	height:40,
	width:200,
	top:210
});

button5.addEventListener('click', function()
{
	var a = Titanium.UI.createAlertDialog({
		title:'Alert Test',
		message:'You should see and it should hide automatically in about 2 seconds or when you suspend.'
	});
	a.show();
	setTimeout(function()
	{
		a.hide();
	},2000);
});

win.add(button5);


