function getDataContactsTemplate(){
    var data = [
    {template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS, properties: {title:'NO SUBTITLE'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS, properties: {subtitle:'NO TITLE'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS, properties: {title:'TITLE',subtitle:'RED COLOR TITLE',color:'red'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS, properties: {title:'TITLE',subtitle:'FONT ITALIC',font:{ fontStyle: 'italic' }}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS, properties: {title:'BOTH',subtitle:'RED ITALIC FONT',font:{ fontStyle: 'italic' }, color:'red'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS, properties: {title:'IMAGE',subtitle:'IGNORED PROPERTY'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS, properties: {subtitle:'CAN NOT CUSTOMIZE SUBTITLE'}}
    ];
    return data;
}

function getDataSubtitleTemplate(){
    var data = [
	{template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE,properties: {title:'NO SUBTITLE'}},    
	{template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE,properties: {subtitle:'NO TITLE'}},    
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE, properties: {title:'TITLE',subtitle:'RED COLOR TITLE',color:'red'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE, properties: {title:'TITLE',subtitle:'FONT ITALIC',font:{ fontStyle: 'italic' }}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE, properties: {title:'LOCAL IMAGE',subtitle:'apple logo',image:'images/apple_logo.jpg'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE, properties: {title:'REMOTE IMAGE',subtitle:'WONT WORK ON IOS',image:'http://placehold.it/27x27'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE, properties: {title:'ALL THREE',subtitle:'RED ITALIC FONT AND LOCAL IMAGE',font:{ fontStyle: 'italic' },color:'red',image:'images/apple_logo.jpg'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SUBTITLE, properties: {subtitle:'CAN NOT CUSTOMIZE SUBTITLE'}}
    ];
    return data;
}

function getDataSettingsTemplate(){
    var data = [
	{template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS,properties: {title:'NO SUBTITLE'}},    
	{template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS,properties: {subtitle:'NO TITLE'}},    
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS, properties: {title:'TITLE',subtitle:'RED COLOR TITLE',color:'red'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS, properties: {title:'TITLE',subtitle:'FONT ITALIC',font:{ fontStyle: 'italic' }}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS, properties: {title:'LOCAL IMAGE',subtitle:'apple logo',image:'images/apple_logo.jpg'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS, properties: {title:'REMOTE IMAGE',subtitle:'WONT WORK ON IOS',image:'http://placehold.it/27x27'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS, properties: {title:'ALL THREE',subtitle:'RED ITALIC FONT AND LOCAL IMAGE',font:{ fontStyle: 'italic' },color:'red',image:'images/apple_logo.jpg'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_SETTINGS, properties: {title:'CAN NOT', subtitle:'CUSTOMIZE SUBTITLE'}}
    ];
    return data;
}

function getDataDefaultTemplate(){
    var data = [
    {template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'RED COLOR TITLE',color:'red'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'FONT ITALIC',font:{ fontStyle: 'italic' }}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'LOCAL IMAGE',image:'images/apple_logo.jpg'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'REMOTE IMAGE WONT WORK ON IOS',image:'http://placehold.it/27x27'}},
    {template:Ti.UI.LIST_ITEM_TEMPLATE_DEFAULT, properties: {title:'ALL THREE RED ITALIC FONT AND LOCAL IMAGE',font:{ fontStyle: 'italic' },color:'red',image:'images/apple_logo.jpg'}},
    ];
    return data;
}

function list_basic_customize(_args) {
	var win = Ti.UI.createWindow({
		title:'Customize'
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


module.exports = list_basic_customize;