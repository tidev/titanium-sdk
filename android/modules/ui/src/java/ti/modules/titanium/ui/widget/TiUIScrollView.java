/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import androidx.core.widget.NestedScrollView;
import android.util.AttributeSet;
import android.util.Xml;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.os.SystemClock;
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

public class TiUIScrollView extends TiUIView
{
	public static final int TYPE_VERTICAL = 0;
	public static final int TYPE_HORIZONTAL = 1;

	private static final String TAG = "TiUIScrollView";
	private int scrollType = TYPE_VERTICAL;
	private boolean showVerticalScrollBar = true;
	private boolean showHorizontalScrollBar = false;

	private View scrollView;
	private FrameLayout contentWrapper;
	private TiSwipeRefreshLayout swipeRefreshLayout;
	private TiDimension offsetX = new TiDimension(0, TiDimension.TYPE_LEFT);
	private TiDimension offsetY = new TiDimension(0, TiDimension.TYPE_TOP);
	private boolean setInitialOffset = false;
	private boolean mScrollingEnabled = true;
	private boolean isScrolling = false;
	private boolean isTouching = false;

	// Scroll event throttling (~60fps)
	private static final int SCROLL_EVENT_THROTTLE_MS = 16;
	private long lastScrollEventTime = 0;
	private int cachedOffsetX = 0;
	private int cachedOffsetY = 0;
	private int cachedContentWidth = -1;
	private int cachedContentHeight = -1;
	private double cachedContentSizeWidth = 0;
	private double cachedContentSizeHeight = 0;

	// Cached contentInset TiDimension values for efficient pixel conversion
	private static final TiDimension INSET_ZERO = new TiDimension(0, TiDimension.TYPE_TOP);
	private TiDimension cachedInsetTopDim = INSET_ZERO;
	private TiDimension cachedInsetBottomDim = INSET_ZERO;
	private TiDimension cachedInsetLeftDim = INSET_ZERO;
	private TiDimension cachedInsetRightDim = INSET_ZERO;

	// Cached pixel values to avoid recomputing in applyContentInset/updateScrollViewLayoutFromPadding
	private int cachedPixelTopPad = 0;
	private int cachedPixelBottomPad = 0;
	private int cachedPixelLeftPad = 0;
	private int cachedPixelRightPad = 0;
	// Default false matches iOS UIScrollView behavior: content can extend into inset area
	private boolean cachedClipToPadding = false;

	// Cached scrollIndicatorInset values
	private TiDimension cachedScrollIndicatorTopDim = INSET_ZERO;
	private TiDimension cachedScrollIndicatorBottomDim = INSET_ZERO;
	private TiDimension cachedScrollIndicatorLeftDim = INSET_ZERO;
	private TiDimension cachedScrollIndicatorRightDim = INSET_ZERO;

	// Cached verticalScrollIndicatorInset values
	private TiDimension cachedVerticalScrollIndicatorTopDim = INSET_ZERO;
	private TiDimension cachedVerticalScrollIndicatorBottomDim = INSET_ZERO;
	private TiDimension cachedVerticalScrollIndicatorLeftDim = INSET_ZERO;
	private TiDimension cachedVerticalScrollIndicatorRightDim = INSET_ZERO;

	// Cached horizontalScrollIndicatorInset values
	private TiDimension cachedHorizontalScrollIndicatorTopDim = INSET_ZERO;
	private TiDimension cachedHorizontalScrollIndicatorBottomDim = INSET_ZERO;
	private TiDimension cachedHorizontalScrollIndicatorLeftDim = INSET_ZERO;
	private TiDimension cachedHorizontalScrollIndicatorRightDim = INSET_ZERO;

	private CustomVerticalScrollBar customVerticalScrollBar;
	private CustomHorizontalScrollBar customHorizontalScrollBar;

	private static int verticalAttrId = -1;
	private static int horizontalAttrId = -1;
	private int type;
	private TiDimension xDimension;
	private TiDimension yDimension;

	public class CustomVerticalScrollBar extends View
	{
		private static final int SCROLLBAR_WIDTH = 12;
		private Paint paint = new Paint();
		private int topInset;
		private int bottomInset;

		public CustomVerticalScrollBar(Context context, int topInset, int bottomInset)
		{
			super(context);
			this.topInset = topInset;
			this.bottomInset = bottomInset;
			setClickable(false);
			setFocusable(false);
			Log.d(TAG, "CustomVerticalScrollBar created, topInset=" + topInset + " bottomInset=" + bottomInset);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			int height = MeasureSpec.getSize(heightMeasureSpec);
			setMeasuredDimension(SCROLLBAR_WIDTH, height);
		}

		@Override
		protected void onDraw(Canvas canvas)
		{
			super.onDraw(canvas);
			int trackHeight = getHeight();
			if (trackHeight == 0) return;

			// Track: full height
			paint.setColor(0x66FF0000);
			canvas.drawRect(0, 0, SCROLLBAR_WIDTH, trackHeight, paint);

			// Thumb: only within the inset area
			int thumbArea = trackHeight - topInset - bottomInset;
			if (thumbArea <= 0) return;

			int thumbHeight = Math.max(40, thumbArea * thumbArea / (thumbArea + scrollRange));
			int thumbTop;
			if (scrollRange > 0) {
				float ratio = (float) scrollY / scrollRange;
				thumbTop = topInset + (int) (ratio * (thumbArea - thumbHeight));
			} else {
				thumbTop = topInset;
			}
			// Clamp thumb within inset bounds
			thumbTop = Math.max(topInset, Math.min(thumbTop, trackHeight - bottomInset - thumbHeight));

			paint.setColor(0xFFFF0000);
			canvas.drawRect(0, thumbTop, SCROLLBAR_WIDTH, thumbTop + thumbHeight, paint);

			String msg = "CustomVerticalScrollBar onDraw: track=" + trackHeight
				+ " thumbTop=" + thumbTop + " thumbH=" + thumbHeight
				+ " topInset=" + topInset + " bottomInset=" + bottomInset;
			Log.d(TAG, msg);
		}

		public void updateScrollPosition(int scrollY, int scrollRange, int viewportHeight)
		{
			this.scrollY = scrollY;
			this.scrollRange = scrollRange;
			String msg2 = "CustomVerticalScrollBar update: scrollY=" + scrollY
				+ " scrollRange=" + scrollRange + " viewport=" + viewportHeight;
			Log.d(TAG, msg2);

			if (scrollRange > 0) {
				setVisibility(View.VISIBLE);
				requestLayout();
				postInvalidate();
			} else {
				setVisibility(View.GONE);
			}
		}

