/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.os.Build;
import android.support.design.widget.TextInputEditText;
import android.support.v4.view.NestedScrollingChild2;
import android.support.v4.view.NestedScrollingChildHelper;
import android.support.v4.view.ViewCompat;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.inputmethod.EditorInfo;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.ViewGroup;
import android.view.ViewParent;


/**
 * EditText derived class used by Titanium's "Ti.UI.TextField" and "Ti.UI.TextArea" types.
 * <p>
 * Provides nested scrolling support within a NestedScrollingParent view group such as
 * Google's NestedScrollView and Titanium's TiNestedListView.
 */
public class TiUIEditText extends TextInputEditText implements NestedScrollingChild2
{
	/** Helper object used to handle nested scrolling within a cooperating NestedScrollingParent view. */
	private NestedScrollingChildHelper nestedScrollingHelper;

	/**
	 * Stores the current nested scrolling direction this view is currently in such as
	 * ViewCompat.SCROLL_AXIS_VERTICAL and ViewCompat.SCROLL_AXIS_HORIZONTAL.
	 * <p>
	 * Will be set to ViewCompat.SCROLL_AXIS_NONE if not currently performing a nested scroll.
	 */
	private int scrollAxisDirection = ViewCompat.SCROLL_AXIS_NONE;

	/** Stores the last received nested touch event in screen coordinates along the x-axis. */
	private int lastRawTouchX;

	/** Stores the last received nested touch event in screen coordinates along the y-axis. */
	private int lastRawTouchY;


	/** Creates a new EditText view. */
	public TiUIEditText(Context context)
	{
		super(context);
		initializeView();
	}

	/** Creates a new EditText view. */
	public TiUIEditText(Context context, AttributeSet attributeSet)
	{
		super(context, attributeSet);
		initializeView();
	}

	/** Creates a new EditText view. */
	public TiUIEditText(Context context, AttributeSet attributeSet, int defaultStyleAttributes)
	{
		super(context, attributeSet, defaultStyleAttributes);
		initializeView();
	}

	/**
	 * Initializes this view's settings and member variables.
	 * This method is only expected to be called once from this class' constructor.
	 */
	private void initializeView()
	{
		this.nestedScrollingHelper = new NestedScrollingChildHelper(this);
		setNestedScrollingEnabled(true);
	}

	/**
	 * Called when key input has been received, but before it has been processed by the IME.
	 * @param keyCode Unique integer ID of the key that was pressed/released.
	 * @param event Provides additional key event details.
	 * @return
	 * Returns true if this method has handled the key and it should not be passed to the IME.
	 * <p>
	 * Returns false to allow the IME to handle the key.
	 */
	@Override
	public boolean onKeyPreIme(int keyCode, KeyEvent event)
	{
		// TIMOB-23757: https://code.google.com/p/android/issues/detail?id=182191
		if (Build.VERSION.SDK_INT < 24 && (getGravity() & Gravity.LEFT) != Gravity.LEFT && keyCode == KeyEvent.KEYCODE_BACK) {
			ViewGroup view = (ViewGroup) getParent();
			view.setFocusableInTouchMode(true);
			view.requestFocus();
		}
		return super.onKeyPreIme(keyCode, event);
	}

