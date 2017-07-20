/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicLong;

import android.graphics.drawable.ColorDrawable;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle.OnInstanceStateEvent;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.widget.tabgroup.TiUIActionBarTab.TabFragment;
import android.app.Activity;
import android.os.Bundle;
import android.os.Parcelable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.v7.app.ActionBar;
import android.support.v7.app.ActionBar.Tab;
import android.support.v7.app.ActionBar.TabListener;
import android.support.v7.app.AppCompatActivity;
import android.view.MotionEvent;
import android.view.ViewGroup;

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
@SuppressWarnings("deprecation")
public class TiUIActionBarTabGroup extends TiUIAbstractTabGroup implements TabListener, OnLifecycleEvent , OnInstanceStateEvent {
	private static final String TAG = "TiUIActionBarTabGroup";
	private static final String FRAGMENT_ID_ARRAY = "fragmentIdArray";
	private static final String FRAGMENT_TAGS_ARRAYLIST = "fragmentTagsArrayList";
	private static final String SAVED_INITIAL_FRAGMENT_ID = "savedInitialFragmentId";
	private static final String TABS_DISABLED = "tabsDisabled";
	private ActionBar actionBar;
	private boolean activityPaused = false;
	// Default value is true. Set it to false if the tab is selected using the selectTab() method.
	private boolean tabClicked = true;
	private boolean tabsDisabled = false;
	private boolean tempTabsDisabled = false;
	private int numTabsWhenDisabled;
	private boolean savedSwipeable = true;
	private boolean swipeable = true;
	private boolean smoothScrollOnTabClick = true;
	private boolean pendingDisableTabs = false;
	private boolean viewPagerRestoreComplete = false;
	private AtomicLong fragmentIdGenerator = new AtomicLong();
	private ArrayList<String> restoredFragmentTags;
	private ArrayList<Long> restoredFragmentIds = new ArrayList<Long>();
	private ArrayList<Long> fragmentIds = new ArrayList<Long>();
	private ArrayList<String> fragmentTags = new ArrayList<String>();

	// The tab to be selected once the activity resumes.
	private Tab selectedTabOnResume;
	private WeakReference<TiBaseActivity> tabActivity;

	private PagerAdapter tabGroupPagerAdapter;
	private ViewPager tabGroupViewPager;

	public TiUIActionBarTabGroup(TabGroupProxy proxy, TiBaseActivity activity, Bundle savedInstanceState) {
		super(proxy, activity);

		tabActivity = new WeakReference<TiBaseActivity>(activity);

		// We are checking savedInstanceState here since it's too late by the time
		// onRestoreInstanceState is called. TiUIActionBarTabGroup is called during Activity
		// creation, and addTab is often called before onRestoreInstanceState occurs :-(
		// What we're doing here is retrieving the old fragments from the FragmentManager
		// so that addTab will not create new ones every time the Activity is re-created
		// which would cause a massive leak of fragments
		if (savedInstanceState != null){
			long [] fragmentIdArray = savedInstanceState.getLongArray(FRAGMENT_ID_ARRAY);
			restoredFragmentTags = savedInstanceState.getStringArrayList(FRAGMENT_TAGS_ARRAYLIST);
			int numRestoredTabs = 0;
			if (fragmentIdArray != null) {
				numRestoredTabs = fragmentIdArray.length;
			}
			if (numRestoredTabs > 0) {
				// initialFragmentId guaranteed greater than any old ID
				fragmentIdGenerator.set(savedInstanceState.getLong(SAVED_INITIAL_FRAGMENT_ID));
				for (int i = 0; i < numRestoredTabs; i++) {
					restoredFragmentIds.add(new Long(fragmentIdArray[i]));
				}
			}
			// putting into temp until we actually disable tabs
			tempTabsDisabled = savedInstanceState.getBoolean(TABS_DISABLED);
		}
		activity.addOnLifecycleEventListener(this);
		activity.addOnInstanceStateEventListener(this);

		// Setup the action bar for navigation tabs.
		actionBar = activity.getSupportActionBar();
		actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);
		actionBar.setDisplayShowTitleEnabled(true);

		tabGroupPagerAdapter = new TabGroupFragmentPagerAdapter(((AppCompatActivity) activity).getSupportFragmentManager());

		tabGroupViewPager = (new ViewPager(proxy.getActivity()){
			@Override
			public boolean onTouchEvent(MotionEvent event) {
				return swipeable ? super.onTouchEvent(event) : false;
			}

			@Override
			public boolean onInterceptTouchEvent(MotionEvent event) {
				return swipeable ? super.onInterceptTouchEvent(event) : false;
			}

			@Override
			public void onRestoreInstanceState(Parcelable state) {
				super.onRestoreInstanceState(state);
				// ActionBar will freak out if ViewPager changes pages while tabs disabled
				// So we delay the disable until after the ViewPager restore
				viewPagerRestoreComplete = true;
				checkAndDisableTabsIfRequired();
			}
		});

