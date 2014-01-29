/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ui_tableViewSection";
	this.tests = [
		{name: "accessAndManipulate", timeout: 10000}
	]

	//TIMOB-10324
	this.accessAndManipulate = function(testRun) {
		Ti.UI.backgroundColor = 'white';
		var win = Ti.UI.createWindow();
		var sectionFruit = Ti.UI.createTableViewSection({
			headerTitle : 'Fruit'
		});
		sectionFruit.add(Ti.UI.createTableViewRow({
			title : 'Apples'
		}));
		sectionFruit.add(Ti.UI.createTableViewRow({
			title : 'Bananas'
		}));
		var sectionVeg = Ti.UI.createTableViewSection({
			headerTitle : 'Vegetables'
		});
		sectionVeg.add(Ti.UI.createTableViewRow({
			title : 'Carrots'
		}));
		sectionVeg.add(Ti.UI.createTableViewRow({
			title : 'Potatoes'
		}));
		var table = Ti.UI.createTableView({
			data : [sectionFruit, sectionVeg]
		});
		win.add(table);
		win.open();
		var sectionFish = Ti.UI.createTableViewSection({
			headerTitle : 'Fish'
		});
		sectionFish.add(Ti.UI.createTableViewRow({
			title : 'Cod'
		}));
		sectionFish.add(Ti.UI.createTableViewRow({
		title : 'Haddock'
		}));
		table.insertSectionBefore(0, sectionFish);
		setTimeout(function() {
			valueOf(testRun, sectionFruit.getRowCount( )).shouldBe(2);
			valueOf(testRun, sectionVeg.getRowCount( )).shouldBe(2);
			valueOf(testRun, sectionFish.getRowCount( )).shouldBe(2);
			valueOf(testRun, sectionFruit.getHeaderTitle( )).shouldBe('Fruit');
			valueOf(testRun, sectionVeg.getHeaderTitle( )).shouldBe('Vegetables');
			valueOf(testRun, sectionFish.getHeaderTitle( )).shouldBe('Fish');
			valueOf(testRun, sectionFruit.getRows( )).shouldBeObject();
			valueOf(testRun, sectionVeg.getRows( )).shouldBeObject();
			valueOf(testRun, sectionFish.getRows( )).shouldBeObject();

			finish(testRun);
		}, 10000);
	}
}
