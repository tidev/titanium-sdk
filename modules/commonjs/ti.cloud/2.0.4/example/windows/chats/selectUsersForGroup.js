windowFunctions['Select Users for Group'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);

    var checked = {};

    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u, bottom: 0,
        data: [
            { title: 'Loading, please wait...' }
        ]
    });
    table.addEventListener('click', function (evt) {
        if (evt.row.id) {
            if (evt.row.isMyID)
                return;
            evt.row.hasCheck = !evt.row.hasCheck;
            checked[evt.row.id] = evt.row.hasCheck;
            if (!evt.row.hasCheck) {
                delete checked[evt.row.id];
                delete evt.row.hasCheck;
            }
        }
        else {
            var ids = [];
            for (var id in checked) {
                if (!checked.hasOwnProperty(id)) {
                    continue;
                }
                ids.push(id);
            }
            if (ids.length) {
                handleOpenWindow({ target: 'Show Chat Group', ids: ids });
            } else {
                alert('Please check at least one user!');
            }
        }
    });
    win.add(table);

    function getMyID(callback) {
        Cloud.Users.showMe(function (e) {
            if (e.success) {
                callback(e.users[0].id);
            }
            else {
                table.setData([
                    { title: (e.error && e.message) || e }
                ]);
                error(e);
            }
        });
    }

    function queryUsers(myID) {
        Cloud.Users.query(function (e) {
            if (e.success) {
                if (e.users.length == 0) {
                    table.setData([
                        { title: 'No Other Users! Cannot chat!' }
                    ]);
                }
                else {
                    var data = [];
                    data.push({ title: 'Start Chatting!' });
                    for (var i = 0, l = e.users.length; i < l; i++) {
                        var user = e.users[i];
                        var row = Ti.UI.createTableViewRow({
                            title: user.first_name + ' ' + user.last_name,
                            id: user.id
                        });
                        var isMyID = user.id == myID;
                        if (isMyID) {
                            row.isMyID = row.hasCheck = checked[user.id] = true;
                            
                        }
                        data.push(row);
                    }
                    table.setData(data);
                }
            }
            else {
                table.setData([
                    { title: (e.error && e.message) || e }
                ]);
                error(e);
            }
        })
    }

    win.addEventListener('open', function () {
        getMyID(queryUsers);
    });
    win.open();
};