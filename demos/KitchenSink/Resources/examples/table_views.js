// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/table_view_basic.js'},
	{title:'Custom Row Data', hasChild:true, test:'../examples/table_view_custom_rowdata.js'},
	{title:'Headers', hasChild:true, test:'../examples/table_view_headers.js'},
	{title:'Headers with Filter', hasChild:true, test:'../examples/table_view_headers_filter.js'},
	{title:'Delete Mode', hasChild:true, test:'../examples/table_view_delete.js'},
	{title:'Delete Mode (2)', hasChild:true, test:'../examples/table_view_delete_2.js'},
	{title:'Move Mode', hasChild:true, test:'../examples/table_view_move.js'},
	{title:'Row Min/Auto Height', hasChild:true, test:'../examples/table_view_auto_height.js'},
	{title:'Table View (Layout)', hasChild:true, test:'../examples/table_view_layout.js'},
	{title:'Table View (Layout 2)', hasChild:true, test:'../examples/table_view_layout_2.js'},
	{title:'Table View (Layout 3)', hasChild:true, test:'../examples/table_view_layout_3.js'},

	{title:'Append Row', hasChild:true, test:'../examples/table_view_row_append.js'},
	{title:'Delete Row', hasChild:true, test:'../examples/table_view_row_delete.js'},
	{title:'Insert Row', hasChild:true, test:'../examples/table_view_row_insert.js'},
	{title:'Update Row', hasChild:true, test:'../examples/table_view_row_update.js'},
	{title:'Set Row Data', hasChild:true, test:'../examples/table_view_set.js'},

];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
	style:Titanium.UI.iPhone.TableViewStyle.GROUPED,
	headerTitle:'Table Tests',
	footerTitle:'End of tests',
	backgroundColor: '#aebcad',
	_backgroundImage:'../images/bg.png'
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
