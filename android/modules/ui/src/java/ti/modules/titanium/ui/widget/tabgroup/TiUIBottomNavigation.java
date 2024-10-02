/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;
import androidx.core.graphics.ColorUtils;

import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.bottomnavigation.BottomNavigationItemView;
import com.google.android.material.bottomnavigation.BottomNavigationMenuView;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.shape.MaterialShapeDrawable;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import java.util.ArrayList;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

/**
 * TabGroup implementation using BottomNavigationView as a controller.
 */
public class TiUIBottomNavigation extends TiUIAbstractTabGroup implements BottomNavigationView.OnItemSelectedListener
{

	static int id_layout = 0;
	static int id_content = 0;
	static int id_bottomNavigation = 0;
	private final int currentlySelectedIndex = -1;
	private ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	private RelativeLayout layout = null;
	private FrameLayout centerView;
	private BottomNavigationView bottomNavigation;
	private Object[] tabsArray;

	public TiUIBottomNavigation(TabGroupProxy proxy, TiBaseActivity activity)
	{
		super(proxy, activity);
	}

	// Overriding addTab method to provide a proper guard for trying to add more tabs than the limit
	// for BottomNavigationView class.
	@Override
	public void addTab(TabProxy tabProxy)
	{

	}

	public void setTabs(Object tabs)
	{
		if (tabs instanceof Object[] objArray) {
			tabsArray = objArray;
			for (Object tabView : tabsArray) {
				if (tabView instanceof TabProxy tp) {
					MenuItem menuItem = bottomNavigation.getMenu().add(0, mMenuItemsArray.size(), 0, "");
					menuItem.setTitle(tp.getProperty(TiC.PROPERTY_TITLE).toString());
					Drawable drawable = TiUIHelper.getResourceDrawable(tp.getProperty(TiC.PROPERTY_ICON));
					menuItem.setIcon(drawable);
					mMenuItemsArray.add(menuItem);
				}
			}
		}
	}

	@Override
	public void addViews(TiBaseActivity activity)
	{
		mMenuItemsArray = new ArrayList<>();
		try {
			id_layout = TiRHelper.getResource("layout.titanium_ui_bottom_navigation");
			id_content = TiRHelper.getResource("id.bottomNavBar_content");
			id_bottomNavigation = TiRHelper.getResource("id.bottomNavBar");

			LayoutInflater inflater = LayoutInflater.from(TiApplication.getAppRootOrCurrentActivity());
			layout = (RelativeLayout) inflater.inflate(id_layout, null, false);
			bottomNavigation = layout.findViewById(id_bottomNavigation);
			centerView = layout.findViewById(id_content);

			bottomNavigation.setOnItemSelectedListener(this);
			activity.setLayout(layout);

			if (proxy.hasProperty(TiC.PROPERTY_TABS)) {
				setTabs(proxy.getProperty(TiC.PROPERTY_TABS));
				selectTab(0);
			}

		} catch (Exception ex) {
			Log.e(TAG, "XML resources could not be found!!!" + ex.getMessage());
		}
	}

	/**
	 * Handle the removing of the controller from the UI layout when tab navigation is disabled.
	 *
	 * @param disable
	 */
	@Override
	public void disableTabNavigation(boolean disable)
	{
		super.disableTabNavigation(disable);
	}

	@Override
	public void addTabItemInController(TiViewProxy tabProxy)
	{

	}

	/**
	 * Remove an item from the BottomNavigationView for a specific index.
	 *
	 * @param position the position of the removed item.
	 */
	@Override
	public void removeTabItemFromController(int position)
	{

	}

	/**
	 * Select an item from the BottomNavigationView with a specific position.
	 *
	 * @param position the position of the item to be selected.
	 */
	@Override
	public void selectTabItemInController(int position)
	{

	}

