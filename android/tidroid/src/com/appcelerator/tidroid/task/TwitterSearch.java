// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid.task;

import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;

import android.util.Log;

import com.appcelerator.tidroid.App;
import com.appcelerator.tidroid.IProgressManager;
import com.appcelerator.tidroid.R;
import com.appcelerator.tidroid.model.CommunityModel;

public class TwitterSearch extends AbstractTask
{
	private static final String LCAT = "TiTwtrSrch";

	public static final String TWITTER_SEARCH = "http://search.twitter.com/search.rss?" +
	"q=%22appcelerator%22+OR+%22appcelerator+titanium%22+OR+%40titanium+OR+%40appcelerator+OR+%23titanium+OR+%23appcelerator&rpp=";

	public static final int TWITTER_DEFAULT_RPP = 20;

	private CommunityModel model;

	public TwitterSearch(IProgressManager progress, CommunityModel model)
	{
		super(progress);
		this.model = model;
	}

	public void doTask()
	{
		if(App.getApp().canUseNetwork()) {
	   		HttpGet httpGet = new HttpGet(getTwitterUrl());
	   		HttpClient client = new DefaultHttpClient();
	   		ResponseHandler<String> responseHandler = new BasicResponseHandler();
	   		try {
	   			String rss = client.execute(httpGet, responseHandler);
	   			Log.d(LCAT, "Received RSS for Twitter");
	   			model.updateTwitter(rss);
	   		} catch (Throwable t) {
	   			Log.e(LCAT, "Error retrieving twitter search result", t);
	   		}
		} else {
			App.getApp().toastShort(R.string.no_network);
		}
	}

	private String getTwitterUrl() {
		StringBuilder sb = new StringBuilder(TWITTER_SEARCH.length()+10);
		sb.append(TWITTER_SEARCH);
		sb.append(TWITTER_DEFAULT_RPP); //TODO Get default results per page from prefs
		return sb.toString();
	}


}
