// Test for Tizen calendar functionality. Test of listing calendar events.
// Upon event selection, event editing is also tested in the "calendar_edit_event" test.
// Tizen only.

function events_list(args) {
	var self = Ti.UI.createWindow({
			title: args.title
		}),
		Tizen = require('tizen'),
		calendar = Tizen.Calendar.getDefaultCalendar('EVENT'),
		tableview = Ti.UI.createTableView(),
		emptyList = Ti.UI.createLabel({
			text: 'List empty.',
			top: 10,
			left: 5
		});

	tableview.addEventListener('click', function(e) {
		var wnd = new (require('ui/handheld/tizen/platform/calendar_edit_event'))({
			title: args.title,
			containingTab: args.containingTab,
			id: e.rowData.eventId
		});
		args.containingTab.open(wnd, { animated: true });
	});

	// Emumerate all events
	calendar.find(function (response) {
		if (response.success) {
			var events = response.items, 
				list = fillEventsTable(events);

			(list.length === 0) && self.add(emptyList);
			tableview.data = list;
		} else {
			onError(response.error);
		}
	});

	self.add(tableview);

	// Update events table after editing single event
	Ti.App.addEventListener('UpdateEventsTable',  function(e) {
		calendar.find(function (response) {
			if (response.success) {
				tableview.data = fillEventsTable(response.items);
			} else {
				onError(response.error);
			}
		});
	});

	// Populate the table with the calendar events. Clicking on a table row will
	// initiate editing of the corresponding event.
	function fillEventsTable(events) {
		var data = [],
			eventsCount = events.length,
			i = 0;

		// Create table rows that correspond to calendar events
		for (; i < eventsCount; i++) {
			var row = Ti.UI.createTableViewRow({
					height: 40,
					id: i,
					eventId: events[i].id
				}),
				// Event summary label
				label = Ti.UI.createLabel({
					top: 5,
					left: 5,
					width: 160,
					height: 30,
					text: events[i].summary	
				}),
				// Event deletion button
				delButton = Ti.UI.createButton({
					top: 5,
					left: 220,
					height: 30,
					width: 60,
					title: 'Delete'	
				});

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
						tableview.data = data;
						break;
					}

					calendar.remove(events[index].id);
					tableview.data = data;

					(data.length === 0) && self.add(emptyList);

					alert('Event was removed successfully');
				});	
			})(i);

			row.add(label);
			row.add(delButton);

			data.push(row);
		}

		return data;
	}

	function onError(err) {
		alert('Error: ' + err);
	}

	return self;
}

module.exports = events_list;