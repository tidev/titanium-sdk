var win = Ti.UI.currentWindow;
win.backgroundColor = '#EEE';

var tableView = Ti.UI.createTableView({
	width: 300,
	height: 200,
	top: 155,
	left: 10,
	backgroundColor: '#AAA'
});

var addRow = Ti.UI.createButton({
	title: 'Add row',
	width: 140,
	top:5,
	left: 10,
	height: 50,
	fontSize: 16
});

var delRow = Ti.UI.createButton({
	title: 'Delete row',
	width: 140,
	top:5,
	height: 50,
	left: 160,
	fontSize: 16
});
var fillTable = Ti.UI.createButton({
	title: 'Fill table',
	width: 140,
	height: 50,
	top:60,
	left: 10,
	fontSize: 16
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
	width:140,
	top:60,
	left:160,
	fontSize: 16
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});



win.add(closeButton);
win.add(fillTable);
win.add(tableView);
win.add(addRow);
win.add(delRow);
win.add(tf1);
win.add(label1);



var i = 1;
var newRow = function (){
	row = Ti.UI.createTableViewRow({
		title: 'This is row #' + i
	});
	i++;
};

addRow.addEventListener('click', function(){
	newRow();
	tableView.appendRow(row);
});

delRow.addEventListener('click', function(){
	tableView.deleteRow(parseInt(tf1.value)-1);
});


fillTable.addEventListener('click',function(){
	var data = [{title:'This is row #1'},
				{title:'This is row #2'},
				{title:'This is row #3'},
				{title:'This is row #4'},
				{title:'This is row #5'}];
	i=6;
	tableView.setData(data);
});



