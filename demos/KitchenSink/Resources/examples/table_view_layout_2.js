//FIXME: JGH redo


// concepts to demonstrate/test
// 1. use template-level values
// 2. use layout
// 3. override layout and template at row level

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


var template = {
 	selectedBackgroundColor:'#fff',
 	backgroundColor:'#ffffff',
 	rowHeight:100,
 	layout:[
   		{type:'image', left:10, top:5, width:50, height:50, name:'photo'},
   		{type:'text', fontSize:16, fontWeight:'bold', fontFamily:'Arial', left:70, top:2, width:200, height:30, color:'#576996', name:'user'},
   		{type:'text', fontSize:13, fontWeight:'normal', left:70, top:21, height:50,width:200, color: '#222', name:'comment'},
   		{type:'image', right:5, top:35, width:36, height:34, name:'button'},
   		{type:'image', left:70, bottom:5, height:32, width:32, name:'calendar'},
   		{type:'text', left:105, bottom:-3, width:100,height:32, name:'date', color:'#999999', fontSize:13, fontWeight:'normal'}
]};

var data = [
	{welcome:'Click different parts of the row', backgroundColor:'#d4d9e8', selectedBackgroundColor:'#385292', rowHeight:40,  layout:[{name:'welcome', type:'text', fontSize:14, fontWeight:'bold', left:60, top:10, color:'#385292',selectedColor:'#ffffff'}]},
	{photo:'../images/custom_tableview/user.png', user:'Fred Smith',comment:'I just went to the store', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'3 hours ago', title:'Fred Smith'},
	{photo:'../images/custom_tableview/user.png', user:'Lucy Smith',comment:'I just hired a PI to follow Fred, then off to the store', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'4 hours ago', title:'Lucy Smith'},
	{photo:'../images/custom_tableview/user.png', user:'Don Corelone',comment:'Got some fresh fruit, conducted some business, took a nap', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'5 hours ago', title:'Don Corelone'},
	{photo:'../images/custom_tableview/user.png', user:'Joe Bobby',comment:'Ate pizza.  Found a dollar.', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'6 hours ago', title:'Joe Bobby'},
	{photo:'../images/custom_tableview/user.png', user:'Don Corelone',comment:'Got some fresh fruit, conducted some business, took a nap', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'7 hours ago', title:'Don Corelone'},
	{photo:'../images/custom_tableview/user.png', user:'Frankie',comment:'Trip over a cord, broke my neck.', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'8 hours ago', title:'Frankie'},
	{photo:'../images/custom_tableview/user.png', user:'Lou Thompson',comment:'Singing in the rain.', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'9 hours ago'},
	{photo:'../images/custom_tableview/user.png', user:'Gary Coleman',comment:'Whatchou talkin bout Willis?', button:'../images/custom_tableview/commentButton.png', calendar:'../images/custom_tableview/eventsButton.png', date:'10 hours ago'},
	{photo:'../images/custom_tableview/user.png', user:'Willis',comment:'Hey Gary - shut your piehole.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Fred Smith',comment:'I just went to the store', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Lucy Smith',comment:'I just hired a PI to follow Fred, then off to the store', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Don Corelone',comment:'Got some fresh fruit, conducted some business, took a nap', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Joe Bobby',comment:'Ate pizza.  Found a dollar.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Don Corelone',comment:'Got some fresh fruit, conducted some business, took a nap', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Frankie',comment:'Trip over a cord, broke my neck.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Lou Thompson',comment:'Singing in the rain.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Gary Coleman',comment:'Whatchou talkin bout Willis?', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Willis',comment:'Hey Gary - shut your piehole.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Fred Smith',comment:'I just went to the store', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Lucy Smith',comment:'I just hired a PI to follow Fred, then off to the store', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Don Corelone',comment:'Got some fresh fruit, conducted some business, took a nap', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Joe Bobby',comment:'Ate pizza.  Found a dollar.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Don Corelone',comment:'Got some fresh fruit, conducted some business, took a nap', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Frankie',comment:'Trip over a cord, broke my neck.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Lou Thompson',comment:'Singing in the rain.', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Gary Coleman',comment:'Whatchou talkin bout Willis?', button:'../images/custom_tableview/commentButton.png'},
	{photo:'../images/custom_tableview/user.png', user:'Willis',comment:'Hey Gary - shut your piehole.', button:'../images/custom_tableview/commentButton.png'},

];

var currentSelectedData = null;
var currentSelectedRow = null;
//
// create table view (
//
var tableView = Titanium.UI.createTableView({
	template:template,
	data:data,
	search:search,
	filterAttribute:'user'
});

tableView.addEventListener('click', function(eventObject)
{
	var title = eventObject.rowData.title;

	// see if we are in search mode
	if (eventObject.searchMode==true)
	{
		search.blur();
		Titanium.UI.createAlertDialog({
			title:'Search Results',
			message:'You clicked ' + title
		}).show();
	}
	// row data
	var rowData = eventObject.rowData;

	// section index
	var section = eventObject.section;

	// row index clicked within section
	var row = eventObject.row;

	// index of row clicked
	var index = eventObject.index;

	// was hasDetail button clicked
	var detail = eventObject.detail;

	// layout object that was clicked
	var name = eventObject.layoutName;

	Titanium.API.debug('the name was: '+name);

	if (name && name != 'message')
	{
		// create new row layout
		var data = {
				backgroundColor:'#385292',
				selectedBackgroundColor:'#385292',
				message:'You clicked the '+name,
				layout:[{
					name:'message',
					type:'text',
					color:'#fff',
					fontWeight:'bold',
					fontSize:20,
					top:35,
					height:30,
					left:50
				}]
			};

			// if we have an selected row, then reset
			if (currentSelectedRow !=null)
			{
				tableView.updateRow(currentSelectedRow,currentSelectedData,{
					animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT
				});
			}
			// update our row
			tableView.updateRow(index,data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
			currentSelectedData = rowData;
			currentSelectedRow = index;

	}
	else if (name == 'message')
	{
		// if you clicked on the updated row, reset it back to its original value
		tableView.updateRow(index,currentSelectedData,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT});
		currentSelectedRow = null;
		currentSelectedData = null;
	}
	
});


win.add(tableView);

