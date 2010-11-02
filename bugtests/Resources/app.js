var tickets = {
	2132:"Vertical layout broken with auto for height iphone",
	}


var android = [];
var blackberry = [];
var ipad = [];
var iphone = [];
var other = [];

for (var key in tickets)
{
	var isOther = true;
	var lcKey = tickets[key].toLowerCase();
	if(lcKey.match('android'))
	{
		android.push(key);
		isOther = false;
	}
	if(lcKey.match('blackberry'))
	{
		blackberry.push(key);
		isOther = false;
	}
	if(lcKey.match('ipad'))
	{
		ipad.push(key);
		isOther = false;
	}
	if(lcKey.match('iphone'))
	{
		iphone.push(key);
		isOther = false;
	}
	if(isOther)
	{
		other.push(key);
	}
}
android.sort();
blackberry.sort();
ipad.sort();
iphone.sort();
other.sort();

var rows = [];

var generateRows=function(headerTitle,ticketNames){
	for (var keyIndex in ticketNames)
	{
		var key = ticketNames[keyIndex];
		var row = Ti.UI.createTableViewRow({
			title:key+':'+tickets[key],
			jsfile:'tickets/'+key+'.js',
			header:headerTitle,
		});
		rows.push(row)
		headerTitle = undefined;
	}
};

generateRows("Android",android);
generateRows("Blackberry",blackberry);
generateRows("iPad",ipad);
generateRows("iPhone",iphone);
generateRows("other",other);

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
	var newWin = Ti.UI.createWindow({url:e.source.jsfile,backgroundColor:'#9999FF'});

	newWin.closer = function(e){
		var alert = Ti.UI.createAlertDialog({title:'Stop test?',
				message:'Press OK to return to the ticket table.',
				buttonNames:['OK','Cancel'],cancel:1});
		alert.addEventListener('click',function(e){
			if(e.index==0)
			{
				Ti.Gesture.removeEventListener('shake',newWin.closer);
				newWin.close();
			}
		});
		alert.show();
	};
	Ti.Gesture.addEventListener('shake',newWin.closer);
	newWin.open();
});

var win = Ti.UI.createWindow();
win.add(tableView);
win.open();