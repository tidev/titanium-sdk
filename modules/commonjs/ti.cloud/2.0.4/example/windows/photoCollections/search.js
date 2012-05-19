windowFunctions['Search Photo Collections'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);

    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u, bottom: 0,
        data: [
            { title: 'Loading, please wait...' }
        ]
    });
    table.addEventListener('click', function (evt) {
        if (evt.row.id) {
            handleOpenWindow({ target: 'Show Photo Collection', id: evt.row.id });
        }
    });
    win.add(table);

    function findCollections(userID) {
        Cloud.PhotoCollections.search({
            user_id: userID
        }, function (e) {
            if (e.success) {
                if (e.collections.length == 0) {
                    table.setData([
                        { title: 'No Results!' }
                    ]);
                }
                else {
                    var data = [];
                    for (var i = 0, l = e.collections.length; i < l; i++) {
                        data.push(Ti.UI.createTableViewRow({
                            title: e.collections[i].name,
                            id: e.collections[i].id
                        }));
                    }
                    table.setData(data);
                }
            }
            else {
                error(e);
            }
        });
    }

    function findMe() {
        Cloud.Users.showMe(function (e) {
            if (e.success) {
                findCollections(e.users[0].id);
            }
            else {
                table.setData([
                    { title: (e.error && e.message) || e }
                ]);
                error(e);
            }
        });
    }

    win.addEventListener('open', function () {
        findMe();
    });
    win.open();
};