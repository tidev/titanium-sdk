// Example functions to load an RSS feed url then display items in a tableView
// Requires Titanium mobile 0.9.1 or above
// Kosso ( twitter.com/kosso )
// Used by Permission

// eg:

var url = 'http://rss.cnn.com/services/podcasting/newscast/rss.xml';

// loadRRSFeed(url) // is at the bottom of the js - after all the functions

// useful for getting rid of html links in text elements in a feed
Titanium.include('strip_tags.js');  
// see: http://pastie.org/837981

///////////////////////////////////////////////////////

var data;
var i = 0;
var feedTableView;
var feedTitle = '';

Ti.UI.currentWindow.barColor = '#b40000';

var stream = Ti.Media.createAudioPlayer();

var item_window = Ti.UI.createView({

	backgroundColor:'#b40000',
	borderRadius:8,
	right:5,
	left:5,
	height:100,
	bottom:5

});
Ti.UI.currentWindow.add(item_window);
var item_title_label = Ti.UI.createLabel({
	text: '',
	color: '#fff',
	textAlign:'center',
	left:10,
	right:10,
	top:5,
	height:45,
	font:{fontFamily:'Helvetica Neue',fontWeight:'bold',fontSize:18}
	});
item_window.add(item_title_label);
var item_desc_label = Ti.UI.createLabel({
	text: '',
	color: '#000',
	textAlign:'center',
	left:10,
	right:10,
	top:55,
	height:40,
	font:{fontFamily:'Helvetica Neue',fontWeight:'bold',fontSize:13}
	});
item_window.add(item_desc_label);

function displayItems(itemList){

	for (var c=0;c < itemList.length;c++){	

		// Ti.API.info('item title :' + itemList.item(c).getElementsByTagName("title").item(0).text);
		// Ti.API.info('item description :' + itemList.item(c).getElementsByTagName("description").item(0).text);
		// Ti.API.info('item enclosure url :' + itemList.item(c).getElementsByTagName("enclosure").item(0).getAttribute("url"));
		
		var title = null;
		var desc = null;
		var mp3_url = null;
		
		// If we want to only add items with mp3 enclosures
		if(itemList.item(c).getElementsByTagName("enclosure")!=null){

			// Item title
			title = itemList.item(c).getElementsByTagName("title").item(0).text;
			// Item description
			desc = itemList.item(c).getElementsByTagName("description").item(0).text;
			// Clean up any nasty linebreaks in the title and description			
			title = title.replace(/\n/gi, " ");			
			desc = desc.replace(/\n/gi, " ");

			// Podcast mp3 enclosure
			mp3_url = itemList.item(c).getElementsByTagName("enclosure").item(0).getAttribute("url");

			// Create a table row for this item
			var row = Ti.UI.createTableViewRow({height:'auto',backgroundColor:'#eeeeee',selectedBackgroundColor:'#b40000'}); 

			// Create a label for the title
			var post_title = Ti.UI.createLabel({
				text: title,
				color: '#000',
				textAlign:'left',
				left:60,
				height:'auto',
				width:'auto',
				top:3,
				font:{fontWeight:'bold',fontSize:16}
			});
			row.add(post_title);
			
			// add the CNN logo on the left
			// naturally this could be an image in the feed itself if it existed
			var item_image = Ti.UI.createImageView({
				image:'http://i.cdn.turner.com/cnn/.element/img/3.0/global/header/hdr-main.gif',
				left:3,
				top:2,
				width:50,
				height:34
			});
			row.add(item_image);
			
			// Add some rowData for when it is clicked			
			row.thisTitle = title;
			row.thisMp3 = mp3_url;
			row.thisDesc = desc;
			
			// Add the row to the data
			data[i] = row;
			// I use 'i' here instead of 'c', as I'm only adding rows which have mp3 enclosures
			i++;
			
		} // end if enclosure		
	}
	
	// create the table
	feedTableView = Titanium.UI.createTableView({
		data:data,
		top:0,
		width:320,
		height:260
	});
	
	// Add the tableView to the current window
	Titanium.UI.currentWindow.add(feedTableView);
	
	// Create tableView row event listener
	feedTableView.addEventListener('click', function(e){

		// a feed item was clicked
		Ti.API.info('item index clicked :'+e.index);
		Ti.API.info('title  :'+e.rowData.thisTitle);
		Ti.API.info('description  :'+strip_tags(e.rowData.thisDesc));
		Ti.API.info('mp3 enclosure  :'+e.rowData.thisMp3);
		// show an alert
		// Ti.UI.createAlertDialog({title:e.rowData.thisTitle, message:e.rowData.thisMp3}).show();
		
		item_title_label.text = strip_tags(e.rowData.thisTitle);
		item_desc_label.text = strip_tags(e.rowData.thisDesc);
		// etc ...	
		// now do some cool stuff! :)
		// like add an audio player, open a new window, etc..
		
		stream.stop();
		stream.url = e.rowData.thisMp3;
		stream.start();
		 
	});
}

function loadRSSFeed(url){

	data = [];
	Ti.API.info('>>>> loading RSS feed '+url);
	xhr = Titanium.Network.createHTTPClient();
	xhr.open('GET',url);
	xhr.onload = function()
	{
			
		Ti.API.info('>>> got the feed! ... ');
		
		// Now parse the feed XML 
		var xml = this.responseXML;
		
		// Find the channel element 
		var channel = xml.documentElement.getElementsByTagName("channel");

		feedTitle = channel.item(0).getElementsByTagName("title").item(0).text;
		
		Ti.API.info("FEED TITLE " + feedTitle);
		
		Titanium.UI.currentWindow.title = feedTitle;
		// Find the RSS feed 'items'
		var itemList = xml.documentElement.getElementsByTagName("item");
		Ti.API.info('found '+itemList.length+' items in the RSS feed');

		item_title_label.text = 'DONE';
		item_desc_label.text = 'click a feed item';
		
		// Now add the items to a tableView
		displayItems(itemList);

	};
	
	item_title_label.text = 'LOADING RSS FEED..';
	item_desc_label.text = '';
	xhr.send();	
}


// RIGHT NAVBAR REFRESH BUTTON		
var r = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.REFRESH
});
r.addEventListener('click',function()
{
	// reload feed
	loadRSSFeed(url);	
});
Titanium.UI.currentWindow.setRightNavButton(r);


// load the feed
loadRSSFeed(url);