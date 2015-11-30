function getData(){
	var data = [
		{properties:{title:'Alert will show title (deja vu)',itemId:'title',height:44}},
		{properties:{title:'Alert Foobar (custom property)',itemId:'custom',height:44},customData:'Foobar'},
	];
	return data;
}

function list_getitems(_args) {
	var win = Ti.UI.createWindow({
		title:'Get Items'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var section1 = Ti.UI.createListSection()
    section1.setItems(getData());
	var listView = Ti.UI.createListView({
		sections:[section1]
	});
	
	listView.addEventListener('itemclick',function(e){
		var message = 'No itemId in event';
		if(e.itemId == 'title'){
			message = e.section.getItemAt(e.itemIndex).properties.title;
		} else if (e.itemId == 'custom') {
			message = e.section.getItemAt(e.itemIndex).customData;
		}
		alert(message);
	})
	
	win.add(listView);
	
	
	
	return win;
};


module.exports = list_getitems;