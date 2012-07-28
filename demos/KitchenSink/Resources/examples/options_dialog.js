var win = Titanium.UI.currentWindow;

win.orientationModes = [
	Titanium.UI.PORTRAIT,
	Titanium.UI.LANDSCAPE_LEFT,
	Titanium.UI.LANDSCAPE_RIGHT
]; 

var isAndroid = Ti.Platform.osname == 'android';

if (isAndroid) {
	var showCancel = Ti.UI.createSwitch({
		style : Ti.UI.Android.SWITCH_STYLE_CHECKBOX,
		title: 'Show Cancel Button',
		top : 160
	});
	
	var applyButtons = function() 
	{
		if (showCancel.value) {
			dialog.buttonNames = [ 'Cancel'];
		} else {
			dialog.buttonNames = [];
		}
	};
}
//
// BASIC OPTIONS DIALOG
//

var optionsDialogOpts = {
	options:['Option 1', 'Option 2', 'Option 3'],
	destructive:1,
	cancel:2,
	title:'I am a title'
};

if (isAndroid) {
	optionsDialogOpts.selectedIndex = 3;
}

var dialog = Titanium.UI.createOptionDialog(optionsDialogOpts);

// add event listener
dialog.addEventListener('click',function(e)
{
	label.text = 'You selected ' + e.index;
	
	if (isAndroid) {
		if (e.button) {
			label.text += ' button';
		}  else {
			label.text += ' option';
		}
	}
});

// BUTTON TO SHOW BASIC DIALOG
var button1 = Titanium.UI.createButton({
	title:'Show Dialog 1',
	height:40,
	width:200,
	top:10
});
button1.addEventListener('click', function()
{
	if (isAndroid) {
		dialog.androidView = null;
		applyButtons();
	}
	dialog.show();
});

// BUTTON TO MODIFY DIALOG AND SHOW
var button2 = Titanium.UI.createButton({
	title:'Modify and Show Dialog',
	height:40,
	width:200,
	top:60
});
button2.addEventListener('click', function()
{
	dialog.title = 'I changed the title';
	dialog.options = ['New Option 1', 'New Option 2', 'New Option 3', 'New Option 4'];
	dialog.destructive = 0;
	dialog.cancel = 3;
	if (isAndroid) {
		dialog.androidView = null;
		applyButtons();
	}
	dialog.show();
});

// label that shows clicked option
var label = Titanium.UI.createLabel({
	text:'No selection' ,
	color:'#999',
	font:{
		fontFamily:'Helvetica Neue',
		fontSize:15
	},
	textAlign:'center',
	top:110,
	width:300
});

if (isAndroid) {
	// BUTTON TO MODIFY DIALOG TO USE A VIEW AND SHOW
	var button3 = Titanium.UI.createButton({
		title:'Modify and Show Dialog',
		height:40,
		width:200,
		top:220
	});
	button3.addEventListener('click', function()
	{
		// For now, you must give the containing view dimensions in order for it to appear.
		var root = Ti.UI.createView({});
		
		var view = Ti.UI.createView({
			width : 300, height: '100'
		});
		root.add(view);
		var l = Ti.UI.createLabel({
			text : 'I am a label',
			top: 10, left: 10, bottom: 10, right: 10,
			color : 'white',
			borderRadius : 10,
			backgroundColor : 'blue'
		}); 
		view.add(l);
		
		dialog.title = 'Android with a View';
		dialog.options = null;
		dialog.buttonNames = ['OK'];
		dialog.androidView = root;
		dialog.show();
	});
}

win.add(button1);
win.add(button2);
win.add(label);

if (isAndroid) {
	win.add(showCancel);
	win.add(button3);
}

if (!isAndroid) {
	var button4 = Titanium.UI.createButton({
		title:'Show w/hide, animated',
		height:40,
		width:200,
		top:250
	});
	
	button4.addEventListener('click', function()
	{
		if (isAndroid) {
			dialog.androidView = null;
			applyButtons();
		}
		dialog.show();
		setTimeout(function(){dialog.hide({animated:true});},2000);
	});
	
	var button5 = Titanium.UI.createButton({
		title:'Show w/hide, nonanimated',
		height:40,
		width:200,
		top:300
	});
	
	button5.addEventListener('click', function()
	{
		if (isAndroid) {
			dialog.androidView = null;
			applyButtons();
		}
		dialog.show();
		setTimeout(function(){dialog.hide({animated:false});},2000);
	});
	
	win.add(button4);
	win.add(button5);
}
