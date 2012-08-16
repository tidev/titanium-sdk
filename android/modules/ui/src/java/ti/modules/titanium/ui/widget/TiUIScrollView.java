/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.graphics.Canvas;
import android.view.GestureDetector;
import android.view.GestureDetector.SimpleOnGestureListener;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ScrollView;

public class TiUIScrollView extends TiUIView
{
	public static final int TYPE_VERTICAL = 0;
	public static final int TYPE_HORIZONTAL = 1;

	private static final String TAG = "TiUIScrollView";
	private int offsetX = 0, offsetY = 0;
	private boolean setInitialOffset = false;
	private boolean mScrollingEnabled = true;

	private class TiScrollViewLayout extends TiCompositeLayout
	{
		private static final int AUTO = Integer.MAX_VALUE;
		private int parentWidth = 0;
		private int parentHeight = 0;
		private boolean canCancelEvents = true;
		private GestureDetector gestureDetector;

		public TiScrollViewLayout(Context context, LayoutArrangement arrangement)
		{
			super(context, arrangement, proxy);
			gestureDetector = new GestureDetector(new SimpleOnGestureListener()
			{
				@Override
				public void onLongPress(MotionEvent e)
				{
					// Only do this for long presses to match iOS behavior
					requestDisallowInterceptTouchEvent(true);
				}
			});
		}

		public void setParentWidth(int width)
		{
			parentWidth = width;
		}

		public void setParentHeight(int height)
		{
			parentHeight = height;
		}

		public void setCanCancelEvents(boolean value)
		{
			canCancelEvents = value;
		}

		@Override
		public boolean dispatchTouchEvent(MotionEvent ev)
		{
			// If canCancelEvents is false, then we want to prevent the scroll view from canceling the touch
			// events of the child view by calling requestDisallowInterceptTouchEvent(true)
			if (!canCancelEvents) {
				gestureDetector.onTouchEvent(ev);
			}
			return super.dispatchTouchEvent(ev);
		}

		private int getContentProperty(String property)
		{
			Object value = getProxy().getProperty(property);
			if (value != null) {
				if (value.equals(TiC.SIZE_AUTO)) {
					return AUTO;
				} else if (value instanceof Number) {
					return ((Number) value).intValue();
				} else {
					int type = 0;
					TiDimension dimension;
					if (TiC.PROPERTY_CONTENT_HEIGHT.equals(property)) {
						type = TiDimension.TYPE_HEIGHT;
					} else if (TiC.PROPERTY_CONTENT_WIDTH.equals(property)) {
						type = TiDimension.TYPE_WIDTH;
					}
					dimension = new TiDimension(value.toString(), type);
					return dimension.getUnits() == TiDimension.COMPLEX_UNIT_AUTO ? AUTO : dimension.getIntValue();
				}
			}
			return AUTO;
		}

		@Override
		protected int getWidthMeasureSpec(View child)
		{
			int contentWidth = getContentProperty(TiC.PROPERTY_CONTENT_WIDTH);
			if (contentWidth == AUTO) {
				return MeasureSpec.UNSPECIFIED;
			} else {
				return super.getWidthMeasureSpec(child);
			}
		}

		@Override
		protected int getHeightMeasureSpec(View child)
		{
			int contentHeight = getContentProperty(TiC.PROPERTY_CONTENT_HEIGHT);
			if (contentHeight == AUTO) {
				return MeasureSpec.UNSPECIFIED;
			} else {
				return super.getHeightMeasureSpec(child);
			}
		}

		@Override
		protected int getMeasuredWidth(int maxWidth, int widthSpec)
		{
			int contentWidth = getContentProperty(TiC.PROPERTY_CONTENT_WIDTH);
			if (contentWidth == AUTO) {
				contentWidth = maxWidth; // measuredWidth;
			}		

			// Returns the content's width when it's greater than the scrollview's width
			if (contentWidth > parentWidth) {
				return contentWidth;
			} else {
				return resolveSize(maxWidth, widthSpec);
			}
		}

