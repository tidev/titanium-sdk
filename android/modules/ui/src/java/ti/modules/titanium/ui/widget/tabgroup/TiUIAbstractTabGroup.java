/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.content.res.TypedArray;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Bundle;
import android.os.Parcelable;
import android.support.design.widget.TabLayout;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.support.v7.app.AppCompatActivity;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiLifecycle.OnInstanceStateEvent;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

public abstract class TiUIAbstractTabGroup extends TiUIView implements OnLifecycleEvent
{
	/**
	 * Adds the ViewPager and the Controller to the activity's layout.
	 *
	 * @param activity the activity to be attached to.
	 */
	public abstract void addViews(TiBaseActivity activity);

	/**
	 * Adds an item in the Controller for a corresponding tab.
	 *
	 * @param tabProxy proxy to be parsed for tab item.
	 */
	public abstract void addTabItemInController(TabProxy tabProxy);

	/**
	 * Removes an item from the TabGroup controller for a specific position.
	 *
	 * @param position the position of the removed item.
	 */
	public abstract void removeTabItemFromController(int position);

	/**
	 * Selects an item from the Controller with a specific position.
	 *
	 * @param position the position of the item to be selected.
	 */
	public abstract void selectTabItemInController(int position);
	/**
	 * Changes the selected tab of the group.
	 *
	 * @param tabProxy the tab that will become selected
	 */
	public abstract void selectTab(TabProxy tabProxy);
	/**
	 * Changes the controller's background color.
	 *
	 * @param drawable the new background drawable.
	 */
	public abstract void setBackgroundDrawable(Drawable drawable);

	protected static final String TAG = "TiUITabLayoutTabGroup";
	protected static final String WARNING_LAYOUT_MESSAGE = "Trying to customize an unknown layout, sticking to the default one";
	private static final String FRAGMENT_ID_ARRAY = "fragmentIdArray";
	private static final String FRAGMENT_TAGS_ARRAYLIST = "fragmentTagsArrayList";
	private static final String SAVED_INITIAL_FRAGMENT_ID = "savedInitialFragmentId";
	private static final String TABS_DISABLED = "tabsDisabled";

	private boolean activityPaused = false;
	// Default value is true. Set it to false if the tab is selected using the selectTab() method.
	private boolean tabClicked = true;
	protected boolean swipeable = true;

	protected boolean smoothScrollOnTabClick = true;
	private AtomicLong fragmentIdGenerator = new AtomicLong();
	private ArrayList<String> restoredFragmentTags;

	private ArrayList<Long> restoredFragmentIds = new ArrayList<Long>();

	// The tab to be selected once the activity resumes.
	private TabLayout.Tab selectedTabOnResume;
	protected boolean viewPagerRestoreComplete = false;
	protected PagerAdapter tabGroupPagerAdapter;
	protected ViewPager tabGroupViewPager;
	protected boolean tabsDisabled = false;
	protected boolean pendingDisableTabs = false;
	protected boolean tempTabsDisabled = false;
	protected int numTabsWhenDisabled;
	protected boolean savedSwipeable = true;
	protected ArrayList<Long> fragmentIds = new ArrayList<Long>();
	protected ArrayList<String> fragmentTags = new ArrayList<String>();
	protected int colorPrimaryInt;

	private ArrayList<TiUIAbstractTab> tabs = new ArrayList<>();

