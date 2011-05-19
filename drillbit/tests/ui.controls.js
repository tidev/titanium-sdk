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
	}
});