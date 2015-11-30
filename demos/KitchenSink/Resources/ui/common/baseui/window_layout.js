function win_layout(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	win.backgroundColor = '#13386c';
	win.barColor = '#13386c';
	
	//
	//  CREATE FIELD ONE
	//
	var firstName = Titanium.UI.createLabel({
		color:'#000',
		text:'First Name',
		top:10,
		left:30,
		width:100,
		height:Ti.UI.SIZE
	});
	
	win.add(firstName);
	
	var firstNameField = Titanium.UI.createTextField({
		hintText:'enter first name',
		height:35,
		top:35,
		left:30,
		width:250,
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
	});
	
	win.add(firstNameField);
	
	//
	//  CREATE FIELD TWO
	//
	var lastName = Titanium.UI.createLabel({
		color:'#000',
		text:'Last Name',
		top:75,
		left:30,
		width:100,
		height:Ti.UI.SIZE
	});
	
	win.add(lastName);
	
	var lastNameField = Titanium.UI.createTextField({
		hintText:'enter last name',
		height:35,
		top:100,
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
		top:170,
		left:30,
		height:Ti.UI.SIZE,
		width:250
	});
	win.add(save);
	
	//
	//  CREATE INFO MESSAGE
	//
	var messageView = Titanium.UI.createView({
		bottom:10,
		backgroundColor:'#111',
		height:40,
		width:270,
		borderRadius:10
	});
	
	var messageLabel = Titanium.UI.createLabel({
		color:'#fff',
		text:'Register for a free toaster!',
		height:Ti.UI.SIZE,
		width:Ti.UI.SIZE,
		textAlign:'center'
	});
	
	messageView.add(messageLabel);
	
	win.add(messageView);
	return win;
};

module.exports = win_layout;
