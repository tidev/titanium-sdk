const myTemplate = {
	childTemplates: [
		{
			type: 'Ti.UI.Label',
			bindId: 'title',
			properties: {
				left: 15,
				color: 'black'
			}
		}
	]
};

const win = Ti.UI.createWindow({
	backgroundColor: '#fff'
});

const listView = Ti.UI.createListView({
	templates: { template: myTemplate },
	requiresEditingToMove: false,
	defaultItemTemplate: 'template',
	sections: [
		Ti.UI.createListSection({
			headerTitle: 'Section 1',
			items: [
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 1' } },
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 2' } },
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 3' } },
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 4' } }
			]
		}),
		Ti.UI.createListSection({
			headerTitle: 'Section 1',
			items: [
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 1' } },
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 2' } },
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 3' } },
				{ properties: { canMove: true, height: 43 }, title: { text: 'Title 4' } }
			]
		})
	]
});

listView.addEventListener('movestart', () => {
	console.warn('STARTED MOVING');
});

listView.addEventListener('moveend', () => {
	console.warn('STOPPED MOVING');
});

listView.addEventListener('move', () => {
	console.warn('FINISHED MOVING');
});

win.add(listView);
win.open();