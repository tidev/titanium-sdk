// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Resources;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.Window;
import android.webkit.WebView;
import android.widget.ListView;
import android.widget.TabHost;

import com.appcelerator.tidroid.model.AppsModelListener;
import com.appcelerator.tidroid.model.CommunityModelListener;

public class Titanium extends Activity implements CommunityModelListener, AppsModelListener, IProgressManager
{
	private static final String LCAT = "Titanium";

	private static final int PREFS_ACTIVITY = 1;
	private static final int REFRESH_ACTIVITY = 2;
	//private static final int INSTALL_ACTIVITY = 1;
	//private static final int UNINSTALL_ACTIVITY = 4;

	private static final String TAG_COMMUNITY = "tagCommunity";
	private static final String TAG_APPS = "tagApps";
	private static final String TAG_PROFILE = "tagProfile";

	protected PackageManager tipm;
	protected Handler handler;

	protected App app;
	protected TabHost tabs;

	protected WebView communityView;
	protected ListView appsView;

	public PackageManager getTipm() {
		return tipm;
	}

	public Handler getHandler() {
		return handler;
	}

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
    	Log.d(LCAT, "Enter onCreate");
        super.onCreate(savedInstanceState);

        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
        this.requestWindowFeature(Window.FEATURE_PROGRESS);
        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);

        setContentView(R.layout.tabbedmain);

        this.app = App.getApp();
        this.tipm = app.getTipm();
        this.handler = new Handler();
        this.tabs=(TabHost)findViewById(R.id.tabhost);
        app.setProgressProxy(this);

        tabs.setup();

        TabHost.TabSpec spec= null;

        Resources res = getResources();

        spec=tabs.newTabSpec(TAG_COMMUNITY);
        spec.setContent(R.id.tab_community);
        spec.setIndicator(getString(R.string.community_tab_title), res.getDrawable(R.drawable.community));
        tabs.addTab(spec);

        spec=tabs.newTabSpec(TAG_APPS);
        spec.setContent(R.id.tab_apps);
        spec.setIndicator("Apps");
        spec.setIndicator(getString(R.string.apps_tab_title), res.getDrawable(R.drawable.apps));
        tabs.addTab(spec);

        spec=tabs.newTabSpec(TAG_PROFILE);
        spec.setContent(R.id.tab_profile);
        spec.setIndicator("Profile");
        spec.setIndicator(getString(R.string.profile_tab_title), res.getDrawable(R.drawable.profile));
        tabs.addTab(spec);

        tabs.setCurrentTab(0); //TODO default to 0

        communityView = (WebView) findViewById(R.id.tab_community);
        appsView = (ListView) findViewById(R.id.tab_apps);
        appsView.setFocusableInTouchMode(false);
        updateViews();


        Log.d(LCAT, "Exit onCreate");
    }

	@Override
	protected void onStart()
	{
		Log.d(LCAT, "Enter onStart");
		super.onStart();
		app.startBackgroundProcessing();
		Log.d(LCAT, "Exit onStart");
	}

	@Override
	protected void onResume() {
		super.onResume();
		Log.d(LCAT, "onResume - Updating display");

		app.getCommunityModel().setModelChangeListener(this); //TODO use list
		app.getAppsModel().setModelChangeListener(this);
 	}

	@Override
	protected void onPause() {
		Log.d(LCAT, "Enter onPause");
		super.onPause();

		app.getAppsModel().setModelChangeListener(null);
		app.getCommunityModel().setModelChangeListener(null); //TODO use list
		Log.d(LCAT, "Exit onPause");
	}

	@Override
	protected void onStop() {
		Log.d(LCAT, "Enter onStop");
		super.onStop();
		app.stopBackgroundProcessing();
//        app.getTaskManager().setProgressManager(null);
		Log.d(LCAT, "Exit onStop");
	}

	@Override
	protected void onDestroy() {
		super.onDestroy(); //TODO remove override if not used
	}


	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		super.onCreateOptionsMenu(menu);

		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.timenu, menu);

		return true;
	}

	@Override
	public boolean onPrepareOptionsMenu(Menu menu) {
		return super.onPrepareOptionsMenu(menu);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		Log.d(LCAT, "onActivityResult: requestCode=" + requestCode + " resultCode=" + resultCode);
		super.onActivityResult(requestCode, resultCode, data);
		switch(requestCode) {
		case PREFS_ACTIVITY :
			updateViews();
			break;
		case REFRESH_ACTIVITY :
			break;
		default :
			Log.w(LCAT, "Unknown ActivityResult id: " + requestCode);
		}
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		super.onOptionsItemSelected(item);

		Intent i = null;

		switch(item.getItemId()) {
		case R.id.about :
			i = new Intent(this, About.class);
			startActivity(i);
			return true;
		case R.id.refresh :
			Intent intent = new Intent(this, TaskManager.class);

			String tag = tabs.getCurrentTabTag();
			if (TAG_COMMUNITY.equals(tag)) {
				intent.setData(Uri.parse("task://twittersearch"));
				app.startService(intent);
			} else if (TAG_APPS.equals(tag)) {
				intent.setData(Uri.parse("task://getapps"));
				app.startService(intent);
			} else {
				Log.e(LCAT, "UNHANDLED TAB!!!");
			}

			return true;
		case R.id.settings :
			i = new Intent(this, EditPreferences.class);
			startActivityForResult(i, PREFS_ACTIVITY);
			return true;
		}

		return false;
	}


	/*
	@Override
	public boolean onPrepareOptionsMenu(Menu menu) {
		super.onPrepareOptionsMenu(menu);

		if(getTipm().isAppInstalled()) {
			menu.setGroupVisible(R.id.menu_group_app_installed, true);
			menu.setGroupVisible(R.id.menu_group_app_uninstalled, false);
		} else {
			menu.setGroupVisible(R.id.menu_group_app_installed, false);
			menu.setGroupVisible(R.id.menu_group_app_uninstalled, true);
		}

		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		super.onOptionsItemSelected(item);

		Intent i = null;

		switch(item.getItemId()) {
		case R.id.about :
			i = new Intent(this, About.class);
			startActivity(i);
			return true;
		case R.id.install :
			i = new Intent(this, Market.class);
			startActivityForResult(i, INSTALL_ACTIVITY);
			return true;
		case R.id.launch :
			i = new Intent(this, TitaniumApp.class);
			startActivity(i);
			return true;
		case R.id.refresh :
			i = new Intent(this, AppRefresh.class);
			startActivityForResult(i, REFRESH_ACTIVITY);
			return true;
		case R.id.settings :
			i = new Intent(this, EditPreferences.class);
			startActivityForResult(i, PREFS_ACTIVITY);
			return true;
		case R.id.uninstall :
			i = new Intent(this, Uninstall.class);
			startActivityForResult(i, UNINSTALL_ACTIVITY);
			return true;
		}

		return false;
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data)
	{
		Log.d(LCAT, "onActivityResult: requestCode=" + requestCode + " resultCode=" + resultCode);
		super.onActivityResult(requestCode, resultCode, data);
		switch(requestCode) {
		case PREFS_ACTIVITY :
		case UNINSTALL_ACTIVITY :
			break;
		case INSTALL_ACTIVITY :
			// TODO get install location from Intent and install the app
			//      if not canceled
			break;
		case REFRESH_ACTIVITY :
			// TODO redownload app
			break;
		default :
			Log.w(LCAT, "Unknown ActivityResult id: " + requestCode);
		}

 	}
*/
	private void updateViews() {
		updateCommunityView();
		updateAppsView();
	}

	private void updateCommunityView()
	{
		handler.post(new Runnable(){

			public void run() {
				setProgressOn(true);
				String s = app.getCommunityModel().twitterToHtml();
				communityView.loadDataWithBaseURL(null, s, "text/html", "UTF-8", null);
				setProgressOn(false);
			}});
	}

	private void updateAppsView()
	{
		final Titanium fthis = this;

		handler.post(new Runnable(){

			public void run() {
				Log.d(LCAT, "Updating Apps View");
				setProgressOn(true);
				appsView.setAdapter(new AppsViewAdapter(fthis, app.getAppsModel().getAppsList()));
				setProgressOn(false);
			}});
	}

	public void onCommunityChanged() {
		updateCommunityView();
	}

	public void onAppsChanged() {
		updateAppsView();
	}

	public void setProgressOn(final boolean progressOn)
	{
		handler.post(new Runnable() {
			public void run() {
				setProgressBarVisibility(progressOn);
			}});
	}
}