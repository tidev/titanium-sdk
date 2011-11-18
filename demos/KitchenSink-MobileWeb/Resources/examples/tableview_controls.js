var win = Ti.UI.currentWindow;
var clickLabel = Ti.UI.createLabel({
	top:0,
	height:'auto',
	textAlign:'center',
	font:{fontSize:13},
	color:'#777'
});
win.add(clickLabel);

function addRow()
{
	var row = Ti.UI.createTableViewRow({height:50});
	var sw = Ti.UI.createSwitch({
		right:10,
		value:false
	});

	row.add(sw);

	sw.addEventListener('change', function(e)
	{
		Ti.API.info('parent for switch ' + e.source.parent);
		clickLabel.text = 'Switch changed to ' + e.value + ' at ' + new Date();
	});

	var button = Ti.UI.createButton({
		style:Titanium.UI.iPhone.SystemButton.DISCLOSURE,
		left:10,
		top: 5,
		width: 50,
		height: 20,
		title: 'Button'
	});

	row.add(button);

	button.addEventListener('click', function(e)
	{
		clickLabel.text = 'Button clicked at ' + new Date();
	});
	row.className = 'control';
	return row;
}

// create table view data object
var data = [];

var row = Ti.UI.createTableViewRow({height:50});
var l = Ti.UI.createLabel({
	text:'Append Row',
	color:'#999',
	textAlign:'center'

});
row.add(l);
row.className = 'header';
row.addEventListener('click', function()
{
	tableView.appendRow(addRow());
});
data[0] = row;

for (var x=1;x<3;x++)
{
	data[x] = addRow();
}

var tableView = Ti.UI.createTableView({
	data:data,
	style: Titanium.UI.iPhone.TableViewStyle.GROUPED,
	top:50,
	width: 300,
	height: 300,
	left:10
});
tableView.addEventListener('click', function(e)
{
	clickLabel.text = 'row clicked at ' + new Date()+', source='+e.source;
});
win.add(tableView);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:360,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

win.add(closeButton);