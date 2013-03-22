/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */


module.exports = new function() {
	var finish,
		valueOf,
		reportError,
		openEvent = (Ti.Platform.osname === 'tizen') || (Ti.Platform.osname === 'mobileweb') ? "postlayout" : "open";

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
	}

	this.name = "text_field";
	this.tests = [
		{name: "testBasicProperties"},
		{name: "testValue"},
		{name: "testEventsBlur"}
	];

	this.testBasicProperties = function(testRun) {
		// Create windows instance
		var win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF',
				exitOnClose: true,
				layout: 'vertical',
				title: 'Anvil UI TextField test'
			}),
			// Create test object instance
			tempTextField = Ti.UI.createTextField({
				value: 'TextField from Anvil',
				hintText: 'TextField\'s hint text',
				height: 200,
				width: 150,
				top: 50,
				left: 20,
				autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_ALL,
				borderStyle: Ti.UI.INPUT_BORDERSTYLE_LINE,
				textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
				clearOnEdit: true,
				color: '#000000',
				maxLength: 99,
				autocorrect: true,
				editable: true,
				enableReturnKey: true,
				suppressReturn: false,
				enabled: true
			});

		win.add(tempTextField);

		win.addEventListener(openEvent, function(){
			Ti.API.info('Event "' + openEvent + '" fired.');

			Ti.API.info('Checking "autocapitalization" property. Current value: ' + tempTextField.autocapitalization);
			valueOf(testRun, tempTextField.autocapitalization).shouldBe(Ti.UI.TEXT_AUTOCAPITALIZATION_ALL);

			Ti.API.info('Checking "autocorrect" property. Current value: ' + tempTextField.autocorrect);
			valueOf(testRun, tempTextField.autocorrect).shouldBe(true);

			Ti.API.info('Checking "borderStyle" property. Current value: ' + tempTextField.borderStyle);
			valueOf(testRun, tempTextField.borderStyle).shouldBe(Ti.UI.INPUT_BORDERSTYLE_LINE);

			Ti.API.info('Checking "clearOnEdit" property. Current value: ' + tempTextField.clearOnEdit);
			valueOf(testRun, tempTextField.clearOnEdit).shouldBe(true);

			Ti.API.info('Checking "maxLength" property. Current value: ' + tempTextField.maxLength);
			valueOf(testRun, tempTextField.maxLength).shouldBe(99);

			Ti.API.info('Checking "color" property. Current value: ' + tempTextField.color);
			valueOf(testRun, tempTextField.color).shouldBe('#000000');

			Ti.API.info('Checking "textAlign" property. Current value: ' + tempTextField.textAlign);
			valueOf(testRun, tempTextField.textAlign).shouldBe(Ti.UI.TEXT_ALIGNMENT_CENTER);

			Ti.API.info('Checking "editable" property. Current value: ' + tempTextField.editable);
			valueOf(testRun, tempTextField.editable).shouldBe(true);

			Ti.API.info('Checking "suppressReturn" property. Current value: ' + tempTextField.suppressReturn);
			valueOf(testRun, tempTextField.suppressReturn).shouldBe(false);

			Ti.API.info('Checking "enableReturnKey" property. Current value: ' + tempTextField.enableReturnKey);
			valueOf(testRun, tempTextField.enableReturnKey).shouldBe(true);

			Ti.API.info('Checking "enabled" property. Current value: ' + tempTextField.enabled);
			valueOf(testRun, tempTextField.enabled).shouldBe(true);

			Ti.API.info('Checking "top" property. Current value: ' + tempTextField.top);
			valueOf(testRun, tempTextField.top).shouldBe(50);

			Ti.API.info('Checking "left" property. Current value: ' + tempTextField.left);
			valueOf(testRun, tempTextField.left).shouldBe(20);

			Ti.API.info('Checking "width" property. Current value: ' + tempTextField.width);
			valueOf(testRun, tempTextField.width).shouldBe(150);

			Ti.API.info('Checking "height" property. Current value: ' + tempTextField.height);
			valueOf(testRun, tempTextField.height).shouldBe(200);

			Ti.API.info('Checking "value" property. Current value: ' + tempTextField.value);
			valueOf(testRun, tempTextField.value).shouldBe('TEXTFIELD FROM ANVIL'); // Ti.UI.TEXT_AUTOCAPITALIZATION_ALL

			Ti.API.info('Checking "hintText" property. Current value: ' + tempTextField.hintText);
			valueOf(testRun, tempTextField.hintText).shouldBe('TextField\'s hint text');

			setTimeout(function(){
				win.close();
				finish(testRun);
			}, 100)
		})

		win.open();
	}

	this.testValue = function(testRun) {
		// Create windows instance
		var win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF',
				exitOnClose: true,
				layout: 'vertical',
				title: 'Anvil UI TextField test'
			}),
			// Create test object instance
			tempTextField = Ti.UI.createTextField({
				value:'value1'
			});

		win.add(tempTextField);

		win.addEventListener(openEvent, function() {
			Ti.API.info('Checking "value" property. Pass #1. Current value: ' + tempTextField.value);
			valueOf(testRun, tempTextField.value).shouldBe('value1');

			Ti.API.info('Checking "hasText()" method. Pass #1. Current value: ' + tempTextField.hasText());
			valueOf(testRun, tempTextField.hasText()).shouldBe(true);

			tempTextField.value = 'value2';
			Ti.API.info('Checking "value" property. Pass #2. Current value: ' + tempTextField.value);
			valueOf(testRun, tempTextField.value).shouldBe('value2');

			tempTextField.value = '';
			Ti.API.info('Checking "value" property. Pass #3. Current value: ' + tempTextField.value);
			valueOf(testRun, tempTextField.value).shouldBe('');

			Ti.API.info('Checking "hasText()" method. Pass #3. Current value: ' + tempTextField.hasText());
			valueOf(testRun, tempTextField.hasText()).shouldBe(false);

			tempTextField.setValue('value3');
			Ti.API.info('Checking "setValue()" and "getValue()" methods.');
			valueOf(testRun, tempTextField.getValue()).shouldBe('value3');

			setTimeout(function() {
				win.close();

				finish(testRun);
			}, 100)
		})

		win.open();
	}

	this.testEventsBlur = function(testRun) {
		// Create windows instance
		var win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF',
				exitOnClose: true,
				layout: 'vertical',
				title: 'Anvil UI TextArea test'
			}),
			// Create test object instances
			tempTextField = Ti.UI.createTextField({value:'TF1'}),
			tempTextField2 = Ti.UI.createTextField({value:'TF2'}),
			focusEventExpected = false,
			blurEventExpected = false,
			focusEventReceived = false,
			blurEventReceived = false;

		tempTextField.addEventListener('focus',function(e) {
			Ti.API.info("focus event received. e.value:"+ e.value);

			if (focusEventExpected) {
				valueOf(testRun, e.value).shouldBe('TF1');

				focusEventReceived = true;
			}
		})

		tempTextField.addEventListener('blur',function(e) {
			Ti.API.info("blur event received. e.value:"+ e.value);

			if (blurEventExpected) {
				valueOf(testRun, e.value).shouldBe('TF1');
				blurEventReceived = true;
			}
		})

		win.add(tempTextField2);
		win.add(tempTextField);

		win.addEventListener(openEvent, function() {
			// Setting focus to another control
			tempTextField2.focus();
			focusEventExpected = true;
			// Checking focus.
			tempTextField.focus();

			blurEventExpected = true;
			tempTextField.blur();

			setTimeout(function() {
				valueOf(testRun, (blurEventReceived)).shouldBe(true);
				valueOf(testRun, (focusEventReceived)).shouldBe(true);
				win.close();
				finish(testRun);
			}, 100);
		})

		win.open();
	}
}