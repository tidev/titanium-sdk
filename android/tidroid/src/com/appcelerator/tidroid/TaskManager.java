// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import android.app.Service;
import android.content.Intent;
import android.net.Uri;
import android.os.IBinder;
import android.util.Log;

import com.appcelerator.tidroid.task.RetrieveApps;
import com.appcelerator.tidroid.task.TwitterSearch;

public class TaskManager extends Service
{
	private static final String LCAT = "TiTaskMgr";

	ExecutorService tasks;
	App app;

	public TaskManager()
	{
	}

	@Override
	public void onCreate()
	{
		Log.d(LCAT, "Enter onCreate");
		super.onCreate();

		this.app = App.getApp();
		this.tasks = Executors.newSingleThreadExecutor();

		Log.d(LCAT, "Exit onCreate");
	}


	@Override
	public void onDestroy() {
		Log.d(LCAT, "Enter OnDestroy");
		super.onDestroy();

		if (!tasks.isShutdown()) {
			tasks.shutdownNow();
			Log.i(LCAT, "Sent shutdown to tasks queue.");
		}
		Log.d(LCAT, "Exit OnDestroy");
	}


	@Override
	public void onLowMemory() {
		Log.d(LCAT, "Enter onLowMemory");
		super.onLowMemory();
		Log.d(LCAT, "Exit onLowMemory");
	}


	@Override
	public void onStart(Intent intent, int startId)
	{
		Log.d(LCAT, "Enter onStart");
		super.onStart(intent, startId);

		Uri uri = intent.getData();
		if (uri != null) {
			if ("task".equals(uri.getScheme())) {
				String authority = uri.getAuthority();
				if ("twittersearch".equals(authority)) {
					tasks.execute(new TwitterSearch(app, app.getCommunityModel()));
				} else if ("getapps".equals(authority)) {
					tasks.execute(new RetrieveApps(app, app.getAppsModel()));
				} else {
					Log.e(LCAT, "Unknown task: " + uri.getAuthority());
				}
			} else {
				Log.e(LCAT, "Unknown scheme: " + uri.getScheme());
			}
		}

		Log.d(LCAT, "Exit onStart");
	}


	@Override
	public IBinder onBind(Intent intent) {
		// TODO Auto-generated method stub
		return null;
	}

}
