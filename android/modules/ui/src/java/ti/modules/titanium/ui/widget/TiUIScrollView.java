/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.graphics.Canvas;
import android.os.Build;
import android.support.v4.view.NestedScrollingChild;
import android.support.v4.view.NestedScrollingChildHelper;
import android.support.v4.widget.NestedScrollView;
import android.util.AttributeSet;
import android.util.Xml;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import java.util.HashMap;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;
import org.appcelerator.titanium.view.TiUIView;
import org.xmlpull.v1.XmlPullParser;
import ti.modules.titanium.ui.RefreshControlProxy;
import ti.modules.titanium.ui.ScrollViewProxy;

public class TiUIScrollView extends TiUIView
{
	public static final int TYPE_VERTICAL = 0;
	public static final int TYPE_HORIZONTAL = 1;

	private static final String TAG = "TiUIScrollView";

	private View scrollView;
	private int offsetX = 0, offsetY = 0;
	private boolean setInitialOffset = false;
	private boolean mScrollingEnabled = true;
	private boolean isScrolling = false;
	private boolean isTouching = false;

	private static int verticalAttrId = -1;
	private static int horizontalAttrId = -1;

	public class TiScrollViewLayout extends TiCompositeLayout
	{
		private static final int AUTO = Integer.MAX_VALUE;
		private int parentContentWidth = 0;
		private int parentContentHeight = 0;
		private boolean canCancelEvents = true;
		private GestureDetector gestureDetector;
		private boolean wasMeasured;

		public TiScrollViewLayout(Context context, LayoutArrangement arrangement)
		{
			super(context, arrangement, proxy);
			gestureDetector = new GestureDetector(context, new GestureDetector.SimpleOnGestureListener() {
				@Override
				public void onLongPress(MotionEvent e)
				{
					if (proxy.hierarchyHasListener(TiC.EVENT_LONGPRESS)) {
						fireEvent(TiC.EVENT_LONGPRESS, dictFromEvent(e));
					}
				}
				@Override
				public boolean onSingleTapConfirmed(MotionEvent e)
				{
					if (proxy.hierarchyHasListener(TiC.EVENT_SINGLE_TAP)) {
						fireEvent(TiC.EVENT_SINGLE_TAP, dictFromEvent(e));
					}
					return true;
				}
				@Override
				public boolean onDoubleTap(MotionEvent e)
				{
					if (proxy.hierarchyHasListener(TiC.EVENT_DOUBLE_TAP)) {
						fireEvent(TiC.EVENT_DOUBLE_TAP, dictFromEvent(e));
					}
					return true;
				}
			});
			setOnTouchListener(new OnTouchListener() {
				@Override
				public boolean onTouch(View v, MotionEvent event)
				{
					return gestureDetector.onTouchEvent(event);
				}
			});
		}

		/**
		 * Sets the width of this view's parent, excluding its left/right padding.
		 * @param width The parent view's width, excluding padding.
		 */
		public void setParentContentWidth(int width)
		{
			if (width < 0) {
				width = 0;
			}
			this.parentContentWidth = width;
		}

		/**
		 * Gets the value set via the setParentContentWidth() method.
		 * Note that this value is not assignd automatically. The owner must assign it.
		 * @return Returns the parent view's width, excluding its left/right padding.
		 */
		public int getParentContentWidth()
		{
			return this.parentContentWidth;
		}

		/**
		 * Sets the height of this view's parent, excluding its top/bottom padding.
		 * @param width The parent view's height, excluding padding.
		 */
		public void setParentContentHeight(int height)
		{
			if (height < 0) {
				height = 0;
			}
			this.parentContentHeight = height;
		}

		/**
		 * Gets the value set via the setParentContentHeight() method.
		 * Note that this value is not assignd automatically. The owner must assign it.
		 * @return Returns the parent view's height, excluding its top/bottom padding.
		 */
		public int getParentContentHeight()
		{
			return this.parentContentHeight;
		}

