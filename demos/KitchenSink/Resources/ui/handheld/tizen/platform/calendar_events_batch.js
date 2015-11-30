// Test for Tizen calendar functionality. Test of batch operations on calendar events.
// Tizen only.

function events_batch(args) {
	var ADD_BATCH = 1,
		UPDATE_BATCH = 2,
		DELETE_BATCH = 3;

	var self = Ti.UI.createWindow({
			title: args.title
		}),
		Tizen = require('tizen'),
		calendar = Tizen.Calendar.getDefaultCalendar('EVENT'),
		data = [
			{ title: 'Add three events', test: ADD_BATCH },
			{ title: 'Update last three events', test: UPDATE_BATCH },
			{ title: 'Delete last three events', test: DELETE_BATCH }
		],
		tableview = Ti.UI.createTableView({
			rowHeight: 40,
			top: 120
		}),
		summaryLabel = Ti.UI.createLabel({
			text: 'Summary',
			width: '30%',
			left: 0,
			heigh: 40,
			top: 10
		}),
		summaryInput = Ti.UI.createTextField({
			left: '40%',
			width: '50%',
			height: 20,
			top: 10,
			borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
		});

	self.add(summaryLabel);
	self.add(summaryInput);

	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			switch (e.rowData.test) {
				case ADD_BATCH: 
					addBatch();
					break;
				case UPDATE_BATCH:
					updateBatch();
					break;
				case DELETE_BATCH:
					deleteBatch();
			}
		}
	});

	tableview.data = data;

	self.add(tableview);

	function addBatch() {
		var value = summaryInput.value.trim(),
			eventsArr = [],
			startDate = new Date(),
			duration = 3600000;

		if (!value) {
			alert('Please enter summary');
			return ;
		}

		eventsArr[0] = Tizen.Calendar.createCalendarEvent({
			summary : value,
			startDate : startDate,
			duration : duration
		});

		eventsArr[1] = eventsArr[0].clone();
		eventsArr[1].summary += ' copy 1';
		eventsArr[2] = eventsArr[0].clone();
		eventsArr[2].summary += ' copy 2';

		calendar.addBatch(eventsArr, function(response) {
			if(response.success) {
				summaryInput.value = '';
				alert('Events were added successfully');
			} else {
				onError(response.error);
			}
		});

	}

	function updateBatch() {
		var value = summaryInput.value.trim();
		if (!value) {
			alert('Please enter summary');
			return ;
		}
		calendar.find(function(response) {
			if (response.success) {
				var eventsArr = [],
					events = response.items,
					i = events.length - 1,
					j = 0;

				if (i < 2) {
					alert('You should have at least three events. Now you have ' + events.length + ' events');
					return ;
				}

				for (; i >= 0, j < 3; i--, j++) {
					events[i].summary = value;
					eventsArr.push(events[i]);
				}
				calendar.updateBatch(eventsArr, function(response) {
					if (response.success) {
						summaryInput.value = '';
						alert('Events were updated successfully');
					} else {
						onError(response.error);
					}
				});
			} else {
				onError(response.error);
			}
		});
	}

	function deleteBatch() {
		calendar.find(function(response) {
			if (response.success) {
				var eventsArr = [],
					events = response.items,
					i = events.length - 1,
					j = 0;

				if (i < 2) {
					alert('You should have at least three events. Now you have ' + events.length + ' events');
					return ;
				}

				for (; i >= 0 && j < 3; i--, j++) {
					eventsArr.push(events[i].id);
				}
				try {
					calendar.removeBatch(eventsArr, function(response) {
						if (response.success) {
							alert('Events were removed successfully');
						} else {
							onError(response.error);
						}
					});
				} catch (err) {
					alert('Exception: ' + err.message);
				}
			} else {
				onError(response.error);
			}
		});
	}

	function onError(err) {
		alert('Error: ' + err);
	}

	return self;
}
module.exports = events_batch;