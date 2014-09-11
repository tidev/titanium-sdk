/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.kroll.common.Log;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.widget.tabgroup.TiUIActionBarTab.TabFragment;

import android.app.Activity;
import android.support.v7.app.ActionBar;
import android.support.v7.app.ActionBarActivity;
import android.support.v7.app.ActionBar.Tab;
import android.support.v7.app.ActionBar.TabListener;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.v4.app.FragmentManager;
import android.view.ViewGroup;
import android.view.MotionEvent;

/**
 * Tab group implementation using the Action Bar navigation tabs.
 * 
 * When the target SDK version and device framework level is 11 or higher
 * we will use this implementation to place the tabs inside the action bar.
 * Each tab window provides a fragment which is made visible by a fragment
 * transaction when it is selected.
 * 
 * See http://developer.android.com/guide/topics/ui/actionbar.html#Tabs
 * for further details on how Action bar tabs work.
 */
public class TiUIActionBarTabGroup extends TiUIAbstractTabGroup implements TabListener, OnLifecycleEvent {
	private static final String TAG = "TiUIActionBarTabGroup";
	private ActionBar actionBar;
	private boolean activityPaused = false;
	// Default value is true. Set it to false if the tab is selected using the selectTab() method.
	private boolean tabClicked = true;
	private boolean tabsDisabled = false;
	private Fragment savedFragment = null;
	private boolean savedSwipeable;
	private boolean swipeable;

	// The tab to be selected once the activity resumes.
	private Tab selectedTabOnResume;
	private WeakReference<TiBaseActivity> tabActivity;

	private TabGroupPagerAdapter tabGroupPagerAdapter;
	private ViewPager tabGroupViewPager;


	public TiUIActionBarTabGroup(TabGroupProxy proxy, TiBaseActivity activity) {
		super(proxy, activity);

		tabActivity = new WeakReference<TiBaseActivity>(activity);

		activity.addOnLifecycleEventListener(this);

		// Setup the action bar for navigation tabs.
		actionBar = activity.getSupportActionBar();
		actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);
		actionBar.setDisplayShowTitleEnabled(true);

