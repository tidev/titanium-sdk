windowFunctions['Geolocate Particular'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);

    var ipAddress = Ti.UI.createTextField({
        hintText: 'IP Address',
        top: offset + 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false,
        keyboardType: Ti.UI.KEYBOARD_DECIMAL_PAD
    });
    win.add(ipAddress);

    var button = Ti.UI.createButton({
        title: 'Search',
        top: offset + 60 + u, left: 10 + u, right: 10 + u,
        height: 40 + u
    });
    win.add(button);

    var content = Ti.UI.createScrollView({
        top: offset + 110 + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var status = Ti.UI.createLabel({
        text: 'Loading, please wait...', textAlign: 'left',
        height: 30 + u, left: 20 + u, right: 20 + u
    });

    function lookup() {
        win.remove(content);
        content = Ti.UI.createScrollView({
            top: offset + 110 + u,
            contentHeight: 'auto',
            layout: 'vertical'
        });
        win.add(content);
        content.add(status);
        Cloud.Clients.geolocate({
            ip_address: ipAddress.value
        }, function (e) {
            content.remove(status);
            ipAddress.blur();
            if (e.success) {
                ipAddress.value = '';
                enumerateProperties(content, e, 20);
            }
            else {
                error(e);
            }
        });
    }

    ipAddress.addEventListener('return', lookup);
    button.addEventListener('click', lookup);
    win.addEventListener('open', function (evt) {
        ipAddress.focus();
    });

    win.open();
};