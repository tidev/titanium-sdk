var win= Ti.UI.currentWindow;
win.backgroundColor = '#EEE';
win.layout = 'vertical';
// create table view data object
var data = [];

var xhr = Ti.Network.createHTTPClient();
xhr.open("GET","data/news.xml");
xhr.onload = function()
{
	try
	{
		var doc = Titanium.XML.parseString(xhr.responseText);
		var items = doc.getElementsByTagName("item");
		var x = 0;
		var doctitle = doc.evaluate("//channel/title/text()").item(0).nodeValue;
		for (var c=0;c<items.length;c++)
		{
			var item = items.item(c);
			var thumbnails = item.getElementsByTagName("media-thumbnail");
			if (thumbnails && thumbnails.length > 0)
			{
				var media = thumbnails.item(0).getAttribute("url");
				var title = item.getElementsByTagName("title").item(0).firstChild.nodeValue;
				var row = Ti.UI.createTableViewRow({height:80});
				var label = Ti.UI.createLabel({
					text:title,
					left:72,
					top:5,
					bottom:5
				});
				row.add(label);
				var img;
				if (Titanium.Platform.name == 'android') 
				{
					// iphone moved to a single image property - android needs to do the same
					img = Ti.UI.createImageView({
						url:media,
						left:5,
						height:60,
						width:60
					});

				}
				else
				{
					img = Ti.UI.createImageView({
						image:media,
						left:5,
						height:60,
						width:60
					});
					
				}
				row.add(img);
				data[x++] = row;
				row.url = item.getElementsByTagName("link").item(0).firstChild.nodeValue;
			}
		}
		var tableview = Titanium.UI.createTableView({data:data, top: 10});
		Titanium.UI.currentWindow.add(tableview);
		tableview.addEventListener('click',function(e)
		{
			var w = Ti.UI.createWindow({title:doctitle});
			w.layout = 'vertical';
			var wb = Ti.UI.createWebView({url:e.row.url});
			w.add(wb);
			var b = Titanium.UI.createButton({
				title:'Close',
				top: 10,
				left: 10,
				width: 300,
				height: 40,
				fontSize: 20,
				style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
			});
			//w.setLeftNavButton(b);
			w.add(b);
			b.addEventListener('click',function()
			{
				w.close();
			});
			w.open({modal:true});
		});
	}
	catch(E)
	{
		alert(E);
	}
};
xhr.send();



var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:50,
	width:300,
	top:10,
	left:10
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});



win.add(closeButton);

