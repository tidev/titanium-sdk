/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.ArrayList;
import java.lang.Math;

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

import ti.modules.titanium.ui.ScrollableViewProxy;
import ti.modules.titanium.ui.widget.listview.ListItemProxy;

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
import android.view.ViewParent;
import android.view.View.MeasureSpec;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;

@SuppressLint("NewApi")
public class TiUIScrollableView extends TiUIView
{
	private static final String TAG = "TiUIScrollableView";

	private static final int PAGE_LEFT_ID = 200;
	private static final int PAGE_RIGHT_ID = 201;

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
		mContainer.addView(
				mPager, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

		// Add paging controls to container.
		mPagingControl = buildPagingControl(activity);
		mContainer.addView(
				mPagingControl, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

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
			private boolean isValidScroll = false;
			private boolean justFiredDragEnd = false;

			@Override
			public void onPageScrollStateChanged(int scrollState)
			{
				mPager.requestDisallowInterceptTouchEvent(scrollState != ViewPager.SCROLL_STATE_IDLE);

				if ((scrollState == ViewPager.SCROLL_STATE_IDLE) && isValidScroll) {
					int oldIndex = mCurIndex;

					if (mCurIndex >= 0) {
						if (oldIndex >= 0 && oldIndex != mCurIndex && oldIndex < mViews.size()) {
							// Don't know what these focused and unfocused
							// events are good for, but they were in our previous
							// scrollable implementation.
							// cf. https://github.com/appcelerator/titanium_mobile/blob/20335d8603e2708b59a18bafbb91b7292278de8e/android/modules/ui/src/ti/modules/titanium/ui/widget/TiScrollableView.java#L260
							TiEventHelper.fireFocused(mViews.get(oldIndex));
						}

						TiEventHelper.fireUnfocused(mViews.get(mCurIndex));
						if (oldIndex >= 0) {
							// oldIndex will be -1 if the view has just
							// been created and is setting currentPage
							// to something other than 0. In that case we
							// don't want a `scrollend` to fire.
							((ScrollableViewProxy) proxy).fireScrollEnd(mCurIndex, mViews.get(mCurIndex));
						}

						if (shouldShowPager()) {
							showPager();
						}
					}

					// If we don't use this state variable to check if it's a valid
					// scroll, this event will fire when the view is first created
					// because on creation, the scroll state is initialized to
					// `idle` and this handler is called.
					isValidScroll = false;
				} else if (scrollState == ViewPager.SCROLL_STATE_SETTLING) {
					((ScrollableViewProxy) proxy).fireDragEnd(mCurIndex, mViews.get(mCurIndex));

					// Note that we just fired a `dragend` so the `onPageSelected`
					// handler below doesn't fire a `scrollend`.  Read below comment.
					justFiredDragEnd = true;
				}
			}

			@Override
			public void onPageSelected(int page)
			{

				// If we didn't just fire a `dragend` event then this is the case
				// where a user drags the view and settles it on a different view.
				// Since the OS settling logic is never run, the
				// `onPageScrollStateChanged` handler is never run, and therefore
				// we forgot to inform the Javascripters that the user just scrolled
				// their thing.

				if (!justFiredDragEnd && mCurIndex != -1) {
					((ScrollableViewProxy) proxy).fireScrollEnd(mCurIndex, mViews.get(mCurIndex));

					if (shouldShowPager()) {
						showPager();
					}
				}
			}

			@Override
			public void onPageScrolled(int positionRoundedDown, float positionOffset, int positionOffsetPixels)
			{
				if (mViews.isEmpty()) {
					return;
				}

				isValidScroll = true;

				// When we touch and drag the view and hold it inbetween the second
				// and third sub-view, this function will have been called with values
				// similar to:
				//		positionRoundedDown:	1
				//		positionOffset:			 0.5
				// ie, the first parameter is always rounded down; the second parameter
				// is always just an offset between the current and next view, it does
				// not take into account the current view.

				// If we add positionRoundedDown to positionOffset, positionOffset will
				// have the 'correct' value; ie, will be a natural number when we're on
				// one particular view, something.5 when inbetween views, etc.
				float positionFloat = positionOffset + positionRoundedDown;

				// `positionFloat` can now be used to calculate the correct value for
				// the current index. We add 0.5 so that positionFloat will be rounded
				// half up; ie, if it has a value of 1.5, it will be rounded up to 2; if
				// it has a value of 1.4, it will be rounded down to 1.
				mCurIndex = (int) Math.floor(positionFloat + 0.5);
				((ScrollableViewProxy) proxy).fireScroll(mCurIndex, positionFloat, mViews.get(mCurIndex));

				// Note that we didn't just fire a `dragend`.  See the above comment
				// in `onPageSelected`.
				justFiredDragEnd = false;
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
				arrowSizeInPixels = (int)((float)arrowSizeInPixels * metrics.density);
			}
		}

		// Create an overlay view that will display the page controls.
		FrameLayout layout = new FrameLayout(context);
		layout.setFocusable(false);
		layout.setFocusableInTouchMode(false);

		// Add left arrow button to overlay.
		TiArrowView left = new TiArrowView(context);
		left.setVisibility(View.INVISIBLE);
		left.setId(PAGE_LEFT_ID);
		left.setMinimumWidth(arrowSizeInPixels);
		left.setMinimumHeight(arrowSizeInPixels);
		left.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v)
			{
				if (mEnabled) {
					movePrevious();
				}
			}
		});
		layout.addView(left, new FrameLayout.LayoutParams(
				LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT,
				Gravity.LEFT | Gravity.CENTER_VERTICAL));

		// Add right arrow button to overlay.
		TiArrowView right = new TiArrowView(context);
		right.setLeft(false);
		right.setVisibility(View.INVISIBLE);
		right.setId(PAGE_RIGHT_ID);
		right.setMinimumWidth(arrowSizeInPixels);
		right.setMinimumHeight(arrowSizeInPixels);
		right.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v)
			{
				if (mEnabled) {
					moveNext();
				}
			}
		});
		layout.addView(right, new FrameLayout.LayoutParams(
				LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT,
				Gravity.RIGHT | Gravity.CENTER_VERTICAL));

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

		if (d.containsKey("cacheSize")) {
			int cacheSize = TiConvert.toInt(d.get("cacheSize"));
			cacheSize = Math.max(cacheSize, 1);
			mPager.setOffscreenPageLimit(cacheSize);
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
		} else if (TiC.PROPERTY_SCROLLING_ENABLED.equals(key)) {
			mEnabled = TiConvert.toBoolean(newValue);
		} else if (TiC.PROPERTY_OVER_SCROLL_MODE.equals(key)) {
			mPager.setOverScrollMode(TiConvert.toInt(newValue, View.OVER_SCROLL_ALWAYS));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
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
