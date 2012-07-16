windowFunctions['Show Photo Collection'] = function (evt) {
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

    Cloud.PhotoCollections.show({
        collection_id: evt.id
    }, function (e) {
        content.remove(status);

        if (e.success) {

            var collection = e.collections[0];

            if (collection.counts.photos) {
                var showPhotos = Ti.UI.createButton({
                    title: 'Show Photos',
                    top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
                    height: 40 + u
                });
                showPhotos.addEventListener('click', function () {
                    handleOpenWindow({ target: 'Show Collection\'s Photos', id: evt.id });
                });
                content.add(showPhotos);
            }
            if (collection.counts.subcollections) {
                var showSubcollections = Ti.UI.createButton({
                    title: 'Show Subcollections',
                    top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
                    height: 40 + u
                });
                showSubcollections.addEventListener('click', function () {
                    handleOpenWindow({ target: 'Show Subcollections', id: evt.id });
                });
                content.add(showSubcollections);
            }

            var update = Ti.UI.createButton({
                title: 'Update',
                top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
                height: 40 + u
            });
            update.addEventListener('click', function () {
                handleOpenWindow({ target: 'Update Photo Collection', id: evt.id });
            });
            content.add(update);

            var remove = Ti.UI.createButton({
                title: 'Remove',
                top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
                height: 40 + u
            });
            remove.addEventListener('click', function () {
                handleOpenWindow({ target: 'Remove Photo Collection', id: evt.id });
            });
            content.add(remove);

            enumerateProperties(content, collection, 20);
        }
        else {
            error(e);
        }
    });

    win.open();
};