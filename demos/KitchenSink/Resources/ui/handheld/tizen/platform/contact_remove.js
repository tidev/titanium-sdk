// Test for contact functionality. Although the contact functionality is exposed through the
// regular Titanium Contacts API, this test makes use of some Tizen-specific calls and features,
// therefore it's Tizen-only.
//
// This test verifies contact removing.

function remove_contact(args) {
	var wnd = Ti.UI.createWindow({
			title: args.title
		}),
		contactsTable = Ti.UI.createTableView();

	// Enumerate all contacts in the system to display them in a table view.
	// Table view rows will contain "delete" buttons.
	Ti.Contacts.Tizen.getAllPeople(function(response) {
		if (response.success) {
			var persons = response.persons,
				contactsCount = persons.length,
				i = 0,
				data = [];

			for (; i < contactsCount; i++) {
					var row = Ti.UI.createTableViewRow({
							height: 40,
							id: i
						}),
						contactLabel = Ti.UI.createLabel({
							top: 5,
							left: 5,
							width: 220,
							height: 30,
							text: persons[i].fullName
						}),
						delButton = Ti.UI.createButton({
							top: 5,
							left: 240,
							height: 30,
							width: 60,
							title: 'Delete'
						});
					row.add(contactLabel);
					row.add(delButton);

					// The removal happens here.
					(function(index) {
						delButton.addEventListener('click', function(e) {
							var rowsCount = data.length,
								i = 0,
								row;
							for (; i < rowsCount; i++) {
								row = data[i];
								if (row.id !== index) {
									continue;
								}
								data.splice(i, 1);
								contactsTable.data = data;
								break;
							}
							Ti.Contacts.removePerson(persons[index]);
							contactsTable.data = data;
							alert('Contact was removed successfully');
						});
					})(i);
					data.push(row);
			}
			contactsTable.data = data;
		} else {
			alert('Error occured: ' + response.error);
		}
	});

	wnd.add(contactsTable);

	return wnd;
}
module.exports = remove_contact;