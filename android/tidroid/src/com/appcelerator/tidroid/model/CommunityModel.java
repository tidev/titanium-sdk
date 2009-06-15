// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid.model;

import java.io.StringReader;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.appcelerator.tidroid.App;

import android.content.ContentValues;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.preference.PreferenceManager;
import android.util.Log;

public class CommunityModel
{
	private static final String LCAT = "TiCommunityModel";
	private static final String DATE_FORMAT_RSS = "EEE, dd MMM yyyy HH:mm:ss Z";
	private static final String DATE_FORMAT_TWEET = "HH:mm z 'on' dd MMM yyyy";

	private static final String TABLE_NEWS = "News";

	private static final String HTML_START_1 =
		"<html> " +
		"<head>\n" +
		"<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>\n" +
		"<style>\n" +
		".icon { float:left;height:32px;width:32px;padding-right:5px}\n" +
		".tweet {border-bottom: thin solid #999999; clear:both; margin-bottom:4px; font-size: "
		;
	private static final String HTML_START_2 = "pt;}\n" +
		".content {}" +
		".stats {clear:both; font-size: 90%; font-style: italic; padding-top:2px; padding-left: 37px;padding-bottom:2px}\n" +
		"a {text-decoration: none;}" +
		"</style>\n" +
		"</head>\n"+
		"<body>"
		;

	private static final String HTML_END =
		"</body></html>"
		;

	private AppDatabase appDb;
	private DateFormat dfRss;
	private DateFormat dfTweet;

	private CommunityModelListener listener;

	public CommunityModel(AppDatabase appDb)
	{
		this.appDb = appDb;
		this.dfRss = new SimpleDateFormat(DATE_FORMAT_RSS);
		this.dfTweet = new SimpleDateFormat(DATE_FORMAT_TWEET);
	}

	public void setModelChangeListener(CommunityModelListener listener) {
		this.listener = listener;
	}

	private void fireCommunityChanged() {
		if (listener != null) {
			listener.onCommunityChanged();
		}
	}

	private String getHtmlHead() {
		StringBuilder sb = new StringBuilder(4096);

		sb.append(HTML_START_1);
		SharedPreferences prefs=PreferenceManager.getDefaultSharedPreferences(App.getApp());
		sb.append(prefs.getString("display_text_size", "9"));
		sb.append(HTML_START_2);

		return sb.toString();
	}
	public void updateTwitter(String rss)
	{
		DocumentBuilder builder = null;
		StringReader rssReader = null;
		SQLiteDatabase db = appDb.getWritableDatabase();
		try {
			//For now, don't deal with duplicates, just erase them all;

			db.delete(TABLE_NEWS, null, null);
			builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
			rssReader = new StringReader(rss);
			Document doc = builder.parse(new InputSource(rssReader));

			// Have document, lets process the items
			NodeList items = doc.getElementsByTagName("item");
			int items_length = items.getLength();
			for(int i = 0; i < items_length; i++)
			{
				Element item = (Element) items.item(i);

				String title = null;
				String status_url = null;
				String author = null;
				String image_url = null;
				String content = null;
				String pubDate = null;

				// Extract usable pieces from the item element
				NodeList nodes = item.getChildNodes();
				int children_length = nodes.getLength();
				for(int j = 0; j < children_length; j++) {
					Node node = (Node) nodes.item(j);
					node.normalize();
					String nodeName = node.getNodeName();
					if (nodeName != null && nodeName.startsWith("#text")) {
						continue;
					}
					String nodeValue = null;
					if (node.hasChildNodes()) {
						nodeValue = node.getFirstChild().getNodeValue();
					}
					//Log.d(LCAT, "Name: " + nodeName + " Value: " + nodeValue);
					if ("title".compareToIgnoreCase(nodeName) == 0) {
						title = nodeValue;
					} else if ("link".compareToIgnoreCase(nodeName) == 0) {
						status_url = nodeValue;
					} else if ("description".compareToIgnoreCase(nodeName) == 0) {
						content = nodeValue;
					} else if ("pubDate".compareToIgnoreCase(nodeName) == 0) {
						pubDate = nodeValue;
					} else if ("google:image_link".compareToIgnoreCase(nodeName) == 0) {
						image_url = nodeValue;
					} else if ("author".compareToIgnoreCase(nodeName) == 0) {
						author = nodeValue;
					}
				}

				// Process the data for this item
				Date d = dfRss.parse(pubDate.trim());
				long published = d.getTime();

				// Build HTML content, do not include the list item
				StringBuilder sb = new StringBuilder(512);

				String twitterName = author.substring(0,author.indexOf("@"));
				String realName = author.substring(author.indexOf("(")+1,author.indexOf(")"));


				sb.append("<a href='http://twitter.com/").append(twitterName).append("'>")
					.append("<img src='").append(image_url).append("' class='icon' border='no'/></a>")
					.append("<div class='content'><a href='http://twitter.com/").append(twitterName).append("'><b>").append(twitterName).append("</b></a> ")
					.append(content).append("</div>\n")
					.append("<div class='stats'>by ").append(realName).append(" at ").append(dfTweet.format(d)).append("</div>")
					;

				ContentValues values = new ContentValues();
				values.put("Published", published);
				values.put("Content",sb.toString());

				db.insertOrThrow(TABLE_NEWS, null, values); // TODO better handling?
			}

		} catch (Exception e) {
			Log.e(LCAT, "Error parsing twitter rss document", e);
		} catch (Throwable t) {
			Log.e(LCAT, "Error parsing twitter rss document", t);
		} finally {
			if (rssReader != null) {
				try {
					rssReader.close();
				} catch (Throwable t) {
					Log.e(LCAT, "Error while closing reader");
				}
				rssReader = null;
			}

			if (db != null) {
				db.close();
				db = null;
			}
		}

		fireCommunityChanged();
	}

	public String twitterToHtml()
	{
		StringBuilder sb = new StringBuilder(8096);
		sb.append(getHtmlHead());

		String sql =
			"select Content from " + TABLE_NEWS + " order by Published DESC, _ID DESC";

		SQLiteDatabase db = appDb.getReadableDatabase();

		Cursor cursor = null;
		try {
			cursor = db.rawQuery(sql, null);
			while(cursor.moveToNext()) {
				String s = cursor.getString(0);
				Log.d(LCAT, "Content: " + s);
				sb.append("\n<div class='tweet'>").append(s).append("</div>\n");
			}
		} finally {
			if (cursor != null) {
				cursor.close();
				cursor = null;
			}
			if (db != null) {
				db.close();
				db = null;
			}
		}

		sb.append(HTML_END);

		return sb.toString();
	}

}
