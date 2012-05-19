windowFunctions['Show Checkin'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var status = Ti.UI.createLabel({
        text: 'Loading, please wait...', textAlign: 'left',
        height: 30 + u, left: 20 + u, right: 20 + u
    });
    content.add(status);

    Cloud.Checkins.show({
        checkin_id: evt.id
    }, function (e) {
        content.remove(status);

        var remove = Ti.UI.createButton({
            title: 'Remove Checkin',
            top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
            height: 40 + u
        });
        remove.addEventListener('click', function () {
            handleOpenWindow({ target: 'Remove Checkin', id: evt.id });
        });
        content.add(remove);

        if (e.success) {
            enumerateProperties(content, e.checkins[0], 20);
        }
        else {
            error(e);
        }
    });

    win.open();
};