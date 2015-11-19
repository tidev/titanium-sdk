// Tests of the Tizen messaging (SMS) functionality.
//
// Tizen only.

function sms(args) {
	var self = Ti.UI.createWindow({
			title: 'Messaging: sms'
		}),
		tableview = Ti.UI.createTableView({
			data: [
				{ title: 'Send', test: 'ui/handheld/tizen/platform/messaging/sms_send' },
				{ title: 'History', test: 'ui/handheld/tizen/platform/messaging/sms_history' }
			]
		});

	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title: e.rowData.title, containingTab: args.containingTab});

			args.containingTab.open(win);
		}
	});

	self.add(tableview);

	return self;
}

module.exports = sms;