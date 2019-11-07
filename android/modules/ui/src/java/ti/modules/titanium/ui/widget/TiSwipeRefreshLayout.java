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
import android.view.ViewParent;

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
	 * Enables or disables touch interception for this view and all parent views.
	 * <p>
	 * Disabling prevents the onInterceptTouchEvent() method from getting called, which is used by
	 * a parent ScrollView or ListView to scroll the container when touch-dragging a child view.
	 * @param value Set true to disable touch interception in this view and all parent views. Set false to re-enable.
	 */
	@Override
	public void requestDisallowInterceptTouchEvent(boolean value)
	{
		// Enable/disable touch interception for this view.
		super.requestDisallowInterceptTouchEvent(value);

		// Google's "SwipeRefreshLayout" ignores above method call if child view does not support nested scrolling,
		// which is the case for horizontal scrolling views such as HorizontalScrollView and TextInputLayout.
		// We need parent vertical scrolling to be disallowed while scrolling these views horizontally.
		// Work-Around: Send request to the SwipeRefreshLayout's parent ourselves since it might not do it.
		ViewParent parentView = getParent();
		if (parentView != null) {
			parentView.requestDisallowInterceptTouchEvent(value);
		}
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
		// If size mode not set to "exactly", then change width/height to match largest child view.
		// Note: We need to do this since Google's "SwipeRefreshLayout" class ignores the
		//       WRAP_CONTENT setting and will fill the parent view instead.
		int widthMode = MeasureSpec.getMode(widthMeasureSpec);
		int heightMode = MeasureSpec.getMode(heightMeasureSpec);
		if ((widthMode != MeasureSpec.EXACTLY) || (heightMode != MeasureSpec.EXACTLY)) {
			// Determine how large this view wants to be based on its child views.
			int minWidth = 0;
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

				// Determine the size of the child.
				child.measure(widthMeasureSpec, heightMeasureSpec);
				int childWidth = child.getMeasuredWidth();
				childWidth += child.getPaddingLeft() + child.getPaddingRight();
				int childHeight = child.getMeasuredHeight();
				childHeight += child.getPaddingTop() + child.getPaddingBottom();

				// Store the child's width/height if it's the largest so far.
				minWidth = Math.max(minWidth, childWidth);
				minHeight = Math.max(minHeight, childHeight);
			}

			// Make sure we're not exceeding the suggested min width/height assigned to this view.
			minWidth = Math.max(minWidth, getSuggestedMinimumWidth());
			minHeight = Math.max(minHeight, getSuggestedMinimumHeight());

			// Update this view's given width/height spec to match the size of child view, but only if:
			// - Mode is UNSPECIFIED. (View can be any size it wants. Can occur in ScrollViews.)
			// - Mode is AT_MOST and child size is less than given size. (Makes WRAP_CONTENT work.)
			if (widthMode != MeasureSpec.EXACTLY) {
				int containerWidth = MeasureSpec.getSize(widthMeasureSpec);
				if ((widthMode == MeasureSpec.UNSPECIFIED) || (minWidth < containerWidth)) {
					widthMode = MeasureSpec.AT_MOST;
					widthMeasureSpec = MeasureSpec.makeMeasureSpec(minWidth, widthMode);
				}
			}
			if (heightMode != MeasureSpec.EXACTLY) {
				int containerHeight = MeasureSpec.getSize(heightMeasureSpec);
				if ((heightMode == MeasureSpec.UNSPECIFIED) || (minHeight < containerHeight)) {
					heightMode = MeasureSpec.AT_MOST;
					heightMeasureSpec = MeasureSpec.makeMeasureSpec(minHeight, heightMode);
				}
			}
		}

		// Update this view's measurements.
		super.onMeasure(widthMeasureSpec, heightMeasureSpec);
	}
}
