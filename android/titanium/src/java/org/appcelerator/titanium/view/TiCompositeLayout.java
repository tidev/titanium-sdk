/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import java.lang.ref.WeakReference;
import java.util.Comparator;
import java.util.TreeSet;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiLaunchActivity;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.OnHierarchyChangeListener;
import android.view.WindowInsets;

/**
 * Base layout class for all Titanium views.
 */
public class TiCompositeLayout extends ViewGroup implements OnHierarchyChangeListener
{
	/**
	 * Supported layout arrangements
	 *
	 * @module.api
	 */
	public enum LayoutArrangement {
		/**
		 * The default Titanium layout arrangement.
		 */
		DEFAULT,
		/**
		 * The layout arrangement for Views and Windows that set layout:
		 * "vertical".
		 */
		VERTICAL,
		/**
		 * The layout arrangement for Views and Windows that set layout:
		 * "horizontal".
		 */
		HORIZONTAL
	}

	protected static final String TAG = "TiCompositeLayout";

	public static final int NOT_SET = Integer.MIN_VALUE;

	private TreeSet<View> viewSorter;
	private boolean needsSort;
	protected LayoutArrangement arrangement;

	// Used by horizonal arrangement calculations
	private int horizontalLayoutTopBuffer = 0;
	private int horizontalLayoutCurrentLeft = 0;
	private int horizontalLayoutLineHeight = 0;
	private boolean enableHorizontalWrap = true;
	private int horizontalLayoutLastIndexBeforeWrap = 0;
	private int horiztonalLayoutPreviousRight = 0;

	/**
	 * Custom pixel width to be used by child views when calculating percentage based lengths/positions.
	 * Set to a negative value if child should be relative to the parent view.
	 */
	private int childRelativeSizingWidth = -1;

	/**
	 * Custom pixel height to be used by child views when calculating percentage based lengths/positions.
	 * Set to a negative value if child should be relative to the parent view.
	 */
	private int childRelativeSizingHeight = -1;

	/**
	 * Custom pixel width to be used by child views using the Ti.UI.FILL setting.
	 * Set to a negative value if child should fill the parent's remaining width instead.
	 */
	private int childFillWidth = -1;

	/**
	 * Custom pixel height to be used by child views using the Ti.UI.FILL setting.
	 * Set to a negative value if child should fill the parent's remaining height instead.
	 */
	private int childFillHeight = -1;

	/**
	 * The last window insets object received by the onApplyWindowInsets() method.
	 * This object is immutable. Will be null if not received yet or has been cleared.
	 * Note: This references an Android 5.0 class. Do NOT access it in older Android OS versions.
	 */
	private WindowInsets previousInsets;

	private WeakReference<TiViewProxy> proxy;

	// We need these two constructors for backwards compatibility with modules

	/**
	 * Constructs a new TiCompositeLayout object.
	 *
	 * @param context the associated context.
	 * @module.api
	 */
	public TiCompositeLayout(Context context)
	{
		this(context, LayoutArrangement.DEFAULT, null, null);
	}

	/**
	 * Constructs a new TiCompositeLayout object.
	 *
	 * @param context the associated context.
	 * @param arrangement the associated LayoutArrangement
	 * @module.api
	 */
	public TiCompositeLayout(Context context, LayoutArrangement arrangement)
	{
		this(context, LayoutArrangement.DEFAULT, null, null);
	}

	public TiCompositeLayout(Context context, AttributeSet set)
	{
		this(context, LayoutArrangement.DEFAULT, null, set);
	}

	/**
	 * Constructs a new TiCompositeLayout object.
	 *
	 * @param context the associated context.
	 * @param proxy the associated proxy.
	 */
	public TiCompositeLayout(Context context, TiViewProxy proxy)
	{
		this(context, LayoutArrangement.DEFAULT, proxy, null);
	}

	/**
	 * Constructs a new TiCompositeLayout object.
	 *
	 * @param context the associated context.
	 * @param arrangement the associated LayoutArrangement
	 * @param proxy the associated proxy.
	 */
	public TiCompositeLayout(Context context, LayoutArrangement arrangement, TiViewProxy proxy)
	{
		this(context, arrangement, proxy, null);
	}

	/**
	 * Constructs a new TiCompositeLayout object.
	 *
	 * @param context the associated context.
	 * @param arrangement the associated LayoutArrangement
	 * @param proxy the associated proxy.
	 * @param set the component attribute set.
	 */
	public TiCompositeLayout(Context context, LayoutArrangement arrangement, TiViewProxy proxy, AttributeSet set)
	{
		super(context, set);

		this.arrangement = arrangement;
		this.viewSorter = new TreeSet<View>(new Comparator<View>() {
			public int compare(View o1, View o2)
			{
				// TIMOB-20206 and
				// https://android-review.googlesource.com/#/c/257511/1/ojluni/src/main/java/java/util/TreeMap.java
				// We need to check if o1 or o2 is null
				if (o1 == null || o2 == null) {
					throw new NullPointerException("null view");
				}
				// We need to check if the view being compared is itself and
				// return 0.
				if (o2.equals(o1)) {
					return 0;
				}

				TiCompositeLayout.LayoutParams p1 = (TiCompositeLayout.LayoutParams) o1.getLayoutParams();
				TiCompositeLayout.LayoutParams p2 = (TiCompositeLayout.LayoutParams) o2.getLayoutParams();

				int result = 0;

				if (p1.optionZIndex != NOT_SET && p2.optionZIndex != NOT_SET) {
					if (p1.optionZIndex < p2.optionZIndex) {
						result = -1;
					} else if (p1.optionZIndex > p2.optionZIndex) {
						result = 1;
					}
				} else if (p1.optionZIndex != NOT_SET) {
					if (p1.optionZIndex < 0) {
						result = -1;
					}
					if (p1.optionZIndex > 0) {
						result = 1;
					}
				} else if (p2.optionZIndex != NOT_SET) {
					if (p2.optionZIndex < 0) {
						result = 1;
					}
					if (p2.optionZIndex > 0) {
						result = -1;
					}
				}

				if (result == 0) {
					if (p1.index < p2.index) {
						result = -1;
					} else if (p1.index > p2.index) {
						result = 1;
					} else {
						throw new IllegalStateException("Ambiguous Z-Order");
					}
				}

				return result;
			}
		});

		setNeedsSort(true);
		setOnHierarchyChangeListener(this);
		this.proxy = new WeakReference<TiViewProxy>(proxy);
	}

