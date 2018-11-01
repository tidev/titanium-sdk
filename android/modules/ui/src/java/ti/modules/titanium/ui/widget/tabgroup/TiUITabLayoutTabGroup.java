/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import android.graphics.drawable.Drawable;
import android.support.design.widget.TabLayout;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

/**
 * TabGroup implementation using TabLayout as a controller.
 * This clas has been created for a backward compatibility with versions
 * that relied on the implementation based on the deprecated ActionBar tab
 * navigation mode.
 *
 * Functionality has been kept the same with minor visual differences which
 * are introduced in favor of following Material Design guidelines.
 */
public class TiUITabLayoutTabGroup extends TiUIAbstractTabGroup implements TabLayout.OnTabSelectedListener
{
	// region private fields
	private TabLayout mTabLayout;
	// endregion

	public TiUITabLayoutTabGroup(TabGroupProxy proxy, TiBaseActivity activity)
	{
		// Setup the action bar for navigation tabs.
		super(proxy, activity);
	}

	/**
	 * Removes the controller from the UI layout.
	 * @param disable
	 */
	@Override
	public void disableTabNavigation(boolean disable)
	{
		super.disableTabNavigation(disable);
		if (disable) {
			this.mTabLayout.setVisibility(View.GONE);
		} else {
			this.mTabLayout.setVisibility(View.VISIBLE);
		}
	}

	@Override
	public void addViews(TiBaseActivity activity)
	{
		this.mTabLayout = new TabLayout(activity);
		// Set the colorPrimary as backgroundColor by default if do not have the backgroundColor set.
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_TABS_BACKGROUND_COLOR)) {
			this.mTabLayout.setBackgroundColor(
				TiColorHelper.parseColor(proxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR).toString()));
		} else {
			this.mTabLayout.setBackgroundColor(this.colorPrimaryInt);
		}
		// Set the OnTabSelected listener.
		this.mTabLayout.addOnTabSelectedListener(this);
		// Set the LayoutParams for the TabLayout instance.
		TiCompositeLayout.LayoutParams tabLayoutLP = new TiCompositeLayout.LayoutParams();
		tabLayoutLP.autoFillsWidth = true;
		this.mTabLayout.setLayoutParams(tabLayoutLP);
		// Set the LayoutParams for the ViewPager instance.
		((TiCompositeLayout) activity.getLayout()).setLayoutArrangement(TiC.LAYOUT_VERTICAL);
		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		params.autoFillsWidth = true;
		// Add the views to their container.
		((ViewGroup) activity.getLayout()).addView(this.mTabLayout);
		((ViewGroup) activity.getLayout()).addView(this.tabGroupViewPager, params);
		// Set the ViewPager as a native view.
		setNativeView(this.tabGroupViewPager);
	}

	@Override
	public void addTabItemInController(TabProxy tabProxy)
	{

		// Create a new tab instance.
		TabLayout.Tab newTab = this.mTabLayout.newTab();
		// Set the title.
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_TITLE)) {
			newTab.setText(tabProxy.getProperty(TiC.PROPERTY_TITLE).toString());
		}
		// Set the icon.
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_ICON)) {
			Drawable drawable = TiUIHelper.getResourceDrawable(tabProxy.getProperty(TiC.PROPERTY_ICON));
			newTab.setIcon(drawable);
		}
		// Add the new tab to the TabLayout.
		this.mTabLayout.addTab(newTab);

		// Create a background drawable with ripple effect for the state used by TabLayout.Tab.
		Drawable backgroundDrawable = createBackgroundDrawableForState(tabProxy, android.R.attr.state_selected);

		// Go through the layout to set the background color state drawable manually for each tab.
		// Currently we support only the default type of TabLayout which has a SlidingTabStrip.
		try {
			LinearLayout stripLayout = ((LinearLayout) this.mTabLayout.getChildAt(0));
			// Get the just added TabView as a LinearLayout in order to set the background.
			LinearLayout tabLL = ((LinearLayout) stripLayout.getChildAt(this.mTabLayout.getTabCount() - 1));
			tabLL.setBackground(backgroundDrawable);
			// Set the TextView textColor.
			for (int i = 0; i < tabLL.getChildCount(); i++) {
				if (tabLL.getChildAt(i) instanceof TextView) {
					((TextView) tabLL.getChildAt(i))
						.setTextColor(textColorStateList(tabProxy, android.R.attr.state_selected));
				}
			}
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	/**
	 * Remove a tab from the TabLayout for a specific index.
	 *
	 * @param position the position of the removed item.
	 */
	@Override
	public void removeTabItemFromController(int position)
	{
		this.mTabLayout.removeTab(this.mTabLayout.getTabAt(position));
	}

	/**
	 * Select a tab from the TabLayout with a specific position.
	 *
	 * @param position the position of the item to be selected.
	 */
	@Override
	public void selectTabItemInController(int position)
	{
		((TabGroupProxy) proxy).onTabSelected(position);
		this.mTabLayout.clearOnTabSelectedListeners();
		this.mTabLayout.getTabAt(position).select();
		this.mTabLayout.addOnTabSelectedListener(this);
	}

	/**
	 * Set the background drawable for TabLayout.
	 *
	 * @param drawable the new background drawable.
	 */
	@Override
	public void setBackgroundDrawable(Drawable drawable)
	{
		this.mTabLayout.setBackground(drawable);
	}

	/**
	 * After a tab is selected send the index for the ViewPager to select the proper page.
	 *
	 * @param tab that has been selected.
	 */
	@Override
	public void onTabSelected(TabLayout.Tab tab)
	{
		// Get the index of the currently selected tab.
		int index = this.mTabLayout.getSelectedTabPosition();
		// Select the proper page in the ViewPager.
		selectTab(index);
		// Trigger the selected/unselected event firing.
		((TabGroupProxy) getProxy()).onTabSelected(index);
	}

	/**
	 * Send the "unselected" event for a tab that has been unselected.
	 * @param tab - the tab that has been unselected.
	 */
	@Override
	public void onTabUnselected(TabLayout.Tab tab)
	{
		((TabGroupProxy) getProxy()).getTabList().get(tab.getPosition()).fireEvent(TiC.EVENT_UNSELECTED, null, false);
	}

	@Override
	public void onTabReselected(TabLayout.Tab tab)
	{
	}
}
