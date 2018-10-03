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
import android.graphics.Color;
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
import android.support.v4.content.ContextCompat;
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

public abstract class TiUIAbstractTabGroup extends TiUIView
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

	// Default value is true. Set it to false if the tab is selected using the selectTab() method.
	private boolean tabClicked = true;
	protected boolean swipeable = true;

	protected boolean smoothScrollOnTabClick = true;

	// The tab to be selected once the activity resumes.
	private TabLayout.Tab selectedTabOnResume;
	protected boolean viewPagerRestoreComplete = false;
	protected PagerAdapter tabGroupPagerAdapter;
	protected ViewPager tabGroupViewPager;
	protected boolean tabsDisabled = false;
	protected boolean pendingDisableTabs = false;
	protected boolean tempTabsDisabled = false;
	protected int numTabsWhenDisabled;
	protected int colorPrimaryInt;
	private int textColorInt;

	private ArrayList<TiUITab> tabs = new ArrayList<>();

	public TiUIAbstractTabGroup(TabGroupProxy proxy, TiBaseActivity activity, Bundle savedInstanceState)
	{
		super(proxy);

		TypedValue colorPrimaryTypedValue = new TypedValue();
		TypedArray colorPrimary = activity.obtainStyledAttributes(colorPrimaryTypedValue.data, new int[] { android.R.attr.colorPrimary });
		colorPrimaryInt = colorPrimary.getColor(0, 0);
		TypedValue typedValue = new TypedValue();
		TypedArray textColor = activity.obtainStyledAttributes(typedValue.data, new int[] { android.R.attr.textColorPrimary });
		textColorInt = textColor.getColor(0, 0);

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
		TiUITab abstractTab = new TiUITab(tabProxy);
		tabs.add(abstractTab);
		boolean shouldUpdateTabsDisabled = false;

		tabProxy.setView(abstractTab);

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

	protected ColorStateList textColorStateList(TabProxy tabProxy, int stateToUse) {
		int[][] textColorStates = new int[][] {
			new int[] {-stateToUse},
			new int[] {stateToUse}};
		int[] textColors = {
			tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_TITLE_COLOR) ? TiColorHelper.parseColor(tabProxy.getProperty(TiC.PROPERTY_TITLE_COLOR).toString()) : textColorInt,
			tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_ACTIVE_TITLE_COLOR) ? TiColorHelper.parseColor(tabProxy.getProperty(TiC.PROPERTY_ACTIVE_TITLE_COLOR).toString()) : textColorInt
		};
		ColorStateList stateListDrawable = new ColorStateList(textColorStates, textColors);
		return stateListDrawable;
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
	public void removeTabAt(int index) {
		// Remove the reference in tabsMap.
		tabs.remove(index);
		// Update the ViewPager.
		tabGroupPagerAdapter.notifyDataSetChanged();
		// Remove the item from the controller.
		removeTabItemFromController(index);
	}

	/**
	 * Changes the selected tab of the group.
	 *
	 * @param tabIndex the index of the tab that will become selected
	 */
	public void selectTab(int tabIndex) {
		// Release the OnPageChangeListener in order to calling an unnecessary item selection.
		tabGroupViewPager.clearOnPageChangeListeners();
		tabGroupViewPager.setCurrentItem(tabIndex, smoothScrollOnTabClick);
		tabGroupViewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
			@Override
			public void onPageScrolled(int i, float v, int i1) {

			}

			@Override
			public void onPageSelected(int i) {
				selectTabItemInController(i);
			}

			@Override
			public void onPageScrollStateChanged(int i) {

			}
		});
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

	public TabProxy getSelectedTab() {
		return new TabProxy();
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
			long id = tabs.get(position).hashCode();
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
				return tabs.size();
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
			TabFragment fragment = (TabFragment) object;
			int index = tabs.indexOf(((TabFragment) object).getTab());
			// Notify the PagerAdapter that we have removed a tab.
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
		private TiUITab tab;

		public void setTab(TiUITab tab)
		{
			this.tab = tab;
		}

		public TiUITab getTab()
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