		@Override
		protected int getMeasuredHeight(int maxHeight, int heightSpec)
		{
			int contentHeight = getContentProperty(TiC.PROPERTY_CONTENT_HEIGHT);
			if (contentHeight == AUTO) {
				contentHeight = maxHeight; // measuredHeight;
			}

			// Returns the content's height when it's greater than the scrollview's height
			if (contentHeight > parentHeight) {
				return contentHeight;
			} else {
				return resolveSize(maxHeight, heightSpec);
			}
		} 
	}

	// same code, different super-classes
	private class TiVerticalScrollView extends ScrollView
	{
		private TiScrollViewLayout layout;

		public TiVerticalScrollView(Context context, LayoutArrangement arrangement)
		{
			super(context);
			setScrollBarStyle(SCROLLBARS_INSIDE_OVERLAY);

			layout = new TiScrollViewLayout(context, arrangement);
			FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.FILL_PARENT);
			layout.setLayoutParams(params);
			super.addView(layout, params);
		}

		public TiScrollViewLayout getLayout()
		{
			return layout;
		}

		@Override
		public boolean onTouchEvent(MotionEvent event) {
			if (event.getAction() == MotionEvent.ACTION_MOVE && !mScrollingEnabled) {
				return false;
			}
			//There's a known Android bug (version 3.1 and above) that will throw an exception when we use 3+ fingers to touch the scrollview.
			//Link: http://code.google.com/p/android/issues/detail?id=18990
			try {
				return super.onTouchEvent(event);
			} catch (IllegalArgumentException e) {
				return false;
			}
		}
		
		@Override
		public boolean onInterceptTouchEvent(MotionEvent event) {
			if (mScrollingEnabled) {
				return super.onInterceptTouchEvent(event);
			}

			return false;
		}
		
		@Override
		public void addView(View child, android.view.ViewGroup.LayoutParams params)
		{
			layout.addView(child, params);
		}

		public void onDraw(Canvas canvas)
		{
			super.onDraw(canvas);
			// setting offset once when this view is visible
			if (!setInitialOffset) {
				scrollTo(offsetX, offsetY);
				setInitialOffset = true;
			}

		}

		@Override
		protected void onScrollChanged(int l, int t, int oldl, int oldt)
		{
			super.onScrollChanged(l, t, oldl, oldt);

			KrollDict data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_X, l);
			data.put(TiC.EVENT_PROPERTY_Y, t);
			setContentOffset(l, t);
			getProxy().fireEvent(TiC.EVENT_SCROLL, data);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			layout.setParentHeight(MeasureSpec.getSize(heightMeasureSpec));
			layout.setParentWidth(MeasureSpec.getSize(widthMeasureSpec));
			super.onMeasure(widthMeasureSpec, heightMeasureSpec);

