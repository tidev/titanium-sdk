/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiActivityWindow;
import org.appcelerator.titanium.TiActivityWindows;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
import android.os.Message;
import android.os.Messenger;

@Kroll.proxy(creatableInModule=UIModule.class)
public class WindowProxy extends TiWindowProxy
{
	private static final String LCAT = "WindowProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int MSG_FIRST_ID = TiWindowProxy.MSG_LAST_ID + 1;
	private static final int MSG_FINISH_OPEN = MSG_FIRST_ID + 100;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	ArrayList<TiViewProxy> views;
	WeakReference<Activity> weakActivity;
	String windowId;

	public WindowProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	
	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put("title", "titleid");
		table.put("titlePrompt", "titlepromptid");
		return table;
	}
	

	@Override
	public TiUIView getView(Activity activity)
	{
		throw new IllegalStateException("call to getView on a Window");
	}

	protected TiUIWindow getWindow()
	{
		return (TiUIWindow) view;
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch(msg.what) {
			case MSG_FINISH_OPEN: {
				realizeViews(getTiContext().getActivity(), view);
				if (tab == null) {
					//TODO attach window
				}
				opened = true;
				handlePostOpen();
				fireEvent(TiC.EVENT_OPEN, null);
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
		if (DBG) {
			Log.d(LCAT, "handleOpen");
		}

		Log.i(LCAT, "handleOpen: this =" + this);
		Messenger messenger = new Messenger(getUIHandler());
		view = new TiUIWindow(this, options, messenger, MSG_FINISH_OPEN);

		// make sure the window opens according to any orientation modes 
		// set on it before the window actually opened
		//if (((TiUIWindow) view).lightWeight)
		//{
		//	updateOrientation();
		//}
	}

	public void fillIntentForTab(Intent intent)
	{
		intent.putExtra(TiC.INTENT_PROPERTY_USE_ACTIVITY_WINDOW, true);
		int windowId = TiActivityWindows.addWindow(new TiActivityWindow() {
			@Override
			public void windowCreated(TiBaseActivity activity)
			{
				view = new TiUIWindow(WindowProxy.this, activity);
				realizeViews(null, view);
				opened = true;
				fireEvent(TiC.EVENT_OPEN, null);
				TiMessageQueue.getMainMessageQueue().stopBlocking();
			}
		});
		intent.putExtra(TiC.INTENT_PROPERTY_WINDOW_ID, windowId);
	}

	@Override
	protected void handleClose(KrollDict options)
	{
		if (DBG) {
			Log.d(LCAT, "handleClose");
		}

		TiUIWindow window = getWindow();

		// store before as the call to window.close will set the view to
		// null and making checking after close is called impossible
		boolean isLightweight = false;
		if(window.lightWeight) {
			Log.i(LCAT, "handleClose- LW");
			isLightweight = true;
		}

		if (window != null) {
			Log.i(LCAT, "window.close(options)");
			window.close(options);
		}
		releaseViews();

		if(isLightweight) {
			opened = false;
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
	
	@Kroll.setProperty @Kroll.method
	public void setLeftNavButton(ButtonProxy button)
	{
		Log.w(LCAT, "setLeftNavButton not supported in Android");
	}
	
	@Override
	protected Activity handleGetActivity() 
	{
		if (view == null) return null;
		return ((TiUIWindow)view).getActivity();
	}
}
