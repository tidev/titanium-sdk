windowFunctions['Key Values'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var name = Ti.UI.createTextField({
        hintText: 'Name',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    });
    content.add(name);

    var value = Ti.UI.createTextField({
        hintText: 'Value',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    });
    content.add(value);

    var setButton = Ti.UI.createButton({
        title: 'Set',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    setButton.addEventListener('click', function submitForm() {
        Cloud.KeyValues.set({
            name: name.value,
            value: value.value
        }, function (e) {
            if (e.success) {
                alert('Set!');
            }
            else {
                error(e);
            }
        });
    });
    content.add(setButton);

    var getButton = Ti.UI.createButton({
        title: 'Get',
        top: 0, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    getButton.addEventListener('click', function (evt) {
        Cloud.KeyValues.get({
            name: name.value
        }, function (e) {
            if (e.success) {
                value.value = e.keyvalues[0].value;
                alert('Got!');
            }
            else {
                error(e);
            }
        });
    });
    content.add(getButton);

    var appendButton = Ti.UI.createButton({
        title: 'Append',
        top: 0, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    appendButton.addEventListener('click', function (evt) {
        Cloud.KeyValues.append({
            name: name.value,
            value: value.value
        }, function (e) {
            if (e.success) {
                alert('Appended!');
            }
            else {
                error(e);
            }
        });
    });
    content.add(appendButton);

    var incrementButton = Ti.UI.createButton({
        title: 'Increment',
        top: 0, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    incrementButton.addEventListener('click', function (evt) {
        Cloud.KeyValues.increment({
            name: name.value,
            value: parseInt(value.value, 10)
        }, function (e) {
            if (e.success) {
                alert('Incremented!');
            }
            else {
                error(e);
            }
        });
    });
    content.add(incrementButton);

    var removeButton = Ti.UI.createButton({
        title: 'Remove',
        top: 0, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    removeButton.addEventListener('click', function (evt) {
        Cloud.KeyValues.remove({
            name: name.value
        }, function (e) {
            if (e.success) {
                alert('Removed!');
                value.value = '';
            }
            else {
                error(e);
            }
        });
    });
    content.add(removeButton);

    win.addEventListener('open', function () {
        name.focus();
    });
    win.open();
};