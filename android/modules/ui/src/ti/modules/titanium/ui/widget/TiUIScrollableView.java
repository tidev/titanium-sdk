/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiEventHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import ti.modules.titanium.ui.ScrollableViewProxy;
import android.app.Activity;
import android.content.Context;
import android.os.Parcelable;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.View.OnClickListener;
import android.widget.RelativeLayout;

public class TiUIScrollableView extends TiUIView
{
	private static final String TAG = "TiUIScrollableView";
	private static final String PROPERTY_SHOW_PAGING_CONTROL = "showPagingControl";
	private static final String PROPERTY_VIEWS = "views";
	private static final String PROPERTY_CURRENT_PAGE = "currentPage";

	private static final int PAGE_LEFT = 200;
	private static final int PAGE_RIGHT = 201;

	private final ViewPager mPager;
	private final ArrayList<TiViewProxy> mViews;
	private final ViewPagerAdapter mAdapter;
	private final TiCompositeLayout mContainer;
	private final RelativeLayout mPagingControl;

	private int mCurIndex = -1;
	private boolean mShowPagingControl = false;

	public TiUIScrollableView(ScrollableViewProxy proxy)
	{
		super(proxy);
		mViews = new ArrayList<TiViewProxy>();
		mAdapter = new ViewPagerAdapter(proxy.getTiContext().getActivity(), mViews);
		mPager = buildViewPager(proxy.getContext(), mAdapter);

		mContainer = new TiViewPagerLayout(proxy.getContext());
		mContainer.addView(mPager, buildFillLayoutParams());

		mPagingControl = buildPagingControl(proxy.getContext());
		mContainer.addView(mPagingControl, buildFillLayoutParams());

		setNativeView(mContainer);
	}

	private ViewPager buildViewPager(Context context, ViewPagerAdapter adapter)
	{
		ViewPager pager = new ViewPager(context);
		pager.setAdapter(adapter);
		pager.setOnPageChangeListener(new ViewPager.SimpleOnPageChangeListener()
		{
			@Override
			public void onPageSelected(int position)
			{
				super.onPageSelected(position);
				int oldIndex = mCurIndex;
				mCurIndex = position;
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
						// don't want a scroll to fire.
						((ScrollableViewProxy)proxy).fireScroll(mCurIndex);
					}
				}
				if (mShowPagingControl) {
					showPager();
				}
			}
		});
		return pager;
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
		layout = new RelativeLayout(proxy.getContext());
		layout.setFocusable(false);
		layout.setFocusableInTouchMode(false);

		TiArrowView left = new TiArrowView(proxy.getContext());
		left.setVisibility(View.INVISIBLE);
		left.setId(PAGE_LEFT);
		left.setMinimumWidth(80); // TODO density?
		left.setMinimumHeight(80);
		left.setOnClickListener(new OnClickListener(){
			public void onClick(View v)
			{
				movePrevious();
			}});
		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		layout.addView(left, params);

		TiArrowView right = new TiArrowView(proxy.getContext());
		right.setLeft(false);
		right.setVisibility(View.INVISIBLE);
		right.setId(PAGE_RIGHT);
		right.setMinimumWidth(80); // TODO density?
		right.setMinimumHeight(80);
		right.setOnClickListener(new OnClickListener(){
			public void onClick(View v)
			{
				moveNext();
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
		if (d.containsKey(PROPERTY_VIEWS)) {
			setViews(d.get(PROPERTY_VIEWS));
		} 
		if (d.containsKey(PROPERTY_SHOW_PAGING_CONTROL)) {
			mShowPagingControl = TiConvert.toBoolean(d, PROPERTY_SHOW_PAGING_CONTROL);
		}
		if (d.containsKey(PROPERTY_CURRENT_PAGE)) {
			int page = TiConvert.toInt(d, PROPERTY_CURRENT_PAGE);
			if (page > 0) {
				setCurrentPage(page);
			} else {
				mCurIndex = 0;
			}
		} else {
			mCurIndex = 0;
		}

		super.processProperties(d);

		if (mShowPagingControl) {
			showPager();
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy)
	{
		if(PROPERTY_CURRENT_PAGE.equals(key)) {
			setCurrentPage(TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void setShowPagingControl(boolean show)
	{
		mShowPagingControl = show;
	}

	public void addView(TiViewProxy proxy)
	{
		mViews.add(proxy);
		mAdapter.notifyDataSetChanged();
	}

	public void removeView(TiViewProxy proxy)
	{
		if (mViews.contains(proxy)) {
			mViews.remove(proxy);
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

	public void moveNext()
	{
		move(mCurIndex + 1);
	}

	public void movePrevious()
	{
		move(mCurIndex - 1);
	}

	private void move(int index)
	{
		if (index < 0 || index >= mViews.size()) {
			Log.w(TAG, "Request to move to index " + index+ " ignored, as it is out-of-bounds.");
			return;
		}
		mPager.setCurrentItem(index);
	}

	public void scrollTo(Object view)
	{
		if (view instanceof Number) {
			move(((Number) view).intValue());
		} else if (view instanceof TiViewProxy) {
			move(mViews.indexOf(view));
		}
	}

	public int getCurrentPage()
	{
		return mCurIndex;
	}

	public void setCurrentPage(Object view)
	{
		scrollTo(view);
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
		private final Activity mActivity;
		private final ArrayList<TiViewProxy> mViewProxies;
		public ViewPagerAdapter(Activity activity, ArrayList<TiViewProxy> viewProxies)
		{
			mActivity = activity;
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
			TiUIView tiView = tiProxy.getView(mActivity);
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
			super(context);
			setFocusable(true);
			setFocusableInTouchMode(true);
			setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
		}

		@Override
		public boolean onTrackballEvent(MotionEvent event)
		{
			// Any trackball activity should show the pager.
			if (mShowPagingControl && mPagingControl.getVisibility() != View.VISIBLE) {
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
