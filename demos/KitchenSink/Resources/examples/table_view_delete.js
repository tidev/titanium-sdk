//FIXME: JGH redo
var win = Titanium.UI.currentWindow;

// simple two element template layout
var template = {
 	selectedBackgroundColor:'#fff',
 	backgroundColor:'#ffffff',
 	rowHeight:100,
 	layout:[
		{
			type:'text', 
			name:'from', 
			font:{fontSize:'16',fontWeight:'bold', fontFamily:'Helvetica Neue'},
			fontSize:19,
			fontFamily:'Helvetica Neue',
			fontWeight:'bold',
			top:5,
			color:'#111',
			left:20,
		},
		{
			type:'text', 
			name:'subject', 
			font:{fontSize:'13', fontFamily:'Helvetica Neue'},
			fontSize:14,
			fontFamily:'Helvetica Neue',
			top:27,
			color:'#333',
			left:20,
			width:200
		},

		{
			type:'text', 
			name:'message', 
			font:{fontSize:'13', fontFamily:'Helvetica Neue'},
			fontSize:14,
			fontFamily:'Helvetica Neue',
			top:43,
			color:'#888',
			left:20,
		},
		{
			type:'text',
			name:'date',
			font:{fontSize:'14',fontWeight:'bold', fontFamily:'Helvetica Neue'},
			fontSize:14,
			fontFamily:'Helvetica Neue',
			fontWeight:'bold',
			top:9,
			color:'#3366999',
			right:10,
			textAlign:'right',
			width:100
		}
	]
};

// table view data 
var data = [
	{from:'Simpson, Homer J.', subject:'beer', message:'did you get my message', date:'2:46 PM'},
	{from:'Simpson, Homer J.', subject:'beer', message:'mmm...  beer...', date:'1:40 PM'}

];

// table view
var tableView = Titanium.UI.createTableView({
	data:data,
	template:template,
	editable:true
});

// add delete event listener
tableView.addEventListener('delete',function(e)
{
	Titanium.API.info("deleted - row="+e.row+", index="+e.index+", section="+e.section + ' table view row length = ' + tableView.data.length);
});

win.add(tableView);

//
//  create edit/cancel buttons for nav bar
//
var edit = Titanium.UI.createButton({
	title:'Edit'
});

edit.addEventListener('click', function()
{
	win.setRightNavButton(cancel);
	tableView.editing = true;
});

var cancel = Titanium.UI.createButton({
	title:'Cancel',
	style:Titanium.UI.iPhone.SystemButtonStyle.DONE
});
cancel.addEventListener('click', function()
{
	win.setRightNavButton(edit);
	tableView.editing = false;
});

win.setRightNavButton(edit);


