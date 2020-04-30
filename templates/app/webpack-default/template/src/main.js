/**
 * This is the entry point of your app. Use it to bootstrap the UI and any
 * other components you may want to use.
 *
 * You can use the existing UI code as a starting point or delete it and
 * design your app UI from scratch.
 *
 * @see https://docs.appcelerator.com/platform/latest/#!/api/Titanium.UI
 */

import homeTab from './home';
import profileTab from './profile';
import { runs } from './utils';

const options = {
	tabs: [
		homeTab,
		profileTab
	]
};
if (runs('android')) {
	options.tabsBackgroundColor = '#E82C2A';
	options.title = 'My App';
}
const tabGroup = Ti.UI.createTabGroup(options);
// make available globally for navigation purposes
global.tabGroup = tabGroup;
tabGroup.open();
