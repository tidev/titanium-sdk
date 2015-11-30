function xml_rss(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	
	// loadXMLData() seems to contain outdated code (as of Feb 2013).
	// (This entire test was disabled for the Mobile Web platform, so the function was unused).
	// The code was modified to work on the Tizen platform, and placed in loadXMLDataTizen().

	function loadXMLDataTizen() {
		try
		{
			var doc = this.responseXML.documentElement,
				items = doc.getElementsByTagName("item"),
				x = 0,
				doctitle = this.responseXML.evaluate('//channel/title/text()', doc, null, XPathResult.ANY_TYPE, null).iterateNext().nodeValue,
				c = 0,
				itemsCount = items.length;
			for (; c < itemsCount; c++)
			{
				var item = items.item(c),
					thumbnails =  this.responseXML.evaluate('./*[name() = "media:thumbnail"]/@url', item, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
				
				thumbnails = thumbnails.iterateNext();
				if (thumbnails && thumbnails.value)
				{
					var media = thumbnails.value,
						title = item.getElementsByTagName('title').item(0).firstChild.nodeValue,
						row = Ti.UI.createTableViewRow({ height: 80 }),
						label = Ti.UI.createLabel({
							text:title,
							left:72,
							top:5,
							bottom:5,
							right:5				
						});
					row.add(label);
					var img;
					if (Titanium.Platform.name == 'android') 
					{
						// iphone moved to a single image property - android needs to do the same
						img = Ti.UI.createImageView({
							image:media,
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
					row.url = item.getElementsByTagName('link').item(0).firstChild.nodeValue;
				}
			}
			var tableview = Titanium.UI.createTableView({data:data});
			win.add(tableview);
			tableview.addEventListener('click', function(e)
			{
				var w = Ti.UI.createWindow({ title: doctitle }),
					wb = Ti.UI.createWebView({ url: e.row.url });
				w.add(wb);
				args.containingTab.open(w, {animated: true})
			});
		}
		catch(E)
		{
			alert(E);
		}		
	}
	
	function loadXMLData() {
		try
		{
			var doc = this.responseXML.documentElement;
			var items = doc.getElementsByTagName("item");
			var x = 0;
			var doctitle = doc.evaluate("//channel/title/text()").item(0).nodeValue;
			for (var c=0;c<items.length;c++)
			{
				var item = items.item(c);
				var thumbnails = item.getElementsByTagName("media:thumbnail");
				if (thumbnails && thumbnails.length > 0)
				{
					var media = thumbnails.item(0).getAttribute("url");
					var title = item.getElementsByTagName("title").item(0).text;
					var row = Ti.UI.createTableViewRow({height:80});
					var label = Ti.UI.createLabel({
						text:title,
						left:72,
						top:5,
						bottom:5,
						right:5				
					});
					row.add(label);
					var img;
					if (Titanium.Platform.name == 'android') 
					{
						// iphone moved to a single image property - android needs to do the same
						img = Ti.UI.createImageView({
							image:media,
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
					row.url = item.getElementsByTagName("link").item(0).text;
				}
			}
			var tableview = Titanium.UI.createTableView({data:data});
			win.add(tableview);
			tableview.addEventListener('click',function(e)
			{
				var w = Ti.UI.createWindow({title:doctitle});
				var wb = Ti.UI.createWebView({url:e.row.url});
				w.add(wb);
				var b = Titanium.UI.createButton({
					title:'Close',
					style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
				});
				w.setLeftNavButton(b);
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
	}	
	
	var win = Ti.UI.createWindow();
	
	// create table view data object
	var data = [];
	
	var xhr = Ti.Network.createHTTPClient();
	xhr.open("GET","http://v2.0.news.tmg.s3.amazonaws.com/feeds/news.xml");

	xhr.onload = Titanium.Platform.osname === 'tizen' ? loadXMLDataTizen : loadXMLData;

	xhr.send();
	
	return win;
};

module.exports = xml_rss;
	
	
	

