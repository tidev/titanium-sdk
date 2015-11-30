function contacts(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	});
	// create table view data object
	Ti.include("/etc/version.js");
	
	var needsAuth = false;
	
	var supportsAuthAPI = (Ti.version >= '2.1.3');
	
	if (Titanium.Platform.name == 'iPhone OS')
	{
		needsAuth = isiOS6Plus();
	}
	
	var infoLabel = Ti.UI.createLabel({top:10});
	var b1 = Ti.UI.createButton({
			bottom:10,
			title:'Request Authorization'
	})
	
	b1.addEventListener('click',function(e){
		Ti.Contacts.requestAuthorization(requestPermission);
	})
	
	self.add(infoLabel);
	self.add(b1);
	
	var requestPermission = function(e) {
		var privs = Ti.Contacts.contactsAuthorization;
		if (privs===Ti.Contacts.AUTHORIZATION_AUTHORIZED){
			performAddressBookFunction();
		}
		else {
			if (privs===Ti.Contacts.AUTHORIZATION_RESTRICTED){
				b1.visible = false;
				b1.enabled = false;
				infoLabel.visible = true;
				infoLabel.text ='Contact authorization restricted. User can not grant permission. '
			}
			else if (privs===Ti.Contacts.AUTHORIZATION_DENIED){
				b1.visible = false;
				b1.enabled = false;
				infoLabel.visible = true;
				infoLabel.text ='Contact authorization denied. User has disallowed contacts use.'
			}
			else if (privs===Ti.Contacts.AUTHORIZATION_UNKNOWN){
				infoLabel.text ='Contact authorization unknown. Request permission from user.'
				infoLabel.visible = true;
				b1.visible = true;
				b1.enabled = true;
			}
			else {
				infoLabel.text = 'Got unknown value for Ti.Contacts.contactsAuthorization';
				infoLabel.visible = true;
				b1.visible = false;
				b1.enabled = false;
			}
		}
		
	}
	var performUnsupported = function() {
		infoLabel.text = 'The Contacts API requires user permission to run successfully. This version of the Titanium SDK does not support contact authorization. Please update to SDK 2.1.3 or later.'
		infoLabel.visible = true;
		b1.visible = false;
		b1.enabled = false;
	}
	var performAddressBookFunction = function() {
		infoLabel.visible = false;
		b1.visible = false;
		b1.enabled = false;

		// create table view data object
		var data = [
			{title:'Contacts picker', hasChild:true, test:'ui/common/phone/contacts_picker'},
			{title:'Search By ID', hasChild:true, test:'ui/common/phone/contacts_searchById'}
		];

		if (Ti.Platform.osname !== 'tizen') {
			data.push({title:'Display people', hasChild:true, test:'ui/common/phone/contacts_db'});
			data.push({title:'Contact images',hasChild:true, test:'ui/common/phone/contacts_image'});
		}

		if (Ti.Platform.osname !== 'android') {
			data.push({title:'Add contact',hasChild:true, test:'ui/common/phone/contacts_add'});
			data.push({title:'Remove contact',hasChild:true, test:'ui/common/phone/contacts_remove'});
		}

		if (Ti.Platform.osname !== 'android' && Ti.Platform.osname !== 'tizen') {
			data.push({title:'Groups',hasChild:true, test:'ui/common/phone/contacts_groups'});
		}
		
		// create table view
		for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'} };
		var tableview = Titanium.UI.createTableView({
			data:data
		});
		
		// create table view event listener
		tableview.addEventListener('click', function(e)
		{
			if (e.rowData.test)
			{
				var ExampleWindow = require(e.rowData.test);
				win = new ExampleWindow({title: e.rowData.title, containingTab: _args.containingTab, tabGroup: _args.tabGroup});
				_args.containingTab.open(win,{animated:true});
			}
		});
		
		// add table view to the window
		self.add(tableview);
	};
	
	if (needsAuth)
	{
		self.add(infoLabel);
		if (supportsAuthAPI) {
			requestPermission();
		}
		else {
			performUnsupported();
		}
	}
	else {
		performAddressBookFunction();
	}

	
	return self;
};

module.exports = contacts;