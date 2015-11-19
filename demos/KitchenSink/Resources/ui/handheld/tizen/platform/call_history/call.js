// Tests for Tizen call history functionality. 
// Tizen only.

function call(args) {
	var self = Ti.UI.createWindow({
			title: 'Call'
		}),
		tableview = Ti.UI.createTableView({
			data: [
				{ title: 'Manage history', test: 'ui/handheld/tizen/platform/call_history/manage_history' },
				{ title: 'Listeners', test: 'ui/handheld/tizen/platform/call_history/listeners' },
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

module.exports = call;