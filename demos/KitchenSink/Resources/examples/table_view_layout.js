//FIXME: JGH redo

var win = Titanium.UI.currentWindow;
win.backgroundImage = '../images/tableview/brown_bg_482.png';

// create table view template
var template = {
 	layout:[
   		{type:'text', left:50,  name:'title', fontSize:18, fontWeight:'bold', color:'#0e0500 ', top:12},
   		{type:'image', left:15, name:'image', width: 31, height: 28 }
	]
};

// data for tableview
var data = [

	{rowHeight:10},	// create an empty row to give it space up top..

	{title:'Play Movie',backgroundImage:'../images/tableview/off_1.png',
			selectedBackgroundImage:'../images/tableview/on_1.png', image: '../images/tableview/phone_playmovie.png'},

	{title:'Camera',backgroundImage:'../images/tableview/off_2.png',
			selectedBackgroundImage:'../images/tableview/on_2.png', image: '../images/tableview/phone_camera.png'},

	{title:'Vibrate',backgroundImage:'../images/tableview/off_3.png',
			selectedBackgroundImage:'../images/tableview/on_3.png', image: '../images/tableview/phone_vibrate.png'},

	{title:'Orientation',backgroundImage:'../images/tableview/off_4.png',
		selectedBackgroundImage:'../images/tableview/on_4.png', image: '../images/tableview/phone_orientation.png'},

	{title:'Photo Gallery',backgroundImage:'../images/tableview/off_1.png',
			selectedBackgroundImage:'../images/tableview/on_1.png', image: '../images/tableview/phone_photogallery.png'},

	{title:'Geo Location',backgroundImage:'../images/tableview/off_2.png',
			selectedBackgroundImage:'../images/tableview/on_2.png', image: '../images/tableview/phone_geoloc.png'},

	{title:'Accelerometer',backgroundImage:'../images/tableview/off_3.png',
			selectedBackgroundImage:'../images/tableview/on_3.png', image: '../images/tableview/phone_accelerometer.png'},

	{title:'Sound',backgroundImage:'../images/tableview/off_4.png',
			selectedBackgroundImage:'../images/tableview/on_4.png', image: '../images/tableview/phone_sound.png'},

	{title:'Shake',backgroundImage:'../images/tableview/off_1.png',
			selectedBackgroundImage:'../images/tableview/on_1.png', image: '../images/tableview/phone_shake.png'},

	{title:'Email Client',backgroundImage:'../images/tableview/off_2.png',
			selectedBackgroundImage:'../images/tableview/on_2.png', image: '../images/tableview/phone_email.png'},

	{title:'Save to Gallery',backgroundImage:'../images/tableview/off_3.png',
			selectedBackgroundImage:'../images/tableview/on_3.png', image: '../images/tableview/phone_savetogallery.png'},

	{title:'Contacts',backgroundImage:'../images/tableview/off_4.png',
			 selectedBackgroundImage:'../images/tableview/on_4.png', image: '../images/tableview/phone_contact.png'}
];

// tableview object
var tableView = Titanium.UI.createTableView({
	template:template,
	backgroundColor:'transparent',
	borderColor:'transparent',
	data:data
});

win.add(tableView);
