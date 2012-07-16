var win = Ti.UI.createWindow({
    layout: 'vertical',
    backgroundColor: 'white'
});

var CloudPush = require('ti.cloudpush');
CloudPush.addEventListener('callback', function (evt) {
    alert(evt.payload);
});
CloudPush.addEventListener('trayClickLaunchedApp', function (evt) {
    Ti.API.info('Tray Click Launched App (app was not running)');
});
CloudPush.addEventListener('trayClickFocusedApp', function (evt) {
    Ti.API.info('Tray Click Focused App (app was already running)');
});

CloudPush.retrieveDeviceToken({
    success: deviceTokenSuccess,
    error: deviceTokenError
});

function deviceTokenSuccess(e) {
    Ti.API.info('Device Token: ' + e.deviceToken);
}

function deviceTokenError(e) {
    alert('Failed to register for push! ' + e.error);
}

/*
 Push can be enabled or disabled.
 */
var enablePush = Ti.UI.createButton({
    top: '10dp', width: '320dp', height: '40dp'
});
enablePush.addEventListener('click', function () {
    enablePush.title = CloudPush.enabled ? 'Disabling...' : 'Enabling...';
    CloudPush.enabled = !CloudPush.enabled;
    // NOTE: Push.enabled takes a moment to update after you change its value.
    setTimeout(syncButtons, 500);
});
win.add(enablePush);

/*
 Whether or not to show a tray notification.
 */
var showTrayNotification = Ti.UI.createButton({
    top: '10dp', width: '320dp', height: '40dp'
});
showTrayNotification.addEventListener('click', function () {
    CloudPush.showTrayNotification = !CloudPush.showTrayNotification;
    syncButtons();
});
win.add(showTrayNotification);

/*
 Whether or not clicking a tray notification focuses the app.
 */
var showAppOnTrayClick = Ti.UI.createButton({
    top: '10dp', width: '320dp', height: '40dp'
});
showAppOnTrayClick.addEventListener('click', function () {
    CloudPush.showAppOnTrayClick = !CloudPush.showAppOnTrayClick;
    syncButtons();
});
win.add(showAppOnTrayClick);

/*
 Whether or not tray notifications are shown when the app is in the foreground.
 */
var showTrayNotificationsWhenFocused = Ti.UI.createButton({
    top: '10dp', width: '320dp', height: '40dp'
});
showTrayNotificationsWhenFocused.addEventListener('click', function () {
    CloudPush.showTrayNotificationsWhenFocused = !CloudPush.showTrayNotificationsWhenFocused;
    syncButtons();
});
win.add(showTrayNotificationsWhenFocused);

/*
 Whether or not receiving a push immediately brings the application to the foreground.
 */
var focusAppOnPush = Ti.UI.createButton({
    top: '10dp', width: '320dp', height: '40dp'
});
focusAppOnPush.addEventListener('click', function () {
    CloudPush.focusAppOnPush = !CloudPush.focusAppOnPush;
    syncButtons();
});
win.add(focusAppOnPush);

function syncButtons() {
    enablePush.title = CloudPush.enabled ? 'Push Enabled' : 'Push Disabled';
    showAppOnTrayClick.title = CloudPush.showAppOnTrayClick ? 'Tray Click Shows App' : 'Tray Click Does Nothing';
    showTrayNotification.title = CloudPush.showTrayNotification ? 'Show in Tray' : 'Do Not Show in Tray';
    focusAppOnPush.title = CloudPush.focusAppOnPush ? 'Push Focuses App' : 'Push Doesn\'t Focus App';
    showTrayNotificationsWhenFocused.title = CloudPush.showTrayNotificationsWhenFocused ? 'Show Trays when Focused' : 'Hide Trays when Focused';
}

syncButtons();
win.open();