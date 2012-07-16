windowFunctions['External Login'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    // TODO: Get your own App ID from Facebook: https://developers.facebook.com/docs/opengraph/tutorial/#create-app
    Ti.Facebook.appid = '<<YOUR FACEBOOK APPID HERE>>';
    Ti.Facebook.permissions = ['publish_stream', 'read_stream'];

    var label = Ti.UI.createLabel({
        textAlign: 'center',
        top: 10 + u, right: 10 + u, left: 10 + u,
        height: 'auto'
    });
    content.add(label);

    function updateLoginStatus() {
        if (Ti.Facebook.loggedIn) {
            label.text = 'Logging in to ACS as well, please wait...';
            Cloud.SocialIntegrations.externalAccountLogin({
                type: 'facebook',
                token: Ti.Facebook.accessToken
            }, function (e) {
                if (e.success) {
                    var user = e.users[0];
                    alert('Logged in! You are now logged in as ' + user.id);
                }
                else {
                    error(e);
                }
            });
        }
        else {
            label.text = 'Please login to Facebook.';
        }
    }

    Ti.Facebook.addEventListener('login', updateLoginStatus);
    Ti.Facebook.addEventListener('logout', updateLoginStatus);

    content.add(Ti.Facebook.createLoginButton({
        top: 10 + u,
        style: Ti.Platform.name == 'iPhone OS'
            ? Ti.Facebook.BUTTON_STYLE_WIDE
            : 'wide'
    }));

    win.addEventListener('open', function (evt) {
        updateLoginStatus();
    });

    win.open();
};