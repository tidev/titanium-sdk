// Tests for Tizen calendar functionality.

function tizen_calendar(args) {
	var self = Ti.UI.createWindow({
			title: args.title
		}),
		data = [
			{ title: 'Events list', test: 'ui/handheld/tizen/platform/calendar_events_list' },
			{ title: 'Add event', test: 'ui/handheld/tizen/platform/calendar_add_event' },
			{ title: 'Batch', test: 'ui/handheld/tizen/platform/calendar_events_batch' }
		],
		tableview = Ti.UI.createTableView({data: data});

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
module.exports = tizen_calendar;