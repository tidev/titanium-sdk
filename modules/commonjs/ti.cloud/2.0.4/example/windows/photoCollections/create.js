windowFunctions['Create Photo Collection'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var name = Ti.UI.createTextField({
        hintText: 'Name',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    content.add(name);

    var parentCollectionID;
    var chooseCollection = Ti.UI.createButton({
        title: 'Choose Parent Collection',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    chooseCollection.addEventListener('click', function () {
        var table = Ti.UI.createTableView({
            backgroundColor: '#fff',
            data: [
                { title: 'Loading, please wait...' }
            ]
        });
        table.addEventListener('click', function (evt) {
            parentCollectionID = evt.row.id;
            win.remove(table);
        });
        win.add(table);

        function findCollections(userID) {
            Cloud.PhotoCollections.search({
                user_id: userID
            }, function (e) {
                if (e.success) {
                    if (e.collections.length == 0) {
                        win.remove(table);
                        alert('No photo collections exist! Create one first.');
                    }
                    else {
                        var data = [];
                        data.push(Ti.UI.createTableViewRow({
                            title: 'No Collection',
                            id: '',
                            hasCheck: !parentCollectionID
                        }));
                        for (var i = 0, l = e.collections.length; i < l; i++) {
                            if (e.collections[i].id == evt.id) {
                                continue;
                            }
                            data.push(Ti.UI.createTableViewRow({
                                title: e.collections[i].name,
                                id: e.collections[i].id,
                                hasCheck: parentCollectionID == e.collections[i].id
                            }));
                        }
                        table.setData(data);
                    }
                }
                else {
                    win.remove(table);
                    error(e);
                }
            });
        }

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
    });
    content.add(chooseCollection);

    var button = Ti.UI.createButton({
        title: 'Create',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    content.add(button);

    function submitForm() {
        for (var i = 0; i < fields.length; i++) {
            if (!fields[i].value.length) {
                fields[i].focus();
                return;
            }
            fields[i].blur();
        }

        button.hide();

        Cloud.PhotoCollections.create({
            name: name.value,
            parent_collection_id: parentCollectionID
        }, function (e) {
            if (e.success) {
                alert('Created!');
                name.value = '';
                parentCollectionID = null;
            }
            else {
                error(e);
            }
            button.show();
        });
    }

    button.addEventListener('click', submitForm);
    var fields = [ name ];
    for (var i = 0; i < fields.length; i++) {
        fields[i].addEventListener('return', submitForm);
    }

    win.addEventListener('open', function () {
        name.focus();
    });
    win.open();
};