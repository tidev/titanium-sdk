function view_hideshow(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	var mainView = Ti.UI.createView({
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		layout: 'vertical'
	});
	
	win.add(mainView);
	
	var tabbedBar = Ti.UI.iOS.createTabbedBar({
		labels: ['Browse','Search'],
		backgroundColor: '#a4a4a4',
		style: Ti.UI.iPhone.SystemButtonStyle.BAR,
		height: 30,
		width: '94%',
		top: 5,
		index:1
	});
	mainView.add(tabbedBar);
	
	var choiceView = Ti.UI.createView({
		top: 0,
		left: 0,
		width: '100%',
		height: Ti.UI.FILL
	});
	mainView.add(choiceView);
	
	// set up browseView
	//
	var browseView = Ti.UI.createView({
		top: 0,
		left: 0,
		width: '100%',
		height: 300
	});
	browseView.hide();
	choiceView.add(browseView);
	
	var startOverLabel = Ti.UI.createLabel({
		text: 'start over',
		font: {fontSize: 16},
		color: 'blue',
		left: 10,
		top: 10,
		height: Ti.UI.SIZE,
		width: Ti.UI.SIZE
	});
	browseView.add(startOverLabel);
	
	
	var goBackLabel = Ti.UI.createLabel({
		text: 'go back',
		font: {fontSize: 16},
		color: 'blue',
		left: 100,
		top: 10,
		height: Ti.UI.SIZE,
		width: Ti.UI.SIZE
	});
	browseView.add(goBackLabel);
	
	var searchView = Ti.UI.createView({
		top: 0,
		left: 0,
		width: '100%',
		height: 270
	});
	choiceView.add(searchView);
	
	// searchBox
	var searchBox = Ti.UI.createTextField({
		value: 'search',
		clearOnEdit: true,
		hintText: 'Enter search terms',
		height: 30,
		left: 10,
		top: 10,
		right: 10,
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		clearButtonMode: Ti.UI.INPUTMODE_ALWAYS
	});
	searchView.add(searchBox);
	
	var searchButton = Ti.UI.createButton({
		title: 'Search',
		color: 'black',
		left: 10,
		right: 10,
		top: 50,
		width: '94%',
		height: 30
	});
	searchView.add(searchButton);
	
	tabbedBar.addEventListener('click',function(e) {
		switch(e.index) {
			case 0: // browse
				searchBox.blur();
				searchView.hide();
				browseView.show();
				break;
			case 1: // search
				browseView.hide();
				searchView.show();
				break;	
		}
	});
	return win;
};

module.exports = view_hideshow;