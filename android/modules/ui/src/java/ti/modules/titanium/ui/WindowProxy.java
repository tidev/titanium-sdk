/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui;

import java.lang.ref.WeakReference;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiActivityWindow;
import org.appcelerator.titanium.TiActivityWindows;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiTranslucentActivity;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.DecorViewProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiView;
import android.app.Activity;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Message;
import android.view.ViewGroup.LayoutParams;
import android.view.Window;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors={
	TiC.PROPERTY_MODAL,
	TiC.PROPERTY_URL,
	TiC.PROPERTY_WINDOW_PIXEL_FORMAT
})
public class WindowProxy extends TiWindowProxy implements TiActivityWindow
{
	private static final String TAG = "WindowProxy";
	private static final String PROPERTY_POST_WINDOW_CREATED = "postWindowCreated";
	private static final String PROPERTY_LOAD_URL = "loadUrl";

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_SET_PIXEL_FORMAT = MSG_FIRST_ID + 100;
	private static final int MSG_SET_TITLE = MSG_FIRST_ID + 101;
	private static final int MSG_SET_WIDTH_HEIGHT = MSG_FIRST_ID + 102;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private WeakReference<TiBaseActivity> windowActivity;

	// This flag is just for a temporary use. We won't need it after the lightweight window
	// is completely removed.
	private boolean lightweight = false;


