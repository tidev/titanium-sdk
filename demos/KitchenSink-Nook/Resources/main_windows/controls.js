Ti.include('../common.js');

// create table view data object
var data = [
	{title:'Slider', test:'../examples/slider.js'},
	{title:'Switch', test:'../examples/switch.js'},
	{title:'Activity Indicator', test:'../examples/activity_indicator.js'},
	{title:'Progress Bar', test:'../examples/progress_bar.js'},
	{title:'Button', test:'../examples/button.js'},
	{title:'Label', test:'../examples/label.js'},
	{title:'Search Bar', test:'../examples/searchbar.js'},
	{title:'Text Field', test:'../examples/textfield.js'},
	{title:'Text Area', test:'../examples/textarea_basic.js'},
	{title:'Picker', test:'../examples/picker.js'}
];
NookKS.formatTableView(data);

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
			title:e.rowData.title,
			formatTableView:Ti.UI.currentWindow.formatTableView
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
