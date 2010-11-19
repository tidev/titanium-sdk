var win = Ti.UI.currentWindow;

var tv = Ti.UI.createTableView({
	style:Titanium.UI.iPhone.TableViewStyle.GROUPED
});

function setData()
{
	var data = [];
	for (var i=0;i<30;i++)	
	{
		var row = Ti.UI.createTableViewRow({height:50});
		var l1 = Ti.UI.createLabel({text:'Label ' +  i, font:{fontSize:14}, color:'#888', left:5});
		row.add(l1);
		var image1 = Ti.UI.createImageView({url:'../images/chat.png', right:5,height:23, width:29});
		row.add(image1);
		data.push(row);
	}
	tv.setData(data);
}
tv.addEventListener('click', function(e)
{
	var label = e.row.children[0];
	label.text = 'I was clicked';
});
win.add(tv);
setData();

Ti.API.info('window ' + win);
Ti.API.info('children ' + win.children + ' length ' + win.children.length);
