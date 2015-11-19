function tv_row_update(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	// create table view data
	var data = [
		{title:'Change Me (No Anim)', header:'Section 0'},
		{title:'Change Me', name:'row2'},
		{title:'Change Me'},
		{title:'Change Me'},
		{title:'Click to go title (above)'},
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
	
	var isMW = Ti.Platform.osname === 'mobileweb',
		isTizen = Ti.Platform.osname === 'tizen';
	
	//
	// Create table view
	//
	var tableView = Titanium.UI.createTableView({data:data});
	tableView.addEventListener('click',function(e)
	{
		switch(e.index)
		{
			case 0:
				var data = {title:'New Row 1 Title', header:'New Section Header'};
				tableView.updateRow(0,data);				
				break;
			case 1:
				data = {title:'New Row2',name:'row2'};
				if (isMW || isTizen) {
					tableView.updateRow(1,data);
				} else {
					var row = tableView.getIndexByName('row2');
					tableView.updateRow(row,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.RIGHT});
				}	
				break;
			case 2:
				data = {title:'New Row3'};
				if (isMW || isTizen) {
					tableView.updateRow(2,data);
				} else {
					tableView.updateRow(2,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
				}
				break;
			case 3:
				data = {title:'New Row4'};
				if (isMW || isTizen) {
					tableView.updateRow(3,data);
				} else {
					tableView.updateRow(3,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
				}
				break;
			case 4:
				data = {title:'I am a title'};
				if (isMW || isTizen) {
					tableView.updateRow(4,data);
				} else {
					tableView.updateRow(4,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
				}
				break;
			
		}
	
		
	});
	
	win.add(tableView);
	return win;
};

module.exports = tv_row_update;