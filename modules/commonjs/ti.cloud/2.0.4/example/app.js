/*
 * We'll follow a really simple paradigm in this example app. It's going to be a hierarchy of tables where you can drill
 * in to individual examples for each ACS namespace.
 *
 * To facilitate that, we will have a collection of "windowFunctions" like the "Users" window, and the "Login" window.
 *
 * These are defined in the "windows" folder and its children.
 *
 * That's it! Enjoy.
 */
var Cloud = require('ti.cloud');
Cloud.debug = true;

// Define our window store.
var windowFunctions = {};
function handleOpenWindow(evt) {
    var target = (evt.row && evt.row.title) || evt.target;
    if (windowFunctions[target]) {
        windowFunctions[target](evt);
    }
}

// Utility functions for defining windows.
var u = Ti.Android != undefined ? 'dp' : 0;
function createWindow() {
    return Ti.UI.createWindow({
        backgroundColor: '#fff',
        navBarHidden: true
    });
}
function addBackButton(win) {
    if (Ti.Android) {
        return 0;
    }
    var back = Ti.UI.createButton({
        title: 'Back',
        color: '#fff', backgroundColor: '#000',
        style: 0,
        top: 0, left: 0, right: 0,
        height: 40 + u
    });
    back.addEventListener('click', function (evt) {
        win.close();
    });
    win.add(back);
    return 40;
}
function createRows(rows) {
    for (var i = 0, l = rows.length; i < l; i++) {
        rows[i] = Ti.UI.createTableViewRow({
            backgroundColor: '#fff',
            title: rows[i],
            hasChild: true
        });
    }
    return rows;
}

function enumerateProperties(container, obj, offset) {
    for (var key in obj) {
        if (!obj.hasOwnProperty(key))
            continue;
        container.add(Ti.UI.createLabel({
            text: key + ': ' + obj[key], textAlign: 'left',
            color: '#000', backgroundColor: '#fff',
            height: 30 + u, left: offset, right: 20 + u
        }));
        if (obj[key].indexOf && obj[key].indexOf('http') >= 0 
            && (obj[key].indexOf('.jpeg') > 0 || obj[key].indexOf('.jpg') > 0 || obj[key].indexOf('.png') > 0)) {
            container.add(Ti.UI.createImageView({
                image: obj[key],
                height: 120 + u, width: 120 + u,
                left: offset
            }));
        }
        if (typeof(obj[key]) == 'object') {
            enumerateProperties(container, obj[key], offset + 20);
        }
    }
}

function error(e) {
    alert((e.error && e.message) || JSON.stringify(e));
}

// Include the window hierarchy.
Ti.include(
    'windows/chats/table.js',
    'windows/checkins/table.js',
    'windows/clients/table.js',
    'windows/customObjects/table.js',
    'windows/emails/table.js',
    'windows/photoCollections/table.js',
    'windows/photos/table.js',
    'windows/places/table.js',
    'windows/posts/table.js',
    'windows/keyValues/table.js',
    'windows/pushNotifications/table.js',
    'windows/reviews/table.js',
    'windows/social/table.js',
    'windows/status/table.js',
    'windows/users/table.js'
);

// Define our main window.
var win = Ti.UI.createWindow({
    backgroundColor: '#fff',
    navBarHidden: true,
    exitOnClose: true
});
var table = Ti.UI.createTableView({
    backgroundColor: '#fff',
    data: createRows([
        'Users',
        'Chats',
        'Checkins',
        'Clients',
        'Custom Objects',
        'Emails',
        'Key Values',
        'Photo Collections',
        'Photos',
        'Places',
        'Posts',
        'Push Notifications',
        'Reviews',
        'Social',
        'Status'
    ])
});
table.addEventListener('click', handleOpenWindow);
win.add(table);
win.open();