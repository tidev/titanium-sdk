import { createWindow, createTab, faIcon } from './utils';

const title = 'Home';
const window = createWindow({ title });

const wrapper = Ti.UI.createView({ layout: 'vertical', height: Ti.UI.SIZE });
const searchIcon = faIcon('edit', 96, { color: '#ccc' });
wrapper.add(searchIcon);
const hint = Ti.UI.createLabel({
	attributedString: Ti.UI.createAttributedString({
		text: 'Edit home.js to change this view!',
		attributes: [ {
			type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
			value: '#E82C2A',
			range: [ 5, 7 ]
		}, {
			type: Ti.UI.ATTRIBUTE_FONT,
			value: {
				fontFamily: 'monospace',
			},
			range: [ 5, 7 ]
		} ]
	}),
	color: '#aaa',
	top: 60
});
wrapper.add(hint);
window.add(wrapper);

export default createTab({
	icon: 'images/home.png',
	title,
	window
});
