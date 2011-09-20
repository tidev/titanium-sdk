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
	private static final String SHOW_PAGING_CONTROL = "showPagingControl";
	private static final int PAGE_LEFT = 200;
	private static final int PAGE_RIGHT = 201;

	private final ViewPager mPager;
	private final ArrayList<TiViewProxy> mViews;
	private final ViewPagerAdapter mAdapter;
	private final TiCompositeLayout mContainer;
	private final RelativeLayout mPagingControl;

	private int mCurIndex = 0;
	private boolean mShowPagingControl = false;

	public TiUIScrollableView(ScrollableViewProxy proxy)
	{
		super(proxy);
		Activity activity = proxy.getActivity();
		mViews = new ArrayList<TiViewProxy>();
		mAdapter = new ViewPagerAdapter(activity, mViews);
		mPager = buildViewPager(activity, mAdapter);

		mContainer = new TiViewPager(activity);
		mContainer.addView(mPager, buildFillLayoutParams());

		mPagingControl = buildPagingControl(activity);
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
				mCurIndex = position;
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
		layout.setFocusable(false);
		layout.setFocusableInTouchMode(false);

		TiArrowView left = new TiArrowView(context);
		left.setVisibility(View.INVISIBLE);
		left.setId(PAGE_LEFT);
		left.setMinimumWidth(80); // TODO shouldn't this be convertible
		left.setMinimumHeight(80);
		left.setOnClickListener(new OnClickListener(){
			public void onClick(View v)
			{
				doMovePrevious();
			}});
		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		layout.addView(left, params);

		TiArrowView right = new TiArrowView(context);
		right.setLeft(false);
		right.setVisibility(View.INVISIBLE);
		right.setId(PAGE_RIGHT);
		right.setMinimumWidth(80); // TODO
		right.setMinimumHeight(80);
		right.setOnClickListener(new OnClickListener(){
			public void onClick(View v)
			{
				doMoveNext();
			}});
		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		layout.addView(right, params);

		layout.setVisibility(View.GONE);

		return layout;
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey("views")) {
			setViews(d.get("views"));
		} 
		if (d.containsKey(SHOW_PAGING_CONTROL)) {
			mShowPagingControl = TiConvert.toBoolean(d, SHOW_PAGING_CONTROL);
		}
		if (d.containsKey("currentPage")) {
			doSetCurrentPage(TiConvert.toInt(d, "currentPage"));
		}

		super.processProperties(d);

		if (mShowPagingControl) {
			showPager();
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if("currentPage".equals(key)) {
			doSetCurrentPage(TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
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

	public void doMoveNext()
	{
		doMove(mCurIndex + 1);
	}

	public void doMovePrevious()
	{
		doMove(mCurIndex - 1);
	}

	private void doMove(int index)
	{
		if (index < 0 || index >= mViews.size()) {
			Log.w(TAG, "Request to move to index " + index+ " ignored, as it is out-of-bounds.");
			return;
		}
		mPager.setCurrentItem(index);
	}

	public void doScrollToView(Object view)
	{
		if (view instanceof Number) {
			doMove(((Number) view).intValue());
		} else if (view instanceof TiViewProxy) {
			doMove(mViews.indexOf(view));
		}
	}

	public void setShowPagingControl(boolean showPagingControl)
	{
		// getView().setShowPagingControl(showPagingControl); TODO
	}

	public int getCurrentPage()
	{
		return mCurIndex;
	}

	public void doSetCurrentPage(Object view)
	{
		if (view instanceof Number) {
			doScrollToView(((Number) view).intValue());
		} else if (view instanceof TiViewProxy) {
			doScrollToView(mViews.indexOf(view));
		}
	}

	public void setViews(Object viewsObject)
	{
		boolean changed = false;
		if (mViews != null) {
			mViews.clear();
			changed = true;
		}

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
				Object obj = mPager.getChildAt(i);
				if (obj instanceof TiUIView) {
					((TiUIView) obj).release();
				}
				mPager.removeViewAt(i);
			}
		}
		if (mViews != null) {
			for (int i = mViews.size(); i >= 0; i--) {
				Object obj = mViews.get(i);
				if (obj instanceof TiUIView) {
					((TiUIView) obj).release();
				}
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

	public class TiViewPager extends TiCompositeLayout
	{
		public TiViewPager(Context context)
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
						doMovePrevious();
						handled = true;
						break;
					}
					case KeyEvent.KEYCODE_DPAD_RIGHT: {
						doMoveNext();
						handled = true;
						break;
					}
				}
			}
			return handled || super.dispatchKeyEvent(event);
		}
	}
}
