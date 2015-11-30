function systemsetting(args) {
	var window = Titanium.UI.createWindow({
			backgroundColor: '#FFFFFF', 
			layout: 'vertical'
		}),
		filesPanel = Ti.UI.createTableView({
			headerTitle: 'Select a file',
			left: '2%',
			top: 4,
			width: '96%',
			borderWidth: 1,
			borderColor: '#cccccc'
		}),
		switchPanel = Titanium.UI.createView({
			layout: 'horizontal',
			width: '96%',
			left: '2%',
			height: 110,
			top: 10
		}),
		propertyLabel = Titanium.UI.createLabel({
			text: 'Select a type of property',
			color: '#000000',
			width: '48%'
		}),
		settingTypeSwitcher = Ti.UI.createPicker({
			left: '2%',
			width: '50%',
			height: '105'
		}),
		
		propertiesList = Ti.UI.createTableView({
			width: '100%',
			height: '100%',
			top: 0,
			left: 0,
			zIndex: 4
		}),
		Tizen = require('tizen'),
		settingType = Tizen.SystemSetting.SYSTEM_SETTING_TYPE_HOME_SCREEN,
		settingTypes = [];
	
	//settings data
	settingTypes.push(Ti.UI.createPickerRow({ title: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_HOME_SCREEN, value: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_HOME_SCREEN }));
	settingTypes.push(Ti.UI.createPickerRow({ title: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_LOCK_SCREEN, value: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_LOCK_SCREEN }));
	settingTypes.push(Ti.UI.createPickerRow({ title: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_INCOMING_CALL, value: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_INCOMING_CALL }));
	settingTypes.push(Ti.UI.createPickerRow({ title: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_NOTIFICATION_EMAIL, value: Tizen.SystemSetting.SYSTEM_SETTING_TYPE_NOTIFICATION_EMAIL }));
	
	settingTypeSwitcher.add(settingTypes);

	switchPanel.add(propertyLabel);
	switchPanel.add(settingTypeSwitcher);
	window.add(switchPanel);
	window.add(filesPanel);
	
	// Load images
	function loadFiles(type) {
		var source,
			isImage = type === Tizen.SystemSetting.SYSTEM_SETTING_TYPE_HOME_SCREEN || type === Tizen.SystemSetting.SYSTEM_SETTING_TYPE_LOCK_SCREEN,
			filter = new tizen.AttributeFilter('type', 'EXACTLY', isImage ? 'IMAGE' : 'AUDIO');

		// Tizen Content module is not supported by Tizen module, but it necessary for getting files to test SystemSetting's functions
		tizen.content.find(
			// SuccessCallback
			function(items) {			
				var tableData = [],
					i = 0,
					length = items.length;
				
				(length == 0) && Titanium.UI.createAlertDialog({
									title: 'Info',
									message: 'Content is empty. Add some files first.'
								}).show();

				Ti.API.info('loadImages => success');

				for (; i < length; i++) {
					var item = items[i],
						row = Ti.UI.createTableViewRow({
							title: items[i].contentURI,
							hasChild: false,
							itemIdOwn: i
						});
					
					tableData.push(row);
				}
				
				// Clear listeners and rows
				filesPanel.removeEventListener('click');
				filesPanel.setData([]);
				
				// Set new data and listener
				filesPanel.setData(tableData);
				filesPanel.addEventListener('click', function(e) {
					Ti.API.info('click' + e.rowData.title);
					// SetProperty
					Tizen.SystemSetting.setProperty(
						settingType,
						e.rowData.title, 
						// Callback
						function(response){
							if(response.success) {
								Titanium.UI.createAlertDialog({
									title: 'System setting',
									message: settingType + ' has been changed.'
								}).show();
							} else {
								Titanium.UI.createAlertDialog({
									title: 'System setting',
									message: response.error
								}).show();
							}
						}
					);
				});
			},
			// ErrorCallback
			function onError(e) {
				Ti.API.error(e.message);
			},
			null,
			filter
		);
	};
	
	loadFiles(settingType);

	settingTypeSwitcher.addEventListener('change', function(e) {
		Ti.API.info(e.row.value);
		
		settingType = e.row.value;
		loadFiles(settingType);
	});
	
	return window;
}

module.exports = systemsetting;