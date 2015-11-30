function isValidVar(check){
	if (check !== undefined && check !== null){
		return true;
	}
	return false;
}

function genData (persons){
	var data = [];
	for(i=0;i<persons.length;i++){
		var person = persons[i];
		var phoneObj = person.phone;
		var phonestr = ' No Home, Work or Mobile number';
		if(isValidVar(phoneObj['home'])) {
			phoneStr = 'Home: '+phoneObj['home']
		} else if (isValidVar(phoneObj['work'])) {
			phoneStr = 'Work: '+phoneObj['work']
		} else if (isValidVar(phoneObj['mobile'])) {
			phoneStr = 'Mobile: '+phoneObj['mobile']
		} 
		var nameStr = '';
		
		if(isValidVar(person.fullName)) {
			nameStr = person.fullName;
		} else {
			if(isValidVar(person.perfix)) {
				nameStr += person.perfix+' ';
			}
			if(isValidVar(person.firstName)) {
				nameStr += person.firstName+' ';
			}
			if(isValidVar(person.middleName)) {
				nameStr += person.middleName+' ';
			}
			if(isValidVar(person.lastName)) {
				nameStr += person.lastName+' ';
			}
			if(isValidVar(person.suffix)) {
				nameStr += person.suffix;
			}
		}
		var imageObj = 'http://placehold.it/50x50'; 
		if(isValidVar(person.image)) {
			imageObj = person.image;
		}

		data.push({avatar:{image:imageObj},info:{text:nameStr+'\n'+phonestr}})
	}
	
	return data;
}

function setupTest(win, persons){
	var myTemplate = {
		properties: {height:60,backgroundColor:'black'},
		childTemplates: [
		{
			type: 'Ti.UI.ImageView',
			bindId: 'avatar',
			properties: {
				left: 10,
				width: 50, height: 50
			},
		},
		{
			type: 'Ti.UI.Label',
			bindId: 'info',
			properties: {
				color: 'white',
				font: { fontFamily:'Arial', fontSize: 13, fontWeight:'bold' },
				left: 70, top: 5, bottom:5, wordWrap:true, ellipsize:true,
				width: Ti.UI.FILL, height: 50
			},
		}
		]
	};	
	
	var section = Ti.UI.createListSection({headerTitle:'Who\'s in my contacts'});
	section.setItems(genData(persons));
	if (Titanium.Platform.name == 'iPhone OS'){
		var listView = Ti.UI.createListView({
			sections: [section],
			templates: { 'template': myTemplate },
			defaultItemTemplate: 'template',
			backgroundColor: '#cccccc',
			style:Ti.UI.iPhone.ListViewStyle.GROUPED
		});
	
		win.add(listView);	
	} else {
		var listView = Ti.UI.createListView({
			sections: [section],
			templates: { 'template': myTemplate },
			defaultItemTemplate: 'template',
			backgroundColor: '#cccccc',
		});
	
		win.add(listView);	
	}
}

function performAddressBookFunction(win){
	var desc = Ti.UI.createLabel({
		text:'This is a list View that uses a custom template that holds an imageView and a label.\n'+
		'The data is loaded from the phones contacts.\n'+
		'Expected performance is a smooth scroll experience.\n'+
		'On scrolling back and forth in the list view, the right image must be loaded.(since we are reusing views)\n\n'
	})
	
	var button = Ti.UI.createButton({title:'Show Me',top:10});
	
	win.add(desc);
	win.add(button);
	
	button.addEventListener('click',function(){
		desc.text = 'Loading Contacts...';
		var persons = Ti.Contacts.getAllPeople();
		if (persons.length > 0) {
			win.remove(button);	
			setupTest(win, persons);
			win.remove(desc);
		} else {
			desc.text = 'No Contacts on device.'
			win.remove(button);
		}
	})
}

function list_performance_contacts(_args) {
	var win = Ti.UI.createWindow({
		title:'Contacts Test',
		orientationModes:[Ti.UI.PORTRAIT],
		layout:'vertical'
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
	var requestPermission = function(e) {
		var privs = Ti.Contacts.contactsAuthorization;
		if (privs===Ti.Contacts.AUTHORIZATION_AUTHORIZED){
			win.remove(infoLabel);
			performAddressBookFunction(win);
		}
		else {
			if (privs===Ti.Contacts.AUTHORIZATION_RESTRICTED){
				infoLabel.text ='Contact authorization restricted. User can not grant permission. '
			}
			else if (privs===Ti.Contacts.AUTHORIZATION_DENIED){
				infoLabel.text ='Contact authorization denied. User has disallowed contacts use.'
			}
			else if (privs===Ti.Contacts.AUTHORIZATION_UNKNOWN){
				infoLabel.text ='Contact authorization unknown. Request permission from user.'
			}
			else {
				infoLabel.text = 'Got unknown value for Ti.Contacts.contactsAuthorization';
			}
		}
		
	}
	if (needsAuth)
	{
		win.add(infoLabel);
		if (supportsAuthAPI) {
			requestPermission();
		}
		else {
			infoLabel.text = 'The Contacts API requires user permission to run successfully. This version of the Titanium SDK does not support contact authorization. Please update to SDK 2.1.3 or later.'
		}
	}
	else {
		performAddressBookFunction(win);
	}
	return win;
}

module.exports = list_performance_contacts;