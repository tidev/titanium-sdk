module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "facebook";
	this.tests = [
		{name: "buttonStyleConstants"}
	]

	this.buttonStyleConstants = function() {
		valueOf(Ti.Facebook.BUTTON_STYLE_NORMAL).shouldBeNumber();
        valueOf(Ti.Facebook.BUTTON_STYLE_WIDE).shouldBeNumber();

        valueOf(function() {
            var button = Ti.Facebook.createLoginButton({ style: Ti.Facebook.BUTTON_STYLE_NORMAL });
        }).shouldNotThrowException();

        valueOf(function() {
            var button = Ti.Facebook.createLoginButton({ style: Ti.Facebook.BUTTON_STYLE_WIDE })
        }).shouldNotThrowException();

		finish();
	}
}
