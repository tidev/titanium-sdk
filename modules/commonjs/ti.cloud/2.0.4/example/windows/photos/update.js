windowFunctions['Update Photo'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var replacement;

    if (Ti.Media.openPhotoGallery) {
        var selectPhoto = Ti.UI.createButton({
            title: 'Select Photo from Gallery',
            top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
            height: 40 + u
        });
        selectPhoto.addEventListener('click', function (evt) {
            Ti.Media.openPhotoGallery({
                success: function (e) {
                    replacement = e.media;
                }
            });
        });
        content.add(selectPhoto);
    }
    if (Ti.Media.showCamera) {
        var takePhoto = Ti.UI.createButton({
            title: 'Take Photo with Camera',
            top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
            height: 40 + u
        });
        takePhoto.addEventListener('click', function (evt) {
            Ti.Media.showCamera({
                success: function (e) {
                    replacement = e.media;
                }
            });
        });
        content.add(takePhoto);
    }

    var collectionID;
    var chooseCollection = Ti.UI.createButton({
        title: 'Choose Collection',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    chooseCollection.addEventListener('click', function (evt) {
        var table = Ti.UI.createTableView({
            backgroundColor: '#fff',
            data: [
                { title: 'Loading, please wait...' }
            ]
        });
        table.addEventListener('click', function (evt) {
            collectionID = evt.row.id;
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
                            hasCheck: !collectionID
                        }));
                        for (var i = 0, l = e.collections.length; i < l; i++) {
                            data.push(Ti.UI.createTableViewRow({
                                title: e.collections[i].name,
                                id: e.collections[i].id,
                                hasCheck: collectionID == e.collections[i].id
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

    var tags = Ti.UI.createTextField({
        hintText: 'Tags (csv)',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    });
    content.add(tags);

    var button = Ti.UI.createButton({
        title: 'Update',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    content.add(button);

    if (Ti.UI.createProgressBar) {
        var uploadProgress = Ti.UI.createProgressBar({
            top: 10 + u, right: 10 + u, left: 10 + u,
            max: 1, min: 0, value: 0,
            height: 25 + u
        });
        content.add(uploadProgress);
        uploadProgress.show();
    }

    var fields = [ tags ];

    function submitForm() {
        for (var i = 0; i < fields.length; i++) {
            if (!fields[i].value.length) {
                fields[i].focus();
                return;
            }
            fields[i].blur();
        }
        button.hide();

        if (replacement && Ti.UI.createProgressBar) {
            Cloud.onsendstream = function (evt) {
                uploadProgress.value = evt.progress * 0.5;
            };
            Cloud.ondatastream = function (evt) {
                uploadProgress.value = (evt.progress * 0.5) + 0.5;
            };
        }
        Cloud.Photos.update({
            photo_id: evt.id,
            photo: replacement,
            tags: tags.value
        }, function (e) {
            if (replacement) {
                Cloud.onsendstream = Cloud.ondatastream = null;
            }
            if (e.success) {
                replacement = null;
                alert('Updated!');
            }
            else {
                error(e);
            }
            button.show();
        });
    }

    button.addEventListener('click', submitForm);
    for (var i = 0; i < fields.length; i++) {
        fields[i].addEventListener('return', submitForm);
    }

    var status = Ti.UI.createLabel({
        text: 'Loading, please wait...', textAlign: 'center',
        top: offset + u, right: 0, bottom: 0, left: 0,
        backgroundColor: '#fff', zIndex: 2
    });
    win.add(status);

    win.addEventListener('open', function () {
        Cloud.Photos.show({
            photo_id: evt.id
        }, function (e) {
            status.hide();
            if (e.success) {
                var photo = e.photos[0];
                collectionID = photo.collection_id;
                tags.value = photo.tags && photo.tags.join(',');
                tags.focus();
            }
            else {
                error(e);
            }
        });
    });
    win.open();
};