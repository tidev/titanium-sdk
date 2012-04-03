describe("Ti.Facebook tests", {
    // https://jira.appcelerator.org/browse/TIMOB-6234
    buttonStyleConstants: function() {
        valueOf(function() { 
            Ti.Facebook.createLoginButton({ style: Titanium.Facebook.BUTTON_STYLE_NORMAL })
        }).shouldNotThrowException();
        valueOf(function() { 
            Ti.Facebook.createLoginButton({ style: Titanium.Facebook.BUTTON_STYLE_WIDE })
        }).shouldNotThrowException();
    }
});
