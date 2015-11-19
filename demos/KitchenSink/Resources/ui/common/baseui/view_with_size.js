function viewsize(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	// this test should test that we have a red 100x100 view in the 
	// center of the screen by using the size property to set it
	
	var view = Ti.UI.createView({
		width:100,
		height:100,
		backgroundColor:"red"
	});
	
	
	win.add(view);
	
	var label = Ti.UI.createLabel({
		text:"Should be 100x100 red square in center",
		textAlign:"center",
		width:"auto",
		height:"auto",
		top:20
	});
	
	win.add(label);
	
	
	var button = Ti.UI.createButton({
	    title:"Change Size",
	    width:120,
	    height:40,
	    bottom:20
	});
	win.add(button);
	
	button.addEventListener('click',function() {
		if(Ti.Platform.osname !== 'tizen') {
	    	view.updateLayout({width:150,height:150});
	    } else {
	    	// It is impossible to use "updateLayout",
			// because there is a bug (https://jira.appcelerator.org/browse/TIMOB-10427)
	    	view.width = view.height = 150;
	    }
	    label.text = "Box should now be 150x150";
	});
	return win;
};

module.exports = viewsize;