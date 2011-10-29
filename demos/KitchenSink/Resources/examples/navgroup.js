// by default the modal window has a nav bar
// since we're embedding a navgroup inside the modal
// window which also has a nav bar, we ask him to hide it

var open = Ti.UI.createButton({
	title:'Open nav group',
	top:150,
	width:200,
	height:40
});
open.addEventListener('click', function() {
	modal.open({modal:true});
});
Ti.UI.currentWindow.add(open);

var modal = Ti.UI.createWindow({
	navBarHidden:true
});

var modalWin = Ti.UI.createWindow({
	backgroundColor:"red"
});

var nav = Ti.UI.iPhone.createNavigationGroup({
	window:modalWin,
	backgroundColor:'blue'
});

var table = Ti.UI.createTableView({
	style:Ti.UI.iPhone.TableViewStyle.GROUPED,
	data:[{title:"Well look at this"},{title:"TweetDeck is cool"}]
});
modalWin.add(table);

var done = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.DONE
});

modalWin.setRightNavButton(done);

done.addEventListener('click',function() 
{
	modal.close();
});

table.addEventListener('click',function(e)
{
	var b = Titanium.UI.createButton({
		title:'Back (no anim)',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	});
	b.addEventListener('click', function() {
		nav.close(w,{animated:false});
	});
	var w = Ti.UI.createWindow({
		title:e.rowData.title,
		rightNavButton:b
	});
	w.addEventListener('focus',function()
	{
		Ti.API.info("nav group window -- focus event");
	});
	w.addEventListener('blur',function()
	{
		Ti.API.info("nav group window -- blur event");
	});
	var b = Ti.UI.createButton({
		title:"Close Nav",
		width:120,
		height:40
	});
	b.addEventListener('click',function()
	{
		modal.close();
	});
	w.add(b);
	nav.open(w);
});

modal.add(nav);
modal.open({modal:true});
