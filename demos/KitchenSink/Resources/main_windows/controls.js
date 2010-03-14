// create table view data object
var data = [
	{title:'Slider', hasChild:true, test:'../examples/slider.js'},
	{title:'Switch', hasChild:true, test:'../examples/switch.js'},
	{title:'Activity Indicator', hasChild:true, test:'../examples/activity_indicator.js'},
	{title:'Progress Bar', hasChild:true, test:'../examples/progress_bar.js'},
	{title:'Button', hasChild:true, test:'../examples/button.js'},
	{title:'Label', hasChild:true, test:'../examples/label.js'},
	{title:'Button Bar', hasChild:true, test:'../examples/buttonbar.js'},
	{title:'Tabbed Bar', hasChild:true, test:'../examples/tabbedbar.js'},
	{title:'Search Bar', hasChild:true, test:'../examples/searchbar.js'},
	{title:'Picker', hasChild:true, test:'../todo.js'},
	{title:'Text Field', hasChild:true, test:'../examples/textfield.js'},
	{title:'Text Area', hasChild:true, test:'../examples/textarea.js'},
	{title:'System Buttons', hasChild:true, test:'../examples/system_buttons.js'},
	{title:'Toolbar', hasChild:true, test:'../examples/toolbar.js'},

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