	/**
	 * Called when a touch down/move/up event has been received.
	 * @param event Provides information about the touch event.
	 * @return Returns true if the touch event was consumed by this view. Returns false if not.
	 */
	@Override
	public boolean onTouchEvent(MotionEvent event)
	{
		// Validate argument.
		if (event == null) {
			return false;
		}

		// Let the base class handle the event if touch or nested-scrolling is disabled.
		if (!isEnabled() || !isNestedScrollingEnabled()) {
			return super.onTouchEvent(event);
		}

		// Handle nested touch input and scroll handling.
		boolean result = false;
		switch (event.getActionMasked()) {
			case MotionEvent.ACTION_DOWN: {
				// Determine if the EditText can be scrolled vertically or horizontally.
				boolean isVertical = ((getInputType() & EditorInfo.TYPE_TEXT_FLAG_MULTI_LINE) != 0);
				boolean isScrollable;
				if (isVertical) {
					isScrollable = canScrollVertically(1) || canScrollVertically(-1);
				} else {
					isScrollable = canScrollHorizontally(1) || canScrollHorizontally(-1);
				}

				// Start nested scrolling if the EditText is scrollable.
				if (isScrollable) {
					if (isVertical) {
						this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_VERTICAL;
					} else {
						this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_HORIZONTAL;
					}
					this.lastRawTouchX = (int)event.getRawX();
					this.lastRawTouchY = (int)event.getRawY();
					startNestedScroll(this.scrollAxisDirection);
				}

				// Let the base class handle the touch "down" event.
				result = super.onTouchEvent(event);
				break;
			}
			case MotionEvent.ACTION_MOVE: {
				// Handle the touch move/drag event.
				if (this.scrollAxisDirection != ViewCompat.SCROLL_AXIS_NONE) {
					// We're doing a nested scroll.
					// Determine scroll direction, distance, and if EditText has hit scroll limit.
					computeScroll();
					boolean isVertical = (this.scrollAxisDirection == ViewCompat.SCROLL_AXIS_VERTICAL);
					int deltaX = this.lastRawTouchX - (int)event.getRawX();
					int deltaY = this.lastRawTouchY - (int)event.getRawY();
					int deltaValue = isVertical ? deltaY : deltaX;
					boolean isScrollEnabled;
					boolean canScrollFurther;
					if (isVertical) {
						isScrollEnabled = canScrollVertically(1) || canScrollVertically(-1);
						canScrollFurther = canScrollVertically(deltaValue);
					} else {
						isScrollEnabled = canScrollHorizontally(1) || canScrollHorizontally(-1);
						canScrollFurther = canScrollHorizontally(deltaValue);
					}

					// Handle the nested scroll.
					if (!isScrollEnabled || !canScrollFurther) {
						// EditText cannot scroll or is unable to scroll any farther.
						// Request the parent to scroll instead.
						result = dispatchNestedPreScroll(deltaX, deltaY, null, null);
						result |= dispatchNestedScroll(0, 0, deltaX, deltaY, null);

						// Cancel the EditText's long-press timer. Prevents long-press from triggering
						// text selection while scrolling the parent view. (Looks goofy when it happens.)
						cancelLongPress();
					} else {
						// EditText can scroll. Let the EditText handle the move/scroll event.
						result = super.onTouchEvent(event);
					}

					// Store the last received touch point in screen coordinates.
					// This is needed to calculate nested scroll distances.
					this.lastRawTouchX = (int)event.getRawX();
					this.lastRawTouchY = (int)event.getRawY();
				} else {
					// Nested scrolling is disabled. Let EditText do default touch handling.
					result = super.onTouchEvent(event);
				}
				break;
			}
			case MotionEvent.ACTION_CANCEL:
			case MotionEvent.ACTION_UP: {
				// Handle the touch release event.
				result = super.onTouchEvent(event);

				// Stop nested-scrolling if active.
				if (this.scrollAxisDirection != ViewCompat.SCROLL_AXIS_NONE) {
					stopNestedScroll();
					this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_NONE;
				}
				break;
			}
			default: {
				// Let the base class handle all other events, such as multi-touch.
				result = super.onTouchEvent(event);
				break;
			}
		}
		return result;
	}

	@Override
	public void setEnabled(boolean value)
	{
		// If we're disabling touch input for this view, then stop nested scrolling if active.
		if (!value && (this.scrollAxisDirection != ViewCompat.SCROLL_AXIS_NONE)) {
			stopNestedScroll();
			this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_NONE;
		}

		// Update this view's enable state.
		super.setEnabled(value);
	}

	@Override
	public boolean dispatchNestedFling(float velocityX, float velocityY, boolean consumed)
	{
		return this.nestedScrollingHelper.dispatchNestedFling(velocityX, velocityY, consumed);
	}

	@Override
	public boolean dispatchNestedPreFling(float velocityX, float velocityY)
	{
		return this.nestedScrollingHelper.dispatchNestedPreFling(velocityX, velocityY);
	}

	@Override
	public boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow)
	{
		return this.nestedScrollingHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow);
	}

	@Override
	public boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow, int type)
	{
		return this.nestedScrollingHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow, type);
	}

	@Override
	public boolean dispatchNestedScroll(
		int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed, int[] offsetInWindow)
	{
		return this.nestedScrollingHelper.dispatchNestedScroll(
				dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow);
	}

	@Override
	public boolean dispatchNestedScroll(
		int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed, int[] offsetInWindow, int type)
	{
		return this.nestedScrollingHelper.dispatchNestedScroll(
				dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow, type);
	}

	@Override
	public boolean hasNestedScrollingParent()
	{
		return this.nestedScrollingHelper.hasNestedScrollingParent();
	}

	@Override
	public boolean hasNestedScrollingParent(int type)
	{
		return this.nestedScrollingHelper.hasNestedScrollingParent(type);
	}

	@Override
	public boolean isNestedScrollingEnabled()
	{
		return this.nestedScrollingHelper.isNestedScrollingEnabled();
	}

	@Override
	public void setNestedScrollingEnabled(boolean enabled)
	{
		this.nestedScrollingHelper.setNestedScrollingEnabled(enabled);
	}

	@Override
	public boolean startNestedScroll(int axes)
	{
		return this.nestedScrollingHelper.startNestedScroll(axes);
	}

	@Override
	public boolean startNestedScroll(int axes, int type)
	{
		return this.nestedScrollingHelper.startNestedScroll(axes, type);
	}

	@Override
	public void stopNestedScroll()
	{
		this.nestedScrollingHelper.stopNestedScroll();
	}

	@Override
	public void stopNestedScroll(int type)
	{
		this.nestedScrollingHelper.stopNestedScroll(type);
	}
}
