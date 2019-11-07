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
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.inputmethod.EditorInfo;

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

	/** Stores the start point of a nested touch event in screen coordinates along the x-axis. */
	private int startRawTouchX;

	/** Stores the start point of a nested touch event in screen coordinates along the y-axis. */
	private int startRawTouchY;

	/** Stores the last received nested touch event in screen coordinates along the x-axis. */
	private int lastRawTouchX;

	/** Stores the last received nested touch event in screen coordinates along the y-axis. */
	private int lastRawTouchY;

	/** Min pixel distance a touch move must cover before it's considered to be a drag/scroll event. */
	private int minDragStartDistance;

	/** Set true if we're in the middle of doing a nested drag/scroll. */
	private boolean isDragging;

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
		// Fetch the system's min touch move distance until it's considered to be a drag event.
		// Note: This is the same setting Android's ScrollViews use.
		ViewConfiguration viewConfiguration = ViewConfiguration.get(getContext());
		if (viewConfiguration != null) {
			this.minDragStartDistance = viewConfiguration.getScaledTouchSlop();
		}

		// Set up this view for nested scrolling.
		this.nestedScrollingHelper = new NestedScrollingChildHelper(this);
		setNestedScrollingEnabled(true);
	}

	/**
	 * Called when set text programmatically. Add setSection to move cursor to the last position.
	 * The method is added for TIMOB-25655 Set textfield value by coding will make cursor to the beginning of textfield
	 * @param text New text value to be set
	 * @param type TextView.BufferType - characteristics of the text such as static, styleable, or editable.
	 */
	@Override
	public void setText(CharSequence text, BufferType type)
	{
		// Update the field's text.
		super.setText(text, type);

		// Move the cursor to the end of the field. (Matches iOS' behavior.)
		setSelection(length());
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
		// Work-around Android bug where center-alisgned and right-aligned EditText won't
		// always pan above the virtual keyboard when given the focus. (See TIMOB-23757)
		boolean isLeftAligned = (getGravity() & Gravity.LEFT) != 0;
		if ((Build.VERSION.SDK_INT < 24) && !isLeftAligned && (keyCode == KeyEvent.KEYCODE_BACK)) {
			ViewGroup view = (ViewGroup) getParent();
			view.setFocusableInTouchMode(true);
			view.requestFocus();
		}
		return super.onKeyPreIme(keyCode, event);
	}

	/**
	 * Called when view's contents has scrolled by the given amount.
	 * This method will be called when scrolling via touch events and method calls such as scrollBy().
	 * @param currentX Current horizontal scroll position.
	 * @param currentY Current vertical scroll position.
	 * @param previousX Previous horizontal scroll position.
	 * @param previousY Previous vertical scroll position.
	 */
	@Override
	public void onScrollChanged(int currentX, int currentY, int previousX, int previousY)
	{
		// Handle scroll change event.
		super.onScrollChanged(currentX, currentY, previousX, previousY);

		// Disable parent view touch interception while the EditText is being scrolled.
		// Prevents vertical scroll view from stealing touch events while horizontally scrolling single-line field.
		// Note: Android will re-enable touch interception on next touch ACTION_DOWN or ACTION_UP event.
		ViewParent parentView = getParent();
		if (parentView != null) {
			parentView.requestDisallowInterceptTouchEvent(true);
		}
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
		boolean wasHandled = false;
		switch (event.getActionMasked()) {
			case MotionEvent.ACTION_DOWN: {
				// Determine if the EditText can be scrolled vertically or horizontally.
				// Note: There is a bug in EditText where canScrollHorizontally() will return
				//       true when it's not scrollable for "center" or "right" aligned text.
				boolean isVertical = ((getInputType() & EditorInfo.TYPE_TEXT_FLAG_MULTI_LINE) != 0);
				boolean isScrollable;
				if (isVertical) {
					isScrollable = canScrollVertically(1) || canScrollVertically(-1);
				} else {
					isScrollable = canScrollHorizontally(1) || canScrollHorizontally(-1);
				}

				// Start nested scrolling if the EditText is scrollable.
				this.isDragging = false;
				if (isScrollable) {
					if (isVertical) {
						this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_VERTICAL;
					} else {
						this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_HORIZONTAL;
					}
					this.startRawTouchX = (int) event.getRawX();
					this.startRawTouchY = (int) event.getRawY();
					this.lastRawTouchX = this.startRawTouchX;
					this.lastRawTouchY = this.startRawTouchY;
					boolean wasStarted = startNestedScroll(this.scrollAxisDirection);
					if (!wasStarted) {
						this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_NONE;
					}
				}

				// Let the base class handle the touch "down" event.
				wasHandled = super.onTouchEvent(event);
				break;
			}
			case MotionEvent.ACTION_MOVE: {
				// Handle nested scrolling, if enabled.
				if (this.scrollAxisDirection != ViewCompat.SCROLL_AXIS_NONE) {
					// Determine if the touch point has moved far enough to be considered a drag event.
					// Note: Touch down/up events within this min distance are considered taps/clicks.
					boolean isVertical = (this.scrollAxisDirection == ViewCompat.SCROLL_AXIS_VERTICAL);
					if (!this.isDragging) {
						int dragDistance;
						if (isVertical) {
							dragDistance = this.startRawTouchY - (int) event.getRawY();
						} else {
							dragDistance = this.startRawTouchX - (int) event.getRawX();
						}
						if (Math.abs(dragDistance) > this.minDragStartDistance) {
							this.isDragging = true;
						}
					}

					// Check if we need to scroll the parent, if currently dragging.
					if (this.isDragging) {
						// Determine scroll direction, distance, and if EditText has hit scroll limit.
						computeScroll();
						int deltaX = this.lastRawTouchX - (int) event.getRawX();
						int deltaY = this.lastRawTouchY - (int) event.getRawY();
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

						// Request the parent to scroll if one of the following is true:
						// - EditText is not scrollable. (ie: All text fits within the box.)
						// - EditText is scrollabe, but cannot scroll any further in given direction.
						if (!isScrollEnabled || !canScrollFurther) {
							wasHandled = dispatchNestedPreScroll(deltaX, deltaY, null, null);
							wasHandled |= dispatchNestedScroll(0, 0, deltaX, deltaY, null);
						}

						// Cancel EditText's long-press timer if parent was scrolled.
						// Note: EditText will move with the user's finger while scrolling the parent
						//       in this case and we don't want it to trigger a long-press text selection.
						if (wasHandled) {
							cancelLongPress();
						}
					}

					// Store the last received touch point in screen coordinates.
					// This is needed to calculate nested scroll distances.
					this.lastRawTouchX = (int) event.getRawX();
					this.lastRawTouchY = (int) event.getRawY();
				}

				// Let the EditText handle the event if the parent wasn't scrolled via the above.
				if (!wasHandled) {
					wasHandled = super.onTouchEvent(event);
				}
				break;
			}
			case MotionEvent.ACTION_CANCEL:
			case MotionEvent.ACTION_UP: {
				// Handle the touch release event.
				wasHandled = super.onTouchEvent(event);

				// Stop nested-scrolling if active.
				this.isDragging = false;
				if (this.scrollAxisDirection != ViewCompat.SCROLL_AXIS_NONE) {
					stopNestedScroll();
					this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_NONE;
				}
				break;
			}
			default: {
				// Let the base class handle all other events, such as multi-touch.
				wasHandled = super.onTouchEvent(event);
				break;
			}
		}
		return wasHandled;
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
	public boolean dispatchNestedScroll(int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed,
										int[] offsetInWindow)
	{
		return this.nestedScrollingHelper.dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed,
															   offsetInWindow);
	}

	@Override
	public boolean dispatchNestedScroll(int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed,
										int[] offsetInWindow, int type)
	{
		return this.nestedScrollingHelper.dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed,
															   offsetInWindow, type);
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