		tabGroupViewPager.setId(android.R.id.tabcontent);

		tabGroupViewPager.setAdapter(tabGroupPagerAdapter);

		tabGroupViewPager.setOnPageChangeListener(new ViewPager.OnPageChangeListener() {

			@Override
			public void onPageSelected(int position) {
				// on changing the page simply select the tab
				if (actionBar.getNavigationMode() == ActionBar.NAVIGATION_MODE_TABS) {
					actionBar.setSelectedNavigationItem(position);
				}
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

	private class TabGroupFragmentPagerAdapter extends FragmentPagerAdapter {

		public TabGroupFragmentPagerAdapter(FragmentManager fm) {
			super(fm);
		}

		// getItem only gets called by the FragmentPagerAdapter when the fragment is not found
		// in the FragmentManager. We construct it and associate it to the tab view.
		@Override
		public Fragment getItem(int i) {
			ActionBar.Tab tab = actionBar.getTabAt(i);
			TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();
			return tabView.createFragment();
		}

		// Android docs say we must override the default implementation if item position can change
		// The FragmentPagerAdapter uses the ID to construct the fragment tag (android:switcher:containerID:ID)
		// and then checks the FragmentManager for presence of said tag. The default Android implementation
		// returns the fragment position in the ViewPager, which is of course wrong when a tab is removed
		// and fragments in higher positions move. Thus we maintain the position and IDs in an ArrayList ourselves
		@Override
		public long getItemId(int position) {
			long id = fragmentIds.get(position).longValue();
			return id;
		}

		@Override
		public int getCount() {
			if (tabsDisabled) {
				// Since we don't want the FragmentPagerAdapter to do all kinds of rearrangements
				// just because we decided to disable tabs. We want the fragments to stay alive for when
				// we reenable the tabs.
				return numTabsWhenDisabled;
			} else {
				return actionBar.getNavigationItemCount();
			}
		}

		// We must override the default implementation since item position can change
		// The default Android implementation returns POSITION_UNCHANGED
		// This gets called when getCount returns an unexpected value (e.g. a tab was removed)
		// and now the FragmentPagerAdapter wants to check where the fragments are.
		// We thus need to maintain a list of fragment tags since that's how we check based on
		// the fragment passed into this function
		@Override
		public int getItemPosition(Object object) {
			Fragment fragment = (Fragment) object;
			String tag = fragment.getTag();
			int index = fragmentTags.indexOf(tag);
			if (index < 0) {
				return POSITION_NONE;
			}
			return index;
		}

		// The implementation in the super class calls getItemId for the fragment in this position
		// The builds a tag based on that ID, and then checks the FragmentManager for that tag.
		// If the tag does not exist getItem is called to construct a new fragment.
		// In any case, the super class method returns the fragment tag which we later use in
		// getItemPosition, for example.
		@Override
		public Object instantiateItem(ViewGroup container, int position) {
			TabFragment fragment = (TabFragment) super.instantiateItem(container, position);
			String tag = fragment.getTag();
			int sanityCheck = fragmentTags.indexOf(tag);
			if (sanityCheck >= 0) {
				// Never happens, just a bug test
				Log.e(TAG, "instantiateItem trying to add an existing tag");
			}
			while (fragmentTags.size() <= position) {
				fragmentTags.add(null);
			}
			fragmentTags.set(position, tag);
			return fragment;
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
		if (d.containsKey(TiC.PROPERTY_SMOOTH_SCROLL_ON_TAB_CLICK)) {
			smoothScrollOnTabClick = d.getBoolean(TiC.PROPERTY_SMOOTH_SCROLL_ON_TAB_CLICK);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// TODO Auto-generated method stub
		if (key.equals(TiC.PROPERTY_TITLE)) {
			actionBar.setTitle(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_SWIPEABLE)) {
			if (tabsDisabled){
				savedSwipeable = TiConvert.toBoolean(newValue);
			} else {
				swipeable = TiConvert.toBoolean(newValue);
			}
		} else if (key.equals(TiC.PROPERTY_SMOOTH_SCROLL_ON_TAB_CLICK)) {
			smoothScrollOnTabClick = TiConvert.toBoolean(newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	private void checkAndDisableTabsIfRequired() {
		if (viewPagerRestoreComplete && pendingDisableTabs) {
			tabsDisabled = tempTabsDisabled;
			tempTabsDisabled = false;
			disableTabNavigation(true);
		}
	}

	@Override
	public void addTab(TabProxy tabProxy) {
		long itemId;
		ActionBar.Tab tab = actionBar.newTab();
		tab.setTabListener(this);
		TiUIActionBarTab actionBarTab = new TiUIActionBarTab(tabProxy, tab);
		boolean shouldUpdateTabsDisabled = false;

		// First check if there are tabs to restore
		// We will know if there are elements in restoredFragmentTagsIds/restoredFragmentTags
		// addTab will be called for those tabs first, and in order
		if (restoredFragmentIds.size() > 0) {
			itemId = restoredFragmentIds.remove(0).longValue();
			String restoredFragmentTag = restoredFragmentTags.remove(0);
			FragmentManager fm = ((AppCompatActivity)tabActivity.get()).getSupportFragmentManager();
			TabFragment fragment = (TabFragment) fm.findFragmentByTag(restoredFragmentTag);
			if (fragment != null) {
				actionBarTab.setTabOnFragment(fragment);
			}
			if (restoredFragmentIds.size() == 0) {
				// We finished restoring tabs. If the Activity was destroyed while tabs were disabled
				// then we disable the tabs when recreating only after the tab group was fully initialized.
				shouldUpdateTabsDisabled = true;
			}
		} else {
			// make sure any new IDs are bigger than any previous ID
			itemId = fragmentIdGenerator.getAndIncrement();
		}

		fragmentIds.add(new Long(itemId));
		tabProxy.setView(actionBarTab);

		// Add the new tab, but don't select it just yet.
		// The selected tab is set once the group is done opening.

		actionBar.addTab(tab, false);
		tabGroupPagerAdapter.notifyDataSetChanged();
		int numTabs = actionBar.getTabCount();
		int offscreen = numTabs > 1 ? numTabs - 1 : 1; // Must be at least 1
		tabGroupViewPager.setOffscreenPageLimit(offscreen);
		if (tempTabsDisabled && shouldUpdateTabsDisabled) {
			pendingDisableTabs = true;
			checkAndDisableTabsIfRequired();
		}

		// Set the background color of the entire tab bar.
		// Note: ActionBar does not support setting individual tab colors. (Would require custom views to be made.)
		Object backgroundColorValue = tabProxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR);
		if ((backgroundColorValue instanceof String) == false) {
			TabGroupProxy tabGroupProxy = tabProxy.getTabGroup();
			if (tabGroupProxy != null) {
				backgroundColorValue = tabGroupProxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR);
			}
		}
		if (backgroundColorValue instanceof String) {
			ColorDrawable drawable = TiConvert.toColorDrawable((String)backgroundColorValue);
			if (drawable != null) {
				actionBar.setStackedBackgroundDrawable(drawable);
			}
		}
	}

	@Override
	public void removeTab(TabProxy tabProxy) {
		int tabIndex = ((TabGroupProxy) proxy).getTabIndex(tabProxy);
		TiUIActionBarTab tabView = (TiUIActionBarTab) tabProxy.peekView();
		actionBar.removeTab(tabView.tab);
		String removedTag = fragmentTags.remove(tabIndex);
		long removedId = fragmentIds.remove(tabIndex).longValue();
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
		tabGroupViewPager.setCurrentItem(tab.getPosition(), smoothScrollOnTabClick);
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
	public void onCreate(Activity activity, Bundle savedInstanceState) {}

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

	// Save our fragment metadata in case the activity is destroyed and later recreated.
	// The FragmentManager saves its fragment state across activity destruction/recreation,
	// thus we need to maintain the state as well in order to prevent the memory leak that
	// would occur if we blindly allowed the creation of new fragments. If the activity
	// is recreated this info is passed into the TiUIActionBarTabGroup constructor
	@Override
	public void onSaveInstanceState(Bundle outState)
	{
		int numTabs;
		if (!tabsDisabled) {
			numTabs = actionBar.getNavigationItemCount();
		} else {
			numTabs = numTabsWhenDisabled;
		}
		outState.putBoolean(TABS_DISABLED, tabsDisabled);
		if (numTabs == 0) {
			outState.remove(FRAGMENT_ID_ARRAY);
			outState.remove(SAVED_INITIAL_FRAGMENT_ID);
			outState.remove(FRAGMENT_TAGS_ARRAYLIST);
			return;
		}
		outState.putStringArrayList(FRAGMENT_TAGS_ARRAYLIST, fragmentTags);
		long[] fragmentIdArray = new long [numTabs];
		outState.putLong(SAVED_INITIAL_FRAGMENT_ID, fragmentIdGenerator.get());
		for (int i = 0; i < numTabs; i++) {
			fragmentIdArray[i] = fragmentIds.get(i).longValue();
		}
		outState.putLongArray(FRAGMENT_ID_ARRAY, fragmentIdArray);
	}

	@Override
	public void onRestoreInstanceState(Bundle savedInstanceState) {}

	public void disableTabNavigation(boolean disable) {
		if (disable && actionBar.getNavigationMode() == ActionBar.NAVIGATION_MODE_TABS) {
			savedSwipeable = swipeable;
			swipeable = false;
			numTabsWhenDisabled = actionBar.getNavigationItemCount();
			tabsDisabled = true;
			actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_STANDARD);
		} else if (!disable && actionBar.getNavigationMode() == ActionBar.NAVIGATION_MODE_STANDARD){
			tabsDisabled = false;
			actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);
			swipeable = savedSwipeable;
		}
	}

}
