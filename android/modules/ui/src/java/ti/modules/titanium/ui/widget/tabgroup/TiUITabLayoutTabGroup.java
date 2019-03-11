/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import android.graphics.drawable.Drawable;
import android.graphics.Rect;
import android.support.design.widget.TabLayout;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
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

	private void setDrawablesForTab(int tabIndex)
	{
		// Validate index input.
		ArrayList<TabProxy> tabProxyArrayList = ((TabGroupProxy) this.proxy).getTabList();
		if (tabIndex < 0 || tabIndex >= tabProxyArrayList.size()) {
			return;
		}

		TabProxy tabProxy = tabProxyArrayList.get(tabIndex);
		if (tabProxy == null) {
			return;
		}
		// Create a background drawable with ripple effect for the state used by TabLayout.Tab.
		Drawable backgroundDrawable = createBackgroundDrawableForState(tabProxy, android.R.attr.state_selected);

		// Go through the layout to set the background color state drawable manually for each tab.
		// Currently we support only the default type of TabLayout which has a SlidingTabStrip.
		try {
			LinearLayout stripLayout = ((LinearLayout) this.mTabLayout.getChildAt(0));
			// Get the just added TabView as a LinearLayout in order to set the background.
			LinearLayout tabLL = ((LinearLayout) stripLayout.getChildAt(tabIndex));
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
	 * Removes the controller from the UI layout.
	 * @param disable
	 */
	@Override
	public void disableTabNavigation(boolean disable)
	{
		super.disableTabNavigation(disable);

		// Show/hide the tab bar.
		this.mTabLayout.setVisibility(disable ? View.GONE : View.VISIBLE);
		this.mTabLayout.requestLayout();

		// Update top inset. (Will remove top inset if tab bar is "gone".)
		this.insetsProvider.setTopBasedOn(this.mTabLayout);
	}

	@Override
	public void addViews(TiBaseActivity activity)
	{
		// Create the top tab layout view.
		this.mTabLayout = new TabLayout(activity) {
			@Override
			protected boolean fitSystemWindows(Rect insets)
			{
				// Remove bottom inset when top tab bar is to be extended beneath system insets.
				// This prevents Google from blindly padding bottom of tab bar based on this inset.
				if ((insets != null) && getFitsSystemWindows()) {
					insets = new Rect(insets);
					insets.bottom = 0;
				}
				super.fitSystemWindows(insets);
				return false;
			}

			@Override
			protected void onLayout(boolean hasChanged, int left, int top, int right, int bottom)
			{
				// Update top inset based on tab bar's height and position in window.
				super.onLayout(hasChanged, left, top, right, bottom);
				insetsProvider.setTopBasedOn(this);
			}
		};
		this.mTabLayout.setFitsSystemWindows(true);

		// Set the OnTabSelected listener.
		this.mTabLayout.addOnTabSelectedListener(this);

		// Add tab bar and view pager to the root Titanium view.
		// Note: If getFitsSystemWindows() returns false, then Titanium window's "extendSafeArea" is set true.
		//       This means the top tab bar should overlap/overlay the view pager content.
		TiCompositeLayout compositeLayout = (TiCompositeLayout) activity.getLayout();
		if (compositeLayout.getFitsSystemWindows()) {
			compositeLayout.setLayoutArrangement(TiC.LAYOUT_VERTICAL);
			{
				TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
				params.autoFillsWidth = true;
				compositeLayout.addView(this.mTabLayout, params);
			}
			{
				TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
				params.autoFillsWidth = true;
				params.autoFillsHeight = true;
				compositeLayout.addView(this.tabGroupViewPager, params);
			}
		} else {
			{
				TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
				params.autoFillsWidth = true;
				params.autoFillsHeight = true;
				compositeLayout.addView(this.tabGroupViewPager, params);
			}
			{
				TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
				params.autoFillsWidth = true;
				params.optionTop = new TiDimension(0, TiDimension.TYPE_TOP);
				compositeLayout.addView(this.mTabLayout, params);
			}
		}

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
		this.mTabLayout.addTab(newTab, false);

		// Set the drawables for the most recently added Tab.
		setDrawablesForTab(this.mTabLayout.getTabCount() - 1);
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

	@Override
	public void setBackgroundColor(int colorInt)
	{
		this.mTabLayout.setBackgroundColor(colorInt);
	}

	@Override
	public void setDrawables()
	{
		ArrayList<TabProxy> tabProxiesList = ((TabGroupProxy) this.proxy).getTabList();
		for (TabProxy tabProxy : tabProxiesList) {
			setDrawablesForTab(tabProxiesList.indexOf(tabProxy));
		}
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
		int position = tab.getPosition();
		// skip invalid position tabs
		if (position < 0) {
			return;
		}

		List<TabProxy> list = ((TabGroupProxy) getProxy()).getTabList();
		if (position >= list.size()) { // skip if past end of list
			return;
		}
		list.get(position).fireEvent(TiC.EVENT_UNSELECTED, null, false);
	}

	@Override
	public void onTabReselected(TabLayout.Tab tab)
	{
	}
}
