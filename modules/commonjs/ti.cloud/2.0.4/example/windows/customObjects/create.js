windowFunctions['Create Object'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var fields = [];

    var classname = Ti.UI.createTextField({
        hintText: 'Class Name',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    });
    content.add(classname);

    function doCreateNewProperty() {
        if (!newProperty.value) {
            alert('Please fill in the "New Property Key" text field!');
            newProperty.focus();
            return;
        }
        var textField = Ti.UI.createTextField({
            hintText: newProperty.value,
            top: 10 + u, left: 10 + u, right: 10 + u,
            height: 40 + u,
            borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
        });
        newProperty.value = '';
        content.remove(button);
        content.add(textField);
        textField.addEventListener('return', submitForm);
        fields.push(textField);
        content.add(button);
    }

    var newProperty = Ti.UI.createTextField({
        hintText: 'New Property Key',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    });
    newProperty.addEventListener('return', doCreateNewProperty);
    content.add(newProperty);
    var createNewProperty = Ti.UI.createButton({
        title: 'Add New Property',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    createNewProperty.addEventListener('click', doCreateNewProperty);
    content.add(createNewProperty);

    var button = Ti.UI.createButton({
        title: 'Create',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    content.add(button);

    function submitForm() {
        if (!classname.value) {
            alert('Please enter a class name!');
            classname.focus();
            return;
        }
        if (!fields.length) {
            alert('Please create at least one field!');
            newProperty.focus();
            return;
        }
        var data = {
            classname: classname.value,
            fields: {}
        };
        for (var i = 0; i < fields.length; i++) {
            data.fields[fields[i].hintText] = fields[i].value;
            fields[i].blur();
        }
        button.hide();

        Cloud.Objects.create(data, function (e) {
            if (e.success) {
                alert('Created!');
                for (var i = 0; i < fields.length; i++) {
                    fields[i].value = '';
                }
            }
            else {
                error(e);
            }
            button.show();
        });
    }

    classname.addEventListener('return', submitForm);
    button.addEventListener('click', submitForm);

    win.addEventListener('open', function () {
        classname.focus();
    });
    win.open();
};