		swipeable = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_SWIPEABLE), true);

		tabGroupPagerAdapter = new TabGroupPagerAdapter(((ActionBarActivity) activity).getSupportFragmentManager());

		tabGroupViewPager = (new ViewPager(proxy.getActivity()){
			@Override
			public boolean onTouchEvent(MotionEvent event) {
				return swipeable ? super.onTouchEvent(event) : false;
			}

			@Override
			public boolean onInterceptTouchEvent(MotionEvent event) {
				return swipeable ? super.onInterceptTouchEvent(event) : false;
			}
		});

		tabGroupViewPager.setAdapter(tabGroupPagerAdapter);

		tabGroupViewPager.setOnPageChangeListener(new ViewPager.OnPageChangeListener() {

			@Override
			public void onPageSelected(int position) {
				// on changing the page simply select the tab
				actionBar.setSelectedNavigationItem(position);
			}

			@Override
			public void onPageScrolled(int arg0, float arg1, int arg2) {}

			@Override
			public void onPageScrollStateChanged(int arg0) {}

		});

		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		params.autoFillsHeight = true;
		params.autoFillsWidth = true;
		((ViewGroup) activity.getLayout()).addView(tabGroupViewPager, params);
		setNativeView(tabGroupViewPager);
	}

	private class TabGroupPagerAdapter extends FragmentPagerAdapter {
		ArrayList<WeakReference<Fragment>> registeredFragments = new ArrayList<WeakReference<Fragment>>();

		public TabGroupPagerAdapter(FragmentManager fm) {
			super(fm);
		}

		public Fragment getRegisteredFragment(int position) {
			if (position >= registeredFragments.size()) {
				return null;
			}
			WeakReference<Fragment> weakReferenceFragment = registeredFragments.get(position);
			if (weakReferenceFragment != null) {
				return weakReferenceFragment.get();
			}
			return null;
		}

		@Override
		public Object instantiateItem(ViewGroup container, int position) {
			Fragment fragment = (Fragment) super.instantiateItem(container, position);
			WeakReference<Fragment> weakReferenceFragment = new WeakReference<Fragment>(fragment);
			for (int i = registeredFragments.size(); i < position; i++) {
				// for example if tab 2 is instantiated before tab 1
				registeredFragments.add(i, null);
			}
			if (position > registeredFragments.size() - 1) {
				registeredFragments.add(position, weakReferenceFragment);
			} else {
				registeredFragments.set(position, weakReferenceFragment);
			}
			return fragment;
		}

		@Override
		public void destroyItem(ViewGroup container, int position, Object object) {
			registeredFragments.remove(position);
			super.destroyItem(container, position, object);
		}

		@Override
		public Fragment getItem(int i) {
			if (tabsDisabled) {
				return savedFragment;
			} else {
				ActionBar.Tab tab = actionBar.getTabAt(i);
				TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();
				if (tabView.fragment == null) {
					tabView.initializeFragment();
				}
				return tabView.fragment;
			}
		}

		@Override
		public int getCount() {
			if (tabsDisabled) {
				return 1;
			} else {
				return actionBar.getNavigationItemCount();
			}
		}

		@Override
		public int getItemPosition(Object object) {
			TabFragment fragment = (TabFragment) object;
			if (fragment.getTab() == null){
				return POSITION_NONE;
			}
			String fragmentTag = fragment.getTag();
			for (int i=0; i < registeredFragments.size(); i++){
				Fragment registeredFragment = getRegisteredFragment(i);
				if (registeredFragment != null) {
					if (fragmentTag.equals(registeredFragment.getTag())){
						return i;
					}
				}
			}
			return POSITION_NONE;
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		// TODO Auto-generated method stub
		super.processProperties(d);
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			actionBar.setTitle(d.getString(TiC.PROPERTY_TITLE));
		}
		if (d.containsKey(TiC.PROPERTY_SWIPEABLE)) {
			swipeable = d.getBoolean(TiC.PROPERTY_SWIPEABLE);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// TODO Auto-generated method stub
		if (key.equals(TiC.PROPERTY_TITLE)) {
			actionBar.setTitle(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_SWIPEABLE)) {
			swipeable = TiConvert.toBoolean(newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void addTab(TabProxy tabProxy) {
		ActionBar.Tab tab = actionBar.newTab();
		tab.setTabListener(this);

		// Create a view for this tab proxy.
		TiUIActionBarTab actionBarTab = new TiUIActionBarTab(tabProxy, tab);
		tabProxy.setView(actionBarTab);

		// Add the new tab, but don't select it just yet.
		// The selected tab is set once the group is done opening.
		actionBar.addTab(tab, false);
		tabGroupPagerAdapter.notifyDataSetChanged();
		int numTabs = actionBar.getTabCount();
		int offscreen = numTabs > 1 ? numTabs - 1 : 1; // Must be at least 1
		tabGroupViewPager.setOffscreenPageLimit(offscreen);
	}

	@Override
	public void removeTab(TabProxy tabProxy) {
		int tabIndex = ((TabGroupProxy) proxy).getTabIndex(tabProxy);
		TabFragment fragment = (TabFragment) tabGroupPagerAdapter.getRegisteredFragment(tabIndex);
		TiUIActionBarTab tabView = (TiUIActionBarTab) tabProxy.peekView();
		actionBar.removeTab(tabView.tab);
		if (fragment != null){
			fragment.setTab(null);
		}
		tabGroupPagerAdapter.notifyDataSetChanged();
	}

	@Override
	public void selectTab(TabProxy tabProxy) {
		TiUIActionBarTab tabView = (TiUIActionBarTab) tabProxy.peekView();
		if (tabView == null) {
			// The tab has probably not been added to this group yet.
			return;
		}

		tabClicked = false;
		if (activityPaused) {
			// Action bar does not allow tab selection if the activity is paused.
			// Postpone the tab selection until the activity resumes.
			selectedTabOnResume = tabView.tab;

		} else {
			actionBar.selectTab(tabView.tab);
		}
	}

	@Override
	public TabProxy getSelectedTab() {
		ActionBar.Tab tab;
		try {
			tab = actionBar.getSelectedTab();
		} catch (NullPointerException e) {
			//This is a workaround for AppCompat actionbar 4.0+. There is a bug in AppCompat source that
			//will cause a null pointer exception if no tab is selected instead of returning null. See source at:
			//https://android.googlesource.com/platform/frameworks/support/+/89208232f3b5d1451408d787872504a190bc7ee0/v7/appcompat/src/android/support/v7/app/ActionBarImplICS.java
			//line 259.
			tab = null;
		}
		if (tab == null) {
			// There is no selected tab currently for this action bar.
			// This probably means the tab group contains no tabs.
			return null;
		}

		TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();
		return (TabProxy) tabView.getProxy();
	}

	@Override
	public void onTabSelected(Tab tab, FragmentTransaction ft) {
		TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();

		if (tabView.fragment == null) {
			// If not we will create it here then attach it
			// to the tab group activity inside the "content" container.
			tabView.initializeFragment();
		}

		tabGroupViewPager.setCurrentItem(tab.getPosition());
		TabProxy tabProxy = (TabProxy) tabView.getProxy();
		((TabGroupProxy) proxy).onTabSelected(tabProxy);
		if (tabClicked) {
			tabProxy.fireEvent(TiC.EVENT_CLICK, null);
		} else {
			tabClicked = true;
		}
		tabProxy.fireEvent(TiC.EVENT_SELECTED, null, false);
	}

	@Override
	public void onTabUnselected(Tab tab, FragmentTransaction ft) {
		TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();
		TabProxy tabProxy = (TabProxy) tabView.getProxy();
		tabProxy.fireEvent(TiC.EVENT_UNSELECTED, null, false);
	}

	@Override
	public void onTabReselected(Tab tab, FragmentTransaction ft) {
	}

	@Override
	public void onStart(Activity activity) { }

	@Override
	public void onResume(Activity activity) {
		activityPaused = false;

		if (selectedTabOnResume != null) {
			selectedTabOnResume.select();
			selectedTabOnResume = null;
		}
	}

	@Override
	public void onPause(Activity activity) {
		activityPaused = true;
	}

	@Override
	public void onStop(Activity activity) { }

	@Override
	public void onDestroy(Activity activity) { }

	public void disableTabNavigation(boolean disable) {
		if (disable && actionBar.getNavigationMode() == ActionBar.NAVIGATION_MODE_TABS) {
			savedSwipeable = swipeable;
			swipeable = false;
			ActionBar.Tab tab = actionBar.getSelectedTab();
			if (tab == null) {
				Log.e(TAG, "No selected tab when trying to disable Tab Navigation");
				return;
			}
			TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();
			savedFragment = tabView.fragment;
			tabsDisabled = true;
			tabGroupPagerAdapter.notifyDataSetChanged();
			actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_STANDARD);
		} else if (!disable && actionBar.getNavigationMode() == ActionBar.NAVIGATION_MODE_STANDARD){
			tabsDisabled = false;
			savedFragment = null;
			actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);
			tabGroupPagerAdapter.notifyDataSetChanged();
			swipeable = savedSwipeable;
		}
	}

}
