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
	font:{fontSize:24},
	width:'auto',
	height:'auto'
});

a.addEventListener('click', function(e)
{
	if (Ti.Platform.osname === 'android' && a.buttonNames === null) {
		l.text = '(There was no button to click)';
	} else {
		l.text = 'You clicked ' + e.index;
	}
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
	height:50,
	width:200,
	top:10
});

button1.addEventListener('click', function()
{
	a.buttonNames = null; // unset in case you did 2/3rd and then back to 1st
	if (Ti.Platform.osname === 'android') {
		a.message = 'Basic Alert';
	} else {
		a.message = 'One Button';
	}
	a.show();
});

win.add(button1);

//
//  ALERT WITH 2 BUTTONS
//
var button2 = Titanium.UI.createButton({
	title:'Alert 2 Buttons',
	height:50,
	width:200,
	top:70
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
	height:50,
	width:200,
	top:130
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
	height:50,
	width:200,
	top:190
});

button4.addEventListener('click', function()
{
	// test firing 2 alerts in a row, should show the
	// first and after you click OK, should then show the next
	var a = Titanium.UI.createAlertDialog({
		title:'Double Alert',
		message:"You should see this first",
		buttonNames: ['OK']
	});
	a.addEventListener('click', function(e) {
		alert("Now you should see this one, assuming you dismissed the first alert");
	});
	a.show();
});

win.add(button4);


//
//  Cancellable alert
//
var button5 = Titanium.UI.createButton({
	title:'Cancel Alert',
	height:50,
	width:200,
	top:250
});

button5.addEventListener('click', function()
{
	var a = Titanium.UI.createAlertDialog({
		title:'Alert Test',
		message:'You should see and it should hide automatically in about 3 seconds or when you suspend.'
	});
	a.show();
	setTimeout(function()
	{
		a.hide();
	},3000);
});

win.add(button5);


