var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';


var data = [{title:'This is row #1'},
			{title:'This is row #2'},
			{title:'This is row #3'},
			{title:'This is row #4'},
			{title:'This is row #5'}];

var tableView = Ti.UI.createTableView({
	width: 300,
	height: 200,
	top: 155,
	left: 10,
	backgroundColor: '#AAA',
	data:data
});

var selRow = Ti.UI.createButton({
	title: 'Select row',
	width: 140,
	fontSize: 16,
	top:5,
	height: 50,
	left: 10
});


var deselRow = Ti.UI.createButton({
	title: 'Deselect row',
	width: 140,
	fontSize: 16,
	height: 50,
	top:5,
	left: 160
});


var label1 = Ti.UI.createLabel({
	top: 115,
	left: 53,
	width: 100,
	height: 30,
	text: 'Row index:',
	
});


var tf1= Ti.UI.createTextField({
	width: 50,
	height: 30,
	top:115,
	backgroundColor:'white',
	left: 178,
	value: '1'
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:50,
	width:290,
	fontSize:16,
	top:60,
	left:10
});

win.add(closeButton);
win.add(tableView);
win.add(selRow);
win.add(deselRow);
win.add(tf1);
win.add(label1);

selRow.addEventListener('click', function(){
	tableView.selectRow(parseInt(tf1.value)-1);
});

deselRow.addEventListener('click', function(){
	tableView.deselectRow(parseInt(tf1.value)-1);
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});
