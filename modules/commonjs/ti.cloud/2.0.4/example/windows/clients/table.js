Ti.include(
    'geolocateMe.js',
    'geolocateParticular.js'
);

windowFunctions['Clients'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u,
        data: createRows([
            'Geolocate Me',
            'Geolocate Particular'
        ])
    });
    table.addEventListener('click', handleOpenWindow);
    win.add(table);
    win.open();
};