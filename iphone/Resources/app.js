/**
 * This file is used to validate iOS test-cases. It is ran using the Xcode
 * project in titanium_mobile/iphone/iphone/Titanium.xcodeproj.
 *
 * Change the below code to fit your use-case. By default, it included a button
 * to trigger a log that is displayed in the Xcode console.
 */
'use strict';
var win = Ti.UI.createWindow({ backgroundColor: 'white' });

var plainTemplate = {
	childTemplates: [
		{                            // Image justified left
			type: 'Ti.UI.ImageView', // Use an image view for the image
			bindId: 'pic',           // Maps to a custom pic property of the item data
			properties: {            // Sets the image view properties
				width: '50dp', height: '50dp', left: 0
			}
		},
		{                            // Title
			type: 'custom',     // Use a label for the title
			bindId: 'title',         // Maps to a custom title property of the item data
			properties: {            // Sets the label properties
				color: 'black',
				font: { fontFamily: 'Arial', fontSize: '20dp', fontWeight: 'bold' },
				left: '60dp', top: 0,
			},
		},
		{                            // Subtitle
			type: 'Ti.UI.Label',     // Use a label for the subtitle
			bindId: 'subtitle',      // Maps to a custom subtitle property of the item data
			properties: {            // Sets the label properties
				color: 'gray',
				font: { fontFamily: 'Arial', fontSize: '14dp' },
				left: '60dp', top: '25dp',
			}
		}
	],
	// Binds a callback to the click event, which catches events bubbled by the view subcomponents.
	events: { click: toggleCheck }
};

// The following JSON API calls copy the plainTemplate object minus functions.
// This method of copying an object is simple but not quick.
// If performance is a factor, create your own method to copy an object.

var redTemplate = JSON.parse(JSON.stringify(plainTemplate));
// Change the text color to red
redTemplate.childTemplates[1].properties.color = 'red';
redTemplate.childTemplates[2].properties.color = 'red';
// Rebind the click event callback
redTemplate.events.click = toggleCheck;

var listView = Ti.UI.createListView({
	// Maps plainTemplate to 'uncheck' and redTemplate to 'check'
	templates: { uncheck: plainTemplate, check: redTemplate },
	// Use 'uncheck', that is, the plainTemplate created earlier for all items
	// Can be overridden by the item's template property
	defaultItemTemplate: 'uncheck'
});

var tasks = [
	{ id: 'trash', name: 'Take Out the Trash', person: 'Yakko', icon: 'trash.png' },
	{ id: 'dishes', name: 'Do the Dishes', person: 'Wakko', icon: 'dishes.png' },
	{ id: 'doggie', name: 'Walk the Dog', person: 'Dot', icon: 'doggie.png' }
];

var data = [];
for (var i = 0; i < tasks.length; i++) {
	data.push({
		// Maps to the title component in the template
		// Sets the text property of the Label component
		title: { text: tasks[i].name },
		// Maps to the subtitle component in the template
		// Sets the text property of the Label component
		subtitle: { text: tasks[i].person },
		// Maps to the pic component in the template
		// Sets the image property of the ImageView component
		pic: { image: tasks[i].icon },
		// Sets the regular list data properties
		properties: {
			itemId: tasks[i].id,
			accessoryType: Ti.UI.LIST_ACCESSORY_TYPE_NONE,
		}
	});
}

var section = Ti.UI.createListSection();
section.setItems(data);
listView.sections = [ section ];

// Modified version of the `itemclick` event listener
// Changes the item template rather than the list item's color property
function toggleCheck(e) {
	var item = section.getItemAt(e.itemIndex);
	if (item.properties.accessoryType == Ti.UI.LIST_ACCESSORY_TYPE_NONE) {
		item.properties.accessoryType = Ti.UI.LIST_ACCESSORY_TYPE_CHECKMARK;
		item.template = 'check';
	} else {
		item.properties.accessoryType = Ti.UI.LIST_ACCESSORY_TYPE_NONE;
		item.template = 'uncheck';
	}
	section.updateItemAt(e.itemIndex, item);
}

win.add(listView);
win.open();
