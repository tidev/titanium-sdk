windowFunctions['Update Object'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var remove = Ti.UI.createButton({
        title: 'Remove',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    remove.addEventListener('click', function () {
        handleOpenWindow({ target: 'Remove Object', id: evt.id, classname: evt.classname });
    });
    content.add(remove);

    var button = Ti.UI.createButton({
        title: 'Update',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });

    var fields = [];

    function submitForm() {

        var data = {
            classname: evt.classname,
            id: evt.id,
            fields: {}
        };
        for (var i = 0; i < fields.length; i++) {
            data.fields[fields[i].hintText] = fields[i].value;
            fields[i].blur();
        }
        button.hide();

        Cloud.Objects.update(data, function (e) {
            if (e.success) {
                alert('Updated!');
            }
            else {
                error(e);
            }
            button.show();
        });
    }

    button.addEventListener('click', submitForm);

    var status = Ti.UI.createLabel({
        text: 'Loading, please wait...', textAlign: 'center',
        top: offset + u, right: 0, bottom: 0, left: 0,
        backgroundColor: '#fff', zIndex: 2
    });
    win.add(status);

    win.addEventListener('open', function () {
        Cloud.Objects.show({
            classname: evt.classname,
            id: evt.id
        }, function (e) {
            status.hide();
            if (e.success) {
                var object = e[evt.classname][0];

                for (var key in object) {
                    if (!object.hasOwnProperty(key)) {
                        continue;
                    }
                    if (key == 'id' || key == 'created_at' || key == 'updated_at' || key == 'user') {
                        continue;
                    }
                    var textField = Ti.UI.createTextField({
                        hintText: key, value: object[key],
                        top: 10 + u, left: 10 + u, right: 10 + u,
                        height: 40 + u,
                        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
                    });
                    content.add(textField);
                    textField.addEventListener('return', submitForm);
                    fields.push(textField);
                }

                content.add(button);
                fields[0].focus();
            }
            else {
                error(e);
            }
        });
    });
    win.open();
};