// by default the modal window has a nav bar
// since we're embedding a navgroup inside the modal
// window which also has a nav bar, we ask him to hide it
var modal = Ti.UI.createWindow({
	navBarHidden:true
});

var modalWin = Ti.UI.createWindow({
	backgroundColor:"red"
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

var nav = Ti.UI.iPhone.createNavigationGroup({
	window:modalWin
});

table.addEventListener('click',function(e)
{
	var w = Ti.UI.createWindow({
		title:e.rowData.title
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
		nav.close();
		modal.close();
	});
	w.add(b);
	nav.open(w);
});

modal.add(nav);
modal.open({modal:true});
