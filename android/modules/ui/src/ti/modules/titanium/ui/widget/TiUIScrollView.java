/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ScrollView;

public class TiUIScrollView extends TiUIView {
	
	// TODO: right now Android only has a ScrollView (vertical) or HorizontalScrollView
	// we prefer the vertical scroll view by default, but there is no easy way to combine them
	public static final int TYPE_VERTICAL = 0;
	public static final int TYPE_HORIZONTAL = 1;
	
	private static final String SHOW_VERTICAL_SCROLL_INDICATOR = "showVerticalScrollIndicator";
	private static final String SHOW_HORIZONTAL_SCROLL_INDICATOR = "showHorizontalScrollIndicator";
	private static final String LCAT = "TiUIScrollView";
	
	private class TiScrollViewLayout extends TiCompositeLayout
	{
		private static final int AUTO = Integer.MAX_VALUE;
		protected int measuredWidth = 0, measuredHeight = 0;
		
		public TiScrollViewLayout(Context context) {
			super(context);
		}
		
		private LayoutParams getParams(View child) {
			return (LayoutParams)child.getLayoutParams();
		}
		
		@Override
		protected void onLayout(boolean changed, int l, int t, int r, int b) {
			super.onLayout(changed, l, t, r, b);
			measuredHeight = measuredWidth = 0;
		}
		
		private int getContentProperty(String property) {
			Object value = getProxy().getDynamicValue(property);
			if (value != null) {
				if (value.equals("auto")) {
					return AUTO;
				} else if (value instanceof Number) {
					return ((Number)value).intValue();
				}
			}
			return AUTO;
		}
		
		private int calculateAbsoluteRight(View child)
		{
			LayoutParams p = getParams(child);
			int contentWidth = getContentProperty("contentWidth");
			if (contentWidth == AUTO) {
				int childMeasuredWidth = child.getMeasuredWidth();
				if (!p.autoHeight) {
					childMeasuredWidth = p.optionWidth;
				}
				if (p.optionLeft != NOT_SET) {
					childMeasuredWidth += p.optionLeft;
				}
				if (p.optionRight != NOT_SET) {
					childMeasuredWidth += p.optionRight;
				}
				
				measuredWidth = Math.max(childMeasuredWidth, measuredWidth);
				return measuredWidth;
			} else {
				return contentWidth;
			}
		}
		
		private int calculateAbsoluteBottom(View child)
		{
			LayoutParams p = (LayoutParams)child.getLayoutParams();
			int contentHeight = getContentProperty("contentHeight");
			if (contentHeight == AUTO) {
				int childMeasuredHeight = child.getMeasuredHeight();
				if (!p.autoHeight) {
					childMeasuredHeight = p.optionHeight;
				}
				if (p.optionTop != NOT_SET) {
					childMeasuredHeight += p.optionTop;
				}
				if (p.optionBottom != NOT_SET) {
					childMeasuredHeight += p.optionBottom;
				}
				
				measuredHeight = Math.max(childMeasuredHeight, measuredHeight);
				return measuredHeight;
			} else {
				return contentHeight;
			}
		}
		
