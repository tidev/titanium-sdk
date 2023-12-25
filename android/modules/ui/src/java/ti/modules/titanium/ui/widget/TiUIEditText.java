/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Rect;
import android.os.Build;
import android.text.InputType;
import android.text.method.ArrowKeyMovementMethod;
import android.util.AttributeSet;
import android.view.ActionMode;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.view.ViewParent;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.view.NestedScrollingChild2;
import androidx.core.view.NestedScrollingChildHelper;
import androidx.core.view.ViewCompat;
import com.google.android.material.textfield.TextInputEditText;
import java.util.HashSet;

/**
 * EditText derived class used by Titanium's "Ti.UI.TextField" and "Ti.UI.TextArea" types.
 * <p>
 * Provides nested scrolling support within a NestedScrollingParent view group such as
 * Google's NestedScrollView and Titanium's TiNestedListView.
 */
public class TiUIEditText extends TextInputEditText implements NestedScrollingChild2
{
	/** Collection of context menu IDs used to edit the input field such as "cut", "paste", "auto-fill", etc. */
	private static final HashSet<Integer> editMenuIdSet;

	/** Collection of context menu IDs used to copy text from the input field such as "copy", "cut", "share", etc. */
	private static final HashSet<Integer> copyMenuIdSet;

	/* Initialize static member variables. */
	static
	{
		editMenuIdSet = new HashSet<>();
		editMenuIdSet.add(android.R.id.autofill);
		editMenuIdSet.add(android.R.id.cut);
		editMenuIdSet.add(android.R.id.paste);
		editMenuIdSet.add(android.R.id.pasteAsPlainText);
		editMenuIdSet.add(android.R.id.replaceText);

		copyMenuIdSet = new HashSet<>();
		copyMenuIdSet.add(android.R.id.copy);
		copyMenuIdSet.add(android.R.id.copyUrl);
		copyMenuIdSet.add(android.R.id.cut);
		copyMenuIdSet.add(android.R.id.shareText);
	}

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

	/** Set true to allow text to be copied via context menu, Ctrl+C, etc. */
	private boolean isCopyEnabled = true;

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
	 * Enables/disables text selection for a read-only EditText.
	 * Enabling it allows the end-user to copy selected text to the clipboard.
	 * <p>
	 * Note that an enabled EditText always allows text selection, even if this is set false.
	 * This method is mostly intended for TextView objects (which EditText derives from),
	 * but can be used by an EditText whose input type is set to TYPE_NULL (ie: read-only).
	 * @param isSelectable Enables or disables read-only text selection.
	 */
	@Override
	public void setTextIsSelectable(boolean isSelectable)
	{
		if (!isSelectable && isTextSelectable()) {
			// Work-around for Google bugs when changing setting from true to false. (False is default setting.)
			// - Setting back to false will disable view's focus/click settings when we don't want it to.
			// - Setting back to false prevents virtual keyboard from appearing on Android versions older than 9.0.

			// Fetch current view states. We do this because setTextIsSelectable() will change them.
			int lastFocusState = 0;
			if (Build.VERSION.SDK_INT >= 26) {
				lastFocusState = getFocusable();
			}
			boolean wasFocusable = isFocusable();
			boolean wasClickable = isClickable();
			boolean wasLongClickable = isLongClickable();

			// Disable read-only text selection.
			// Note: Text selection still works when NOT using "InputType.TYPE_NULL".
			super.setTextIsSelectable(false);

			// Restore previous settings that above method clobbered. (This is the work-around.)
			if (Build.VERSION.SDK_INT >= 26) {
				setFocusable(lastFocusState);
			} else {
				setFocusable(wasFocusable);
			}
			setFocusableInTouchMode(wasFocusable);
			setClickable(wasClickable);
			setLongClickable(wasLongClickable);
			setMovementMethod(ArrowKeyMovementMethod.getInstance());
			setText(getText(), BufferType.SPANNABLE);
		} else {
			// Call the method normally.
			super.setTextIsSelectable(isSelectable);
		}
	}

