windowFunctions['Show Review'] = function (evt) {
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

    Cloud.Reviews.show({
        user_id: evt.user_id,
        review_id: evt.review_id
    }, function (e) {
        content.remove(status);

        var update = Ti.UI.createButton({
            title: 'Update Review',
            top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
            height: 40 + u
        });
        update.addEventListener('click', function () {
            handleOpenWindow({ target: 'Update Review', user_id: evt.user_id, review_id: evt.review_id });
        });
        content.add(update);

        var remove = Ti.UI.createButton({
            title: 'Remove Review',
            top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
            height: 40 + u
        });
        remove.addEventListener('click', function () {
            handleOpenWindow({ target: 'Remove Review', user_id: evt.user_id, review_id: evt.review_id });
        });
        content.add(remove);

        if (e.success) {
            enumerateProperties(content, e.reviews[0], 20);
        }
        else {
            error(e);
        }
    });

    win.open();
};