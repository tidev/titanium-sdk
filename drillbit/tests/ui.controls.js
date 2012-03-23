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
			value: "This is the text."
		});
		hasText = textArea2.hasText();
		valueOf(hasText).shouldBe(true);
		
		var	textField1 = Ti.UI.createTextField();
		hasText = textField1.hasText();
		valueOf(hasText).shouldBe(false);
		
		var textField2 = Ti.UI.createTextField({
			value : 'I am a textarea',
		    height : 70,
		    width : 300,
		    top : 60,
		    font : {fontSize:20,fontFamily:'Marker Felt', fontWeight:'bold'},
		    color : '#888',
		    textAlign : 'left',
		    appearance : Titanium.UI.KEYBOARD_APPEARANCE_ALERT, 
		    keyboardType : Titanium.UI.KEYBOARD_NUMBERS_PUNCTUATION,
		    returnKeyType : Titanium.UI.RETURNKEY_EMERGENCY_CALL,
		    borderWidth : 2,
		    borderColor : '#bbb',
		    borderRadius : 5
		});
		hasText = textField2.hasText();
		valueOf(hasText).shouldBe(true);
	} 
});