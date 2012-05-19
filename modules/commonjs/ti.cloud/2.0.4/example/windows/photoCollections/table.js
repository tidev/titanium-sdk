Ti.include(
    'create.js',
    'update.js',
    'search.js',
    'remove.js',
    'show.js',
    'showSubcollections.js',
    'showPhotos.js'
);

windowFunctions['Photo Collections'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u,
        data: createRows([
            'Create Photo Collection',
            'Search Photo Collections'
        ])
    });
    table.addEventListener('click', handleOpenWindow);
    win.add(table);
    win.open();
};