	/**
	 * Determines if text can be copied from the input field. Can be changed via setIsCopyEnabled() method.
	 * <p/>
	 * If password masking is enabled, then copy support is disabled by the system and this method is ignored.
	 * @return Returns true if text can be copied, which is the default. Returns false if disabled.
	 */
	public boolean isCopyEnabled()
	{
		return this.isCopyEnabled;
	}

	/**
	 * Enables or disables the ability to copy text from the input field.
	 * Disabling it will remove "copy", "cut", "share", etc. from the context menu and block Ctrl+C support.
	 * <p/>
	 * If password masking is enabled, then copy support is disabled by the system and this method is ignored.
	 * @param value Set true to enable "copy" support. Set false to not allow copy support.
	 */
	public void setIsCopyEnabled(boolean value)
	{
		this.isCopyEnabled = value;
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
		// Work-around Android bug where center-aligned and right-aligned EditText won't
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
	 * Called when a context menu item such as "Copy", "Paste", etc. has been tapped on.
	 * @param id The integer ID of the action that was selected in the context menu.
	 * @return Returns true if given menu item's action was performed. Returns false if not.
	 */
	@Override
	public boolean onTextContextMenuItem(int id)
	{
		// Do not allow actions that change the text if we're in read-only mode.
		if ((getInputType() == InputType.TYPE_NULL) && TiUIEditText.editMenuIdSet.contains(id)) {
			return false;
		}

		// Do not allow copy related actions if disabled.
		if (!this.isCopyEnabled && TiUIEditText.copyMenuIdSet.contains(id)) {
			return false;
		}

		// Let the base class handle the action.
		return super.onTextContextMenuItem(id);
	}

	/**
	 * Called when the system is about to display a context menu on the input field.
	 * @param callback Callback used to create the menu and handle its clicked items.
	 * @return Returns the new context menu handling action mode. Returns null to not show a menu.
	 */
	@Override
	public ActionMode startActionMode(ActionMode.Callback callback)
	{
		return super.startActionMode(onWrap(callback));
	}

	/**
	 * Called when the system is about to display a context menu on the input field.
	 * @param callback Callback used to create the menu and handle its clicked items.
	 * @param type Can be set to ActionMode.TYPE_PRIMARY or ActionMode.TYPE_FLOATING.
	 * @return Returns the new context menu handling action mode. Returns null to not show a menu.
	 */
	@Override
	@RequiresApi(23)
	public ActionMode startActionMode(ActionMode.Callback callback, int type)
	{
		return super.startActionMode(onWrap(callback), type);
	}

	/**
	 * Wraps the given action mode callback if its context menu needs to be overridden,
	 * such as removing menu items that can change the input field if we're in read-only mode.
	 * <p/>
	 * This method is expected to be called by the startActionMode() overrides.
	 * @param callback The callback to be wrapped, if needed. Can be null.
	 * @return
	 * Returns a new callback instance if wrapped.
	 * Returns given callback reference if it's context menu does not need to be overridden.
	 */
	@SuppressLint("NewApi")
	private ActionMode.Callback onWrap(ActionMode.Callback callback)
	{
		// Validate.
		if (callback == null) {
			return null;
		}

		// If we need to remove copy, cut, or other menu items then wrap the given callback.
		if (!this.isCopyEnabled || (getInputType() == InputType.TYPE_NULL)) {
			// Create a set of menu IDs that need to be removed from the context menu.
			HashSet<Integer> excludeMenuIdSet = new HashSet<>();
			if (!this.isCopyEnabled) {
				excludeMenuIdSet.addAll(TiUIEditText.copyMenuIdSet);
			}
			if (getInputType() == InputType.TYPE_NULL) {
				excludeMenuIdSet.addAll(TiUIEditText.editMenuIdSet);
			}

			// Wrap the given callback used to override context menu handling.
			if ((Build.VERSION.SDK_INT >= 23) && (callback instanceof ActionMode.Callback2)) {
				callback = new ActionModeCallback2Wrapper((ActionMode.Callback2) callback, excludeMenuIdSet);
			} else {
				callback = new ActionModeCallbackWrapper(callback, excludeMenuIdSet);
			}
		}
		return callback;
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
				boolean hadFocus = isFocused();
				wasHandled = super.onTouchEvent(event);

				// Stop nested-scrolling if active.
				this.isDragging = false;
				if (this.scrollAxisDirection != ViewCompat.SCROLL_AXIS_NONE) {
					stopNestedScroll();
					this.scrollAxisDirection = ViewCompat.SCROLL_AXIS_NONE;
				}

				// If a tap was handled and gave this view the focus, then invoke the click listener.
				// Note: Normally a click event is stolen in this case, but we want to match iOS' behavior.
				if (wasHandled && !hadFocus && isFocused()) {
					callOnClick();
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

	/** Wraps Google's "ActionMode.Callback" so that we can remove particular context menu items from it. */
	private static class ActionModeCallbackWrapper implements ActionMode.Callback
	{
		private final ActionMode.Callback callback;
		private final HashSet<Integer> excludeMenuIdSet;

		/**
		 * Creates an action mode callback which wraps the given callback.
		 * Acts as a pass through and remove menu items matching the given menu ID set.
		 * @param callback The callback to be wrapped.
		 * @param excludeMenuIdSet Set of menu item IDs to be removed, such as "android.R.id.copy".
		 */
		public ActionModeCallbackWrapper(@NonNull ActionMode.Callback callback, HashSet<Integer> excludeMenuIdSet)
		{
			this.callback = callback;
			this.excludeMenuIdSet = excludeMenuIdSet;
		}

		public ActionMode.Callback getWrappedCallback()
		{
			return this.callback;
		}

		@Override
		public boolean onActionItemClicked(ActionMode mode, MenuItem item)
		{
			return this.callback.onActionItemClicked(mode, item);
		}

		@Override
		public boolean onCreateActionMode(ActionMode mode, Menu menu)
		{
			boolean wasCreated = this.callback.onCreateActionMode(mode, menu);
			if ((menu != null) && (this.excludeMenuIdSet != null)) {
				for (int nextId : this.excludeMenuIdSet) {
					menu.removeItem(nextId);
				}
			}
			return wasCreated;
		}

		@Override
		public boolean onPrepareActionMode(ActionMode mode, Menu menu)
		{
			return this.callback.onPrepareActionMode(mode, menu);
		}

		@Override
		public void onDestroyActionMode(ActionMode mode)
		{
			this.callback.onDestroyActionMode(mode);
		}
	}

	/** Wraps Google's "ActionMode.Callback2" so that we can remove particular context menu items from it. */
	@RequiresApi(23)
	private static class ActionModeCallback2Wrapper extends ActionMode.Callback2
	{
		private final ActionModeCallbackWrapper callback;

		/**
		 * Creates an action mode callback which wraps the given Callback2 instance.
		 * Acts as a pass through and remove menu items matching the given menu ID set.
		 * @param callback The callback to be wrapped.
		 * @param excludeMenuIdSet Set of menu item IDs to be removed, such as "android.R.id.copy".
		 */
		public ActionModeCallback2Wrapper(@NonNull ActionMode.Callback2 callback, HashSet<Integer> excludeMenuIdSet)
		{
			this.callback = new ActionModeCallbackWrapper(callback, excludeMenuIdSet);
		}

		@Override
		public boolean onActionItemClicked(ActionMode mode, MenuItem item)
		{
			return this.callback.onActionItemClicked(mode, item);
		}

		@Override
		public boolean onCreateActionMode(ActionMode mode, Menu menu)
		{
			return this.callback.onCreateActionMode(mode, menu);
		}

		@Override
		public void onGetContentRect(ActionMode mode, View view, Rect outRect)
		{
			ActionMode.Callback2 wrappedCallback = (ActionMode.Callback2) this.callback.getWrappedCallback();
			wrappedCallback.onGetContentRect(mode, view, outRect);
		}

		@Override
		public boolean onPrepareActionMode(ActionMode mode, Menu menu)
		{
			return this.callback.onPrepareActionMode(mode, menu);
		}

		@Override
		public void onDestroyActionMode(ActionMode mode)
		{
			this.callback.onDestroyActionMode(mode);
		}
	}
}
