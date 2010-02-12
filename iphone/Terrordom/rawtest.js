var win = Titanium.UI.currentWindow;

var tableview = Titanium.UI.createTableView();

win.add(tableview);

// loop through rows that use the same layout
for (var i=0;i<20;i++)
{
	// create a table view row object
	var row = Titanium.UI.createTableViewRow();

	Ti.API.info('row ' + row)
	// custom row property
	row.foo = '123';
	row.title = 'Row #'+i;
    
	// create a button
	var button = Titanium.UI.createButton({
		right:5,
		height:50,
		width:100,
		title:'Foo ' + i
	});
	row.add(button);
	
	// create an image 
	var image = Titanium.UI.createView({
		backgroundImage:'images/chat.png',
		height:32,
		width:32,
		left:5
	});
//	row.add(image);
	
	var text = Titanium.UI.createLabel({
		text:'This is a title',
//		top:10,
		left:10,
//		height:20,
		width:100,
		color:'#700'
	});
	row.add(text);
	
	// create a row level event listener (support view events)
//	row.addEventListener('swipe', swipeHandler);
	
	// add row
	tableview.addRow(row);
}

