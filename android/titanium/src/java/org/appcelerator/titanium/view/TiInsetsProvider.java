/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import android.view.View;
import android.view.ViewParent;

/**
 * Provides custom insets to be excluded by an activity's safe-area.
 * <p>
 * For example, Titanium's TabGroup uses this to treat its tab bar as an inset.
 * <p>
 * Assigned insets are expected to be relative to an activity's root decor view.
 * <p>
 * Instances are intended to be passed to "TiBaseActivity" class' addCustomInsetsProvider() method
 * or the "TiActivitySafeAreaMonitor" class' addInsetsProvider() method.
 */
public class TiInsetsProvider
{
	/**
	 * Listener which gets invoked by "TiInsetsProvider" when at least one of its insets has changed.
	 * <p>
	 * An instance of this type is expected to be passed to the setOnChangedListener() method.
	 */
	public interface OnChangedListener {
		void onChanged(TiInsetsProvider provider);
	}

	/** Listener to be invoked when this provider's insets have been changed. */
	private OnChangedListener changeListener;

	/** Pixel width of the inset overlapping the left side of the window's content. */
	private int left;

	/** Pixel height of the inset overlapping the top of the window's content. */
	private int top;

	/** Pixel width of the inset overlapping the right side of the window's content. */
	private int right;

	/** Pixel height of the inset overlapping the bottom of the window's content. */
	private int bottom;

	/**
	 * Gets the listener assigned via the setOnChangedListener() method.
	 * @return Returns the assigned listener. Returns null if no listener has been assigned.
	 */
	public TiInsetsProvider.OnChangedListener getOnChangedListener()
	{
		return this.changeListener;
	}

	/**
	 * Sets a listener to be invoked when the insets have been changed.
	 * @param listener The listener to be assigned. Can be set null to remove the last assigned listener.
	 */
	public void setOnChangedListener(TiInsetsProvider.OnChangedListener listener)
	{
		this.changeListener = listener;
	}

	/**
	 * Gets the pixel width of the inset overlapping the left side of the window's content.
	 * @return Returns the left inset pixel width. Returned zero if there is no inset. Will never return negative.
	 */
	public int getLeft()
	{
		return this.left;
	}

	/**
	 * Gets the pixel height of the inset overlapping the top side of the window's content.
	 * @return Returns the top inset pixel height. Returned zero if there is no inset. Will never return negative.
	 */
	public int getTop()
	{
		return this.top;
	}

	/**
	 * Gets the pixel width of the inset overlapping the right side of the window's content.
	 * @return Returns the right inset pixel width. Returned zero if there is no inset. Will never return negative.
	 */
	public int getRight()
	{
		return this.right;
	}

	/**
	 * Gets the pixel height of the inset overlapping the bottom side of the window's content.
	 * @return Returns the bottom inset pixel width. Returned zero if there is no inset. Will never return negative.
	 */
	public int getBottom()
	{
		return this.bottom;
	}

	/**
	 * Sets the left inset pixel width which overlaps the window's content.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param value The pixel inset to be applied. Negative values will be floored to zero.
	 */
	public void setLeft(int value)
	{
		updateUsing(value, this.top, this.right, this.bottom);
	}

	/**
	 * Sets the left inset pixel width based on the given view's right edge position within the window.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param view
	 * The view used to base the inset size on.
	 * Will set inset to zero if given null or if its visibility state is set to "View.GONE".
	 */
	public void setLeftBasedOn(View view)
	{
		int value = 0;
		if (isNotGone(view)) {
			EdgeBounds edgeBounds = fetchRootEdgeBoundsFrom(view);
			if (edgeBounds != null) {
				value = edgeBounds.left;
			}
			value += view.getPaddingLeft() + view.getWidth() + view.getPaddingRight();
		}
		setLeft(value);
	}

	/**
	 * Sets the top inset pixel height which overlaps the window's content.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param value The pixel inset to be applied. Negative values will be floored to zero.
	 */
	public void setTop(int value)
	{
		updateUsing(this.left, value, this.right, this.bottom);
	}

	/**
	 * Sets the top inset pixel height based on the given view's bottom edge position within the window.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param view
	 * The view used to base the inset size on.
	 * Will set inset to zero if given null or if its visibility state is set to "View.GONE".
	 */
	public void setTopBasedOn(View view)
	{
		int value = 0;
		if (isNotGone(view)) {
			EdgeBounds edgeBounds = fetchRootEdgeBoundsFrom(view);
			if (edgeBounds != null) {
				value = edgeBounds.top;
			}
			value += view.getPaddingTop() + view.getHeight() + view.getPaddingBottom();
		}
		setTop(value);
	}

	/**
	 * Sets the right inset pixel width which overlaps the window's content.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param value The pixel inset to be applied. Negative values will be floored to zero.
	 */
	public void setRight(int value)
	{
		updateUsing(this.left, this.top, value, this.bottom);
	}

	/**
	 * Sets the right inset pixel width based on the given view's left edge position within the window.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param view
	 * The view used to base the inset size on.
	 * Will set inset to zero if given null or if its visibility state is set to "View.GONE".
	 */
	public void setRightBasedOn(View view)
	{
		int value = 0;
		if (isNotGone(view)) {
			EdgeBounds edgeBounds = fetchRootEdgeBoundsFrom(view);
			if (edgeBounds != null) {
				value = edgeBounds.right;
			}
			value += view.getPaddingLeft() + view.getWidth() + view.getPaddingRight();
		}
		setRight(value);
	}

