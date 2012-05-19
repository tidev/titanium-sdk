windowFunctions['Show Current User'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var status = Ti.UI.createLabel({
        text: 'Loading, please wait...', textAlign: 'left',
        height: 30 + u, left: 20 + u, right: 20 + u
    });
    content.add(status);

    Cloud.Users.showMe(function (e) {
        content.remove(status);
        if (e.success) {
            enumerateProperties(content, e.users[0], 20);
        }
        else {
            error(e);
        }
    });

    win.open();
};