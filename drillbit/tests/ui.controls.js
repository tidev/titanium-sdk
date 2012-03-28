describe("Ti.UI control tests", {
	textControlsTextValueInitialValue : function() {
		var f = Ti.UI.createLabel();
		valueOf(f.text).shouldBe('');
		
		f = Ti.UI.createTextField();
		valueOf(f.value).shouldBe('');

		f = Ti.UI.createTextArea();
		valueOf(f.value).shouldBe('');
		
		f = Ti.UI.createSearchBar();
		valueOf(f.value).shouldBe('');
		
		f = Ti.UI.createButton();
		valueOf(f.title).shouldBe('');
	},
	textAreaFieldsHasText: function() {
		var textArea1 = Ti.UI.createTextArea();
		var hasText = textArea1.hasText();
		valueOf(hasText).shouldBe(false);
		
		var textArea2 = Ti.UI.createTextArea({
			value : 'I am a textarea'   
		});
		hasText = textArea2.hasText();
		valueOf(hasText).shouldBe(true);
		
		var textArea3 = Ti.UI.createTextArea({
			value : '',
		});
		hasText = textArea3.hasText();
		valueOf(hasText).shouldBe(false);
		
		var	textField1 = Ti.UI.createTextField();
		hasText = textField1.hasText();
		valueOf(hasText).shouldBe(false);
		
		var textField2 = Ti.UI.createTextField({
			value: "I am a textfield"
		});
		hasText = textField2.hasText();
		valueOf(hasText).shouldBe(true);
		
		var textField3 = Ti.UI.createTextField({
			value : '',
		});
		hasText = textField3.hasText();
		valueOf(hasText).shouldBe(false);
	} 
});