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
	tableView.scrollToIndex(40,{animated:true,position:Ti.UI.iPhone.TableViewScrollPosition.TOP})
});

// create update row (used when the user clicks on the row)
var updateRow = Ti.UI.createTableViewRow();
updateRow.backgroundColor = '#13386c';
updateRow.selectedBackgroundColor = '#13386c';

// add custom property to identify this row
updateRow.isUpdateRow = true;
var updateRowText = Ti.UI.createLabel({
	color:'#fff',
	font:{fontSize:20, fontWeight:'bold'},
	text:'You clicked on...',
	width:'auto',
	height:'auto'
});
updateRow.add(updateRowText);

// create a var to track the active row
var currentRow = null;
var currentRowIndex = null;

// create the rest of the rows
for (var c=1;c<50;c++)
{
	var row = Ti.UI.createTableViewRow();
	row.selectedBackgroundColor = '#fff';
	row.height  =100;
	row.className = 'datarow';

	
	var photo = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/user.png',
		top:5,
		left:10,
		width:50,
		height:50
	});
	photo.addEventListener('click', function(e)
	{
		Ti.API.info('photo click ' + e.source.rowNum + ' new row ' + updateRow);

		// use rowNum property on object to get row number
		var rowNum = e.source.rowNum;
		updateRowText.text = 'You clicked on the photo';
		//TODO: FIX UPDATE ROW
		//tableView.updateRow(rowNum,updateRow,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});	
		
	});
	photo.rowNum = c;
	row.add(photo);
	
	
	var user = Ti.UI.createLabel({
		color:'#576996',
		font:{fontSize:16,fontWeight:'bold', fontFamily:'Arial'},
		left:70,
		top:2,
		height:30,
		width:200,
		text:'Fred Smith '+c
	});
	user.addEventListener('click', function(e)
	{
		// use rowNum property on object to get row number
		var rowNum = e.source.rowNum;
		updateRowText.text = 'You clicked on the user';
		// TODO: FIX UPDATE ROW
		//tableView.updateRow(rowNum,updateRow,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});				
	});
	
	row.filter = user.text;
	
	user.rowNum = c;
	row.add(user);

	var comment = Ti.UI.createLabel({
		color:'#222',
		font:{fontSize:16,fontWeight:'normal', fontFamily:'Arial'},
		left:70,
		top:21,
		height:50,
		width:200,
		text:'Got some fresh fruit, conducted some business, took a nap'
	});
	comment.addEventListener('click', function(e)
	{
		// use rowNum property on object to get row number
		var rowNum = e.source.rowNum;
		updateRowText.text = 'You clicked on the comment';
		
		// TODO: FIX UPDATE ROW
		//tableView.updateRow(rowNum,updateRow,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});				
	});
	
	comment.rowNum = c;
	row.add(comment);

	var calendar = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/eventsButton.png',
		bottom:2,
		left:70,
		width:32,
		height:32
	});
	calendar.addEventListener('click', function(e)
	{
		// use rowNum property on object to get row number
		var rowNum = e.source.rowNum;
		updateRowText.text = 'You clicked on the calendar';

		// TODO: FIX UPDATE ROW
		//tableView.updateRow(rowNum,updateRow,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});				
	});
	
	calendar.rowNum = c;
	row.add(calendar);

	var button = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/commentButton.png',
		top:35,
		right:5,
		width:36,
		height:34
	});
	button.addEventListener('click', function(e)
	{
		// use rowNum property on object to get row number
		var rowNum = e.source.rowNum;
		updateRowText.text = 'You clicked on the comment button';

		// TODO: FIX UPDATE ROW
		//tableView.updateRow(rowNum,updateRow,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});				
	});

	button.rowNum = c;
	row.add(button);
	
	var date = Ti.UI.createLabel({
		color:'#999',
		font:{fontSize:13,fontWeight:'normal', fontFamily:'Arial'},
		left:105,
		bottom:5,
		height:20,
		width:100,
		text:'posted on 3/11'
	});
	date.addEventListener('click', function(e)
	{
		// use rowNum property on object to get row number
		var rowNum = e.source.rowNum;
		updateRowText.text = 'You clicked on the date text';

		// TODO: FIX UPDATE ROW
		//tableView.updateRow(rowNum,updateRow,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});				
	});
	
	date.rowNum = c;
	row.add(date);
	
    data.push(row);
}


//
// create table view (
//
tableView = Titanium.UI.createTableView({
	data:data,
	search:search,
	filterAttribute:'filter'
});

tableView.addEventListener('click', function(e)
{
	if (currentRow != null && e.row.isUpdateRow == false)
	{
		//TODO: FIX UPDATE ROW
		//tableView.updateRow(currentRowIndex, currentRow, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.RIGHT});
	}
	currentRow = e.row;
	currentRowIndex = e.index;
	
})


win.add(tableView);


