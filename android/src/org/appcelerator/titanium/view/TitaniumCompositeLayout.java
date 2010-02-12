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

public class TitaniumCompositeLayout extends ViewGroup
	implements OnHierarchyChangeListener
{
	private TreeSet<View> viewSorter;
	private boolean needsSort;

	public TitaniumCompositeLayout(Context context)
	{
		super(context);
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

	public void onChildViewAdded(View parent, View child) {
		needsSort = true;
		if (parent != null && child != null) {
			Log.i("LAYOUT", "Attaching: " + child.getClass().getSimpleName() + " to " + parent.getClass().getSimpleName());
		}
		TitaniumCompositeLayoutParams params = (TitaniumCompositeLayoutParams)child.getLayoutParams();
		if (params.index == Integer.MIN_VALUE) {
			params.index = getChildCount()-1;
		}
	}

	public void onChildViewRemoved(View parent, View child) {
		needsSort = true;
		Log.i("LAYOUT", "Removing: " + child.getClass().getSimpleName() + " from " + parent.getClass().getSimpleName());
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

				// Ask the child how big it would naturally like to be.
				child.measure(MeasureSpec.makeMeasureSpec(maxWidth, MeasureSpec.AT_MOST),
						MeasureSpec.makeMeasureSpec(maxHeight, MeasureSpec.AT_MOST));


				TitaniumCompositeLayout.TitaniumCompositeLayoutParams p =
					(TitaniumCompositeLayout.TitaniumCompositeLayoutParams) child.getLayoutParams();

				if (p.optionLeft != null) {
					p.mLeft = Math.min(p.optionLeft.intValue(), w);
					if (p.optionRight != null) {
						p.mRight = Math.max(p.mLeft, w - p.optionRight.intValue());
					} else if (p.optionWidth != null) {
						p.mRight = Math.min(p.mLeft + p.optionWidth.intValue(), w);
					} else {
						p.mRight = w;
					}
				} else if (p.optionRight != null) {
					p.mRight = Math.max(w-p.optionRight.intValue(), 0);
					if (p.optionLeft != null) {
						p.mLeft = Math.max(p.optionLeft.intValue(), p.mRight);
					} else if (p.optionWidth != null) {
						p.mLeft = Math.max(0, p.mRight - p.optionWidth.intValue());
					} else {
						p.mLeft = 0;
					}
				} else if (p.optionWidth != null) {
					p.mLeft = 0;
					p.mRight = w;
					int space = (w - p.optionWidth.intValue())/2;
					if (space > 0) {
						p.mLeft = space;
						p.mRight = w - space;
					}
				} else {
					p.mLeft = 0;
					p.mRight = w;
					int space = (w - child.getMeasuredWidth())/2;
					if (space > 0) {
						p.mLeft = space;
						p.mRight = w - space;
					}
				}

				if (p.optionTop != null) {
					p.mTop = Math.min(p.optionTop.intValue(), h);
					if (p.optionBottom != null) {
						p.mBottom = Math.max(p.mTop, h - p.optionBottom.intValue());
					} else if (p.optionHeight != null) {
						p.mBottom = Math.min(p.mTop + p.optionHeight.intValue(), h);
					} else {
						p.mBottom = h;
					}
				} else if (p.optionBottom != null) {
					p.mBottom = Math.max(h-p.optionBottom.intValue(), 0);
					if (p.optionTop != null) {
						p.mTop = Math.max(p.optionTop.intValue(), p.mBottom);
					} else if (p.optionHeight != null) {
						p.mTop = Math.max(0, p.mBottom - p.optionHeight.intValue());
					} else {
						p.mTop = 0;
					}
				} else if (p.optionHeight != null) {
					p.mTop = 0;
					p.mBottom = h;
					int space = (h - p.optionHeight.intValue())/2;
					if (space > 0) {
						p.mTop = space;
						p.mBottom = h - space;
					}
				} else {
					p.mTop = 0;
					p.mBottom = h;
					int space = (h - child.getMeasuredHeight())/2;
					if (space > 0) {
						p.mTop = space;
						p.mBottom = h - space;
					}
				}

				child.measure(MeasureSpec.makeMeasureSpec(p.mRight-p.mLeft, wMode /*MeasureSpec.EXACTLY*/),
						MeasureSpec.makeMeasureSpec(p.mBottom-p.mTop, hMode /*MeasureSpec.EXACTLY*/));

			}
		}

		// account for padding

		maxWidth += getPaddingLeft() + getPaddingRight();
		maxHeight += getPaddingTop() + getPaddingBottom();

		// check minimums
		maxWidth = Math.max(maxWidth, getSuggestedMinimumWidth());
		maxHeight = Math.max(maxHeight, getSuggestedMinimumHeight());

		setMeasuredDimension(resolveSize(maxWidth, widthMeasureSpec),
				resolveSize(maxHeight, heightMeasureSpec));
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

		public TitaniumCompositeLayoutParams() {
			super(WRAP_CONTENT, WRAP_CONTENT);

			index = Integer.MIN_VALUE;
		}
	}
}
