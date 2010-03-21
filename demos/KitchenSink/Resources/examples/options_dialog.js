var win = Titanium.UI.currentWindow;

//
// BASIC OPTIONS DIALOG
//
var dialog = Titanium.UI.createOptionDialog({
	options:['Option 1', 'Option 2', 'Option 3'],
	destructive:2,
	cancel:1,
	title:'I am a title'
});

// add event listener
dialog.addEventListener('click',function(e)
{
	label.text = 'You selected ' + e.index;
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
	dialog.cancel = 1;
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

win.add(button1);
win.add(button2);
win.add(label);

