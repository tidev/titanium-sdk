// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;

import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import com.appcelerator.tidroid.R;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.AdapterView.OnItemSelectedListener;

public class AppList extends Activity implements OnItemSelectedListener, OnItemClickListener
{
	private static final String LCAT = "TiAppList";

	TextView textView;
	ListView listView;

	HashMap<String,String> appMap;

	public AppList() {

	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		setContentView(R.layout.list);

		this.textView = (TextView) findViewById(R.id.app_list_repository);
		this.listView = (ListView) findViewById(R.id.app_list);

	   	SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
	   	PackageManager tipm = ((App) getApplication()).getTipm();
	   	appMap = new HashMap<String,String>();

	   	setResult(RESULT_CANCELED, getIntent());

	   	String remote_url = null;

	   	if((remote_url = prefs.getString("repository_url", null)) == null) {
	   		textView.setText("Local");
	   		BufferedReader is = null;
	   		try {
	   			is = new BufferedReader(new InputStreamReader(tipm.openInputStream(Uri.parse("file:///android_asset/titanium/tiapps.json"))), 8096);
	   			StringBuilder sb = new StringBuilder(8096);
	   			String line = null;
	   			while((line = is.readLine()) != null) {
	   				sb.append(line).append("\n");
	   			}

	   			processAppList(sb.toString(), "file:///android_asset/titanium/");

	   		} catch (JSONException e) {
	   			Log.e(LCAT, "Malformed application json file", e);
	   		} catch (IOException e) {
	   			Log.e(LCAT, "Error opening local app json file.",e);
	   		} finally {
	   			if (is != null) {
	   				try {
	   					is.close();
	   				} catch (IOException e) {
	   					// Ignore
	   				}
	   			}
	   		}

	   	} else {
	   		textView.setText("Remote");
	   		StringBuilder sb = new StringBuilder();
	   		sb.append(remote_url);
	   		if (!remote_url.endsWith("/")) {
	   			sb.append("/");
	   		}
	   		String baseUrl = sb.toString();

	   		sb.append("titanium/tiapps.json");
	   		String repository_url = sb.toString();
	   		HttpGet httpGet = new HttpGet(repository_url);
	   		sb = null;

	   		HttpClient client = new DefaultHttpClient();
	   		ResponseHandler<String> responseHandler = new BasicResponseHandler();
	   		try {
	   			String json = client.execute(httpGet, responseHandler);
	   			client.getConnectionManager().shutdown();
	   			processAppList(json, baseUrl + "titanium/");
	   		} catch (Throwable t) {
	   			Log.e(LCAT, "Error retrieving json database from " + repository_url);
	   		}
	   	}
	}

	private void processAppList(String json, String baseUrl)
		throws JSONException
	{
		JSONArray apps = new JSONArray(json);
		ArrayList<String> items = new ArrayList<String>();

		for(int i = 0; i < apps.length(); i++) {
			JSONObject app = apps.getJSONObject(i);
			String name = app.getString("name");
			String archive = app.getString("archive");

			appMap.put(name, baseUrl + archive);

			items.add(name);
		}

		listView.setAdapter(new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, items));
		listView.setOnItemSelectedListener(this);
		listView.setOnItemClickListener(this);

	}

	private void removeListeners() {
		listView.setOnItemClickListener(null);
		listView.setOnItemSelectedListener(null);
	}

	public void onItemSelected(AdapterView<?> parent, View view, int position, long id)
	{
	}

	public void onNothingSelected(AdapterView<?> arg0) {
		// TODO Auto-generated method stub

	}

	public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
		removeListeners();
		String archive = appMap.get((String) parent.getItemAtPosition(position));
		getIntent().setData(Uri.parse(archive));
		setResult(RESULT_OK, getIntent());
		finish();
	}

}
