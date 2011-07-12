var win = Titanium.UI.currentWindow;
win.barColor = '#385292';

//
// CREATE SEARCH BAR
//
var search = Titanium.UI.createSearchBar({
	barColor:'#385292',
	showCancel:false
});
search.addEventListener('change', function(e)
{
	e.value; // search string as user types
});
search.addEventListener('return', function(e)
{
	search.blur();
});
search.addEventListener('cancel', function(e)
{
	search.blur();
});

var tableView;
var data = [];

// create first row
var row = Ti.UI.createTableViewRow();
row.backgroundColor = '#576996';
row.selectedBackgroundColor = '#385292';
row.height = 40;
var clickLabel = Titanium.UI.createLabel({
	text:'Click different parts of the row',
	color:'#fff',
	textAlign:'center',
	font:{fontSize:14},
	width:'auto',
	height:'auto'
});
row.className = 'header';
row.add(clickLabel);
data.push(row);

// when you click the header, scroll to the bottom
row.addEventListener('click',function()
{
	tableView.scrollToIndex(40,{animated:true,position:Ti.UI.iPhone.TableViewScrollPosition.TOP});
});

// create update row (used when the user clicks on the row)
function createUpdateRow(text)
{
	var updateRow = Ti.UI.createTableViewRow();
	updateRow.backgroundColor = '#13386c';
	updateRow.selectedBackgroundColor = '#13386c';

	// add custom property to identify this row
	updateRow.isUpdateRow = true;
	var updateRowText = Ti.UI.createLabel({
		color:'#fff',
		font:{fontSize:20, fontWeight:'bold'},
		text:text,
		width:'auto',
		height:'auto'
	});
	updateRow.className = 'updated_row';
	updateRow.add(updateRowText);
	return updateRow;
}
// create a var to track the active row
var currentRow = null;
var currentRowIndex = null;

// create the rest of the rows
for (var c=1;c<50;c++)
{
	var row = Ti.UI.createTableViewRow();
	row.selectedBackgroundColor = '#fff';
	row.height = 100;
	row.className = 'datarow';
	row.clickName = 'row';

	var photo = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/user.png',
		top:5,
		left:10,
		width:50,
		height:50,
		clickName:'photo'
	});
	row.add(photo);


	var user = Ti.UI.createLabel({
		color:'#576996',
		font:{fontSize:16,fontWeight:'bold', fontFamily:'Arial'},
		left:70,
		top:2,
		height:30,
		width:200,
		clickName:'user',
		text:'Fred Smith '+c
	});

	row.filter = user.text;
	row.add(user);

	var fontSize = 16;
	if (Titanium.Platform.name == 'android') {
		fontSize = 14;
	}
	var comment = Ti.UI.createLabel({
		color:'#222',
		font:{fontSize:fontSize,fontWeight:'normal', fontFamily:'Arial'},
		left:70,
		top:21,
		height:50,
		width:200,
		clickName:'comment',
		text:'Got some fresh fruit, conducted some business, took a nap'
	});
	row.add(comment);

	var calendar = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/eventsButton.png',
		bottom:2,
		left:70,
		width:32,
		clickName:'calendar',
		height:32
	});
	row.add(calendar);

	var button = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/commentButton.png',
		top:35,
		right:5,
		width:36,
		clickName:'button',
		height:34
	});
	row.add(button);

	var date = Ti.UI.createLabel({
		color:'#999',
		font:{fontSize:13,fontWeight:'normal', fontFamily:'Arial'},
		left:105,
		bottom:5,
		height:20,
		width:100,
		clickName:'date',
		text:'posted on 3/11'
	});
	row.add(date);

	data.push(row);
}


//
// create table view (
//
tableView = Titanium.UI.createTableView({
	data:data,
	search:search,
	filterAttribute:'filter',
	backgroundColor:'white'
});

tableView.addEventListener('click', function(e)
{
	Ti.API.info('table view row clicked - source ' + e.source);
	// use rowNum property on object to get row number
	var rowNum = e.index;
	var updateRow = createUpdateRow('You clicked on the '+e.source.clickName);
	tableView.updateRow(rowNum,updateRow,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
});

win.add(tableView);

