/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.util.Comparator;
import java.util.TreeSet;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.OnHierarchyChangeListener;

public class TiCompositeLayout extends ViewGroup
	implements OnHierarchyChangeListener
{
	public enum LayoutArrangement {DEFAULT, VERTICAL, HORIZONTAL}

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

	public TiCompositeLayout(Context context)
	{
		this(context, LayoutArrangement.DEFAULT);
	}

	public TiCompositeLayout(Context context, LayoutArrangement arrangement)
	{
		super(context);
		this.arrangement = arrangement;
		this.viewSorter = new TreeSet<View>(new Comparator<View>(){

			public int compare(View o1, View o2)
			{
				TiCompositeLayout.LayoutParams p1 =
					(TiCompositeLayout.LayoutParams) o1.getLayoutParams();
				TiCompositeLayout.LayoutParams p2 =
					(TiCompositeLayout.LayoutParams) o2.getLayoutParams();

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
					} if (p1.optionZIndex > 0) {
						result = 1;
					}
				} else if (p2.optionZIndex != NOT_SET) {
					if (p2.optionZIndex < 0) {
						result = 1;
					} if (p2.optionZIndex > 0) {
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
			}});

		needsSort = true;
		setOnHierarchyChangeListener(this);
	}

	public TiCompositeLayout(Context context, AttributeSet attrs) {
		super(context, attrs);
	}

	public TiCompositeLayout(Context context, AttributeSet attrs,
			int defStyle) {
		super(context, attrs, defStyle);
	}

	private String viewToString(View view) {
		return view.getClass().getSimpleName() + "@" + Integer.toHexString(view.hashCode());
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
		// Default is fill view
		LayoutParams params = new LayoutParams();
		params.optionLeft = null;
		params.optionRight = null;
		params.optionTop = null;
		params.optionBottom = null;
		params.optionZIndex = NOT_SET;
		params.autoHeight = true;
		params.autoWidth = true;
		return params;
	}

	protected int getViewWidthPadding(View child) {
		LayoutParams p = (LayoutParams) child.getLayoutParams();
		int padding = 0;
		if (p.optionLeft != null) {
			padding += p.optionLeft.getAsPixels(this);
		}
		if (p.optionRight != null) {
			padding += p.optionRight.getAsPixels(this);
		}
		return padding;
	}
	
	protected int getViewHeightPadding(View child) {
		LayoutParams p = (LayoutParams) child.getLayoutParams();
		int padding = 0;
		if (p.optionTop != null) {
			padding += p.optionTop.getAsPixels(this);
		}
		if (p.optionBottom != null) {
			padding += p.optionBottom.getAsPixels(this);
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
				childWidth += getViewWidthPadding(child);
				childHeight += getViewHeightPadding(child);
			}

			if (isHorizontalArrangement()) {
				LayoutParams p = (LayoutParams) child.getLayoutParams();
				maxWidth += childWidth;
				if (p.optionLeft != null) {
					maxWidth += p.optionLeft.getAsPixels(this);  // I think this is wrong -- getViewWidthPadding above has already done this, I believe
				}
			} else {
				maxWidth = Math.max(maxWidth, childWidth);
			}

			if (isVerticalArrangement()) {
				LayoutParams p = (LayoutParams) child.getLayoutParams();
				maxHeight += childHeight;
				if (p.optionTop != null) {
					maxHeight += p.optionTop.getAsPixels(this);
				}
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
		LayoutParams p =
			(LayoutParams) child.getLayoutParams();
		int childDimension = LayoutParams.WRAP_CONTENT;
		if (p.optionWidth != null) {
			childDimension = p.optionWidth.getAsPixels(this);
			if (childDimension >= 0 && p.optionWidth.isUnitPercent() && width > 0) {
				childDimension = (int) ((p.optionWidth.getValue() / 100.0) * width);
			}
		} else {
			if (p.autoWidth && p.autoFillsWidth && !isHorizontalArrangement()) {
				childDimension = LayoutParams.FILL_PARENT;
			}
		}
		int widthPadding = getViewWidthPadding(child);
		int widthSpec = ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(width, wMode), widthPadding, childDimension);
		childDimension = LayoutParams.WRAP_CONTENT;
		if (p.optionHeight != null) {
			childDimension = p.optionHeight.getAsPixels(this);
			if (childDimension >= 0 && p.optionHeight.isUnitPercent() && height > 0) {
				childDimension = (int) ((p.optionHeight.getValue() / 100.0) * height);
			}
		} else {
			if (p.autoHeight && p.autoFillsHeight && !isVerticalArrangement()) {
				childDimension = LayoutParams.FILL_PARENT;
			}
		}

		int heightPadding = getViewHeightPadding(child);
		int heightSpec = ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(height, hMode), heightPadding, childDimension);
		child.measure(widthSpec, heightSpec);
		// Useful for debugging.
		// int childWidth = child.getMeasuredWidth();
		// int childHeight = child.getMeasuredHeight();
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
			if (count > 1) { // No need to sort one item.
				viewSorter.clear();
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

		int[] horizontal = new int[2];
		int[] vertical = new int[2];

		int currentHeight = 0; // Used by vertical arrangement calcs
		
		for (int i = 0; i < count; i++) {
			View child = getChildAt(i);
			TiCompositeLayout.LayoutParams params =
				(TiCompositeLayout.LayoutParams) child.getLayoutParams();
			if (child.getVisibility() != View.GONE) {
				// Dimension is required from Measure. Positioning is determined here.
				
				int childMeasuredWidth = child.getMeasuredWidth();
				int childMeasuredHeight = child.getMeasuredHeight();

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
						computeVerticalLayoutPosition(currentHeight, params.optionTop, params.optionBottom, childMeasuredHeight, top, bottom, vertical);
					} else {
						computePosition(this, params.optionTop, params.optionCenterY, params.optionBottom, childMeasuredHeight, top, bottom, vertical);
					}
				}

				if (DBG) {
					Log.d(TAG, child.getClass().getName() + " {" + horizontal[0] + "," + vertical[0] + "," + horizontal[1] + "," + vertical[1] + "}");
				}

				int newWidth = horizontal[1] - horizontal[0];
				int newHeight = vertical[1] - vertical[0];
				if (newWidth != childMeasuredWidth
					|| newHeight != childMeasuredHeight) {
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
	}

	// 0 is left/top, 1 is right/bottom
	public static void computePosition(View parent, TiDimension option0, TiDimension optionCenter, TiDimension option1,
		int measuredSize, int layoutPosition0, int layoutPosition1, int[] pos)
	{
		int dist = layoutPosition1 - layoutPosition0;
		if (optionCenter != null) {
			int halfSize= measuredSize/2;
			pos[0] = layoutPosition0 + optionCenter.getAsPixels(parent) - halfSize;
			pos[1] = pos[0] + measuredSize;
		} else if (option0 == null && option1 == null) {
			// Center
			int offset = (dist-measuredSize)/2;
			pos[0] = layoutPosition0 + offset;
			pos[1] = pos[0] + measuredSize;
		} else if (option0 == null) {
			// peg right/bottom
			int option1Pixels = option1.getAsPixels(parent);
			pos[0] = dist - option1Pixels - measuredSize;
			pos[1] = dist - option1Pixels;
		} else if (option1 == null) {
			// peg left/top
			int option0Pixels = option0.getAsPixels(parent);
			pos[0] = layoutPosition0 + option0Pixels;
			pos[1] = layoutPosition0 + option0Pixels + measuredSize;
		} else {
			// pegged both. override and force.
			pos[0] = layoutPosition0 + option0.getAsPixels(parent);
			pos[1] = layoutPosition1 - option1.getAsPixels(parent);
		}
	}

	private void computeVerticalLayoutPosition(int currentHeight,
		TiDimension optionTop, TiDimension optionBottom, int measuredHeight, int layoutTop, int layoutBottom, int[] pos)
	{
		int top = layoutTop + currentHeight;
		if (optionTop != null) {
			top += optionTop.getAsPixels(this);
		}
		int bottom = top + measuredHeight;
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

		public boolean autoHeight = true;
		public boolean autoWidth = true;
		public boolean autoFillsWidth = false;
		public boolean autoFillsHeight = false;

		public LayoutParams() {
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
}
