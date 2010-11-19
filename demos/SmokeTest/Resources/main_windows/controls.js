// create table view data object
var data = [
	{title:'Slider', hasChild:true, test:'../examples/slider.js'},
	{title:'Switch', hasChild:true, test:'../examples/switch.js'},
	{title:'Activity Indicator', hasChild:true, test:'../examples/activity_indicator.js'},
	{title:'Progress Bar', hasChild:true, test:'../examples/progress_bar.js'},
	{title:'Button', hasChild:true, test:'../examples/button.js'},
	{title:'Label', hasChild:true, test:'../examples/label.js'},
	//{title:'Search Bar', hasChild:true, test:'../examples/searchbar.js'},
	{title:'Text Field', hasChild:true, test:'../examples/textfield.js'},
	//{title:'Text Area', hasChild:true, test:'../examples/textarea.js'}
];

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	//data.push({title:'Button Bar', hasChild:true, test:'../examples/buttonbar.js'});
	//data.push({title:'Tabbed Bar', hasChild:true, test:'../examples/tabbedbar.js'});
	//data.push({title:'System Buttons', hasChild:true, test:'../examples/system_buttons.js'});
	//data.push({title:'Toolbar', hasChild:true, test:'../examples/toolbar.js'});
	data.push({title:'Picker', hasChild:true, test:'../examples/picker.js'});
}

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
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
