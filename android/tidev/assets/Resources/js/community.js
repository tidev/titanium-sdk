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
function formatTweet(obj)
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

function openDb() {
	return Titanium.Database.open("tidev.db");
}

function validateDatabase() {

	var db = null;
	var rs = null;

	try {
		db = openDb(); // file will be created
		db.execute("create table if not exists News (id INTEGER, html TEXT)");
	} catch (e) {
		Titanium.API.error("SQL Error in validateDatabase: " + e);
	} finally {
		if (db != null) {
			db.close();
		}
	}
}

function displayData()
{
	var db = null;
	var rs = null;

	try {
		db = openDb();
		rs = db.execute("select html from News order by id");
		var html = '';
		while(rs.isValidRow()) {
			html += rs.getField(0);
			rs.next();
		}
		document.body.innerHTML = html;
	} catch (e) {
		Titanium.API.error("Error in displayData: " + e); // maybe display a dialog
	} finally {
		if (rs != null) {
			rs.close();
		}
		if (db != null) {
			db.close();
		}
	}
}

function loadData()
{
	var community_url = 'http://search.twitter.com/search.json?q=+%22Appcelerator+Titanium%22+OR+%23titanium+OR+%23appcelerator&rpp=25';
	try
	{
		notifier.setMessage("Updating...");
		notifier.setDelay(1);
		var prog = Titanium.UI.createActivityIndicator();
		prog.setLocation(Titanium.UI.ActivityIndicator.STATUS_BAR);
		prog.setType(Titanium.UI.ActivityIndicator.INDETERMINANT);
		prog.show();

		var xhr = Titanium.Net.createHTTPClient();
		xhr.onreadystatechange = function()
		{
			alert("READYSTATE = " + this.readyState);
			if (this.readyState == 4)
			{
				var json = eval('('+this.responseText+')');
				var len = json.results.length;
				var db = null;

				try {
					db = openDb();
					db.execute("delete from News");

					for (var c=0;c<len;c++)
					{
						var row = formatTweet(json.results[c]);
						var html = '<div class="row"><div class="image">' +
						'<a target="ti:systembrowser" href="http://twitter.com/'+row.from_user+'"><img width=48 height=48 border="0" id="img-' + c + '" src="' + row.profile_image_url + '" /></a>' +
						'</div>' +
						'<div class="msg">' + row.display_text + '</div>' +
						'<div class="byline">by <a target="ti:systembrowser" href="http://twitter.com/'+row.from_user+'">'+row.from_user+'</a> at '+row.display_date+'</div></div>';

						db.execute("insert into News (id,html) values(?,?)" , [ c, html ]);
					}

				} catch (e) {
					Titanium.API.error("Error in loadData: " + e);
				} finally {
					if (db != null) {
						db.close();
					}
				}
				notifier.hide();
				displayData();
				prog.hide();

				notifier.setMessage("Update complete.");
				notifier.setDelay(0);
				notifier.show();
			}
		};
		notifier.show();
		xhr.open('GET',community_url);
		xhr.send();
	 }
	 catch(E)
	 {
		 document.write("<p>There was an unexpected error fetching the feed.  Possibly a Twitter failwhale? " + E + "</p>");
	 }
}

window.onload = function()
{
	validateDatabase();
	//Titanium.App.setLoadOnPageEnd(false);
	displayData();
	//Titanium.App.triggerLoad();

	menu = Titanium.UI.createMenu();
	menu.addItem("Refresh", loadData , "images/refresh.png");
	Titanium.UI.setMenu(menu);
	Titanium.Media.vibrate();

	var db = null;
	var rs = null;
	try {
		db = openDb();
		rs = db.execute("select id from News limit 1");
		if (rs.getRowCount() > 0) {
			setTimeout(loadData, 5000);
		} else {
			loadData();
		}

	} finally {
		if (rs != null) {
			rs.close();
			rs = null;
		}
		if (db != null) {
			db.close();
			db = null;
		}
	}
};
