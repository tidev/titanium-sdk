/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.support.v4.widget.SwipeRefreshLayout;


/**
 * View group used to display a refresh progress indicator when the user swipes down.
 * <p>
 * Extends Google's "SwipeRefreshLayout" class by adding a new setSwipeRefreshEnabled() method.
 * Allows the swipe-down feature to be disabled independently of the setEnabled() method that
 * Google's implementation uses to disable this feature (along with touch support).
 */
public class TiSwipeRefreshLayout extends SwipeRefreshLayout
{
	/** Set true if swipe-down support is enabled. False if disabled. */
	private boolean isSwipeRefreshEnabled = true;


	/**
	 * Creates a new swipe-down refresh layout.
	 * @param context Expected to be the activity context. Cannot be null.
	 */
	public TiSwipeRefreshLayout(Context context)
	{
		super(context);
	}

	/**
	 * Determines if touch input and swipe-down support is enabled.
	 * @return Returns true if enabled. Returns false if disabled.
	 */
	@Override
	public boolean isEnabled()
	{
		return isSwipeRefreshEnabled && super.isEnabled();
	}

	/**
	 * Determines if swipe-down refresh support is enabled or not.
	 * Note that even if disabled, the refresh progress indicator can still be displayed programmatically.
	 * @return Returns true if swipe-down support is enabled. Returns false if disabled.
	 */
	public boolean isSwipeRefreshEnabled()
	{
		return this.isSwipeRefreshEnabled;
	}

	/**
	 * Enables or disables swipe-down refresh support. Enabled by default.
	 * Note that even if disabled, the refresh progress indicator can still be displayed programmatically.
	 * @param value Set true to enable swipe-down support. Set false to disable it.
	 */
	public void setSwipeRefreshEnabled(boolean value)
	{
		this.isSwipeRefreshEnabled = value;
	}
}
