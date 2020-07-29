/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.ListView', function () {
	this.timeout(6e4);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.iosBroken('Ti.UI.ListView', () => { // Should this be defined?
		should(Ti.UI.ListView).not.be.undefined();
	});

	it('.apiName', function () {
		const listView = Ti.UI.createListView();
		should(listView).have.readOnlyProperty('apiName').which.is.a.String();
		should(listView.apiName).be.eql('Ti.UI.ListView');
	});

	it.windowsMissing('.canScroll', function () {
		const listView = Ti.UI.createListView({ canScroll: false });
		should(listView.canScroll).be.be.false();
		should(listView.getCanScroll()).be.be.false();
		listView.canScroll = !listView.canScroll;
		should(listView.canScroll).be.be.true();
		should(listView.getCanScroll()).be.be.true();
		listView.setCanScroll(!listView.getCanScroll());
		should(listView.canScroll).be.be.false();
		should(listView.getCanScroll()).be.be.false();
	});

	// FIXME Get working on Android, gives us sectionCount of 0 when it should be 1
	it.androidBroken('createListView', function () {
		var listView,
			section_0,
			section_0_set,
			section_1,
			section_1_set;
		// Validate createListView()
		should(Ti.UI.createListView).not.be.undefined();
		should(Ti.UI.createListView).be.a.Function();

		// Create ListView
		listView = Ti.UI.createListView();
		should(listView).be.a.Object();

		// Create list section
		section_0 = Ti.UI.createListSection({ headerTitle: 'Zero' });
		should(section_0).be.a.Object();

		// Set section items
		section_0_set = [
			{ properties: { title: 'Red' } },
			{ properties: { title: 'White' } }
		];
		section_0.setItems(section_0_set);
		should(section_0.items.length).be.eql(2);

		// Append item to section
		section_0.appendItems([ { properties: { title: 'Purple' } } ]);

		// Validate section items length
		should(section_0.items.length).be.eql(3);

		// Create list section
		section_1 = Ti.UI.createListSection({ headerTitle: 'One' });
		should(section_1).be.a.Object();

		// Set section items
		section_1_set = [
			{ properties: { title: 'Green' } },
			{ properties: { title: 'Yellow' } },
			{ properties: { title: 'Blue' } }
		];
		section_1.setItems(section_1_set);
		should(section_1.items.length).be.eql(3);

		// Set listView sections
		listView.sections = [ section_0 ];

		// Validate listView section count
		should(listView.sectionCount).be.eql(1); // Android gives 0

		// Apend section to listView
		listView.appendSection([ section_1 ]);

		// Validate listView section count
		should(listView.sectionCount).be.eql(2);
	});

	//
	// Making sure setting header & footer doesn't throw exception
	//
	it('section header & footer', function (finish) {
		var listView = Ti.UI.createListView(),
			ukHeaderView = Ti.UI.createView({ backgroundColor: 'black', height: 42 }),
			ukFooterView = Ti.UI.createView({ backgroundColor: 'black', height: 42 }),
			ukSection = Ti.UI.createListSection({ headerView: ukHeaderView, footerView: ukFooterView }),
			usSection = Ti.UI.createListSection({ headerTitle: 'English US Header', footerTitle: 'English US Footer' });
		win = Ti.UI.createWindow({ backgroundColor: 'green' });

		ukHeaderView.add(Ti.UI.createLabel({ text: 'English UK Header', color: 'white' }));
		ukFooterView.add(Ti.UI.createLabel({ text: 'English UK Footer', color: 'white' }));
		ukSection.setItems([
			{ properties: { title: 'Lift', color: 'black' } },
			{ properties: { title: 'Lorry', color: 'black' } },
			{ properties: { title: 'Motorway', color: 'black' } }
		]);
		listView.appendSection(ukSection);

		usSection.setItems([
			{ properties: { title: 'Elevator', color: 'black' } },
			{ properties: { title: 'Truck', color: 'black' } },
			{ properties: { title: 'Freeway', color: 'black' } }
		]);
		listView.appendSection(usSection);

		win.addEventListener('focus', function () {
			try {
				should(listView.sectionCount).be.eql(2);
				should(listView.sections[0].items.length).be.eql(3);
				should(listView.sections[0].items[0].properties.title).be.eql('Lift');
				should(listView.sections[0].items[1].properties.title).be.eql('Lorry');
				should(listView.sections[0].items[2].properties.title).be.eql('Motorway');
				should(listView.sections[1].items.length).be.eql(3);
				should(listView.sections[1].items[0].properties.title).be.eql('Elevator');
				should(listView.sections[1].items[1].properties.title).be.eql('Truck');
				should(listView.sections[1].items[2].properties.title).be.eql('Freeway');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(listView);
		win.open();
	});

	//
	// Making sure setting header & footer doesn't mess up section items
	//
	it('headerView', function (finish) {
		var listView = Ti.UI.createListView(),
			sections = [],
			fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits' }),
			fruitDataSet = [
				{ properties: { title: 'Apple' } },
				{ properties: { title: 'Banana' } },
			],
			vegSection,
			vegDataSet;
		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		fruitSection.setItems(fruitDataSet);
		fruitSection.headerView = Ti.UI.createView({ backgroundColor: 'black', height: 42 });
		fruitSection.footerView = Ti.UI.createView({ backgroundColor: 'black', height: 42 });

		sections.push(fruitSection);

		vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables' });
		vegDataSet = [
			{ properties: { title: 'Carrots' } },
			{ properties: { title: 'Potatoes' } },
		];
		vegSection.setItems(vegDataSet);
		vegSection.headerView = Ti.UI.createView({ backgroundColor: 'black', height: 42 });
		vegSection.footerView = Ti.UI.createView({ backgroundColor: 'black', height: 42 });
		sections.push(vegSection);

		listView.sections = sections;

		win.addEventListener('focus', function () {
			try {
				should(listView.sectionCount).be.eql(2);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Apple');
				should(listView.sections[0].items[1].properties.title).be.eql('Banana');
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].properties.title).be.eql('Carrots');
				should(listView.sections[1].items[1].properties.title).be.eql('Potatoes');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(listView);
		win.open();
	});

	//
	// Making sure custom template doesn't throw exception
	// FIXME Windows desktop crashes on this test
	it.windowsDesktopBroken('Custom template', function (finish) {
		var myTemplate = {
				childTemplates: [
					{
						type: 'Ti.UI.ImageView',
						bindId: 'pic',
						properties: {
							width: '50', height: '50', left: 0
						}
					},
					{
						type: 'Ti.UI.Label',
						bindId: 'info',
						properties: {
							color: 'black',
							font: { fontSize: '20', fontWeight: 'bold' },
							left: '60', top: 0,
						}
					},
					{
						type: 'Ti.UI.Label',
						bindId: 'es_info',
						properties: {
							color: 'gray',
							font: { fontSize: '14' },
							left: '60', top: '25',
						}
					}
				]
			},
			listView = Ti.UI.createListView({
				templates: { template: myTemplate },
				defaultItemTemplate: 'template'
			}),
			sections = [],
			fruitSection,
			fruitDataSet,
			vegSection,
			vegDataSet,
			grainSection,
			grainDataSet;
		win = Ti.UI.createWindow({ backgroundColor: 'green' });

		fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits / Frutas' });
		fruitDataSet = [
			{ info: { text: 'Apple' }, es_info: { text: 'Manzana' }, pic: { image: 'Logo.png' } },
			{ info: { text: 'Banana' }, es_info: { text: 'Banana' }, pic: { image: 'Logo.png' } }
		];
		fruitSection.setItems(fruitDataSet);
		sections.push(fruitSection);

		vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables / Verduras' });
		vegDataSet = [
			{ info: { text: 'Carrot' }, es_info: { text: 'Zanahoria' }, pic: { image: 'Logo.png' } },
			{ info: { text: 'Potato' }, es_info: { text: 'Patata' }, pic: { image: 'Logo.png' } }
		];
		vegSection.setItems(vegDataSet);
		sections.push(vegSection);

		grainSection = Ti.UI.createListSection({ headerTitle: 'Grains / Granos' });
		grainDataSet = [
			{ info: { text: 'Corn' }, es_info: { text: 'Maiz' }, pic: { image: 'Logo.png' } },
			{ info: { text: 'Rice' }, es_info: { text: 'Arroz' }, pic: { image: 'Logo.png' } }
		];
		grainSection.setItems(grainDataSet);
		sections.push(grainSection);

		listView.setSections(sections);

		win.addEventListener('focus', function () {
			try {
				should(listView.sectionCount).be.eql(3);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].info.text).be.eql('Apple');
				should(listView.sections[0].items[1].info.text).be.eql('Banana');
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].info.text).be.eql('Carrot');
				should(listView.sections[1].items[1].info.text).be.eql('Potato');
				should(listView.sections[2].items.length).be.eql(2);
				should(listView.sections[2].items[0].info.text).be.eql('Corn');
				should(listView.sections[2].items[1].info.text).be.eql('Rice');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(listView);
		win.open();
	});

	it('appendSection', function (finish) {
		var listView = Ti.UI.createListView(),
			fruitSection,
			fruitDataSet,
			vegSection,
			vegDataSet,
			fishSection,
			fishDataSet;

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits' });
		fruitDataSet = [
			{ properties: { title: 'Apple' } },
			{ properties: { title: 'Banana' } },
		];
		fruitSection.setItems(fruitDataSet);

		vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables' });
		vegDataSet = [
			{ properties: { title: 'Carrots' } },
			{ properties: { title: 'Potatoes' } },
		];
		vegSection.setItems(vegDataSet);

		fishSection = Ti.UI.createListSection({ headerTitle: 'Fish' });
		fishDataSet = [
			{ properties: { title: 'Cod' } },
			{ properties: { title: 'Haddock' } },
		];
		fishSection.setItems(fishDataSet);

		listView.sections = [ fruitSection ];

		win.addEventListener('focus', function () {
			try {
				should(listView.sectionCount).be.eql(1);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Apple');
				should(listView.sections[0].items[1].properties.title).be.eql('Banana');

				listView.appendSection(vegSection);

				should(listView.sectionCount).be.eql(2);
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].properties.title).be.eql('Carrots');
				should(listView.sections[1].items[1].properties.title).be.eql('Potatoes');

				// appenSection with an array
				listView.appendSection([ fishSection ]);
				should(listView.sectionCount).be.eql(3);
				should(listView.sections[2].items.length).be.eql(2);
				should(listView.sections[2].items[0].properties.title).be.eql('Cod');
				should(listView.sections[2].items[1].properties.title).be.eql('Haddock');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(listView);
		win.open();
	});

	it('insertSectionAt', function (finish) {
		var listView = Ti.UI.createListView(),
			fruitSection,
			fruitDataSet,
			vegSection,
			vegDataSet,
			fishSection,
			fishDataSet;

		win = Ti.UI.createWindow({ backgroundColor: 'green' });

		fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits' });
		fruitDataSet = [
			{ properties: { title: 'Apple' } },
			{ properties: { title: 'Banana' } },
		];
		fruitSection.setItems(fruitDataSet);

		vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables' });
		vegDataSet = [
			{ properties: { title: 'Carrots' } },
			{ properties: { title: 'Potatoes' } },
		];
		vegSection.setItems(vegDataSet);

		fishSection = Ti.UI.createListSection({ headerTitle: 'Fish' });
		fishDataSet = [
			{ properties: { title: 'Cod' } },
			{ properties: { title: 'Haddock' } },
		];
		fishSection.setItems(fishDataSet);

		listView.sections = [ fruitSection, fishSection ];

		win.addEventListener('focus', function () {
			try {
				should(listView.sectionCount).be.eql(2);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Apple');
				should(listView.sections[0].items[1].properties.title).be.eql('Banana');

				listView.insertSectionAt(0, vegSection);

				should(listView.sectionCount).be.eql(3);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Carrots');
				should(listView.sections[0].items[1].properties.title).be.eql('Potatoes');
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].properties.title).be.eql('Apple');
				should(listView.sections[1].items[1].properties.title).be.eql('Banana');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(listView);
		win.open();
	});

	it('replaceSectionAt', function (finish) {
		var listView = Ti.UI.createListView(),
			fruitSection,
			fruitDataSet,
			vegSection,
			vegDataSet,
			fishSection,
			fishDataSet;

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits' });
		fruitDataSet = [
			{ properties: { title: 'Apple' } },
			{ properties: { title: 'Banana' } },
		];
		fruitSection.setItems(fruitDataSet);

		vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables' });
		vegDataSet = [
			{ properties: { title: 'Carrots' } },
			{ properties: { title: 'Potatoes' } },
		];
		vegSection.setItems(vegDataSet);

		fishSection = Ti.UI.createListSection({ headerTitle: 'Fish' });
		fishDataSet = [
			{ properties: { title: 'Cod' } },
			{ properties: { title: 'Haddock' } },
		];
		fishSection.setItems(fishDataSet);

		listView.sections = [ fruitSection, vegSection ];

		win.addEventListener('focus', function () {
			try {
				should(listView.sectionCount).be.eql(2);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Apple');
				should(listView.sections[0].items[1].properties.title).be.eql('Banana');
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].properties.title).be.eql('Carrots');
				should(listView.sections[1].items[1].properties.title).be.eql('Potatoes');

				listView.replaceSectionAt(1, fishSection);

				should(listView.sectionCount).be.eql(2);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Apple');
				should(listView.sections[0].items[1].properties.title).be.eql('Banana');
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].properties.title).be.eql('Cod');
				should(listView.sections[1].items[1].properties.title).be.eql('Haddock');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(listView);
		win.open();
	});

	it('deleteSectionAt', function (finish) {
		var listView = Ti.UI.createListView(),
			fruitSection,
			fruitDataSet,
			vegSection,
			vegDataSet,
			fishSection,
			fishDataSet;

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits' });
		fruitDataSet = [
			{ properties: { title: 'Apple' } },
			{ properties: { title: 'Banana' } },
		];
		fruitSection.setItems(fruitDataSet);

		vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables' });
		vegDataSet = [
			{ properties: { title: 'Carrots' } },
			{ properties: { title: 'Potatoes' } },
		];
		vegSection.setItems(vegDataSet);

		fishSection = Ti.UI.createListSection({ headerTitle: 'Fish' });
		fishDataSet = [
			{ properties: { title: 'Cod' } },
			{ properties: { title: 'Haddock' } },
		];
		fishSection.setItems(fishDataSet);

		listView.sections = [ fruitSection, vegSection, fishSection ];

		win.addEventListener('focus', function () {
			try {
				should(listView.sectionCount).be.eql(3);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Apple');
				should(listView.sections[0].items[1].properties.title).be.eql('Banana');
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].properties.title).be.eql('Carrots');
				should(listView.sections[1].items[1].properties.title).be.eql('Potatoes');
				should(listView.sections[2].items.length).be.eql(2);
				should(listView.sections[2].items[0].properties.title).be.eql('Cod');
				should(listView.sections[2].items[1].properties.title).be.eql('Haddock');

				listView.deleteSectionAt(1);

				should(listView.sectionCount).be.eql(2);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].properties.title).be.eql('Apple');
				should(listView.sections[0].items[1].properties.title).be.eql('Banana');
				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].properties.title).be.eql('Cod');
				should(listView.sections[1].items[1].properties.title).be.eql('Haddock');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(listView);
		win.open();
	});

	// Since the tested API is iOS only, we will skip all other platforms
	it.ios('ListItem.properties', function () {
		var list = Ti.UI.createListView({
				sections: [ Ti.UI.createListSection({
					items: [ {
						template: Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS,
						properties: {
							title: 'My Title',
							subtitle: 'My Subtitle',
							subtitleColor: 'red',
							selectedSubtitleColor: 'green'
						}
					} ]
				}) ]
			}),
			section,
			items,
			item,
			template,
			properties;

		win = Ti.UI.createWindow();
		win.add(list);
		win.open();

		// Validate list and section
		should(list.apiName).be.eql('Ti.UI.ListView');
		section = list.sections[0];
		should(section.apiName).be.eql('Ti.UI.ListSection');

		// Validate items
		items = section.items;
		should(items).be.an.Array();
		should(items.length).be.a.Number();
		should(items.length).be.eql(1);

		// Validate single item
		item = items[0];
		template = item.template;
		properties = item.properties;

		// Validate item template
		should(item).have.ownProperty('template');
		should(template).not.be.undefined();
		should(template).be.a.Number();
		should(template).eql(Ti.UI.LIST_ITEM_TEMPLATE_CONTACTS);

		// Validate item properties
		should(item).have.ownProperty('properties');
		should(properties).not.be.undefined();
		should(properties).be.an.Object();

		// Validate properties subtitleColor and selectedSubtitleColor
		should(properties).have.ownProperty('subtitleColor');
		should(properties.subtitleColor).be.a.String();
		should(properties.subtitleColor).be.eql('red');
		should(properties).have.ownProperty('selectedSubtitleColor');
		should(properties.selectedSubtitleColor).be.a.String();
		should(properties.selectedSubtitleColor).be.eql('green');

		// Validate properties title & subtitle
		should(properties).have.ownProperty('title');
		should(properties.title).be.a.String();
		should(properties.title).be.eql('My Title');
		should(properties).have.ownProperty('subtitle');
		should(properties.subtitle).be.a.String();
		should(properties.subtitle).be.eql('My Subtitle');
	});

	// Crashes Windows 10 Desktop
	it.windowsDesktopBroken('fireListSectionEvent', function () {
		var section = Ti.UI.createListSection({
				items: [
					{ properties: { title: 'B' } },
					{ properties: { title: 'A' } },
					{ properties: { title: 'E' } },
					{ properties: { title: 'G' } }
				]
			}),
			listView = Ti.UI.createListView({ sections: [ section ] }), // eslint-disable-line no-unused-vars
			items_a = [
				{ properties: { title: 'A' } },
			],
			items_b = [
				{ properties: { title: 'C' } },
				{ properties: { title: 'D' } }
			],
			items_c = [
				{ properties: { title: 'E' } },
				{ properties: { title: 'F' } },
			],
			validation = [ 'A', 'B', 'C', 'D', 'E', 'F' ],
			items,
			i,
			item;

		section.updateItemAt(0, { properties: { title: 'A' } });
		section.updateItemAt(1, { properties: { title: 'B' } });
		section.updateItemAt(3, { properties: { title: 'F' } });
		section.insertItemsAt(2, items_b);
		section.deleteItemsAt(0, 1);
		section.deleteItemsAt(3, 2);
		section.appendItems(items_c);
		section.insertItemsAt(0, items_a);

		items = section.getItems();
		should(items.length).be.eql(6);
		for (i = 0; i < items.length; i++) {
			item = items[i].properties.title;
			should(item).be.eql(validation[i]);
		}
	});

	// Crashes Windows 10 Desktop
	it.windowsDesktopBroken('fireListSectionEvent (header and footer)', function () {
		var section = Ti.UI.createListSection({
				headerTitle: 'HEADER',
				footerTitle: 'FOOTER',
				items: [
					{ properties: { title: 'B' } },
					{ properties: { title: 'A' } },
					{ properties: { title: 'E' } },
					{ properties: { title: 'G' } }
				]
			}),
			listView = Ti.UI.createListView({ sections: [ section ] }), // eslint-disable-line no-unused-vars
			items_a = [
				{ properties: { title: 'A' } },
			],
			items_b = [
				{ properties: { title: 'C' } },
				{ properties: { title: 'D' } }
			],
			items_c = [
				{ properties: { title: 'E' } },
				{ properties: { title: 'F' } },
			],
			validation = [ 'A', 'B', 'C', 'D', 'E', 'F' ],
			items,
			i,
			item;

		section.updateItemAt(0, { properties: { title: 'A' } });
		section.updateItemAt(1, { properties: { title: 'B' } });
		section.updateItemAt(3, { properties: { title: 'F' } });
		section.insertItemsAt(2, items_b);
		section.deleteItemsAt(0, 1);
		section.deleteItemsAt(3, 2);
		section.appendItems(items_c);
		section.insertItemsAt(0, items_a);

		items = section.getItems();
		should(items.length).be.eql(6);
		for (i = 0; i < items.length; i++) {
			item = items[i].properties.title;
			should(item).be.eql(validation[i]);
		}
	});

	// Making sure sections data is saved even when it's filtered (TIMOB-24019)
	// Crashes Windows 10 Desktop
	it.windowsDesktopBroken('TIMOB-24019', function (finish) {
		var listView = Ti.UI.createListView({ width: Ti.UI.FILL, height: Ti.UI.FILL, caseInsensitiveSearch: true }),
			fruitSection,
			fruitDataSet,
			vegSection,
			vegDataSet;

		win = Ti.UI.createWindow({ backgroundColor: 'green' });

		fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits' });
		fruitDataSet = [
			{ properties: { title: 'Apple', searchableText: 'Apple' } },
			{ properties: { title: 'Banana', searchableText: 'Banana' } },
		];
		fruitSection.setItems(fruitDataSet);

		vegSection = Ti.UI.createListSection({ headerTitle: 'Vegetables' });
		vegDataSet = [
			{ properties: { title: 'Carrots', searchableText: 'Carrots' } },
			{ properties: { title: 'Potatoes', searchableText: 'Potatoes' } },
		];
		vegSection.setItems(vegDataSet);

		listView.sections = [ fruitSection, vegSection ];

		win.addEventListener('open', function () {
			should(listView.sectionCount).be.eql(2);
			should(listView.sections[0].items.length).be.eql(2);
			should(listView.sections[0].items[0].properties.title).be.eql('Apple');
			should(listView.sections[0].items[1].properties.title).be.eql('Banana');
			should(listView.sections[1].items.length).be.eql(2);
			should(listView.sections[1].items[0].properties.title).be.eql('Carrots');
			should(listView.sections[1].items[1].properties.title).be.eql('Potatoes');

			// This should show 'Apple' and 'Potatoes'
			listView.searchText = 'p';

			setTimeout(function () {
				try {
					// Make sure ListView reserves original data
					should(listView.sectionCount).be.eql(2);
					should(listView.sections[0].items.length).be.eql(2);
					should(listView.sections[0].items[0].properties.title).be.eql('Apple');
					should(listView.sections[0].items[1].properties.title).be.eql('Banana');
					should(listView.sections[1].items.length).be.eql(2);
					should(listView.sections[1].items[0].properties.title).be.eql('Carrots');
					should(listView.sections[1].items[1].properties.title).be.eql('Potatoes');
				} catch (err) {
					return finish(err);
				}

				finish();
			}, 2000);
		});

		win.add(listView);
		win.open();
	});

	// iOS-only properties
	it.ios('ListView.getSelectedRows', function (finish) {
		const list = Ti.UI.createListView({
			sections: [ Ti.UI.createListSection({
				items: [ {
					properties: {
						title: 'My Title 1',
					}
				}, {
					properties: {
						title: 'My Title 2',
					}
				} ]
			}) ]
		});

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			try {
				list.selectItem(0, 1);
				should(list.selectedItems[0].section).be.eql(list.sections[0]);
				should(list.selectedItems[0].sectionIndex).be.eql(0);
				should(list.selectedItems[0].itemIndex).be.eql(1);
				list.selectItem(0, 0);
				should(list.selectedItems[0].section).be.eql(list.sections[0]);
				should(list.selectedItems[0].sectionIndex).be.eql(0);
				should(list.selectedItems[0].itemIndex).be.eql(0);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.add(list);
		win.open();
	});

	// iOS-only properties
	it.ios('ListView.getSelectedRows', function (finish) {
		const list = Ti.UI.createListView({
			allowsMultipleSelectionDuringEditing: true,
			sections: [ Ti.UI.createListSection({
				items: [ {
					properties: {
						title: 'My Title 1',
					}
				}, {
					properties: {
						title: 'My Title 2',
					}
				} ]
			}) ]
		});

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			try {
				should(list.allowsMultipleSelectionDuringEditing).be.be.true();
				should(list.getAllowsMultipleSelectionDuringEditing()).be.be.true();

				list.allowsMultipleSelectionDuringEditing = false;
				should(list.allowsMultipleSelectionDuringEditing).be.be.false();
				should(list.getAllowsMultipleSelectionDuringEditing()).be.be.false();
				list.setAllowsMultipleSelectionDuringEditing(true);
				should(list.allowsMultipleSelectionDuringEditing).be.be.true();
				should(list.getAllowsMultipleSelectionDuringEditing()).be.be.true();
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.add(list);
		win.open();
	});

	it.androidAndWindowsMissing('.refreshControl (in NavigationWindow)', function (finish) {
		const window = Ti.UI.createWindow({
			title: 'Hello World',
			largeTitleEnabled: true,
			extendEdges: [ Ti.UI.EXTEND_EDGE_ALL ]
		});

		window.addEventListener('open', function () {
			control.beginRefreshing();
		});

		const nav = Ti.UI.iOS.createNavigationWindow({
			window: window
		});

		const control = Ti.UI.createRefreshControl();

		const listView = Ti.UI.createListView({
			refreshControl: control
		});

		control.addEventListener('refreshstart', function () {
			setTimeout(function () {
				control.endRefreshing();
			}, 2000);
		});

		control.addEventListener('refreshend', function () {
			nav.close();
			finish();
		});

		window.add(listView);
		nav.open();
	});

	it.windowsMissing('.refreshControl (Basic)', function (finish) {
		win = Ti.UI.createWindow();

		win.addEventListener('open', function () {
			control.beginRefreshing();
		});

		const control = Ti.UI.createRefreshControl();

		const listView = Ti.UI.createListView({
			refreshControl: control
		});

		control.addEventListener('refreshstart', function () {
			setTimeout(function () {
				control.endRefreshing();
			}, 2000);
		});

		control.addEventListener('refreshend', function () {
			finish();
		});

		win.add(listView);
		win.open();
	});

	it.android('listView with Ti.UI.Android.CardView', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'gray'
		});
		const listView = Ti.UI.createListView({
				templates: {
					test: {
						childTemplates: [ {
							type: 'Ti.UI.Android.CardView',
							childTemplates: [ {
								type: 'Ti.UI.Label',
								bindId: 'label',
								properties: {
									color: 'black',
									bindId: 'label'
								}
							} ],
							properties: {
								width: Ti.UI.FILL,
								height: Ti.UI.SIZE,
								cardUseCompatPadding: true,
								backgroundColor: 'white',
								layout: 'vertical'
							}
						} ]
					}
				},
				defaultItemTemplate: 'test'
			}),
			section = Ti.UI.createListSection(),
			items = [];

		[ 'A', 'B', 'C' ].forEach(item => items.push({
			label: { text: item },
			template: 'test'
		}));

		section.setItems(items);
		listView.setSections([ section ]);

		// should not crash after drawing listView
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			finish();
		});

		win.add(listView);
		win.open();
	});

	it.android('.fastScroll', function () {
		const listView = Ti.UI.createListView();
		should(listView.fastScroll).be.be.false();
		should(listView.setFastScroll).be.a.Function();
	});
});