		@Override
		protected void constrainChild(View child, int width, int wMode,
				int height, int hMode) {
			
			// We need to support an automatically growing contentArea, so this code is 
			LayoutParams p = (LayoutParams)child.getLayoutParams();
			int absoluteRight = calculateAbsoluteRight(child);
			int absoluteBottom = calculateAbsoluteBottom(child);
			int contentWidth = getContentProperty("contentWidth");
			int contentHeight = getContentProperty("contentHeight");
			
			if (p.optionLeft != NOT_SET) {
				p.mLeft = Math.min(p.optionLeft, contentWidth);
				if (p.optionRight != NOT_SET) {
					p.mRight = Math.max(p.mLeft, absoluteRight - p.optionRight);
				} else if (!p.autoWidth) {
					p.mRight = Math.min(p.mLeft + p.optionWidth, contentWidth);
				} else {
					p.mRight = absoluteRight;
				}
			} else if (p.optionRight != NOT_SET) {
				p.mRight = Math.max(absoluteRight - p.optionRight, 0);
				if (!p.autoWidth) {
					p.mLeft = Math.max(0, p.mRight - p.optionWidth);
				} else {
					p.mLeft = 0;
				}
			} else {
				p.mLeft = 0;
				p.mRight = absoluteRight;
				int w = !p.autoWidth ? p.optionWidth : child.getMeasuredWidth();
				int space = (p.mRight - w)/2;
				if (space > 0) {
					p.mLeft = space;
					p.mRight -= space;
				}
			}
			
			if (p.optionTop != NOT_SET) {
				p.mTop = Math.min(p.optionTop, contentHeight);
				if (p.optionBottom != NOT_SET) {
					p.mBottom = Math.max(p.mTop, absoluteBottom - p.optionBottom);
				} else if (!p.autoHeight) {
					p.mBottom = Math.min(p.mTop + p.optionHeight, contentHeight);
				} else {
					p.mBottom = absoluteBottom;
				}
			} else if (p.optionBottom != NOT_SET) {
				p.mBottom = Math.max(absoluteBottom - p.optionBottom, 0);
				if (!p.autoHeight) {
					p.mTop = Math.max(0, p.mBottom - p.optionHeight);
				} else {
					p.mTop = 0;
				}
			} else {
				p.mTop = 0;
				p.mBottom = absoluteBottom;
				int h = !p.autoHeight ? p.optionHeight : child.getMeasuredHeight();
				int space = (p.mBottom - h)/2;
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
		
		
		@Override
		protected int getWidthMeasureSpec(View child) {
			int contentWidth = getContentProperty("contentWidth");
			if (contentWidth == AUTO) {
				return MeasureSpec.UNSPECIFIED;
			} else return super.getWidthMeasureSpec(child);
		}
		
		@Override
		protected int getHeightMeasureSpec(View child) {
			int contentHeight = getContentProperty("contentHeight");
			if (contentHeight == AUTO) {
				return MeasureSpec.UNSPECIFIED;
			} else return super.getHeightMeasureSpec(child);
		}
		
		@Override
		protected int getMeasuredWidth(int maxWidth, int widthSpec) {
			int contentWidth = getContentProperty("contentWidth");
			if (contentWidth == AUTO) {
				return measuredWidth;
			} else return contentWidth;
		}
		
		@Override
		protected int getMeasuredHeight(int maxHeight, int heightSpec) {
			int contentHeight = getContentProperty("contentHeight");
			if (contentHeight == AUTO) {
				return measuredHeight;
			}
			else return contentHeight;
		}
	}

	// same code, different super-classes
	private class TiVerticalScrollView extends ScrollView
	{
		private TiScrollViewLayout layout;	
		
		public TiVerticalScrollView(Context context)
		{
			super(context);
			setScrollBarStyle(SCROLLBARS_INSIDE_OVERLAY);
			//setFillViewport(true);
			//setScrollContainer(true);
			
			layout = new TiScrollViewLayout(context);
			FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
				ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.FILL_PARENT);
			layout.setLayoutParams(params);
			super.addView(layout, params);
		}
		
		@Override
		public void addView(View child,
				android.view.ViewGroup.LayoutParams params) {
			layout.addView(child, params);
		}
		
		@Override
		protected void onScrollChanged(int l, int t, int oldl, int oldt) {
			super.onScrollChanged(l, t, oldl, oldt);
			
			TiDict data = new TiDict();
			data.put("x", l);
			data.put("y", t);
			getProxy().fireEvent("scroll", data);
		}
	}
	
	private class TiHorizontalScrollView extends HorizontalScrollView
	{
		private TiScrollViewLayout layout;	
		
		public TiHorizontalScrollView(Context context)
		{
			super(context);
			setScrollBarStyle(SCROLLBARS_INSIDE_OVERLAY);
			setFillViewport(true);
			setScrollContainer(true);
			
			layout = new TiScrollViewLayout(context);
			FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
				ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.FILL_PARENT);
			layout.setLayoutParams(params);
			super.addView(layout, params);
		}
		
		@Override
		public void addView(View child,
				android.view.ViewGroup.LayoutParams params) {
			layout.addView(child, params);
		}

		@Override
		protected void onScrollChanged(int l, int t, int oldl, int oldt) {
			super.onScrollChanged(l, t, oldl, oldt);
			
			TiDict data = new TiDict();
			data.put("x", l);
			data.put("y", t);
			getProxy().fireEvent("scroll", data);
		}
	}
	
	public TiUIScrollView(TiViewProxy proxy)
	{
		// we create the view after the properties are procesed
		super(proxy);
	}
	
	@Override
	public void processProperties(TiDict d)
	{
		int type = TYPE_VERTICAL;
		
		// TODO: fix this when we have a true scroll view
		// we determine the type by the showHorizontal/VerticalScrollIndicator flag (which also controls visibility)
		// by default we assume vertical, if the horizontal property is true and vertical is false or not set, we create a horizontal scroll view
		// if both are set, we default back to vertical only
		if (d.containsKey(SHOW_HORIZONTAL_SCROLL_INDICATOR)) {
			if (!d.containsKey(SHOW_VERTICAL_SCROLL_INDICATOR)) {
				type = TYPE_HORIZONTAL;
			} else {
				Object value = d.get(SHOW_VERTICAL_SCROLL_INDICATOR);
				if (value instanceof Boolean && !((Boolean)value).booleanValue()) {
					type = TYPE_HORIZONTAL;
				}
			}
		}

		// we create the view here since we now know the potential widget type
		View view = null;
		switch (type) {
			case TYPE_HORIZONTAL:
				Log.d(LCAT, "creating horizontal scroll view");
				view = new TiHorizontalScrollView(getProxy().getContext());
				break;
			case TYPE_VERTICAL:
			default:
				Log.d(LCAT, "creating vertical scroll view");
				view = new TiVerticalScrollView(getProxy().getContext());
		}
		setNativeView(view);
		super.processProperties(d);
	}
	
	public TiScrollViewLayout getLayout() {
		View nativeView = getNativeView();
		if (nativeView instanceof TiVerticalScrollView) {
			return ((TiVerticalScrollView)nativeView).layout;
		} else {
			return ((TiHorizontalScrollView)nativeView).layout;
		}
	}
	
	public void scrollTo(int x, int y)
	{
		getNativeView().scrollTo(x, y);
		getNativeView().computeScroll();
		//getLayout().scrollTo(x, y);
	}
	
}
