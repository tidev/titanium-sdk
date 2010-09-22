// create table view data object
var data = [
	{title:'Contacts picker', hasChild:true, test:'../examples/contacts_picker.js'},
	{title:'Display people', hasChild:true, test:'../examples/contacts_db.js'},
];
if (Ti.Platform.osname !== 'android') {
	data.push({title:'Add contact',hasChild:true, test:'../examples/contacts_add.js'});
	data.push({title:'Remove contact',hasChild:true, test:'../examples/contacts_remove.js'});
};
	data.push({title:'Contact images',hasChild:true, test:'../examples/contacts_image.js'});
if (Ti.Platform.osname !== 'android') {
	data.push({title:'Groups',hasChild:true, test:'../examples/contacts_groups.js'});
};

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test)
	{
		var win = Titanium.UI.createWindow({
			url:e.rowData.test,
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

