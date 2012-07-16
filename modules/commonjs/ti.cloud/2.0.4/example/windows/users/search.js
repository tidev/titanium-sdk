windowFunctions['Search User'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);

    var search = Ti.UI.createTextField({
        hintText: 'Full Text Search',
        top: offset + 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    win.add(search);

    var button = Ti.UI.createButton({
        title: 'Search',
        top: offset + 60 + u, left: 10 + u, right: 10 + u,
        height: 40 + u
    });
    win.add(button);

    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + 110 + u, bottom: 0
    });
    table.addEventListener('click', function (evt) {
        if (evt.row.id) {
            handleOpenWindow({ target: 'Show User', id: evt.row.id });
        }
    });
    win.add(table);

    function submitForm() {
        if (!search.value.length) {
            search.focus();
            return;
        }
        search.blur();
        button.hide();

        Cloud.Users.search({
                q: search.value
            }, function (e) {
                button.show();
                if (e.success) {
                    if (e.users.length == 0) {
                        table.setData([
                            { title: 'No Results!' }
                        ]);
                    }
                    else {
                        var data = [];
                        for (var i = 0, l = e.users.length; i < l; i++) {
                            data.push(Ti.UI.createTableViewRow({
                                title: e.users[i].first_name + ' ' + e.users[i].last_name,
                                id: e.users[i].id
                            }));
                        }
                        table.setData(data);
                    }
                }
                else {
                    error(e);
                }
            }
        );
    }

    button.addEventListener('click', submitForm);
    search.addEventListener('return', submitForm);

    win.addEventListener('open', function () {
        search.focus();
    });
    win.open();
};