	private String viewToString(View view)
	{
		return view.getClass().getSimpleName() + "@" + Integer.toHexString(view.hashCode());
	}

	/**
	 * Sets a custom width/height for child views to calculate their percentage based
	 * width/height and top/bottom/left/right/center properties against.
	 * <p>
	 * Once this method is called, child views will no longer be percent sized/positioned
	 * based on this layout's size.
	 * <p>
	 * Example Usage: Scroll views call this method so that child views are percent sized/positioned
	 * based on the ScrollView container size instead of the scrollable content area's size.
	 * @param width The custom width to be used. Can be zero.
	 * @param height The custom height to be used. Can be zero.
	 */
	public void setChildRelativeSizingTo(int width, int height)
	{
		this.childRelativeSizingWidth = Math.max(width, 0);
		this.childRelativeSizingHeight = Math.max(height, 0);
	}

	/**
	 * Configures this layout to size and position child views that use a percentage based
	 * width/height and top/bottom/left/right/center properties reatlive to this parent
	 * layout's width and height.
	 * <p>
	 * This is the default setting.
	 * <p>
	 * Calling this method clears the setChildRelativeSizingTo() settings.
	 */
	public void setChildRelativeSizingToParent()
	{
		this.childRelativeSizingWidth = -1;
		this.childRelativeSizingHeight = -1;
	}

	/**
	 * Gets the custom width that was given to the last call to the setChildRelativeSizingTo() method.
	 * This is the width that a child view's percent based size/position properties are relative to.
	 * @return
	 * Returns the custom assigned relative width.
	 * <p>
	 * Returns -1 (the default) if percentage based calculations are based on this layout's width.
	 */
	public int getChildRelativeSizingWidth()
	{
		return this.childRelativeSizingWidth;
	}

	/**
	 * Gets the custom height that was given to the last call to the setChildRelativeSizingTo() method.
	 * This is the height that a child view's percent based size/position properties are relative to.
	 * @return
	 * Returns the custom assigned relative height.
	 * <p>
	 * Returns -1 (the default) if percentage based calculations are based on this layout's height.
	 */
	public int getChildRelativeSizingHeight()
	{
		return this.childRelativeSizingHeight;
	}

	/**
	 * Configures this layout to have child views whose "width" property is set to Ti.UI.FILL
	 * to fill the parent's remaining width.
	 * <p>
	 * If the setChildFillWidth() method was called before, then its setting is cleared.
	 * <p>
	 * This is the default setting.
	 */
	public void setChildFillWidthToParent()
	{
		this.childFillWidth = -1;
	}

	/**
	 * Sets a custom width to be used by child views whose "width" property is set to Ti.UI.FILL.
	 * This prevents child views from using this layout's remaining width, which is the normal behavior.
	 * <p>
	 * Example Usage: Scroll views set this to their container width when "contentWidth" is auto.
	 * @param value The custom fill width to be used. Can be zero.
	 */
	public void setChildFillWidth(int value)
	{
		this.childFillWidth = Math.max(value, 0);
	}

	/**
	 * Gets the custom fill width given to the setChildFillWidth() method.
	 * @return
	 * Returns the custom fill width to be applied to child views using Ti.UI.FILL.
	 * <p>
	 * Returns -1 (the default) indicating that child views will fill this layout's remaining width.
	 */
	public int getChildFillWidth()
	{
		return this.childFillWidth;
	}

	/**
	 * Configures this layout to have child views whose "height" property is set to Ti.UI.FILL
	 * to fill the parent's remaining height.
	 * <p>
	 * If the setChildFillHeight() method was called before, then its setting is cleared.
	 * <p>
	 * This is the default setting.
	 */
	public void setChildFillHeightToParent()
	{
		this.childFillHeight = -1;
	}

	/**
	 * Sets a custom height to be used by child views whose "height" property is set to Ti.UI.FILL.
	 * This prevents child views from using this layout's remaining height, which is the normal behavior.
	 * <p>
	 * Example Usage: Scroll views set this to their container height when "contentHeight" is auto.
	 * @param value The custom fill height to be used. Can be zero.
	 */
	public void setChildFillHeight(int value)
	{
		this.childFillHeight = Math.max(value, 0);
	}

	/**
	 * Gets the custom fill height given to the setChildFillHeight() method.
	 * @return
	 * Returns the custom fill height to be applied to child views using Ti.UI.FILL.
	 * <p>
	 * Returns -1 (the default) indicating that child views will fill this layout's remaining height.
	 */
	public int getChildFillHeight()
	{
		return this.childFillHeight;
	}

	public void resort()
	{
		setNeedsSort(true);
		requestLayout();
		invalidate();
	}

