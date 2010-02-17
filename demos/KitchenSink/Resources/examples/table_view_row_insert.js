var win = Titanium.UI.currentWindow;

// create table view data
var data = [
	{title:'Insert Row Above - 1', header:'Section 0'},
	{title:'Row2'},
	{title:'Insert Row Below - 1', name:'3'},
	{title:'Row4'},
	{title:'Row5'},
	{title:'Row6'},
	{title:'Insert Row Below - 2', name:'7'},
	{title:'Row8',header:'Section 1'},
	{title:'Row9'},
	{title:'Row10'},
	{title:'Row11'},
	{title:'Row12'},
	{title:'Row13'},
	{title:'Row14'},
	{title:'Row15'},
	{title:'Insert Row w/o animation'},
	{title:'Insert Row w/o animation (below)'}
];

//
// Create table view
//
var tableView = Titanium.UI.createTableView({data:data});

tableView.addEventListener('click', function(e)
{
	Titanium.UI.createAlertDialog({title:'Row Click', message:'You clicked ' + e.rowData.title}).show();
	
	switch(e.rowData.title)
	{
		case 'Insert Row Above - 1':
		{
			var data = {title:'New First Row'};
			tableView.insertRowBefore(0,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});				
			break;
		}
		case 'Insert Row w/o animation':
		{
			var data = {title:'New First Row w/o animation'};
			tableView.insertRowBefore(0,data);
			tableView.scrollToIndex(0);
			break;
		}
		case 'Insert Row Below - 1':
		{
			var row = tableView.getIndexByName('3');
			data = {title:'New Row After Row3', header:'New Header'};
			tableView.insertRowAfter(row,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
			break;
		}
		case 'Insert Row Below - 2':
		{
			var row = tableView.getIndexByName('7');
			data = {title:'New Row After Row7'};
			tableView.insertRowAfter(row,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});

			break;
		}
		
		case 'Insert Row w/o animation (below)':
		{
			var row = tableView.getIndexByName('3');
			data = {title:'New Row After Row3 w/o animation', header:'New Header'};
			tableView.insertRowAfter(row,data);
			tableView.scrollToIndex(3);
			break;
		}
	}
	
});

win.add(tableView);