	public WindowProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_WINDOW_PIXEL_FORMAT, PixelFormat.UNKNOWN);
	}

	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_TITLE, TiC.PROPERTY_TITLEID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		TiUIView v = new TiView(this);
		v.getLayoutParams().autoFillsHeight = true;
		v.getLayoutParams().autoFillsWidth = true;
		setView(v);
		return v;
	}

	public void addLightweightWindowToStack() 
	{
		// Add LW window to the decor view and add it to stack.
		Activity topActivity = TiApplication.getAppCurrentActivity();
		if (topActivity instanceof TiBaseActivity) {
			TiBaseActivity baseActivity = (TiBaseActivity) topActivity;
			ActivityProxy activityProxy = baseActivity.getActivityProxy();
			if (activityProxy != null) {
				DecorViewProxy decorView = activityProxy.getDecorView();
				if (decorView != null) {
					decorView.add(this);
					windowActivity = new WeakReference<TiBaseActivity>(baseActivity);

					// Need to handle the url window in the JS side.
					callPropertySync(PROPERTY_LOAD_URL, null);

					opened = true;
					fireEvent(TiC.EVENT_OPEN, null);

					baseActivity.addWindowToStack(this);
					return;
				}
			}
		}
		Log.e(TAG, "Unable to open the lightweight window because the current activity is not available.");
	}

	public void removeLightweightWindowFromStack()
	{
		// Remove LW window from decor view and remove it from stack
		TiBaseActivity activity = (windowActivity != null) ? windowActivity.get() : null;
		if (activity != null) {
			ActivityProxy activityProxy = activity.getActivityProxy();
			if (activityProxy != null) {
				activityProxy.getDecorView().remove(this);
			}
			releaseViews();
			opened = false;

			activity.removeWindowFromStack(this);
			fireEvent(TiC.EVENT_CLOSE, null);
		}
	}

	@Override
	public void open(@Kroll.argument(optional = true) Object arg)
	{
		HashMap<String, Object> option = null;
		if (arg instanceof HashMap) {
			option = (HashMap<String, Object>) arg;
		}
		if (option != null) {
			properties.putAll(option);
		}

		if (hasProperty(TiC.PROPERTY_ORIENTATION_MODES)) {
			Object obj = getProperty(TiC.PROPERTY_ORIENTATION_MODES);
			if (obj instanceof Object[]) {
				orientationModes = TiConvert.toIntArray((Object[]) obj);
			}
		}

		// When we open a window using tab.open(win), we treat it as opening a HW window on top of the tab.
		if (hasProperty("tabOpen")) {
			lightweight = false;

		// The property "ti.android.useLegacyWindow" is introduced in SDK 3.2.0.
		// If "ti.android.useLegacyWindow" is set to true in the tiapp.xml, follow the old window behavior:
		// create a HW window if any of the four properties, "fullscreen", "navBarHidden", "windowSoftInputMode" and
		// "modal", is specified; otherwise create a LW window.
		} else if (TiApplication.USE_LEGACY_WINDOW && !hasProperty(TiC.PROPERTY_FULLSCREEN)
			&& !hasProperty(TiC.PROPERTY_NAV_BAR_HIDDEN) && !hasProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE)
			&& !hasProperty(TiC.PROPERTY_MODAL)) {
			lightweight = true;
		}

		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "open the window: lightweight = " + lightweight);
		}

		if (lightweight) {
			addLightweightWindowToStack();
		} else {
			// The "top", "bottom", "left" and "right" properties do not work for heavyweight windows.
			properties.remove(TiC.PROPERTY_TOP);
			properties.remove(TiC.PROPERTY_BOTTOM);
			properties.remove(TiC.PROPERTY_LEFT);
			properties.remove(TiC.PROPERTY_RIGHT);
			super.open(arg);
		}
	}

	@Override
	public void close(@Kroll.argument(optional = true) Object arg)
	{
		if (!(opened || opening)) {
			return;
		}
		if (lightweight) {
			removeLightweightWindowFromStack();
		} else {
			super.close(arg);
		}
	}

	@Override
	protected void handleOpen(KrollDict options)
	{
		Activity topActivity = TiApplication.getAppCurrentActivity();
		Intent intent = new Intent(topActivity, TiActivity.class);
		fillIntent(topActivity, intent);

		int windowId = TiActivityWindows.addWindow(this);
		intent.putExtra(TiC.INTENT_PROPERTY_USE_ACTIVITY_WINDOW, true);
		intent.putExtra(TiC.INTENT_PROPERTY_WINDOW_ID, windowId);

		boolean animated = TiConvert.toBoolean(options, TiC.PROPERTY_ANIMATED, true);
		if (!animated) {
			intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION);
			topActivity.startActivity(intent);
			topActivity.overridePendingTransition(0, 0); // Suppress default transition.
		} else if (options.containsKey(TiC.INTENT_PROPERTY_ENTER_ANIMATION)
			|| options.containsKey(TiC.INTENT_PROPERTY_EXIT_ANIMATION)) {
			topActivity.startActivity(intent);
			topActivity.overridePendingTransition(TiConvert.toInt(options.get(TiC.INTENT_PROPERTY_ENTER_ANIMATION), 0),
				TiConvert.toInt(options.get(TiC.INTENT_PROPERTY_EXIT_ANIMATION), 0));
		} else {
			topActivity.startActivity(intent);
		}
	}

	@Override
	protected void handleClose(KrollDict options)
	{
		boolean animated = TiConvert.toBoolean(options, TiC.PROPERTY_ANIMATED, true);
		TiBaseActivity activity = (windowActivity != null) ? windowActivity.get() : null;
		if (activity != null && !activity.isFinishing()) {
			activity.finish();
			if (!animated) {
				activity.overridePendingTransition(0, 0); // Suppress default transition.
			} else if (options.containsKey(TiC.INTENT_PROPERTY_ENTER_ANIMATION)
				|| options.containsKey(TiC.INTENT_PROPERTY_EXIT_ANIMATION)) {
				activity.overridePendingTransition(TiConvert.toInt(options.get(TiC.INTENT_PROPERTY_ENTER_ANIMATION), 0),
					TiConvert.toInt(options.get(TiC.INTENT_PROPERTY_EXIT_ANIMATION), 0));
			}

			// Finishing an activity is not synchronous, so we remove the activity from the activity stack here
			TiApplication.removeFromActivityStack(activity);
			windowActivity = null;
		}
	}

	@SuppressWarnings("unchecked")
	@Override
	public void windowCreated(TiBaseActivity activity) {
		windowActivity = new WeakReference<TiBaseActivity>(activity);
		activity.setWindowProxy(this);
		setActivity(activity);

		// Handle the "activity" property.
		ActivityProxy activityProxy = activity.getActivityProxy();
		KrollDict options = null;
		if (hasProperty(TiC.PROPERTY_ACTIVITY)) {
			Object activityObject = getProperty(TiC.PROPERTY_ACTIVITY);
			if (activityObject instanceof HashMap<?, ?>) {
				options = new KrollDict((HashMap<String, Object>) activityObject);
				activityProxy.handleCreationDict(options);
			}
		}

		Window win = activity.getWindow();
		// Handle the background of the window activity if it is a translucent activity.
		// If it is a modal window, set a translucent dimmed background to the window.
		// If the opacity is given, set a transparent background to the window. In this case, if no backgroundColor or
		// backgroundImage is given, the window will be completely transparent.
		boolean modal = TiConvert.toBoolean(getProperty(TiC.PROPERTY_MODAL), false);
		Drawable background = null;
		if (modal) {
			background = new ColorDrawable(0x9F000000);
		} else if (hasProperty(TiC.PROPERTY_OPACITY)) {
			background = new ColorDrawable(0x00000000);
		}
		if (background != null) {
			win.setBackgroundDrawable(background);
		}

		// Handle the width and height of the window.
		if (hasProperty(TiC.PROPERTY_WIDTH) || hasProperty(TiC.PROPERTY_HEIGHT)) {
			int w = TiConvert.toInt(getProperty(TiC.PROPERTY_WIDTH), LayoutParams.MATCH_PARENT);
			int h = TiConvert.toInt(getProperty(TiC.PROPERTY_HEIGHT), LayoutParams.MATCH_PARENT);
			win.setLayout(w, h);
		}

		activity.getActivityProxy().getDecorView().add(this);
		activity.addWindowToStack(this);

		// Need to handle the cached activity proxy properties and url window in the JS side.
		callPropertySync(PROPERTY_POST_WINDOW_CREATED, null);
	}

	@Override
	public void onWindowActivityCreated()
	{
		// Fire the open event after setContentView() because getActionBar() need to be called
		// after setContentView(). (TIMOB-14914)
		opened = true;
		opening = false;
		fireEvent(TiC.EVENT_OPEN, null);
		handlePostOpen();

		super.onWindowActivityCreated();
	}

	@Override
	protected Activity getWindowActivity()
	{
		return (windowActivity != null) ? windowActivity.get() : null;
	}

	private void fillIntent(Activity activity, Intent intent)
	{
		if (hasProperty(TiC.PROPERTY_FULLSCREEN)) {
			intent.putExtra(TiC.PROPERTY_FULLSCREEN, TiConvert.toBoolean(getProperty(TiC.PROPERTY_FULLSCREEN), false));
		}
		if (hasProperty(TiC.PROPERTY_NAV_BAR_HIDDEN)) {
			intent.putExtra(TiC.PROPERTY_NAV_BAR_HIDDEN, TiConvert.toBoolean(getProperty(TiC.PROPERTY_NAV_BAR_HIDDEN), false));
		}
		if (hasProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE)) {
			intent.putExtra(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, TiConvert.toInt(getProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE), -1));
		}
		if (hasProperty(TiC.PROPERTY_EXIT_ON_CLOSE)) {
			intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, TiConvert.toBoolean(getProperty(TiC.PROPERTY_EXIT_ON_CLOSE), false));
		}
		boolean modal = false;
		if (hasProperty(TiC.PROPERTY_MODAL)) {
			modal = TiConvert.toBoolean(getProperty(TiC.PROPERTY_MODAL), false);
			if (modal) {
				intent.setClass(activity, TiTranslucentActivity.class);
			}
			intent.putExtra(TiC.PROPERTY_MODAL, modal);
		}
		if (!modal && hasProperty(TiC.PROPERTY_OPACITY)) {
			intent.setClass(activity, TiTranslucentActivity.class);
		}
		if (hasProperty(TiC.PROPERTY_WINDOW_PIXEL_FORMAT)) {
			intent.putExtra(TiC.PROPERTY_WINDOW_PIXEL_FORMAT, TiConvert.toInt(getProperty(TiC.PROPERTY_WINDOW_PIXEL_FORMAT), PixelFormat.UNKNOWN));
		}
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		if (!lightweight) {
			if (TiC.PROPERTY_WINDOW_PIXEL_FORMAT.equals(name)) {
				getMainHandler().obtainMessage(MSG_SET_PIXEL_FORMAT, value).sendToTarget();
			} else if (TiC.PROPERTY_TITLE.equals(name)) {
				getMainHandler().obtainMessage(MSG_SET_TITLE, value).sendToTarget();
			} else if (TiC.PROPERTY_TOP.equals(name) || TiC.PROPERTY_BOTTOM.equals(name) || TiC.PROPERTY_LEFT.equals(name)
				|| TiC.PROPERTY_RIGHT.equals(name)) {
				// The "top", "bottom", "left" and "right" properties do not work for heavyweight windows.
				return;
			}
		}

		super.onPropertyChanged(name, value);
	}

	@Override
	@Kroll.setProperty(retain=false) @Kroll.method
	public void setWidth(Object width)
	{
		if (!lightweight) {
			Object current = getProperty(TiC.PROPERTY_WIDTH);
			if (shouldFireChange(current, width)) {
				int w = TiConvert.toInt(width, LayoutParams.MATCH_PARENT);
				int h = TiConvert.toInt(getProperty(TiC.PROPERTY_HEIGHT), LayoutParams.MATCH_PARENT);
				if (TiApplication.isUIThread()) {
					setWindowWidthHeight(w, h);
				} else {
					getMainHandler().obtainMessage(MSG_SET_WIDTH_HEIGHT, w, h).sendToTarget();
				}
			}
		}
		super.setWidth(width);
	}

	@Override
	@Kroll.setProperty(retain=false) @Kroll.method
	public void setHeight(Object height)
	{
		if (!lightweight) {
			Object current = getProperty(TiC.PROPERTY_HEIGHT);
			if (shouldFireChange(current, height)) {
				int h = TiConvert.toInt(height, LayoutParams.MATCH_PARENT);
				int w = TiConvert.toInt(getProperty(TiC.PROPERTY_WIDTH), LayoutParams.MATCH_PARENT);
				if (TiApplication.isUIThread()) {
					setWindowWidthHeight(w, h);
				} else {
					getMainHandler().obtainMessage(MSG_SET_WIDTH_HEIGHT, w, h).sendToTarget();
				}
			}
		}
		super.setHeight(height);
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_SET_PIXEL_FORMAT: {
				Activity activity = getWindowActivity();
				if (activity != null) {
					Window win = activity.getWindow();
					if (win != null) {
						win.setFormat(TiConvert.toInt((Object)(msg.obj), PixelFormat.UNKNOWN));
						win.getDecorView().invalidate();
					}
				}
				return true;
			}
			case MSG_SET_TITLE: {
				Activity activity = getWindowActivity();
				if (activity != null) {
					activity.setTitle(TiConvert.toString((Object)(msg.obj), ""));
				}
				return true;
			}
			case MSG_SET_WIDTH_HEIGHT: {
				setWindowWidthHeight(msg.arg1, msg.arg2);
				return true;
			}
		}
		return super.handleMessage(msg);
	}

	private void setWindowWidthHeight(int w, int h)
	{
		Activity activity = getWindowActivity();
		if (activity != null) {
			Window win = activity.getWindow();
			if (win != null) {
				win.setLayout(w, h);
			}
		}
	}

	@Kroll.method(name = "_getWindowActivityProxy")
	public ActivityProxy getWindowActivityProxy()
	{
		if (opened) {
			return super.getActivityProxy();
		} else {
			return null;
		}
	}

	@Kroll.method(name = "_isLightweight")
	public boolean isLightweight()
	{
		// We know whether a window is lightweight or not only after it opens.
		return (opened && lightweight);
	}
}
