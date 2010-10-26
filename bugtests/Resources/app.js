var tickets = {
	2132:"Vertical layout broken with auto for height",
	}


var ticketNames = [];
for (var key in tickets)
{
	ticketNames.push(key);
	Ti.API.debug('Pushing '+key);
}
ticketNames.sort();

var rows = [];
for (var keyIndex in ticketNames)
{
	var key = ticketNames[keyIndex];
	var row = Ti.UI.createTableViewRow({
		title:'Ticket '+key+' : '+tickets[key],
		jsfile:'tickets/'+key+'.js',
	});
	rows.push(row)
}

var search = Titanium.UI.createSearchBar({
	barColor:'red', 
	showCancel:false
});
search.addEventListener('change', function(e)
{
   e.value // search string as user types
});
search.addEventListener('return', function(e)
{
   search.blur();
});
search.addEventListener('cancel', function(e)
{
   search.blur();
});

tableView = Titanium.UI.createTableView({
	data:rows,
	search:search,
	backgroundColor:'white'
});

tableView.addEventListener('click', function(e)
{
	Ti.API.info('Opening ticket ' + e.source.title);
	var newWin = Ti.UI.createWindow({url:e.source.jsfile});
	newWin.open();
});

var win = Ti.UI.createWindow();
win.add(tableView);
win.open();