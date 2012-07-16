windowFunctions['Create User'] = function (evt) {
    var win = createWindow();
    var offset = addBackButton(win);
    var content = Ti.UI.createScrollView({
        top: offset + u,
        contentHeight: 'auto',
        layout: 'vertical'
    });
    win.add(content);

    var username = Ti.UI.createTextField({
        hintText: 'Username',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        autocapitalization: Ti.UI.TEXT_AUTOCAPITALIZATION_NONE,
        autocorrect: false
    });
    content.add(username);

    var password = Ti.UI.createTextField({
        hintText: 'Password',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        passwordMask: true
    });
    content.add(password);

    var confirmPassword = Ti.UI.createTextField({
        hintText: 'Confirm Password',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED,
        passwordMask: true
    });
    content.add(confirmPassword);

    var firstName = Ti.UI.createTextField({
        hintText: 'First Name',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    content.add(firstName);

    var lastName = Ti.UI.createTextField({
        hintText: 'Last Name',
        top: 10 + u, left: 10 + u, right: 10 + u,
        height: 40 + u,
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
    });
    content.add(lastName);

    var button = Ti.UI.createButton({
        title: 'Create',
        top: 10 + u, left: 10 + u, right: 10 + u, bottom: 10 + u,
        height: 40 + u
    });
    content.add(button);

    var fields = [ username, password, confirmPassword, firstName, lastName ];

    function submitForm() {
        for (var i = 0; i < fields.length; i++) {
            if (!fields[i].value.length) {
                fields[i].focus();
                return;
            }
            fields[i].blur();
        }
        if (password.value != confirmPassword.value) {
            alert('Passwords do not match!');
            confirmPassword.focus();
            return;
        }
        button.hide();

        Cloud.Users.create({
            username: username.value,
            password: password.value,
            password_confirmation: confirmPassword.value,
            first_name: firstName.value,
            last_name: lastName.value
        }, function (e) {
            if (e.success) {
                var user = e.users[0];
                alert('Created! You are now logged in as ' + user.id);
                username.value = password.value = confirmPassword.value = firstName.value = lastName.value = '';
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

    win.addEventListener('open', function () {
        username.focus();
    });
    win.open();
};