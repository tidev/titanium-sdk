function tv_row_insert(_args) {
	var isTizen = Titanium.Platform.name === 'tizen',
		win = Titanium.UI.createWindow({
			title:_args.title
		});
	
	// create table view data
	var data = [
		{title:'Insert Row Above (no anim)', header:'Section 0'},
		{title:'Row2'},
		{title:'Insert Row Below - 1', name:'3'},
		{title:'Row4'},
		{title:'Row5'},
		{title:'Row6'},
		{title:'Insert Row Below - 2', name:'7'},
		{title:'Insert Row Above - Header - 1', name:'8', header:'Section 1'},
		{title:'Row9'},
		{title:'Insert Row Above - Header - 2', name:'10'},
		{title:'Row11'},
		{title:'Row12'},
		{title:'Insert Row Below - Header', name:'13'},
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
		// In order to get a row, we use "e.index" instead of "getIndexByName" which is
		// not available in Titanium API.
		var rowIndex = e.index;
		
		switch(e.rowData.title)
		{
			case 'Insert Row Above (no anim)':
				var row = Ti.UI.createTableViewRow(),
					label = Ti.UI.createLabel({text:'New Row Object Row'});
				row.add(label);
				tableView.insertRowBefore(0,row);
				break;
			case 'Insert Row Below - 1':
				data = {title:'New Row After Row3'};
				isTizen ? tableView.insertRowAfter(rowIndex, data) : tableView.insertRowAfter(rowIndex, data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});	
				break;
			case 'Insert Row Below - 2':
				data = {title:'New Row After Row7'};
				isTizen ? tableView.insertRowAfter(rowIndex, data) : tableView.insertRowAfter(rowIndex, data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
				break;
			case 'Insert Row Above - Header - 1':
				data = {title:'New row before row 8', header:'Before header (1)'};
				isTizen ? tableView.insertRowBefore(rowIndex, data) : tableView.insertRowBefore(rowIndex, data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});	
				break;
			case 'Insert Row Above - Header - 2':
				data = {title:'New row before row 10', header:'Before header (2)'};
				if (isTizen) {
					tableView.insertRowBefore(rowIndex, data);
					tableView.scrollToIndex(10);
				} else {
					tableView.insertRowBefore(rowIndex, data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
					tableView.scrollToIndex(10, {position:Titanium.UI.iPhone.TableViewScrollPosition.MIDDLE,animated:true});
				}
				break;
			case 'Insert Row Below - Header':
				data = {title:'New row after row 13', header:'After header'};
				isTizen ? tableView.insertRowAfter(rowIndex, data) : tableView.insertRowAfter(rowIndex, data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
				break;
			case 'Insert Row w/o animation (below)':
				data = {title:'New Row After Row3 w/o animation'};
				tableView.insertRowAfter(rowIndex, data);
				isTizen ? tableView.scrollToIndex(3) : tableView.scrollToIndex(3, {position:Titanium.UI.iPhone.TableViewScrollPosition.MIDDLE,animated:false});
				break;
		}
	
	}); 
	win.add(tableView);
	return win;
};

module.exports = tv_row_insert;