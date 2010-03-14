/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.util.Comparator;
import java.util.TreeSet;

import org.appcelerator.titanium.util.Log;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.OnHierarchyChangeListener;

public class TiCompositeLayout extends ViewGroup
	implements OnHierarchyChangeListener
{
	public static final int NOT_SET = Integer.MIN_VALUE;

	private TreeSet<View> viewSorter;
	private boolean needsSort;

	public TiCompositeLayout(Context context)
	{
		super(context);

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
		if (parent != null && child != null) {
			Log.i("LAYOUT", "Attaching: " + viewToString(child) + " to " + viewToString(parent));
		}
	}

	public void onChildViewRemoved(View parent, View child) {
		needsSort = true;
		Log.i("LAYOUT", "Removing: " + viewToString(child) + " from " + viewToString(parent));
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
		params.optionLeft = NOT_SET;
		params.optionRight = NOT_SET;
		params.optionTop = NOT_SET;
		params.optionBottom = NOT_SET;
		params.optionZIndex = NOT_SET;
		params.autoHeight = true;
		params.autoWidth = true;
		return params;
	}


	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		int w = Math.max(MeasureSpec.getSize(widthMeasureSpec), getSuggestedMinimumWidth());
		int wMode = MeasureSpec.getMode(widthMeasureSpec);
		int h = Math.max(MeasureSpec.getSize(heightMeasureSpec), getSuggestedMinimumHeight());
		int hMode = MeasureSpec.getMode(heightMeasureSpec);

		int maxWidth = 0;
		int maxHeight = 0;

		for(int i = 0; i < getChildCount(); i++) {
			View child = getChildAt(i);
			if (child.getVisibility() != View.GONE) {
				constrainChild(child, w, wMode, h, hMode);
			}

			maxWidth = Math.max(maxWidth, child.getMeasuredWidth());
			maxHeight = Math.max(maxHeight, child.getMeasuredHeight());
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
		int measuredHeight = getMeasuredHeight(maxHeight, heightMeasureSpec);
		setMeasuredDimension(measuredWidth, measuredHeight);
	}

	protected void constrainChild(View child, int width, int wMode, int height, int hMode)
	{
		LayoutParams p =
			(LayoutParams) child.getLayoutParams();

		int childDimension = LayoutParams.WRAP_CONTENT;
		if (p.optionWidth != NOT_SET) {
			childDimension = p.optionWidth;
		} else {
			if (p.autoFillsWidth) {
				childDimension = LayoutParams.FILL_PARENT;
			}
		}

		int padding = 0;
		if (p.optionLeft != NOT_SET) {
			padding += p.optionLeft;
		}
		if (p.optionRight != NOT_SET) {
			padding += p.optionRight;
		}
		int widthSpec = ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(width, wMode), padding, childDimension);

		childDimension = LayoutParams.WRAP_CONTENT;
		if (p.optionHeight != NOT_SET) {
			childDimension = p.optionHeight;
		} else {
			if (p.autoFillsHeight) {
				childDimension = LayoutParams.FILL_PARENT;
			}
		}

		padding = 0;

		if (p.optionTop != NOT_SET) {
			padding += p.optionTop;
		}
		if (p.optionBottom != NOT_SET) {
			padding += p.optionBottom;
		}

		int heightSpec = ViewGroup.getChildMeasureSpec(MeasureSpec.makeMeasureSpec(height, hMode), padding, childDimension);

		child.measure(widthSpec, heightSpec);

//      Useful for debugging.
//		int childWidth = child.getMeasuredWidth();
//		int childHeight = child.getMeasuredHeight();

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
				Log.e("SORTING", "Sorting.....");
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

		for (int i = 0; i < count; i++) {
			View child = getChildAt(i);
			TiCompositeLayout.LayoutParams params =
				(TiCompositeLayout.LayoutParams) child.getLayoutParams();
			if (child.getVisibility() != View.GONE) {
				// Dimension is required from Measure. Positioning is determined here.

				computePosition(params.optionLeft, params.optionRight, child.getMeasuredWidth(), left, right, horizontal);
				computePosition(params.optionTop, params.optionBottom, child.getMeasuredHeight(), top, bottom, vertical);

				Log.d("LAYOUT", child.getClass().getSimpleName() + " {" + horizontal[0] + "," + vertical[0] + "," + horizontal[1] + "," + vertical[1] + "}");

				child.layout(horizontal[0], vertical[0], horizontal[1], vertical[1]);
			}
		}
	}

	// 0 is left/top, 1 is right/bottom
	private void computePosition(int o0, int o1, int size, int p0, int p1, int[] pos)
	{
		int dist = p1 - p0;

		if (o0 == NOT_SET && o1 == NOT_SET) {
			// Center
			int offset = (dist-size)/2;
			pos[0] = p0 + offset;
			pos[1] = pos[0] + size;
		} else if (o0 == NOT_SET) {
			// peg right/bottom
			pos[0] = dist - o1 - size;
			pos[1] = dist - o1;
		} else if (o1 == NOT_SET) {
			// peg left/top
			pos[0] = p0 + o0;
			pos[1] = p0 + o0 + size;
		} else {
			// pegged both. override and force.
			pos[0] = p0 + o0;
			pos[1] = p1 - o1;
		}
	}

	protected int getWidthMeasureSpec(View child)
	{
		return MeasureSpec.AT_MOST;
	}

	protected int getHeightMeasureSpec(View child)
	{
		return MeasureSpec.AT_MOST;
	}


	public static class LayoutParams extends ViewGroup.LayoutParams
	{
		protected int index;

		public int optionZIndex = NOT_SET;
		public int optionLeft = NOT_SET;
		public int optionTop = NOT_SET;
		public int optionRight = NOT_SET;
		public int optionBottom = NOT_SET;
		public int optionWidth = NOT_SET;
		public int optionHeight = NOT_SET;

		public boolean autoHeight = true;
		public boolean autoWidth = true;
		public boolean autoFillsWidth = false;
		public boolean autoFillsHeight = false;

		public LayoutParams() {
			super(WRAP_CONTENT, WRAP_CONTENT);

			index = Integer.MIN_VALUE;
		}
	}
}
