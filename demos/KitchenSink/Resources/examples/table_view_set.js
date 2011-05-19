//JGH: FIXME - remove HTML

var win = Titanium.UI.currentWindow;

var data = [
	{title:'Set 1 (no animation)', header:'Section 0'},
	{title:'Set 2'},
	{title:'Set 3'},
	{title:'Row4'},
	{title:'Row5'},
	{title:'Row6'},
	{title:'Row7'},
	{title:'Row8',header:'Section 1'},
	{title:'Row9'},
	{title:'Row10'},
	{title:'Row11'},
	{title:'Row12'},
	{title:'Row13'},
	{title:'Row14'},
	{title:'Row15'}	
];

//
// Create table view
//
var tableView = Titanium.UI.createTableView({data:data});

tableView.addEventListener('click',function(e)
{
	switch(e.index)
	{
		case 0:
			var data = [];
			for (var c=0;c<10;c++)
			{
				var row = Ti.UI.createTableViewRow();
				row.title = "Row "+ (c+1);
				row.hasCheck = true;
				row.backgroundColor = '#aaa';
				data[c]=row;
			}
			tableView.separatorStyle = Ti.UI.iPhone.TableViewSeparatorStyle.NONE;
			tableView.setData(data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.NONE});				
			break;
		case 1:
			var data = [
				{title:'Set TableView 1',hasDetail:true, image:'Phone.png'},
				{title:'Set TableView 2', hasChild:true, image:'Safari.png'},
				{title:'Set TableView 3', image:'iTunes.png'},
				{title:'Row 4', image:'Mail.png'},
				{title:'Row 5', image:'Mail.png'},
				{title:'Row 7', image:'Mail.png'}

			];
			tableView.separatorStyle = Ti.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE;
			tableView.separatorColor = null;
			tableView.setData(data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
			break;
		case 2:
			var data = [
				{title:'Set TableView 1'},
				{title:'Set TableView 2'},
				{title:'Set TableView 3'},
				{title:'Row 4'},
				{title:'Row 5'},
				{title:'Row 6'},
				{title:'Row 7'},
				{title:'Row 8'},
				{title:'Row 9'}

			];
			tableView.separatorStyle = Ti.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE;
			tableView.separatorColor = "red";
			tableView.setData(data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.UP});
			break;
	}
		
});

win.add(tableView);