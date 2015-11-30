function list_kb(_args) {
	var win = Ti.UI.createWindow({
		title:'Keyboard Behavior',
		layout:'vertical'
	});
	
	
	if(Titanium.Platform.osname == 'iphone') {
		win.orientationModes = [Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT]
	}
	var label = Ti.UI.createLabel({
		width:Ti.UI.FILL,
		text:'Focus one of the textfields at the bottom of the listview.\n'+
		'Ensure that the listview scrolls to keep the textfield visible.\n'+
		'Also rotate the device to ensure that keyboard stays up and the focussed field does not change.'
	})
	
	win.add(label);
	
	var myTemplate = {
		properties: {height: 50},
		childTemplates:[
		{
			type:'Ti.UI.TextField',
			bindId:'bindField',
			properties:{ left:10, width:Ti.UI.FILL, borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED, color:'black'}
		}
		]
	}
	
	var section = Ti.UI.createListSection();
	var data = [];
	for (i=0;i<100;i++){
		data.push({template:'myCell',bindField:{value:'Field '+i}});
	}
	section.setItems(data);
	
	var listView = Ti.UI.createListView({
		templates:{'myCell':myTemplate},
		sections:[section]
	})
	
	win.add(listView);

	
	return win;
}

module.exports = list_kb;