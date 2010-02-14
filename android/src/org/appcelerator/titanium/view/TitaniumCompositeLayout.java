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
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.OnHierarchyChangeListener;

public class TitaniumCompositeLayout extends ViewGroup
	implements OnHierarchyChangeListener, TiBorderHelper.BorderSupport
{
	private TreeSet<View> viewSorter;
	private boolean needsSort;
	private TiBorderHelper borderHelper;

	public TitaniumCompositeLayout(Context context)
	{
		super(context);
		this.borderHelper = new TiBorderHelper();

		this.viewSorter = new TreeSet<View>(new Comparator<View>(){

			public int compare(View o1, View o2)
			{
				TitaniumCompositeLayout.TitaniumCompositeLayoutParams p1 =
					(TitaniumCompositeLayout.TitaniumCompositeLayoutParams) o1.getLayoutParams();
				TitaniumCompositeLayout.TitaniumCompositeLayoutParams p2 =
					(TitaniumCompositeLayout.TitaniumCompositeLayoutParams) o2.getLayoutParams();

				int result = 0;

				if (p1.optionZIndex != null && p2.optionZIndex != null) {
					if (p1.optionZIndex.intValue() < p2.optionZIndex.intValue()) {
						result = -1;
					} else if (p1.optionZIndex.intValue() > p2.optionZIndex.intValue()) {
						result = 1;
					}
				} else if (p1.optionZIndex != null) {
					if (p1.optionZIndex.intValue() < 0) {
						result = -1;
					} if (p1.optionZIndex.intValue() > 0) {
						result = 1;
					}
				} else if (p2.optionZIndex != null) {
					if (p2.optionZIndex.intValue() < 0) {
						result = -1;
					} if (p2.optionZIndex.intValue() > 0) {
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

	public TitaniumCompositeLayout(Context context, AttributeSet attrs) {
		super(context, attrs);
	}

	public TitaniumCompositeLayout(Context context, AttributeSet attrs,
			int defStyle) {
		super(context, attrs, defStyle);
	}
	
	private String viewToString(View view) {
		return view.getClass().getSimpleName() + "@" + Integer.toHexString(view.hashCode());
	}

	public TiBorderHelper getBorderHelper() {
		return borderHelper;
	}

	public void onChildViewAdded(View parent, View child) {
		needsSort = true;
		if (parent != null && child != null) {
			Log.i("LAYOUT", "Attaching: " + viewToString(child) + " to " + viewToString(parent));
		}
		TitaniumCompositeLayoutParams params = (TitaniumCompositeLayoutParams)child.getLayoutParams();
		if (params.index == Integer.MIN_VALUE) {
			params.index = getChildCount()-1;
		}
	}

	public void onChildViewRemoved(View parent, View child) {
		needsSort = true;
		Log.i("LAYOUT", "Removing: " + viewToString(child) + " from " + viewToString(parent));
		TitaniumCompositeLayoutParams params = (TitaniumCompositeLayoutParams)child.getLayoutParams();
		if (params.index == Integer.MIN_VALUE) {
			params.index = Integer.MIN_VALUE;
		}
	}

	@Override
	protected boolean checkLayoutParams(LayoutParams p) {
		return p instanceof TitaniumCompositeLayoutParams;
	}

	@Override
	protected LayoutParams generateDefaultLayoutParams()
	{
		// Default is fill view
		TitaniumCompositeLayoutParams params = new TitaniumCompositeLayoutParams();
		params.optionLeft = 0;
		params.optionRight = 0;
		params.optionTop = 0;
		params.optionBottom = 0;
		params.optionZIndex = 0;
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
			viewSorter.clear();

			for(int i = 0; i < count; i++) {
				View child = getChildAt(i);
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

		int padding = Math.round(borderHelper.calculatePadding());
		maxWidth += padding;
		maxHeight += padding;

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
		
		TitaniumCompositeLayoutParams p =
			(TitaniumCompositeLayoutParams) child.getLayoutParams();
		
		int widthSpec = getWidthMeasureSpec(child);
		int heightSpec = getHeightMeasureSpec(child);
		
		// Ask the child how big it would naturally like to be.
		child.measure(MeasureSpec.makeMeasureSpec(maxWidth, widthSpec),
				MeasureSpec.makeMeasureSpec(maxHeight, heightSpec));
		
		if (p.optionLeft != null) {
			p.mLeft = Math.min(p.optionLeft.intValue(), width);
			if (p.optionRight != null) {
				p.mRight = Math.max(p.mLeft, width - p.optionRight.intValue());
			} else if (p.optionWidth != null) {
				p.mRight = Math.min(p.mLeft + p.optionWidth.intValue(), width);
			} else {
				p.mRight = width;
			}
		} else if (p.optionRight != null) {
			p.mRight = Math.max(width-p.optionRight.intValue(), 0);
			if (p.optionWidth != null) {
				p.mLeft = Math.max(0, p.mRight - p.optionWidth.intValue());
			} else {
				p.mLeft = 0;
			}
		} else {
			p.mLeft = 0;
			p.mRight = width;
			int w = p.optionWidth != null ? p.optionWidth.intValue() : child.getMeasuredWidth();
			int space = (width - w)/2;
			if (space > 0) {
				p.mLeft = space;
				p.mRight -= space;
			}
		}

		if (p.optionTop != null) {
			p.mTop = Math.min(p.optionTop.intValue(), height);
			if (p.optionBottom != null) {
				p.mBottom = Math.max(p.mTop, height - p.optionBottom.intValue());
			} else if (p.optionHeight != null) {
				p.mBottom = Math.min(p.mTop + p.optionHeight.intValue(), height);
			} else {
				p.mBottom = height;
			}
		} else if (p.optionBottom != null) {
			p.mBottom = Math.max(height-p.optionBottom.intValue(), 0);
			if (p.optionHeight != null) {
				p.mTop = Math.max(0, p.mBottom - p.optionHeight.intValue());
			} else {
				p.mTop = 0;
			}
		} else if (p.optionHeight != null) {
			p.mTop = 0;
			p.mBottom = height;
			int space = (height - p.optionHeight.intValue())/2;
			if (space > 0) {
				p.mTop = space;
				p.mBottom = height - space;
			}
		} else {
			p.mTop = 0;
			p.mBottom = height;
			int space = (height - child.getMeasuredHeight())/2;
			if (space > 0) {
				p.mTop = space;
				p.mBottom = height - space;
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
			TitaniumCompositeLayout.TitaniumCompositeLayoutParams params =
				(TitaniumCompositeLayout.TitaniumCompositeLayoutParams) child.getLayoutParams();
			if (child.getVisibility() != View.GONE) {
				child.layout(params.mLeft, params.mTop, params.mRight, params.mBottom);
			}
		}
	}

	@Override
	public void draw(Canvas canvas)
	{
		borderHelper.preDraw(canvas, getMeasuredWidth(), getMeasuredHeight());
		super.draw(canvas);
		borderHelper.postDraw(canvas, getMeasuredWidth(), getMeasuredHeight());
	}


	public static class TitaniumCompositeLayoutParams extends LayoutParams
	{
		protected int index;

		public Integer optionZIndex;
		public Integer optionLeft;
		public Integer optionTop;
		public Integer optionRight;
		public Integer optionBottom;
		public Integer optionWidth;
		public Integer optionHeight;

		// Used in onMeasure to assign size for onLayout
		public int mLeft;
		public int mTop;
		public int mRight;
		public int mBottom;

		public boolean autoWidth;
		public boolean autoHeight;
		
		public TitaniumCompositeLayoutParams() {
			super(WRAP_CONTENT, WRAP_CONTENT);

			index = Integer.MIN_VALUE;
		}
	}
}
