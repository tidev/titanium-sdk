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

	this.name = "ui_controls";
	this.tests = [
		{name: "textControlsTextValueInitialValue"},
		{name: "textAreaFieldsHasText"},
		{name: "scrollableViewScrollEvents"}
	]

	this.textControlsTextValueInitialValue = function(testRun) {
		var f = Ti.UI.createLabel();
		valueOf(testRun, f.text).shouldBe('');
		
		f = Ti.UI.createTextField();
		valueOf(testRun, f.value).shouldBe('');

		f = Ti.UI.createTextArea();
		valueOf(testRun, f.value).shouldBe('');
		
		f = Ti.UI.createSearchBar();
		valueOf(testRun, f.value).shouldBe('');
		
		f = Ti.UI.createButton();
		valueOf(testRun, f.title).shouldBe('');

		finish(testRun);
	}

	this.textAreaFieldsHasText = function(testRun) {
		var textArea1 = Ti.UI.createTextArea();
		var hasText = textArea1.hasText();
		valueOf(testRun, hasText).shouldBe(false);
		
		var textArea2 = Ti.UI.createTextArea({
			value : 'I am a textarea'   
		});
		hasText = textArea2.hasText();
		valueOf(testRun, hasText).shouldBe(true);
		
		var textArea3 = Ti.UI.createTextArea({
			value : '',
		});
		hasText = textArea3.hasText();
		valueOf(testRun, hasText).shouldBe(false);
		
		var	textField1 = Ti.UI.createTextField();
		hasText = textField1.hasText();
		valueOf(testRun, hasText).shouldBe(false);
		
		var textField2 = Ti.UI.createTextField({
			value: "I am a textfield"
		});
		hasText = textField2.hasText();
		valueOf(testRun, hasText).shouldBe(true);
		
		var textField3 = Ti.UI.createTextField({
			value : '',
		});
		hasText = textField3.hasText();
		valueOf(testRun, hasText).shouldBe(false);

		finish(testRun);
	}

	this.scrollableViewScrollEvents = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		
		// functional test for TIMOB-8933, TIMOB-9061: `scroll` event and `scrollEnd` event
    	var win = Ti.UI.createWindow({layout:'horizontal'});

    	var view1 = Ti.UI.createView({ backgroundColor:'#123', width: 250 });
    	var view2 = Ti.UI.createView({ backgroundColor:'#246', width: 250 });
    	var view3 = Ti.UI.createView({ backgroundColor:'#48b', width: 250 });

    	var scrollableView = Ti.UI.createScrollableView({
      		views: [view1,view2,view3],
      		showPagingControl: true,
      		width: 300,
      		height: 430
    	});

    	win.add(scrollableView);
    	win.open();

    	var scrollingEvents = [];

    	// Catch all scrolling events, then validate them
    	scrollableView.addEventListener('scroll', function (e) {
      		Ti.API.debug('scrollableView got a scroll event: float:' + e.currentPageAsFloat +  ' int: ' + e.currentPage);
      		scrollingEvents.push(e);
    	});

    	setTimeout(function () {
      		scrollableView.scrollToView(1);
    	}, 300);

    	scrollableView.addEventListener('dragEnd', function (e) {
      		Ti.API.debug('scrollableView got dragEnd event: ' + e.currentPage);
    	});

    	// This is fired when the scrollToView has completed; time to validate our events!
    	scrollableView.addEventListener('scrollEnd', function (endEvent) {
      		Ti.API.debug('scrollableView got a scrollEnd event: ' + endEvent.currentPage);

      		var numEvents = scrollingEvents.length;

      		try {
        		valueOf(testRun, endEvent.currentPage).shouldBe(1);

        		// On Android, sometimes, we don't collect enough events to have some that 
        		// are within these checks.  If that appears to be the case, don't run these
        		// checks.
        		if (numEvents > 5) {
          			valueOf(testRun, scrollingEvents[0].currentPage).shouldBe(0);
          			valueOf(testRun, scrollingEvents[0].view).shouldBe(view1);

          			valueOf(testRun, scrollingEvents[0].currentPageAsFloat).shouldBeLessThan(0.8);
          			valueOf(testRun, scrollingEvents[numEvents - 1].currentPageAsFloat).shouldBeGreaterThan(0.2);
				}

        		valueOf(testRun, scrollingEvents[numEvents - 1].currentPage).shouldBe(1);
        		valueOf(testRun, scrollingEvents[numEvents - 1].view).shouldBe(view2);

        		Ti.API.debug('passed');
        		finish(testRun);
      		} catch (exception) {
        		callback_error(exception);
      		}
    	});

		finish(testRun);
	}
}