	public void onChildViewAdded(View parent, View child)
	{
		setNeedsSort(true);
		if (Log.isDebugModeEnabled() && parent != null && child != null) {
			Log.d(TAG, "Attaching: " + viewToString(child) + " to " + viewToString(parent), Log.DEBUG_MODE);
		}
	}

	public void onChildViewRemoved(View parent, View child)
	{
		setNeedsSort(true);
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Removing: " + viewToString(child) + " from " + viewToString(parent), Log.DEBUG_MODE);
		}
	}

	@Override
	protected boolean checkLayoutParams(ViewGroup.LayoutParams p)
	{
		return p instanceof TiCompositeLayout.LayoutParams;
	}

	@Override
	protected LayoutParams generateDefaultLayoutParams()
	{
		return new LayoutParams();
	}

	private static int getAsPercentageValue(double percentage, int value)
	{
		return (int) Math.floor((percentage / 100.0) * value);
	}

	protected int getViewWidthPadding(View child, int parentWidth)
	{
		// Determine what size a percentage based coordinate will be relative to.
		// Normally defaults to the parent's width unless a custom value was provided.
		// Ex: ScrollViews are relative to the container instead of the scrollable content area.
		int relativeWidth = parentWidth;
		if (this.childRelativeSizingWidth >= 0) {
			relativeWidth = this.childRelativeSizingWidth;
		}

		// Calculate the given view's left/right padding size in pixels.
		LayoutParams p = (LayoutParams) child.getLayoutParams();
		int padding = 0;
		if (p.optionLeft != null) {
			if (p.optionLeft.isUnitPercent()) {
				padding += getAsPercentageValue(p.optionLeft.getValue(), relativeWidth);
			} else {
				padding += p.optionLeft.getAsPixels(this);
			}
		}
		if (p.optionRight != null) {
			if (p.optionRight.isUnitPercent()) {
				padding += getAsPercentageValue(p.optionRight.getValue(), relativeWidth);
			} else {
				padding += p.optionRight.getAsPixels(this);
			}
		}
		return padding;
	}

	protected int getViewHeightPadding(View child, int parentHeight)
	{
		// Determine what size a percentage based coordinate will be relative to.
		// Normally defaults to the parent's height unless a custom value was provided.
		// Ex: ScrollViews are relative to the container instead of the scrollable content area.
		int relativeHeight = parentHeight;
		if (this.childRelativeSizingHeight >= 0) {
			relativeHeight = this.childRelativeSizingHeight;
		}

		// Calculate the given view's top/bottom padding size in pixels.
		LayoutParams p = (LayoutParams) child.getLayoutParams();
		int padding = 0;
		if (p.optionTop != null) {
			if (p.optionTop.isUnitPercent()) {
				padding += getAsPercentageValue(p.optionTop.getValue(), relativeHeight);
			} else {
				padding += p.optionTop.getAsPixels(this);
			}
		}
		if (p.optionBottom != null) {
			if (p.optionBottom.isUnitPercent()) {
				padding += getAsPercentageValue(p.optionBottom.getValue(), relativeHeight);
			} else {
				padding += p.optionBottom.getAsPixels(this);
			}
		}
		return padding;
	}

	/**
	 * Called when the window insets (translucent status bar, navigation bar, or screen notches) have changed
	 * size or position. Can be used to layout views around the insets if setFitsSystemWindows() is true.
	 * <p>
	 * Layouts such as "FrameLayout", "LinearLayout", and "RelativeLayout" do not pass insets to child views.
	 * So, Titanium's "TiCompositeLayout" needs to do this manually.
	 * @param insets The new insets to be applied to this layout and its child views. Can be null.
	 * @return Returns the given insets minus the insets consumed by this view layout.
	 */
	@Override
	public WindowInsets onApplyWindowInsets(WindowInsets insets)
	{
		// Validate.
		if (insets == null) {
			return null;
		}

		// Do not propagate given insets to child views unless the insets have changed.
		// This greatly improves performance if we have deeply nested views since each view will trigger a relayout.
		if (insets.equals(this.previousInsets)) {
			return insets;
		}
		this.previousInsets = insets;

		// Apply insets to all child views and don't let them consume given insets.
		// We must do this since a "composite" layout supports overlapping views.
		final int childCount = getChildCount();
		for (int index = 0; index < childCount; index++) {
			View childView = getChildAt(index);
			if (childView != null) {
				childView.dispatchApplyWindowInsets(insets);
			}
		}
		return insets;
	}

	/**
	 * Requests parent view (and the parent's parent) to redispatch system insets to all child views.
	 * This method should be called when dynamically adding views that have setFitsSystemWindows() set to true.
	 */
	@Override
	public void requestApplyInsets()
	{
		// The super class' method is only supported on Android 5.0 and higher.
		if (Build.VERSION.SDK_INT < 20) {
			return;
		}

		// Clear last stored insets and then request parent to redispatch system insets to all child views.
		this.previousInsets = null;
		super.requestApplyInsets();
	}

	/**
	 * Requests parent view (and the parent's parent) to redispatch system insets to all child views.
	 * This method should be called when dynamically adding views that have setFitsSystemWindows() set to true.
	 */
	@Override
	public void requestFitSystemWindows()
	{
		// Clear last stored insets and then request parent to redispatch system insets to all child views.
		if (Build.VERSION.SDK_INT >= 20) {
			this.previousInsets = null;
		}
		super.requestFitSystemWindows();
	}

	/** Called when this view has been detached/removed from the activity window. */
	@Override
	protected void onDetachedFromWindow()
	{
		super.onDetachedFromWindow();

		// Clear last stored insets received by the onApplyWindowInsets() method.
		if (Build.VERSION.SDK_INT >= 20) {
			this.previousInsets = null;
		}
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		int childCount = getChildCount();
		int wFromSpec = MeasureSpec.getSize(widthMeasureSpec);
		int hFromSpec = MeasureSpec.getSize(heightMeasureSpec);
		int wSuggested = getSuggestedMinimumWidth();
		int hSuggested = getSuggestedMinimumHeight();
		int w = Math.max(wFromSpec, wSuggested);
		int wRemain = w;
		int wMode = MeasureSpec.getMode(widthMeasureSpec);
		int h = Math.max(hFromSpec, hSuggested);
		int hMode = MeasureSpec.getMode(heightMeasureSpec);

		int maxWidth = 0;
		int maxHeight = 0;

		// Used for horizontal layout only
		int horizontalRowWidth = 0;
		int horizontalRowHeight = 0;

		for (int i = 0; i < childCount; i++) {
			// Apply a width and height to the next child view owned by this layout.
			View child = getChildAt(i);
			if (child.getVisibility() != View.GONE) {
				// Calculate remaining height to fill. (Only applicable to horizontal/vertical layouts.)
				int hRemain = isDefaultArrangement() ? h : (h - maxHeight);

				// If a custom fill size was provided, then use it instead of the remaining size.
				// Note: ScrollViews set this to size of container unless "contentWidth" is set.
				int wRemainForChild = (this.childFillWidth >= 0) ? this.childFillWidth : wRemain;
				int hRemainForChild = (this.childFillHeight >= 0) ? this.childFillHeight : hRemain;

				// Constrain the child view to this view's bounds.
				constrainChild(child, w, wMode, h, hMode, wRemainForChild, hRemainForChild);
			}

			// Fetch the child view's new measurements, minus the padding.
			int childWidth = 0;
			int childHeight = 0;
			if (child.getVisibility() != View.GONE) {
				childWidth = child.getMeasuredWidth() + getViewWidthPadding(child, w);
				childHeight = child.getMeasuredHeight() + getViewHeightPadding(child, h);
			}

			if (isHorizontalArrangement()) {
				if (enableHorizontalWrap) {
					wRemain -= childWidth;
					if (wRemain > 0) {
						// Row has room for this view and can fit more.
						horizontalRowWidth += childWidth;
					} else if ((wRemain < 0) && (horizontalRowWidth > 0)) {
						// View needs to be wrapped to the next row.
						maxHeight += horizontalRowHeight;
						horizontalRowWidth = childWidth;
						horizontalRowHeight = childHeight;
						wRemain = (w - childWidth);
					} else {
						// The row is completely full or it has been exceeded by one view.
						horizontalRowWidth += childWidth;
						maxHeight += Math.max(horizontalRowHeight, childHeight);
						maxWidth = Math.max(maxWidth, horizontalRowWidth);
						horizontalRowWidth = 0;
						horizontalRowHeight = 0;
						childHeight = 0;
						wRemain = w;
					}
					maxWidth = Math.max(maxWidth, horizontalRowWidth);
				} else {
					// For horizontal layout without wrap, just keep on adding
					// the widths since it doesn't wrap
					maxWidth += childWidth;
				}
				horizontalRowHeight = Math.max(horizontalRowHeight, childHeight);

			} else {
				maxWidth = Math.max(maxWidth, childWidth);

				if (isVerticalArrangement()) {
					maxHeight += childHeight;
				} else {
					maxHeight = Math.max(maxHeight, childHeight);
				}
			}
		}

		// Add height for last row in horizontal layout
		if (isHorizontalArrangement()) {
			maxHeight += horizontalRowHeight;
		}

		// account for padding
		maxWidth += getPaddingLeft() + getPaddingRight();
		maxHeight += getPaddingTop() + getPaddingBottom();

		// Account for border
		// int padding = Math.round(borderHelper.calculatePadding());
		// maxWidth += padding;
		// maxHeight += padding;

		// check minimums
		maxWidth = Math.max(maxWidth, getSuggestedMinimumWidth());
		maxHeight = Math.max(maxHeight, getSuggestedMinimumHeight());

		int measuredWidth = getMeasuredWidth(maxWidth, widthMeasureSpec);
		int measuredHeight = getMeasuredHeight(maxHeight, heightMeasureSpec);
		setMeasuredDimension(measuredWidth, measuredHeight);
	}

	protected void constrainChild(View child, int width, int wMode, int height, int hMode, int remainWidth,
								  int remainHeight)
	{
		// Floor arguments to valid values.
		if (remainWidth < 0) {
			remainWidth = 0;
		}
		if (remainHeight < 0) {
			remainHeight = 0;
		}
		if (width < remainWidth) {
			width = remainWidth;
		}
		if (height < remainHeight) {
			height = remainHeight;
		}

		// Fetch the child view's layout settings.
		LayoutParams p = (LayoutParams) child.getLayoutParams();

		// Determine the width that should be applied to the child view.
		// Note: If "optionWidth" and "autoFillsWidth" are null, then default to auto-size behavior.
		int childDimension = LayoutParams.WRAP_CONTENT;
		int widthPadding = getViewWidthPadding(child, width);
		if (p.optionWidth != null) {
			// Fetch the view's configured width.
			wMode = MeasureSpec.EXACTLY;
			if (p.optionWidth.isUnitPercent()) {
				int relativeWidth = width;
				if (this.childRelativeSizingWidth >= 0) {
					relativeWidth = this.childRelativeSizingWidth;
				}
				childDimension = getAsPercentageValue(p.optionWidth.getValue(), relativeWidth);
			} else {
				childDimension = p.optionWidth.getAsPixels(this);
			}
			if (childDimension < 0) {
				childDimension = 0;
			}

			// Do not allow the child to exceed the parent's width for wrapping horizontal layouts.
			// This matches iOS' behavior.
			if ((childDimension > 0) && isHorizontalArrangement() && this.enableHorizontalWrap) {
				if ((childDimension + widthPadding) > width) {
					childDimension = Math.max(width - widthPadding, 0);
				}
			}
		} else if (p.autoFillsWidth) {
			// Use the remaining width of the parent view to fill it.
			// Note: Do not use Android's MATCH_PARENT or FILL_PARENT constant here, because if the
			//       parent view is WRAP_CONTENT (ie: Ti.UI.SIZE), then the child will use min size
			//       instead of filling parent's remaining space like iOS/Windows. (See: TIMOB-25173)
			wMode = MeasureSpec.EXACTLY;
			childDimension = Math.max(remainWidth - widthPadding, 0);
		} else if (!p.sizeOrFillWidthEnabled) {
			// Attempt to calculate a width based on left/center/right properties, if provided.
			childDimension = calculateWidthFromPins(p, 0, remainWidth, remainWidth, childDimension);
		}
		int widthSpec =
			ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(width, wMode), widthPadding, childDimension);

		// Determine the height that should be applied to the child view.
		// Note: If "optionHeight" and "autoFillsHeight" are null, then default to auto-size behavior.
		childDimension = LayoutParams.WRAP_CONTENT;
		int heightPadding = getViewHeightPadding(child, height);
		if (p.optionHeight != null) {
			// Fetch the view's configured height.
			hMode = MeasureSpec.EXACTLY;
			if (p.optionHeight.isUnitPercent()) {
				int relativeHeight = height;
				if (this.childRelativeSizingHeight >= 0) {
					relativeHeight = this.childRelativeSizingHeight;
				}
				childDimension = getAsPercentageValue(p.optionHeight.getValue(), relativeHeight);
			} else {
				childDimension = p.optionHeight.getAsPixels(this);
			}
			if (childDimension < 0) {
				childDimension = 0;
			}
		} else if (p.autoFillsHeight) {
			// Use the remaining height of the parent view to fill it.
			hMode = MeasureSpec.EXACTLY;
			childDimension = Math.max(remainHeight - heightPadding, 0);
		} else if (!p.sizeOrFillHeightEnabled) {
			// Attempt to calculate a height based on top/center/bottom properties, if provided.
			childDimension = calculateHeightFromPins(p, height - remainHeight, height, remainHeight, childDimension);
		}
		int heightSpec =
			ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(height, hMode), heightPadding, childDimension);

		// Apply the above calculated width and height to the child view.
		child.measure(widthSpec, heightSpec);
	}

	// Try to calculate width from "left", "center", or "right" pins.
	// If we can't calculate from pins or we don't need to, then return the measured width.
	private int calculateWidthFromPins(LayoutParams params, int parentLeft, int parentRight, int parentWidth,
									   int measuredWidth)
	{
		int width = measuredWidth;

		// We only calculate width based on pins if Titanium's JavaScript "width" property is null.
		// If JavaScript "width" property is set, then "left" and "right" properties are used as padding.
		if ((params.optionWidth != null) || params.autoFillsWidth || params.sizeOrFillWidthEnabled) {
			return width;
		}

		// If set up to use a custom fill size, then use it instead of the given parent size.
		// Note: ScrollViews set this to size of container unless "contentWidth" is set.
		if (this.childFillWidth >= 0) {
			parentWidth = this.childFillWidth;
			parentLeft = 0;
			parentRight = parentWidth;
		}

		// Attempt to calculate width from the pin properties.
		// Note: We need at least 2 pins to do this. Otherwise, use given "measuredWidth" argument.
		TiDimension left = params.optionLeft;
		TiDimension centerX = params.optionCenterX;
		TiDimension right = params.optionRight;
		if (left != null) {
			if (centerX != null) {
				width = (centerX.getAsPixels(this) - left.getAsPixels(this) - parentLeft) * 2;
			} else if (right != null) {
				width = parentWidth - right.getAsPixels(this) - left.getAsPixels(this);
			}
		} else if (centerX != null && right != null) {
			width = (parentRight - right.getAsPixels(this) - centerX.getAsPixels(this)) * 2;
		}
		return width;
	}

	// Try to calculate height from "top", "center", or "bottom" pins.
	// If we can't calculate from pins or we don't need to, then return the measured height.
	private int calculateHeightFromPins(LayoutParams params, int parentTop, int parentBottom, int parentHeight,
										int measuredHeight)
	{
		int height = measuredHeight;

		// We only calculate height based on pins if Titanium's JavaScript "height" property is null.
		// If JavaScript "height" property is set, then "top" and "bottom" properties are used as padding.
		if ((params.optionHeight != null) || params.autoFillsHeight || params.sizeOrFillHeightEnabled) {
			return height;
		}

		// If set up to use a custom fill size, then use it instead of the given parent size.
		// Note: ScrollViews set this to size of container unless "contentWidth" is set.
		if (this.childFillHeight >= 0) {
			parentHeight = this.childFillHeight;
			parentTop = 0;
			parentBottom = parentHeight;
		}

		// Attempt to calculate height from the pin properties.
		// Note: We need at least 2 pins to do this. Otherwise, use given "measuredHeight" argument.
		TiDimension top = params.optionTop;
		TiDimension centerY = params.optionCenterY;
		TiDimension bottom = params.optionBottom;
		if (top != null) {
			if (centerY != null) {
				height = (centerY.getAsPixels(this) - parentTop - top.getAsPixels(this)) * 2;
			} else if (bottom != null) {
				height = parentHeight - top.getAsPixels(this) - bottom.getAsPixels(this);
			}
		} else if (centerY != null && bottom != null) {
			height = (parentBottom - bottom.getAsPixels(this) - centerY.getAsPixels(this)) * 2;
		}
		return height;
	}

	protected int getMeasuredWidth(int maxWidth, int widthSpec)
	{
		return resolveSize(maxWidth, widthSpec);
	}

	protected int getMeasuredHeight(int maxHeight, int heightSpec)
	{
		return resolveSize(maxHeight, heightSpec);
	}

	@Override
	protected void onLayout(boolean changed, int l, int t, int r, int b)
	{
		int count = getChildCount();

		int left = 0;
		int top = 0;
		int right = r - l;
		int bottom = b - t;

		if (needsSort) {
			viewSorter.clear();
			if (count > 1) { // No need to sort one item.
				for (int i = 0; i < count; i++) {
					View child = getChildAt(i);
					TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) child.getLayoutParams();
					params.index = i;
					viewSorter.add(child);
				}

				detachAllViewsFromParent();
				int i = 0;
				for (View child : viewSorter) {
					attachViewToParent(child, i++, child.getLayoutParams());
				}
			}
			setNeedsSort(false);
		}
		// viewSorter is not needed after this. It's a source of
		// memory leaks if it retains the views it's holding.
		viewSorter.clear();

		int[] horizontal = new int[2];
		int[] vertical = new int[2];

		int currentHeight = 0; // Used by vertical arrangement calcs

		for (int i = 0; i < count; i++) {
			View child = getChildAt(i);
			TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) child.getLayoutParams();
			if (child.getVisibility() != View.GONE) {
				// Dimension is required from Measure. Positioning is determined
				// here.

				int childMeasuredHeight = child.getMeasuredHeight();
				int childMeasuredWidth = child.getMeasuredWidth();

				if (isHorizontalArrangement()) {
					if (i == 0) {
						horizontalLayoutCurrentLeft = left;
						horizontalLayoutLineHeight = 0;
						horizontalLayoutTopBuffer = 0;
						horizontalLayoutLastIndexBeforeWrap = 0;
						horiztonalLayoutPreviousRight = 0;
						updateRowForHorizontalWrap(right, i);
					}
					computeHorizontalLayoutPosition(params, childMeasuredWidth, childMeasuredHeight, right, top, bottom,
													horizontal, vertical, i);

				} else {
					// Try to calculate width/height from pins, and default to
					// measured width/height. We have to do this in
					// onLayout since we can't get the correct top, bottom,
					// left, and right values inside constrainChild().
					childMeasuredHeight =
						calculateHeightFromPins(params, top, bottom, getHeight(), childMeasuredHeight);
					childMeasuredWidth = calculateWidthFromPins(params, left, right, getWidth(), childMeasuredWidth);

					computePosition(this, params.optionLeft, params.optionCenterX, params.optionRight,
									childMeasuredWidth, left, right, horizontal);
					if (isVerticalArrangement()) {
						computeVerticalLayoutPosition(currentHeight, params.optionTop, childMeasuredHeight, top,
													  vertical, bottom);
						// Include bottom in height calculation for vertical
						// layout (used as padding)
						TiDimension optionBottom = params.optionBottom;
						if (optionBottom != null) {
							currentHeight += optionBottom.getAsPixels(this);
						}
					} else {
						computePosition(this, params.optionTop, params.optionCenterY, params.optionBottom,
										childMeasuredHeight, top, bottom, vertical);
					}
				}

				if (Log.isDebugModeEnabled()) {
					Log.d(TAG,
						  child.getClass().getName() + " {" + horizontal[0] + "," + vertical[0] + "," + horizontal[1]
							  + "," + vertical[1] + "}",
						  Log.DEBUG_MODE);
				}

				int newWidth = horizontal[1] - horizontal[0];
				int newHeight = vertical[1] - vertical[0];
				// If the old child measurements do not match the new
				// measurements that we calculated, then update the
				// child measurements accordingly
				if (newWidth != child.getMeasuredWidth() || newHeight != child.getMeasuredHeight()) {
					int newWidthSpec = MeasureSpec.makeMeasureSpec(newWidth, MeasureSpec.EXACTLY);
					int newHeightSpec = MeasureSpec.makeMeasureSpec(newHeight, MeasureSpec.EXACTLY);
					child.measure(newWidthSpec, newHeightSpec);
				}

				if (!TiApplication.getInstance().isRootActivityAvailable()) {
					Activity currentActivity = TiApplication.getAppCurrentActivity();
					if (currentActivity instanceof TiLaunchActivity) {
						if (!((TiLaunchActivity) currentActivity).isJSActivity()) {
							Log.w(TAG, "The root activity is no longer available.  Skipping layout pass.",
								  Log.DEBUG_MODE);
							return;
						}
					}
				}

				child.layout(horizontal[0], vertical[0], horizontal[1], vertical[1]);

				currentHeight += newHeight;
				if (params.optionTop != null) {
					currentHeight += params.optionTop.getAsPixels(this);
				}
			}
		}

		if (changed) {
			TiViewProxy viewProxy = (proxy == null ? null : proxy.get());
			TiUIHelper.firePostLayoutEvent(viewProxy);
		}
	}

	// option0 is left/top, option1 is right/bottom
	public static void computePosition(View parent, TiDimension leftOrTop, TiDimension optionCenter,
									   TiDimension rightOrBottom, int measuredSize, int layoutPosition0,
									   int layoutPosition1, int[] pos)
	{
		int dist = layoutPosition1 - layoutPosition0;
		if (leftOrTop != null) {
			// peg left/top
			int leftOrTopPixels = leftOrTop.getAsPixels(parent);
			pos[0] = layoutPosition0 + leftOrTopPixels;
			pos[1] = layoutPosition0 + leftOrTopPixels + measuredSize;
		} else if (optionCenter != null) {
			int halfSize = measuredSize / 2;
			int centerPixels = optionCenter.getAsPixels(parent);
			pos[0] = layoutPosition0 + centerPixels - halfSize;
			pos[1] = pos[0] + measuredSize;
		} else if (rightOrBottom != null) {
			// peg right/bottom
			int rightOrBottomPixels = rightOrBottom.getAsPixels(parent);
			pos[0] = dist - rightOrBottomPixels - measuredSize;
			pos[1] = dist - rightOrBottomPixels;
		} else {
			// Center
			int offset = (dist - measuredSize) / 2;
			pos[0] = layoutPosition0 + offset;
			pos[1] = pos[0] + measuredSize;
		}
	}

	private void computeVerticalLayoutPosition(int currentHeight, TiDimension optionTop, int measuredHeight,
											   int layoutTop, int[] pos, int maxBottom)
	{
		int top = layoutTop + currentHeight;
		if (optionTop != null) {
			top += optionTop.getAsPixels(this);
		}
		// cap the bottom to make sure views don't go off-screen when user
		// supplies a height value that is >= screen
		// height and this view is below another view in vertical layout.
		int bottom = Math.min(top + measuredHeight, maxBottom);
		pos[0] = top;
		pos[1] = bottom;
	}

	private void computeHorizontalLayoutPosition(TiCompositeLayout.LayoutParams params, int measuredWidth,
												 int measuredHeight, int layoutRight, int layoutTop, int layoutBottom,
												 int[] hpos, int[] vpos, int currentIndex)
	{

		TiDimension optionLeft = params.optionLeft;
		TiDimension optionRight = params.optionRight;
		int left = horizontalLayoutCurrentLeft + horiztonalLayoutPreviousRight;
		int optionLeftValue = 0;
		if (optionLeft != null) {
			optionLeftValue = optionLeft.getAsPixels(this);
			left += optionLeftValue;
		}
		horiztonalLayoutPreviousRight = (optionRight == null) ? 0 : optionRight.getAsPixels(this);

		// If it's fill width with horizontal wrap, just take up remaining
		// space.
		int right = left + measuredWidth;

		if (enableHorizontalWrap && ((right + horiztonalLayoutPreviousRight) > layoutRight || left >= layoutRight)) {
			// Too long for the current "line" that it's on. Need to move it
			// down.
			left = optionLeftValue;
			right = measuredWidth + left;
			horizontalLayoutTopBuffer = horizontalLayoutTopBuffer + horizontalLayoutLineHeight;
			horizontalLayoutLineHeight = 0;
		} else if (!enableHorizontalWrap && params.autoFillsWidth && params.sizeOrFillWidthEnabled) {
			// If there is no wrap, and width is fill behavior, cap it off at
			// the width of the screen
			right = Math.min(right, layoutRight);
		}

		hpos[0] = left;
		hpos[1] = right;
		horizontalLayoutCurrentLeft = right;

		if (enableHorizontalWrap) {
			// Don't update row on the first iteration since we already do it
			// beforehand
			if (currentIndex != 0 && currentIndex > horizontalLayoutLastIndexBeforeWrap) {
				updateRowForHorizontalWrap(layoutRight, currentIndex);
			}
			measuredHeight = calculateHeightFromPins(params, horizontalLayoutTopBuffer,
													 horizontalLayoutTopBuffer + horizontalLayoutLineHeight,
													 horizontalLayoutLineHeight, measuredHeight);
			layoutBottom = horizontalLayoutLineHeight;
		}

		// Get vertical position into vpos
		computePosition(this, params.optionTop, params.optionCenterY, params.optionBottom, measuredHeight, layoutTop,
						layoutBottom, vpos);
		// account for moving the item "down" to later line(s) if there has been
		// wrapping.
		vpos[0] = vpos[0] + horizontalLayoutTopBuffer;
		vpos[1] = vpos[1] + horizontalLayoutTopBuffer;
	}

	private void updateRowForHorizontalWrap(int maxRight, int currentIndex)
	{
		int rowWidth = 0;
		int rowHeight = 0;
		int i = 0;
		int parentHeight = getHeight();
		horizontalLayoutLineHeight = 0;

		for (i = currentIndex; i < getChildCount(); i++) {
			View child = getChildAt(i);
			// Calculate row width/height with padding
			rowWidth += child.getMeasuredWidth() + getViewWidthPadding(child, getWidth());
			rowHeight = child.getMeasuredHeight() + getViewHeightPadding(child, parentHeight);

			if (rowWidth > maxRight) {
				horizontalLayoutLastIndexBeforeWrap = i - 1;
				return;

			} else if (rowWidth == maxRight) {
				break;
			}

			if (horizontalLayoutLineHeight < rowHeight) {
				horizontalLayoutLineHeight = rowHeight;
			}
		}

		if (horizontalLayoutLineHeight < rowHeight) {
			horizontalLayoutLineHeight = rowHeight;
		}
		horizontalLayoutLastIndexBeforeWrap = i;
	}

	protected int getWidthMeasureSpec(View child)
	{
		return MeasureSpec.EXACTLY;
	}

	protected int getHeightMeasureSpec(View child)
	{
		return MeasureSpec.EXACTLY;
	}

	/**
	 * A TiCompositeLayout specific version of
	 * {@link android.view.ViewGroup.LayoutParams}
	 */
	public static class LayoutParams extends ViewGroup.LayoutParams
	{
		protected int index;

		public int optionZIndex = NOT_SET;
		public TiDimension optionLeft = null;
		public TiDimension optionTop = null;
		public TiDimension optionCenterX = null;
		public TiDimension optionCenterY = null;
		public TiDimension optionRight = null;
		public TiDimension optionBottom = null;
		public TiDimension optionWidth = null;
		public TiDimension optionHeight = null;
		public Ti2DMatrix optionTransform = null;

		// This are flags to determine whether we are using fill or size
		// behavior
		public boolean sizeOrFillHeightEnabled = true;
		public boolean sizeOrFillWidthEnabled = true;

		/**
		 * If this is true, and {@link #sizeOrFillWidthEnabled} is true, then
		 * the current view will follow the fill behavior, which fills available
		 * parent width. If this value is false and
		 * {@link #sizeOrFillWidthEnabled} is true, then we use the size
		 * behavior, which constrains the view width to fit the width of its
		 * contents.
		 *
		 * @module.api
		 */
		public boolean autoFillsWidth = false;

		/**
		 * If this is true, and {@link #sizeOrFillHeightEnabled} is true, then
		 * the current view will follow fill behavior, which fills available
		 * parent height. If this value is false and
		 * {@link #sizeOrFillHeightEnabled} is true, then we use the size
		 * behavior, which constrains the view height to fit the height of its
		 * contents.
		 *
		 * @module.api
		 */
		public boolean autoFillsHeight = false;

		public LayoutParams()
		{
			super(WRAP_CONTENT, WRAP_CONTENT);

			index = Integer.MIN_VALUE;
		}

		/**
		 * Determines if layout parameters are set up to Ti.UI.SIZE (aka: WRAP_CONTENT) the view's width.
		 * @return Returns true if view's width should wrap content. Returns false if not.
		 */
		public boolean hasAutoSizedWidth()
		{
			// Not auto-sized if "width" is set to a value or Ti.UI.FILL.
			if ((this.optionWidth != null) || this.autoFillsWidth) {
				return false;
			}

			// We are auto-sized if "width" was explicitly set to Ti.UI.SIZE.
			if (this.sizeOrFillWidthEnabled) {
				return true;
			}

			// The "width" property was not set. Check the left/center/right pins.
			// If no more than 1 pin is set, then we're auto-sized and that pin is used to position the view.
			// Note: If 2 pins are set, then that is used to set the view's width between the pins.
			int pinCount = 0;
			if (this.optionLeft != null) {
				pinCount++;
			}
			if (this.optionCenterX != null) {
				pinCount++;
			}
			if (this.optionRight != null) {
				pinCount++;
			}
			return (pinCount < 2);
		}

		/**
		 * Determines if layout parameters are set up to Ti.UI.SIZE (aka: WRAP_CONTENT) the view's height.
		 * @return Returns true if view's height should wrap content. Returns false if not.
		 */
		public boolean hasAutoSizedHeight()
		{
			// Not auto-sized if "height" is set to a value or Ti.UI.FILL.
			if ((this.optionHeight != null) || this.autoFillsHeight) {
				return false;
			}

			// We are auto-sized if "height" was explicitly set to Ti.UI.SIZE.
			if (this.sizeOrFillHeightEnabled) {
				return true;
			}

			// The "height" property was not set. Check the top/center/bottom pins.
			// If no more than 1 pin is set, then we're auto-sized and that pin is used to position the view.
			// Note: If 2 pins are set, then that is used to set the view's height between the pins.
			int pinCount = 0;
			if (this.optionTop != null) {
				pinCount++;
			}
			if (this.optionCenterY != null) {
				pinCount++;
			}
			if (this.optionBottom != null) {
				pinCount++;
			}
			return (pinCount < 2);
		}
	}

	protected boolean isVerticalArrangement()
	{
		return (arrangement == LayoutArrangement.VERTICAL);
	}

	protected boolean isHorizontalArrangement()
	{
		return (arrangement == LayoutArrangement.HORIZONTAL);
	}

	protected boolean isDefaultArrangement()
	{
		return (arrangement == LayoutArrangement.DEFAULT);
	}

	public void setLayoutArrangement(String arrangementProperty)
	{
		if (arrangementProperty != null && arrangementProperty.equals(TiC.LAYOUT_HORIZONTAL)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		} else if (arrangementProperty != null && arrangementProperty.equals(TiC.LAYOUT_VERTICAL)) {
			arrangement = LayoutArrangement.VERTICAL;
		} else {
			arrangement = LayoutArrangement.DEFAULT;
		}
	}

	public void setEnableHorizontalWrap(boolean enable)
	{
		enableHorizontalWrap = enable;
	}

	public void setProxy(TiViewProxy proxy)
	{
		this.proxy = new WeakReference<TiViewProxy>(proxy);
	}

	private void setNeedsSort(boolean value)
	{
		// For vertical and horizontal layouts, since the controls doesn't
		// overlap, we shouldn't sort based on the zIndex, the original order
		// that controls added should be preserved
		if (isHorizontalArrangement() || isVerticalArrangement()) {
			value = false;
		}
		needsSort = value;
	}
}
