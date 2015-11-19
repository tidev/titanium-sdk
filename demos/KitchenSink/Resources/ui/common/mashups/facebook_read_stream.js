function facebook_read_stream(value) {
	var fb = require('facebook');

	var win = Ti.UI.createWindow({
		title : 'Read Stream',
		backgroundColor : '#fff',
		fullscreen : false
	});

	var b1 = Ti.UI.createButton({
		title : 'Read User\'s Groups',
		width : 260,
		height : 80,
		top : 10
	});
	win.add(b1);

	var tableView = Ti.UI.createTableView({
		top : 100,
		minRowHeight : 100
	});
	win.add(tableView);

	function runQuery() {
		b1.title = 'Loading...';

		fb.requestWithGraphPath('me/groups', {}, 'GET', function(r) {
			if (!r.success) {
				if (r.error) {
					alert(r.error);
				} else {
					alert("call was unsuccessful");
				}
				return;
			}
			var result;

			result = JSON.parse(r.result).data;

			var data = [];
			for (var c = 0; c < result.length; c++) {

				var row = result[c];

				var tvRow = Ti.UI.createTableViewRow({
					height : Ti.UI.SIZE,
					backgroundSelectedColor : '#fff',
					backgroundColor : '#fff'
				});

				var userLabel = Ti.UI.createLabel({
					font : {
						fontSize : 16,
						fontWeight : 'bold'
					},
					left : 5,
					top : 5,
					right : 5,
					color : '#576996',
					text : row.name
				});
				tvRow.add(userLabel);
				data[c] = tvRow;
				tvRow.uid = row.id;
			}
			tableView.setData(data, {
				animationStyle : Titanium.UI.iPhone.RowAnimationStyle.DOWN
			});
			b1.title = 'Read User\'s Groups';
		});
	}


	b1.addEventListener('click', function() {
		if (!fb.loggedIn) {
			Ti.UI.createAlertDialog({
				title : 'Facebook',
				message : 'Login before running query'
			}).show();
			return;
		}

		if (fb.permissions.indexOf('user_managed_groups') < 0) {
			fb.requestNewReadPermissions(['user_managed_groups'], function(e) {
				if (!e.success) {
					Ti.API.debug('Failed authorization due to: ' + e.error);
				} else {
					runQuery();
				}
			});
		} else {
			runQuery();
		}
	});

	if (Ti.Platform.osname == 'android') {
		win.fbProxy = fb.createActivityWorker({
			lifecycleContainer : win
		});
	}

	return win;
};

module.exports = facebook_read_stream; 