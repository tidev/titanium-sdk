Ti.include(
    'selectUsersForGroup.js',
    'showChatGroup.js'
);

windowFunctions['Chats'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);

    var table = Ti.UI.createTableView({
        backgroundColor: '#fff',
        top: offset + u, bottom: 0
    });
    table.addEventListener('click', function (evt) {
        if (evt.row.id) {
            handleOpenWindow({ target: 'Show Chat Group', id: evt.row.id });
        }
        else {
            handleOpenWindow({ target: 'Select Users for Group' });
        }
    });
    win.add(table);

    function refresh() {
        table.setData([
            { title: 'Loading, please wait...' }
        ]);
        Cloud.Chats.getChatGroups(function (e) {
            if (e.success) {
                var data = [];
                data.push({ title: 'Create new group!' });
                for (var i = 0, l = e.chat_groups.length; i < l; i++) {
                    var group = e.chat_groups[i];
                    var users = '';
                    for (var k = 0; k < group.participate_users.length; k++) {
                        users += ', ' + group.participate_users[k].first_name + ' ' + group.participate_users[k].last_name;
                    }
                    data.push(Ti.UI.createTableViewRow({
                        title: users.substr(2),
                        id: group.id
                    }));
                }
                table.setData(data);
            }
            else {
                error(e);
            }
        });
    }

    win.addEventListener('open', refresh);
    win.addEventListener('focus', refresh);
    win.open();
};