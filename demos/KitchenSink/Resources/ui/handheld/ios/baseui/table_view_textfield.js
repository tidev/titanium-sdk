function tv_textfield(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	function addRow(addTextArea)
	{
		var row = Ti.UI.createTableViewRow({height:50});
		var tf1 = null;
		if (addTextArea)
		{
			tf1 = Titanium.UI.createTextArea({
				color:'#336699',
				top:10,
				left:10,
				right:10,
			});
	
		}
		else
		{
			tf1 = Titanium.UI.createTextField({
				color:'#336699',
				height:35,
				top:10,
				left:10,
				right:10,
				hintText:'hint',
				borderStyle:Titanium.UI.INPUT_BORDERSTYLE_NONE
			});
	
		}
		row.add(tf1);
		row.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
		row.className = 'control';
		return row;
	}
	
	// create table view data object
	var data = [];
	
	for (var x=0;x<10;x++)
	{
		if (x==9){
			data[x] = addRow(true);
		} else {
			data[x] = addRow();
		}
	
	}
	
	var tableView = Ti.UI.createTableView({
		data:data,
		style: Titanium.UI.iPhone.TableViewStyle.GROUPED
	});
	win.addEventListener('focus', function()
	{
		Ti.API.info('window focus fired');
	});
	win.add(tableView);
	return win;
};

module.exports = tv_textfield;