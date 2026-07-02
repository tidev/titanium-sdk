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
import android.graphics.RectF;
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
	private static final int FADE_DURATION = 200; // Fade-out animation duration in ms

	private long lastScrollEventTime = 0;
	private int cachedOffsetX = 0;
	private int cachedOffsetY = 0;
	private int cachedContentWidth = -1;
	private int cachedContentHeight = -1;
	private double cachedContentSizeWidth = 0;
	private double cachedContentSizeHeight = 0;
	// Reused KrollDict for the contentSize() result so the per-frame scroll event does not
	// allocate a fresh dict on every onScrollChanged (~60fps). See contentSize().
	private final KrollDict reusableContentSizeData = new KrollDict();

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

	// Cached scroll indicator colors
	private int scrollIndicatorColor = 0xFF666666;
	private int scrollIndicatorBackgroundColor = 0x66666666;
	private int scrollIndicatorRadius = 6;
	private boolean hasCustomScrollIndicatorProps;

	private CustomScrollBar customVerticalScrollBar;
	private CustomScrollBar customHorizontalScrollBar;

	private static int verticalAttrId = -1;
	private static int horizontalAttrId = -1;
	private int type;
	private TiDimension xDimension;
	private TiDimension yDimension;

	public class CustomScrollBar extends View
	{
		public enum Orientation { VERTICAL, HORIZONTAL }

		private static final int SCROLLBAR_SIZE = 12;
		private static final int MIN_THUMB_SIZE = 40; // Minimum thumb size for usability
		private Paint trackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
		private Paint thumbPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
		private RectF trackRect = new RectF();
		private RectF thumbRect = new RectF();

		private final Orientation orientation;
		private int insetStart, insetEnd; // top/bottom for vertical, left/right for horizontal
		private int thumbColor;
		private int trackColor;
		private int radius;
		private int scrollPosition, scrollRange;

		// Per-instance fade-out: each bar owns its alpha/visibility lifecycle, so the fade is
		// independent per axis and a recreated bar cannot be GONE'd by a stale runnable from a
		// previous bar (the previous shared fadeRunnable read the bar fields at dispatch time).
		// Cleared in onDetachedFromWindow.
		private final android.os.Handler fadeHandler = new android.os.Handler(android.os.Looper.getMainLooper());
		private final Runnable fadeRunnable = new Runnable() {
			@Override
			public void run()
			{
				if (getAlpha() < 0.99f) {
					setVisibility(View.GONE);
				}
			}
		};

		public CustomScrollBar(
			Context context, Orientation orientation,
			int insetStart, int insetEnd,
			int thumbColor, int trackColor, int radius)
		{
			super(context);
			this.orientation = orientation;
			this.insetStart = insetStart;
			this.insetEnd = insetEnd;
			this.thumbColor = thumbColor;
			this.trackColor = trackColor;
			this.radius = radius;
			trackPaint.setColor(trackColor);
			thumbPaint.setColor(thumbColor);
			setAlpha(0f);
			setClickable(false);
			setFocusable(false);
			// Debug logging removed
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
		{
			if (orientation == Orientation.VERTICAL) {
				int height = MeasureSpec.getSize(heightMeasureSpec);
				setMeasuredDimension(SCROLLBAR_SIZE, height);
			} else {
				int width = MeasureSpec.getSize(widthMeasureSpec);
				setMeasuredDimension(width, SCROLLBAR_SIZE);
			}
		}

		@Override
		protected void onDraw(Canvas canvas)
		{
			super.onDraw(canvas);

			// Both axes share the same thumb-sizing math; only the track extent and the
			// RectF orientation differ. Parameterize via computeThumb so the clamp logic
			// (MIN_THUMB_SIZE floor + thumbArea clamp + inset-bounds clamp) lives in one place.
			if (orientation == Orientation.VERTICAL) {
				int trackHeight = getHeight();
				if (trackHeight == 0) return;

				int r = Math.min(radius, SCROLLBAR_SIZE / 2);
				trackRect.set(0, 0, SCROLLBAR_SIZE, trackHeight);
				canvas.drawRoundRect(trackRect, r, r, trackPaint);

				int[] thumb = computeThumb(trackHeight);
				if (thumb == null) return;
				thumbRect.set(0, thumb[0], SCROLLBAR_SIZE, thumb[0] + thumb[1]);
				canvas.drawRoundRect(thumbRect, r, r, thumbPaint);
			} else { // HORIZONTAL
				int trackWidth = getWidth();
				if (trackWidth == 0) return;

				int r = Math.min(radius, SCROLLBAR_SIZE / 2);
				trackRect.set(0, 0, trackWidth, SCROLLBAR_SIZE);
				canvas.drawRoundRect(trackRect, r, r, trackPaint);

				int[] thumb = computeThumb(trackWidth);
				if (thumb == null) return;
				thumbRect.set(thumb[0], 0, thumb[0] + thumb[1], SCROLLBAR_SIZE);
				canvas.drawRoundRect(thumbRect, r, r, thumbPaint);
			}
		}

		/**
		 * Computes the thumb start (top for vertical / left for horizontal) and size
		 * (height / width) for the current scroll position along this bar's axis, using the
		 * bar's insetStart/insetEnd and the cached scrollPosition/scrollRange.
		 * <p>Clamps the thumb size to the inset area so large insets (thumbArea smaller than
		 * MIN_THUMB_SIZE) can't make the thumb overflow the track, and clamps the position to
		 * the inset bounds.
		 * @param trackSize track extent (height for vertical, width for horizontal)
		 * @return int[2] {thumbStart, thumbSize} in pixels, or null if there is no inset area
		 */
		private int[] computeThumb(int trackSize)
		{
			int thumbArea = trackSize - insetStart - insetEnd;
			if (thumbArea <= 0) {
				return null;
			}
			int thumbSize = Math.min(thumbArea,
				Math.max(MIN_THUMB_SIZE, thumbArea * thumbArea / (thumbArea + scrollRange)));
			int thumbStart;
			if (scrollRange > 0) {
				float ratio = (float) scrollPosition / scrollRange;
				thumbStart = insetStart + (int) (ratio * (thumbArea - thumbSize));
			} else {
				thumbStart = insetStart;
			}
			thumbStart = Math.max(insetStart, Math.min(thumbStart, trackSize - insetEnd - thumbSize));
			return new int[] { thumbStart, thumbSize };
		}

		public void updateScrollPosition(int scrollPos, int scrollRange, int viewportSize)
		{
			int oldPos = this.scrollPosition;
			int oldRange = this.scrollRange;
			this.scrollPosition = scrollPos;
			this.scrollRange = scrollRange;

			if (scrollRange > 0) {
				// Dirty-guard the per-frame state: this method is called on every scroll
				// frame (~60fps), so only setAlpha/setVisibility/postInvalidate when the value
				// actually changed. scheduleFadeOut still re-arms each frame to keep the bar
				// visible while scrolling and fade it once scrolling stops.
				if (getAlpha() != 1f) {
					setAlpha(1f);
				}
				if (getVisibility() != View.VISIBLE) {
					setVisibility(View.VISIBLE);
				}
				if (scrollPos != oldPos || scrollRange != oldRange) {
					postInvalidate();
				}
				scheduleFadeOut();
			} else {
				if (getAlpha() != 0f) {
					setAlpha(0f);
				}
				if (getVisibility() != View.GONE) {
					setVisibility(View.GONE);
				}
			}
		}

		/**
		 * Schedules this bar's fade-out: cancel any in-flight alpha animator and pending hide
		 * runnable, then animate alpha to 0 and hide (GONE) after FADE_DURATION. Re-arming each
		 * scroll frame keeps the bar visible while scrolling and fades it once scrolling stops.
		 */
		private void scheduleFadeOut()
		{
			fadeHandler.removeCallbacks(fadeRunnable);
			animate().cancel();
			animate().alpha(0f).setDuration(FADE_DURATION).start();
			fadeHandler.postDelayed(fadeRunnable, FADE_DURATION);
		}

		@Override
		protected void onDetachedFromWindow()
		{
			fadeHandler.removeCallbacksAndMessages(null);
			super.onDetachedFromWindow();
		}
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
					return false;
				}
				@Override
				public boolean onDoubleTap(MotionEvent e)
				{
					if (proxy != null && proxy.hierarchyHasListener(TiC.EVENT_DOUBLE_TAP)) {
						fireEvent(TiC.EVENT_DOUBLE_TAP, dictFromEvent(e));
					}
					return false;
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
		private KrollDict reusableScrollEventData = new KrollDict();

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
			return super.onTouchEvent(event);
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
			if (!mScrollingEnabled) return;
			super.onNestedScroll(target, dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed);
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
			// Update custom vertical scrollbar position.
			// Use the canonical Android scroll range/extent so the thumb ratio accounts for
			// contentInset padding (clipToPadding=false) and matches the native scrollbar math,
			// instead of the raw child-minus-viewport delta which ignored padding.
			if (customVerticalScrollBar != null) {
				int scrollRange = computeVerticalScrollRange() - computeVerticalScrollExtent();
				customVerticalScrollBar.updateScrollPosition(t, Math.max(0, scrollRange), getMeasuredHeight());
			}

			// Reuse existing KrollDict to avoid allocations per scroll event
			reusableScrollEventData.clear();
			reusableScrollEventData.put(TiC.EVENT_PROPERTY_X, offsetX.getAsDefault(scrollView));
			reusableScrollEventData.put(TiC.EVENT_PROPERTY_Y, offsetY.getAsDefault(scrollView));
			reusableScrollEventData.put(TiC.PROPERTY_CONTENT_SIZE, contentSize());
			getProxy().fireEvent(TiC.EVENT_SCROLL, reusableScrollEventData);
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
		private KrollDict reusableScrollEventData = new KrollDict();

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
			return super.onTouchEvent(event);
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
			// Update custom horizontal scrollbar position.
			// Use the canonical Android scroll range/extent so the thumb ratio accounts for
			// contentInset padding (clipToPadding=false) and matches the native scrollbar math,
			// instead of the raw child-minus-viewport delta which ignored padding.
			if (customHorizontalScrollBar != null) {
				int scrollRange = computeHorizontalScrollRange() - computeHorizontalScrollExtent();
				customHorizontalScrollBar.updateScrollPosition(l, Math.max(0, scrollRange), getMeasuredWidth());
			}

			// Reuse existing KrollDict to avoid allocations per scroll event.
			// NOTE: use offsetX (the actual scroll offset, updated by setContentOffset) for
			// EVENT_PROPERTY_X, NOT xDimension (which is the raw touch coordinate and is null
			// until the first touch — using it caused wrong values and an NPE on programmatic
			// scrollTo() before any touch).
			reusableScrollEventData.clear();
			reusableScrollEventData.put(TiC.EVENT_PROPERTY_X, offsetX.getAsDefault(scrollView));
			reusableScrollEventData.put(TiC.EVENT_PROPERTY_Y, offsetY.getAsDefault(scrollView));
			reusableScrollEventData.put(TiC.PROPERTY_CONTENT_SIZE, contentSize());
			getProxy().fireEvent(TiC.EVENT_SCROLL, reusableScrollEventData);
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
		// Custom scrollbar fade handlers are cleared automatically: super.release() detaches
		// the native view tree, which triggers each CustomScrollBar's onDetachedFromWindow.

		// If a refresh control is currently assigned, then detach it. Check the
		// swipeRefreshLayout field (not getNativeView()): when custom scrollbar properties
		// are also set, ensureContentWrapper wraps the SwipeRefreshLayout into a contentWrapper
		// and makes the contentWrapper the native view, so getNativeView() is a plain
		// FrameLayout here and the instanceof check would skip the unassign, leaking the
		// RefreshControlProxy and the SwipeRefreshLayout (and their listeners).
		if (this.swipeRefreshLayout != null) {
			RefreshControlProxy.unassignFrom(this.swipeRefreshLayout);
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

			// When all insets are zero (the common reset path via contentInset={} or null),
			// we still must clear any previously-applied padding and cached pixel values —
			// otherwise the old padding stays in place and content remains inset forever.
			// The early return below skips the expensive setPadding only when there is truly
			// nothing to change (no prior padding either).
			if (cachedInsetTopDim.getIntValue() == 0
				&& cachedInsetBottomDim.getIntValue() == 0
				&& cachedInsetLeftDim.getIntValue() == 0
				&& cachedInsetRightDim.getIntValue() == 0) {
				if (cachedPixelTopPad != 0 || cachedPixelBottomPad != 0
					|| cachedPixelLeftPad != 0 || cachedPixelRightPad != 0) {
					cachedPixelTopPad = 0;
					cachedPixelBottomPad = 0;
					cachedPixelLeftPad = 0;
					cachedPixelRightPad = 0;
					this.scrollView.setPadding(0, 0, 0, 0);
					TiScrollViewLayout layout = getLayout();
					if (layout != null) {
						layout.invalidateContentPropertyCache();
					}
				}
				// Invalidate contentSize cache so reported content height no longer includes insets.
				cachedContentWidth = -1;
				cachedContentHeight = -1;
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
			// Invalidate contentSize cache so it recomputes including the new insets.
			cachedContentWidth = -1;
			cachedContentHeight = -1;

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
	 * Parses a {top, left, right, bottom} inset dictionary to pixel ints, accepting the
	 * same value grammar as contentInset (Number, or a dimension string such as '12dp'
	 * / '12px') via TiConvert.toTiDimension + TiDimension.getAsPixels. The previous
	 * implementation used TiConvert.toFloat, which runs Float.parseFloat on strings and
	 * silently turned {top: '12dp'} into 0 (whereas contentInset accepted '12dp').
	 *
	 * @return int[4] {top, left, right, bottom} in pixels
	 */
	private int[] parseInsetsToPx(Object value)
	{
		int[] px = new int[4]; // top, left, right, bottom
		if (value instanceof HashMap) {
			HashMap dict = (HashMap) value;
			if (dict.containsKey("top") && dict.get("top") != null) {
				px[0] = TiConvert.toTiDimension(dict.get("top"), TiDimension.TYPE_TOP).getAsPixels(scrollView);
			}
			if (dict.containsKey("left") && dict.get("left") != null) {
				px[1] = TiConvert.toTiDimension(dict.get("left"), TiDimension.TYPE_LEFT).getAsPixels(scrollView);
			}
			if (dict.containsKey("right") && dict.get("right") != null) {
				px[2] = TiConvert.toTiDimension(dict.get("right"), TiDimension.TYPE_RIGHT).getAsPixels(scrollView);
			}
			if (dict.containsKey("bottom") && dict.get("bottom") != null) {
				px[3] = TiConvert.toTiDimension(dict.get("bottom"), TiDimension.TYPE_BOTTOM).getAsPixels(scrollView);
			}
		}
		return px;
	}

	/**
	 * Sets vertical scroll indicator insets.
	 */
	public void setVerticalScrollIndicatorInsets(Object value)
	{
		applyVerticalScrollIndicatorInsets(value);
	}

	/**
	 * Applies vertical scroll indicator insets values.
	 */
	private void applyVerticalScrollIndicatorInsets(Object value)
	{
		if (scrollView == null) {
			return;
		}

		int[] px = parseInsetsToPx(value);
		cachedVerticalScrollIndicatorTopDim = new TiDimension(px[0], TiDimension.TYPE_TOP);
		cachedVerticalScrollIndicatorBottomDim = new TiDimension(px[3], TiDimension.TYPE_BOTTOM);
		cachedVerticalScrollIndicatorLeftDim = new TiDimension(px[1], TiDimension.TYPE_LEFT);
		cachedVerticalScrollIndicatorRightDim = new TiDimension(px[2], TiDimension.TYPE_RIGHT);

		hasCustomScrollIndicatorProps = true;
		updateCustomScrollBars();
	}

	/**
	 * Sets horizontal scroll indicator insets.
	 */
	public void setHorizontalScrollIndicatorInsets(Object value)
	{
		applyHorizontalScrollIndicatorInsets(value);
	}

	/**
	 * Applies horizontal scroll indicator insets values.
	 */
	private void applyHorizontalScrollIndicatorInsets(Object value)
	{
		if (scrollView == null) {
			return;
		}

		int[] px = parseInsetsToPx(value);
		cachedHorizontalScrollIndicatorTopDim = new TiDimension(px[0], TiDimension.TYPE_TOP);
		cachedHorizontalScrollIndicatorBottomDim = new TiDimension(px[3], TiDimension.TYPE_BOTTOM);
		cachedHorizontalScrollIndicatorLeftDim = new TiDimension(px[1], TiDimension.TYPE_LEFT);
		cachedHorizontalScrollIndicatorRightDim = new TiDimension(px[2], TiDimension.TYPE_RIGHT);

		hasCustomScrollIndicatorProps = true;
		updateCustomScrollBars();
	}

	/**
	 * Sets scroll indicator color (thumb color).
	 */
	public void setScrollIndicatorColor(Object value)
	{
		String colorStr = TiConvert.toString(value);
		int newColor = (colorStr != null && !colorStr.isEmpty())
			? TiConvert.toColor(colorStr)
			: 0xFF666666;
		scrollIndicatorColor = newColor;
		hasCustomScrollIndicatorProps = true;
		updateCustomScrollBars();
	}

	/**
	 * Sets scroll indicator background color (track color).
	 */
	public void setScrollIndicatorBackgroundColor(Object value)
	{
		String colorStr = TiConvert.toString(value);
		int newColor = (colorStr != null && !colorStr.isEmpty())
			? TiConvert.toColor(colorStr)
			: 0x66666666;
		scrollIndicatorBackgroundColor = newColor;
		hasCustomScrollIndicatorProps = true;
		updateCustomScrollBars();
	}

	/**
	 * Sets scroll indicator corner radius.
	 */
	public void setScrollIndicatorRadius(Object value)
	{
		int radius = TiConvert.toInt(value, 6);
		scrollIndicatorRadius = Math.max(0, radius);
		hasCustomScrollIndicatorProps = true;
		updateCustomScrollBars();
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

		// The view we wrap is the top-level native view. When a refreshControl is set, the
		// Wrap the current top-level native view. getNativeView() is the single source of
		// truth for that: it is the SwipeRefreshLayout when refreshControl is set, the
		// scrollView otherwise — so this keeps the SwipeRefreshLayout -> NestedScrollView
		// nesting intact (pull-to-refresh keeps working) and gives us a FrameLayout host for
		// the custom scrollbar views. Wrapping the inner scrollView directly (previous
		// behavior) reparented it out of the SwipeRefreshLayout into a plain FrameLayout,
		// severing the nested-scroll chain.
		View wrapTarget = getNativeView();
		if (wrapTarget == null) {
			wrapTarget = scrollView;
		}
		if (wrapTarget == null) {
			return;
		}

		// If wrapTarget is already attached, create the wrapper immediately.
		if (wrapTarget.getParent() instanceof ViewGroup) {
			buildContentWrapper(wrapTarget);
		} else if (scrollView != null) {
			// Not yet attached — defer wrapper creation until the view is ready.
			scrollView.post(new Runnable() {
				@Override
				public void run()
				{
					if (contentWrapper != null || scrollView == null) {
						return;
					}
					View target = getNativeView();
					if (target == null) {
						target = scrollView;
					}
					if (target == null || !(target.getParent() instanceof ViewGroup)) {
						return;
					}
					buildContentWrapper(target);

					// Now create the custom scrollbars (deferred path only — the immediate
					// path is followed by updateCustomScrollBars, which creates them itself).
					if (hasCustomScrollIndicatorProps && showVerticalScrollBar) {
						createVerticalScrollBar();
					}
					if (hasCustomScrollIndicatorProps && showHorizontalScrollBar) {
						createHorizontalScrollBar();
					}
				}
			});
		}
	}

	/**
	 * Builds the contentWrapper around {@code wrapTarget} and reparents it in place at the
	 * same index. The wrapper becomes the new native view; custom scrollbar views are later
	 * added to it. Shared by the immediate and deferred attach paths of ensureContentWrapper.
	 */
	private void buildContentWrapper(View wrapTarget)
	{
		contentWrapper = new FrameLayout(wrapTarget.getContext());
		contentWrapper.setLayoutParams(new FrameLayout.LayoutParams(
			ViewGroup.LayoutParams.MATCH_PARENT,
			ViewGroup.LayoutParams.MATCH_PARENT
		));
		contentWrapper.setClipChildren(false);
		contentWrapper.setClipToPadding(false);

		ViewGroup oldParent = (ViewGroup) wrapTarget.getParent();
		int index = oldParent.indexOfChild(wrapTarget);
		oldParent.removeViewAt(index);
		contentWrapper.addView(wrapTarget, 0);
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

		// Hide native scrollbars when using custom scroll indicators. Per-bar fade handlers
		// are cleared automatically: removeView-ing an old bar below triggers its
		// onDetachedFromWindow, which cancels its own pending fade runnable.
		if (hasCustomScrollIndicatorProps) {
			scrollView.setHorizontalScrollBarEnabled(false);
			scrollView.setVerticalScrollBarEnabled(false);
		}

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
			if (hasCustomScrollIndicatorProps && showVerticalScrollBar) {
				createVerticalScrollBar();
			}
			if (hasCustomScrollIndicatorProps && showHorizontalScrollBar) {
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

		customVerticalScrollBar = new CustomScrollBar(
			scrollView.getContext(), CustomScrollBar.Orientation.VERTICAL, topInset, bottomInset,
			scrollIndicatorColor, scrollIndicatorBackgroundColor, scrollIndicatorRadius);

		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
			ViewGroup.LayoutParams.WRAP_CONTENT,
			ViewGroup.LayoutParams.MATCH_PARENT
		);
		// Use a layout-direction-aware gravity so the vertical scrollbar sits on the trailing
		// edge (right in LTR, left in RTL), matching how Android mirrors native scrollbars.
		params.gravity = android.view.Gravity.RELATIVE_LAYOUT_DIRECTION | android.view.Gravity.END;
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

		customHorizontalScrollBar = new CustomScrollBar(
			scrollView.getContext(), CustomScrollBar.Orientation.HORIZONTAL, leftInset, rightInset,
			scrollIndicatorColor, scrollIndicatorBackgroundColor, scrollIndicatorRadius);

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
				// Lazily create SwipeRefreshLayout wrapper when refreshControl is set dynamically.
				this.swipeRefreshLayout = createSwipeRefreshLayout();
				this.swipeRefreshLayout.setSwipeRefreshEnabled(false);
				((RefreshControlProxy) newValue).assignTo(this.swipeRefreshLayout);
				if (contentWrapper != null) {
					// A contentWrapper was already built (custom scrollbar props were set
					// earlier) and is the native view, with scrollView as its first child.
					// Insert the SwipeRefreshLayout where scrollView sat, keeping the
					// NestedScrollView -> SwipeRefreshLayout nesting intact and the custom
					// scrollbar views hosted in contentWrapper. The native view stays
					// contentWrapper, so pull-to-refresh keeps working (previously this path
					// pulled scrollView out of contentWrapper into an orphan SwipeRefreshLayout
					// and broke both pull-to-refresh and the custom scrollbars).
					int index = contentWrapper.indexOfChild(this.scrollView);
					if (index >= 0) {
						contentWrapper.removeViewAt(index);
					} else {
						index = 0;
					}
					this.swipeRefreshLayout.addView(this.scrollView, 0);
					contentWrapper.addView(this.swipeRefreshLayout, index);
				} else {
					this.swipeRefreshLayout.addView(this.scrollView);
					setNativeView(this.swipeRefreshLayout);
				}
			} else {
				Log.e(TAG, "Invalid value assigned to property '" + key + "'. Must be of type 'RefreshControl'.");
			}
		} else if (TiC.PROPERTY_OVER_SCROLL_MODE.equals(key)) {
			if (this.scrollView != null) {
				this.scrollView.setOverScrollMode(TiConvert.toInt(newValue, View.OVER_SCROLL_ALWAYS));
			}
		} else if (key.equals(TiC.PROPERTY_CONTENT_INSETS)) {
			setContentInset(newValue);
		} else if (key.equals(TiC.PROPERTY_VERTICAL_SCROLL_INDICATOR_INSETS)) {
			setVerticalScrollIndicatorInsets(newValue);
		} else if (key.equals(TiC.PROPERTY_HORIZONTAL_SCROLL_INDICATOR_INSETS)) {
			setHorizontalScrollIndicatorInsets(newValue);
		} else if (key.equals(TiC.PROPERTY_SCROLL_INDICATOR_COLOR)) {
			setScrollIndicatorColor(newValue);
		} else if (key.equals(TiC.PROPERTY_SCROLL_INDICATOR_BACKGROUND_COLOR)) {
			setScrollIndicatorBackgroundColor(newValue);
		} else if (key.equals(TiC.PROPERTY_SCROLL_INDICATOR_RADIUS)) {
			setScrollIndicatorRadius(newValue);
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
		// Default both to false and only enable when the JS explicitly sets the
		// showHorizontal/VerticalScrollIndicator property. Previously this was seeded from
		// `scrollType`, but at this point `this.scrollType` is still the field default
		// (TYPE_VERTICAL) — it is only updated to the deduced `type` further below — so a
		// vertical ScrollView ended up with a native vertical scrollbar enabled by default,
		// and a horizontal ScrollView (scrollType:'horizontal') got a vertical scrollbar too.
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

		if (d.containsKey(TiC.PROPERTY_VERTICAL_SCROLL_INDICATOR_INSETS)) {
			setVerticalScrollIndicatorInsets(d.get(TiC.PROPERTY_VERTICAL_SCROLL_INDICATOR_INSETS));
		}
		if (d.containsKey(TiC.PROPERTY_HORIZONTAL_SCROLL_INDICATOR_INSETS)) {
			setHorizontalScrollIndicatorInsets(d.get(TiC.PROPERTY_HORIZONTAL_SCROLL_INDICATOR_INSETS));
		}
		if (d.containsKey(TiC.PROPERTY_SCROLL_INDICATOR_COLOR)) {
			String cStr = TiConvert.toString(d.get(TiC.PROPERTY_SCROLL_INDICATOR_COLOR));
			scrollIndicatorColor = (cStr != null && !cStr.isEmpty())
				? TiConvert.toColor(cStr)
				: 0xFF666666;
			hasCustomScrollIndicatorProps = true;
		}
		if (d.containsKey(TiC.PROPERTY_SCROLL_INDICATOR_BACKGROUND_COLOR)) {
			String cStr = TiConvert.toString(d.get(TiC.PROPERTY_SCROLL_INDICATOR_BACKGROUND_COLOR));
			scrollIndicatorBackgroundColor = (cStr != null && !cStr.isEmpty())
				? TiConvert.toColor(cStr)
				: 0x66666666;
			hasCustomScrollIndicatorProps = true;
		}
		if (d.containsKey(TiC.PROPERTY_SCROLL_INDICATOR_RADIUS)) {
			scrollIndicatorRadius = Math.max(0, TiConvert.toInt(d.get(TiC.PROPERTY_SCROLL_INDICATOR_RADIUS), 6));
			hasCustomScrollIndicatorProps = true;
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
		if (view == null) return;

		if (view instanceof TiHorizontalScrollView) {
			// Horizontal scroll views scroll to the right-most edge, not a vertical target.
			// Honor the `animated` flag for symmetry with the vertical branch (previously the
			// horizontal branch always snapped via fullScroll, ignoring `animated`).
			int contentWidth = getLayout().getMeasuredWidth();
			int viewportWidth = view.getMeasuredWidth();
			int targetX = Math.max(0, contentWidth + cachedPixelLeftPad + cachedPixelRightPad - viewportWidth);
			if (animated) {
				((TiHorizontalScrollView) view).smoothScrollTo(targetX, 0);
			} else {
				((TiHorizontalScrollView) view).fullScroll(View.FOCUS_RIGHT);
			}
			return;
		}

		// Include the contentInset top/bottom padding in the target. With clipToPadding=false
		// (the default), the true bottom scroll position is contentHeight + topPad + bottomPad -
		// viewport; the previous child-minus-viewport math undershot by exactly topPad+bottomPad.
		int contentHeight = getLayout().getMeasuredHeight();
		int viewportHeight = view.getMeasuredHeight();
		int targetY = Math.max(0, contentHeight + cachedPixelTopPad + cachedPixelBottomPad - viewportHeight);

		if (animated && view instanceof TiVerticalScrollView) {
			((TiVerticalScrollView) view).smoothScrollTo(0, targetY);
		} else {
			view.scrollTo(0, targetY);
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

		// Only recalculate when the content size changed. Inset changes are covered because
		// applyContentInset() invalidates cachedContentWidth/Height (sets them to -1). We read
		// the cached pixel pads (maintained in applyContentInset) instead of re-running
		// getAsPixels() on every call — this is a hot path (called per scroll frame from both
		// onScrollChanged handlers), so it must not allocate or re-convert.
		if (width != cachedContentWidth || height != cachedContentHeight) {
			cachedContentWidth = width;
			cachedContentHeight = height;
			TiDimension dimensionWidth = new TiDimension(
				width + cachedPixelLeftPad + cachedPixelRightPad, TiDimension.TYPE_WIDTH);
			TiDimension dimensionHeight = new TiDimension(
				height + cachedPixelTopPad + cachedPixelBottomPad, TiDimension.TYPE_HEIGHT);
			cachedContentSizeWidth = dimensionWidth.getAsDefault(getNativeView());
			cachedContentSizeHeight = dimensionHeight.getAsDefault(getNativeView());
		}

		// Reuse a single KrollDict instead of allocating a new one per scroll frame. The
		// scroll handler puts this dict into reusableScrollEventData and fires the event
		// synchronously, so mutating it next frame is safe (same pattern as the scroll dict).
		reusableContentSizeData.put(TiC.PROPERTY_WIDTH, cachedContentSizeWidth);
		reusableContentSizeData.put(TiC.PROPERTY_HEIGHT, cachedContentSizeHeight);
		return reusableContentSizeData;
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
