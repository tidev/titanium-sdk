//
// test case submitted by Kosso (da man)
// please visit his work at http://phreadz.com
//

// create table view data object
var data = [];

// Kosso:
// to test remote images of verying size and format
var images = [
		'http://i.ytimg.com/vi/CzyilSByWbo/0.jpg',
		'http://i.ytimg.com/vi/ltSyVNO5tvM/0.jpg',
		'http://m.wsj.net/video/20100217/021710atdlynch/021710atdlynch_115x65.jpg',
		'http://philestore1.phreadz.com/_users/2d/04/e4/16/bennycrime/2010/02/19/bennycrime_1266618797_60.jpg',
		'http://philestore1.phreadz.com/_users/30/02/86/06/kosso/2010/02/19/kosso_1266556045_60.jpg',
		'http://farm5.static.flickr.com/4019/4369245306_7e96b9dd39_s.jpg',
		'http://a3.twimg.com/profile_images/294512463/kosso_k2_normal.jpg',
		'http://a1.twimg.com/profile_images/682506508/freakshowicon_normal.jpg',
		'http://www.appcelerator.com/wp-content/themes/appcelerator/img/ipad_image.png',
		'http://www.bytelove.com/images/uploads/Bytelove/Geek/rss%20feed%20me%20-%20photo.jpg'
];

for (var c=0; c<10; c++) 
{
	var row = Ti.UI.createTableViewRow({height:'auto',backgroundColor:'#ffffff',selectedBackgroundColor:'#dddddd'}); 

	var t = '';
	
	if(c==4){
		t = ' this is some more text the should make the row bigger and bigger. this is some more text the should make the row bigger and bigger. Marvellous eh?';
	} 
	

	var post_author = Ti.UI.createLabel({
		text: 'kosso',
		color: '#b40000',
		textAlign:'left',
		left:70,
		top:2,
		height:'auto',
		font:{fontWeight:'bold',fontSize:13}
	});
	row.add(post_author);
	
	
	var post_replies = Ti.UI.createLabel({
		text: '9 replies >',
		color: '#0000b4',
		textAlign:'right',
		left:200,
		width:100,
		top:2,
		font:{fontWeight:'bold',fontSize:13}
	});
	row.add(post_replies);
	
	
	var post_title = Ti.UI.createLabel({
		text: 'Cell at row ' + (c+1) +' '+ t,
		color: '#111',
		textAlign:'left',
		left:70,
		height:'auto',
		top:17,
		font:{fontWeight:'bold',fontSize:16}
	});
	row.add(post_title);
	
	// Kosso:
	// using remote image array
	var i = Ti.UI.createImageView({
		image: images[c],
		top: 5,
		left: 5,
		width:60,
		height:40
	});

	row.add(i);
	
	data[c] = row;
}

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	// event data
	var index = e.index;
	var section = e.section;
	var row = e.row;
	var rowdata = e.rowData;
	//Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

