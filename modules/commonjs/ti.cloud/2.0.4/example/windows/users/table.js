Ti.include(
    'hasStoredSession.js',
    'create.js',
    'login.js',
    'logout.js',
    'query.js',
    'remove.js',
    'requestResetPassword.js',
    'search.js',
    'show.js',
    'showMe.js',
    'update.js'
);

windowFunctions['Users'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u,
        data: createRows([
            'Has Stored Session',
            'Create User',
            'Login User',
            'Request Reset Password',
            'Show Current User',
            'Update Current User',
            'Remove Current User',
            'Logout Current User',
            'Query User',
            'Search User'
        ])
    });
    table.addEventListener('click', handleOpenWindow);
    win.add(table);
    win.open();
};