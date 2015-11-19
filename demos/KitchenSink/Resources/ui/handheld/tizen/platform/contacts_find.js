function find_contacts(args) {
	var self = Ti.UI.createWindow({
			title: args.title
		}),
		contactsTable = Ti.UI.createTableView({
			top: 50
		});

	var searchInput = Ti.UI.createTextField({
		top: 10,
		left: 10,
		width: '60%',
		height: 30,
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
	});
	self.add(searchInput);

	var searchButton = Ti.UI.createButton({
		top: 10,
		left: '70%',
		width: '25%',
		height: 30,
		title: 'Search'
	});
	self.add(searchButton);

	searchButton.addEventListener('click', function(e) {
		Ti.Contacts.Tizen.getPeopleWithName(searchInput.value, function(response) {
			if (response.success) {
				var persons = response.persons,
					contactsCount = persons.length,
					i = 0,
					tableData = [];
				if (contactsCount === 0) {
					searchInput.value = '';
					alert('Contact(s) not found');
					return false;
				}
				for (; i < contactsCount; i++) {
					var row = Ti.UI.createTableViewRow({
							height: 40
						}),
						contactLabel = Ti.UI.createLabel({
							top: 5,
							left: 5,
							width: 160,
							height: 30,
							text: persons[i].fullName
						}),
						viewButton = Ti.UI.createButton({
							top: 5,
							left: 170,
							height: 30,
							width: 60,
							title: 'View'
						}),
						editButton = Ti.UI.createButton({
							top: 5,
							left: 240,
							height: 30,
							width: 60,
							title: 'Edit'
						});
					row.add(contactLabel);
					row.add(viewButton);
					row.add(editButton);

					(function(index) {
						var wnd;
						viewButton.addEventListener('click', function(e) {
							wnd = new  (require('ui/handheld/tizen/platform/contact_view'))({ title: 'View contact details', contactId: persons[index].id });
							args.containingTab.open(wnd, { animated: true });
						});
						editButton.addEventListener('click', function(e) {
							wnd = new  (require('ui/handheld/tizen/platform/contact_edit'))({ title: 'Edit contact details', contactId: persons[index].id });
							args.containingTab.open(wnd, { animated: true });
							contactsTable.data = [];
							searchInput.value = "";
						});
					})(i);
					
					tableData.push(row);
				}

				contactsTable.data = tableData;
			} else {
				alert('Error occured: ' + response.error);
			}
		});
	});
	
	self.add(contactsTable);
	
	return self;
}
module.exports = find_contacts;
