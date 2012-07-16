Ti.include(
    'create.js',
    'query.js',
    'remove.js',
    'search.js',
    'show.js',
    'update.js'
);

windowFunctions['Photos'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var rows = [
        'Query Photo',
        'Search Photo'
    ];
    if (Ti.Media.openPhotoGallery || Ti.Media.showCamera) {
        rows.unshift('Create Photo');
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