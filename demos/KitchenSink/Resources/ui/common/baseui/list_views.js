function list_views(_args) {
	var win = Ti.UI.createWindow({
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
	var platformName = Titanium.Platform.osname;
	var isAndroid = (platformName == 'android');
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	var isValidVersion = (Ti.version >= '3.1.0');
	var isValidPlatform = isAndroid || isIOS;
	
	var validV2Version = (Ti.version >= '3.2.0');
	
	var listViewDefined = true;
	try {
		var isdefined = (Ti.UI.LIST_ACCESSORY_TYPE_DETAIL);
		listViewDefined = ((isdefined !== undefined) && (isdefined !== null));
	} catch(e){
		listViewDefined = false;
	}

	if (isValidVersion && isValidPlatform && listViewDefined) {
		var listView = Ti.UI.createListView({
			headerTitle:'THIS IS A LIST VIEW TOO',
		});
		if (isIOS) {
			listView.style=Ti.UI.iPhone.ListViewStyle.GROUPED;
		}
		var sections = [];

		var basicSection = Ti.UI.createListSection({ headerTitle: 'Basic Functions'});
		var basicDataSet = [
		{properties: { title: 'Built in templates', itemId: 'list_basic', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Customize Built in templates', itemId: 'list_basic_customize', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Background Colors& Scroll Indicator', itemId: 'list_background_color', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Headers and Footers', itemId: 'list_headers_footers', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Row Height', itemId: 'list_row_height', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Default Template', itemId: 'list_deftemplate', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Scroll To', itemId: 'list_scrollto', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}}
		];
		if (isIOS) {
			basicDataSet.push({properties: { title: 'Selection Style', itemId: 'list_selection_style', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}});
			basicDataSet.push({properties: { title: 'Scroll Indicator Style', itemId: 'list_scroll_style', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}});
			basicDataSet.push({properties: { title: 'Allows Selection Behavior', itemId: 'list_selection', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}});
			basicDataSet.push({properties: { title: 'Keyboard Behavior', itemId: 'list_kb', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}});
		}
		if (isAndroid) {
			//TODO
		}
		basicSection.setItems(basicDataSet);
		sections.push(basicSection);

		var listApiSection = Ti.UI.createListSection({ headerTitle: 'List API - Section Management'});
		var listApiDataSet = [
		{properties: { title: 'Append Section', itemId: 'list_sectionappend', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Delete Section', itemId: 'list_sectiondelete', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Insert Section', itemId: 'list_sectioninsert', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Replace Section', itemId: 'list_sectionreplace', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}}
		];
		listApiSection.setItems(listApiDataSet);
		sections.push(listApiSection);

		var sectionApiSection = Ti.UI.createListSection({ headerTitle: 'Section API - Item Management'});
		var sectionApiDataSet = [
		{properties: { title: 'Set Items', itemId: 'list_itemsset', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Append Items', itemId: 'list_itemsappend', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Insert Items', itemId: 'list_itemsinsert', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Replace Items', itemId: 'list_itemsreplace', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Delete Items', itemId: 'list_itemsdelete', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Update Items', itemId: 'list_itemsupdate', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Get Items (otherData)', itemId: 'list_itemsget', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		];
		sectionApiSection.setItems(sectionApiDataSet);
		sections.push(sectionApiSection);
		
		var eventApiSection = Ti.UI.createListSection({ headerTitle: 'List View Eventing. Run in ORDER'});
		var eventApiDataSet = [
		{properties: { title: 'Sanity Check', itemId: 'list_eventsanity', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Event Bubbling', itemId: 'list_eventbubble', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Child Events', itemId: 'list_eventchild', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'itemclick + child click', itemId: 'list_eventchild2', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		];
		eventApiSection.setItems(eventApiDataSet);
		sections.push(eventApiSection);

		var performanceSection = Ti.UI.createListSection({ headerTitle: 'List View Performance'});     
		var performanceDataSet = [
		{properties: { title: 'Remote Images in ListView', itemId: 'list_performance_remote_images', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		{properties: { title: 'Contacts', itemId: 'list_performance_contacts', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
		];
		performanceSection.setItems(performanceDataSet);
		sections.push(performanceSection);
		
		//See the validV2Version flag above
		if (validV2Version) {
			var uienhancementsSection = Ti.UI.createListSection({ headerTitle: 'V2 UI Enhancements'});
			var uienhancementsdataset = [
			{properties: { title: 'Item Separators', itemId: 'list_v2_custom_separator', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'Custom Headers & Footers', itemId: 'list_v2_custom_header_footer', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'Custom Backgrounds', itemId: 'list_v2_custom_backgrounds', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'Select & Deselect Item', itemId: 'list_v2_select_deselect', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'Misc UI', itemId: 'list_v2_ui_misc', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'Pull View', itemId: 'list_v2_ui_pull', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			];
			if (isAndroid) {
				uienhancementsdataset.splice(3, 3);
			}
			uienhancementsSection.setItems(uienhancementsdataset);
			sections.push(uienhancementsSection);
			if (isIOS) {
				var editingSection = Ti.UI.createListSection({ headerTitle: 'V2 Editing Support'});
				var editingdataset = [
				{properties: { title: 'Delete Rows', itemId: 'list_v2_delete_rows', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
				{properties: { title: 'Reorder Rows', itemId: 'list_v2_move_rows', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
				];
				editingSection.setItems(editingdataset);
				sections.push(editingSection);
			}
			
			var searchSection = Ti.UI.createListSection({ headerTitle: 'V2 Search & Index Support'});
			var searchDataSet = [
			{properties: { title: 'Basic Search (searchView)', itemId: 'list_v2_search_searchview', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'New Search API (searchText) ', itemId: 'list_v2_search_searchtext', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'Fun with searchText ', itemId: 'list_v2_search_searchtext2', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}},
			{properties: { title: 'Index Bar (sectionIndexTitles) ', itemId: 'list_v2_index_bar', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL, height:44}}
			];
	
			if (isAndroid) {
				searchDataSet.splice(2,2);
			}
			searchSection.setItems(searchDataSet);
			sections.push(searchSection);	
		}

		listView.setSections(sections);

		listView.addEventListener('itemclick',function(e){
			Ti.API.info('GOT ITEM CLICK WITH itemIndex: '+e.itemIndex+' and sectionIndex: '+e.sectionIndex);
			if (e.itemId) {
				var url = 'ui/common/baseui/listview/'+e.itemId;
				var ListTest = require(url);
				var listWin = new ListTest({containingTab: _args.containingTab, tabGroup: _args.tabGroup});
				_args.containingTab.open(listWin,{animated:true});
			}
			else {
				alert('NO itemId in event. Check data. If data is right, file bug in JIRA.');
			} 
		});
		win.add(listView);
	}
	else {
		var error = 'LIST VIEW is currently supported on iOS and android and requires a version 3.1.0 or greater.';
		if (isValidVersion && isValidPlatform) {
			error += '\n\nDid not find list view. Update to latest build.';
		}
		var label = Ti.UI.createLabel({
			text:error,
			color:'red',
			font:{fontWeight:'bold',fontSize:'20dp'},
			wordWrap:true
		});
		win.add(label);
	}
	
	return win;

};
module.exports = list_views;