	@Override
	public void setBackgroundColor(int colorInt)
	{
		// Update tab bar's background color.
		Drawable drawable = bottomNavigation.getBackground();
		if (drawable instanceof MaterialShapeDrawable shapeDrawable) {
			shapeDrawable.setFillColor(ColorStateList.valueOf(colorInt));
			shapeDrawable.setElevation(0); // Drawable will tint the fill color if elevation is non-zero.
		} else {
			bottomNavigation.setBackgroundColor(colorInt);
		}

		// Apply given color to bottom navigation bar if using a "solid" theme.
		if (isUsingSolidTitaniumTheme() && (Build.VERSION.SDK_INT >= 27)) {
			Activity activity = (this.proxy != null) ? this.proxy.getActivity() : null;
			Window window = (activity != null) ? activity.getWindow() : null;
			View decorView = (window != null) ? window.getDecorView() : null;
			if ((window != null) && (decorView != null)) {
				int uiFlags = decorView.getSystemUiVisibility();
				if (ColorUtils.calculateLuminance(colorInt) > 0.5) {
					uiFlags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
				} else {
					uiFlags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
				}
				decorView.setSystemUiVisibility(uiFlags);
				window.setNavigationBarColor(colorInt);
			}
		}
	}

	@Override
	@SuppressLint("RestrictedApi")
	public void updateTabBackgroundDrawable(int index)
	{
		try {
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			TiViewProxy tabProxy = tabs.get(index).getProxy();
			boolean hasTouchFeedbackColor = tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR);
			if (hasCustomBackground(tabProxy) || hasCustomIconTint(tabProxy) || hasTouchFeedbackColor) {
				BottomNavigationMenuView bottomMenuView =
					((BottomNavigationMenuView) this.bottomNavigation.getChildAt(0));
				Drawable drawable = createBackgroundDrawableForState(tabProxy, android.R.attr.state_checked);
				int color = getActiveColor(tabProxy);
				if (hasTouchFeedbackColor) {
					color = TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR),
						tabProxy.getActivity());
				}
				drawable = new RippleDrawable(createRippleColorStateListFrom(color), drawable, null);
				bottomMenuView.getChildAt(index).setBackground(drawable);
			}
		} catch (Exception e) {
			org.appcelerator.kroll.common.Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	@Override
	public void updateTabTitle(int index)
	{
		if ((index < 0) || (index >= this.tabs.size())) {
			return;
		}

		TiViewProxy tabProxy = this.tabs.get(index).getProxy();
		if (tabProxy == null) {
			return;
		}

		String title = TiConvert.toString(tabProxy.getProperty(TiC.PROPERTY_TITLE));
		this.bottomNavigation.getMenu().getItem(index).setTitle(title);
	}

	@SuppressLint("RestrictedApi")
	@Override
	public void updateBadge(int index)
	{
		if ((index < 0) || (index >= tabsArray.length)) {
			return;
		}

		TiViewProxy tabProxy = ((TabProxy) tabsArray[index]);
		if (tabProxy == null) {
			return;
		}

		Object badgeValue = tabProxy.getProperty(TiC.PROPERTY_BADGE);
		if ((badgeValue == null) && !TiUIHelper.isUsingMaterialTheme(bottomNavigation.getContext())) {
			return;
		}

		int menuItemId = bottomNavigation.getMenu().getItem(index).getItemId();
		BadgeDrawable badgeDrawable = bottomNavigation.getOrCreateBadge(menuItemId);
		if (badgeValue != null) {
			badgeDrawable.setVisible(true);
			badgeDrawable.setNumber(TiConvert.toInt(badgeValue, 0));
		} else {
			badgeDrawable.setVisible(false);
		}
	}

	@Override
	public void updateBadgeColor(int index)
	{
		if ((index < 0) || (index >= this.tabs.size())) {
			return;
		}

		TiViewProxy tabProxy = this.tabs.get(index).getProxy();
		if (tabProxy == null) {
			return;
		}

		// TODO: reset to default value when property is null
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BADGE_COLOR)) {
			org.appcelerator.kroll.common.Log.w(TAG, "badgeColor is deprecated.  Use badgeBackgroundColor instead.");
			int menuItemId = this.bottomNavigation.getMenu().getItem(index).getItemId();
			BadgeDrawable badgeDrawable = this.bottomNavigation.getOrCreateBadge(menuItemId);
			badgeDrawable.setBackgroundColor(
				TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_BADGE_COLOR), tabProxy.getActivity()));
		}
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BADGE_BACKGROUND_COLOR)) {
			int menuItemId = this.bottomNavigation.getMenu().getItem(index).getItemId();
			BadgeDrawable badgeDrawable = this.bottomNavigation.getOrCreateBadge(menuItemId);
			badgeDrawable.setBackgroundColor(
				TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_BADGE_BACKGROUND_COLOR), tabProxy.getActivity()));
		}
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BADGE_TEXT_COLOR)) {
			int menuItemId = this.bottomNavigation.getMenu().getItem(index).getItemId();
			BadgeDrawable badgeDrawable = this.bottomNavigation.getOrCreateBadge(menuItemId);
			badgeDrawable.setBadgeTextColor(
				TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_BADGE_TEXT_COLOR), tabProxy.getActivity()));
		}
	}

	@Override
	@SuppressLint("RestrictedApi")
	public void updateTabTitleColor(int index)
	{
		try {
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			TiViewProxy tabProxy = tabs.get(index).getProxy();
			if (hasCustomTextColor(tabProxy)) {
				// Set the TextView textColor.
				BottomNavigationMenuView bottomMenuView =
					((BottomNavigationMenuView) this.bottomNavigation.getChildAt(0));
				((BottomNavigationItemView) bottomMenuView.getChildAt(index))
					.setTextColor(textColorStateList(tabProxy, android.R.attr.state_checked));
			}
		} catch (Exception e) {
			org.appcelerator.kroll.common.Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	@SuppressLint("RestrictedApi")
	public void updateActiveIndicatorColor(int color)
	{
		try {
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.

			int[][] states = new int[][] {
				new int[] { android.R.attr.state_enabled }, // enabled
				new int[] { -android.R.attr.state_enabled }, // disabled
				new int[] { -android.R.attr.state_checked }, // unchecked
				new int[] { android.R.attr.state_pressed }  // pressed
			};

			int[] colors = new int[] {
				color,
				color,
				color,
				color
			};

			ColorStateList myList = new ColorStateList(states, colors);

			bottomNavigation.setItemActiveIndicatorColor(myList);
		} catch (Exception e) {
			org.appcelerator.kroll.common.Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	@Override
	public void updateTabIcon(int index)
	{
		if ((index < 0) || (index >= this.tabs.size())) {
			return;
		}

		TiViewProxy tabProxy = this.tabs.get(index).getProxy();
		if (tabProxy == null) {
			return;
		}

		final Drawable drawable = TiUIHelper.getResourceDrawable(tabProxy.getProperty(TiC.PROPERTY_ICON));
		this.bottomNavigation.getMenu().getItem(index).setIcon(drawable);
		updateIconTint();
	}

	private void updateIconTint()
	{
		for (int i = 0; i < this.tabs.size(); i++) {
			final TiViewProxy tabProxy = this.tabs.get(i).getProxy();
			if (hasCustomIconTint(tabProxy)) {
				final boolean selected = i == currentlySelectedIndex;
				Drawable drawable = this.bottomNavigation.getMenu().getItem(i).getIcon();
				drawable = updateIconTint(tabProxy, drawable, selected);
				this.bottomNavigation.getMenu().getItem(i).setIcon(drawable);
			}
		}
	}

	@Override
	public String getTabTitle(int index)
	{
		// Validate index.
		if (index < 0 || index > tabs.size() - 1) {
			return null;
		}
		return this.bottomNavigation.getMenu().getItem(index).getTitle().toString();
	}

	@Override
	public void selectTab(int tabIndex)
	{
		super.selectTab(tabIndex);

		TabProxy tp = ((TabProxy) tabsArray[tabIndex]);
		if (tp != null) {
			TiUITab abstractTab = new TiUITab(tp);

			centerView.removeAllViews();
			TiUIView view = abstractTab.getWindowProxy().getOrCreateView();
			if (view != null) {
				centerView.addView(view.getOuterView());
			}
		}
	}

	@Override
	public boolean onNavigationItemSelected(@NonNull MenuItem item)
	{
		item.setChecked(true);
		selectTab(item.getItemId());
		((TabGroupProxy) getProxy()).onTabSelected(item.getItemId());
		return true;
	}
}
