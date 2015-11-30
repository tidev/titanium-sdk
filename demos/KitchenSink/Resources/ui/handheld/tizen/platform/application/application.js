// Tests of Tizen's application control functionality.
// These tests are Tizen only.

function tizen_application(_args) {
	var self = Titanium.UI.createWindow(), 
		tableview = Ti.UI.createTableView({
			data : [
				{ title: 'Installed App Info', hasChild: true, test: 'ui/handheld/tizen/platform/application/appsinfo' }, 
				{ title: 'Running App Info', hasChild: true, test: 'ui/handheld/tizen/platform/application/appscontext' }, 
				{ title: 'Exit / Hide / Launch', hasChild: true, test: 'ui/handheld/tizen/platform/application/exit_hide_launch' }
			]
		}),
		Tizen = require('tizen');

	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			var TizenApplication = require(e.rowData.test), 
				win = new TizenApplication({
					title : e.rowData.title,
					containingTab : _args.containingTab
				});

			_args.containingTab.open(win, {
				animated : true
			});
		}
	});

	self.add(tableview);

	return self;
}
module.exports = tizen_application;
