function picker(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'white'
	});
	
	// create table view data object
	var isAndroid = Ti.Platform.osname === 'android',
		isTizen = Ti.Platform.osname === 'tizen';
	var items = [
		{title:'Basic Picker', hasChild:true, test:'ui/common/controls/picker_basic'},
		{title:'Basic Picker 2', hasChild:true, test:'ui/common/controls/picker_basic2', noandroid:true, notizen:true},
		{title:'Picker w/o selection', hasChild:true, test:'ui/common/controls/picker_noselection', noandroid:true},
	
		{title:'Picker Single column 1', hasChild:true, test:'ui/common/controls/picker_singlecolumn1'},
		{title:'Picker Single column 2', hasChild:true, test:'ui/common/controls/picker_singlecolumn2', noandroid:true},
		{title:'Picker Single column 3', hasChild:true, test:'ui/common/controls/picker_singlecolumn3'},
	
		{title:'Picker Multi column 1', hasChild:true, test:'ui/common/controls/picker_multicolumn1', noandroid:true},
	
		{title:'Picker custom labels', hasChild:true, test:'ui/common/controls/picker_custom1', noandroid:true, notizen:true},
		{title:'Picker custom images', hasChild:true, test:'ui/common/controls/picker_custom2', noandroid:true, notizen:true},
		
		{title:'Date Picker', hasChild:true, test:'ui/common/controls/picker_date1'},
		{title:'Time Picker', hasChild:true, test:'ui/common/controls/picker_date2'},
		{title:'Date/Time Picker', hasChild:true, test:'ui/common/controls/picker_date3', noandroid:true},
		{title:'Countdown Picker', hasChild:true, test:'ui/common/controls/picker_date4', noandroid:true}
	];
	
	var data = items,
		i = 0,
		itemsCount = items.length;
	if (isAndroid) {
		data = [];
		for (; i < itemsCount; i++) {
			if (!items[i].noandroid) {
				data.push(items[i]);
			}
		}
		data.push({title:'Android "useSpinner" - text', hasChild:true, test:'ui/handheld/android/controls/picker_android_spinner_text'});
		data.push({title:'Android "useSpinner" - text 2', hasChild:true, test:'ui/handheld/android/controls/picker_android_spinner_text2'});
		data.push({title:'Android "useSpinner" - date', hasChild:true, test:'ui/handheld/android/controls/picker_android_spinner_date'});
		data.push({title:'Android "useSpinner" - time', hasChild:true, test:'ui/handheld/android/controls/picker_android_spinner_time'});
		data.push({title:'Android "useSpinner" - time (2)', hasChild:true, test:'ui/handheld/android/controls/picker_android_spinner_time2'});
	} else if(isTizen) {
		// On Tizen, make available all tests, except those specifically excluded by the "notizen" attribute.
		data = [];
		for (; i < itemsCount; i++) {
			if (!items[i].notizen) {
				data.push(items[i]);
			}
		}
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'} };
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	// create table view event listener
	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title: e.rowData.title});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	return self;	
}

module.exports = picker;
