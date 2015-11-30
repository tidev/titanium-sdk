// Tizen Bluetooth tests.

function bluetooth(args) {
	var self = Ti.UI.createWindow({
			title: args.title
		}),
		data = [
			{title: 'Bluetooth general', hasChild: false, test: 'ui/handheld/tizen/platform/btGeneral'},
			{title: 'Bluetooth msg server', hasChild: false, test: 'ui/handheld/tizen/platform/btServer'},
			{title: 'Bluetooth msg client', hasChild: false, test: 'ui/handheld/tizen/platform/btClient'}
		],
		tableview = Ti.UI.createTableView({
			data: data
		});

	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({
					title: e.rowData.title,
					containingTab: args.containingTab
				});
			args.containingTab.open(win, {animated: true});
		}
	});

	self.add(tableview);

	return self;
}

module.exports = bluetooth;
