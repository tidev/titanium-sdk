windowFunctions['Query Objects'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);

    var classname = Ti.UI.createTextField({
        hintText: 'Class Name',
        top: offset + 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    });
    win.add(classname);

    var button = Ti.UI.createButton({
        title: 'Query',
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

    function submitForm() {
        if (!classname.value.length) {
            classname.focus();
            return;
        }
        classname.blur();
        button.hide();
        win.remove(content);
        content = Ti.UI.createScrollView({
            top: offset + 110 + u,
            contentHeight: 'auto',
            layout: 'vertical'
        });
        win.add(content);
        content.add(status);

        var val = classname.value;
        Cloud.Objects.query({
            classname: val
        }, function (e) {
            content.remove(status);
            button.show();

            if (e.success) {
                var objects = e[val];
                if (!objects.length) {
                    alert('No objects found!');
                }
                else {
                    for (var i = 0; i < objects.length; i++) {
                        (function (i) {
                            var wrapper = Ti.UI.createView({
                                layout: 'vertical', height: 'auto',
                                top: 5 + u, right: 5 + u, bottom: 5 + u, left: 5 + u,
                                borderColor: '#ccc', borderWeight: 1
                            });
                            enumerateProperties(wrapper, objects[i], 20);
                            wrapper.addEventListener('click', function () {
                                handleOpenWindow({ target: 'Update Object', id: objects[i].id, classname: val });
                            });
                            content.add(wrapper);
                        })(i);
                    }
                }
            }
            else {
                error(e);
            }
        });
    }

    button.addEventListener('click', submitForm);
    classname.addEventListener('return', submitForm);

    win.addEventListener('open', function () {
        classname.focus();
    });
    win.open();
};