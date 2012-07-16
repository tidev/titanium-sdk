windowFunctions['Update Post'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var title = Ti.UI.createTextField({
        hintText: 'Title',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    content.add(title);

    var contentText = Ti.UI.createTextField({
        hintText: 'Content',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    content.add(contentText);

    var button = Ti.UI.createButton({
        title: 'Update',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    content.add(button);

    function submitForm() {
        button.hide();

        Cloud.Posts.update({
            post_id: evt.id,
            title: title.value,
            content: contentText.value
        }, function (e) {
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
    var fields = [ title, contentText ];
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
        Cloud.Posts.show({
            post_id: evt.id
        }, function (e) {
            status.hide();
            if (e.success) {
                var post = e.posts[0];
                title.value = post.title;
                contentText.value = post.content;
                title.focus();
            }
            else {
                error(e);
            }
        });
    });
    win.open();
};