	/**
	 * Sets the bottom inset pixel height which overlaps the window's content.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param value The pixel inset to be applied. Negative values will be floored to zero.
	 */
	public void setBottom(int value)
	{
		updateUsing(this.left, this.top, this.right, value);
	}

	/**
	 * Sets the bottom inset pixel height based on the given view's top edge position within the window.
	 * This will invoke the provider's assigned "OnChangedListener" if the value is changing.
	 * @param view
	 * The view used to base the inset size on.
	 * Will set inset to zero if given null or if its visibility state is set to "View.GONE".
	 */
	public void setBottomBasedOn(View view)
	{
		int value = 0;
		if (isNotGone(view)) {
			EdgeBounds edgeBounds = fetchRootEdgeBoundsFrom(view);
			if (edgeBounds != null) {
				value = edgeBounds.bottom;
			}
			value += view.getPaddingTop() + view.getHeight() + view.getPaddingBottom();
		}
		setBottom(value);
	}

	/**
	 * Updates this provider's stored inset member variables and invokes the assigned
	 * "OnChangedListener" listener if at least one inset value has been changed.
	 * @param left The left pixel inset.
	 * @param top The top pixel inset.
	 * @param right The right pixel inset.
	 * @param bottom The bottom pixel inset.
	 */
	private void updateUsing(int left, int top, int right, int bottom)
	{
		// Do not allow insets to be less than zero.
		left = Math.max(left, 0);
		top = Math.max(top, 0);
		right = Math.max(right, 0);
		bottom = Math.max(bottom, 0);

		// Update stored insets.
		boolean hasChanged = false;
		if (left != this.left) {
			this.left = left;
			hasChanged = true;
		}
		if (top != this.top) {
			this.top = top;
			hasChanged = true;
		}
		if (right != this.right) {
			this.right = right;
			hasChanged = true;
		}
		if (bottom != this.bottom) {
			this.bottom = bottom;
			hasChanged = true;
		}

		// Invoke the onChanged listener if at least 1 inset has changed.
		if (hasChanged && (this.changeListener != null)) {
			this.changeListener.onChanged(this);
		}
	}

	/**
	 * Determines if the given view or any of its parent views are assigned the "View.GONE" visibility state.
	 * When a view is flagged gone, it should be treated as a zero width/height view and be excluded from layouts.
	 * @param view The view to determine if it is flagged gone. Can be null.
	 * @return Returns true if given view is null or flagged gone. Returns false if displayed.
	 */
	private static boolean isGone(View view)
	{
		if ((view == null) || (view.getVisibility() == View.GONE)) {
			return true;
		}

		ViewParent viewParent = view.getParent();
		for (; viewParent instanceof View; viewParent = viewParent.getParent()) {
			if (((View) viewParent).getVisibility() == View.GONE) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Determines if the given view or any of its parent views are not assigned the "View.GONE" visibility state.
	 * When a view is flagged gone, it should be treated as a zero width/height view and be excluded from layouts.
	 * @param view The view to determine if it is not flagged gone. Can be null.
	 * @return Returns true if given view is non-null and is displayed. Returns false if view is null or flagged gone.
	 */
	private static boolean isNotGone(View view)
	{
		return !isGone(view);
	}

	/**
	 * Calculates the given view's left/top/right/bottom edge positions relative to its root parent view.
	 * These values are the equivalent to Titanium's pinning positions.
	 * @param view The view to fetch the edge positions from. Can be null.
	 * @return
	 * Returns the given view's edge positions.
	 * <p>
	 * Returns null if argument is null or given view doesn't have a parent view.
	 */
	private static TiInsetsProvider.EdgeBounds fetchRootEdgeBoundsFrom(View view)
	{
		// Validate argument.
		if (view == null) {
			return null;
		}

		// Fetch the view's position relative to its root parent view.
		int x = view.getLeft();
		int y = view.getTop();
		View rootView = null;
		ViewParent viewParent = view.getParent();
		for (; viewParent instanceof View; viewParent = viewParent.getParent()) {
			View nextView = (View) viewParent;
			x += nextView.getLeft() - nextView.getScrollX();
			y += nextView.getTop() - nextView.getScrollY();
			rootView = nextView;
		}

		// Do not continue if given view doesn't have a parent.
		// We can't provide relative parent positions due to this.
		if (rootView == null) {
			return null;
		}

		// Calculate the given view's position relative to its root parent view's edges.
		// Ex: "right" is the distance the given view's right edge is from the root view's right edge.
		EdgeBounds edgeBounds = new EdgeBounds();
		edgeBounds.left = x - view.getPaddingLeft();
		edgeBounds.top = y - view.getPaddingTop();
		edgeBounds.right = rootView.getWidth() - (x + view.getWidth() + view.getPaddingRight());
		edgeBounds.bottom = rootView.getHeight() - (y + view.getHeight() + view.getPaddingBottom());
		return edgeBounds;
	}

	private static class EdgeBounds
	{
		public int left;
		public int top;
		public int right;
		public int bottom;
	}
}
