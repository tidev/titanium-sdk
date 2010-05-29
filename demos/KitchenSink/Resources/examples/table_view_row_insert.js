var win = Titanium.UI.currentWindow;

// create table view data
var data = [
	{title:'Insert Row Above (no anim)', header:'Section 0'},
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
	{title:'Insert Row w/o animation (below)'}
];

//
// Create table view
//
var tableView = Titanium.UI.createTableView({data:data});

tableView.addEventListener('click', function(e)
{
	
	switch(e.rowData.title)
	{
		case 'Insert Row Above (no anim)':
		{
			var row = Ti.UI.createTableViewRow();
			var label = Ti.UI.createLabel({text:'New Row Object Row'});
			row.add(label)
			tableView.insertRowBefore(0,row);				
			break;
		}
		case 'Insert Row Below - 1':
		{
			var row = tableView.getIndexByName('3');
			data = {title:'New Row After Row3'};
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
			data = {title:'New Row After Row3 w/o animation'};
			tableView.insertRowAfter(row,data);
			tableView.scrollToIndex(3,{position:Titanium.UI.iPhone.TableViewScrollPosition.MIDDLE,animated:false});
			break;
		}
	}
	
});

win.add(tableView);
