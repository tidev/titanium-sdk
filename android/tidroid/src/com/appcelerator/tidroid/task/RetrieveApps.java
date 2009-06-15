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
import com.appcelerator.tidroid.model.AppsModel;

public class RetrieveApps extends AbstractTask
{
	private static final String LCAT = "TiRetrApps";

	private static final String APPS_JSON_URL = "http://publisher.titaniumapp.com/api/app-list";

	private AppsModel model;

	public RetrieveApps(IProgressManager progress, AppsModel model)
	{
		super(progress);
		this.model = model;

	}

	@Override
	protected void doTask() {
		if(App.getApp().canUseNetwork()) {
	   		HttpGet httpGet = new HttpGet(APPS_JSON_URL);
	   		HttpClient client = new DefaultHttpClient();
	   		ResponseHandler<String> responseHandler = new BasicResponseHandler();
	   		try {
	   			String json = client.execute(httpGet, responseHandler);
	   			Log.d(LCAT, "Received JSON for apps");
	   			model.updateApps(json);
	   		} catch (Throwable t) {
	   			Log.e(LCAT, "Error retrieving applications", t);
	   		}
		} else {
			App.getApp().toastShort(R.string.no_network);
		}
	}

}
