describe("Ti.Facebook tests", {
    // https://jira.appcelerator.org/browse/TIMOB-6234
    buttonStyleConstants: function() {
        valueOf(Ti.Facebook.BUTTON_STYLE_NORMAL).shouldBeNumber();
        valueOf(Ti.Facebook.BUTTON_STYLE_WIDE).shouldBeNumber();

        valueOf(function() { 
            var button = Ti.Facebook.createLoginButton({ style: Ti.Facebook.BUTTON_STYLE_NORMAL });
        }).shouldNotThrowException();

        valueOf(function() { 
            var button = Ti.Facebook.createLoginButton({ style: Ti.Facebook.BUTTON_STYLE_WIDE })
        }).shouldNotThrowException();

    }
});
