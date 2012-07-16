Ti.include(
    'create.js',
    'query.js',
    'show.js'
);

windowFunctions['Status'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u,
        data: createRows([
            'Create Status',
            'Query Status',
            'Show Status for User'
        ])
    });
    table.addEventListener('click', handleOpenWindow);
    win.add(table);
    win.open();
};