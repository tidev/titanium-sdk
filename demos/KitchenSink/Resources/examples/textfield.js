// create table view data object
var data = [
	{title:'Events', hasChild:true, test:'../examples/textfield_events.js'},
	{title:'Keyboard', hasChild:true, test:'../examples/textfield_keyboards.js'},
	{title:'Toolbar', hasChild:true, test:'../examples/textfield_toolbar.js'},
	{title:'Border Style', hasChild:true, test:'../examples/textfield_borders.js'},
	{title:'Buttons on Textfields', hasChild:true, test:'../examples/textfield_buttons.js'},
	{title:'The Rest', hasChild:true, test:'../examples/textfield_therest.js'},

];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test)
	{
		var win = Titanium.UI.createWindow({
			url:e.rowData.test,
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true})
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