		@Override
		public void setMinimumWidth(int value)
		{
			// Make sure given minimum is valid.
			if (value < 0) {
				value = 0;
			}

			// Update the minimum value, but only if it is changing.
			// Note: This is an optimization. Avoids unnecessary requestLayout() calls in UI tree.
			if (value != getMinimumWidth()) {
				super.setMinimumWidth(value);
			}
		}

		@Override
		public void setMinimumHeight(int value)
		{
			// Make sure given minimum is valid.
			if (value < 0) {
				value = 0;
			}

			// Update the minimum value, but only if it is changing.
			// Note: This is an optimization. Avoids unnecessary requestLayout() calls in UI tree.
			if (value != getMinimumHeight()) {
				super.setMinimumHeight(value);
			}
		}

		public void setCanCancelEvents(boolean value)
		{
			canCancelEvents = value;
		}

		/**
		 * Determines if this view's onMeasure() has been called.
		 * @return Returns true if this view's onMeasure() has been called. Returns false if not.
		 */
		public boolean wasMeasured()
		{
			return this.wasMeasured;
		}

		/**
		 * Sets the flag to be returned by this object's wasMeasured() method.
		 * <p>
		 * Intended to be set "false" by the parent view to determine if this view's onMeasure()
		 * method got called afterwards.
		 * @param value The value to be returned by the wasMeasured() method.
		 */
		public void setWasMeasured(boolean value)
		{
			this.wasMeasured = value;
		}

		@Override
		public boolean dispatchTouchEvent(MotionEvent ev)
		{
			// If canCancelEvents is false, then we want to prevent the scroll view from canceling the touch
			// events of the child view
			if (!canCancelEvents) {
				requestDisallowInterceptTouchEvent(true);
			}

			return super.dispatchTouchEvent(ev);
		}

