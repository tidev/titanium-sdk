/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TabHost;
import android.widget.TabWidget;
import android.widget.TabHost.OnTabChangeListener;

public class TitaniumTabbedAppStrategy implements ITitaniumAppStrategy, OnTabChangeListener
{
	private static final String LCAT = "TiTabbedStrategy";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD | true;

	private WeakReference<TitaniumActivityGroup> weakActivityGroup;
	private TabHost tabHost;

	private String lastTabId;
	private int lastTabIndex;

	boolean addedToContentView = false;

	public TitaniumTabbedAppStrategy() {
	}

	public void onCreate(TitaniumActivityGroup tag, Bundle savedInstanceState)
	{
		weakActivityGroup = new WeakReference<TitaniumActivityGroup>(tag);
		TitaniumApplication app = (TitaniumApplication) tag.getApplication();

        tabHost = new TabHost(tag);
        TabWidget tabWidget = new TabWidget(tag);

        tabWidget.setId(android.R.id.tabs);
        tabWidget.setPadding(0, 4, 0, 0);
        tabHost.addView(tabWidget, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT));
        FrameLayout frameLayout = new FrameLayout(tag);
        frameLayout.setId(android.R.id.tabcontent);
        frameLayout.setPadding(0, 68, 0, 0);
        tabHost.addView(frameLayout, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));

        tabHost.setup(tag.getLocalActivityManager());

        ArrayList<TitaniumWindowInfo> windows = app.getAppInfo().getWindows();

        int len = windows.size();
        for (int i = 0; i < len; i++) {
        	TitaniumWindowInfo info = windows.get(i);

        	if (i == 0) {
        		// Initial last tab information to first tab, may want
        		// to change this to an invalid entry to signify first
        		// change.
        		lastTabId = info.getWindowId();
        		lastTabIndex = 0;
        	}

			TabHost.TabSpec spec = null;
			spec = tabHost.newTabSpec(info.getWindowId());

			String windowIconUrl = info.getWindowIconUrl();

			if (windowIconUrl != null) {
				Drawable d = null;
				InputStream is = null;
				try {
					TitaniumFileHelper tfh = new TitaniumFileHelper(tag);
					is = tfh.openInputStream(windowIconUrl, false);
					if (is != null) {
						d = new BitmapDrawable(is);
					}
				} catch (IOException e) {
					Log.e(LCAT, "Unable to process file: " + windowIconUrl, e);
				} finally {
					if (is != null) {
						try {
							is.close();
						} catch (IOException e) {
							//Ignore
						}
					}
				}

				if (d != null) {
					spec.setIndicator(info.getWindowTitle(), d);
				} else {
					spec.setIndicator(info.getWindowTitle());
				}
			} else {
				spec.setIndicator(info.getWindowTitle());
			}

			Class<?> activity = TitaniumApplication.getActivityForType(info.getWindowType());
			TitaniumIntentWrapper tabIntent = new TitaniumIntentWrapper(new Intent(tag, activity));
			tabIntent.updateUsing(info);
			spec.setContent(tabIntent.getIntent());

			tabHost.addTab(spec);
        }

        tabHost.setOnTabChangedListener(this);
	}

	public void attachContentView() {
		if (!addedToContentView) {
	        LinearLayout.LayoutParams linearParams = new LinearLayout.LayoutParams(
	                LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);

	        TitaniumActivityGroup tag = (TitaniumActivityGroup) weakActivityGroup.get();
	        if (tag != null) {
		 		tag.setContentView(tabHost,linearParams);
		 		addedToContentView = true;
	        }
		}
	}

	public void setActiveTab(int index) {
		if (tabHost != null) {
			tabHost.setCurrentTab(index);
		}
	}

	public void onTabChanged(String tabId)
	{
		String data = null;
		try {
			JSONObject o = new JSONObject();
			o.put("prevIndex", lastTabIndex);
			o.put("prevName", lastTabId);
			// remember for next change event.
			lastTabIndex = getTabIndex(tabId);
			lastTabId = tabId;
			o.put("index", lastTabIndex);
			o.put("name", lastTabId);
			data = o.toString();
		} catch (JSONException e) {
			Log.e(LCAT, "Error creating data object for tabchange event: ", e);
		}

		if (data != null) {
			TitaniumActivityGroup tag = weakActivityGroup.get();
			if (tag != null) {
				if (DBG) {
					Log.d(LCAT, "Tab change: " + data);
				}
				tag.dispatchTabChange(data);
			}
		} else {
			Log.w(LCAT, "tabchange event not fired, data object not available.");
		}
	}

	private int getTabIndex(String tabId) {
		int index = 0;
		TitaniumActivityGroup tag = weakActivityGroup.get();
		if (tag != null) {
			TitaniumApplication app = (TitaniumApplication) tag.getApplication();
			ArrayList<TitaniumWindowInfo> windows = app.getAppInfo().getWindows();
			if (windows != null) {
				for(int i = 0; i < windows.size(); i++) {
					TitaniumWindowInfo window = windows.get(i);
					if (window.getWindowId().equals(tabId)) {
						index = i;
						break;
					}
				}
			}
		}
        return index;
	}
}
