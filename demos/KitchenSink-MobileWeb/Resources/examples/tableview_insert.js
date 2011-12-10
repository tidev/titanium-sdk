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

var insAftRow = Ti.UI.createButton({
	title: 'Insert row after',
	width: 140,
	top:5,
	height: 50,
	fontSize: 16,
	left: 10
});


var insBefRow = Ti.UI.createButton({
	title: 'Insert row before',
	width: 140,
	height: 50,
	fontSize: 16,
	top:5,
	left: 160
});

var updRow = Ti.UI.createButton({
	title: 'Update row',
	width: 140,
	height: 50,
	fontSize: 16,
	top:60,
	left: 10
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
	fontSize: 16,
	top:60,
	left:160
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});



win.add(closeButton);
win.add(tableView);
win.add(insAftRow);
win.add(insBefRow);
win.add(updRow);
win.add(tf1);
win.add(label1);




insAftRow.addEventListener('click', function(){
row = Ti.UI.createTableViewRow({title: 'Row after selected row'});	
tableView.insertRowAfter(parseInt(tf1.value)-1, row);
});

insBefRow.addEventListener('click', function(){
row = Ti.UI.createTableViewRow({title: 'Row before selected row'});	
tableView.insertRowBefore(parseInt(tf1.value)-1, row);
});

updRow.addEventListener('click', function(){
row = Ti.UI.createTableViewRow({title: 'Row updated'});	
tableView.updateRow(parseInt(tf1.value)-1,row);
});
