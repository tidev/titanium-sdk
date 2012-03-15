/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.lang.ref.WeakReference;
import java.util.Comparator;
import java.util.TreeSet;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.OnHierarchyChangeListener;

/**
 * Base layout class for all Titanium views. 
 */
public class TiCompositeLayout extends ViewGroup
	implements OnHierarchyChangeListener
{
	/**
	 * Supported layout arrangements
	 * @module.api
	 */
	public enum LayoutArrangement {
		/**
		 * The default Titanium layout arrangement.
		 */
		DEFAULT,
		/**
		 * The layout arrangement for Views and Windows that set layout: "vertical".
		 */
		VERTICAL,
		/**
		 * The layout arrangement for Views and Windows that set layout: "horizontal".
		 */
		HORIZONTAL
	}

	protected static final String TAG = "TiCompositeLayout";
	protected static final boolean DBG = TiConfig.LOGD && false;

	public static final int NOT_SET = Integer.MIN_VALUE;

	private TreeSet<View> viewSorter;
	private boolean needsSort;
	protected LayoutArrangement arrangement;
	
	// Used by horizonal arrangement calculations
	private int horizontalLayoutTopBuffer = 0;
	private int horizontalLayoutCurrentLeft = 0;
	private int horizontalLayoutLineHeight = 0;
	private boolean disableHorizontalWrap = false;

	private WeakReference<TiViewProxy> proxy;

	// We need these two constructors for backwards compatibility with modules

	/**
	 * Constructs a new TiCompositeLayout object.
	 * @param context the associated context.
	 * @module.api
	 */
	public TiCompositeLayout(Context context)
	{
		this(context, LayoutArrangement.DEFAULT, null);
	}

	/**
	 * Contructs a new TiCompositeLayout object.
	 * @param context the associated context.
	 * @param arrangement the associated LayoutArrangement
	 * @module.api
	 */
	public TiCompositeLayout(Context context, LayoutArrangement arrangement)
	{
		this(context, LayoutArrangement.DEFAULT, null);
	}

	/**
	 * Constructs a new TiCompositeLayout object.
	 * @param context the associated context.
	 * @param proxy the associated proxy.
	 */
	public TiCompositeLayout(Context context, TiViewProxy proxy)
	{
		this(context, LayoutArrangement.DEFAULT, proxy);
	}

	/**
	 * Contructs a new TiCompositeLayout object.
	 * @param context the associated context.
	 * @param arrangement the associated LayoutArrangement
	 * @param proxy the associated proxy.
	 */
	public TiCompositeLayout(Context context, LayoutArrangement arrangement, TiViewProxy proxy)
	{
		super(context);
		this.arrangement = arrangement;
		this.viewSorter = new TreeSet<View>(new Comparator<View>()
		{

			public int compare(View o1, View o2)
			{
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

		needsSort = true;
		setOnHierarchyChangeListener(this);
		this.proxy = new WeakReference<TiViewProxy>(proxy);
	}

	private String viewToString(View view) {
		return view.getClass().getSimpleName() + "@" + Integer.toHexString(view.hashCode());
	}
	
	public void resort()
	{
		needsSort = true;
		requestLayout();
		invalidate();
	}

	public void onChildViewAdded(View parent, View child) {
		needsSort = true;
		if (DBG && parent != null && child != null) {
			Log.d(TAG, "Attaching: " + viewToString(child) + " to " + viewToString(parent));
		}
	}

	public void onChildViewRemoved(View parent, View child) {
		needsSort = true;
		if (DBG) {
			Log.d(TAG, "Removing: " + viewToString(child) + " from " + viewToString(parent));
		}
	}

	@Override
	protected boolean checkLayoutParams(ViewGroup.LayoutParams p) {
		return p instanceof TiCompositeLayout.LayoutParams;
	}

	@Override
	protected LayoutParams generateDefaultLayoutParams()
	{
		// Default behavior is size since optionWidth/optionHeight is null, and autoFillsWidth/autoFillsHeight is false.
		// Some classes such as ViewProxy will set autoFillsWidth/autoFillsHeight to true in order to trigger the fill
		// behavior by default.
		LayoutParams params = new LayoutParams();
		params.optionLeft = null;
		params.optionRight = null;
		params.optionTop = null;
		params.optionBottom = null;
		params.optionZIndex = NOT_SET;
		params.sizeOrFillHeightEnabled = true;
		params.sizeOrFillWidthEnabled = true;

		return params;
	}

	protected int getViewWidthPadding(View child, int parentWidth)
	{
		LayoutParams p = (LayoutParams) child.getLayoutParams();
		int padding = 0;
		if (p.optionLeft != null) {
			if (p.optionLeft.isUnitPercent()) {
				padding += (int) ((p.optionLeft.getValue() / 100.0) * parentWidth);
			} else {
				padding += p.optionLeft.getAsPixels(this);
			}
		}
		if (p.optionRight != null) {
			if (p.optionRight.isUnitPercent()) {
				padding += (int) ((p.optionRight.getValue() / 100.0) * parentWidth);
			} else {
				padding += p.optionRight.getAsPixels(this);
			}
		}
		return padding;
	}

	protected int getViewHeightPadding(View child, int parentHeight)
	{
		LayoutParams p = (LayoutParams) child.getLayoutParams();
		int padding = 0;
		if (p.optionTop != null) {
			if (p.optionTop.isUnitPercent()) {
				padding += (int) ((p.optionTop.getValue() / 100.0) * parentHeight);
			} else {
				padding += p.optionTop.getAsPixels(this);
			}
		}
		if (p.optionBottom != null) {
			if (p.optionBottom.isUnitPercent()) {
				padding += (int) ((p.optionBottom.getValue() / 100.0) * parentHeight);
			} else {
				padding += p.optionBottom.getAsPixels(this);
			}
		}
		return padding;
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
		int wMode = MeasureSpec.getMode(widthMeasureSpec);
		int h = Math.max(hFromSpec, hSuggested);
		int hMode = MeasureSpec.getMode(heightMeasureSpec);

		int maxWidth = 0;
		int maxHeight = 0;

		for(int i = 0; i < childCount; i++) {
			View child = getChildAt(i);
			if (child.getVisibility() != View.GONE) {
				constrainChild(child, w, wMode, h, hMode);
			}

			int childWidth = child.getMeasuredWidth();
			int childHeight = child.getMeasuredHeight();
			if (child.getVisibility() != View.GONE) {
				childWidth += getViewWidthPadding(child, w);
				childHeight += getViewHeightPadding(child, h);
			}

			if (isHorizontalArrangement()) {
				maxWidth += childWidth;
			} else {
				maxWidth = Math.max(maxWidth, childWidth);
			}

			if (isVerticalArrangement()) {
				maxHeight += childHeight;
			} else {
				maxHeight = Math.max(maxHeight, childHeight);
			}
		}

		// account for padding
		maxWidth += getPaddingLeft() + getPaddingRight();
		maxHeight += getPaddingTop() + getPaddingBottom();

		// Account for border
		//int padding = Math.round(borderHelper.calculatePadding());
		//maxWidth += padding;
		//maxHeight += padding;

		// check minimums
		maxWidth = Math.max(maxWidth, getSuggestedMinimumWidth());
		maxHeight = Math.max(maxHeight, getSuggestedMinimumHeight());

		int measuredWidth = getMeasuredWidth(maxWidth, widthMeasureSpec);
		int measuredHeight = getMeasuredHeight(maxHeight,heightMeasureSpec);
		setMeasuredDimension(measuredWidth, measuredHeight);
	}

	protected void constrainChild(View child, int width, int wMode, int height, int hMode)
	{
		LayoutParams p = (LayoutParams) child.getLayoutParams();
		// If autoFillsWidth is false, and optionWidth is null, then we use size behavior.
		int childDimension = LayoutParams.WRAP_CONTENT;
		if (p.optionWidth != null) {
			if (p.optionWidth.isUnitPercent() && width > 0) {
				childDimension = (int) ((p.optionWidth.getValue() / 100.0) * width);
			} else {
				childDimension = p.optionWidth.getAsPixels(this);
			}
		} else {
			if (p.autoFillsWidth) {
				childDimension = LayoutParams.FILL_PARENT;
			}
		}

		int widthPadding = getViewWidthPadding(child, width);
		int widthSpec = ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(width, wMode), widthPadding,
			childDimension);
		// If autoFillsHeight is false, and optionHeight is null, then we use size behavior.
		childDimension = LayoutParams.WRAP_CONTENT;
		if (p.optionHeight != null) {
			if (p.optionHeight.isUnitPercent() && height > 0) {
				childDimension = (int) ((p.optionHeight.getValue() / 100.0) * height);
			} else {
				childDimension = p.optionHeight.getAsPixels(this);
			}
		} else {
			if (p.autoFillsHeight) {
				childDimension = LayoutParams.FILL_PARENT;
			}
		}

		int heightPadding = getViewHeightPadding(child, height);
		int heightSpec = ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(height, hMode), heightPadding,
			childDimension);

		child.measure(widthSpec, heightSpec);
		// Useful for debugging.
		// int childWidth = child.getMeasuredWidth();
		// int childHeight = child.getMeasuredHeight();
	}

	// Try to calculate width from pins, if we couldn't calculate from pins or we don't need to, then return the
	// measured width
	private int calculateWidthFromPins(LayoutParams params, int parentLeft, int parentRight, int parentWidth,
		int measuredWidth)
	{
		int width = measuredWidth;

		if (params.optionWidth != null || params.sizeOrFillWidthEnabled) {
			return width;
		}

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

	// Try to calculate height from pins, if we couldn't calculate from pins or we don't need to, then return the
	// measured height
	private int calculateHeightFromPins(LayoutParams params, int parentTop, int parentBottom, int parentHeight,
		int measuredHeight)
	{
		int height = measuredHeight;

		// Return if we don't need undefined behavior
		if (params.optionHeight != null || params.sizeOrFillHeightEnabled) {
			return height;
		}

		TiDimension top = params.optionTop;
		TiDimension centerY = params.optionCenterY;
		TiDimension bottom = params.optionBottom;

		if (top != null) {
			if (centerY != null) {
				height = (centerY.getAsPixels(this) - parentTop - top.getAsPixels(this)) * 2;
			} else if (bottom != null) {
				height = parentBottom - top.getAsPixels(this) - bottom.getAsPixels(this);
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
				for(int i = 0; i < count; i++) {
					View child = getChildAt(i);
					TiCompositeLayout.LayoutParams params =
						(TiCompositeLayout.LayoutParams) child.getLayoutParams();
					params.index = i;
					viewSorter.add(child);
				}

				detachAllViewsFromParent();
				int i = 0;
				for (View child : viewSorter) {
					attachViewToParent(child, i++, child.getLayoutParams());
				}
			}
			needsSort = false;
		}
		// viewSorter is not needed after this. It's a source of
		// memory leaks if it retains the views it's holding.
		viewSorter.clear();

		int[] horizontal = new int[2];
		int[] vertical = new int[2];

		int currentHeight = 0; // Used by vertical arrangement calcs
		
		for (int i = 0; i < count; i++) {
			View child = getChildAt(i);
			TiCompositeLayout.LayoutParams params =
				(TiCompositeLayout.LayoutParams) child.getLayoutParams();
			if (child.getVisibility() != View.GONE) {
				// Dimension is required from Measure. Positioning is determined here.

				// Try to calculate width/height from pins, and default to measured width/height. We have to do this in
				// onLayout since we can't get the correct top, bottom, left, and right values inside constrainChild().
				int childMeasuredHeight = calculateHeightFromPins(params, top, bottom, getHeight(), child.getMeasuredHeight());
				int childMeasuredWidth = calculateWidthFromPins(params, left, right, getWidth(), child.getMeasuredWidth());

				if (isHorizontalArrangement()) {
					if (i == 0)  {
						horizontalLayoutCurrentLeft = left;
						horizontalLayoutLineHeight = 0;
						horizontalLayoutTopBuffer = 0;
					}
					computeHorizontalLayoutPosition(params, childMeasuredWidth, childMeasuredHeight, right, top, bottom, horizontal, vertical);
				} else {
					computePosition(this, params.optionLeft, params.optionCenterX, params.optionRight, childMeasuredWidth, left, right, horizontal);
					if (isVerticalArrangement()) {
						computeVerticalLayoutPosition(currentHeight, params.optionTop, params.optionBottom, childMeasuredHeight, top, bottom, vertical, b);
					} else {
						computePosition(this, params.optionTop, params.optionCenterY, params.optionBottom, childMeasuredHeight, top, bottom, vertical);
					}
				}

				if (DBG) {
					Log.d(TAG, child.getClass().getName() + " {" + horizontal[0] + "," + vertical[0] + "," + horizontal[1] + "," + vertical[1] + "}");
				}

				int newWidth = horizontal[1] - horizontal[0];
				int newHeight = vertical[1] - vertical[0];
				// If the old child measurements do not match the new measurements that we calculated, then update the
				// child measurements accordingly
				if (newWidth != child.getMeasuredWidth()
					|| newHeight != child.getMeasuredHeight()) {
					int newWidthSpec = MeasureSpec.makeMeasureSpec(newWidth, MeasureSpec.EXACTLY);
					int newHeightSpec = MeasureSpec.makeMeasureSpec(newHeight, MeasureSpec.EXACTLY);
					child.measure(newWidthSpec, newHeightSpec);
				}
				child.layout(horizontal[0], vertical[0], horizontal[1], vertical[1]);

				currentHeight += newHeight;
				if (params.optionTop != null) {
					currentHeight += params.optionTop.getAsPixels(this);
				}
			}
		}

		TiViewProxy viewProxy = proxy.get();

		if (viewProxy != null && viewProxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
			viewProxy.fireEvent(TiC.EVENT_POST_LAYOUT, null);
		}
	}

	@Override
	protected void onAnimationEnd()
	{
		super.onAnimationEnd();
		invalidate();
	}

	// option0 is left/top, option1 is right/bottom
	public static void computePosition(View parent, TiDimension leftOrTop, TiDimension optionCenter, TiDimension rightOrBottom,
		int measuredSize, int layoutPosition0, int layoutPosition1, int[] pos)
	{
		int dist = layoutPosition1 - layoutPosition0;
		if (leftOrTop != null) {
			// peg left/top
			int leftOrTopPixels = leftOrTop.getAsPixels(parent);
			pos[0] = layoutPosition0 + leftOrTopPixels;
			pos[1] = layoutPosition0 + leftOrTopPixels + measuredSize;
		} else if (optionCenter != null && optionCenter.getValue() != 0.0) {
			// Don't calculate position based on center dimension if it's 0.0
			int halfSize = measuredSize / 2;
			pos[0] = layoutPosition0 + optionCenter.getAsPixels(parent) - halfSize;
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

	private void computeVerticalLayoutPosition(int currentHeight,
		TiDimension optionTop, TiDimension optionBottom, int measuredHeight, int layoutTop, int layoutBottom, int[] pos, int maxBottom)
	{
		int top = layoutTop + currentHeight;
		if (optionTop != null) {
			top += optionTop.getAsPixels(this);
		}
		// cap the bottom to make sure views don't go off-screen when user supplies a height value that is >= screen
		// height and this view is below another view in vertical layout.
		int bottom = Math.min(top + measuredHeight, maxBottom);
		pos[0] = top;
		pos[1] = bottom;
	}

	private void computeHorizontalLayoutPosition(TiCompositeLayout.LayoutParams params, int measuredWidth, int measuredHeight, int layoutRight, int layoutTop, int layoutBottom, int[] hpos, int[] vpos)
	{
		TiDimension optionLeft = params.optionLeft;
		int left = horizontalLayoutCurrentLeft;
		if (optionLeft != null) {
			left += optionLeft.getAsPixels(this);
		}
		int right = left + measuredWidth;
		if (right > layoutRight && !disableHorizontalWrap) {
			// Too long for the current "line" that it's on.  Need to move it down.
			left = 0;
			right = measuredWidth;
			horizontalLayoutTopBuffer = horizontalLayoutTopBuffer + horizontalLayoutLineHeight;
			horizontalLayoutLineHeight = 0;
		}
		hpos[0] = left;
		hpos[1] = right;
		horizontalLayoutCurrentLeft = right;
		// Get vertical position into vpos
		computePosition(this, params.optionTop, params.optionCenterY, params.optionBottom, measuredHeight, layoutTop, layoutBottom, vpos);
		horizontalLayoutLineHeight = Math.max(horizontalLayoutLineHeight, vpos[1] - vpos[0]);
		// account for moving the item "down" to later line(s) if there has been wrapping.
		vpos[0] = vpos[0] + horizontalLayoutTopBuffer;
		vpos[1] = vpos[1] + horizontalLayoutTopBuffer;
	}

	protected int getWidthMeasureSpec(View child) {
		return MeasureSpec.EXACTLY;
	}

	protected int getHeightMeasureSpec(View child) {
		return MeasureSpec.EXACTLY;
	}

	/**
	 * A TiCompositeLayout specific version of {@link android.view.ViewGroup.LayoutParams}
	 */
	public static class LayoutParams extends ViewGroup.LayoutParams {
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

		// This are flags to determine whether we are using fill or size behavior
		public boolean sizeOrFillHeightEnabled = true;
		public boolean sizeOrFillWidthEnabled = true;

		/**
		 * If this is true, and {@link #sizeOrFillWidthEnabled} is true, then the current view will follow the fill
		 * behavior, which fills available parent width. If this value is false and {@link #sizeOrFillWidthEnabled} is
		 * true, then we use the size behavior, which constrains the view width to fit the width of its contents.
		 * 
		 * @module.api
		 */
		public boolean autoFillsWidth = false;

		/**
		 * If this is true, and {@link #sizeOrFillHeightEnabled} is true, then the current view will follow fill
		 * behavior, which fills available parent height. If this value is false and {@link #sizeOrFillHeightEnabled} is
		 * true, then we use the size behavior, which constrains the view height to fit the height of its contents.
		 * 
		 * @module.api
		 */
		public boolean autoFillsHeight = false;

		public LayoutParams()
		{
			super(WRAP_CONTENT, WRAP_CONTENT);

			index = Integer.MIN_VALUE;
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

	public void setDisableHorizontalWrap(boolean disable)
	{
		disableHorizontalWrap = disable;
	}

	public void setProxy(TiViewProxy proxy)
	{
		this.proxy = new WeakReference<TiViewProxy>(proxy);
	}
}
