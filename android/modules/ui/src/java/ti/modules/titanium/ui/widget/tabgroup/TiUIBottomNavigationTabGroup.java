/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import android.graphics.drawable.Drawable;
import android.graphics.Rect;
import android.support.design.internal.BottomNavigationItemView;
import android.support.design.internal.BottomNavigationMenuView;
import android.support.design.widget.BottomNavigationView;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewParent;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;

import java.lang.reflect.Field;
import java.util.ArrayList;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

/**
 * TabGroup implementation using BottomNavigationView as a controller.
 */
public class TiUIBottomNavigationTabGroup extends TiUIAbstractTabGroup implements MenuItem.OnMenuItemClickListener
{
	// region private fields
	private int mBottomNavigationHeightValue;
	// BottomNavigationView lacks anything similar to onTabUnselected method of TabLayout.OnTabSelectedListener.
	// We track the previously selected item index manually to mimic the behavior in order to keep parity across styles.
	private int currentlySelectedIndex = -1;
	private BottomNavigationView mBottomNavigationView;
	private ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	// endregion

	public TiUIBottomNavigationTabGroup(TabGroupProxy proxy, TiBaseActivity activity)
	{
		super(proxy, activity);
	}

	@Override
	public void addViews(TiBaseActivity activity)
	{
		// Manually calculate the proper position of the BottomNavigationView.
		int resourceID = activity.getResources().getIdentifier("design_bottom_navigation_height", "dimen",
															   activity.getPackageName());
		this.mBottomNavigationHeightValue = activity.getResources().getDimensionPixelSize(resourceID);

		// Create the bottom tab navigation view.
		this.mBottomNavigationView = new BottomNavigationView(activity) {
			@Override
			protected boolean fitSystemWindows(Rect insets)
			{
				// Remove top inset when bottom tab bar is to be extended beneath system insets.
				// This prevents Google from blindly padding top of tab bar based on this inset.
				if ((insets != null) && getFitsSystemWindows()) {
					insets = new Rect(insets);
					insets.top = 0;
				}
				super.fitSystemWindows(insets);
				return false;
			}

			@Override
			protected void onLayout(boolean hasChanged, int left, int top, int right, int bottom)
			{
				// Update bottom inset based on tab bar's height and position in window.
				super.onLayout(hasChanged, left, top, right, bottom);
				insetsProvider.setBottomBasedOn(this);
			}
		};
		this.mBottomNavigationView.setFitsSystemWindows(true);

		// Set the colorPrimary as backgroundColor by default if do not have the backgroundColor set.
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_TABS_BACKGROUND_COLOR)) {
			this.mBottomNavigationView.setBackgroundColor(
				TiColorHelper.parseColor(proxy.getProperty(TiC.PROPERTY_TABS_BACKGROUND_COLOR).toString()));
		} else {
			this.mBottomNavigationView.setBackgroundColor(this.colorPrimaryInt);
		}

		// Add tab bar and view pager to the root Titanium view.
		// Note: If getFitsSystemWindows() returns false, then Titanium window's "extendSafeArea" is set true.
		//       This means the bottom tab bar should overlap/overlay the view pager content.
		TiCompositeLayout compositeLayout = (TiCompositeLayout) activity.getLayout();
		{
			TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
			params.autoFillsWidth = true;
			params.autoFillsHeight = true;
			if (compositeLayout.getFitsSystemWindows()) {
				params.optionBottom = new TiDimension(mBottomNavigationHeightValue, TiDimension.TYPE_BOTTOM);
			}
			compositeLayout.addView(this.tabGroupViewPager, params);
		}
		{
			TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
			params.autoFillsWidth = true;
			params.optionBottom = new TiDimension(0, TiDimension.TYPE_BOTTOM);
			compositeLayout.addView(this.mBottomNavigationView, params);
		}

		// Set the ViewPager as a native view.
		setNativeView(this.tabGroupViewPager);
	}

	/**
	 * Handle the removing of the controller from the UI layout when tab navigation is disabled.
	 * @param disable
	 */
	@Override
	public void disableTabNavigation(boolean disable)
	{
		super.disableTabNavigation(disable);

		// Resize the view pager (the tab's content) to compensate for shown/hidden tab bar.
		// Not applicable if Titanium "extendSafeArea" is true, because tab bar overlaps content in this case.
		ViewParent viewParent = this.tabGroupViewPager.getParent();
		if ((viewParent instanceof View) && ((View) viewParent).getFitsSystemWindows()) {
			TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
			params.autoFillsWidth = true;
			params.optionBottom = new TiDimension(disable ? 0 : mBottomNavigationHeightValue, TiDimension.TYPE_BOTTOM);
			this.tabGroupViewPager.setLayoutParams(params);
		}

		// Show/hide the tab bar.
		this.mBottomNavigationView.setVisibility(disable ? View.GONE : View.VISIBLE);
		this.mBottomNavigationView.requestLayout();

		// Update top inset. (Will remove bottom inset if tab bar is "gone".)
		this.insetsProvider.setBottomBasedOn(this.mBottomNavigationView);
	}

	@Override
	public void addTabItemInController(TabProxy tabProxy)
	{
		// Guard for the limit of tabs in the BottomNavigationView.
		if (this.mMenuItemsArray.size() == 5) {
			Log.e(TAG, "Trying to add more than five tabs in a TabGroup with TABS_STYLE_BOTTOM_NAVIGATION style.");
			return;
		}
		// Create a new item with id representing its index in mMenuItemsArray.
		MenuItem menuItem = this.mBottomNavigationView.getMenu().add(null);
		// Set the click listener.
		menuItem.setOnMenuItemClickListener(this);
		// Set the title.
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_TITLE)) {
			menuItem.setTitle(tabProxy.getProperty(TiC.PROPERTY_TITLE).toString());
		}
		// Set the icon.
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_ICON)) {
			Drawable drawable = TiUIHelper.getResourceDrawable(tabProxy.getProperty(TiC.PROPERTY_ICON));
			menuItem.setIcon(drawable);
		}
		// Add the MenuItem to the menu of BottomNavigationView.
		this.mMenuItemsArray.add(menuItem);
		// TabLayout automatically select the first tab that is added to it,
		// but BottomNavigationView does not do that, so we manually trigger it.
		// That's necessary to match the behavior across styles.
		if (this.mMenuItemsArray.size() == 1) {
			((TabGroupProxy) getProxy()).onTabSelected(tabProxy);
			currentlySelectedIndex = 0;
			selectTab(currentlySelectedIndex);
		}
		// Set the drawables.
		setDrawables();
		// Handle shift mode.
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_SHIFT_MODE)) {
			if (!((Boolean) proxy.getProperty(TiC.PROPERTY_SHIFT_MODE))) {
				disableShiftMode();
			}
		}
	}

	/**
	 * This method resets the custom drawables for every item in BottomNavigationView because
	 * it rebuilds its menu on every addition of a new item in it.
	 *
	 */
	private void setDrawables()
	{
		try {
			ArrayList<TabProxy> tabs = ((TabGroupProxy) proxy).getTabList();
			BottomNavigationMenuView bottomMenuView =
				((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			for (int i = 0; i < this.mMenuItemsArray.size(); i++) {
				TabProxy tabProxy = tabs.get(i);
				Drawable backgroundDrawable = createBackgroundDrawableForState(tabProxy, android.R.attr.state_checked);
				bottomMenuView.getChildAt(i).setBackground(backgroundDrawable);
				// Set the TextView textColor.
				((BottomNavigationItemView) bottomMenuView.getChildAt(i))
					.setTextColor(textColorStateList(tabProxy, android.R.attr.state_checked));
			}
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	/**
	 * Disabling shift mode for BottomNavigation currently needs to be done a bit dirty.
	 * The property is expected to be exposed in future Design library versions, so it will
	 * be revisited once Titanium takes advantage of them.
	 *
	 */
	private void disableShiftMode()
	{
		BottomNavigationMenuView menuView = ((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
		try {
			Field shiftingMode = menuView.getClass().getDeclaredField("mShiftingMode");
			shiftingMode.setAccessible(true);
			shiftingMode.setBoolean(menuView, false);
			shiftingMode.setAccessible(false);
			for (int i = 0; i < menuView.getChildCount(); i++) {
				BottomNavigationItemView item = (BottomNavigationItemView) menuView.getChildAt(i);
				item.setShiftingMode(false);
				item.setChecked(item.getItemData().isChecked());
			}
		} catch (NoSuchFieldException e) {
			Log.e(TAG, "Unable to get shift mode field", e);
		} catch (IllegalAccessException e) {
			Log.e(TAG, "Unable to change value of shift mode", e);
		}
	}

	/**
	 * Remove an item from the BottomNavigationView for a specific index.
	 *
	 * @param position the position of the removed item.
	 */
	@Override
	public void removeTabItemFromController(int position)
	{
		this.mBottomNavigationView.getMenu().clear();
		this.mMenuItemsArray.clear();
		for (TabProxy tabProxy : ((TabGroupProxy) proxy).getTabList()) {
			addTabItemInController(tabProxy);
		}
	}

	/**
	 * Select an item from the BottomNavigationView with a specific position.
	 *
	 * @param position the position of the item to be selected.
	 */
	@Override
	public void selectTabItemInController(int position)
	{
		// Fire the UNSELECTED event from the currently selected tab.
		((TabGroupProxy) getProxy())
			.getTabList()
			.get(currentlySelectedIndex)
			.fireEvent(TiC.EVENT_UNSELECTED, null, false);
		currentlySelectedIndex = position;
		// The ViewPager has changed current page from swiping.
		// Or any other interaction with it that can cause page change.
		// Set the proper item in the controller.
		this.mBottomNavigationView.getMenu().getItem(position).setChecked(true);
		// Trigger the select event firing for the newly selected tab.
		((TabGroupProxy) getProxy()).onTabSelected(position);
	}

	/**
	 * Set the background drawable for BottomNavigationView.
	 *
	 * @param drawable the new background drawable.
	 */
	@Override
	public void setBackgroundDrawable(Drawable drawable)
	{
		this.mBottomNavigationView.setBackground(drawable);
	}

	/**
	 * After a menu item is clicked this method sends the proper index to the ViewPager to a select
	 * a page. Also takes care of sending SELECTED/UNSELECTED events from the proper tabs.
	 * @param item
	 * @return
	 */
	@Override
	public boolean onMenuItemClick(MenuItem item)
	{
		// The controller has changed its selected item.
		int index = this.mMenuItemsArray.indexOf(item);
		if (index != currentlySelectedIndex) {
			((TabGroupProxy) getProxy())
				.getTabList()
				.get(currentlySelectedIndex)
				.fireEvent(TiC.EVENT_UNSELECTED, null, false);
			currentlySelectedIndex = index;
		}
		// Make the ViewPager to select the proper page too.
		selectTab(index);
		// Trigger the select event firing for the new tab.
		((TabGroupProxy) getProxy()).onTabSelected(index);
		return false;
	}
}
