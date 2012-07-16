windowFunctions['Query Post'] = function (evt) {
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
            handleOpenWindow({ target: 'Show Post', id: evt.row.id });
        }
    });
    win.add(table);

    win.addEventListener('open', function () {
        Cloud.Posts.query(function (e) {
            if (e.success) {
                if (e.posts.length == 0) {
                    table.setData([
                        { title: 'No Results!' }
                    ]);
                }
                else {
                    var data = [];
                    for (var i = 0, l = e.posts.length; i < l; i++) {
                        data.push(Ti.UI.createTableViewRow({
                            title: e.posts[i].title,
                            id: e.posts[i].id
                        }));
                    }
                    table.setData(data);
                }
            }
            else {
                error(e);
            }
        });
    });
    win.open();
};