		private int scrollY = 0;
		private int scrollRange = 0;
	}

	public class CustomHorizontalScrollBar extends View
	{
		private static final int SCROLLBAR_HEIGHT = 12;
		private Paint paint = new Paint();
		private int leftInset;
		private int rightInset;

		public CustomHorizontalScrollBar(Context context, int leftInset, int rightInset)
		{
			super(context);
			this.leftInset = leftInset;
			this.rightInset = rightInset;
			setClickable(false);
			setFocusable(false);
			Log.d(TAG, "CustomHorizontalScrollBar created, leftInset=" + leftInset + " rightInset=" + rightInset);
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			int width = MeasureSpec.getSize(widthMeasureSpec);
			setMeasuredDimension(width, SCROLLBAR_HEIGHT);
		}

		@Override
		protected void onDraw(Canvas canvas)
		{
			super.onDraw(canvas);
			int trackWidth = getWidth();
			if (trackWidth == 0) return;

			// Draw track (red, semi-transparent) full width
			paint.setColor(0x66FF0000);
			canvas.drawRect(0, 0, trackWidth, SCROLLBAR_HEIGHT, paint);

			// Thumb: only within left/right inset area
			int thumbArea = trackWidth - leftInset - rightInset;
			if (thumbArea <= 0) return;

			int thumbWidth = Math.max(40, thumbArea * thumbArea / (thumbArea + scrollRange));
			int thumbLeft;
			if (scrollRange > 0) {
				float ratio = (float) scrollX / scrollRange;
				thumbLeft = leftInset + (int) (ratio * (thumbArea - thumbWidth));
			} else {
				thumbLeft = leftInset;
			}
			// Clamp thumb within inset bounds
			thumbLeft = Math.max(leftInset, Math.min(thumbLeft, trackWidth - rightInset - thumbWidth));

			paint.setColor(0xFFFF0000);
			canvas.drawRect(thumbLeft, 0, thumbLeft + thumbWidth, SCROLLBAR_HEIGHT, paint);

			String msg = "CustomHorizontalScrollBar onDraw: track=" + trackWidth
				+ " thumbLeft=" + thumbLeft + " thumbW=" + thumbWidth
				+ " leftInset=" + leftInset + " rightInset=" + rightInset;
			Log.d(TAG, msg);
		}

		public void updateScrollPosition(int scrollX, int scrollRange, int viewportWidth)
		{
			this.scrollX = scrollX;
			this.scrollRange = scrollRange;
			Log.d(TAG, "CustomHorizontalScrollBar update: scrollX=" + scrollX
				+ " scrollRange=" + scrollRange + " viewport=" + viewportWidth);

			if (scrollRange > 0) {
				setVisibility(View.VISIBLE);
				requestLayout();
				postInvalidate();
			} else {
				setVisibility(View.GONE);
			}
		}

		private int scrollX = 0;
		private int scrollRange = 0;
	}

	public class TiScrollViewLayout extends TiCompositeLayout
	{
		private static final int AUTO = Integer.MAX_VALUE;
		private int parentContentWidth = 0;
		private int parentContentHeight = 0;
		private boolean canCancelEvents = true;
		private GestureDetector gestureDetector;
		private boolean wasMeasured;

		// Cached content property values to avoid repeated proxy lookups per measure pass
		private int cachedContentWidthValue = AUTO;
		private int cachedContentHeightValue = AUTO;
		private boolean contentWidthCached = false;
		private boolean contentHeightCached = false;

