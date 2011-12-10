

 // this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#eee');

// create tab group
var tabGroup = Titanium.UI.createTabGroup({
	barColor:'#080'
});

var UIWin = Ti.UI.createWindow({});
var platformWin = Ti.UI.createWindow({});


var tab1 = Titanium.UI.createTab({
	window: UIWin,
	title:'Base UI',
	backgroundColor:'#eee'


});

var tab2 = Titanium.UI.createTab({
	window: platformWin,
    title:'Platform',
    backgroundColor:'#eee'
});


//Ti.UI.currentWindow.add(tabGroup);
tabGroup.open();

tabGroup.addTab(tab1);
tabGroup.addTab(tab2);


var data1 = [
	{title:'Window', hasChild:true, url:'/examples/window.js'},
	{title:'Label', hasChild:true, url:'/examples/label.js'},
	{title:'Button', hasChild:true, url:'/examples/button.js'},
	{title:'Picker', hasChild:true, url:'/examples/picker.js'},
	{title:'Switch', hasChild:true, url:'/examples/switch.js'},
	{title:'Text Field', hasChild:true, url:'/examples/textfield.js'},
	{title:'Text Area', hasChild:true, url:'/examples/textarea.js'},
	{title:'Table View', hasChild:true, url:'/examples/tableview.js'},
	{title:'Scroll View', hasChild:true, url:'/examples/scrollview.js'},
	{title:'Image View', hasChild:true, url:'/examples/image_view.js'},
	{title:'Web View', hasChild:true, url:'/examples/webview.js'},
	{title:'Layout', hasChild:true, url:'/examples/layout.js'},
	{title:'Activity indicator', hasChild:true, url:'/examples/activity_indicator.js'},
	{title:'Nested Windows', hasChild:true, url:'/examples/nested_windows.js'},
	{title:'UI Methods', hasChild:true, url:'/examples/ui_methods.js'},
	{title:'Search bar', hasChild:true, url:'/examples/searchbar.js'},
	{title:'Tab group', hasChild:true, url:'/examples/tab_group.js'},
	{title:'Color picker', hasChild:true, url:'/examples/color_picker.js'}


];

var tableView1 = Ti.UI.createTableView({
	rowHeight:60,
	width:'100%',
	data:data1
});

tableView1.addEventListener('click', function(e) {
	var w = Ti.UI.createWindow({
	    title: e.rowData.title,
		url:e.rowData.url
	});
	w.open();
});

UIWin.add(tableView1);


var data2 = [
	{title:'Database', hasChild:true, url:'/examples/database.js'},
	{title:'Geolocation', hasChild:true, url:'/examples/geolocation.js'},
	{title:'Ti Utils', hasChild:true, url:'/examples/ti_utils.js'},
	{title:'Ti Platform', hasChild:true, url:'/examples/ti_platform.js'},
	{title:'Ti Gesture', hasChild:true, url:'/examples/gesture.js'},
	{title:'Ti include', hasChild:true, url:'/examples/ti_include.js'},
	{title:'Ti App.Properties', hasChild:true, url:'/examples/ti_appproperties.js'},
	{title:'Accelerometer', hasChild:true, url:'/examples/accelerometer.js'},
	{title:'Network', hasChild:true, url:'/examples/network.js'},
	{title:'HTTPClient', hasChild:true, url:'/examples/xhr.js'},
	{title:'Unicode', hasChild:true, url:'/examples/unicode.js'},
	{title:'XML', hasChild:true, url:'/examples/xml.js'},

];

var tableView2 = Ti.UI.createTableView({
	rowHeight:60,
	width:'100%',
	data:data2
});

tableView2.addEventListener('click', function(e) {
	var w = Ti.UI.createWindow({
	    title: e.rowData.title,
		url:e.rowData.url
	});
	w.open();
});

platformWin.add(tableView2);

