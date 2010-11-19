// create table view data object
var data = [
	{title:'Basic Picker', hasChild:true, test:'../examples/picker_basic.js'},
	/*
	{title:'Basic Picker 2', hasChild:true, test:'../examples/picker_basic2.js'},
	{title:'Picker w/o selection', hasChild:true, test:'../examples/picker_noselection.js'},

	{title:'Picker Single column 1', hasChild:true, test:'../examples/picker_singlecolumn1.js'},
	{title:'Picker Single column 2', hasChild:true, test:'../examples/picker_singlecolumn2.js'},
	{title:'Picker Single column 3', hasChild:true, test:'../examples/picker_singlecolumn3.js'},

	{title:'Picker Multi column 1', hasChild:true, test:'../examples/picker_multicolumn1.js'},

	{title:'Picker custom labels', hasChild:true, test:'../examples/picker_custom1.js'},
	{title:'Picker custom images', hasChild:true, test:'../examples/picker_custom2.js'},
	
	{title:'Date Picker', hasChild:true, test:'../examples/picker_date1.js'},
	{title:'Time Picker', hasChild:true, test:'../examples/picker_date2.js'},
	{title:'Date/Time Picker', hasChild:true, test:'../examples/picker_date3.js'},
	{title:'Countdown Picker', hasChild:true, test:'../examples/picker_date4.js'},
	*/
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
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

