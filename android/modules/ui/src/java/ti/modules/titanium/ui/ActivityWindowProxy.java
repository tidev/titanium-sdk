/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiActivityWindow;
import org.appcelerator.titanium.TiActivityWindows;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
import android.os.Message;
import android.os.Messenger;


@Kroll.proxy(creatableInModule=UIModule.class)
public class ActivityWindowProxy extends TiWindowProxy
{
	private static final String TAG = "ActivityWindowProxy";
	private static final int MSG_FIRST_ID = TiWindowProxy.MSG_LAST_ID + 1;
	private static final int MSG_FINISH_OPEN = MSG_FIRST_ID + 100;

	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	protected String windowId;
	protected boolean useCurrentActivity;


	@Override
	public void handleCreationDict(KrollDict options)
	{
		super.handleCreationDict(options);

		Object useCurrentActivity = options.get("useCurrentActivity");
		if (useCurrentActivity != null) {
			this.useCurrentActivity = TiConvert.toBoolean(useCurrentActivity);
		}
	}

	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_TITLE, TiC.PROPERTY_TITLEID);
		table.put(TiC.PROPERTY_TITLE_PROMPT, TiC.PROPERTY_TITLE_PROMPTID);

		return table;
	}
	

	@Override
	public TiUIView getOrCreateView()
	{
		throw new IllegalStateException("call to getView on an ActivityWindow");
	}

	protected TiUIActivityWindow getWindow()
	{
		return (TiUIActivityWindow) view;
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch(msg.what) {
			case MSG_FINISH_OPEN: {
				realizeViews(view);

				if (tab == null) {
					//TODO attach window
				}

				opened = true;
				handlePostOpen();

				return true;
			}
			default : {
				return super.handleMessage(msg);
			}
		}
	}

	@Override
	protected void handleOpen(KrollDict options)
	{
		Log.d(TAG, "handleOpen", Log.DEBUG_MODE);

		Messenger messenger = new Messenger(getMainHandler());

		if (useCurrentActivity) {
			Activity activity = TiApplication.getInstance().getCurrentActivity();
			if (activity instanceof TiBaseActivity) {
				view = new TiUIActivityWindow(this, (TiBaseActivity) activity, messenger, MSG_FINISH_OPEN);
			}

		} else {
			view = new TiUIActivityWindow(this, options, messenger, MSG_FINISH_OPEN);
		}
	}

	public void fillIntentForTab(Intent intent, TabProxy tab)
	{
		intent.putExtra(TiC.INTENT_PROPERTY_USE_ACTIVITY_WINDOW, true);

		int windowId = TiActivityWindows.addWindow(new TiActivityWindow() {
			@Override
			public void windowCreated(TiBaseActivity activity)
			{
				// This is the callback when a window associated with a tab is created.
				// Since TiUIActivityWindow.bindProxies isn't called here, 
				// we call setWindowProxy directly to make sure the activity->window
				// association is correctly initialized.
				activity.setWindowProxy(ActivityWindowProxy.this);
				view = new TiUIActivityWindow(ActivityWindowProxy.this, activity);

				realizeViews(view);
				opened = true;
				fireEvent(TiC.EVENT_OPEN, null, false);
			}
		});

		tab.setWindowId(windowId);
		intent.putExtra(TiC.INTENT_PROPERTY_WINDOW_ID, windowId);
		intent.putExtra(TiC.INTENT_PROPERTY_IS_TAB, true);
	}

	@Override
	protected void handleClose(KrollDict options)
	{
		Log.d(TAG, "handleClose", Log.DEBUG_MODE);

		TiUIActivityWindow window = getWindow();

		if (window != null) {
			window.close(options);
		}
	}

	@Kroll.getProperty @Kroll.method
	public TiViewProxy getTab()
	{
		return tab;
	}

	@Kroll.getProperty @Kroll.method
	public TiViewProxy getTabGroup()
	{
		return tabGroup;
	}

	/*
	@Kroll.setProperty @Kroll.method
	public void setLeftNavButton(ButtonProxy button)
	{
		Log.w(LCAT, "setLeftNavButton not supported in Android");
	}

	@Kroll.method @Kroll.getProperty
	public int getOrientation()
	{
		Activity activity = getActivity();

		if (activity != null)
		{
			return TiOrientationHelper.convertConfigToTiOrientationMode(activity.getResources().getConfiguration().orientation);
		}

		Log.e(LCAT, "unable to get orientation, activity not found for window");
		return TiOrientationHelper.ORIENTATION_UNKNOWN;
	}

	@Kroll.method @Kroll.getProperty
	public int getWindowPixelFormat() 
	{
		int pixelFormat = PixelFormat.UNKNOWN;
		
		if (hasProperty(TiC.PROPERTY_WINDOW_PIXEL_FORMAT)) {
			pixelFormat = TiConvert.toInt(getProperty(TiC.PROPERTY_WINDOW_PIXEL_FORMAT));
		}

		return pixelFormat;
	}

	@Kroll.method @Kroll.setProperty(retain=false)
	public void setWindowPixelFormat(int pixelFormat)
	{
		setProperty(TiC.PROPERTY_WINDOW_PIXEL_FORMAT, pixelFormat, true);
	}
	*/

	@Override
	protected Activity getWindowActivity() 
	{
		TiUIActivityWindow window = getWindow();
		if (window != null) {
			return window.getActivity();
		}

		return null;
	}
}
