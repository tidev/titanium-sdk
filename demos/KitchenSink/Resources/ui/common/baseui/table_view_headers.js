function tv_headers(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [
		{title:'Alan', hasChild:true, header:'A'},
		{title:'Alice', hasDetail:true},
		{title:'Alexander'},
		{title:'Amos'},
		{title:'Alonzo'},
		{title:'Brad', header:'B'},
		{title:'Brent'},
		{title:'Billy'},
		{title:'Brenda'},
		{title:'Callie', header:'C'},
		{title:'Cassie'},
		{title:'Chris'},
		{title:'Cameron'},
		{title:'Don', header:'D'},
		{title:'Dilbert'},
		{title:'Deacon'},
		{title:'Devin'},
		{title:'Darin'},
		{title:'Darcy'},
		{title:'Erin', header:'E'},
		{title:'Erica'},
		{title:'Elvin'},
		{title:'Edrick'},
		{title:'Frank', header:'F'},
		{title:'Fred'},
		{title:'Fran'},
		{title:'Felicity'},
		{title:'George', header:'G'},
		{title:'Gina'},
		{title:'Gary'},
		{title:'Herbert', header:'H'},
		{title:'Henry'},
		{title:'Harold'},
		{title:'Ignatius', header:'I'},
		{title:'Irving'},
		{title:'Ivan'},
		{title:'Dr. J', header:'J'},
		{title:'Jefferson'},
		{title:'Jenkins'},
		{title:'Judy'},
		{title:'Julie'},
		{title:'Kristy', header:'K'},
		{title:'Krusty the Clown'},
		{title:'Klaus'},
		{title:'Larry', header:'L'},
		{title:'Leon'},
		{title:'Lucy'},
		{title:'Ludwig'},
		{title:'Mary', header:'M'},
		{title:'Mervin'},
		{title:'Malcom'},
		{title:'Mellon'},
		{title:'Ned', header:'N'},
		{title:'Nervous Eddie'},
		{title:'Nelson'},
		{title:'The Big O', header:'O'},
		{title:'Orlando'},
		{title:'Ox'},
		{title:'Pluto', header:'P'},
		{title:'Paris'},
		{title:'Potsie'}
	];
	

	var isTizen = Ti.Platform.osname === 'tizen',
		search;

	// Search bars are not supported in Tizen and MobileWeb
	if (!isTizen) {
		search = Titanium.UI.createSearchBar({
			showCancel:false
		});
		search.addEventListener('blur',function(){
			if(Ti.Platform.name === "android"){
				Ti.API.info('Going to hide soft Keyboard as we are shifting focus away from the SearchBar.');
				Ti.UI.Android.hideSoftKeyboard();
			}
		});
	}

	// create table view
	var tableview = Titanium.UI.createTableView({
		data:data,
		filterAttribute:'title'
	});

	search && (tableview.search = search);
	
	function showClickEventInfo(e, islongclick) {
		// event data
		var index = e.index;
		var section = e.section;
		var row = e.row;
		var rowdata = e.rowData;
		var msg = 'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata;
		if (islongclick) {
			e.section.headerTitle = e.section.headerTitle + ' section has been long-clicked';
			msg = "LONGCLICK " + msg;
		} else {
			e.section.headerTitle = e.section.headerTitle + ' section has been clicked';
		}
		Titanium.UI.createAlertDialog({title:'Table View',message:msg}).show();
	}
	// create table view event listener
	tableview.addEventListener('click', function(e)
	{
		showClickEventInfo(e);
	});
	tableview.addEventListener('longclick', function(e)
	{
		showClickEventInfo(e, true);
	});
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = tv_headers;