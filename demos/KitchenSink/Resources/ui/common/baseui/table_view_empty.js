function tv_empty(_args) {
	var win = Titanium.UI.createWindow({
		title:_args.title
	});
	
	var tableView = Ti.UI.createTableView({top:110,backgroundColor:'yellow'});
	
	var isMW = Ti.Platform.osname === 'mobileweb',
		isTizen = Ti.Platform.osname === 'tizen';
	
	var b1 = Ti.UI.createButton({
		height:40,
		width:200,
		title:'Append (row obj)',
		top:10
	});
	win.add(b1);
	b1.addEventListener('click',function()
	{
		if (isMW || isTizen) {
			tableView.appendRow({title:'Foo'});
		} else {
			tableView.appendRow({title:'Foo'},{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT} );
		}
	
		//NOTE: since we're appending 2 different row layouts, we need to give one of them
		//a table className otherwise the tableview will assume they're the same layout and
		//you'll get warnings and bad performance on lots of rows - this shows you how to do that
		var row = Ti.UI.createTableViewRow({height:50,className:'row'});
		var label = Ti.UI.createLabel({text:'row 1', color:'#111', width:Ti.UI.SIZE, height:Ti.UI.SIZE});
		row.add(label);
		if (isMW || isTizen) {
			tableView.appendRow(row);
		} else {
			tableView.appendRow(row,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
		}
	});
	
	var b2 = Ti.UI.createButton({
		height:40,
		width:200,
		title:'Set',
		top:60
	});
	win.add(b2);
	b2.addEventListener('click',function()
	{
		var data = [
			{title:'Row 1'},
			{title:'Row 2'},
			{title:'Row 3'},
			{title:'Row 4'}
		];
		if (isMW || isTizen) {
			tableView.setData(data);
		} else {
			tableView.setData(data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
		}
	
	});
	win.add(tableView);

	return win;
};

module.exports = tv_empty;