var win = Ti.UI.currentWindow;

var makeTable = function() {
	var people = Titanium.Contacts.getAllPeople();
	var rows = [];
	for (var i = 0; i < people.length; i++) {
		rows[i] = Ti.UI.createTableViewRow({
			title:people[i].fullName,
			person:people[i],
			hasChild:true
		});
		rows[i].addEventListener('click', function(e) {
			var display = Ti.UI.createWindow({
				backroundColor:'white',
				title:e.row.person.fullName
			});
		
			var top = 0;
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
				}
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
