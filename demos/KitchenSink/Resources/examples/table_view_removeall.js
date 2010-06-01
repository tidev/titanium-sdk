var win = Ti.UI.currentWindow;


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

win.setRightNavButton(button);

button.addEventListener('click',function(e)
{
	// remove all rows with no animation (default in setter)
	tableview.data = [];
	win.setRightNavButton(button2);
});

button2.addEventListener('click',function(e)
{
	// re-add - should have no animation
	tableview.data = data;
});
