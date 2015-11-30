// Test for Tizen calendar functionality. Test of Tizen.Calendar.createCalendarEvent.
// This test is Tizen only.

function add_event(args) {
	var self = Ti.UI.createWindow({
			title: args.title
		}),
		Tizen = require('tizen'),
		calendar = Tizen.Calendar.getDefaultCalendar('EVENT'),
		labelLeftPos = 10,
		labelWidth = '40%',
		height = 30,
		top = 10,
		inputLeftPos = '45%',
		inputWidth = '50%',

		// Add controls for summary
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
		height: height
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
		height: height
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
		height: height
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

	top += height + 10;

	// Selects time for new calendar event
	var timePicker = Ti.UI.createPicker({
		type: Ti.UI.PICKER_TYPE_DATE_AND_TIME,
		value: new Date(), 
		width: Ti.UI.FILL,
		top: top
	});
	self.add(timePicker);

	top += height + 20;

	var saveButton = Ti.UI.createButton({
		title: 'Add event',
		top: top
	});
	self.add(saveButton);

	saveButton.addEventListener('click',  function(e) {
		var summary = summaryInput.value.trim(),
			description = descriptionInput.value.trim(),
			location = locationInput.value.trim(),
			d = getCalendarStartDate();
		try {
			var calendarEvent = Tizen.Calendar.createCalendarEvent({
				description: description,
				summary: summary,
				startDate: new Date(d.yy, d.mm, d.dd, d.h, d.m),
				duration: 3600000,
				location: location
			});
			calendar.add(calendarEvent);
		} catch (err) {
			Ti.API.error('Error. Type: ' + err.type + ", message: " + err.message);

			return;
		}

		Ti.API.info('Event was added successfully.');

		summaryInput.value = '';
		descriptionInput.value = '';
		locationInput.value = '';
		timePicker.value = new Date();
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

module.exports = add_event;