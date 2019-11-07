/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.lang.Math;
import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiEventHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Parcelable;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.MeasureSpec;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.view.ViewParent;
import android.widget.FrameLayout;

import ti.modules.titanium.ui.ScrollableViewProxy;
import ti.modules.titanium.ui.widget.listview.ListItemProxy;

@SuppressLint("NewApi")
public class TiUIScrollableView extends TiUIView
{
	private static final String TAG = "TiUIScrollableView";

	private static final int PAGE_LEFT_ID = View.generateViewId();
	private static final int PAGE_RIGHT_ID = View.generateViewId();

	private final ViewPager mPager;
	private final ArrayList<TiViewProxy> mViews;
	private final ViewPagerAdapter mAdapter;
	private final TiViewPagerLayout mContainer;
	private final FrameLayout mPagingControl;

	private int mCurIndex = 0;
	private boolean mEnabled = true;

	public TiUIScrollableView(ScrollableViewProxy proxy)
	{
		super(proxy);

		// Set up this view to fill the parent/screen by default.
		getLayoutParams().autoFillsWidth = true;
		getLayoutParams().autoFillsHeight = true;

		// Create the ViewPager container.
		Activity activity = proxy.getActivity();
		mContainer = new TiViewPagerLayout(activity);

		// Add ViewPager to container.
		mViews = new ArrayList<TiViewProxy>();
		mAdapter = new ViewPagerAdapter(activity, mViews);
		mPager = buildViewPager(activity, mAdapter);
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_CLIP_VIEWS)) {
			mPager.setClipToPadding(TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_CLIP_VIEWS), true));
		}
		mContainer.addView(mPager, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

		// Add paging controls to container.
		mPagingControl = buildPagingControl(activity);
		mContainer.addView(mPagingControl,
						   new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

		setNativeView(mContainer);
	}

	private ViewPager buildViewPager(Context context, ViewPagerAdapter adapter)
	{
		ViewPager pager = (new ViewPager(context) {
			@Override
			public boolean onTouchEvent(MotionEvent event)
			{
				if (mEnabled) {
					return super.onTouchEvent(event);
				}
				return false;
			}

			@Override
			public boolean onInterceptTouchEvent(MotionEvent event)
			{
				if (mEnabled) {
					return super.onInterceptTouchEvent(event);
				}
				return false;
			}

			@Override
			protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
			{
				// If size mode not set to "exactly", then change width/height to match largest child view.
				// Note: We need to do this since Google's "ViewPager" class ignores the
				//       WRAP_CONTENT setting and will fill the parent view instead.
				int widthMode = MeasureSpec.getMode(widthMeasureSpec);
				int heightMode = MeasureSpec.getMode(heightMeasureSpec);
				if ((widthMode != MeasureSpec.EXACTLY) || (heightMode != MeasureSpec.EXACTLY)) {
					// Determine how large this view wants to be based on its child views.
					int maxWidth = 0;
					int maxHeight = 0;
					for (int index = getChildCount() - 1; index >= 0; index--) {
						// Fetch the next child.
						View child = getChildAt(index);
						if (child == null) {
							continue;
						}

						// Skip child views that are flagged as excluded from the layout.
						if (child.getVisibility() == View.GONE) {
							continue;
						}

						// Determine the size of the child.
						child.measure(widthMeasureSpec, heightMeasureSpec);
						int childWidth = child.getMeasuredWidth();
						childWidth += child.getPaddingLeft() + child.getPaddingRight();
						int childHeight = child.getMeasuredHeight();
						childHeight += child.getPaddingTop() + child.getPaddingBottom();

						// Store the child's width/height if it's the largest so far.
						maxWidth = Math.max(maxWidth, childWidth);
						maxHeight = Math.max(maxHeight, childHeight);
					}

					// Make sure we don't go below suggested min width/height assigned to this view.
					maxWidth = Math.max(maxWidth, getSuggestedMinimumWidth());
					maxHeight = Math.max(maxHeight, getSuggestedMinimumHeight());

					// Update this view's given width/height spec to match the size of child view, but only if:
					// - Mode is AT_MOST and child size is less than given size. (Makes WRAP_CONTENT work.)
					// - Mode is UNSPECIFIED. (View can be any size it wants. Can occur in ScrollViews.)
					if (widthMode != MeasureSpec.EXACTLY) {
						int containerWidth = MeasureSpec.getSize(widthMeasureSpec);
						if ((widthMode == MeasureSpec.UNSPECIFIED) || (maxWidth < containerWidth)) {
							widthMode = MeasureSpec.AT_MOST;
							widthMeasureSpec = MeasureSpec.makeMeasureSpec(maxWidth, widthMode);
						}
					}
					if (heightMode != MeasureSpec.EXACTLY) {
						int containerHeight = MeasureSpec.getSize(heightMeasureSpec);
						if ((heightMode == MeasureSpec.UNSPECIFIED) || (maxHeight < containerHeight)) {
							heightMode = MeasureSpec.AT_MOST;
							heightMeasureSpec = MeasureSpec.makeMeasureSpec(maxHeight, heightMode);
						}
					}
				}

				// Update this view's measurements.
				super.onMeasure(widthMeasureSpec, heightMeasureSpec);
			}
		});

		pager.setAdapter(adapter);
		pager.setOnPageChangeListener(new ViewPager.SimpleOnPageChangeListener() {
			private int lastSelectedPageIndex;
			private boolean isScrolling;
			private boolean isDragging;

			@Override
			public void onPageScrollStateChanged(int scrollState)
			{
				switch (scrollState) {
					case ViewPager.SCROLL_STATE_DRAGGING: {
						if (!this.isDragging && !mViews.isEmpty()) {
							// This is the start of a touch/drag event by the end-user. Fire a "dragstart" event.
							this.isDragging = true;
							this.isScrolling = true;
							if (proxy != null) {
								proxy.fireEvent(TiC.EVENT_DRAGSTART, new KrollDict());
							}

							// Disable touch input interception from parent view hierarchy when dragging.
							// This makes page scrolling work if the ScrollableView is within a ScrollView.
							mPager.requestDisallowInterceptTouchEvent(true);
						}
						break;
					}
					case ViewPager.SCROLL_STATE_IDLE: {
						// Handle the end of a scroll/drag event.
						if (this.isScrolling || this.isDragging) {
							// Store the index to the currently selected page.
							mCurIndex = this.lastSelectedPageIndex;

							// Fetch the proxy for the currently selected page.
							TiViewProxy pageProxy = null;
							if ((this.lastSelectedPageIndex >= 0) && (this.lastSelectedPageIndex < mViews.size())) {
								pageProxy = mViews.get(this.lastSelectedPageIndex);
							}

							// Fire a "dragend" event if dragging. (We only support this event on Android.)
							// Note: We don't raise this event when user releases finger from screen because
							//       "currentPage" can index previous page if user flings the scrollable view.
							//       Developers expect "currentPage" to reference destination page instead,
							//       so, we wait until the scroll animation finishes before firing event.
							if (this.isDragging) {
								this.isDragging = false;
								if (proxy != null) {
									((ScrollableViewProxy) proxy).fireDragEnd(this.lastSelectedPageIndex, pageProxy);
								}
								mPager.requestDisallowInterceptTouchEvent(false);
							}

							// Fire a "scrollend" event.
							if (this.isScrolling) {
								this.isScrolling = false;
								if (proxy != null) {
									((ScrollableViewProxy) proxy).fireScrollEnd(this.lastSelectedPageIndex, pageProxy);
								}
							}
						}

						// Show the left/right arrow pagination buttons when the view stops scrolling.
						if (shouldShowPager()) {
							showPager();
						}
						break;
					}
				}
			}

			@Override
			public void onPageSelected(int pageIndex)
			{
				this.lastSelectedPageIndex = pageIndex;
			}

			@Override
			public void onPageScrolled(int pageIndex, float pageOffsetNormalized, int pageOffsetPixels)
			{
				// Ignored scroll/drag events if there are no child pages within the ViewPager.
				if (mViews.isEmpty()) {
					return;
				}

				// Determine if scrolling has just started.
				// This detects animated scrolls to another page via moveNext(), movePrevious(), and scrollToView().
				// This ignores animated scroll method calls to currently displayed page (no scroll occurs).
				if (!this.isScrolling && (Math.abs(pageOffsetNormalized) >= 0.01f)) {
					this.isScrolling = true;
				}

				// Do not continue if we're not in the scrolling state yet.
				if (!this.isScrolling) {
					return;
				}

				// Determine which page is most visible within the container.
				// This will be our current page for our Titanium "scroll" event.
				// Note: We do a Math.floor(x + 0.5) so that we can round -0.5 to -1.0 (towards negative infinity).
				float currentPageAsFloat = pageIndex + pageOffsetNormalized;
				int currentPageIndex = (int) Math.floor(currentPageAsFloat + 0.5f);
				if (currentPageIndex < 0) {
					currentPageIndex = 0;
				} else if (currentPageIndex >= mViews.size()) {
					currentPageIndex = mViews.size() - 1;
				}
				mCurIndex = currentPageIndex;

				// Fire a "scroll" event.
				if (proxy != null) {
					((ScrollableViewProxy) proxy).fireScroll(mCurIndex, currentPageAsFloat, mViews.get(mCurIndex));
				}
			}
		});
		return pager;
	}

	private boolean shouldShowPager()
	{
		Object showPagingControl = proxy.getProperty(TiC.PROPERTY_SHOW_PAGING_CONTROL);
		if (showPagingControl != null) {
			return TiConvert.toBoolean(showPagingControl);
		} else {
			return false;
		}
	}

	private FrameLayout buildPagingControl(Context context)
	{
		// Validate argument.
		if (context == null) {
			return null;
		}

		// Calculate a density scaled left/right arrow size.
		int arrowSizeInPixels = 24;
		if (context.getResources() != null) {
			DisplayMetrics metrics = context.getResources().getDisplayMetrics();
			if ((metrics != null) && (metrics.density >= 0.5f)) {
				arrowSizeInPixels = (int) ((float) arrowSizeInPixels * metrics.density);
			}
		}

		// Create an overlay view that will display the page controls.
		FrameLayout layout = new FrameLayout(context);
		layout.setFocusable(false);
		layout.setFocusableInTouchMode(false);

		// Add left arrow button to overlay.
		TiArrowView leftArrow = new TiArrowView(context);
		leftArrow.setVisibility(View.INVISIBLE);
		leftArrow.setId(PAGE_LEFT_ID);
		leftArrow.setMinimumWidth(arrowSizeInPixels);
		leftArrow.setMinimumHeight(arrowSizeInPixels);
		leftArrow.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v)
			{
				if (mEnabled) {
					movePrevious();
				}
			}
		});
		FrameLayout.LayoutParams leftLayoutParams =
			new FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		leftLayoutParams.gravity = Gravity.LEFT | Gravity.CENTER_VERTICAL;
		layout.addView(leftArrow, leftLayoutParams);

		// Add right arrow button to overlay.
		TiArrowView rightArrow = new TiArrowView(context);
		rightArrow.setLeft(false);
		rightArrow.setVisibility(View.INVISIBLE);
		rightArrow.setId(PAGE_RIGHT_ID);
		rightArrow.setMinimumWidth(arrowSizeInPixels);
		rightArrow.setMinimumHeight(arrowSizeInPixels);
		rightArrow.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v)
			{
				if (mEnabled) {
					moveNext();
				}
			}
		});
		FrameLayout.LayoutParams rightLayoutParams =
			new FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		rightLayoutParams.gravity = Gravity.RIGHT | Gravity.CENTER_VERTICAL;
		layout.addView(rightArrow, rightLayoutParams);

		// Hide this overlay by default. Will be shown if Titanium "showPagingControl" is set true.
		layout.setVisibility(View.GONE);

		// Return the newly created overlay view.
		return layout;
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_VIEWS)) {
			setViews(d.get(TiC.PROPERTY_VIEWS));
		}

		if (d.containsKey(TiC.PROPERTY_CURRENT_PAGE)) {
			int page = TiConvert.toInt(d, TiC.PROPERTY_CURRENT_PAGE);
			if (page > 0) {
				setCurrentPage(page);
			}
		}

		if (d.containsKey(TiC.PROPERTY_SHOW_PAGING_CONTROL)) {
			if (TiConvert.toBoolean(d, TiC.PROPERTY_SHOW_PAGING_CONTROL)) {
				showPager();
			}
		}

		if (d.containsKey(TiC.PROPERTY_SCROLLING_ENABLED)) {
			mEnabled = TiConvert.toBoolean(d, TiC.PROPERTY_SCROLLING_ENABLED);
		}

		if (d.containsKey(TiC.PROPERTY_OVER_SCROLL_MODE)) {
			mPager.setOverScrollMode(TiConvert.toInt(d.get(TiC.PROPERTY_OVER_SCROLL_MODE), View.OVER_SCROLL_ALWAYS));
		}

		if (d.containsKey(TiC.PROPERTY_CACHE_SIZE)) {
			setPageCacheSize(TiConvert.toInt(d.get(TiC.PROPERTY_CACHE_SIZE)));
		}

		if (d.containsKey(TiC.PROPERTY_PADDING)) {
			setPadding((HashMap) d.get(TiC.PROPERTY_PADDING));
		}

		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (TiC.PROPERTY_CURRENT_PAGE.equals(key)) {
			setCurrentPage(TiConvert.toInt(newValue));
		} else if (TiC.PROPERTY_SHOW_PAGING_CONTROL.equals(key)) {
			boolean show = TiConvert.toBoolean(newValue);
			if (show) {
				showPager();
			} else {
				hidePager();
			}
		} else if (TiC.PROPERTY_PADDING.equals(key)) {
			setPadding((HashMap) newValue);
		} else if (TiC.PROPERTY_SCROLLING_ENABLED.equals(key)) {
			mEnabled = TiConvert.toBoolean(newValue);
		} else if (TiC.PROPERTY_OVER_SCROLL_MODE.equals(key)) {
			mPager.setOverScrollMode(TiConvert.toInt(newValue, View.OVER_SCROLL_ALWAYS));
		} else if (TiC.PROPERTY_CACHE_SIZE.equals(key)) {
			setPageCacheSize(TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	private void setPageCacheSize(int value)
	{
		// Do not allow given size to be less than min. (iOS min size is 3.)
		if (value < ScrollableViewProxy.MIN_CACHE_SIZE) {
			StringBuilder stringBuilder = new StringBuilder();
			stringBuilder.append("ScrollableView 'cacheSize' cannot be set less than ");
			stringBuilder.append(ScrollableViewProxy.MIN_CACHE_SIZE);
			stringBuilder.append(". Given value: ");
			stringBuilder.append(value);
			Log.w(TAG, stringBuilder.toString());
			value = ScrollableViewProxy.MIN_CACHE_SIZE;
		}

		// Convert the given Titanium/iOS cache size value to an Android offscreen page limit value.
		// Notes:
		// - Titanium/iOS cache-size includes all pages buffered, including the page being displayed.
		//   Ex: Value of 3 includes the 1 currently displayed page and 2 offscreen pages.
		// - Android offscreen-page-limit value is number of pages to buffer on 1 side of the current page.
		//   Normally defaults to 1, which buffers 1 offscreen page on the left and 1 offscreen page on the right.
		// - Assume worst-case scenario where ScrollableView is showing 1st page and only supports scrolling forward.
		//   In this case, cache size of 3 must use offscreen page limit of 2 (ie: current page + 2 pages on right).
		value--;

		// Update the view's offscreen page caching limit.
		mPager.setOffscreenPageLimit(value);
	}

	public void addView(TiViewProxy proxy)
	{
		if (!mViews.contains(proxy)) {
			proxy.setActivity(this.proxy.getActivity());
			proxy.setParent(this.proxy);
			mViews.add(proxy);
			getProxy().setProperty(TiC.PROPERTY_VIEWS, mViews.toArray());
			mAdapter.notifyDataSetChanged();
		}
	}

	public void insertViewsAt(int insertIndex, Object object)
	{
		if (object instanceof TiViewProxy) {
			// insert a single view at insertIndex
			TiViewProxy proxy = (TiViewProxy) object;
			if (!mViews.contains(proxy)) {
				proxy.setActivity(this.proxy.getActivity());
				proxy.setParent(this.proxy);
				mViews.add(insertIndex, proxy);
				getProxy().setProperty(TiC.PROPERTY_VIEWS, mViews.toArray());
				mAdapter.notifyDataSetChanged();
			}
		} else if (object instanceof Object[]) {
			// insert many views at insertIndex
			boolean changed = false;
			Object[] views = (Object[]) object;
			Activity activity = this.proxy.getActivity();
			for (int i = 0; i < views.length; i++) {
				if (views[i] instanceof TiViewProxy) {
					TiViewProxy tv = (TiViewProxy) views[i];
					tv.setActivity(activity);
					tv.setParent(this.proxy);
					mViews.add(insertIndex, tv);
					changed = true;
				}
			}
			if (changed) {
				getProxy().setProperty(TiC.PROPERTY_VIEWS, mViews.toArray());
				mAdapter.notifyDataSetChanged();
			}
		}
	}

	public void removeViewByIndex(int index)
	{
		if ((index >= 0) && (index < mViews.size())) {
			removeView(mViews.get(index));
		}
	}

	public void removeView(TiViewProxy proxy)
	{
		if (mViews.contains(proxy)) {
			if (mCurIndex > 0 && mCurIndex == (mViews.size() - 1)) {
				setCurrentPage(mCurIndex - 1);
			}
			mViews.remove(proxy);
			proxy.releaseViews();
			proxy.setParent(null);
			getProxy().setProperty(TiC.PROPERTY_VIEWS, mViews.toArray());
			mAdapter.notifyDataSetChanged();
		}
	}

	public void showPager()
	{
		View v = null;
		v = mContainer.findViewById(PAGE_LEFT_ID);
		if (v != null) {
			v.setVisibility(mCurIndex > 0 ? View.VISIBLE : View.INVISIBLE);
		}

		v = mContainer.findViewById(PAGE_RIGHT_ID);
		if (v != null) {
			v.setVisibility(mCurIndex < (mViews.size() - 1) ? View.VISIBLE : View.INVISIBLE);
		}

		mPagingControl.setVisibility(View.VISIBLE);
		((ScrollableViewProxy) proxy).setPagerTimeout();
	}

	public void hidePager()
	{
		mPagingControl.setVisibility(View.INVISIBLE);
	}

	public void moveNext()
	{
		move(mCurIndex + 1, true);
	}

	public void movePrevious()
	{
		move(mCurIndex - 1, true);
	}

	private void move(int index, boolean smoothScroll)
	{
		if (index < 0 || index >= mViews.size()) {
			if (Log.isDebugModeEnabled()) {
				Log.w(TAG, "Request to move to index " + index + " ignored, as it is out-of-bounds.", Log.DEBUG_MODE);
			}
			return;
		}
		mCurIndex = index;
		mPager.setCurrentItem(index, smoothScroll);
	}

	public void scrollTo(Object view)
	{
		if (view instanceof Number) {
			move(((Number) view).intValue(), true);
		} else if (view instanceof TiViewProxy) {
			move(mViews.indexOf(view), true);
		}
	}

	public int getCurrentPage()
	{
		return mCurIndex;
	}

	public void setCurrentPage(Object view)
	{
		if (view instanceof Number) {
			move(((Number) view).intValue(), false);
		} else if (Log.isDebugModeEnabled()) {
			Log.w(TAG, "Request to set current page is ignored, as it is not a number.", Log.DEBUG_MODE);
		}
	}

	public void setEnabled(Object value)
	{
		mEnabled = TiConvert.toBoolean(value);
	}

	public boolean getEnabled()
	{
		return mEnabled;
	}

	private void clearViewsList()
	{
		if (mViews == null || mViews.size() == 0) {
			return;
		}
		for (TiViewProxy viewProxy : mViews) {
			viewProxy.releaseViews();
			viewProxy.setParent(null);
		}
		mViews.clear();
	}

	public void setViews(Object viewsObject)
	{
		boolean changed = false;
		int oldSize = mViews.size();

		clearViewsList();

		if (viewsObject instanceof Object[]) {
			Object[] views = (Object[]) viewsObject;

			if (oldSize > 0 && views.length == 0) {
				changed = true;
			}

			Activity activity = this.proxy.getActivity();
			for (int i = 0; i < views.length; i++) {
				if (views[i] instanceof TiViewProxy) {
					TiViewProxy tv = (TiViewProxy) views[i];
					tv.setActivity(activity);
					tv.setParent(this.proxy);
					mViews.add(tv);
					changed = true;
				}
			}
		}
		if (changed) {
			mAdapter.notifyDataSetChanged();
		}
	}

	public ArrayList<TiViewProxy> getViews()
	{
		return mViews;
	}

	private void setPadding(HashMap<String, Object> d)
	{
		int paddingLeft = mPager.getPaddingLeft();
		int paddingRight = mPager.getPaddingRight();
		int paddingTop = mPager.getPaddingTop();
		int paddingBottom = mPager.getPaddingBottom();

		if (d.containsKey(TiC.PROPERTY_LEFT)) {
			paddingLeft = TiConvert.toInt(d.get(TiC.PROPERTY_LEFT), 0);
		}

		if (d.containsKey(TiC.PROPERTY_RIGHT)) {
			paddingRight = TiConvert.toInt(d.get(TiC.PROPERTY_RIGHT), 0);
		}

		if (d.containsKey(TiC.PROPERTY_TOP)) {
			paddingTop = TiConvert.toInt(d.get(TiC.PROPERTY_TOP), 0);
		}

		if (d.containsKey(TiC.PROPERTY_BOTTOM)) {
			paddingBottom = TiConvert.toInt(d.get(TiC.PROPERTY_BOTTOM), 0);
		}

		mPager.setPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
	}

	@Override
	public void release()
	{
		if (mPager != null) {
			for (int i = mPager.getChildCount() - 1; i >= 0; i--) {
				mPager.removeViewAt(i);
			}
		}
		if (mViews != null) {
			for (TiViewProxy viewProxy : mViews) {
				viewProxy.releaseViews();
				viewProxy.setParent(null);
			}
			mViews.clear();
		}
		super.release();
	}

	public static class ViewPagerAdapter extends PagerAdapter
	{
		private final ArrayList<TiViewProxy> mViewProxies;
		public ViewPagerAdapter(Activity activity, ArrayList<TiViewProxy> viewProxies)
		{
			if (viewProxies == null) {
				throw new IllegalArgumentException();
			}
			mViewProxies = viewProxies;
		}

		@Override
		public void destroyItem(View container, int position, Object object)
		{
			// Validate.
			if ((container instanceof ViewPager) == false) {
				return;
			}

			// Remove the item's view from the ViewPager.
			// Note: The Titanium view's is wrapped by a "TiCompositeLayout" parent view.
			if (object instanceof View) {
				ViewParent parentView = ((View) object).getParent();
				if (parentView instanceof ViewGroup) {
					if ((parentView instanceof ViewPager) == false) {
						((ViewPager) container).removeView((View) parentView);
					}
					((ViewGroup) parentView).removeView((View) object);
				}
			}

			// Release/Destroy the page's native views.
			if ((position >= 0) && (position < mViewProxies.size())) {
				TiViewProxy proxy = mViewProxies.get(position);
				if (proxy != null) {
					proxy.releaseViews();
				}
			}
		}

		@Override
		public void finishUpdate(View container)
		{
		}

		@Override
		public int getCount()
		{
			return mViewProxies.size();
		}

		@Override
		public Object instantiateItem(View container, int position)
		{
			// Validate arguments.
			if ((container instanceof ViewPager) == false) {
				return null;
			}
			if ((position < 0) || (position >= mViewProxies.size())) {
				return null;
			}

			// Acquire the requested page view.
			View pageView = null;
			ViewGroup.LayoutParams layoutParams = null;
			TiViewProxy proxy = mViewProxies.get(position);
			if (proxy != null) {
				TiUIView uiView = proxy.getOrCreateView();
				if (uiView != null) {
					pageView = uiView.getOuterView();
					layoutParams = uiView.getLayoutParams();
				}
			}
			if (pageView == null) {
				return null;
			}

			// Wrap the page view in a Titanium composite layout.
			// Note: Needed to support Titanium's custom width/height/top/bottom/left/right properties.
			TiCompositeLayout pageLayout = new TiCompositeLayout(container.getContext());
			ViewPager pager = (ViewPager) container;
			{
				// Remove page view's previous layout wrapper.
				ViewParent parentView = pageView.getParent();
				if (parentView instanceof ViewGroup) {
					pager.removeView((View) parentView);
					((ViewGroup) parentView).removeView(pageView);
				}

				// Add page view to composite layout wrapper.
				pageLayout.addView(pageView, layoutParams);
			}

			// Add the view to the ViewPager.
			layoutParams = new ViewGroup.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
			if (position < pager.getChildCount()) {
				pager.addView(pageLayout, position, layoutParams);
			} else {
				pager.addView(pageLayout, layoutParams);
			}

			// Return the indexed page view.
			return pageView;
		}

		@Override
		public boolean isViewFromObject(View view, Object obj)
		{
			if (view == null) {
				return (obj == null);
			}
			if (obj == null) {
				return false;
			}
			if ((view instanceof ViewGroup) && (((ViewGroup) view).getChildCount() > 0)) {
				return (obj == ((ViewGroup) view).getChildAt(0));
			}
			return false;
		}

		@Override
		public void restoreState(Parcelable state, ClassLoader loader)
		{
		}

		@Override
		public Parcelable saveState()
		{
			return null;
		}

		@Override
		public void startUpdate(View container)
		{
		}

		@Override
		public int getItemPosition(Object object)
		{
			return mViewProxies.contains(object) ? POSITION_UNCHANGED : POSITION_NONE;
		}
	}

	private class TiViewPagerLayout extends FrameLayout
	{
		public TiViewPagerLayout(Context context)
		{
			super(context);

			// Container can't be focusable inside list view,
			// otherwise it will be focused and subsequent layout passes wont happen.
			boolean focusable = true;
			if (isListViewParent(proxy)) {
				focusable = false;
			}
			setFocusable(focusable);
			setFocusableInTouchMode(focusable);
			setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
		}

		private boolean isListViewParent(TiViewProxy proxy)
		{
			if (proxy == null) {
				return false;
			}
			if (proxy instanceof ListItemProxy) {
				return true;
			}
			TiViewProxy parent = proxy.getParent();
			if (parent != null) {
				return isListViewParent(parent);
			}
			return false;
		}

		@Override
		public boolean onTrackballEvent(MotionEvent event)
		{
			// Any trackball activity should show the pager.
			if (shouldShowPager() && mPagingControl.getVisibility() != View.VISIBLE) {
				showPager();
			}
			return super.onTrackballEvent(event);
		}

		@Override
		public boolean dispatchKeyEvent(KeyEvent event)
		{
			boolean handled = false;
			if (event.getAction() == KeyEvent.ACTION_DOWN) {
				switch (event.getKeyCode()) {
					case KeyEvent.KEYCODE_DPAD_LEFT: {
						movePrevious();
						handled = true;
						break;
					}
					case KeyEvent.KEYCODE_DPAD_RIGHT: {
						moveNext();
						handled = true;
						break;
					}
				}
			}
			return handled || super.dispatchKeyEvent(event);
		}
	}
}