			// This is essentially doing the same logic as if you did setFillViewPort(true). In native Android, they
			// don't measure the child again if measured height of content view < scrollViewheight. But we want to do
			// this in all cases since we allow the content view height to be greater than the scroll view. We force
			// this to allow fill behavior: TIMOB-8243.
			if (getChildCount() > 0) {
				final View child = getChildAt(0);
				int height = getMeasuredHeight();
				final FrameLayout.LayoutParams lp = (LayoutParams) child.getLayoutParams();

				int childWidthMeasureSpec = getChildMeasureSpec(widthMeasureSpec, getPaddingLeft() + getPaddingRight(),
					lp.width);
				height -= getPaddingTop();
				height -= getPaddingBottom();

				// If we measure the child height to be greater than the parent height, use it in subsequent
				// calculations to make sure the children are measured correctly the second time around.
				height = Math.max(child.getMeasuredHeight(), height);
				int childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY);
				child.measure(childWidthMeasureSpec, childHeightMeasureSpec);

			}
		}
	}

	private class TiHorizontalScrollView extends HorizontalScrollView
	{
		private TiScrollViewLayout layout;

		public TiHorizontalScrollView(Context context, LayoutArrangement arrangement)
		{
			super(context);
			setScrollBarStyle(SCROLLBARS_INSIDE_OVERLAY);
			setScrollContainer(true);

			layout = new TiScrollViewLayout(context, arrangement);
			FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.FILL_PARENT,
				ViewGroup.LayoutParams.FILL_PARENT);
			layout.setLayoutParams(params);
			super.addView(layout, params);

		}

		public TiScrollViewLayout getLayout()
		{
			return layout;
		}

		@Override
		public boolean onTouchEvent(MotionEvent event) {
			if (event.getAction() == MotionEvent.ACTION_MOVE && !mScrollingEnabled) {
				return false;
			}
			//There's a known Android bug (version 3.1 and above) that will throw an exception when we use 3+ fingers to touch the scrollview.
			//Link: http://code.google.com/p/android/issues/detail?id=18990
			try {
				return super.onTouchEvent(event);
			} catch (IllegalArgumentException e) {
				return false;
			}
		}
		
		@Override
		public boolean onInterceptTouchEvent(MotionEvent event) {
			if (mScrollingEnabled) {
				return super.onInterceptTouchEvent(event);
			}

			return false;
		}

		@Override
		public void addView(View child, android.view.ViewGroup.LayoutParams params)
		{
			layout.addView(child, params);
		}

		public void onDraw(Canvas canvas)
		{
			super.onDraw(canvas);
			// setting offset once this view is visible
			if (!setInitialOffset) {
				scrollTo(offsetX, offsetY);
				setInitialOffset = true;
			}

		}

		@Override
		protected void onScrollChanged(int l, int t, int oldl, int oldt)
		{
			super.onScrollChanged(l, t, oldl, oldt);

			KrollDict data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_X, l);
			data.put(TiC.EVENT_PROPERTY_Y, t);
			setContentOffset(l, t);
			getProxy().fireEvent(TiC.EVENT_SCROLL, data);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			layout.setParentHeight(MeasureSpec.getSize(heightMeasureSpec));
			layout.setParentWidth(MeasureSpec.getSize(widthMeasureSpec));
			super.onMeasure(widthMeasureSpec, heightMeasureSpec);

			// This is essentially doing the same logic as if you did setFillViewPort(true). In native Android, they
			// don't measure the child again if measured width of content view < scroll view width. But we want to do
			// this in all cases since we allow the content view width to be greater than the scroll view. We force this
			// to allow fill behavior: TIMOB-8243.
			if (getChildCount() > 0) {
				final View child = getChildAt(0);
				int width = getMeasuredWidth();
				final FrameLayout.LayoutParams lp = (LayoutParams) child.getLayoutParams();

				int childHeightMeasureSpec = getChildMeasureSpec(heightMeasureSpec, getPaddingTop() + getPaddingBottom(),
					lp.height);
				width -= getPaddingLeft();
				width -= getPaddingRight();

				// If we measure the child width to be greater than the parent width, use it in subsequent
				// calculations to make sure the children are measured correctly the second time around.
				width = Math.max(child.getMeasuredWidth(), width);
				int childWidthMeasureSpec = MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY);

				child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
			}

		}
	}

	public TiUIScrollView(TiViewProxy proxy)
	{
		// we create the view after the properties are processed
		super(proxy);
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;
	}

	public void setContentOffset(int x, int y)
	{
		KrollDict offset = new KrollDict();
		offsetX = x;
		offsetY = y;
		offset.put(TiC.EVENT_PROPERTY_X, offsetX);
		offset.put(TiC.EVENT_PROPERTY_Y, offsetY);
		getProxy().setProperty(TiC.PROPERTY_CONTENT_OFFSET, offset);
	}

	public void setContentOffset(Object hashMap)
	{
		if (hashMap instanceof HashMap) {
			HashMap contentOffset = (HashMap) hashMap;
			offsetX = TiConvert.toInt(contentOffset, TiC.PROPERTY_X);
			offsetY = TiConvert.toInt(contentOffset, TiC.PROPERTY_Y);
		} else {
			Log.e(TAG, "ContentOffset must be an instance of HashMap");
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		if (key.equals(TiC.PROPERTY_CONTENT_OFFSET)) {
			setContentOffset(newValue);
			scrollTo(offsetX, offsetY);
		}
		if (key.equals(TiC.PROPERTY_CAN_CANCEL_EVENTS)) {
			View view = getNativeView();
			boolean canCancelEvents = TiConvert.toBoolean(newValue);
			if (view instanceof TiHorizontalScrollView) {
				((TiHorizontalScrollView) view).getLayout().setCanCancelEvents(canCancelEvents);
			} else if (view instanceof TiVerticalScrollView) {
				((TiVerticalScrollView) view).getLayout().setCanCancelEvents(canCancelEvents);
			}
		}
		if (TiC.PROPERTY_SCROLLING_ENABLED.equals(key)) {
			setScrollingEnabled(newValue);
		}
		super.propertyChanged(key, oldValue, newValue, proxy);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		boolean showHorizontalScrollBar = false;
		boolean showVerticalScrollBar = false;

		if (d.containsKey(TiC.PROPERTY_SCROLLING_ENABLED)) {
			setScrollingEnabled(d.get(TiC.PROPERTY_SCROLLING_ENABLED));
		}

		if (d.containsKey(TiC.PROPERTY_SHOW_HORIZONTAL_SCROLL_INDICATOR)) {
			showHorizontalScrollBar = TiConvert.toBoolean(d, TiC.PROPERTY_SHOW_HORIZONTAL_SCROLL_INDICATOR);
		}
		if (d.containsKey(TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR)) {
			showVerticalScrollBar = TiConvert.toBoolean(d, TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR);
		}

		if (showHorizontalScrollBar && showVerticalScrollBar) {
			Log.w(TAG, "Both scroll bars cannot be shown. Defaulting to vertical shown");
			showHorizontalScrollBar = false;
		}

		if (d.containsKey(TiC.PROPERTY_CONTENT_OFFSET)) {
			Object offset = d.get(TiC.PROPERTY_CONTENT_OFFSET);
			setContentOffset(offset);
		}

		int type = TYPE_VERTICAL;
		boolean deduced = false;

		if (d.containsKey(TiC.PROPERTY_WIDTH) && d.containsKey(TiC.PROPERTY_CONTENT_WIDTH)) {
			Object width = d.get(TiC.PROPERTY_WIDTH);
			Object contentWidth = d.get(TiC.PROPERTY_CONTENT_WIDTH);
			if (width.equals(contentWidth) || showVerticalScrollBar) {
				type = TYPE_VERTICAL;
				deduced = true;
			}
		}

		if (d.containsKey(TiC.PROPERTY_HEIGHT) && d.containsKey(TiC.PROPERTY_CONTENT_HEIGHT)) {
			Object height = d.get(TiC.PROPERTY_HEIGHT);
			Object contentHeight = d.get(TiC.PROPERTY_CONTENT_HEIGHT);
			if (height.equals(contentHeight) || showHorizontalScrollBar) {
				type = TYPE_HORIZONTAL;
				deduced = true;
			}
		}

		// android only property
		if (d.containsKey(TiC.PROPERTY_SCROLL_TYPE)) {
			Object scrollType = d.get(TiC.PROPERTY_SCROLL_TYPE);
			if (scrollType.equals(TiC.LAYOUT_VERTICAL)) {
				type = TYPE_VERTICAL;
			} else if (scrollType.equals(TiC.LAYOUT_HORIZONTAL)) {
				type = TYPE_HORIZONTAL;
			} else {
				Log.w(TAG, "scrollType value '" + TiConvert.toString(scrollType)
					+ "' is invalid. Only 'vertical' and 'horizontal' are supported.");
			}
		} else if (!deduced && type == TYPE_VERTICAL) {
			Log.w(
				TAG,
				"Scroll direction could not be determined based on the provided view properties. Default VERTICAL scroll direction being used. Use the 'scrollType' property to explicitly set the scrolling direction.");
		}

		// we create the view here since we now know the potential widget type
		View view = null;
		boolean canCancelEvents = true;
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		if (d.containsKey(TiC.PROPERTY_LAYOUT) && d.getString(TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_VERTICAL)) {
			arrangement = LayoutArrangement.VERTICAL;
		} else if (d.containsKey(TiC.PROPERTY_LAYOUT) && d.getString(TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_HORIZONTAL)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		}

		if (d.containsKey(TiC.PROPERTY_CAN_CANCEL_EVENTS)) {
			canCancelEvents = TiConvert.toBoolean(d, TiC.PROPERTY_CAN_CANCEL_EVENTS);
		}

		switch (type) {
			case TYPE_HORIZONTAL:
				Log.d(TAG, "creating horizontal scroll view", Log.DEBUG_MODE);
				view = new TiHorizontalScrollView(getProxy().getActivity(), arrangement);
				((TiHorizontalScrollView) view).getLayout().setCanCancelEvents(canCancelEvents);
				break;
			case TYPE_VERTICAL:
			default:
				Log.d(TAG, "creating vertical scroll view", Log.DEBUG_MODE);
				view = new TiVerticalScrollView(getProxy().getActivity(), arrangement);
				((TiVerticalScrollView) view).getLayout().setCanCancelEvents(canCancelEvents);
		}
		setNativeView(view);

		nativeView.setHorizontalScrollBarEnabled(showHorizontalScrollBar);
		nativeView.setVerticalScrollBarEnabled(showVerticalScrollBar);

		super.processProperties(d);
	}

	public TiScrollViewLayout getLayout()
	{
		View nativeView = getNativeView();
		if (nativeView instanceof TiVerticalScrollView) {
			return ((TiVerticalScrollView) nativeView).layout;
		} else {
			return ((TiHorizontalScrollView) nativeView).layout;
		}
	}

	public void setScrollingEnabled(Object value)
	{
		try {
			mScrollingEnabled = TiConvert.toBoolean(value);
		} catch (IllegalArgumentException e) {
			mScrollingEnabled = true;
		}
	}

	public boolean getScrollingEnabled()
	{
		return mScrollingEnabled;
	}

	public void scrollTo(int x, int y)
	{
		getNativeView().scrollTo(x, y);
		getNativeView().computeScroll();
	}

	public void scrollToBottom()
	{
		View view = getNativeView();
		if (view instanceof TiHorizontalScrollView) {
			TiHorizontalScrollView scrollView = (TiHorizontalScrollView) view;
			scrollView.fullScroll(View.FOCUS_RIGHT);
		} else if (view instanceof TiVerticalScrollView) {
			TiVerticalScrollView scrollView = (TiVerticalScrollView) view;
			scrollView.fullScroll(View.FOCUS_DOWN);
		}
	}

	@Override
	public void add(TiUIView child)
	{
		super.add(child);

		if (getNativeView() != null) {
			getLayout().requestLayout();
			if (child.getNativeView() != null) {
				child.getNativeView().requestLayout();
			}
		}
	}

	@Override
	public void remove(TiUIView child)
	{
		if (child != null) {
			View cv = child.getOuterView();
			if (cv != null) {
				View nv = getLayout();
				if (nv instanceof ViewGroup) {
					((ViewGroup) nv).removeView(cv);
					children.remove(child);
					child.setParent(null);
				}
			}
		}
	}

}
