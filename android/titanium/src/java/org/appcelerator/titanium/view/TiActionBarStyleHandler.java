/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import android.content.res.Configuration;
import android.content.res.TypedArray;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.ViewGroup;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.util.TiRHelper;

/**
 * Updates an activity's default Google ActionBar height and font size when the orientation changes.
 * Intended to be used by activities which override "configChanges" for orientation since the system won't
 * automatically update the ActionBar for you in that case (56dp for portrait and 48dp for landscape).
 * <p>
 * Instances of this class can only be created by the static from() method, which is expected to be called
 * within an Activity.onCreate() method. The activity which owns this instance is then expected to call
 * this instance's onConfigurationChanged() method when the activity's equivalent method has been invoked.
 */
public class TiActionBarStyleHandler
{
	/** The default Android log tag name to be used by this class. */
	private static final String TAG = "TiActionBarStyleHandler";

	/** Style handler to use if Google's ActionBar is implemented via a toolbar. Will be null if not. */
	private TiToolbarStyleHandler toolbarStyleHandler;

	/** Constructor made private to force caller to use the static from() method. */
	private TiActionBarStyleHandler()
	{
	}

	/**
	 * To be called by the owner when the activity's overridden onConfigurationChanged() method has been called.
	 * Updates the ActionBar's height and font size base on the given configuration.
	 * @param newConfig The updated configuration applied to the activity.
	 */
	public void onConfigurationChanged(Configuration newConfig)
	{
		// Do not continue if we don't have access to the ActionBar.
		if (this.toolbarStyleHandler == null) {
			return;
		}

		// Update the ActionBar's toolbar style/size.
		this.toolbarStyleHandler.onConfigurationChanged(newConfig);

		// Update the toolbar's layout height if currently set to a pixel value.
		// Note: We don't want to change it if set to WRAP_CONTENT, but I've never seen ActionBar do this.
		Toolbar toolbar = this.toolbarStyleHandler.getToolbar();
		ViewGroup.LayoutParams layoutParams = toolbar.getLayoutParams();
		if ((layoutParams != null) && (layoutParams.height > 0)) {
			int minHeight = toolbar.getMinimumHeight();
			if (minHeight > 0) {
				layoutParams.height = minHeight;
				toolbar.requestLayout();
				toolbar.requestFitSystemWindows();
			}
		}
	}

	/**
	 * Searches the given activity for the default Google ActionBar and returns a new handler instance if found.
	 * This method is expected to be called from an activity's onCreate() method.
	 * @param activity The activity to search for an ActionBar from. Can be null.
	 * @return
	 * Returns a new handler if an ActionBar was found.
	 * <p>
	 * Returns null if ActionBar not found or if given a null argument
	 */
	public static TiActionBarStyleHandler from(AppCompatActivity activity)
	{
		// Validate argument.
		if (activity == null) {
			return null;
		}

		// Attempt to find Google's default ActionBar from the given activity.
		// Note: It won't have one if using a "Window.FEATURE_NO_TITLE" theme.
		TiToolbarStyleHandler toolbarStyleHandler = null;
		try {
			// Check if ActionBar is using a Toolbar via AppCompat "abc_screen_toolbar.xml" theme.
			int actionBarId = TiRHelper.getResource("id.action_bar");
			View view = activity.findViewById(actionBarId);
			if (view instanceof Toolbar) {
				// Toolbar found. Set up a Toolbar style handler.
				toolbarStyleHandler = new TiToolbarStyleHandler((Toolbar) view);
				int styleAttributeId = TiRHelper.getResource("attr.actionBarStyle");
				int[] idArray = new int[] { TiRHelper.getResource("attr.titleTextStyle"),
											TiRHelper.getResource("attr.subtitleTextStyle") };
				TypedArray typedArray = activity.obtainStyledAttributes(null, idArray, styleAttributeId, 0);
				toolbarStyleHandler.setTitleTextAppearanceId(typedArray.getResourceId(0, 0));
				toolbarStyleHandler.setSubtitleTextAppearanceId(typedArray.getResourceId(1, 0));
				typedArray.recycle();
			}
		} catch (Exception ex) {
			Log.d(TAG, ex.getMessage(), ex);
		}

		// Do not continue if ActionBar not found.
		if (toolbarStyleHandler == null) {
			return null;
		}

		// Set up an instance of this class and return it.
		TiActionBarStyleHandler actionBarStyleHandler = new TiActionBarStyleHandler();
		actionBarStyleHandler.toolbarStyleHandler = toolbarStyleHandler;
		return actionBarStyleHandler;
	}
}
