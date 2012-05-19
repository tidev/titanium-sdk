Ti.include(
    'create.js',
    'query.js',
    'remove.js',
    'show.js'
);

windowFunctions['Checkins'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u,
        data: createRows([
            'Create Checkin',
            'Query Checkin'
        ])
    });
    table.addEventListener('click', handleOpenWindow);
    win.add(table);
    win.open();
};