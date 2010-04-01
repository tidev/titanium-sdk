// 
// // create table view data object
// var data = [];
// 
// var xhr = Ti.Network.createHTTPClient();
// xhr.open("GET","http://v2.0.news.tmg.s3.amazonaws.com/feeds/news.xml");
// xhr.onload = function()
// {
// 	try
// 	{
// 		var doc = this.responseXML.documentElement;
// 		var items = doc.getElementsByTagName("item");
// 		var x = 0;
// 		var doctitle = doc.evaluate("//channel/title/text()").item(0).nodeValue;
// 		for (var c=0;c<items.length;c++)
// 		{
// 			var item = items.item(c);
// 			var thumbnails = item.getElementsByTagName("media:thumbnail");
// 			if (thumbnails && thumbnails.length > 0)
// 			{
// 				var media = thumbnails.item(0).getAttribute("url");
// 				var title = item.getElementsByTagName("title").item(0).text;
// 				var row = Ti.UI.createTableViewRow({height:80});
// 				var label = Ti.UI.createLabel({
// 					text:title,
// 					left:72,
// 					top:5,
// 					bottom:5,
// 					right:5
// 				});
// 				row.add(label);
// 				var img = Ti.UI.createImageView({
// 					url:media,
// 					left:5,
// 					height:60,
// 					width:60
// 				});
// 				row.add(img);
// 				data[x++] = row;
// 				row.url = item.getElementsByTagName("link").item(0).text;
// 			}
// 		}
// 		var tableview = Titanium.UI.createTableView({data:data});
// 		Titanium.UI.currentWindow.add(tableview);
// 		tableview.addEventListener('click',function(e)
// 		{
// 			var w = Ti.UI.createWindow({title:doctitle});
// 			var wb = Ti.UI.createWebView({url:e.row.url});
// 			w.add(wb);
// 			var b = Titanium.UI.createButton({
// 				title:'Close',
// 				style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
// 			});
// 			w.setLeftNavButton(b);
// 			b.addEventListener('click',function()
// 			{
// 				w.close();
// 			});
// 			w.open({modal:true});
// 		});
// 	}
// 	catch(E)
// 	{
// 		alert(E);
// 	}
// };
// xhr.send();
// 
// 


var xmlstr = '<stories><article><url>http://design.publicus.com/article/20100324/SPORT/3022297532&amp;artnr=1</url><domain>http://design.publicus.com</domain><head><title>Andreas Johansson returning after knee injurie</title></head><mainpicture width="370" height="279"><mainpictureurl>http://d2img.no.publicus.com/apps/pbcsi.dll/storyimage/D2/20100324/SPORT/302229753/AR-302229753.jpg?ref=AR</mainpictureurl></mainpicture></article><article><url>http://design.publicus.com/article/20100324/SPORT/3022297322&amp;artnr=2</url><domain>http://design.publicus.com</domain><head><title>Aab wins semi final after penalty kicks</title></head><mainpicture width="100" height="150"><mainpictureurl>http://d2img.no.publicus.com/apps/pbcsi.dll/storyimage/D2/20100324/SPORT/302229732/AR-302229732.jpg?ref=AR</mainpictureurl></mainpicture></article></stories>';
var xml = Ti.XML.parseString(xmlstr);

// CODE //

var rootElements = xml.getElementsByTagName('stories');     
var rootElement = rootElements.item(0);      
var articleElements = rootElement.getElementsByTagName('article');
Ti.API.info('article el ' + articleElements.length)
for (var cnt = 0; cnt < articleElements.length; cnt++){
  var articleElement = articleElements.item(cnt);
  var urlElement = articleElement.getElementsByTagName('url');
  var theLink = urlElement.item(0);
  Ti.API.info('theLink: ' + theLink.firstChild.text);

  var mainPictElements = rootElement.getElementsByTagName('mainpicture'); //Returns all mainpicture elements for all articles! Not just for articleElements.item(cnt)
  for (var pcnt = 0; pcnt < mainPictElements.length; pcnt++){
    var mainPictElement = mainPictElements.item(0);
    var theMainPictUrl = mainPictElement.firstChild.text;
    Ti.API.info('art no: ' + cnt + ' theMainPictUrl: ' + theMainPictUrl); // This will return theMainPictUrl for all pictures in the XML, for every article elements! Instead of only for articleElements.item(cnt)
    Ti.API.info('HEIGHT: ' + mainPictElement.getAttribute("height")); 
  }
}