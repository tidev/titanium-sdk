/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.support.v4.widget.SwipeRefreshLayout;
import android.view.View;
import android.view.View.MeasureSpec;


/**
 * View group used to display a refresh progress indicator when the user swipes down.
 * <p>
 * Extends Google's "SwipeRefreshLayout" class by adding a new setSwipeRefreshEnabled() method.
 * Allows the swipe-down feature to be disabled independently of the setEnabled() method that
 * Google's implementation uses to disable this feature (along with touch support).
 * <p>
 * Also adds WRAP_CONTENT support for height. (Google's implementation does not support this.)
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

	/**
	 * Called when this view's measure() method gets called. Typically called by the parent view.
	 * Updates this view's width and height based on the given width and height constraints.
	 * <p>
	 * Given arguments size and size mode can be extracted by the Android "View.MeasureSpec" class.
	 * @param widthMeasureSpec Provides the parent's width contraints and size mode.
	 * @param heightMeasureSpec Provides the parent's height contraints and size mode.
	 */
	@Override
	public void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		// If height mode not set to "exactly", then change height to match view's tallest child.
		// Note: We need to do this since Google's "SwipeRefreshLayout" class ignores the
		//       WRAP_CONTENT setting and will fill the height of the parent view instead.
		int heightMode = MeasureSpec.getMode(heightMeasureSpec);
		if (heightMode != MeasureSpec.EXACTLY) {
			// Determine the min height needed to fit this view's tallest child view.
			int minHeight = 0;
			for (int index = getChildCount() - 1; index >= 0; index--) {
				// Fetch the next child.
				View child = getChildAt(index);
				if (child == null) {
					continue;
				}

				// Skip child views that are flagged as excluded from the layout.
				if (child.getVisibility() == View.GONE) {
					continue;
				}

				// Determine the height of the child.
				child.measure(widthMeasureSpec, heightMeasureSpec);
				int childHeight = child.getMeasuredHeight();
				childHeight += child.getPaddingTop() + child.getPaddingBottom();

				// Store the child's height if it's the tallest so far.
				minHeight = Math.max(minHeight, childHeight);
			}

			// Make sure we're not exceeding the suggested min height assigned to this view.
			minHeight = Math.max(minHeight, getSuggestedMinimumHeight());

			// Update this view's given height spec to match the tallest child view, but only if:
			// - Height mode is UNSPECIFIED. (View can be any height it wants.)
			// - Height mode is AT_MOST and the min height is less than given height.
			if ((heightMode == MeasureSpec.UNSPECIFIED) ||
			    (minHeight < MeasureSpec.getSize(heightMeasureSpec)))
			{
				heightMode = MeasureSpec.AT_MOST;
				heightMeasureSpec = MeasureSpec.makeMeasureSpec(minHeight, heightMode);
			}
		}

		// Update this view's measurements.
		super.onMeasure(widthMeasureSpec, heightMeasureSpec);
	}
}
