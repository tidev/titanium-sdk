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
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiEventHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.ScrollableViewProxy;
import android.app.Activity;
import android.content.Context;
import android.os.Parcelable;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

public class TiUIScrollableView extends TiUIView
{
	private static final String TAG = "TiUIScrollableView";

	private static final int PAGE_LEFT = 200;
	private static final int PAGE_RIGHT = 201;

	private final ViewPager mPager;
	private final ArrayList<TiViewProxy> mViews;
	private final ViewPagerAdapter mAdapter;
	private final TiCompositeLayout mContainer;
	private final RelativeLayout mPagingControl;

	private int mCurIndex = 0;
	private boolean mEnabled = true;

	public TiUIScrollableView(ScrollableViewProxy proxy)
	{
		super(proxy);
		Activity activity = proxy.getActivity();
		mViews = new ArrayList<TiViewProxy>();
		mAdapter = new ViewPagerAdapter(activity, mViews);
		mPager = buildViewPager(activity, mAdapter);

		mContainer = new TiViewPagerLayout(activity);
		mContainer.addView(mPager, buildFillLayoutParams());

		mPagingControl = buildPagingControl(activity);
		mContainer.addView(mPagingControl, buildFillLayoutParams());

		setNativeView(mContainer);
	}

	private ViewPager buildViewPager(Context context, ViewPagerAdapter adapter)
	{
		ViewPager pager = (new ViewPager(context)
		{
			@Override
			public boolean onTouchEvent(MotionEvent event) {
				if (mEnabled) {
					return super.onTouchEvent(event);
				}

				return false;
			}

			@Override
			public boolean onInterceptTouchEvent(MotionEvent event) {
				if (mEnabled) {
					return super.onInterceptTouchEvent(event);
				}

				return false;
			}
		});

		pager.setAdapter(adapter);
		pager.setOnPageChangeListener(new ViewPager.SimpleOnPageChangeListener()
		{
			private boolean isValidScroll = false;
			private boolean justFiredDragEnd = false;

			@Override
			public void onPageScrollStateChanged(int scrollState)
			{
				if ((scrollState == ViewPager.SCROLL_STATE_IDLE) && isValidScroll) {
					int oldIndex = mCurIndex;

					if (mCurIndex >= 0) {
						if (oldIndex >=0 && oldIndex != mCurIndex && oldIndex < mViews.size()) {
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
							((ScrollableViewProxy)proxy).fireScrollEnd(mCurIndex, mViews.get(mCurIndex));
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
					((ScrollableViewProxy)proxy).fireDragEnd(mCurIndex, mViews.get(mCurIndex));

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

				if (!justFiredDragEnd && mCurIndex != -1 && mCurIndex < mViews.size()) {
					((ScrollableViewProxy)proxy).fireScrollEnd(mCurIndex, mViews.get(mCurIndex));

					if (shouldShowPager()) {
						showPager();
					}
				}
			}

			@Override
			public void onPageScrolled(int positionRoundedDown, float positionOffset, int positionOffsetPixels)
			{
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
				((ScrollableViewProxy)proxy).fireScroll(mCurIndex, positionFloat, mViews.get(mCurIndex));

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

	private TiCompositeLayout.LayoutParams buildFillLayoutParams()
	{
		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;
		return params;
	}

	private RelativeLayout buildPagingControl(Context context)
	{
		RelativeLayout layout = new RelativeLayout(context);
		layout.setFocusable(false);
		layout.setFocusableInTouchMode(false);

		TiArrowView left = new TiArrowView(context);
		left.setVisibility(View.INVISIBLE);
		left.setId(PAGE_LEFT);
		left.setMinimumWidth(80); // TODO density?
		left.setMinimumHeight(80);
		left.setOnClickListener(new OnClickListener(){
			public void onClick(View v)
			{
				if (mEnabled) {
					movePrevious();
				}
			}});
		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		layout.addView(left, params);

		TiArrowView right = new TiArrowView(context);
		right.setLeft(false);
		right.setVisibility(View.INVISIBLE);
		right.setId(PAGE_RIGHT);
		right.setMinimumWidth(80); // TODO density?
		right.setMinimumHeight(80);
		right.setOnClickListener(new OnClickListener(){
			public void onClick(View v)
			{
				if (mEnabled) {
					moveNext();
				}
			}});
		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT,
				LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		layout.addView(right, params);

		layout.setVisibility(View.GONE);

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

		super.processProperties(d);

	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy)
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
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void addView(TiViewProxy proxy)
	{
		if (!mViews.contains(proxy)) {
			mViews.add(proxy);
			getProxy().setProperty(TiC.PROPERTY_VIEWS, mViews.toArray());
			mAdapter.notifyDataSetChanged();
		}
	}

	public void removeView(TiViewProxy proxy)
	{
		if (mViews.contains(proxy)) {
			mViews.remove(proxy);
			getProxy().setProperty(TiC.PROPERTY_VIEWS, mViews.toArray());
			mAdapter.notifyDataSetChanged();
		}
	}

	public void removeView(int viewIndex)
	{
		if (viewIndex >= 0 && viewIndex < mViews.size()) {
			mViews.remove(viewIndex);
			getProxy().setProperty(TiC.PROPERTY_VIEWS, mViews.toArray());
			mAdapter.notifyDataSetChanged();
		}
	}

	public void showPager()
	{
		View v = null;
		v = mContainer.findViewById(PAGE_LEFT);
		if (v != null) {
			v.setVisibility(mCurIndex > 0 ? View.VISIBLE : View.INVISIBLE);
		}

		v = mContainer.findViewById(PAGE_RIGHT);
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

	public void moveNext(boolean animated)
	{
		move(mCurIndex + 1, animated);
	}

	public void moveNext()
	{
		moveNext(true);
	}

	public void movePrevious(boolean animated)
	{
		move(mCurIndex - 1, animated);
	}

	public void movePrevious()
	{
		movePrevious(true);
	}

	private void move(int index, boolean animated)
	{
		if (index < 0 || index >= mViews.size()) {
			Log.w(TAG, "Request to move to index " + index+ " ignored, as it is out-of-bounds.");
			return;
		}
		mCurIndex = index;
		mPager.setCurrentItem(index, animated);
	}

	private void move(int index)
	{
		move(index, true);
	}

	public void scrollTo(Object view, boolean animated)
	{
		Log.i(TAG, "scrollTo " + animated);
		if (view instanceof Number) {
			move(((Number) view).intValue(), animated);
		} else if (view instanceof TiViewProxy) {
			move(mViews.indexOf(view), animated);
		}
	}
	public void scrollTo(Object view)
	{
		scrollTo(view, true);
	}

	public int getCurrentPage()
	{
		return mCurIndex;
	}

	public void setCurrentPage(Object view)
	{
		scrollTo(view, false);
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
		}
		mViews.clear();
	}

	public void setViews(Object viewsObject)
	{
		boolean changed = false;
		clearViewsList();

		if (viewsObject instanceof Object[]) {
			Object[] views = (Object[])viewsObject;
			for (int i = 0; i < views.length; i++) {
				if (views[i] instanceof TiViewProxy) {
					TiViewProxy tv = (TiViewProxy)views[i];
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
			for (int i = mPager.getChildCount() - 1; i >=  0; i--) {
				mPager.removeViewAt(i);
			}
		}
		if (mViews != null) {
			for (TiViewProxy viewProxy : mViews) {
				viewProxy.releaseViews();
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
			mViewProxies = viewProxies;
		}

		@Override
		public void destroyItem(View container, int position, Object object)
		{
			((ViewPager) container).removeView((View) object);
			if (position < mViewProxies.size()) {
				TiViewProxy proxy = mViewProxies.get(position);
				proxy.releaseViews();
			}
		}

		@Override
		public void finishUpdate(View container) {}

		@Override
		public int getCount()
		{
			return mViewProxies.size();
		}

		@Override
		public Object instantiateItem(View container, int position)
		{
			ViewPager pager = (ViewPager) container;
			TiViewProxy tiProxy = mViewProxies.get(position);
			TiUIView tiView = tiProxy.getOrCreateView();
			View view = tiView.getNativeView();
			if (view.getParent() != null) {
				pager.removeView(view);
			}
			if (position < pager.getChildCount()) {
				pager.addView(view, position);
			} else {
				pager.addView(view);
			}
			return view;
		}

		@Override
		public boolean isViewFromObject(View view, Object obj)
		{
			return (obj instanceof View && view.equals(obj));
		}

		@Override
		public void restoreState(Parcelable state, ClassLoader loader) {}

		@Override
		public Parcelable saveState() {return null;}

		@Override
		public void startUpdate(View container) {}

		@Override
		public int getItemPosition(Object object)
		{
			if (!mViewProxies.contains(object)) {
				return POSITION_NONE;
			} else {
				return POSITION_UNCHANGED;
			}
		}
	}

	public class TiViewPagerLayout extends TiCompositeLayout
	{
		public TiViewPagerLayout(Context context)
		{
			super(context, proxy);
			setFocusable(true);
			setFocusableInTouchMode(true);
			setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
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
