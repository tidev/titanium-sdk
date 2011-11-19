Ti.include('../common.js');

// create table view data object
var data = [
	{title:'Contacts picker', test:'../examples/contacts_picker.js'},
	{title:'Display people', test:'../examples/contacts_db.js'},
	{title:'Contact images',test:'../examples/contacts_image.js'}
];

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));