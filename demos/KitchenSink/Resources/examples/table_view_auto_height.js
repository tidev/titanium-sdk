//FIXME: JGH redo

var win = Titanium.UI.currentWindow;
win.barColor = '#385292';

var template = {
 	minHeight:20,
	rowHeight:'auto',
 	layout:[
   		{type:'text', left:20, top:20, bottom:20, right:20, height:'auto', color:'#999', name:'text'},
]};

var data = [
	{text:'This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.'},
	{text:'This is some long text.  This is some long text.  This is some long text.  This is some long text.' },
	{text:'This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.'},

];

//
// create table view (
//
var tableView = Titanium.UI.createTableView({
	template:template,
	data:data,
});



win.add(tableView);

