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


var data = [];

// create first row
var row = Ti.UI.createTableViewRow();
row.backgroundColor = '#d4d9e8';
row.selectedBackgroundColor = '#385292';
row.height = 40;
var clickLabel = Titanium.UI.createLabel({
	text:'Click different parts of the row',
	color:'#fff',
	font:{fontSize:14}
});
row['class'] = 'header';
row.add(clickLabel);
data.push(row);

// create the rest of the rows
for (var c=0;c<50;c++)
{
	var row = Ti.UI.createTableViewRow();
	row.height  =100;
	row['class'] = 'datarow';
	
	var photo = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/user.png',
		top:5,
		left:10,
		width:50,
		height:50
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
		text:'Fred Smith'
	});
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
	comment.rowNum = c;
	row.add(comment);

	var calendar = Ti.UI.createView({
		backgroundImage:'../images/custom_tableview/eventsButton.png',
		bottom:5,
		left:70,
		width:32,
		height:32
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
	date.rowNum = c;
	row.add(date);
	
    data.push(row);
}


var currentSelectedData = null;
var currentSelectedRow = null;
//
// create table view (
//
var tableView = Titanium.UI.createTableView({
	data:data,
	rowHeight:100,
	search:search
});

// tableView.addEventListener('click', function(eventObject)
// {
// 	var title = eventObject.rowData.title;
// 
// 	// see if we are in search mode
// 	if (eventObject.searchMode==true)
// 	{
// 		search.blur();
// 		Titanium.UI.createAlertDialog({
// 			title:'Search Results',
// 			message:'You clicked ' + title
// 		}).show();
// 	}
// 	// row data
// 	var rowData = eventObject.rowData;
// 
// 	// section index
// 	var section = eventObject.section;
// 
// 	// row index clicked within section
// 	var row = eventObject.row;
// 
// 	// index of row clicked
// 	var index = eventObject.index;
// 
// 	// was hasDetail button clicked
// 	var detail = eventObject.detail;
// 
// 	// layout object that was clicked
// 	var name = eventObject.layoutName;
// 
// 	Titanium.API.debug('the name was: '+name);
// 
// 	if (name && name != 'message')
// 	{
// 		// create new row layout
// 		var data = {
// 				backgroundColor:'#385292',
// 				selectedBackgroundColor:'#385292',
// 				message:'You clicked the '+name,
// 				layout:[{
// 					name:'message',
// 					type:'text',
// 					color:'#fff',
// 					fontWeight:'bold',
// 					fontSize:20,
// 					top:35,
// 					height:30,
// 					left:50
// 				}]
// 			};
// 
// 			// if we have an selected row, then reset
// 			if (currentSelectedRow !=null)
// 			{
// 				tableView.updateRow(currentSelectedRow,currentSelectedData,{
// 					animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT
// 				});
// 			}
// 			// update our row
// 			tableView.updateRow(index,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
// 			currentSelectedData = rowData;
// 			currentSelectedRow = index;
// 
// 	}
// 	else if (name == 'message')
// 	{
// 		// if you clicked on the updated row, reset it back to its original value
// 		tableView.updateRow(index,currentSelectedData,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
// 		currentSelectedRow = null;
// 		currentSelectedData = null;
// 	}
// 	
// });


win.add(tableView);

