windowFunctions['Remove Checkin'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);

    var button = Ti.UI.createButton({
        title: 'Are you sure?',
        top: offset + 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    win.add(button);

    var status = Ti.UI.createLabel({
        text: '', textAlign: 'center',
        left: 20 + u, right: 20 + u
    });
    win.add(status);

    button.addEventListener('click', function () {
        button.hide();
        status.text = 'Removing, please wait...';
        Cloud.Checkins.remove({
            checkin_id: evt.id
        }, function (e) {
            if (e.success) {
                status.text = 'Removed!';
            }
            else {
                status.text = '' + (e.error && e.message) || e;
            }
        });
    });

    win.open();
};