		private int getContentProperty(String property)
		{
			Object value = getProxy().getProperty(property);
			if (value != null) {
				if (value.equals(TiC.SIZE_AUTO) || value.equals(TiC.LAYOUT_SIZE)) {
					return AUTO;
				} else if (value.equals(TiC.LAYOUT_FILL)) {
					if (TiC.PROPERTY_CONTENT_HEIGHT.equals(property)) {
						return this.parentContentHeight;
					} else if (TiC.PROPERTY_CONTENT_WIDTH.equals(property)) {
						return this.parentContentWidth;
					}
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
			if (contentWidth >= this.parentContentWidth) {
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
			if (contentHeight >= this.parentContentHeight) {
				return contentHeight;
			} else {
				return resolveSize(maxHeight, heightSpec);
			}
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			// Flag that the onMeasure() method has been called.
			this.wasMeasured = true;

			// Apply the "contentWidth" and "contentHeight" sizes to the child instead, if provided.
			int contentWidth = getContentProperty(TiC.PROPERTY_CONTENT_WIDTH);
			if ((contentWidth != AUTO) && (contentWidth >= this.parentContentWidth)) {
				widthMeasureSpec = MeasureSpec.makeMeasureSpec(contentWidth, MeasureSpec.EXACTLY);
			}
			int contentHeight = getContentProperty(TiC.PROPERTY_CONTENT_HEIGHT);
			if ((contentHeight != AUTO) && (contentHeight >= this.parentContentHeight)) {
				heightMeasureSpec = MeasureSpec.makeMeasureSpec(contentHeight, MeasureSpec.EXACTLY);
			}

			// If contentWidth/contentHeight is set to AUTO, then child views set to TI.UI.FILL
			// must use the ScrollView's container size instead of filling remaining content area.
			// Note: This matches iOS' behavior.
			if (contentWidth == AUTO) {
				setChildFillWidth(this.parentContentWidth);
			} else {
				setChildFillWidthToParent();
			}
			if (contentHeight == AUTO) {
				setChildFillHeight(this.parentContentHeight);
			} else {
				setChildFillHeightToParent();
			}

			// Child views using "percent" width/height and top/left/bottom/right/center settings
			// must be relative to the ScrollView container, not the scrollable content area.
			setChildRelativeSizingTo(this.parentContentWidth, this.parentContentHeight);

			// Request the composite layout to measure/resize itself. (Must be done after the above.)
			super.onMeasure(widthMeasureSpec, heightMeasureSpec);
		}
	}

	// TIMOB-26168: if 'android:scrollbars' is not defined then our scrollbars will never be initialized
	// so we do this our selves
	private AttributeSet getAttributeSet(Context context, int resourceId)
	{
		AttributeSet attr = null;
		try {
			XmlPullParser parser = context.getResources().getXml(resourceId);
			try {
				parser.next();
				parser.nextTag();
			} catch (Exception e) {
				// ignore...
			}
			attr = Xml.asAttributeSet(parser);
		} catch (Exception e) {
			// ignore...
		}
		return attr;
	}

	// same code, different super-classes
	private class TiVerticalScrollView extends NestedScrollView
	{
		private TiScrollViewLayout layout;

		public TiVerticalScrollView(Context context, LayoutArrangement arrangement)
		{
			super(context, getAttributeSet(context, verticalAttrId));

			// TIMOB-25359: allow window to re-size when keyboard is shown
			if (context instanceof TiBaseActivity) {
				Window window = ((TiBaseActivity) context).getWindow();
				int softInputMode = window.getAttributes().softInputMode;

				if ((softInputMode & WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN) == 0) {
					window.setSoftInputMode(softInputMode | WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
				}
			}
			setScrollBarStyle(SCROLLBARS_INSIDE_OVERLAY);
			layout = new TiScrollViewLayout(context, arrangement);
			FrameLayout.LayoutParams params =
				new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
			layout.setLayoutParams(params);
			super.addView(layout, params);
		}

		public TiScrollViewLayout getLayout()
		{
			return layout;
		}

		@Override
		public boolean onTouchEvent(MotionEvent event)
		{
			if (event.getAction() == MotionEvent.ACTION_MOVE && !mScrollingEnabled) {
				return false;
			}
			if (event.getAction() == MotionEvent.ACTION_MOVE && !isTouching) {
				isTouching = true;
			}
			if (event.getAction() == MotionEvent.ACTION_UP && isScrolling) {
				isScrolling = false;
				isTouching = false;
				KrollDict data = new KrollDict();
				data.put("decelerate", true);
				getProxy().fireEvent(TiC.EVENT_DRAGEND, data);
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
		public boolean onInterceptTouchEvent(MotionEvent event)
		{
			if (mScrollingEnabled) {
				return super.onInterceptTouchEvent(event);
			}

			return false;
		}

		/**
		 * Called when a NestedScrollingChild view within the ListView wants to scroll the ListView.
		 * <p>
		 * This can happen with a NestedScrollView or a scrollable TiUIEditText where scrolling
		 * past the top/bottom of the child view should cause the ListView to scroll.
		 * @param target The NestedScrollingChild view that wants to scroll this view.
		 * @param dxConsumed Horizontal scroll distance in pixels already consumed by the child.
		 * @param dyConsumed Vertical scroll distance in pixels already consumed by the child.
		 * @param dxUnconsumed Horizontal distance in pixels that this view is being requested to scroll by.
		 * @param dyUnconsumed Vertical distance in pixels that this view is being requested to scroll by.
		 */
		@Override
		public void onNestedScroll(View target, int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed)
		{
			if (mScrollingEnabled) {
				super.onNestedScroll(target, dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed);
			} else {
				dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, null);
			}
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
			if (!isScrolling && isTouching) {
				isScrolling = true;
				KrollDict data = new KrollDict();
				getProxy().fireEvent(TiC.EVENT_DRAGSTART, data);
			}

			KrollDict data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_X, l);
			data.put(TiC.EVENT_PROPERTY_Y, t);
			data.put(TiC.PROPERTY_CONTENT_SIZE, contentSize());
			setContentOffset(l, t);
			getProxy().fireEvent(TiC.EVENT_SCROLL, data);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			// Reset flag used to detect if child view's onMeasure() got called.
			layout.setWasMeasured(false);

			// Store this view's new size, minus the padding.
			// Must be assigned before calling onMeasure() below.
			layout.setParentContentWidth(MeasureSpec.getSize(widthMeasureSpec)
										 - (getPaddingLeft() + getPaddingRight()));
			layout.setParentContentHeight(MeasureSpec.getSize(heightMeasureSpec)
										  - (getPaddingTop() + getPaddingBottom()));

			// If the scroll view container has a fixed size (ie: not using AT_MOST/WRAP_CONTENT),
			// then set up the scrollable content area to be at least the size of the container.
			// Note: Allows views to be docked to bottom or right side when using a "composite" layout.
			boolean hasFixedSize = (MeasureSpec.getMode(widthMeasureSpec) == MeasureSpec.EXACTLY);
			layout.setMinimumWidth(hasFixedSize ? layout.getParentContentWidth() : 0);
			hasFixedSize = (MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY);
			layout.setMinimumHeight(hasFixedSize ? layout.getParentContentHeight() : 0);

			// Update the size of this view and its children.
			super.onMeasure(widthMeasureSpec, heightMeasureSpec);

			// Google's scroll view won't call child's measure() method if content height is less than
			// the scroll view's height. If it wasn't called, then do so now. (See: TIMOB-8243)
			if (!layout.wasMeasured() && (getChildCount() > 0)) {
				final View child = getChildAt(0);
				int height = getMeasuredHeight();
				final FrameLayout.LayoutParams lp = (LayoutParams) child.getLayoutParams();
				int childWidthMeasureSpec =
					getChildMeasureSpec(widthMeasureSpec, getPaddingLeft() + getPaddingRight(), lp.width);
				height -= getPaddingTop();
				height -= getPaddingBottom();
				int childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY);
				child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
			}
		}
	}

	private class TiHorizontalScrollView extends HorizontalScrollView implements NestedScrollingChild
	{
		private TiScrollViewLayout layout;
		private NestedScrollingChildHelper nestedScrollingChildHelper;

		public TiHorizontalScrollView(Context context, LayoutArrangement arrangement)
		{
			super(context, getAttributeSet(context, horizontalAttrId));
			setScrollBarStyle(SCROLLBARS_INSIDE_OVERLAY);
			setScrollContainer(true);

			// Set up nested scrolling. Improves "SwipeRefreshLayout" touch interception handling.
			// Note: On Android 5.0 and above, all views support nested child scrolling. We just need to enable it.
			//       The "NestedScrollingChildHelper" is only needed for older Android OS versions.
			if (Build.VERSION.SDK_INT < 21) {
				this.nestedScrollingChildHelper = new NestedScrollingChildHelper(this);
			}
			setNestedScrollingEnabled(true);
			layout = new TiScrollViewLayout(context, arrangement);
			FrameLayout.LayoutParams params =
				new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
			layout.setLayoutParams(params);
			super.addView(layout, params);
		}

		public TiScrollViewLayout getLayout()
		{
			return layout;
		}

		@Override
		public boolean onTouchEvent(MotionEvent event)
		{
			if (event.getAction() == MotionEvent.ACTION_MOVE && !mScrollingEnabled) {
				return false;
			}
			if (event.getAction() == MotionEvent.ACTION_MOVE && !isTouching) {
				isTouching = true;
			}
			if (event.getAction() == MotionEvent.ACTION_UP && isScrolling) {
				isScrolling = false;
				isTouching = false;
				KrollDict data = new KrollDict();
				data.put("decelerate", true);
				getProxy().fireEvent(TiC.EVENT_DRAGEND, data);
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
		public boolean onInterceptTouchEvent(MotionEvent event)
		{
			if (mScrollingEnabled) {
				return super.onInterceptTouchEvent(event);
			}

			return false;
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

			if (!isScrolling && isTouching) {
				isScrolling = true;
				getProxy().fireEvent(TiC.EVENT_DRAGSTART, data);
			}

			data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_X, l);
			data.put(TiC.EVENT_PROPERTY_Y, t);
			data.put(TiC.PROPERTY_CONTENT_SIZE, contentSize());
			setContentOffset(l, t);
			getProxy().fireEvent(TiC.EVENT_SCROLL, data);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			// Reset flag used to detect if child view's onMeasure() got called.
			layout.setWasMeasured(false);

			// Store this view's new size, minus the padding.
			// Must be assigned before calling onMeasure() below.
			layout.setParentContentWidth(MeasureSpec.getSize(widthMeasureSpec)
										 - (getPaddingLeft() + getPaddingRight()));
			layout.setParentContentHeight(MeasureSpec.getSize(heightMeasureSpec)
										  - (getPaddingTop() + getPaddingBottom()));

			// If the scroll view container has a fixed size (ie: not using AT_MOST/WRAP_CONTENT),
			// then set up the scrollable content area to be at least the size of the container.
			// Note: Allows views to be docked to bottom or right side when using a "composite" layout.
			boolean hasFixedSize = (MeasureSpec.getMode(widthMeasureSpec) == MeasureSpec.EXACTLY);
			layout.setMinimumWidth(hasFixedSize ? layout.getParentContentWidth() : 0);
			hasFixedSize = (MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY);
			layout.setMinimumHeight(hasFixedSize ? layout.getParentContentHeight() : 0);

			// Update the size of this view and its children.
			super.onMeasure(widthMeasureSpec, heightMeasureSpec);

			// Google's scroll view won't call child's measure() method if content height is less than
			// the scroll view's height. If it wasn't called, then do so now. (See: TIMOB-8243)
			if (!layout.wasMeasured() && (getChildCount() > 0)) {
				final View child = getChildAt(0);
				int width = getMeasuredWidth();
				final FrameLayout.LayoutParams lp = (LayoutParams) child.getLayoutParams();
				int childHeightMeasureSpec =
					getChildMeasureSpec(heightMeasureSpec, getPaddingTop() + getPaddingBottom(), lp.height);
				width -= getPaddingLeft();
				width -= getPaddingRight();
				int childWidthMeasureSpec = MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY);
				child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
			}
		}

		@Override
		public boolean dispatchNestedFling(float velocityX, float velocityY, boolean consumed)
		{
			if (this.nestedScrollingChildHelper != null) {
				return this.nestedScrollingChildHelper.dispatchNestedFling(velocityX, velocityY, consumed);
			}
			return super.dispatchNestedFling(velocityX, velocityY, consumed);
		}

		@Override
		public boolean dispatchNestedPreFling(float velocityX, float velocityY)
		{
			if (this.nestedScrollingChildHelper != null) {
				return this.nestedScrollingChildHelper.dispatchNestedPreFling(velocityX, velocityY);
			}
			return super.dispatchNestedPreFling(velocityX, velocityY);
		}

		@Override
		public boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow)
		{
			if (this.nestedScrollingChildHelper != null) {
				return this.nestedScrollingChildHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow);
			}
			return super.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow);
		}

