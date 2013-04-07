/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// Simple automated tests of Titanium.UI.TableViewSection.

module.exports = new function() {
	var finish,
		valueOf,
		FOOTER_TITLE = "Footer Title",
		HEADER_TITLE = 'Header 1';

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "table_view_section";
	this.tests = [
		{name: "base"},
		{name: "getProp"},
		{name: "setProp"},
		{name: "rowCount"},
		{name: "rows"},
		{name: "addRemove"}
	];

	// Create a table view, add two sections, check if they are present.
	this.createSection = function(testRun) {
		var window = Ti.UI.createWindow();
		window.open();
		
		var section1 = Ti.UI.createTableViewSection({
			headerTitle:HEADER_TITLE
		}),
		section2 = Ti.UI.createTableViewSection({
			headerTitle: 'Section 2'
		}),
		tv = Ti.UI.createTableView({
			sections: [
				section1,
				section2
			]
		});

		window.add(tv);	

		// Check existing sections in the tableView
		valueOf(testRun, tv.sectionCount).shouldBe(2);
		valueOf(testRun, tv.sections[0]).shouldBe(section1);
		valueOf(testRun, tv.sections[1]).shouldBe(section2);

		window.close();

		finish(testRun);
	}
	
	// Check if, after adding two sections, the properties of the sections are sane.
	this.getProp = function(testRun) {
		var window = Ti.UI.createWindow();
		window.open();
		
		headerViewExam = Ti.UI.createView();
		footerViewExam = Ti.UI.createView();
		
		var section1 = Ti.UI.createTableViewSection({
			headerTitle: HEADER_TITLE,
			footerTitle: FOOTER_TITLE,
			headerView: headerViewExam,
			footerView: footerViewExam
		}),
		section2 = Ti.UI.createTableViewSection();		
		
		// Create tableView with filled and empty section 
		var tv = Ti.UI.createTableView({
			sections: [
				section1, section2
			]
		});
			
		// Add table view to the window
		window.add(tv);
		
		// POSITIVE scenario check existing correct values from filled section
		valueOf(testRun,tv.sections[0].footerTitle === FOOTER_TITLE).shouldBeTrue();
		valueOf(testRun,tv.sections[0].getFooterTitle() === FOOTER_TITLE).shouldBeTrue();	
		valueOf(testRun,tv.sections[0].headerTitle === HEADER_TITLE).shouldBeTrue();
		valueOf(testRun,tv.sections[0].getHeaderTitle() === HEADER_TITLE).shouldBeTrue();	
		valueOf(testRun,tv.sections[0].headerView === headerViewExam).shouldBeTrue();
		valueOf(testRun,tv.sections[0].getHeaderView() === headerViewExam).shouldBeTrue();	
		valueOf(testRun,tv.sections[0].footerView === footerViewExam).shouldBeTrue();
		valueOf(testRun,tv.sections[0].getFooterView() === footerViewExam).shouldBeTrue();				

		//NEGATIVE scenario check NOT existing values from empty section
		valueOf(testRun,tv.sections[1].footerTitle).shouldBeUndefined();
		valueOf(testRun,tv.sections[1].getFooterTitle()).shouldBeUndefined();	
		valueOf(testRun,tv.sections[1].headerTitle).shouldBeUndefined();
		valueOf(testRun,tv.sections[1].getHeaderTitle()).shouldBeUndefined();	
		valueOf(testRun,tv.sections[1].headerView).shouldBeUndefined();
		valueOf(testRun,tv.sections[1].getHeaderView()).shouldBeUndefined();	
		valueOf(testRun,tv.sections[1].footerView).shouldBeUndefined();
		valueOf(testRun,tv.sections[1].getFooterView()).shouldBeUndefined();	
			
		// Close window
		window.close();

		finish(testRun);
	}

	// Verify header and footer functionality of table view sections.
	// Assign header and footer titles and views to the table view sections,
	// and check that the values of the related properties are consistent.
	this.setProp = function(testRun) {
		var window = Ti.UI.createWindow();

		window.open();

		headerViewExam = Ti.UI.createView({left: 100});
		footerViewExam = Ti.UI.createView({left: 200});

		var section1 = Ti.UI.createTableViewSection({
				headerTitle: HEADER_TITLE,
				footerTitle: FOOTER_TITLE,
				headerView: headerViewExam,
				footerView: footerViewExam
			}),
			tv = Ti.UI.createTableView({
				sections:[section1]
			});		
			
		headerViewExam2 = Ti.UI.createView({left: 110});
		footerViewExam2 = Ti.UI.createView({left: 210});	
		
		tv.sections[0].setHeaderView(headerViewExam2);
		tv.sections[0].setFooterView(footerViewExam2);	
		
		var newFooterTitle = "New Footer Title",
			newHeaderTitle = "New Header Title";

		// Set New HeaderTitle and new FooterTitle to the section		
		tv.sections[0].setHeaderTitle(newHeaderTitle);
		tv.sections[0].setFooterTitle(newFooterTitle );
		
		window.add(tv);		

		// Check setHeaderTitle function
		valueOf(testRun,tv.sections[0].headerTitle).shouldBe(newHeaderTitle);
		valueOf(testRun,tv.sections[0].getHeaderTitle() === newHeaderTitle).shouldBeTrue();

		// Check setFooterTitle function
		valueOf(testRun,tv.sections[0].footerTitle).shouldBe(newFooterTitle);
		valueOf(testRun,tv.sections[0].getFooterTitle()).shouldBe(newFooterTitle);
		
		// Check setHeaderView function
		valueOf(testRun,tv.sections[0].headerView === headerViewExam).shouldBeFalse();
		valueOf(testRun,tv.sections[0].getHeaderView() === headerViewExam).shouldBeFalse();
		valueOf(testRun,tv.sections[0].headerView === headerViewExam2).shouldBeTrue();
		valueOf(testRun,tv.sections[0].getHeaderView() === headerViewExam2).shouldBeTrue();
			
		// Check setFooterView function
		valueOf(testRun,tv.sections[0].footerView === footerViewExam).shouldBeFalse();
		valueOf(testRun,tv.sections[0].getFooterView() === footerViewExam).shouldBeFalse();
		valueOf(testRun,tv.sections[0].footerView === footerViewExam2).shouldBeTrue();
		valueOf(testRun,tv.sections[0].getFooterView() === footerViewExam2).shouldBeTrue();
		
		// Close window
		window.close();

		finish(testRun);
	}	

	// After creation of multiple table view rows and sections, check if the
	// resulting count of sections, and their respective rows, is correct.
	this.rowCount = function(testRun) {
		var window = Ti.UI.createWindow(),
			section1 = Ti.UI.createTableViewSection({
				headerTitle: HEADER_TITLE
			}),
			section1Count = 5,
			i = 0;

		window.open();

		// Add some rows to the first TableViewSection
		for (; i < section1Count; i++) {
			section1.add(Ti.UI.createTableViewRow({
				title: 'Row ' + i
			}));
		};

		// Create the second TableViewSection
		var section2 = Ti.UI.createTableViewSection({
				headerTitle: 'Section 2'
			}),
			section2Count = 4,
			i = 0;

		// Add some rows to the second TableViewSection
		for (; i < section2Count; i++) {
			section2.add(Ti.UI.createTableViewRow({
				title: 'Row ' + i
			}));
		}

		var tv = Ti.UI.createTableView({
			sections: [
				section1,
				section2
			]
		});

		// Add table view to the window		
		window.add(tv);	

		// Check rowCount for first section
		valueOf(testRun,tv.sections[0].getRowCount()).shouldBe(section1Count);	
		valueOf(testRun,tv.sections[0].rowCount).shouldBe(section1Count);
		valueOf(testRun,tv.sections[0].rowCount).shouldBe(section1Count);

		// Check rowCount for second section
		valueOf(testRun,tv.sections[1].getRowCount()).shouldBe(section2Count);	
		valueOf(testRun,tv.sections[1].rowCount).shouldBe(section2Count);	

		tv.sections[0].add(Ti.UI.createTableViewRow({title:'new Row'}));

		// Close window
		window.close();		
		finish(testRun);		
	}

	// Test access to rows from sections.
	this.rows = function(testRun) {			
		var window = Ti.UI.createWindow(),
			section1 = Ti.UI.createTableViewSection({
				headerTitle:HEADER_TITLE
			}),
			section1Count = 5,
			i = 0;

		window.open();

		for (; i < section1Count; i++) {
			section1.add(Ti.UI.createTableViewRow({
				title: 'Row ' + i
			}));
		}

		var section2 = Ti.UI.createTableViewSection({
				headerTitle: 'Section 2'
			}),
			section2Count = 4,
			i = 0;

		// Add some rows to the second TableViewSection
		for (; i < section2Count; i++) {
			section2.add(Ti.UI.createTableViewRow({
				title: 'Row ' + i
			}));
		}

		// Create tableView with sections
		var tv = Ti.UI.createTableView({
			sections: [
				section1,
				section2
			]
		});

		// Add table view to the window
		window.add(tv);	

		// Check rows properties and getRows function
		setTimeout(function(){
			valueOf(testRun,tv.sections[0].rows).shouldNotBeUndefined();
			valueOf(testRun,tv.sections[0].rows.length).shouldBe(section1Count);
			valueOf(testRun,tv.sections[0].getRows()).shouldBeArray();
			valueOf(testRun,tv.sections[0].getRows().length).shouldBe(section1Count);
			valueOf(testRun,tv.sections[1].rows).shouldNotBeUndefined();
			valueOf(testRun,tv.sections[1].rows.length).shouldBe(section2Count);
			valueOf(testRun,tv.sections[1].getRows()).shouldBeArray();
			valueOf(testRun,tv.sections[1].getRows().length).shouldBe(section2Count);

			finish(testRun);
		} , 1000);

		//Close window
		window.close();	
	}	
	
	// Test adding and removing rows from sections.
	this.addRemove = function(testRun) {
		var window = Ti.UI.createWindow(),
			section1 = Ti.UI.createTableViewSection({
				headerTitle:HEADER_TITLE
			});

		window.open();

		row = Ti.UI.createTableViewRow({title: 'Row sample'});
		section1.add(row);

		var section2 = Ti.UI.createTableViewSection({
				headerTitle: 'Section 2'
			}),
			section2Count = 4,
			lastRow,
			i = 0;

		for (; i < section2Count; i++) {
			lastRow = Ti.UI.createTableViewRow({title: 'Row ' + i});
			section2.add(lastRow);
		}

		var tv = Ti.UI.createTableView({
			sections: [
				section1,
				section2
			]
		});

		window.add(tv);	
		
		// Remove rows and check the row count.
		valueOf(testRun,tv.sections[0].getRowCount()).shouldBe(1);		
		valueOf(testRun, function() {
			section1.remove(row);
		}).shouldNotThrowException();
		valueOf(testRun,tv.sections[0].getRowCount()).shouldBe(0);	
		valueOf(testRun,tv.sections[1].getRowCount()).shouldBe(section2Count);	
		valueOf(testRun, function() {
			section2.remove(lastRow);
		}).shouldNotThrowException();
		valueOf(testRun,tv.sections[1].getRowCount()).shouldBe(section2Count-1);	

		// Check removal of rows that do not belong to a section.
		row = Ti.UI.createTableViewRow({title:'This Row is fake'});

		valueOf(testRun, function() {
			section1.remove(fakeRow);
		}).shouldThrowException();		
		valueOf(testRun, function() {
			section2.remove(fakeRow);
		}).shouldThrowException();					
		
		window.close();		
		finish(testRun);
	}
}