if (Ti.Platform.name == 'android') 
{
	Titanium.UI.currentWindow.backgroundColor = '#4e5c4d';
}
else
{
	Titanium.UI.currentWindow.backgroundColor = '#aebcad';
}

// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/table_view_basic.js', header:'Simple Table API'},
	{title:'Performance', hasChild:true, test:'../examples/table_view_perf.js'},
	{title:'Custom Row Data', hasChild:true, test:'../examples/table_view_custom_rowdata.js'},
	{title:'Headers', hasChild:true, test:'../examples/table_view_headers.js'},
	{title:'Footers', hasChild:true, test:'../examples/table_view_footers.js'},
	{title:'Table API Basic', hasChild:true, test:'../examples/table_view_api_basic.js', header:'New Programmatic API'},
	{title:'Table Custom Row Header', hasChild:true, test:'../examples/table_view_api_custom_rowheader.js'},
	{title:'Table Section Header', hasChild:true, test:'../examples/table_view_section_header.js'},
	{title:'Table Empty Dataset (Create)', hasChild:true, test:'../examples/table_view_api_emptydata.js'},
	{title:'Append Row', hasChild:true, test:'../examples/table_view_row_append.js'},
	{title:'Delete Row', hasChild:true, test:'../examples/table_view_row_delete.js'},
	{title:'Insert Row', hasChild:true, test:'../examples/table_view_row_insert.js'},
	{title:'Update Row', hasChild:true, test:'../examples/table_view_row_update.js'},
	{title:'Set Row Data', hasChild:true, test:'../examples/table_view_set.js'},
	{title:'Row data from sections', hasChild:true, test:'../examples/table_view_api_sections.js'},
	{title:'Remove all rows', hasChild:true, test:'../examples/table_view_removeall.js'},
	{title:'Empty Table View', hasChild:true, test:'../examples/table_view_empty.js'},
	{title:'Table Auto Height', hasChild:true, test:'../examples/table_view_api_auto_height.js'},
	{title:'Refresh Table View', hasChild:true, test:'../examples/table_view_refresh.js'},
	{title:'Table View Scroll Indicators', hasChild:true, test:'../examples/table_view_scroll_indicators.js'},
	{title:'Composite (Partial Size)', hasChild:true, test:'../examples/table_view_composite.js'},
	{title:'Table View (Layout)', hasChild:true, test:'../examples/table_view_layout.js'},
	{title:'Table View (Layout 2)', hasChild:true, test:'../examples/table_view_layout_2.js'}
];

data.push({title:'Table Search', hasChild:true, test:'../examples/table_view_api_search.js'});

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	// these are mostly working in android but require minor fixes
	
	data.push({title:'Table View (Layout 3)', hasChild:true, test:'../examples/table_view_layout_3.js'});
	data.push({title:'Table View (Layout 4)', hasChild:true, test:'../examples/table_view_layout_4.js'});
	data.push({title:'Table View (Layout 5)', hasChild:true, test:'../examples/table_view_layout_5.js'});
	data.push({title:'Table Custom Header', hasChild:true, test:'../examples/table_view_api_custom_header.js'});
	data.push({title:'Table Custom Footer', hasChild:true, test:'../examples/table_view_api_custom_footer.js'});
	data.push({title:'Table with Controls', hasChild:true, test:'../examples/table_view_api_controls.js'});
	data.push({title:'Table with Controls 2', hasChild:true, test:'../examples/table_view_controls_2.js'});	
	data.push({title:'Update Row Objects', hasChild:true, test:'../examples/table_view_update_row_objects.js'});
	data.push({title:'Table View w/Text Field', hasChild:true, test:'../examples/table_view_textfield.js'});
	data.push({title:'Headers with Filter', hasChild:true, test:'../examples/table_view_headers_filter.js'});
	data.push({title:'Table View Options', hasChild:true, test:'../examples/table_view_options.js'});
	data.push({title:'Table with Remote Images', hasChild:true, test:'../examples/table_view_api_remote_images.js'});
	data.push({title:'Table with Remote Images 2', hasChild:true, test:'../examples/table_view_remote_images_2.js'});
	data.push({title:'Table Custom Cell Selection', hasChild:true, test:'../examples/table_view_cell_selection.js'});
	data.push({title:'Grouped w/BG Image', hasChild:true, test:'../examples/table_view_grouped_bg_image.js'});
	data.push({title:'Delete Mode', hasChild:true, test:'../examples/table_view_delete.js'});
	data.push({title:'Delete Mode (2)', hasChild:true, test:'../examples/table_view_delete_2.js'});
	data.push({title:'Delete Mode (3)', hasChild:true, test:'../examples/table_view_delete_3.js'});
	data.push({title:'Move Mode', hasChild:true, test:'../examples/table_view_move.js'});
	data.push({title:'Table Grouped View', hasChild:true, test:'../examples/table_view_api_grouped.js'});
	data.push({title:'Table Empty AppendRow', hasChild:true, test:'../examples/table_view_api_empty_append.js'});
	data.push({title:'Selectable Rows', hasChild:true, test:'../examples/table_view_selectable.js'});
	data.push({title:'Events', hasChild:true, test:'../examples/table_view_events.js'});
	data.push({title:'Touch Events', hasChild:true, test:'../examples/table_view_touch.js'});
	data.push({title:'Edit and Move', hasChild:true, test:'../examples/table_view_edit_and_move.js'});
	data.push({title:'No Scrolling', hasChild:true, test:'../examples/table_view_noscroll.js'});
	data.push({title:'Pull to Refresh', hasChild:true, test:'../examples/table_view_pull_to_refresh.js'});
	data.push({title:'Dynamic Scrolling', hasChild:true, test:'../examples/table_view_dynamic_scroll.js'});
}
// create table view
var tableViewOptions = {
		data:data,
		style:Titanium.UI.iPhone.TableViewStyle.GROUPED,
		headerTitle:'TableView examples and test cases',
		footerTitle:"Wow. That was cool!",
		backgroundColor:'transparent',
		rowBackgroundColor:'white'
	};


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
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
