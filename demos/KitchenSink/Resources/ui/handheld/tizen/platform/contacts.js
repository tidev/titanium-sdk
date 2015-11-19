// Test fors contact functionality. Although the contact functionality is exposed through the
// regular Titanium Contacts API, these tests make use of some Tizen-specific calls and features,
// therefore they are Tizen-only.

function tizen_contacts(args) {
	var self = Ti.UI.createWindow({
			title: args.title
		}),
		data = [
			{ title: 'Add contact', test: 'ui/handheld/tizen/platform/contacts_add' },
			{ title: 'Find contacts',  test: 'ui/handheld/tizen/platform/contacts_find' },
			{ title: 'Remove contacts', test: 'ui/handheld/tizen/platform/contact_remove' }
		],
		tableview = Ti.UI.createTableView({ data: data });

	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({ title: e.rowData.title, containingTab: args.containingTab });
			args.containingTab.open(win, { animated: true });
		}
	});
	
	self.add(tableview);
	
	return self;
}

module.exports = tizen_contacts;
