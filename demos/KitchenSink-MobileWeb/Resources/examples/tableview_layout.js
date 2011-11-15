
var win = Titanium.UI.currentWindow;
win.backgroundImage = '/images/tableview/brown_bg_482.png';


// data for tableview
var data = [

	{title:'Play Movie',backgroundImage:'/images/tableview/off_1.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_1.png'},

	{title:'Camera',backgroundImage:'/images/tableview/off_2.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_2.png'},

	{title:'Vibrate',backgroundImage:'/images/tableview/off_3.png', height: 80, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_3.png'},

	{title:'Orientation',backgroundImage:'/images/tableview/off_4.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
		selectedBackgroundImage:'/images/tableview/on_4.png'},

	{title:'Photo Gallery',backgroundImage:'/images/tableview/off_1.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_1.png'},

	{title:'Geo Location',backgroundImage:'/images/tableview/off_2.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_2.png'},

	{title:'Accelerometer',backgroundImage:'/images/tableview/off_3.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_3.png'},

	{title:'Sound',backgroundImage:'/images/tableview/off_4.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_4.png'},

	{title:'Shake',backgroundImage:'/images/tableview/off_1.png', height: 43,color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_1.png'},

	{title:'Email Client',backgroundImage:'/images/tableview/off_2.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_2.png'},

	{title:'Save to Gallery',backgroundImage:'/images/tableview/off_3.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			selectedBackgroundImage:'/images/tableview/on_3.png'},

	{title:'Contacts',backgroundImage:'/images/tableview/off_4.png', height: 43, color:'black', font:{fontSize:16,fontWeight:'bold'},
			 selectedBackgroundImage:'/images/tableview/on_4.png'}
];

// tableview object
var tableView = Titanium.UI.createTableView({
	backgroundColor:'transparent',
	data:data,
	separatorStyle:Ti.UI.iPhone.TableViewSeparatorStyle.NONE,
	top:10,
	width: 300,
});

var wrapperView = Titanium.UI.createView({backgroundColor:'transparent',width:400});

wrapperView.add(tableView);
win.add(wrapperView);

//win.add(tableView);
