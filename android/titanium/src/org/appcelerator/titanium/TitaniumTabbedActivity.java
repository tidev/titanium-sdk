/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumAppInfo;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.app.Activity;
import android.app.ActivityGroup;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.util.Config;
import android.util.Log;
import android.view.KeyEvent;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TabHost;
import android.widget.TabWidget;

public class TitaniumTabbedActivity extends ActivityGroup
{
	private static final String LCAT = "TiTabbedActivity";
	private static final boolean DBG = Config.LOGD;

	protected TitaniumAppInfo appInfo;

	public TitaniumTabbedActivity()
	{
	}

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);

        TitaniumIntentWrapper intent = new TitaniumIntentWrapper(getIntent());

        if (getIntent() != null) {
        	appInfo = intent.getAppInfo(this);
         } else {
        	if (DBG) {
        		Log.d(LCAT, "Intent was empty");
        	}
        }

        TabHost tabHost = new TabHost(this);
        LinearLayout.LayoutParams linearParams = new LinearLayout.LayoutParams(
                LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);

        //tabHost.setLayoutParams(linearParams);

        TabWidget tabWidget = new TabWidget(this);

        tabWidget.setId(android.R.id.tabs);
        tabWidget.setPadding(0, 4, 0, 0);
        tabHost.addView(tabWidget, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT));
        FrameLayout frameLayout = new FrameLayout(this);
        frameLayout.setId(android.R.id.tabcontent);
        frameLayout.setPadding(0, 68, 0, 0);
        tabHost.addView(frameLayout, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));

        tabHost.setup(getLocalActivityManager());

        ArrayList<TitaniumWindowInfo> windows = appInfo.getWindows();
        int len = windows.size();
        for (int i = 0; i < len; i++) {
        	TitaniumWindowInfo info = windows.get(i);

			TabHost.TabSpec spec = null;
			spec = tabHost.newTabSpec(info.getWindowId());

			String windowIconUrl = info.getWindowIconUrl();

			if (windowIconUrl != null) {
				Drawable d = null;
				InputStream is = null;
				try {
					TitaniumFileHelper tfh = new TitaniumFileHelper(this);
					is = tfh.openInputStream(windowIconUrl, intent.isContent(), false);
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
			TitaniumIntentWrapper tabIntent = new TitaniumIntentWrapper(new Intent(this, activity));
			tabIntent.setAppInfoId(intent.getAppInfoId());
			tabIntent.setWindowId(info.getWindowId());
			tabIntent.setIsContent(intent.isContent());
			tabIntent.updateUsing(info);
			spec.setContent(tabIntent.getIntent());

			tabHost.addTab(spec);
        }

 		setContentView(tabHost,linearParams);
	}

	@Override
	public void finishFromChild(Activity child) {
		//super.finishFromChild(child);
	}


	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		Log.e(LCAT, "Tabbed Activity Received Result!");
		super.onActivityResult(requestCode, resultCode, data);
	}

	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		/*
        if ((keyCode == KeyEvent.KEYCODE_BACK)) {
        	if (DBG) {
        		Log.d(LCAT, "Tab Activity got back, passing to parent.");
        	}
    		return getParent().onKeyDown(keyCode, event);
        }
        return super.onKeyDown(keyCode, event);
        */
		return false;
	}
}
