var win = Titanium.UI.currentWindow;
win.backgroundColor = '#13386c';
win.barColor = '#13386c';

//
//  CREATE FIELD ONE
//
var firstName = Titanium.UI.createLabel({
	color:'#fff',
	text:'First Name',
	top:10,
	left:30,
	width:300,
	height:'auto',
	font:{
		fontSize: 24	
	}
});

win.add(firstName);

var firstNameField = Titanium.UI.createTextField({
	hintText:'enter first name',
	height:35,
	top:50,
	left:30,
	width:250,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});

win.add(firstNameField);

//
//  CREATE FIELD TWO
//
var lastName = Titanium.UI.createLabel({
	color:'#fff',
	text:'Last Name',
	top:90,
	left:30,
	width:300,
	height:'auto',
	font:{
		fontSize: 24	
	}
});

win.add(lastName);

var lastNameField = Titanium.UI.createTextField({
	hintText:'enter last name',
	height:35,
	top:130,
	left:30,
	width:250,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});

win.add(lastNameField);

//
// CREATE BUTTON
//
var save = Titanium.UI.createButton({
	title:'Save my Information',
	top:200,
	left:30,
	height:50,
	width:250,
	font: {
		fontSize:18	
	}
});
win.add(save);

//
//  CREATE INFO MESSAGE
//
var messageView = Titanium.UI.createView({
	bottom:10,
	backgroundColor:'#111',
	height:50,
	width:350,
	borderRadius:10
});

var messageLabel = Titanium.UI.createLabel({
	color:'#fff',
	text:'Register for a free toaster!',
	height:'auto',
	width:'auto',
	textAlign:'center',
	font: {
		fontSize:24	
	}
});

messageView.add(messageLabel);

win.add(messageView);
