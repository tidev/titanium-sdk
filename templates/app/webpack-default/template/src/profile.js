/**
 * This example demonstrates how a simple profile view can be created with
 * Titanium. The profile includes
 *
 * - Profile header
 * - A styled TableView with items that open new windows
 * - ScrollView to allow scrolling of the whole view on smaller devices
 */

/* global tabGroup */

import { createWindow, createTab, faIcon } from './utils';

const title = 'Profile';
const window = createWindow({ title, layout: 'vertical' });

const scrollView = Ti.UI.createScrollView({ layout: 'vertical' });
window.add(scrollView);

// header profile pic & username
const profilePic = Ti.UI.createImageView({
	image: 'images/profile.jpg',
	top: 30,
	width: 120,
	height: 120,
	borderRadius: 60
});
scrollView.add(profilePic);
const username = Ti.UI.createLabel({
	text: 'Verona Blair',
	font: {
		fontSize: 28
	},
	top: 20
});
scrollView.add(username);

// profile sub items table view
const items = [
	{ title: 'Personal Details', icon: 'user' },
	{ title: 'Privacy & Security', icon: 'lock' },
	{ title: 'Legal', icon: 'balance-scale-left' }
];

const settingsSection = Ti.UI.createTableViewSection({
	headerView: createSeparator(),
	footerView: createSeparator()
});
items.forEach(item => settingsSection.add(createRow({ ...item })));
const logoutSection = Ti.UI.createTableViewSection();
logoutSection.add(createRow({
	title: 'Logout',
	icon: 'sign-out-alt',
	titleTint: '#E82C2A',
	iconTint: '#E82C2A',
	iconBgTint: '#FFC5C3'
}));
const tableView = Ti.UI.createTableView({
	data: [ settingsSection, logoutSection ],
	top: 40,
	height: Ti.UI.SIZE,
	scrollable: false,
	rowSeparatorInsets: { left: 20, right: 20 },
	separatorStyle: Ti.UI.TABLE_VIEW_SEPARATOR_STYLE_NONE
});
tableView.addEventListener('click', (e) => {
	if (e.section === settingsSection) {
		const title = items[e.index].title;
		// We just create a new empty window for the sake of simplicity
		const window = createWindow({ title });
		tabGroup.activeTab.open(window);
	} else {
		console.log('Logout pressed.');
	}
});
scrollView.add(tableView);

export default createTab({
	title,
	icon: 'images/user.png',
	window
});

/**
 * @typedef RowOptions
 * @property {string} title Row title text
 * @property {string} icon Icon name
 * @property {string=} titleTint Tint color for the title text
 * @property {string=} iconTint Tint color for the icon
 * @property {string=} iconBgTint Tint color for the icon background
 */

/**
 * Creates a new TableViewRow using the passed options.
 *
 * @param {RowOptions} options Row options
 * @return {object} The created table view row
 */
function createRow(options) {
	const {
		title,
		icon,
		titleTint = '#000',
		iconTint = '#a9cdd1',
		iconBgTint = '#eef0f6'
	} = options;
	const rowOptions = { height: 70 };
	if (OS_IOS) {
		rowOptions.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.NONE;
	}
	const row = Ti.UI.createTableViewRow(rowOptions);
	const layout = Ti.UI.createView({
		layout: 'horizontal',
		horizontalWrap: false
	});
	row.add(layout);

	const iconWrapper = Ti.UI.createView({
		backgroundColor: iconBgTint,
		width: 40,
		height: 40,
		borderRadius: 20,
		left: 20,
		center: { y: 35 }
	});
	const iconLabel = faIcon(icon, null, { color: iconTint });
	iconWrapper.add(iconLabel);
	layout.add(iconWrapper);

	const titleLabel = Ti.UI.createLabel({
		text: title,
		left: 20,
		center: { y: 35 },
		color: titleTint
	});
	layout.add(titleLabel);

	const arrow = faIcon('chevron-right', null, {
		color: '#c1c2c1',
		center: { y: 35 },
		right: 30
	});
	row.add(arrow);

	return row;
}

/**
 * Creates a thin line to be used as header/footer view.
 *
 * @return {object} A thin view of 1px height
 */
function createSeparator() {
	const wrapper = Ti.UI.createView({ height: 1 });
	const separator = Ti.UI.createView({
		left: 20,
		right: 20,
		backgroundColor: '#eef0f6'
	});
	wrapper.add(separator);
	return wrapper;
}
