'use strict';

/** Creates and opens a new `Ti.UI.TabGroup` window. */
function openWindow() {
	// Create a new `Ti.UI.TabGroup` window.
	var tabGroup = Ti.UI.createTabGroup();

	// Add 2 tabs to the tab group.
	tabGroup.addTab(createTab('Tab 1', 'I am Window 1', '/assets/images/tab1.png'));
	tabGroup.addTab(createTab('Tab 2', 'I am Window 2', '/assets/images/tab2.png'));

	// Display the tab group window.
	tabGroup.open();
}

/**
 * Creates a new Tab with the given settings.
 * @param {String} title The title used in the `Ti.UI.Tab` and its included `Ti.UI.Window`.
 * @param {String} message The title displayed in the `Ti.UI.Label`.
 * @param {String} icon The icon used in the `Ti.UI.Tab`.
 * @returns {Ti.UI.Tab} Returns the created tab.
 */
function createTab(title, message, icon) {
	var win = Ti.UI.createWindow({
		title: title,
		backgroundColor: '#fff'
	});

	var label = Ti.UI.createLabel({
		text: message,
		color: '#333',
		font: {
			fontSize: 20
		}
	});

	win.add(label);

	var tab = Ti.UI.createTab({
		title: title,
		icon: icon,
		window: win
	});

	return tab;
}

// Create/Recreate window if a new UI session has been started by the end-user.
// This event only fires on Android if "tiapp.xml" property "run-in-background" is true.
Ti.UI.addEventListener('sessionbegin', function () {
	openWindow();
});

// Only create a window at launch if the app can currently host UI. (ie: Not launched in the background.)
// Note: The "hasSession" property will always be true if "tiapp.xml" property "run-in-background" is false.
if (Ti.UI.hasSession) {
	openWindow();
}
