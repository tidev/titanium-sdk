var win = Ti.UI.currentWindow;
var android = (Ti.Platform.osname === 'android');

// getting all from Android is very slow...
var activityIndicator;
if (android) {
	activityIndicator = Ti.UI.createActivityIndicator({
		message: 'Loading all contacts, please wait...'
	});
	activityIndicator.show();
}

var makeTable = function() {
	var people = Titanium.Contacts.getAllPeople();
	var rows = [];
	for (var i = 0; i < people.length; i++) {
		var title = people[i].fullName;
		if (!title || title.length == 0) {
			title = "(no name)";
		}
		rows[i] = Ti.UI.createTableViewRow({
			title: title,
			person:people[i],
			hasChild:true
		});
		rows[i].addEventListener('click', function(e) {
			var display = Ti.UI.createWindow({
				backroundColor:'white',
				title:e.row.person.fullName
			});
		
			var top = 0;
			var showedSomething = false;
			for (var label in e.row.person.address) {
				top += 20;
				var addrs = e.row.person.address[label];
				for (var i = 0; i < addrs.length; i++) {
					var info = Ti.UI.createLabel({
						text:'('+label+') '+addrs[i].Street,
						top:top,
						left:20,
						height:'auto',
						width:'auto',
					});
					display.add(info);
					showedSomething = true;
				}
			}
			if (!showedSomething){
				display.add(Ti.UI.createLabel({text: 'No addresses to show'}));
			}
			
			Titanium.UI.currentTab.open(display,{animated:true});
		});
	}
	return rows;
}

var tableview = Ti.UI.createTableView({
	data:makeTable()
});

win.add(tableview);
if (android && activityIndicator) {activityIndicator.hide();}
