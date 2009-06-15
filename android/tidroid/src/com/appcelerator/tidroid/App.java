// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid;


import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Handler;
import android.widget.Toast;

import com.appcelerator.tidroid.model.AppDatabase;
import com.appcelerator.tidroid.model.AppsModel;
import com.appcelerator.tidroid.model.CommunityModel;

public class App extends Application implements IProgressManager
{
	private static App me;

	private TaskManager taskMgr;
	private PackageManager tipm;
	private AppDatabase appDb;
	private Handler uiHandler;
	private ConnectivityManager connectivityManager;

	private CommunityModel communityModel;
	private AppsModel appsModel;
	private IProgressManager progressProxy;

	public App()
	{
		if (me == null) {
			me = this;
		} else {
			throw new IllegalStateException("Only one instance of App is allowed");
		}
	}

	public static App getApp() {
		return me;
	}

	@Override
	public void onCreate() {
		super.onCreate();

		this.taskMgr = new TaskManager();
		this.tipm = new PackageManager(this);
		this.appDb = new AppDatabase(this);
		this.uiHandler = new Handler();

		this.communityModel = new CommunityModel(this.appDb);
		this.appsModel = new AppsModel(this.appDb);

		this.connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
	}

	public void setProgressProxy(IProgressManager progressProxy) {
		this.progressProxy = progressProxy;
	}

	public PackageManager getTipm() {
		return tipm;
	}

	public AppDatabase getAppDb() {
		return appDb;
	}

	public TaskManager getTaskManager() {
		return taskMgr;
	}

	public CommunityModel getCommunityModel() {
		return communityModel;
	}

	public AppsModel getAppsModel() {
		return appsModel;
	}

	public void startBackgroundProcessing() {
		Intent intent = new Intent(this, TaskManager.class);
		startService(intent);

	}

	public void stopBackgroundProcessing() {
		Intent intent = new Intent(this, TaskManager.class);
		stopService(intent);
	}

	public void setProgressOn(boolean enabled) {
		if (progressProxy != null) {
			progressProxy.setProgressOn(enabled);
		}
	}

	public void toastShort(final int id) {
		final Context context = this;
		uiHandler.post(new Runnable(){
			public void run() {
				Toast.makeText(context, id, Toast.LENGTH_SHORT).show();
			}});
	}
	public boolean canUseNetwork() {
		NetworkInfo ni = connectivityManager.getActiveNetworkInfo();
		boolean result = false;

		if(ni != null && ni.isAvailable() && ni.isConnected()) {
			result = true;
		}

		return result;
	}
}
