windowFunctions['Logout Current User'] = function (evt) {
    var win = createWindow();
    addBackButton(win);
    var status = Ti.UI.createLabel({
        text: 'Logging out, please wait...',
        textAlign: 'center'
    });
    win.add(status);
    win.open();
    Cloud.Users.logout(function (e) {
        if (e.success) {
            status.text = 'Logged out!';
        }
        else {
            status.text = (e.error && e.message) || e;
        }
    });
};