		@Override
		public boolean dispatchNestedScroll(int dxConsumed, int dyConsumed, int dxUnconsumed, int dyUnconsumed,
											int[] offsetInWindow)
		{
			if (this.nestedScrollingChildHelper != null) {
				return this.nestedScrollingChildHelper.dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed,
																			dyUnconsumed, offsetInWindow);
			}
			return super.dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow);
		}

		@Override
		public boolean hasNestedScrollingParent()
		{
			if (this.nestedScrollingChildHelper != null) {
				return this.nestedScrollingChildHelper.hasNestedScrollingParent();
			}
			return super.hasNestedScrollingParent();
		}

		@Override
		public boolean isNestedScrollingEnabled()
		{
			if (this.nestedScrollingChildHelper != null) {
				return this.nestedScrollingChildHelper.isNestedScrollingEnabled();
			}
			return super.isNestedScrollingEnabled();
		}

		@Override
		public void setNestedScrollingEnabled(boolean enabled)
		{
			if (this.nestedScrollingChildHelper != null) {
				this.nestedScrollingChildHelper.setNestedScrollingEnabled(enabled);
			} else {
				super.setNestedScrollingEnabled(enabled);
			}
		}

		@Override
		public boolean startNestedScroll(int axes)
		{
			if (this.nestedScrollingChildHelper != null) {
				return this.nestedScrollingChildHelper.startNestedScroll(axes);
			}
			return super.startNestedScroll(axes);
		}

		@Override
		public void stopNestedScroll()
		{
			if (this.nestedScrollingChildHelper != null) {
				this.nestedScrollingChildHelper.stopNestedScroll();
			} else {
				super.stopNestedScroll();
			}
		}
	}

	public TiUIScrollView(TiViewProxy proxy)
	{
		// we create the view after the properties are processed
		super(proxy);
		getLayoutParams().autoFillsHeight = true;
		getLayoutParams().autoFillsWidth = true;

		try {
			if (verticalAttrId == -1) {
				verticalAttrId = TiRHelper.getResource("xml.titanium_ui_vertical_nested_scrollview");
			}
			if (horizontalAttrId == -1) {
				horizontalAttrId = TiRHelper.getResource("xml.titanium_ui_horizontal_nested_scrollview");
			}
		} catch (Exception e) {
			Log.w(TAG, "could not load NestedScrollView attributes");
		}
	}

	@Override
	public void release()
	{
		// If a refresh control is currently assigned, then detach it.
		View nativeView = getNativeView();
		if (nativeView instanceof TiSwipeRefreshLayout) {
			RefreshControlProxy.unassignFrom((TiSwipeRefreshLayout) nativeView);
		}

		// Release scroll view reference.
		this.scrollView = null;

		// Release this object's resources.
		super.release();
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
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}

		if (key.equals(TiC.PROPERTY_CONTENT_OFFSET)) {
			setContentOffset(newValue);
			scrollTo(offsetX, offsetY, false);
		} else if (key.equals(TiC.PROPERTY_CAN_CANCEL_EVENTS)) {
			View view = this.scrollView;
			boolean canCancelEvents = TiConvert.toBoolean(newValue);
			if (view instanceof TiHorizontalScrollView) {
				((TiHorizontalScrollView) view).getLayout().setCanCancelEvents(canCancelEvents);
			} else if (view instanceof TiVerticalScrollView) {
				((TiVerticalScrollView) view).getLayout().setCanCancelEvents(canCancelEvents);
			}
		} else if (TiC.PROPERTY_SCROLLING_ENABLED.equals(key)) {
			setScrollingEnabled(newValue);
		} else if (TiC.PROPERTY_REFRESH_CONTROL.equals(key)) {
			View nativeView = getNativeView();
			if (nativeView instanceof TiSwipeRefreshLayout) {
				if (newValue == null) {
					RefreshControlProxy.unassignFrom((TiSwipeRefreshLayout) nativeView);
				} else if (newValue instanceof RefreshControlProxy) {
					((RefreshControlProxy) newValue).assignTo((TiSwipeRefreshLayout) nativeView);
				} else {
					Log.e(TAG, "Invalid value assigned to property '" + key + "'. Must be of type 'RefreshControl'.");
				}
			} else {
				Log.e(TAG, "ScrollView failed to obtain reference to 'TiSwipeRefreshLayout' object.");
			}
		} else if (TiC.PROPERTY_OVER_SCROLL_MODE.equals(key)) {
			if (this.scrollView != null) {
				this.scrollView.setOverScrollMode(TiConvert.toInt(newValue, View.OVER_SCROLL_ALWAYS));
			}
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
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		TiScrollViewLayout scrollViewLayout;
		if (d.containsKey(TiC.PROPERTY_LAYOUT) && d.getString(TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_VERTICAL)) {
			arrangement = LayoutArrangement.VERTICAL;
		} else if (d.containsKey(TiC.PROPERTY_LAYOUT)
				   && d.getString(TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_HORIZONTAL)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		}

		switch (type) {
			case TYPE_HORIZONTAL:
				Log.d(TAG, "creating horizontal scroll view", Log.DEBUG_MODE);
				this.scrollView = new TiHorizontalScrollView(getProxy().getActivity(), arrangement);
				scrollViewLayout = ((TiHorizontalScrollView) this.scrollView).getLayout();
				break;
			case TYPE_VERTICAL:
			default:
				Log.d(TAG, "creating vertical scroll view", Log.DEBUG_MODE);
				this.scrollView = new TiVerticalScrollView(getProxy().getActivity(), arrangement);
				scrollViewLayout = ((TiVerticalScrollView) this.scrollView).getLayout();
		}

		if (d.containsKey(TiC.PROPERTY_CAN_CANCEL_EVENTS)) {
			((TiScrollViewLayout) scrollViewLayout)
				.setCanCancelEvents(TiConvert.toBoolean(d, TiC.PROPERTY_CAN_CANCEL_EVENTS));
		}

		boolean autoContentWidth =
			(scrollViewLayout.getContentProperty(TiC.PROPERTY_CONTENT_WIDTH) == TiScrollViewLayout.AUTO);
		boolean wrap = !autoContentWidth;
		if (d.containsKey(TiC.PROPERTY_HORIZONTAL_WRAP) && wrap) {
			wrap = TiConvert.toBoolean(d, TiC.PROPERTY_HORIZONTAL_WRAP, true);
		}
		scrollViewLayout.setEnableHorizontalWrap(wrap);

		if (d.containsKey(TiC.PROPERTY_OVER_SCROLL_MODE)) {
			if (Build.VERSION.SDK_INT >= 9) {
				this.scrollView.setOverScrollMode(
					TiConvert.toInt(d.get(TiC.PROPERTY_OVER_SCROLL_MODE), View.OVER_SCROLL_ALWAYS));
			}
		}

		// Set up the swipe refresh layout container which wraps the scroll view.
		TiSwipeRefreshLayout swipeRefreshLayout = new TiSwipeRefreshLayout(getProxy().getActivity()) {
			@Override
			public void setClickable(boolean value)
			{
				View view = getLayout();
				if (view != null) {
					view.setClickable(value);
				}
			}

			@Override
			public void setLongClickable(boolean value)
			{
				View view = getLayout();
				if (view != null) {
					view.setLongClickable(value);
				}
			}

			@Override
			public void setOnClickListener(View.OnClickListener listener)
			{
				View view = getLayout();
				if (view != null) {
					view.setOnClickListener(listener);
				}
			}

			@Override
			public void setOnLongClickListener(View.OnLongClickListener listener)
			{
				View view = getLayout();
				if (view != null) {
					view.setOnLongClickListener(listener);
				}
			}
		};
		swipeRefreshLayout.setSwipeRefreshEnabled(false);
		swipeRefreshLayout.addView(this.scrollView);
		if (d.containsKey(TiC.PROPERTY_REFRESH_CONTROL)) {
			Object object = d.get(TiC.PROPERTY_REFRESH_CONTROL);
			if (object instanceof RefreshControlProxy) {
				((RefreshControlProxy) object).assignTo(swipeRefreshLayout);
			}
		}
		setNativeView(swipeRefreshLayout);

		this.scrollView.setHorizontalScrollBarEnabled(showHorizontalScrollBar);
		this.scrollView.setVerticalScrollBarEnabled(showVerticalScrollBar);

		super.processProperties(d);
	}

	public TiScrollViewLayout getLayout()
	{
		View nativeView = this.scrollView;
		if (nativeView instanceof TiVerticalScrollView) {
			return ((TiVerticalScrollView) nativeView).layout;
		} else if (nativeView instanceof TiHorizontalScrollView) {
			return ((TiHorizontalScrollView) nativeView).layout;
		}
		return null;
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

	public void scrollTo(int x, int y, boolean smoothScroll)
	{
		// Fetch the scroll view.
		final View view = this.scrollView;
		if (view == null) {
			return;
		}

		// Convert the given coordinates to pixels.
		x = TiConvert.toTiDimension(x, -1).getAsPixels(view);
		y = TiConvert.toTiDimension(y, -1).getAsPixels(view);

		// Disable smooth scrolling for vertical scroll views if not at top of view.
		// Note: This works-around a bug in Google's NestedScrollView where attempting to
		//       smooth scrolls will move to a totally different position or opposite directions.
		if (smoothScroll && (view instanceof TiVerticalScrollView)) {
			if (((TiVerticalScrollView) view).getScrollY() > 0) {
				smoothScroll = false;
			}
		}

		// Scroll to the given position.
		if (smoothScroll) {
			if (view instanceof TiHorizontalScrollView) {
				((TiHorizontalScrollView) view).smoothScrollTo(x, y);
			} else if (view instanceof TiVerticalScrollView) {
				((TiVerticalScrollView) view).smoothScrollTo(x, y);
			}
		} else {
			view.scrollTo(x, y);
		}
		view.computeScroll();
	}

	public void scrollToBottom()
	{
		View view = this.scrollView;
		if (view instanceof TiHorizontalScrollView) {
			((TiHorizontalScrollView) view).fullScroll(View.FOCUS_RIGHT);
		} else if (view instanceof TiVerticalScrollView) {
			((TiVerticalScrollView) view).fullScroll(View.FOCUS_DOWN);
		}
	}

	public void scrollToTop()
	{
		View view = this.scrollView;
		if (view instanceof TiHorizontalScrollView) {
			// Scroll to the left-most side of the horizontal scroll view.
			((TiHorizontalScrollView) view).fullScroll(View.FOCUS_LEFT);
		} else if (view instanceof TiVerticalScrollView) {
			// Scroll to the top of the vertical scroll view.
			// Note: There is a bug in Google's NestedScrollView where smooth scrolling to top fails
			//       and can scroll down instead. We must work-around it by temporarily disabling it.
			TiVerticalScrollView verticalScrollView = (TiVerticalScrollView) view;
			boolean wasEnabled = verticalScrollView.isSmoothScrollingEnabled();
			verticalScrollView.setSmoothScrollingEnabled(false);
			try {
				((TiVerticalScrollView) view).fullScroll(View.FOCUS_UP);
			} finally {
				verticalScrollView.setSmoothScrollingEnabled(wasEnabled);
			}
		}
	}

	private KrollDict contentSize()
	{
		TiDimension dimensionWidth = new TiDimension(getLayout().getMeasuredWidth(), TiDimension.TYPE_WIDTH);
		TiDimension dimensionHeight = new TiDimension(getLayout().getMeasuredHeight(), TiDimension.TYPE_HEIGHT);
		double contentWidth = dimensionWidth.getAsDefault(getNativeView());
		double contentHeight = dimensionHeight.getAsDefault(getNativeView());

		KrollDict contentData = new KrollDict();
		contentData.put(TiC.PROPERTY_WIDTH, contentWidth);
		contentData.put(TiC.PROPERTY_HEIGHT, contentHeight);
		return contentData;
	}

	@Override
	public void add(TiUIView child)
	{
		View nativeView = this.nativeView;
		try {
			this.nativeView = getLayout();
			super.add(child);
		} finally {
			this.nativeView = nativeView;
		}
	}

	@Override
	public void insertAt(TiUIView child, int position)
	{
		View nativeView = this.nativeView;
		try {
			this.nativeView = getLayout();
			super.insertAt(child, position);
		} finally {
			this.nativeView = nativeView;
		}
	}

	@Override
	public void remove(TiUIView child)
	{
		View nativeView = this.nativeView;
		try {
			this.nativeView = getLayout();
			super.remove(child);
		} finally {
			this.nativeView = nativeView;
		}
	}

	@Override
	public void resort()
	{
		View v = getLayout();
		if (v instanceof TiCompositeLayout) {
			((TiCompositeLayout) v).resort();
		}
	}

	@Override
	public void registerForTouch()
	{
		if (this.scrollView != null) {
			registerForTouch(this.scrollView);
		}
	}

	@Override
	public void registerForKeyPress()
	{
		if (this.scrollView != null) {
			registerForKeyPress(this.scrollView);
		}
	}
}
