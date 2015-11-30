function facebook_login_logout(value) {
	var fb = require('facebook');

	var win = Ti.UI.createWindow({
		title : 'Login/Logout',
		backgroundColor : '#fff',
		fullscreen : false
	});

	//
	// Login Status
	//
	var label = Ti.UI.createLabel({
		text : 'Logged In = ' + fb.loggedIn,
		color : '#000',
		font : {
			fontSize : 20
		},
		top : 10,
		textAlign : 'center'
	});
	win.add(label);

	fb.addEventListener('login', function(e) {
		// You *will* get this event if loggedIn == false below
		// Make sure to handle all possible cases of this event
		if (e.success) {
			alert('login from uid: ' + e.uid + ', name: ' + JSON.parse(e.data).name);
			label.text = 'Logged In = ' + fb.loggedIn;
		} else if (e.cancelled) {
			// user cancelled
			alert('cancelled');
		} else {
			alert(e.error);
		}
	});

	fb.addEventListener('logout', function(e) {
		alert('logged out');
		label.text = 'Logged In = ' + fb.loggedIn;
	});

	var loginButton = fb.createLoginButton({
		readPermissions : ['read_stream', 'email'],
		top : 260
	});

	//Android's LoginButton width shouldn't be fixed
	if (Ti.Platform.osname != 'android') {
		loginButton.width = 200;
		loginButton.height = 40;
	}

	loginButton.readPermissions = ['email'];
	win.add(loginButton);

	var loginButton = Ti.UI.createButton({
		title : 'Custom Log in',
		top : 50,
		width : 160,
		height : 40
	});
	win.add(loginButton);

	loginButton.addEventListener('click', function() {
		if (!fb.loggedIn) {
			// then you want to show a login UI
			fb.authorize();
		}
	});

	var logoutButton = Ti.UI.createButton({
		title : 'Custom Logout',
		top : 100,
		width : 160,
		height : 40
	});
	win.add(logoutButton);

	logoutButton.addEventListener('click', function() {
		if (fb.loggedIn) {
			fb.logout();
		}
	});

	var permissionsButton = Ti.UI.createButton({
		title : 'Current Permissions',
		top : 200,
		height : 40
	});
	win.add(permissionsButton);

	permissionsButton.addEventListener('click', function() {
		fb.refreshPermissionsFromServer();
	});

	fb.addEventListener('tokenUpdated', function() {
		var list = fb.getPermissions();
		var text = 'Permissions granted:' + '\n';
		for (var v in list) {
			if (v !== null) {
				text += list[v] + '\n';
			}
		}
		alert(text);
	});

	function updatePublishPerms() {
		if (doPublish.value && fb.loggedIn) {
			fb.requestNewPublishPermissions(['publish_actions'], fb.AUDIENCE_FRIENDS, function(e) {
				if (e.success) {
					alert('request publish permission success');
				} else if (e.cancelled) {
					alert('user cancelled');
				} else {
					Ti.API.debug('Failed authorization due to: ' + e.error);
				}
			});
		} else if (doPublish.value && !fb.loggedIn) {
			alert('Please log in first');
		}
	}

	function publishToggle(title, viewTop) {
		win.add(Ti.UI.createLabel({
			top : viewTop,
			left : 10,
			width : 200,
			text : title,
			height : 40
		}));
		var result = Ti.UI.createSwitch({
			value : false,
			top : viewTop
		});
		win.add(result);
		result.addEventListener('change', updatePublishPerms);
		return result;
	}

	var doPublish = publishToggle('Publish stream', 150);

	if (Ti.Platform.osname == 'android') {
		win.fbProxy = fb.createActivityWorker({
			lifecycleContainer : win
		});
	}

	return win;
};

module.exports = facebook_login_logout; 