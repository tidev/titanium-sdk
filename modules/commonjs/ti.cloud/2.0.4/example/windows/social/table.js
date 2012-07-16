Ti.include(
    'externalLink.js',
    'externalLogin.js',
    'externalUnlink.js',
    'searchFacebookFriends.js'
);

windowFunctions['Social'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var rows = [
        'Search Facebook Friends'
    ];
    if (Ti.Facebook.createLoginButton) {
        var available = true;
        try {
            Ti.Facebook.createLoginButton();
        }
        catch (err) {
            available = false;
        }
        if (available) {
            rows.push('External Link');
            rows.push('External Login');
            rows.push('External Unlink');
        }
    }
    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u,
        data: createRows(rows)
    });
    table.addEventListener('click', handleOpenWindow);
    win.add(table);
    win.open();
};