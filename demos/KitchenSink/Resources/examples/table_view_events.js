var win = Ti.UI.currentWindow;

var statusBox = Ti.UI.createView({
	top:0,
	height:100,
	layout:'vertical'
});

var tvLabel = Ti.UI.createLabel({
	text:'Table View',
	height:15,
	color:'#999',
	font:{fontSize:11}
});
statusBox.add(tvLabel);

var tv2Label = Ti.UI.createLabel({
	text:'Table View Swipe/Dblclick',
	height:15,
	color:'#999',
	font:{fontSize:11}
});
statusBox.add(tv2Label);

var rowLabel = Ti.UI.createLabel({
	text:'Row',
	height:15,
	color:'#999',
	font:{fontSize:11}
});
statusBox.add(rowLabel);

var imageLabel = Ti.UI.createLabel({
	text:'Image',
	height:15,
	color:'#999',
	font:{fontSize:11}
});
statusBox.add(imageLabel);

var labelLabel = Ti.UI.createLabel({
	text:'Label',
	height:15,
	color:'#999',
	font:{fontSize:11}
});
statusBox.add(labelLabel);

var buttonLabel = Ti.UI.createLabel({
	text:'Button',
	height:15,
	color:'#999',
	font:{fontSize:11}
});
statusBox.add(buttonLabel);

win.add(statusBox);

var tableView = Ti.UI.createTableView({top:100});
tableView.addEventListener('click', function(e)
{
	tvLabel.text = 'table view clicked source ' + e.source;
});
tableView.addEventListener('swipe', function(e)
{
	tv2Label.text = 'table view swipe at ' + new Date().getSeconds();
});
tableView.addEventListener('dblckick', function(e)
{
	tv2Label.text = 'table view dblclick at '  +new Date().getSeconds();
});
win.add(tableView);

var rows = [];
for (var i=0;i<10;i++)
{
	var row = Ti.UI.createTableViewRow({
		height:'auto'
	});
	row.addEventListener('click', function(e)
	{
		rowLabel.text = 'row clicked on row ' + e.index+' at ' + new Date().getSeconds();
	});
	
	var imageView = Ti.UI.createImageView({
		image:'../images/apple_logo.jpg',
		left:0,
		width:30
	});
	imageView.row = i;
	imageView.addEventListener('click', function(e)
	{
		imageLabel.text = 'image clicked on row ' + e.source.row+' at ' + new Date().getSeconds();
	});
	row.add(imageView);

	var label = Ti.UI.createLabel({
		text:'text label',
		left:40,
		width:100
	});
	label.row = i;
	label.addEventListener('click', function(e)
	{
		labelLabel.text = 'label clicked on row ' + e.source.row+' at ' + new Date().getSeconds();
	});
	row.add(label);
	
	var button = Ti.UI.createButton({
		title:'button',
		right:10,
		width:100
	});
	button.row = i;
	button.addEventListener('click', function(e)
	{
		buttonLabel.text = 'button clicked on row ' + e.source.row +' at ' + new Date().getSeconds();
	});
	row.add(button);
	
	rows[i] = row;	
}

tableView.setData(rows);