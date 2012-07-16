Ti.include(
    'create.js',
    'query.js',
    'remove.js',
    'update.js'
);

windowFunctions['Custom Objects'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u,
        data: createRows([
            'Create Object',
            'Query Objects'
        ])
    });
    table.addEventListener('click', handleOpenWindow);
    win.add(table);
    win.open();
};