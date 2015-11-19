// Test of the Tizen messaging (email and SMS) functionality.
//
// Tizen only.

function messaging(args) {
	var self = Ti.UI.createWindow({
			title: 'Messaging'
		}),
		tableview = Ti.UI.createTableView({
			data: [
				{ title: 'SMS', hasChild: true, test: 'ui/handheld/tizen/platform/messaging/sms' },
				{ title: 'Email', hasChild: true, test: 'ui/handheld/tizen/platform/messaging/email' }
			]
		});

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

module.exports = messaging;