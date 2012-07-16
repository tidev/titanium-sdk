windowFunctions['External Unlink'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    function unlinkAccount(evt) {
        Cloud.SocialIntegrations.externalAccountUnlink({
            id: evt.source.accountID,
            type: evt.source.accountType
        }, function (e) {
            if (e.success) {
                alert('Unlinked from ' + evt.source.accountType + '!');
                content.remove(evt.source);
            }
            else {
                error(e);
            }
        });
    }

    var status = Ti.UI.createLabel({
        text: 'Loading, please wait...', textAlign: 'center',
        top: offset + u, right: 0, bottom: 0, left: 0,
        backgroundColor: '#fff', zIndex: 2
    });
    win.add(status);

    win.addEventListener('open', function () {
        Cloud.Users.showMe(function (e) {
            status.hide();
            if (e.success) {
                var user = e.users[0];
                for (var i = 0; i < user.external_accounts.length; i++) {
                    var button = Ti.UI.createButton({
                        title: 'Unlink from ' + user.external_accounts[i].external_type,
                        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
                        height: 40 + u,
                        accountType: user.external_accounts[i].external_type,
                        accountID: user.external_accounts[i].external_id
                    });
                    button.addEventListener('click', unlinkAccount);
                    content.add(button);
                }
            }
            else {
                error(e);
            }
        });
    });
    win.open();
};