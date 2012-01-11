var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';
/*
var data = [{title:'This is row #1',backgroundColor:'blue', fontStyle: 'italic'},
			{title:'This is row #2',fontSize:15},
			{title:'This is row #3'},
			{title:'This is row #4'},
			{title:'This is row #5'}];
*/

var row1 = Ti.UI.createTableViewRow({
	title: 'row 1',
	backgroundColor: 'blue',
	fontStyle:'italic'
});
var row2 = Ti.UI.createTableViewRow({
	title: 'row 2',
	fontSize: 15
});
var row3 = Ti.UI.createTableViewRow({
	title: 'row 3'
});
var row4 = Ti.UI.createTableViewRow({
	title: 'row 4'
});
var row5 = Ti.UI.createTableViewRow({
	title: 'row 5'
});

var data = [row1, row2, row3, row4, row5];

var tableView = Ti.UI.createTableView({
	width: 300,
	height: 200,
	top: 70,
	left: 10,
	backgroundColor: '#AAA',
	data:data
});

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:50,
	width:140,
	fontSize: 16,
	top:10,
	left:90
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});



win.add(closeButton);
win.add(tableView);