		public TiScrollViewLayout(Context context, LayoutArrangement arrangement)
		{
			super(context, arrangement, proxy);
			gestureDetector = new GestureDetector(context, new GestureDetector.SimpleOnGestureListener() {
				@Override
				public void onLongPress(MotionEvent e)
				{
					if (proxy != null && proxy.hierarchyHasListener(TiC.EVENT_LONGPRESS)) {
						fireEvent(TiC.EVENT_LONGPRESS, dictFromEvent(e));
					}
				}
				@Override
				public boolean onSingleTapConfirmed(MotionEvent e)
				{
					if (proxy != null && proxy.hierarchyHasListener(TiC.EVENT_SINGLE_TAP)) {
						fireEvent(TiC.EVENT_SINGLE_TAP, dictFromEvent(e));
					}
					return true;
				}
				@Override
				public boolean onDoubleTap(MotionEvent e)
				{
					if (proxy != null && proxy.hierarchyHasListener(TiC.EVENT_DOUBLE_TAP)) {
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
		 * Note that this value is not assigned automatically. The owner must assign it.
		 * @return Returns the parent view's width, excluding its left/right padding.
		 */
		public int getParentContentWidth()
		{
			return this.parentContentWidth;
		}

		/**
		 * Sets the height of this view's parent, excluding its top/bottom padding.
		 * @param height The parent view's height, excluding padding.
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
		 * Note that this value is not assigned automatically. The owner must assign it.
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
			// Return cached value if available
			if (TiC.PROPERTY_CONTENT_WIDTH.equals(property) && contentWidthCached) {
				return cachedContentWidthValue;
			}
			if (TiC.PROPERTY_CONTENT_HEIGHT.equals(property) && contentHeightCached) {
				return cachedContentHeightValue;
			}

			int result = AUTO;
			Object value = getProxy().getProperty(property);
			if (value != null) {
				if (value.equals(TiC.SIZE_AUTO) || value.equals(TiC.LAYOUT_SIZE)) {
					result = AUTO;
				} else if (value.equals(TiC.LAYOUT_FILL)) {
					if (TiC.PROPERTY_CONTENT_HEIGHT.equals(property)) {
						result = this.parentContentHeight;
					} else if (TiC.PROPERTY_CONTENT_WIDTH.equals(property)) {
						result = this.parentContentWidth;
					}
				} else if (value instanceof Number) {
					result = ((Number) value).intValue();
				} else {
					int type = 0;
					TiDimension dimension;
					if (TiC.PROPERTY_CONTENT_HEIGHT.equals(property)) {
						type = TiDimension.TYPE_HEIGHT;
					} else if (TiC.PROPERTY_CONTENT_WIDTH.equals(property)) {
						type = TiDimension.TYPE_WIDTH;
					}
					dimension = new TiDimension(value.toString(), type);
					result = dimension.getUnits() == TiDimension.COMPLEX_UNIT_AUTO ? AUTO : dimension.getIntValue();
				}
			}

			// Cache the result
			if (TiC.PROPERTY_CONTENT_WIDTH.equals(property)) {
				cachedContentWidthValue = result;
				contentWidthCached = true;
			} else if (TiC.PROPERTY_CONTENT_HEIGHT.equals(property)) {
				cachedContentHeightValue = result;
				contentHeightCached = true;
			}

			return result;
		}

		public void invalidateContentPropertyCache()
		{
			contentWidthCached = false;
			contentHeightCached = false;
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
				// If we don't have a specific contentWidth and the scroll type is 'vertical'
				// match the layout's width to the ScrollView's width to avoid messing up
				// children's positions to the visible part of the component.
				if (type == TYPE_VERTICAL && maxWidth > this.parentContentWidth) {
					contentWidth = this.parentContentWidth;
				} else {
					contentWidth = maxWidth; // measuredWidth;
				}
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
				// If we don't have a specific contentHeight and the scroll type is 'horizontal'
				// match the layout's width to the ScrollView's width to avoid messing up
				// children's positions to the visible part of the component.
				if (type == TYPE_HORIZONTAL && maxHeight > this.parentContentHeight) {
					contentHeight = this.parentContentHeight;
				} else {
					contentHeight = maxHeight; // measuredHeight;
				}
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

			// Invalidate content property cache for this measure pass
			invalidateContentPropertyCache();

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
		if (context == null || context.getResources() == null) {
			return null;
		}
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
			xDimension = new TiDimension((double) event.getX(), TiDimension.TYPE_LEFT);
			yDimension = new TiDimension((double) event.getY(), TiDimension.TYPE_TOP);

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

				data.put(TiC.EVENT_PROPERTY_X, xDimension.getAsDefault(scrollView));
				data.put(TiC.EVENT_PROPERTY_Y, yDimension.getAsDefault(scrollView));
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

		@Override
		protected void onLayout(boolean changed, int l, int t, int r, int b)
		{
			super.onLayout(changed, l, t, r, b);
			// Set initial content offset in onLayout instead of onDraw for earlier pipeline application.
			// This avoids a visible jump from (0,0) to the offset position on first draw.
			if (!setInitialOffset) {
				scrollTo(offsetX.getAsPixels(scrollView), offsetY.getAsPixels(scrollView));
				setInitialOffset = true;
			}
		}

		public void onDraw(Canvas canvas)
		{
			super.onDraw(canvas);
		}

		@Override
		protected void onScrollChanged(int l, int t, int oldl, int oldt)
		{
			super.onScrollChanged(l, t, oldl, oldt);

			// Always fire dragstart immediately - must not be throttled,
			// otherwise the matching dragend (gated on isScrolling) is also lost.
			if (!isScrolling && isTouching) {
				isScrolling = true;
				KrollDict data = new KrollDict();
				data.put(TiC.EVENT_PROPERTY_X, xDimension.getAsDefault(scrollView));
				data.put(TiC.EVENT_PROPERTY_Y, yDimension.getAsDefault(scrollView));
				getProxy().fireEvent(TiC.EVENT_DRAGSTART, data);
			}

			// Throttle scroll events to ~60fps
			long currentTime = SystemClock.elapsedRealtime();
			if ((currentTime - lastScrollEventTime) < SCROLL_EVENT_THROTTLE_MS) {
				return;
			}
			lastScrollEventTime = currentTime;

			setContentOffset(l, t);
			// Update custom vertical scrollbar position
			if (customVerticalScrollBar != null) {
				int scrollRange = getChildAt(0).getMeasuredHeight() - getMeasuredHeight();
				customVerticalScrollBar.updateScrollPosition(t, scrollRange, getMeasuredHeight());
			}

			KrollDict data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_X, offsetX.getAsDefault(scrollView));
			data.put(TiC.EVENT_PROPERTY_Y, offsetY.getAsDefault(scrollView));
			data.put(TiC.PROPERTY_CONTENT_SIZE, contentSize());

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

	private class TiHorizontalScrollView extends HorizontalScrollView
	{
		private TiScrollViewLayout layout;

		public TiHorizontalScrollView(Context context, LayoutArrangement arrangement)
		{
			super(context, getAttributeSet(context, horizontalAttrId));
			setScrollBarStyle(SCROLLBARS_INSIDE_OVERLAY);
			setScrollContainer(true);
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
			xDimension = new TiDimension((double) event.getX(), TiDimension.TYPE_LEFT);
			yDimension = new TiDimension((double) event.getY(), TiDimension.TYPE_TOP);

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
				data.put(TiC.EVENT_PROPERTY_X, xDimension.getAsDefault(scrollView));
				data.put(TiC.EVENT_PROPERTY_Y, yDimension.getAsDefault(scrollView));
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

		@Override
		protected void onLayout(boolean changed, int l, int t, int r, int b)
		{
			super.onLayout(changed, l, t, r, b);
			// Set initial content offset in onLayout instead of onDraw for earlier pipeline application.
			if (!setInitialOffset) {
				scrollTo(offsetX.getAsPixels(scrollView), offsetY.getAsPixels(scrollView));
				setInitialOffset = true;
			}
		}

		public void onDraw(Canvas canvas)
		{
			super.onDraw(canvas);
		}

		@Override
		protected void onScrollChanged(int l, int t, int oldl, int oldt)
		{
			super.onScrollChanged(l, t, oldl, oldt);

			// Always fire dragstart immediately - must not be throttled,
			// otherwise the matching dragend (gated on isScrolling) is also lost.
			if (!isScrolling && isTouching) {
				isScrolling = true;
				KrollDict data = new KrollDict();
				data.put(TiC.EVENT_PROPERTY_X, xDimension.getAsDefault(scrollView));
				data.put(TiC.EVENT_PROPERTY_Y, yDimension.getAsDefault(scrollView));
				getProxy().fireEvent(TiC.EVENT_DRAGSTART, data);
			}

			// Throttle scroll events to ~60fps
			long currentTime = SystemClock.elapsedRealtime();
			if ((currentTime - lastScrollEventTime) < SCROLL_EVENT_THROTTLE_MS) {
				return;
			}
			lastScrollEventTime = currentTime;

			setContentOffset(l, t);
			// Update custom horizontal scrollbar position
			if (customHorizontalScrollBar != null) {
				int scrollRange = getChildAt(0).getMeasuredWidth() - getMeasuredWidth();
				customHorizontalScrollBar.updateScrollPosition(l, scrollRange, getMeasuredWidth());
			}

			KrollDict data = new KrollDict();
			data.put(TiC.EVENT_PROPERTY_X, xDimension.getAsDefault(scrollView));
			data.put(TiC.EVENT_PROPERTY_Y, offsetY.getAsDefault(scrollView));
			data.put(TiC.PROPERTY_CONTENT_SIZE, contentSize());

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

	/**
	 * Set content offset from pixels.
	 *
	 * @param x x-offset in pixels.
	 * @param y y-offset in pixels.
	 */
	public void setContentOffset(int x, int y)
	{
		KrollDict offset = new KrollDict();
		offsetX = new TiDimension(x, TiDimension.TYPE_LEFT);
		offsetY = new TiDimension(y, TiDimension.TYPE_TOP);
		offset.put(TiC.EVENT_PROPERTY_X, offsetX.getAsDefault(scrollView));
		offset.put(TiC.EVENT_PROPERTY_Y, offsetY.getAsDefault(scrollView));
		getProxy().setProperty(TiC.PROPERTY_CONTENT_OFFSET, offset);
	}

	/**
	 * Set content offset from dictionary.
	 *
	 * @param hashMap Dictionary containing x and y offsets.
	 */
	public void setContentOffset(Object hashMap)
	{
		if (hashMap instanceof HashMap) {
			KrollDict contentOffset = new KrollDict((HashMap) hashMap);

			if (contentOffset.containsKeyAndNotNull(TiC.PROPERTY_X)) {
				offsetX = TiConvert.toTiDimension(contentOffset, TiC.PROPERTY_X, TiDimension.TYPE_LEFT);
			}
			if (contentOffset.containsKeyAndNotNull(TiC.PROPERTY_Y)) {
				offsetY = TiConvert.toTiDimension(contentOffset, TiC.PROPERTY_Y, TiDimension.TYPE_TOP);
			}
		} else {
			Log.e(TAG, "ContentOffset must be an instance of HashMap");
		}
	}

	/**
	 * Applies the cached contentInset values to extend the scrollable area.
	 *
	 * On Android, we match iOS UIScrollView.contentInset behavior:
	 * - Content can extend into inset areas (clipToPadding=false by default)
	 * - Background becomes visible in the inset areas when scrolled to edges
	 */
	private void applyContentInset()
	{
		if (this.scrollView != null) {
			// clipToPadding controls whether children draw into the padding area.
			// false matches iOS UIScrollView where content can extend into insets.
			((android.view.ViewGroup) this.scrollView).setClipToPadding(cachedClipToPadding);

			// Early return: no insets to apply. Avoids unnecessary pixel computation,
			// setPadding call (which triggers requestLayout()), and cache invalidation.
			if (cachedInsetTopDim.getIntValue() == 0
				&& cachedInsetBottomDim.getIntValue() == 0
				&& cachedInsetLeftDim.getIntValue() == 0
				&& cachedInsetRightDim.getIntValue() == 0) {
				return;
			}

			// Compute pixel values once and cache for reuse in updateScrollViewLayoutFromPadding()
			cachedPixelTopPad = (int) cachedInsetTopDim.getAsPixels(this.scrollView);
			cachedPixelBottomPad = (int) cachedInsetBottomDim.getAsPixels(this.scrollView);
			cachedPixelLeftPad = (int) cachedInsetLeftDim.getAsPixels(this.scrollView);
			cachedPixelRightPad = (int) cachedInsetRightDim.getAsPixels(this.scrollView);

			// Set padding for ALL sides including top/bottom.
			// iOS UIScrollView.contentInset does NOT change the frame size,
			// only the scrollable content area via padding.
			this.scrollView.setPadding(
				cachedPixelLeftPad, cachedPixelTopPad,
				cachedPixelRightPad, cachedPixelBottomPad);

			// Invalidate content property cache so scrollable area is recalculated
			TiScrollViewLayout layout = getLayout();
			if (layout != null) {
				layout.invalidateContentPropertyCache();
			}

		}
	}

	/**
	 * Sets contentInset from a dictionary with 'top', 'bottom', 'left', 'right' keys.
	 */
	public void setContentInset(Object value)
	{
		if (value == null) {
			// Reset all insets to zero when set to null
			cachedInsetTopDim = INSET_ZERO;
			cachedInsetBottomDim = INSET_ZERO;
			cachedInsetLeftDim = INSET_ZERO;
			cachedInsetRightDim = INSET_ZERO;
			applyContentInset();
			updateScrollViewLayoutFromPadding();
		} else if (value instanceof HashMap) {
			HashMap dict = (HashMap) value;

			// Reset all insets to zero first, then override with any present keys.
			// This matches iOS behavior where an empty {} resets all insets.
			cachedInsetTopDim = INSET_ZERO;
			cachedInsetBottomDim = INSET_ZERO;
			cachedInsetLeftDim = INSET_ZERO;
			cachedInsetRightDim = INSET_ZERO;

			// top
			if (dict.containsKey("top") && dict.get("top") != null) {
				cachedInsetTopDim = TiConvert.toTiDimension(dict.get("top"), TiDimension.TYPE_TOP);
			}

			// bottom
			if (dict.containsKey("bottom") && dict.get("bottom") != null) {
				cachedInsetBottomDim = TiConvert.toTiDimension(dict.get("bottom"), TiDimension.TYPE_BOTTOM);
			}

			// left
			if (dict.containsKey("left") && dict.get("left") != null) {
				cachedInsetLeftDim = TiConvert.toTiDimension(dict.get("left"), TiDimension.TYPE_LEFT);
			}

			// right
			if (dict.containsKey("right") && dict.get("right") != null) {
				cachedInsetRightDim = TiConvert.toTiDimension(dict.get("right"), TiDimension.TYPE_RIGHT);
			}

			applyContentInset();
			updateScrollViewLayoutFromPadding();
		} else {
			Log.w(TAG, "contentInset must be a dictionary with 'top', 'bottom', 'left', 'right' keys or null.");
		}
	}

	/**
	 * Updates the parent content width/height based on the current padding insets.
	 */
	private void updateScrollViewLayoutFromPadding()
	{
		View nativeView = this.scrollView;
		if (nativeView == null) {
			return;
		}

		TiScrollViewLayout layout = getLayout();
		if (layout != null) {
			int measuredWidth = nativeView.getMeasuredWidth();
			int measuredHeight = nativeView.getMeasuredHeight();

			// Reduce parent dimensions by the cached padding insets
			int leftRightPadding = cachedPixelLeftPad + cachedPixelRightPad;
			int topBottomPadding = cachedPixelTopPad + cachedPixelBottomPad;

			layout.setParentContentWidth(Math.max(0, measuredWidth - leftRightPadding));
			layout.setParentContentHeight(Math.max(0, measuredHeight - topBottomPadding));

			// NOTE: requestLayout() is intentionally NOT called here.
			// applyContentInset() already triggered it via setPadding(), which propagates
			// through the view hierarchy. An additional requestLayout() would cause a
			// redundant second layout pass for the same change.
		}
	}

	/**
	 * Sets scroll indicator insets with custom scrollbar views.
	 *
	 * @param value Dictionary with top/left/bottom/right keys
	 */
	public void setScrollIndicatorInsets(Object value)
	{
		if (scrollView == null) {
			return;
		}

		float topDp = 0, leftDp = 0, rightDp = 0, bottomDp = 0;

		if (value instanceof HashMap) {
			HashMap dict = (HashMap) value;
			if (dict.containsKey("top")) {
				topDp = TiConvert.toFloat(dict.get("top"), 0);
			}
			if (dict.containsKey("left")) {
				leftDp = TiConvert.toFloat(dict.get("left"), 0);
			}
			if (dict.containsKey("right")) {
				rightDp = TiConvert.toFloat(dict.get("right"), 0);
			}
			if (dict.containsKey("bottom")) {
				bottomDp = TiConvert.toFloat(dict.get("bottom"), 0);
			}
		}

		// Convert dp to pixels
		float density = scrollView.getContext().getResources().getDisplayMetrics().density;
		int topPx = Math.round(topDp * density);
		int leftPx = Math.round(leftDp * density);
		int rightPx = Math.round(rightDp * density);
		int bottomPx = Math.round(bottomDp * density);

		cachedScrollIndicatorTopDim = new TiDimension(topPx, TiDimension.TYPE_TOP);
		cachedScrollIndicatorBottomDim = new TiDimension(bottomPx, TiDimension.TYPE_BOTTOM);
		cachedScrollIndicatorLeftDim = new TiDimension(leftPx, TiDimension.TYPE_LEFT);
		cachedScrollIndicatorRightDim = new TiDimension(rightPx, TiDimension.TYPE_RIGHT);

		updateCustomScrollBars();
	}

	/**
	 * Sets vertical scroll indicator insets.
	 */
	public void setVerticalScrollIndicatorInsets(Object value)
	{
		if (scrollView == null) {
			return;
		}

		float topDp = 0, leftDp = 0, rightDp = 0, bottomDp = 0;

		if (value instanceof HashMap) {
			HashMap dict = (HashMap) value;
			if (dict.containsKey("top")) {
				topDp = TiConvert.toFloat(dict.get("top"), 0);
			}
			if (dict.containsKey("left")) {
				leftDp = TiConvert.toFloat(dict.get("left"), 0);
			}
			if (dict.containsKey("right")) {
				rightDp = TiConvert.toFloat(dict.get("right"), 0);
			}
			if (dict.containsKey("bottom")) {
				bottomDp = TiConvert.toFloat(dict.get("bottom"), 0);
			}
		}

		// Convert dp to pixels
		float density = scrollView.getContext().getResources().getDisplayMetrics().density;
		cachedVerticalScrollIndicatorTopDim = new TiDimension(
			Math.round(topDp * density), TiDimension.TYPE_TOP);
		cachedVerticalScrollIndicatorBottomDim = new TiDimension(
			Math.round(bottomDp * density), TiDimension.TYPE_BOTTOM);
		cachedVerticalScrollIndicatorLeftDim = new TiDimension(
			Math.round(leftDp * density), TiDimension.TYPE_LEFT);
		cachedVerticalScrollIndicatorRightDim = new TiDimension(
			Math.round(rightDp * density), TiDimension.TYPE_RIGHT);

		updateCustomScrollBars();
	}

	/**
	 * Sets horizontal scroll indicator insets.
	 */
	public void setHorizontalScrollIndicatorInsets(Object value)
	{
		if (scrollView == null) {
			return;
		}

		float topDp = 0, leftDp = 0, rightDp = 0, bottomDp = 0;

		if (value instanceof HashMap) {
			HashMap dict = (HashMap) value;
			if (dict.containsKey("top")) {
				topDp = TiConvert.toFloat(dict.get("top"), 0);
			}
			if (dict.containsKey("left")) {
				leftDp = TiConvert.toFloat(dict.get("left"), 0);
			}
			if (dict.containsKey("right")) {
				rightDp = TiConvert.toFloat(dict.get("right"), 0);
			}
			if (dict.containsKey("bottom")) {
				bottomDp = TiConvert.toFloat(dict.get("bottom"), 0);
			}
		}

		// Convert dp to pixels
		float density = scrollView.getContext().getResources().getDisplayMetrics().density;
		cachedHorizontalScrollIndicatorTopDim = new TiDimension(
			Math.round(topDp * density), TiDimension.TYPE_TOP);
		cachedHorizontalScrollIndicatorBottomDim = new TiDimension(
			Math.round(bottomDp * density), TiDimension.TYPE_BOTTOM);
		cachedHorizontalScrollIndicatorLeftDim = new TiDimension(
			Math.round(leftDp * density), TiDimension.TYPE_LEFT);
		cachedHorizontalScrollIndicatorRightDim = new TiDimension(
			Math.round(rightDp * density), TiDimension.TYPE_RIGHT);

		updateCustomScrollBars();
	}

	/**
	 * Gets scroll indicator insets.
	 *
	 * @return HashMap with top/left/bottom/right values
	 */
	public HashMap getScrollIndicatorInsets()
	{
		HashMap insets = new HashMap();
		insets.put("top", cachedScrollIndicatorTopDim.getIntValue());
		insets.put("left", cachedScrollIndicatorLeftDim.getIntValue());
		insets.put("right", cachedScrollIndicatorRightDim.getIntValue());
		insets.put("bottom", cachedScrollIndicatorBottomDim.getIntValue());
		return insets;
	}

	/**
	 * Ensures a FrameLayout wrapper exists around scrollView.
	 * NestedScrollView/HorizontalScrollView only allow one child,
	 * so we need a wrapper to host the custom scrollbar views.
	 * Uses post() to defer until the view is attached to the Android hierarchy.
	 */
	private void ensureContentWrapper()
	{
		if (contentWrapper != null) {
			return;
		}

		// If scrollView is already attached, create the wrapper immediately
		if (scrollView.getParent() instanceof ViewGroup) {
			contentWrapper = new FrameLayout(scrollView.getContext());
			contentWrapper.setLayoutParams(new FrameLayout.LayoutParams(
				ViewGroup.LayoutParams.MATCH_PARENT,
				ViewGroup.LayoutParams.MATCH_PARENT
			));
			contentWrapper.setClipChildren(false);
			contentWrapper.setClipToPadding(false);

			ViewGroup oldParent = (ViewGroup) scrollView.getParent();
			int index = oldParent.indexOfChild(scrollView);
			oldParent.removeViewAt(index);
			contentWrapper.addView(scrollView, 0);
			// Use TiCompositeLayout.LayoutParams for TiCompositeLayout parent
			if (oldParent instanceof TiCompositeLayout) {
				TiCompositeLayout.LayoutParams lp = new TiCompositeLayout.LayoutParams();
				lp.width = ViewGroup.LayoutParams.MATCH_PARENT;
				lp.height = ViewGroup.LayoutParams.MATCH_PARENT;
				oldParent.addView(contentWrapper, index, lp);
			} else {
				oldParent.addView(contentWrapper, index,
					new ViewGroup.LayoutParams(
						ViewGroup.LayoutParams.MATCH_PARENT,
						ViewGroup.LayoutParams.MATCH_PARENT
					));
			}
			setNativeView(contentWrapper);
		} else {
			// Not yet attached — defer wrapper creation until the view is ready
			scrollView.post(new Runnable() {
				@Override
				public void run()
				{
					if (contentWrapper != null || scrollView == null) {
						return;
					}
					contentWrapper = new FrameLayout(scrollView.getContext());
					contentWrapper.setLayoutParams(new FrameLayout.LayoutParams(
						ViewGroup.LayoutParams.MATCH_PARENT,
						ViewGroup.LayoutParams.MATCH_PARENT
					));
					contentWrapper.setClipChildren(false);
					contentWrapper.setClipToPadding(false);

					ViewGroup oldParent = (ViewGroup) scrollView.getParent();
					int index = oldParent.indexOfChild(scrollView);
					oldParent.removeViewAt(index);
					contentWrapper.addView(scrollView, 0);
					// Use TiCompositeLayout.LayoutParams for TiCompositeLayout parent
					if (oldParent instanceof TiCompositeLayout) {
						TiCompositeLayout.LayoutParams lp = new TiCompositeLayout.LayoutParams();
						lp.width = ViewGroup.LayoutParams.MATCH_PARENT;
						lp.height = ViewGroup.LayoutParams.MATCH_PARENT;
						oldParent.addView(contentWrapper, index, lp);
					} else {
						oldParent.addView(contentWrapper, index,
							new ViewGroup.LayoutParams(
								ViewGroup.LayoutParams.MATCH_PARENT,
								ViewGroup.LayoutParams.MATCH_PARENT
							));
					}
					setNativeView(contentWrapper);

					// Now create the custom scrollbars
					if (showVerticalScrollBar && cachedScrollIndicatorRightDim.getIntValue() > 0) {
						createVerticalScrollBar();
					}
					if (showHorizontalScrollBar && cachedScrollIndicatorBottomDim.getIntValue() > 0) {
						createHorizontalScrollBar();
					}
				}
			});
		}
	}

	/**
	 * Updates custom scrollbar views based on scrollIndicatorInsets.
	 * Hides native scrollbars and positions custom views instead.
	 */
	private void updateCustomScrollBars()
	{
		if (scrollView == null) {
			return;
		}

		// Hide native scrollbars
		scrollView.setHorizontalScrollBarEnabled(false);
		scrollView.setVerticalScrollBarEnabled(false);

		// Remove existing custom scrollbars
		if (customVerticalScrollBar != null && customVerticalScrollBar.getParent() != null) {
			((ViewGroup) customVerticalScrollBar.getParent()).removeView(customVerticalScrollBar);
		}
		if (customHorizontalScrollBar != null && customHorizontalScrollBar.getParent() != null) {
			((ViewGroup) customHorizontalScrollBar.getParent()).removeView(customHorizontalScrollBar);
		}

		// Ensure wrapper exists (lazy if not attached yet)
		ensureContentWrapper();

		// If wrapper is already attached, create scrollbars immediately
		if (contentWrapper != null) {
			int totalRightInset = cachedScrollIndicatorRightDim.getIntValue();
			int totalBottomInset = cachedScrollIndicatorBottomDim.getIntValue();

			if (showVerticalScrollBar && totalRightInset > 0) {
				createVerticalScrollBar();
			}
			if (showHorizontalScrollBar && totalBottomInset > 0) {
				createHorizontalScrollBar();
			}
		}
		// Otherwise the scrollbars are created in the post() callback above
	}

	/**
	 * Creates a custom vertical scrollbar view.
	 */
	private void createVerticalScrollBar()
	{
		if (scrollView == null || scrollView.getContext() == null || contentWrapper == null) {
			return;
		}

		int topInset = cachedVerticalScrollIndicatorTopDim.getIntValue();
		int bottomInset = cachedVerticalScrollIndicatorBottomDim.getIntValue();
		int leftInset = cachedVerticalScrollIndicatorLeftDim.getIntValue();
		int rightInset = cachedVerticalScrollIndicatorRightDim.getIntValue();

		customVerticalScrollBar = new CustomVerticalScrollBar(scrollView.getContext(), topInset, bottomInset);

		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
			ViewGroup.LayoutParams.WRAP_CONTENT,
			ViewGroup.LayoutParams.MATCH_PARENT
		);
		params.gravity = android.view.Gravity.RIGHT | android.view.Gravity.BOTTOM;
		params.leftMargin = leftInset;
		params.rightMargin = rightInset;

		contentWrapper.addView(customVerticalScrollBar, params);
		customVerticalScrollBar.bringToFront();
	}

	/**
	 * Creates a custom horizontal scrollbar view.
	 */
	private void createHorizontalScrollBar()
	{
		if (scrollView == null || scrollView.getContext() == null || contentWrapper == null) {
			return;
		}

		int leftInset = cachedHorizontalScrollIndicatorLeftDim.getIntValue();
		int rightInset = cachedHorizontalScrollIndicatorRightDim.getIntValue();
		int topInset = cachedHorizontalScrollIndicatorTopDim.getIntValue();
		int bottomInset = cachedHorizontalScrollIndicatorBottomDim.getIntValue();

		customHorizontalScrollBar = new CustomHorizontalScrollBar(scrollView.getContext(), leftInset, rightInset);

		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
			ViewGroup.LayoutParams.MATCH_PARENT,
			ViewGroup.LayoutParams.WRAP_CONTENT
		);
		params.gravity = android.view.Gravity.BOTTOM;
		params.topMargin = topInset;
		params.bottomMargin = bottomInset;

		contentWrapper.addView(customHorizontalScrollBar, params);
		customHorizontalScrollBar.bringToFront();
	}

	public HashMap getContentInsets()
	{
		HashMap insets = new HashMap();
		insets.put("top", cachedInsetTopDim.getIntValue());
		insets.put("left", cachedInsetLeftDim.getIntValue());
		insets.put("right", cachedInsetRightDim.getIntValue());
		insets.put("bottom", cachedInsetBottomDim.getIntValue());
		return insets;
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.w(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}

		if (key.equals(TiC.PROPERTY_CONTENT_WIDTH) || key.equals(TiC.PROPERTY_CONTENT_HEIGHT)) {
			// Invalidate content property cache when these properties change
			TiScrollViewLayout layout = getLayout();
			if (layout != null) {
				layout.invalidateContentPropertyCache();
			}
		} else if (key.equals(TiC.PROPERTY_CONTENT_OFFSET)) {
			setContentOffset(newValue);
			scrollTo((int) offsetX.getAsDefault(scrollView), (int) offsetY.getAsDefault(scrollView), false);
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
			if (this.swipeRefreshLayout != null) {
				if (newValue == null) {
					RefreshControlProxy.unassignFrom(this.swipeRefreshLayout);
				} else if (newValue instanceof RefreshControlProxy) {
					((RefreshControlProxy) newValue).assignTo(this.swipeRefreshLayout);
				} else {
					Log.e(TAG, "Invalid value assigned to property '" + key + "'. Must be of type 'RefreshControl'.");
				}
			} else if (newValue instanceof RefreshControlProxy) {
				// Lazily create SwipeRefreshLayout wrapper when refreshControl is set dynamically
				this.swipeRefreshLayout = createSwipeRefreshLayout();
				this.swipeRefreshLayout.setSwipeRefreshEnabled(false);
				this.swipeRefreshLayout.addView(this.scrollView);
				((RefreshControlProxy) newValue).assignTo(this.swipeRefreshLayout);
				setNativeView(this.swipeRefreshLayout);
			} else {
				Log.e(TAG, "Invalid value assigned to property '" + key + "'. Must be of type 'RefreshControl'.");
			}
		} else if (TiC.PROPERTY_OVER_SCROLL_MODE.equals(key)) {
			if (this.scrollView != null) {
				this.scrollView.setOverScrollMode(TiConvert.toInt(newValue, View.OVER_SCROLL_ALWAYS));
			}
		} else if (key.equals(TiC.PROPERTY_CONTENT_INSETS)) {
			setContentInset(newValue);
		} else if (key.equals(TiC.PROPERTY_SCROLL_INDICATOR_INSETS)) {
			setScrollIndicatorInsets(newValue);
		} else if (key.equals(TiC.PROPERTY_VERTICAL_SCROLL_INDICATOR_INSETS)) {
			setVerticalScrollIndicatorInsets(newValue);
		} else if (key.equals(TiC.PROPERTY_HORIZONTAL_SCROLL_INDICATOR_INSETS)) {
			setHorizontalScrollIndicatorInsets(newValue);
		} else if (key.equals(TiC.PROPERTY_CLIP_TO_PADDING)) {
			if (this.scrollView != null) {
				boolean newClipToPadding = TiConvert.toBoolean(newValue, cachedClipToPadding);
				cachedClipToPadding = newClipToPadding;
				((android.view.ViewGroup) this.scrollView).setClipToPadding(newClipToPadding);
			}
		} else if (key.equals(TiC.PROPERTY_CLIP_CHILDREN)) {
			if (this.scrollView != null) {
				((android.view.ViewGroup) this.scrollView).setClipChildren(
					TiConvert.toBoolean(newValue, true)
				);
			}
		}

		super.propertyChanged(key, oldValue, newValue, proxy);
	}

	/**
	 * Creates a TiSwipeRefreshLayout wrapper with overridden click/long-click delegation
	 * to the scroll view layout, matching the existing behavior.
	 */
	private TiSwipeRefreshLayout createSwipeRefreshLayout()
	{
		return new TiSwipeRefreshLayout(getProxy().getActivity()) {
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
	}

	@Override
	public void processProperties(KrollDict d)
	{
		boolean showHorizontalScrollBar = (scrollType == TYPE_HORIZONTAL);
		boolean showVerticalScrollBar = (scrollType == TYPE_VERTICAL);

		if (d.containsKey(TiC.PROPERTY_SCROLLING_ENABLED)) {
			setScrollingEnabled(d.get(TiC.PROPERTY_SCROLLING_ENABLED));
		}

		if (d.containsKey(TiC.PROPERTY_SHOW_HORIZONTAL_SCROLL_INDICATOR)) {
			showHorizontalScrollBar = TiConvert.toBoolean(d, TiC.PROPERTY_SHOW_HORIZONTAL_SCROLL_INDICATOR);
		}
		if (d.containsKey(TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR)) {
			showVerticalScrollBar = TiConvert.toBoolean(d, TiC.PROPERTY_SHOW_VERTICAL_SCROLL_INDICATOR);
		}

		this.showVerticalScrollBar = showVerticalScrollBar;
		this.showHorizontalScrollBar = showHorizontalScrollBar;

		if (d.containsKey(TiC.PROPERTY_CONTENT_OFFSET)) {
			Object offset = d.get(TiC.PROPERTY_CONTENT_OFFSET);
			setContentOffset(offset);
		}

		type = TYPE_VERTICAL;
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

		// Android only property
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
			String warningMessage
				= "Scroll direction could not be determined based on the provided view properties. "
				+ "Default VERTICAL scroll direction being used. Use the 'scrollType' property to explicitly "
				+ "set the scrolling direction.";
			Log.w(TAG, warningMessage);
		}

		this.scrollType = type;

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
				Log.w(TAG, "creating horizontal scroll view", Log.DEBUG_MODE);
				this.scrollView = new TiHorizontalScrollView(getProxy().getActivity(), arrangement);
				scrollViewLayout = ((TiHorizontalScrollView) this.scrollView).getLayout();
				break;
			case TYPE_VERTICAL:
			default:
				Log.w(TAG, "creating vertical scroll view", Log.DEBUG_MODE);
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
			this.scrollView.setOverScrollMode(
				TiConvert.toInt(d.get(TiC.PROPERTY_OVER_SCROLL_MODE), View.OVER_SCROLL_ALWAYS));
		}

		// Set up the swipe refresh layout container which wraps the scroll view.
		// Only create the wrapper if refreshControl is set, avoiding an extra ViewGroup layer.
		if (d.containsKey(TiC.PROPERTY_REFRESH_CONTROL)) {
			this.swipeRefreshLayout = createSwipeRefreshLayout();
			this.swipeRefreshLayout.setSwipeRefreshEnabled(false);
			this.swipeRefreshLayout.addView(this.scrollView);
			Object object = d.get(TiC.PROPERTY_REFRESH_CONTROL);
			if (object instanceof RefreshControlProxy) {
				((RefreshControlProxy) object).assignTo(this.swipeRefreshLayout);
			}
			setNativeView(this.swipeRefreshLayout);
		} else {
			this.swipeRefreshLayout = null;
			setNativeView(this.scrollView);
		}

		this.scrollView.setHorizontalScrollBarEnabled(showHorizontalScrollBar);
		this.scrollView.setVerticalScrollBarEnabled(showVerticalScrollBar);

		// Set default values for Android-specific properties (can be overridden by JS)
		if (d.containsKey(TiC.PROPERTY_CLIP_TO_PADDING)) {
			cachedClipToPadding = TiConvert.toBoolean(d.get(TiC.PROPERTY_CLIP_TO_PADDING), false);
			((android.view.ViewGroup) this.scrollView).setClipToPadding(cachedClipToPadding);
		} else {
			cachedClipToPadding = false; // Default matches iOS UIScrollView behavior
		}
		if (d.containsKey(TiC.PROPERTY_CLIP_CHILDREN)) {
			((android.view.ViewGroup) this.scrollView).setClipChildren(
				TiConvert.toBoolean(d.get(TiC.PROPERTY_CLIP_CHILDREN), true)
			);
		}

		// Process contentInset from initial properties dictionary
		if (d.containsKey(TiC.PROPERTY_CONTENT_INSETS)) {
			Object insetValue = d.get(TiC.PROPERTY_CONTENT_INSETS);
			setContentInset(insetValue);
		}

		// Process scrollIndicatorInsets from initial properties dictionary
		if (d.containsKey(TiC.PROPERTY_SCROLL_INDICATOR_INSETS)) {
			setScrollIndicatorInsets(d.get(TiC.PROPERTY_SCROLL_INDICATOR_INSETS));
		}
		if (d.containsKey(TiC.PROPERTY_VERTICAL_SCROLL_INDICATOR_INSETS)) {
			setVerticalScrollIndicatorInsets(d.get(TiC.PROPERTY_VERTICAL_SCROLL_INDICATOR_INSETS));
		}
		if (d.containsKey(TiC.PROPERTY_HORIZONTAL_SCROLL_INDICATOR_INSETS)) {
			setHorizontalScrollIndicatorInsets(d.get(TiC.PROPERTY_HORIZONTAL_SCROLL_INDICATOR_INSETS));
		}

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

	@Override
	public View getNativeContentView()
	{
		return getLayout();
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

			// Note: A previous workaround disabled smooth scrolling when getScrollY() > 0
			// due to a NestedScrollView bug where smoothScrollTo() moved to the wrong position.
			// This bug was fixed in AndroidX (Support Library 28.0.0 / androidx.core:core:1.0.0+),
			// so the workaround is no longer needed.

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

	public void scrollToBottom(boolean animated)
	{
		View view = this.scrollView;
		if (view instanceof TiHorizontalScrollView) {
			((TiHorizontalScrollView) view).fullScroll(View.FOCUS_RIGHT);
		} else if (view instanceof TiVerticalScrollView) {
			if (animated == false) {
				((TiVerticalScrollView) view).fullScroll(View.FOCUS_DOWN);
			} else {
				NestedScrollView nestedScrollView = ((TiVerticalScrollView) view);
				nestedScrollView.smoothScrollBy(0, nestedScrollView.getChildAt(0).getHeight());
			}
		}
	}

	public void scrollToTop(boolean animated)
	{
		View view = this.scrollView;
		if (view instanceof TiHorizontalScrollView) {
			// Scroll to the left-most side of the horizontal scroll view.
			((TiHorizontalScrollView) view).fullScroll(View.FOCUS_LEFT);
		} else if (view instanceof TiVerticalScrollView) {
			if (animated) {
				// Note: Previous workaround disabled smooth scrolling due to a NestedScrollView bug.
				// This bug was fixed in AndroidX (Support Library 28.0.0+), so smoothScrollTo works correctly.
				((TiVerticalScrollView) view).smoothScrollTo(0, 0);
			} else {
				((TiVerticalScrollView) view).fullScroll(View.FOCUS_UP);
			}
		}
	}

	private KrollDict contentSize()
	{
		int width = getLayout().getMeasuredWidth();
		int height = getLayout().getMeasuredHeight();

		// Add top and bottom insets to the content size to match iOS behavior.
		// This ensures JavaScript sees the correct scrollable area including insets.
		int topInset = (int) cachedInsetTopDim.getAsPixels(getNativeView());
		int bottomInset = (int) cachedInsetBottomDim.getAsPixels(getNativeView());

		// Only recalculate TiDimension values if content size changed
		if (width != cachedContentWidth || height != cachedContentHeight) {
			cachedContentWidth = width;
			cachedContentHeight = height;
			TiDimension dimensionWidth = new TiDimension(width, TiDimension.TYPE_WIDTH);
			TiDimension dimensionHeight = new TiDimension(height + topInset + bottomInset, TiDimension.TYPE_HEIGHT);
			cachedContentSizeWidth = dimensionWidth.getAsDefault(getNativeView());
			cachedContentSizeHeight = dimensionHeight.getAsDefault(getNativeView());
		}

		KrollDict contentData = new KrollDict();
		contentData.put(TiC.PROPERTY_WIDTH, cachedContentSizeWidth);
		contentData.put(TiC.PROPERTY_HEIGHT, cachedContentSizeHeight);
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
