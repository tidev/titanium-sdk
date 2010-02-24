// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/table_view_basic.js', header:'Simple Table API'},
	{title:'Custom Row Data', hasChild:true, test:'../examples/table_view_custom_rowdata.js'},
	{title:'Headers', hasChild:true, test:'../examples/table_view_headers.js'},
	{title:'Headers with Filter', hasChild:true, test:'../examples/table_view_headers_filter.js'},
	{title:'Footers', hasChild:true, test:'../examples/table_view_footers.js'},
	{title:'Delete Mode', hasChild:true, test:'../examples/table_view_delete.js'},
	{title:'Delete Mode (2)', hasChild:true, test:'../examples/table_view_delete_2.js'},
	{title:'Move Mode', hasChild:true, test:'../examples/table_view_move.js'},
	{title:'Table View (Layout)', hasChild:true, test:'../examples/table_view_layout.js'},
	{title:'Table View (Layout 2)', hasChild:true, test:'../examples/table_view_layout_2.js'},
	{title:'Table View (Layout 3)', hasChild:true, test:'../examples/table_view_layout_3.js'},
	{title:'Table View (Layout 4)', hasChild:true, test:'../examples/table_view_layout_4.js'},

	{title:'Append Row', hasChild:true, test:'../examples/table_view_row_append.js'},
	{title:'Delete Row', hasChild:true, test:'../examples/table_view_row_delete.js'},
	{title:'Insert Row', hasChild:true, test:'../examples/table_view_row_insert.js'},
	{title:'Update Row', hasChild:true, test:'../examples/table_view_row_update.js'},
	{title:'Set Row Data', hasChild:true, test:'../examples/table_view_set.js'},
	{title:'Empty Table View', hasChild:true, test:'../examples/table_view_empty.js'},
	{title:'Refresh Table View', hasChild:true, test:'../examples/table_view_refresh.js'},
	{title:'Update Row Objects', hasChild:true, test:'../examples/table_view_update_row_objects.js'},
	{title:'Composite (Partial Size)', hasChild:true, test:'../examples/table_view_composite.js'},
	{title:'Grouped w/BG Image', hasChild:true, test:'../examples/table_view_grouped_bg_image.js'},

	{title:'Table API Basic', hasChild:true, test:'../examples/table_view_api_basic.js', header:'New Programmatic API'},
	{title:'Table Grouped View', hasChild:true, test:'../examples/table_view_api_grouped.js'},
	{title:'Table with Controls', hasChild:true, test:'../examples/table_view_api_controls.js'},
	{title:'Table with Controls 2', hasChild:true, test:'../examples/table_view_controls_2.js'},
	{title:'Table Auto Height', hasChild:true, test:'../examples/table_view_api_auto_height.js'},
	{title:'Table Search', hasChild:true, test:'../examples/table_view_api_search.js'},
	{title:'Table Custom Header', hasChild:true, test:'../examples/table_view_api_custom_header.js'},
	{title:'Table Custom Row Header', hasChild:true, test:'../examples/table_view_api_custom_rowheader.js'},
	{title:'Table Custom Footer', hasChild:true, test:'../examples/table_view_api_custom_footer.js'},
	{title:'Table Section Header', hasChild:true, test:'../examples/table_view_section_header.js'},
	{title:'Table View Options', hasChild:true, test:'../examples/table_view_options.js'},
	{title:'Table Empty Dataset (Create)', hasChild:true, test:'../examples/table_view_api_emptydata.js'},
	{title:'Table Empty AppendRow', hasChild:true, test:'../examples/table_view_api_empty_append.js'},
	{title:'Table with Remote Images', hasChild:true, test:'../examples/table_view_api_remote_images.js'},
	{title:'Table with Remote Images 2', hasChild:true, test:'../examples/table_view_remote_images_2.js'},

];

// create table view
var tableViewOptions = {
		data:data,
		style:Titanium.UI.iPhone.TableViewStyle.GROUPED,
		headerTitle:'TableView examples and test cases',
		footerTitle:"Wow. That was cool!",
		backgroundColor: '#aebcad',
		_backgroundImage:'../images/bg.png'
	};
if (Ti.Platform.name == 'android') {
	tableViewOptions.backgroundColor = '#4e5c4d';
}

var tableview = Titanium.UI.createTableView(tableViewOptions);

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
