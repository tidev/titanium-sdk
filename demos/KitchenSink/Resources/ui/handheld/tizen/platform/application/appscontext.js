// Test of Tizen.Apps.getAppsContext.
// This test is Tizen only.

function tizen_appscontext(_args) {
	var self = Titanium.UI.createWindow(),
		Tizen = require('tizen'),
		helper = new (require('ui/handheld/tizen/platform/application/helper'));

	// Return information available about a running application.
	Tizen.Apps.getAppsContext(function(response) {
		if (response.success) {
			var data = [],
				i = 0,
				contexts = response.contexts,
				contextsCount = contexts.length,
				tableview = Ti.UI.createTableView({});

			// Generate app context info to show in the table view
			for (; i < contextsCount; i++) {
				data.push({
					// AlertDialog title
					title: contexts[i].appId + '\n<b>' + contexts[i].id + '</b>',
					app_id: contexts[i].appId,
					id: contexts[i].id
				});
			}
			tableview.data = data;

			// Show dialog with Application information
			tableview.addEventListener('click', helper.showAppInfoById);
			self.add(tableview);
		} else {
			helper.showErrorDialog(response.error);
		}
	});

	return self;

}

module.exports = tizen_appscontext;
