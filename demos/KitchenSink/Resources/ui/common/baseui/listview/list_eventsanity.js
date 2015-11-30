function list_event_sanity(_args) {
	var win = Ti.UI.createWindow({
		title:'Event Sanity',
		layout:'vertical'
	});
	
	var desc = Ti.UI.createLabel({
		text:'Check for sanity of itemclick. Tests sectionIndex, itemIndex, itemId.\nOn iOS also checks for accessoryClicked property'
	})
	
	win.add(desc);
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var section0 = Ti.UI.createListSection({headerTitle:'SECTION 0'})
	var data0 = [
	{properties:{title:'Alert 0,0,0',itemId:'0',height:44}},
	{properties:{title:'Alert 0,1,0',itemId:'0',height:44}},
	{properties:{title:'Alert 0,2,1',itemId:'1',height:44}},
	]
	
	if(isIOS){
		data0.push({properties:{title:'Click Accessory/Row',itemId:'-1', accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_DETAIL,height:44}})
	}
	section0.setItems(data0);
	
	var section1 = Ti.UI.createListSection({headerTitle:'SECTION 0'})
	var data1 = [
	{properties:{title:'Alert 1,0,0',itemId:'0',height:44}},
	{properties:{title:'Alert 1,1,hello',itemId:'hello',height:44}},
	{properties:{title:'Alert 1,2,1',itemId:'1',height:44}},
	]
	section1.setItems(data1);
	var listView = Ti.UI.createListView({
		top:5,
		sections:[section0,section1]
	})
	
	win.add(listView);
	
	listView.addEventListener('itemclick',function(e){
		if(e.itemId == '-1'){
			var message = 'accessoryClicked = '+e.accessoryClicked;
			alert(message);
		} else {
			var message = e.sectionIndex+','+e.itemIndex+','+e.itemId;
			alert(message);
		}
	})

	return win;
}

module.exports = list_event_sanity;
