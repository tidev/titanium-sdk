function getDataContactsTemplate(){
    var data = [];
    var titleStr = '';
 	var subtitleStr = '';
    for(i=0;i<10;i++) {
        var mod = i%4;
        titleStr += 'Clip .. ';
        var acType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
        if(mod == 1) {
        	subtitleStr = 'I have checkmark accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
        } else if(mod == 2) {
        	subtitleStr = 'I have detail accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DETAIL;
        } else if (mod == 3) {
        	subtitleStr = 'I have disclosure accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE;
        } else {
        	subtitleStr = 'I have no accessory ';
        }
        var item = {
            template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS,
            properties: {title:i+' '+titleStr, subtitle:subtitleStr, accessoryType:acType, itemId:'Item '+i+' '+acType}
        }
        data.push(item)
    }
    return data;
}

function getDataSubtitleTemplate(){
    var data = [];
    var titleStr = '';
 	var subtitleStr = '';
    for(i=0;i<10;i++) {
        var mod = i%4;
        titleStr += 'Look at me grow .. ';
        var acType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
        if(mod == 1) {
        	subtitleStr = 'I have checkmark accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
        } else if(mod == 2) {
        	subtitleStr = 'I have detail accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DETAIL;
        } else if (mod == 3) {
        	subtitleStr = 'I have disclosure accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE;
        } else {
        	subtitleStr = 'I have no accessory ';
        }
        var item = {
            template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE,
            properties: {title:i+' '+titleStr, subtitle:subtitleStr+' '+titleStr, accessoryType:acType, itemId:'Item '+i+' '+acType}
        }
        data.push(item)
    }
    return data;
}

function getDataSettingsTemplate(){
    var data = [];
    var titleStr = '';
 	var subtitleStr = '';
    for(i=0;i<10;i++) {
        var mod = i%4;
        titleStr += 'Push subtitle .. ';
        var acType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
        if(mod == 1) {
        	subtitleStr = 'I have checkmark accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
        } else if(mod == 2) {
        	subtitleStr = 'I have detail accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DETAIL;
        } else if (mod == 3) {
        	subtitleStr = 'I have disclosure accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE;
        } else {
        	subtitleStr = 'I have no accessory ';
        }
        var item = {
            template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS,
            properties: {title:i+' '+titleStr, subtitle:subtitleStr, accessoryType:acType, itemId:'Item '+i+' '+acType}
        }
        data.push(item)
    }
    return data;
}

function getDataDefaultTemplate(){
    var data = [];
    var titleStr = '';
 	var subtitleStr = '';

    for(i=0;i<10;i++) {
        var mod = i%4;
        titleStr += 'Clip... ';
        var acType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
        if(mod == 1) {
        	subtitleStr = 'I have checkmark accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
        } else if(mod == 2) {
        	subtitleStr = 'I have detail accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DETAIL;
        } else if (mod == 3) {
        	subtitleStr = 'I have disclosure accessory ';
            acType = Ti.UI.LIST_ACCESSORY_TYPE_DISCLOSURE;
        } else {
        	subtitleStr = 'I have no accessory ';
        }
        var item = {
            template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT,
            properties: {title:i+' '+subtitleStr +' '+titleStr, accessoryType:acType, itemId:'Item '+i+' '+acType}
        }
        data.push(item)
    }
    return data;
}

function list_basic(_args) {
	var win = Ti.UI.createWindow({
		title:'Built in Templates'
	});
	
	var platformName = Titanium.Platform.osname;
	var isIOS = (platformName == 'iphone' || platformName == 'ipad');
	
	var listView = Ti.UI.createListView();
	if (isIOS) {
		listView.style=Ti.UI.iPhone.ListViewStyle.GROUPED
	}
	
	var sections = [];
	
	var listSection1 = Ti.UI.createListSection({
        headerTitle:'TEMPLATE_DEFAULT'
    })
    listSection1.setItems(getDataDefaultTemplate());
    sections.push(listSection1);
	
	if (isIOS) {
		var listSection2 = Ti.UI.createListSection({
	        headerTitle:'TEMPLATE_SETTINGS'
	    })
	    listSection2.setItems(getDataSettingsTemplate());
	    sections.push(listSection2);
	
		var listSection3 = Ti.UI.createListSection({
	        headerTitle:'TEMPLATE_SUBTITLE'
	    })
	    listSection3.setItems(getDataSubtitleTemplate());
	    sections.push(listSection3);
	
		var listSection4 = Ti.UI.createListSection({
	        headerTitle:'TEMPLATE_CONTACTS'
	    })
	    listSection4.setItems(getDataContactsTemplate());
	    sections.push(listSection4);
	}
	listView.setSections(sections);
	
	win.add(listView);
	
	return win;
};


module.exports = list_basic;