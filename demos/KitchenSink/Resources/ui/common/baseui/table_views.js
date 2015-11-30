function table_views(_args) {
	var isMobileWeb = Ti.Platform.osname === 'mobileweb',
		isTizen = Ti.Platform.osname === 'tizen',
		win = Ti.UI.createWindow({
			title:_args.title
		});

	if (Ti.Platform.name == 'android') 
	{
		win.backgroundColor = '#4e5c4d';
	}
	else
	{
		win.backgroundColor = '#aebcad';
	}
	
	// create table view data object
	var data = [
		{title:'Basic', hasChild:true, test:'ui/common/baseui/table_view_basic', header:'Simple Table API'},
		{title:'Performance', hasChild:true, test:'ui/common/baseui/table_view_perf'},
		{title:'Custom Row Data', hasChild:true, test:'ui/common/baseui/table_view_custom_rowdata'},
		{title:'Headers', hasChild:true, test:'ui/common/baseui/table_view_headers'},
		{title:'Footers', hasChild:true, test:'ui/common/baseui/table_view_footers'},
		{title:'Table API Basic', hasChild:true, test:'ui/common/baseui/table_view_api_basic', header:'New Programmatic API'},
		{title:'Table Custom Row Header', hasChild:true, test:'ui/common/baseui/table_view_api_custom_rowheader'},
		{title:'Table Section Header', hasChild:true, test:'ui/common/baseui/table_view_section_header'},
		{title:'Table Empty Dataset (Create)', hasChild:true, test:'ui/common/baseui/table_view_api_emptydata'},
		{title:'Append Row', hasChild:true, test:'ui/common/baseui/table_view_row_append'},
		{title:'Delete Row', hasChild:true, test:'ui/common/baseui/table_view_row_delete'},
		{title:'Insert Row', hasChild:true, test:'ui/common/baseui/table_view_row_insert'},
		{title:'Update Row', hasChild:true, test:'ui/common/baseui/table_view_row_update'},
		{title:'Set Row Data', hasChild:true, test:'ui/common/baseui/table_view_set'},
		{title:'Row data from sections', hasChild:true, test:'ui/common/baseui/table_view_api_sections'},
		{title:'Remove all rows', hasChild:true, test:'ui/common/baseui/table_view_removeall'},
		{title:'Empty Table View', hasChild:true, test:'ui/common/baseui/table_view_empty'},
		{title:'Table Auto Height', hasChild:true, test:'ui/common/baseui/table_view_api_auto_height'},
		{title:'Refresh Table View', hasChild:true, test:'ui/common/baseui/table_view_refresh'},
		{title:'Table View Scroll Indicators', hasChild:true, test:'ui/common/baseui/table_view_scroll_indicators'},
		{title:'Composite (Partial Size)', hasChild:true, test:'ui/common/baseui/table_view_composite'},
		{title:'Table View (Layout)', hasChild:true, test:'ui/common/baseui/table_view_layout'},
		{title:'Table View (Layout 2)', hasChild:true, test:'ui/common/baseui/table_view_layout_2'}
	];
	
	if ( !(isMobileWeb || isTizen) ) {
		data.push({title:'Table Search', hasChild:true, test:'ui/common/baseui/table_view_api_search'});
	}
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		// these are mostly working in android but require minor fixes
		
		data.push({title:'Table View (Layout 3)', hasChild:true, test:'ui/handheld/ios/baseui/table_view_layout_3'});
		data.push({title:'Table View (Layout 4)', hasChild:true, test:'ui/handheld/ios/baseui/table_view_layout_4'});
		data.push({title:'Table View (Layout 5)', hasChild:true, test:'ui/handheld/ios/baseui/table_view_layout_5'});
		data.push({title:'Table Custom Header', hasChild:true, test:'ui/handheld/ios/baseui/table_view_api_custom_header'});
		data.push({title:'Table Custom Footer', hasChild:true, test:'ui/handheld/ios/baseui/table_view_api_custom_footer'});
		data.push({title:'Table with Controls', hasChild:true, test:'ui/handheld/ios/baseui/table_view_api_controls'});
		data.push({title:'Table with Controls 2', hasChild:true, test:'ui/handheld/ios/baseui/table_view_controls_2'});	
		data.push({title:'Update Row Objects', hasChild:true, test:'ui/handheld/ios/baseui/table_view_update_row_objects'});
		data.push({title:'Table View w/Text Field', hasChild:true, test:'ui/handheld/ios/baseui/table_view_textfield'});
		data.push({title:'Headers with Filter', hasChild:true, test:'ui/handheld/ios/baseui/table_view_headers_filter'});
		data.push({title:'Table View Options', hasChild:true, test:'ui/handheld/ios/baseui/table_view_options'});
		data.push({title:'Table with Remote Images', hasChild:true, test:'ui/handheld/ios/baseui/table_view_api_remote_images'});
		data.push({title:'Table with Remote Images 2', hasChild:true, test:'ui/handheld/ios/baseui/table_view_remote_images_2'});
		data.push({title:'Table Custom Cell Selection', hasChild:true, test:'ui/handheld/ios/baseui/table_view_cell_selection'});
		data.push({title:'Grouped w/BG Image', hasChild:true, test:'ui/handheld/ios/baseui/table_view_grouped_bg_image'});
		data.push({title:'Delete Mode', hasChild:true, test:'ui/handheld/ios/baseui/table_view_delete'});
		data.push({title:'Delete Mode (2)', hasChild:true, test:'ui/handheld/ios/baseui/table_view_delete_2'});
		data.push({title:'Delete Mode (3)', hasChild:true, test:'ui/handheld/ios/baseui/table_view_delete_3'});
		data.push({title:'Move Mode', hasChild:true, test:'ui/handheld/ios/baseui/table_view_move'});
		data.push({title:'Table Grouped View', hasChild:true, test:'ui/handheld/ios/baseui/table_view_api_grouped'});
		data.push({title:'Table Empty AppendRow', hasChild:true, test:'ui/handheld/ios/baseui/table_view_api_empty_append'});
		data.push({title:'Selectable Rows', hasChild:true, test:'ui/handheld/ios/baseui/table_view_selectable'});
		data.push({title:'Events', hasChild:true, test:'ui/handheld/ios/baseui/table_view_events'});
		data.push({title:'Touch Events', hasChild:true, test:'ui/handheld/ios/baseui/table_view_touch'});
		data.push({title:'Edit and Move', hasChild:true, test:'ui/handheld/ios/baseui/table_view_edit_and_move'});
		data.push({title:'No Scrolling', hasChild:true, test:'ui/handheld/ios/baseui/table_view_noscroll'});
		data.push({title:'Pull to Refresh', hasChild:true, test:'ui/handheld/ios/baseui/table_view_pull_to_refresh'});
		data.push({title:'Dynamic Scrolling', hasChild:true, test:'ui/handheld/ios/baseui/table_view_dynamic_scroll'});
	}
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'} };
	var tableViewOptions = {
			data:data,
			headerTitle:'TableView examples and test cases',
			footerTitle:"Wow. That was cool!",
			backgroundColor:'transparent',
			rowBackgroundColor:'white'
		};
	
	if ( !(isMobileWeb || isTizen) ) {
		tableViewOptions.style = Titanium.UI.iPhone.TableViewStyle.GROUPED;
	}
	
	var tableview = Titanium.UI.createTableView(tableViewOptions);
	
	// create table view event listener
	tableview.addEventListener('click', function(e)
	{
		if (e.rowData.test)
		{
			var ExampleWindow = require(e.rowData.test);
			win = new ExampleWindow({title: e.rowData.title, containingTab: _args.containingTab, tabGroup: _args.tabGroup});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = table_views;
