function apps_helper(_args) {
	var Tizen = require('tizen');

	return {
		// Function shows AlertDialog with app information
		// e.rowData.app_id - should contain application id
		// e.rowData.title - Should contain dialog title
		showAppInfoById: function(e) {
			var self = this;
			if (e.rowData && e.rowData.app_id) {
				var appInfo;
				try {
					appInfo = Tizen.Apps.getAppInfo(e.rowData.app_id);
				} catch (error) {
					self.showErrorDialog(error, 'Could not call tizen.application.getAppInfo function');
					return;
				}

				Titanium.UI.createAlertDialog({
					title: e.rowData.title,
					message: '\n\n Id = ' + appInfo.id +
						'\n\n Name = ' + appInfo.name +
						(appInfo.iconPath ? '\n\n IconPath = ' + appInfo.iconPath : ' ') +
						(appInfo.version ? '\n\n Version = ' + appInfo.version : ' ') +
						(appInfo.show ? '\n\n Show = ' + appInfo.show : ' ') +
						(appInfo.installDate ? '\n\n InstallDate = ' + appInfo.installDate : '') +
						(appInfo.size ? '\n\n Size = ' + appInfo.size : '')
				}).show();
			}
		},

		// Function shows AlertDialog with error message
		// And logs this error
		showErrorDialog: function(logMessage, userMessage) {
			Ti.API.error(logMessage);
			Titanium.UI.createAlertDialog({
				title: 'Unexpected action',
				message: userMessage ? userMessage : logMessage
			}).show();
		}
	}
}
module.exports = apps_helper;