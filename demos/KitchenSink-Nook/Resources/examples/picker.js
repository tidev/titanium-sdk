Ti.include('../common.js');

var data = [
	{title:'Basic Picker', test:'../examples/picker_basic.js'},
	{title:'Picker Single column 1', test:'../examples/picker_singlecolumn1.js'},
	{title:'Picker Single column 2', test:'../examples/picker_singlecolumn3.js'},	
	{title:'Date Picker', test:'../examples/picker_date1.js'},
	{title:'Time Picker', test:'../examples/picker_date2.js'},
	{title:'Android "useSpinner" - text', test:'../examples/picker_android_spinner_text.js'},
	{title:'Android "useSpinner" - text 2', test:'../examples/picker_android_spinner_text2.js'},
	{title:'Android "useSpinner" - date', test:'../examples/picker_android_spinner_date.js'},
	{title:'Android "useSpinner" - time', test:'../examples/picker_android_spinner_time.js'},
	{title:'Android "useSpinner" - time 2', test:'../examples/picker_android_spinner_time2.js'}
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
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