	public TiUIAbstractTabGroup(TabGroupProxy proxy, TiBaseActivity activity, Bundle savedInstanceState)
	{
		super(proxy);

		TypedValue typedValue = new TypedValue();
		TypedArray colorPrimary = activity.obtainStyledAttributes(typedValue.data, new int[] { android.R.attr.colorPrimary });
		colorPrimaryInt = colorPrimary.getColor(0, 0);

		tabGroupPagerAdapter =
			new TabGroupFragmentPagerAdapter(((AppCompatActivity) activity).getSupportFragmentManager());

		tabGroupViewPager = (new ViewPager(proxy.getActivity()) {
			@Override
			public boolean onTouchEvent(MotionEvent event)
			{
				return swipeable ? super.onTouchEvent(event) : false;
			}

			@Override
			public boolean onInterceptTouchEvent(MotionEvent event)
			{
				return swipeable ? super.onInterceptTouchEvent(event) : false;
			}

			@Override
			public void onRestoreInstanceState(Parcelable state)
			{
				super.onRestoreInstanceState(state);
				// ActionBar will freak out if ViewPager changes pages while tabs disabled
				// So we delay the disable until after the ViewPager restore
				viewPagerRestoreComplete = true;
				checkAndDisableTabsIfRequired();
			}
		});

		tabGroupViewPager.setId(android.R.id.tabcontent);

		tabGroupViewPager.setAdapter(tabGroupPagerAdapter);

		tabGroupViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
			@Override
			public void onPageSelected(int position)
			{
				// On changing the page simply select the tab with the same position.
				selectTabItemInController(position);
			}

			@Override
			public void onPageScrolled(int arg0, float arg1, int arg2)
			{
			}

			@Override
			public void onPageScrollStateChanged(int arg0)
			{
			}
		});
		addViews(activity);
	}

	protected void checkAndDisableTabsIfRequired()
	{
		if (viewPagerRestoreComplete && pendingDisableTabs) {
			tabsDisabled = tempTabsDisabled;
			tempTabsDisabled = false;
			disableTabNavigation(true);
		}
	}

	public abstract void disableTabNavigation(boolean disable);

	/**
	 * Add the provided tab to this group.
	 *
	 * Implementations may automatically select the first tab
	 * added, but must not call {@link TabGroupProxy#onTabSelected(TabProxy)}
	 * when doing so.
	 */
	public void addTab(TabProxy tabProxy) {
		long itemId;

		TiUIAbstractTab abstractTab = new TiUIAbstractTab(tabProxy);
		tabs.add(abstractTab);
		boolean shouldUpdateTabsDisabled = false;

		// First check if there are tabs to restore
		// We will know if there are elements in restoredFragmentTagsIds/restoredFragmentTags
		// addTab will be called for those tabs first, and in order
		if (restoredFragmentIds.size() > 0) {
			itemId = restoredFragmentIds.remove(0).longValue();
			String restoredFragmentTag = restoredFragmentTags.remove(0);
			FragmentManager fm = ((AppCompatActivity) proxy.getActivity()).getSupportFragmentManager();
			if (restoredFragmentIds.size() == 0) {
				// We finished restoring tabs. If the Activity was destroyed while tabs were disabled
				// then we disable the tabs when recreating only after the tab group was fully initialized.
				shouldUpdateTabsDisabled = true;
			}
		} else {
			// make sure any new IDs are bigger than any previous ID
			itemId = fragmentIdGenerator.getAndIncrement();
		}

		tabProxy.setView(abstractTab);
		fragmentIds.add(new Long(itemId));

		// Add the new tab, but don't select it just yet.
		// The selected tab is set once the group is done opening.

		tabGroupPagerAdapter.notifyDataSetChanged();
		int offscreen = 1;
		tabGroupViewPager.setOffscreenPageLimit(offscreen);
		if (tempTabsDisabled && shouldUpdateTabsDisabled) {
			pendingDisableTabs = true;
			checkAndDisableTabsIfRequired();
		}

		addTabItemInController(tabProxy);
	}

	protected RippleDrawable createBackgroundDrawableForState(TabProxy tabProxy, int stateToUse) {
		StateListDrawable stateListDrawable = new StateListDrawable();
		int colorInt;
		// If the TabGroupd has backgroundColor property, use it. If not - use the primaryColor of the theme.
		colorInt = proxy.hasPropertyAndNotNull(TiC.PROPERTY_TABS_BACKGROUND_COLOR) ? TiColorHelper.parseColor(proxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR).toString()) : colorPrimaryInt;
		// If the Tab has its own backgroundColor property, use it instead.
		colorInt = tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BACKGROUND_COLOR) ? TiColorHelper.parseColor(tabProxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR).toString()) : colorInt;
		stateListDrawable.addState(new int[] {-stateToUse}, new ColorDrawable(colorInt));
		// Take the TabGroup tabsBackgroundSelectedProperty.
		colorInt = proxy.hasPropertyAndNotNull(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR) ? TiColorHelper.parseColor(proxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_SELECTED_COLOR).toString()) : colorInt;
		// If a tab specific background color is defined for selected state, use it instead.
		colorInt = tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BACKGROUND_FOCUSED_COLOR) ? TiColorHelper.parseColor(tabProxy.getProperty(TiC.PROPERTY_BACKGROUND_FOCUSED_COLOR).toString()) : colorInt;
		stateListDrawable.addState(new int[] {stateToUse}, new ColorDrawable(colorInt));

		// ActionBar Tabs had rippble effect by default, but support library TabLayout does not have ripple effect
		// out of the box, so we create a ripple drawable for that.

		// Set the ripple state.
		int[][] rippleStates = new int[][] {new int[] {android.R.attr.state_pressed}};
		// Set the ripple color.
		TypedValue typedValue = new TypedValue();
		TypedArray colorControlHighlight = proxy.getActivity().obtainStyledAttributes(typedValue.data, new int[] { android.R.attr.colorControlHighlight });
		int colorControlHighlightInt = colorControlHighlight.getColor(0, 0);
		int[] rippleColors = new int[] {colorControlHighlightInt};
		// Create the ColorStateList.
		ColorStateList colorStateList = new ColorStateList(rippleStates, rippleColors);
		// Create the RippleDrawable.
		RippleDrawable rippleDrawable = new RippleDrawable(colorStateList, stateListDrawable, null);
		return rippleDrawable;
	}

	/**
	 * Remove the tab from this group.
	 *
	 * @param tabProxy the tab to remove from the group
	 */
	public void removeTab(TabProxy tabProxy) {
		tabGroupPagerAdapter.notifyDataSetChanged();
	}

	/**
	 * Changes the selected tab of the group.
	 *
	 * @param tabIndex the index of the tab that will become selected
	 */
	public void selectTab(int tabIndex) {
		tabGroupViewPager.setCurrentItem(tabIndex);
	};

	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_ACTIVITY)) {
			Object activityObject = d.get(TiC.PROPERTY_ACTIVITY);
			ActivityProxy activityProxy = getProxy().getActivityProxy();
			if (activityObject instanceof HashMap<?, ?> && activityProxy != null) {
				@SuppressWarnings("unchecked")
				KrollDict options = new KrollDict((HashMap<String, Object>) activityObject);
				activityProxy.handleCreationDict(options);
			}
		}

		super.processProperties(d);
	}

	@Override
	public void onPause(Activity activity)
	{
		activityPaused = true;
	}

	@Override
	public void onStop(Activity activity) {

	}

	@Override
	public void onDestroy(Activity activity) {

	}

	public TabProxy getSelectedTab() {
		return new TabProxy();
	}

	@Override
	public void onResume(Activity activity)
	{
		activityPaused = false;

		if (selectedTabOnResume != null) {
			selectedTabOnResume.select();
			selectedTabOnResume = null;
		}
	}

	private class TabGroupFragmentPagerAdapter extends FragmentPagerAdapter
	{

		public TabGroupFragmentPagerAdapter(FragmentManager fm)
		{
			super(fm);
		}

		// getItem only gets called by the FragmentPagerAdapter when the fragment is not found
		// in the FragmentManager. We construct it and associate it to the tab view.
		@Override
		public Fragment getItem(int i)
		{
			TabFragment tabFragment = new TabFragment();
			tabFragment.setTab(tabs.get(i));
			return tabFragment;
		}

		// Android docs say we must override the default implementation if item position can change
		// The FragmentPagerAdapter uses the ID to construct the fragment tag (android:switcher:containerID:ID)
		// and then checks the FragmentManager for presence of said tag. The default Android implementation
		// returns the fragment position in the ViewPager, which is of course wrong when a tab is removed
		// and fragments in higher positions move. Thus we maintain the position and IDs in an ArrayList ourselves
		@Override
		public long getItemId(int position)
		{
			long id = fragmentIds.get(position).longValue();
			return id;
		}

		@Override
		public int getCount()
		{
			if (tabsDisabled) {
				// Since we don't want the FragmentPagerAdapter to do all kinds of rearrangements
				// just because we decided to disable tabs. We want the fragments to stay alive for when
				// we reenable the tabs.
				return numTabsWhenDisabled;
			} else {
				return ((TabGroupProxy) proxy).getTabList().size();
			}
		}

		// We must override the default implementation since item position can change
		// The default Android implementation returns POSITION_UNCHANGED
		// This gets called when getCount returns an unexpected value (e.g. a tab was removed)
		// and now the FragmentPagerAdapter wants to check where the fragments are.
		// We thus need to maintain a list of fragment tags since that's how we check based on
		// the fragment passed into this function
		@Override
		public int getItemPosition(Object object)
		{
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
		public Object instantiateItem(ViewGroup container, int position)
		{
			TabFragment fragment = (TabFragment) super.instantiateItem(container, position);
/*			String tag = fragment.getTag();
			int sanityCheck = fragmentTags.indexOf(tag);
			if (sanityCheck >= 0) {
				// Never happens, just a bug test
				Log.e(TAG, "instantiateItem trying to add an existing tag");
			}
			while (fragmentTags.size() <= position) {
				fragmentTags.add(null);
			}
			fragmentTags.set(position, tag);*/
			return fragment;
		}
	}

	public static class TabFragment extends Fragment
	{
		private TiUIAbstractTab tab;

		public void setTab(TiUIAbstractTab tab)
		{
			this.tab = tab;
		}

		public TiUIAbstractTab getTab()
		{
			return this.tab;
		}

		@Override
		public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState)
		{
			if (tab == null) {
				return null;
			}
			return tab.getContentView();
		}
	}
}
