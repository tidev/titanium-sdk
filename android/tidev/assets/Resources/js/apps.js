/**
 * Appcelerator Mobile Developer
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 */

var uriRE = /((http[s]?):\/\/)([^:\/\s]+)((\/\w+)*\/)?([\w\-\.]+[^#?\s]+)?(.*)?(#[\w\-]+)?/;
var unRE = /(@[\w]+)/;

var notifier = Titanium.UI.createNotification();

function linkURIs(tweet)
{
//    return tweet.gsub(uriRE, function(m)
//	{
//	  return '<a target="ti:systembrowser" href="' + m[0] + '">' + m[0] + '</a>';
//	});
	return tweet;
}

function linkReplies(tweet)
{
	return tweet;
//    return tweet.gsub(unRE,function(m)
//					  {
//					  // target ti:systembrowser will cause titanium to open the link in the systembrowser (doh!)
//					  return '<a target="ti:systembrowser" href="http://twitter.com/' + m[0].substring(1) + '">' + m[0] + '</a>';
//					  })
}

var months = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11};
var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function parseDate(d)
{
    var parts = d.split(' ');
    var date = new Date();
    var time = parts[3].split(':');
    date.setUTCMonth(months[parts[1]]);
    date.setUTCDate(parts[2]);
    date.setUTCFullYear(parts[5]);
    date.setUTCHours(time[0]);
    date.setUTCMinutes(time[1]);
    date.setUTCSeconds(time[2]);
    return date;
}
function today(d)
{
    var now = new Date();
    return d.getDay() == now.getDay() &&
	d.getDate() == now.getDate() &&
	d.getMonth() == now.getMonth();
}
function formatTime(h,m)
{
    m = m < 10 ? '0'+m : m;
    var ampm = 'pm';
    if (h < 12)
    {
		h = h = 1 ? 12 : h;
		ampm= 'am'
    }
    else
    {
		if (h != 12)
			h = h - 12;
    }
    return h + ':' + m + ' ' + ampm;
}
function formatApp(obj)
{
    var d = parseDate(obj.created_at);
    obj.display_date = formatTime(d.getHours(),d.getMinutes());
    if (!today(d))
    {
		obj.created_at = days[d.getDay()] + obj.created_at;
    }
    obj.display_text = linkReplies(linkURIs(obj.text));
    return obj;
}

function formatVotes(votes) {
	stars = '';
	for(i=1; i < 6; i++) {
		if (votes >= i) {
			stars += '<img src="images/star_full.png"/>'
		} else {
			stars += '<img src="images/star_empty.png"/>'
		}
	}
	return stars;
}

function loadData()
{
		Titanium.App.setLoadOnPageEnd(false);
	 //document.body.style.background = 'transparent';
	 //document.body.innerHTML = '<img id="background" src="images/background.png"/>';

	 var apps_url = 'http://publisher.titaniumapp.com/api/app-list';
	 try
	 {
		var prog = Titanium.UI.createActivityIndicator();
		prog.setLocation(Titanium.UI.ActivityIndicator.STATUS_BAR);
		prog.setType(Titanium.UI.ActivityIndicator.INDETERMINANT);
		prog.show();
		notifier.setMessage("Updating...");
		notifier.setDelay(1);

		var xhr = Titanium.Net.createHTTPClient();
		xhr.onreadystatechange = function()
		{
			if (this.readyState == 4)
			{
				var results = eval('('+this.responseText+')');
				var len = results.length;
				var html = '';
				//html += '<img id="background" src="images/background.png"/>';

				for (var c=0;c<len;c++)
				{
					var row = results[c];
					//r = JSON.stringify(row);
					//' + encode64(r) + '

					html += '<div class="row"><div class="image">' +
					'<img width="48" height="48" src="" border="0" id="img-' + c + '" onclick="appDetails(\'\'); "/>' +
					'</div>' +
					'<div class="line"><div class="title">' + row.title + '</div>' +
					'<div class="download-image"><img width="17" height="17" src="images/little_arrow.png" /></div>' +
					'<div class="downloads">' + row.downloads + '</div></div>' +
					'<div class="line"><div class="author">' + row.author + '</div>' +
					'<div class="votes">' + formatVotes(row.value) + '</div></div>' +
					'</div><div class="spacing"></div>';
				}
				document.body.innerHTML = html;
				//document.body.style.background = '';
				Titanium.App.triggerLoad();
				notifier.hide();
				setTimeout(function(){
					for (var c=0; c<len; c++) {
						var i = results[c].image;
						document.getElementById("img-"+c).src = i;
					}},500);
				prog.hide();
				notifier.setMessage("Update complete.");
				notifier.setDelay(0);
				notifier.show();
			}
		};
		notifier.show();
		xhr.open('GET',apps_url);
		xhr.send();
	 }
	 catch(E)
	 {
		 document.write("<p>There was an unexpected error fetching the feed.  Possibly a network or service error? " + E.name + "<br/>" + E.message +"</p>");
	 }
}

function appDetails(row) {
	var w = Titanium.UI.createWindow();
	w.setWindowId("app");
	w.open();
}

window.onload = function() {
	loadData();

	menu = Titanium.UI.createMenu();
	menu.addItem("Refresh", loadData , "images/refresh.png");

	Titanium.UI.setMenu(menu);
}
