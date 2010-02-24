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
import android.graphics.Canvas;
import android.hardware.Camera.AutoFocusCallback;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
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
						result = -1;
					} if (p2.optionZIndex > 0) {
						result = 1;
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
		int count = getChildCount();

		int w = Math.max(MeasureSpec.getSize(widthMeasureSpec), getSuggestedMinimumWidth());
		int wMode = MeasureSpec.getMode(widthMeasureSpec);
		int h = Math.max(MeasureSpec.getSize(heightMeasureSpec), getSuggestedMinimumHeight());
		int hMode = MeasureSpec.getMode(heightMeasureSpec);

		int maxWidth = w;
		int maxHeight = h;

		if (needsSort) {
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
			needsSort = false;
		}

		for(int i = 0; i < getChildCount(); i++) {
			View child = getChildAt(i);
			if (child.getVisibility() != View.GONE) {
				constrainChild(child, w, wMode, h, hMode);
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
		int measuredHeight = getMeasuredHeight(maxHeight, heightMeasureSpec);
		setMeasuredDimension(measuredWidth, measuredHeight);
	}

	protected void constrainChild(View child, int width, int wMode, int height, int hMode)
	{
		int maxWidth = width;
		int maxHeight = height;

		LayoutParams p =
			(LayoutParams) child.getLayoutParams();

		int widthSpec = getWidthMeasureSpec(child);
		int heightSpec = getHeightMeasureSpec(child);

		// Ask the child how big it would naturally like to be.
		child.measure(MeasureSpec.makeMeasureSpec(maxWidth, widthSpec),
				MeasureSpec.makeMeasureSpec(maxHeight, heightSpec));

		int childWidth = child.getMeasuredWidth();
		int childHeight = child.getMeasuredHeight();

		if (p.optionLeft != NOT_SET) {
			p.mLeft = Math.min(p.optionLeft, width);
			if (p.optionRight != NOT_SET) {
				p.mRight = Math.max(p.mLeft, width - p.optionRight);
			} else if (!p.autoWidth) {
				p.mRight = Math.min(p.mLeft + p.optionWidth, width);
			} else {
				if (!p.autoFillsWidth) {
					p.mRight = width;
				} else {
					p.mRight = Math.min(p.mLeft + childWidth, width);
				}
			}
		} else if (p.optionRight != NOT_SET) {
			p.mRight = Math.max(width-p.optionRight, 0);
			if (!p.autoWidth) {
				p.mLeft = Math.max(0, p.mRight - p.optionWidth);
			} else {
				if (p.autoFillsWidth) {
					p.mLeft = 0;
				} else {
					p.mLeft = Math.max(p.mRight - childWidth, 0);
				}
			}
		} else {
			p.mLeft = 0;
			p.mRight = width;

			int w = width;

			if (p.optionWidth != NOT_SET) {
				w = Math.min(p.optionWidth, width);
			} else if (p.autoWidth && !p.autoFillsWidth) {
				w = Math.min(childWidth, width);
			}

			int space = (width - w)/2;
			if (space > 0) {
				p.mLeft = space;
				p.mRight -= space;
			}
		}

		if (p.optionTop != NOT_SET) {
			p.mTop = Math.min(p.optionTop, height);
			if (p.optionBottom != NOT_SET) {
				p.mBottom = Math.max(p.mTop, height - p.optionBottom);
			} else if (!p.autoHeight) {
				p.mBottom = Math.min(p.mTop + p.optionHeight, height);
			} else {
				if (p.autoFillsHeight) {
					p.mBottom = height;
				} else {
					p.mBottom = Math.min(p.mTop + childHeight, height);
				}
			}
		} else if (p.optionBottom != NOT_SET) {
			p.mBottom = Math.max(height-p.optionBottom, 0);
			if (!p.autoHeight) {
				p.mTop = Math.max(0, p.mBottom - p.optionHeight);
			} else {
				if (p.autoFillsHeight) {
					p.mTop = 0;
				} else {
					p.mTop = Math.max(p.mBottom - childHeight, 0);
				}
			}
		} else {
			p.mTop = 0;
			p.mBottom = height;

			int h = height;
			if (p.optionHeight != NOT_SET) {
				h = Math.min(p.optionHeight, height);
			} else if (p.autoHeight && !p.autoFillsHeight) {
				h = Math.min(childHeight, height);
			}

			int space = (height - h)/2;
			if (space > 0) {
				p.mTop = space;
				p.mBottom -= space;
			}
		}

		int childWidthSpec = MeasureSpec.makeMeasureSpec(
				p.mRight-p.mLeft, wMode /*MeasureSpec.EXACTLY*/);
		int childHeightSpec = MeasureSpec.makeMeasureSpec(
				p.mBottom-p.mTop, hMode /*MeasureSpec.EXACTLY*/);

		child.measure(childWidthSpec, childHeightSpec);
	}

	protected int getWidthMeasureSpec(View child)
	{
		return MeasureSpec.AT_MOST;
	}

	protected int getHeightMeasureSpec(View child)
	{
		return MeasureSpec.AT_MOST;
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
		for (int i = 0; i < getChildCount(); i++) {
			View child = getChildAt(i);
			TiCompositeLayout.LayoutParams params =
				(TiCompositeLayout.LayoutParams) child.getLayoutParams();
			if (child.getVisibility() != View.GONE) {
				child.layout(params.mLeft, params.mTop, params.mRight, params.mBottom);
			}
		}
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

		// Used in onMeasure to assign size for onLayout
		public int mLeft;
		public int mTop;
		public int mRight;
		public int mBottom;

		public LayoutParams() {
			super(WRAP_CONTENT, WRAP_CONTENT);

			index = Integer.MIN_VALUE;
		}
	}
}
