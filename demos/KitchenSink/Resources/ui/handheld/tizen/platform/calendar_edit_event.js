// Test for Tizen calendar functionality. Test of editing calendar events.
// This test is part of the "calendar_events_list" test.
// Tizen only.

function edit_event(args) {
	var self = Ti.UI.createWindow({
			title: args.title
		}),
		Tizen = require('tizen'),
		calendar = Tizen.Calendar.getDefaultCalendar('EVENT'),
		calendarEvent = calendar.get(args.id),
		startDate = calendarEvent.startDate,
		labelLeftPos = 10,
		labelWidth = '40%',
		height = 30,
		top = 10,
		inputLeftPos = '45%',
		inputWidth = '50%',

		// Add controls for summary display
		summaryLabel = Ti.UI.createLabel({
			left: labelLeftPos,
			top: top,
			height: height,
			width: labelWidth,
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			text: 'Summary:'
		});	
	self.add(summaryLabel);

	var summaryInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: calendarEvent.summary
	});
	self.add(summaryInput);

	top += height + 10;

	// Shows calendar event description
	var descriptionLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Description:'
	}); 
	self.add(descriptionLabel);

	var descriptionInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: calendarEvent.description
	});
	self.add(descriptionInput);

	top += height + 10;

	// Shows calendar event location
	var locationLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		width: labelWidth,
		height: height,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Location:'
	}); 
	self.add(locationLabel);

	var locationInput = Ti.UI.createTextField({
		borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
		top: top,
		left: inputLeftPos,
		width: inputWidth,
		height: height,
		value: calendarEvent.location
	});
	self.add(locationInput);

	top += height + 10;

	// Shows calendar event time
	var timeLabel = Ti.UI.createLabel({
		left: labelLeftPos,
		top: top,
		height: height,
		width: Ti.UI.FILL,
		textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		text: 'Time:'
	});
	self.add(timeLabel);

	top += height + 20;

	// Selects alternative time for the calendar event
	var timePicker = Ti.UI.createPicker({
		type: Ti.UI.PICKER_TYPE_DATE_AND_TIME,
		value: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startDate.getHours(), startDate.getMinutes(), 0),
		width: '100%',
		top: top
	});
	self.add(timePicker);

	top += height + 40;

	var updateButton = Ti.UI.createButton({
		title: 'Update event',
		top: top
	});
	self.add(updateButton);	

	updateButton.addEventListener('click',  function(e) {
		var summary = summaryInput.value.trim(),
			description = descriptionInput.value.trim(),
			location = locationInput.value.trim(),
			d = getCalendarStartDate(),
			tzDate = new Date(d.yy, d.mm, d.dd, d.h, d.m),
			duration = 3600000;

		try {
			calendarEvent.summary = summary;
			calendarEvent.description = description;
			calendarEvent.startDate = tzDate;
			calendarEvent.duration = duration;
			calendarEvent.location = location;

			calendar.update(calendarEvent);

			// Update table in previous window
			Ti.App.fireEvent('UpdateEventsTable');
		} catch (err) {
			alert('Error: type: ' +  err.type + "; message: " + err.message);
			return ;
		}
		alert('Event was updated successfully.');
	});

	function getCalendarStartDate() {
		var times = timePicker.value;

		return {
			yy: times.getUTCFullYear(),
			mm: times.getMonth(),
			dd: times.getUTCDate(),
			h: times.getHours(),
			m: times.getUTCMinutes()
		};
	}

	return self;
}
module.exports = edit_event;