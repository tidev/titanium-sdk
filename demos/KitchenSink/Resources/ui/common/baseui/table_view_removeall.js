function tv_removeall(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	
	var data = [];
	
	for (var c=0;c<50;c++)
	{
		data[c] = {title:"Row "+(c+1)};
	}
	
	var tableview = Ti.UI.createTableView({
		data : data
	});
	
	win.add(tableview);
	
	var button = Ti.UI.createButton({
		title:"Remove All"
	});
	
	var button2 = Ti.UI.createButton({
		title:"Add back"
	});
	
	if (Titanium.Platform.name == 'iPhone OS') {
		win.setRightNavButton(button);
	} else {
		button.top = 0;
		button.left = 0;
		button2.top = 0;
		button2.left = 0;
		tableview.top = 30;
		win.add(button);
	}
	
	button.addEventListener('click',function(e)
	{
		// remove all rows with no animation (default in setter)
		tableview.data = [];
		if (Titanium.Platform.name == 'iPhone OS') {
			win.setRightNavButton(button2);
		} else {
			win.remove(button);
			win.add(button2);
		}
	});
	
	button2.addEventListener('click',function(e)
	{
		// re-add - should have no animation
		tableview.data = data;
	});
	return win;
};

module.exports = tv_removeall;