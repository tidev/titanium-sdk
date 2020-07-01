/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiLaunchActivity;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiDeviceOrientation;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiWeakList;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityOptionsCompat;
import androidx.core.util.Pair;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import android.view.View;
import android.view.WindowManager;
import android.view.ViewParent;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_EXIT_ON_CLOSE,
	TiC.PROPERTY_FULLSCREEN,
	TiC.PROPERTY_ON_BACK,
	TiC.PROPERTY_TITLE,
	TiC.PROPERTY_TITLEID,
	TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE
})
public abstract class TiWindowProxy extends TiViewProxy
{
	private static final String TAG = "TiWindowProxy";
	protected static final boolean LOLLIPOP_OR_GREATER = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);

	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;

	private static WeakReference<TiWindowProxy> waitingForOpen;
	private TiWeakList<KrollProxy> proxiesWaitingForActivity = new TiWeakList<KrollProxy>();

	protected boolean opened, opening;
	protected boolean isFocused;
	protected int[] orientationModes = null;
	protected TiViewProxy tabGroup;
	protected TiViewProxy tab;
	protected boolean inTab;
	protected PostOpenListener postOpenListener;
	protected boolean windowActivityCreated = false;
	protected List<Pair<View, String>> sharedElementPairs;
	public TiWindowProxy navigationWindow;

	public interface PostOpenListener {
		void onPostOpen(TiWindowProxy window);
	}

	public static TiWindowProxy getWaitingForOpen()
	{
		if (waitingForOpen == null)
			return null;
		return waitingForOpen.get();
	}

	public TiWindowProxy()
	{
		inTab = false;
		if (LOLLIPOP_OR_GREATER) {
			sharedElementPairs = new ArrayList<Pair<View, String>>();
		}
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		throw new IllegalStateException("Windows are created during open");
	}

	@Kroll.method
	@SuppressWarnings("unchecked")
	public void open(@Kroll.argument(optional = true) Object arg)
	{
		if (opened || opening) {
			return;
		}

		waitingForOpen = new WeakReference<TiWindowProxy>(this);
		opening = true;
		KrollDict options = null;
		TiAnimation animation = null;

		if (arg != null) {
			if (arg instanceof KrollDict) {
				options = (KrollDict) arg;

			} else if (arg instanceof HashMap<?, ?>) {
				options = new KrollDict((HashMap<String, Object>) arg);

			} else if (arg instanceof TiAnimation) {
				options = new KrollDict();
				options.put("_anim", animation);
			}

		} else {
			options = new KrollDict();
		}

		handleOpen(options);
	}

	@Kroll.getProperty(name = "closed")
	public boolean isClosed()
	{
		return !opened && !opening;
	}

	@Kroll.getProperty(name = "focused")
	public boolean isFocused()
	{
		return isFocused;
	}

	@SuppressWarnings("unchecked")
	@Kroll.method
	public void close(@Kroll.argument(optional = true) Object arg)
	{
		// TODO: if not opened, ignore? We do this in WindowProxy subclass, but not the other two...
		KrollDict options = null;
		TiAnimation animation = null;

		if (arg != null) {
			if (arg instanceof HashMap<?, ?>) {
				options = new KrollDict((HashMap<String, Object>) arg);

			} else if (arg instanceof TiAnimation) {
				options = new KrollDict();
				options.put("_anim", animation);
			}

		} else {
			options = new KrollDict();
		}

		handleClose(options);
		// FIXME: Maybe fire the close event here and set opened to false as well, rather than leaving to subclasses?
	}

	public void closeFromActivity(boolean activityIsFinishing)
	{
		if (!opened) {
			return;
		}

		KrollDict data = null;
		if (activityIsFinishing) {
			releaseViews();
		} else {
			// If the activity is forced to destroy by Android OS due to lack of memory or
			// enabling "Don't keep activities" (TIMOB-12939), we will not release the
			// top-most view proxy (window and tabgroup).
			releaseViewsForActivityForcedToDestroy();
			data = new KrollDict();
			data.put("_closeFromActivityForcedToDestroy", true);
		}
		opened = false;
		activity = null;

		// Once the window's activity is destroyed we will fire the close event.
		// And it will dispose the handler of the window in the JS if the activity
		// is not forced to destroy.
		fireSyncEvent(TiC.EVENT_CLOSE, data);
	}

	public void addProxyWaitingForActivity(KrollProxy waitingProxy)
	{
		proxiesWaitingForActivity.add(new WeakReference<KrollProxy>(waitingProxy));
	}

	protected void releaseViewsForActivityForcedToDestroy()
	{
		releaseViews();
	}

	@Kroll.method(name = "setTab")
	@Kroll.setProperty(name = "tab")
	public void setTabProxy(TiViewProxy tabProxy)
	{
		setParent(tabProxy);
		this.tab = tabProxy;
	}

	@Kroll.method(name = "getTab")
	@Kroll.getProperty(name = "tab")
	public TiViewProxy getTabProxy()
	{
		return this.tab;
	}

	@Kroll.method(name = "setTabGroup")
	@Kroll.setProperty(name = "tabGroup")
	public void setTabGroupProxy(TiViewProxy tabGroupProxy)
	{
		this.tabGroup = tabGroupProxy;
	}

	@Kroll.method(name = "getTabGroup")
	@Kroll.getProperty(name = "tabGroup")
	public TiViewProxy getTabGroupProxy()
	{
		return this.tabGroup;
	}

	public void setPostOpenListener(PostOpenListener listener)
	{
		this.postOpenListener = listener;
	}

	public TiBlob handleToImage()
	{
		KrollDict d = TiUIHelper.viewToImage(new KrollDict(), getActivity().getWindow().getDecorView());
		return TiUIHelper.getImageFromDict(d);
	}

	/*
	 * Called when the window's activity has been created.
	 */
	public void onWindowActivityCreated()
	{
		windowActivityCreated = true;

		synchronized (proxiesWaitingForActivity.synchronizedList())
		{
			for (KrollProxy proxy : proxiesWaitingForActivity.nonNull()) {
				try {
					proxy.attachActivityLifecycle(getActivity());
				} catch (Throwable t) {
					Log.e(TAG, "Error attaching activity to proxy: " + t.getMessage(), t);
				}
			}
		}

		// Make sure the activity opens according to any orientation modes
		// set on the window before the activity was actually created.
		if (orientationModes != null) {
			setOrientationModes(orientationModes);
		}
	}

	/**
	 * Called when the window gained or lost focus.
	 *
	 * Default implementation will fire "focus" and "blur" events
	 * when the focus state has changed.
	 *
	 * @param focused true if focus was gained
	 */
	public void onWindowFocusChange(boolean focused)
	{
		this.isFocused = focused;
		fireEvent((focused) ? TiC.EVENT_FOCUS : TiC.EVENT_BLUR, null, false);
	}

	public void fireSafeAreaChangedEvent()
	{
		TiUIHelper.firePostLayoutEvent(this);
	}

	@Kroll.method
	@Kroll.setProperty
	public void setLeftNavButton(Object button)
	{
		Log.w(TAG, "setLeftNavButton not supported in Android");
	}

	@Kroll.method
	@Kroll.setProperty
	public void setOrientationModes(int[] modes)
	{
		int activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
		boolean hasPortrait = false;
		boolean hasPortraitReverse = false;
		boolean hasLandscape = false;
		boolean hasLandscapeReverse = false;

		// Store the given orientation modes.
		orientationModes = modes;

		// Fetch the activity to apply orientation modes to.
		Activity activity = getActivity();
		if (activity == null) {
			return;
		}

		// Convert given Titanium orientation modes to an Android orientation identifier.
		if (modes != null) {
			// look through orientation modes and determine what has been set
			for (int i = 0; i < orientationModes.length; i++) {
				int integerId = orientationModes[i];
				TiDeviceOrientation orientation = TiDeviceOrientation.fromTiIntId(integerId);
				if (orientation != null) {
					switch (orientation) {
						case PORTRAIT:
							hasPortrait = true;
							break;
						case UPSIDE_PORTRAIT:
							hasPortraitReverse = true;
							break;
						case LANDSCAPE_RIGHT:
							hasLandscape = true;
							break;
						case LANDSCAPE_LEFT:
							hasLandscapeReverse = true;
							break;
						default:
							Log.w(TAG, "'orientationMode' cannot be set to: " + orientation.toTiConstantName());
							break;
					}
				} else {
					Log.w(TAG, "'orientationMode' was given unknown value: " + integerId);
				}
			}

			// determine if we have a valid activity orientation mode based on provided modes list
			if (orientationModes.length == 0) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			} else if ((hasPortrait || hasPortraitReverse) && (hasLandscape || hasLandscapeReverse)) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
			} else if (hasPortrait && hasPortraitReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;
			} else if (hasLandscape && hasLandscapeReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
			} else if (hasPortrait) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
			} else if (hasPortraitReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT;
			} else if (hasLandscape) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
			} else if (hasLandscapeReverse) {
				activityOrientationMode = ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE;
			}
		} else if (activity instanceof TiBaseActivity) {
			activityOrientationMode = ((TiBaseActivity) activity).getOriginalOrientationMode();
		}

		// Attempt to change the activity's orientation setting.
		// Note: A semi-transparent activity cannot be assigned a fixed orientation. Will throw an exception.
		try {
			activity.setRequestedOrientation(activityOrientationMode);
		} catch (Exception ex) {
			Log.e(TAG, ex.getMessage());
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public int[] getOrientationModes()
	{
		return orientationModes;
	}

	// Expose the method and property here, instead of in KrollProxy
	@Kroll.method(name = "getActivity")
	@Kroll.getProperty(name = "_internalActivity")
	public ActivityProxy getActivityProxy()
	{
		return super.getActivityProxy();
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

	@Kroll.method
	@Kroll.getProperty
	public KrollDict getSafeAreaPadding()
	{
		// Initialize safe-area padding to zero. (ie: no padding)
		double paddingLeft = 0;
		double paddingTop = 0;
		double paddingRight = 0;
		double paddingBottom = 0;

		// Fetch safe-area from activity. (Returned safe-area is relative to root decor view.)
		Rect safeAreaRect = null;
		Activity activity = getActivity();
		if (activity instanceof TiBaseActivity) {
			safeAreaRect = ((TiBaseActivity) activity).getSafeAreaRect();
		}

		// Fetch content view that the safe-area should be made relative to.
		View contentView = null;
		if (this.tabGroup != null) {
			// This window is displayed within a TabGroup. Use the TabGroup's container view.
			// Note: Don't use this window's content view because if its tab is not currently selected,
			//       then this window's view coordinates will be offscreen and won't intersect safe-area.
			TiUIView uiView = this.tabGroup.peekView();
			if (uiView != null) {
				contentView = uiView.getNativeView();
			}
		}
		if ((contentView == null) && (this.view != null)) {
			// Use this window's content view.
			contentView = this.view.getNativeView();
		}

		// Calculate safe-area padding relative to content view.
		if ((contentView != null) && (safeAreaRect != null)) {
			// Get the content view's x/y position relative to window's root decor view.
			// Note: Do not use the getLocationInWindow() method, because it'll fetch the view's current position
			//       during transition animations. Such as when the ActionBar is being shown/hidden.
			int contentX = contentView.getLeft();
			int contentY = contentView.getTop();
			{
				ViewParent viewParent = contentView.getParent();
				for (; viewParent instanceof View; viewParent = viewParent.getParent()) {
					View view = (View) viewParent;
					contentX += view.getLeft() - view.getScrollX();
					contentY += view.getTop() - view.getScrollY();
				}
			}

			// Convert safe-area coordinates to be relative to content view.
			safeAreaRect.offset(-contentX, -contentY);

			// Calculate the safe-area padding relative to the content view.
			// Do not allow the padding to be less than zero on any side.
			paddingLeft = (double) Math.max(safeAreaRect.left, 0);
			paddingTop = (double) Math.max(safeAreaRect.top, 0);
			paddingRight = (double) Math.max(contentView.getWidth() - safeAreaRect.right, 0);
			paddingBottom = (double) Math.max(contentView.getHeight() - safeAreaRect.bottom, 0);

			// Convert padding values from pixels to Titanium's default units.
			TiDimension leftDimension = new TiDimension(paddingLeft, TiDimension.TYPE_LEFT);
			TiDimension topDimension = new TiDimension(paddingTop, TiDimension.TYPE_TOP);
			TiDimension rightDimension = new TiDimension(paddingRight, TiDimension.TYPE_RIGHT);
			TiDimension bottomDimension = new TiDimension(paddingBottom, TiDimension.TYPE_BOTTOM);
			paddingLeft = leftDimension.getAsDefault(contentView);
			paddingTop = topDimension.getAsDefault(contentView);
			paddingRight = rightDimension.getAsDefault(contentView);
			paddingBottom = bottomDimension.getAsDefault(contentView);
		}

		// Return the result via a titanium "ViewPadding" dictionary.
		KrollDict dictionary = new KrollDict();
		dictionary.put(TiC.PROPERTY_LEFT, paddingLeft);
		dictionary.put(TiC.PROPERTY_TOP, paddingTop);
		dictionary.put(TiC.PROPERTY_RIGHT, paddingRight);
		dictionary.put(TiC.PROPERTY_BOTTOM, paddingBottom);
		return dictionary;
	}

	protected abstract void handleOpen(KrollDict options);
	protected abstract void handleClose(@NonNull KrollDict options);
	protected abstract Activity getWindowActivity();

	/**
	 * Sub-classes will need to call handlePostOpen after their window is visible
	 * so any pending dialogs can successfully show after the window is opened
	 */
	protected void handlePostOpen()
	{
		if (postOpenListener != null) {
			getMainHandler().post(new Runnable() {
				public void run()
				{
					postOpenListener.onPostOpen(TiWindowProxy.this);
				}
			});
		}

		if (waitingForOpen != null && waitingForOpen.get() == this) {
			waitingForOpen = null;
		}

		View nativeView = view.getNativeView();

		// Make sure we draw the view during the layout pass. This does not seem to cause another layout pass. We need
		// to force the view to be drawn due to TIMOB-7685
		if (nativeView != null) {
			nativeView.postInvalidate();
		}
	}

	protected void fillIntent(Activity activity, Intent intent)
	{
		int windowFlags = 0;
		if (hasProperty(TiC.PROPERTY_WINDOW_FLAGS)) {
			windowFlags = TiConvert.toInt(getProperty(TiC.PROPERTY_WINDOW_FLAGS), 0);
		}

		//Set the fullscreen flag
		if (hasProperty(TiC.PROPERTY_FULLSCREEN)) {
			boolean flagVal = TiConvert.toBoolean(getProperty(TiC.PROPERTY_FULLSCREEN), false);
			if (flagVal) {
				windowFlags = windowFlags | WindowManager.LayoutParams.FLAG_FULLSCREEN;
			}
		}

		//Set the secure flag
		if (hasProperty(TiC.PROPERTY_FLAG_SECURE)) {
			boolean flagVal = TiConvert.toBoolean(getProperty(TiC.PROPERTY_FLAG_SECURE), false);
			if (flagVal) {
				windowFlags = windowFlags | WindowManager.LayoutParams.FLAG_SECURE;
			}
		}

		//Stuff flags in intent
		intent.putExtra(TiC.PROPERTY_WINDOW_FLAGS, windowFlags);

		if (hasProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE)) {
			intent.putExtra(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE,
							TiConvert.toInt(getProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE), -1));
		}

		if (hasProperty(TiC.PROPERTY_EXTEND_SAFE_AREA)) {
			boolean value = TiConvert.toBoolean(getProperty(TiC.PROPERTY_EXTEND_SAFE_AREA), false);
			intent.putExtra(TiC.PROPERTY_EXTEND_SAFE_AREA, value);
		}

		if (hasProperty(TiC.PROPERTY_EXIT_ON_CLOSE)) {
			// Use proxy's assigned "exitOnClose" property setting.
			boolean exitOnClose = TiConvert.toBoolean(getProperty(TiC.PROPERTY_EXIT_ON_CLOSE), false);
			intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, exitOnClose);
		} else if (activity.isTaskRoot() || (activity == TiApplication.getInstance().getRootActivity())) {
			// We're opening child activity from Titanium root activity. Have it exit out of app by default.
			// Note: If launched via startActivityForResult(), then root activity won't be the task's root.
			intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, true);
		}

		// Set the theme property
		if (hasProperty(TiC.PROPERTY_THEME)) {
			String theme = TiConvert.toString(getProperty(TiC.PROPERTY_THEME));
			if (theme != null) {
				try {
					intent.putExtra(TiC.PROPERTY_THEME,
									TiRHelper.getResource("style." + theme.replaceAll("[^A-Za-z0-9_]", "_")));
				} catch (Exception e) {
					Log.w(TAG, "Cannot find the theme: " + theme);
				}
			}
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public int getOrientation()
	{
		return TiDeviceOrientation.fromDefaultDisplay().toTiIntId();
	}

	@Override
	public KrollProxy getParentForBubbling()
	{
		// No events bubble up to decor view.
		if (getParent() instanceof DecorViewProxy) {
			return null;
		}
		return super.getParentForBubbling();
	}

	@Kroll.method
	public void addSharedElement(TiViewProxy view, String transitionName)
	{
		if (LOLLIPOP_OR_GREATER) {
			TiUIView v = view.peekView();
			if (v != null) {
				Pair<View, String> p = new Pair<View, String>(v.getNativeView(), transitionName);
				sharedElementPairs.add(p);
			}
		}
	}

	@Kroll.method
	public void removeAllSharedElements()
	{
		if (LOLLIPOP_OR_GREATER) {
			sharedElementPairs.clear();
		}
	}

	@Kroll.method
	@Kroll.getProperty
	public TiWindowProxy getNavigationWindow()
	{
		return navigationWindow;
	}

	public void setNavigationWindow(TiWindowProxy navigationWindow)
	{
		this.navigationWindow = navigationWindow;
	}

	/**
	 * Helper method to create an activity options bundle.
	 * @param activity The activity on which options bundle should be created.
	 * @return The Bundle or null.
	 */
	@SuppressWarnings("unchecked")
	@Nullable
	protected Bundle createActivityOptionsBundle(Activity activity)
	{
		ActivityOptionsCompat options = null;

		// Do NOT apply transitions to launch activity.
		if (hasActivityTransitions() && !(activity instanceof TiLaunchActivity)) {
			if (!sharedElementPairs.isEmpty()) {
				options = ActivityOptionsCompat.makeSceneTransitionAnimation(
					activity, sharedElementPairs.toArray(new Pair[sharedElementPairs.size()]));
			} else {
				options = ActivityOptionsCompat.makeSceneTransitionAnimation(activity);
			}
		} else {
			options = ActivityOptionsCompat.makeBasic();
		}
		return (options != null) ? options.toBundle() : null;
	}

	/**
	 * @return true if this window has activity transitions
	 */
	protected boolean hasActivityTransitions()
	{
		// This feature is only supported on Android 5.0 and higher.
		if (!LOLLIPOP_OR_GREATER) {
			return false;
		}

		// Don't do transition if "animated" property was set false.
		boolean isAnimated = TiConvert.toBoolean(getProperty(TiC.PROPERTY_ANIMATED), true);
		if (!isAnimated) {
			return false;
		}

		// Do activity transition if at least 1 shared element has been configured.
		// Note: It doesn't matter if transition animation properties were assigned.
		//       System will do default transition animation if not assign to window proxy.
		if ((this.sharedElementPairs != null) && (this.sharedElementPairs.size() > 0)) {
			return true;
		}

		// Do activity transition if at least 1 transition property was assigned to proxy.
		if (hasPropertyAndNotNull(TiC.PROPERTY_ENTER_TRANSITION) || hasPropertyAndNotNull(TiC.PROPERTY_EXIT_TRANSITION)
			|| hasPropertyAndNotNull(TiC.PROPERTY_RETURN_TRANSITION)
			|| hasPropertyAndNotNull(TiC.PROPERTY_REENTER_TRANSITION)
			|| hasPropertyAndNotNull(TiC.PROPERTY_SHARED_ELEMENT_ENTER_TRANSITION)
			|| hasPropertyAndNotNull(TiC.PROPERTY_SHARED_ELEMENT_EXIT_TRANSITION)
			|| hasPropertyAndNotNull(TiC.PROPERTY_SHARED_ELEMENT_REENTER_TRANSITION)
			|| hasPropertyAndNotNull(TiC.PROPERTY_SHARED_ELEMENT_RETURN_TRANSITION)) {
			return true;
		}

		// Don't do activity transition.
		return false;
	}
}
