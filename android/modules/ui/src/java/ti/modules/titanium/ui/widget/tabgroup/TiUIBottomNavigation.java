/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import android.annotation.SuppressLint;
import android.graphics.drawable.Drawable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;

import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.bottomnavigation.BottomNavigationView;

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
	private ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	private RelativeLayout layout = null;
	private FrameLayout centerView;
	private BottomNavigationView bottomNavigation;
	private Object[] tabsArray;

	public TiUIBottomNavigation(TabGroupProxy proxy, TiBaseActivity activity)
	{
		super(proxy, activity);
		if (proxy.getProperty(TiC.PROPERTY_THEME) != null) {
			try {
				String themeName = proxy.getProperty(TiC.PROPERTY_THEME).toString();
				int theme = TiRHelper.getResource("style."
					+ themeName.replaceAll("[^A-Za-z0-9_]", "_"));
				activity.setTheme(theme);
				activity.getApplicationContext().setTheme(theme);
			} catch (Exception e) {
			}
		}
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
					MenuItem menuItem = bottomNavigation.getMenu().add(0,  mMenuItemsArray.size(), 0, "");
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

	}

	@Override
	public void updateTabBackgroundDrawable(int index)
	{

	}

	@Override
	public void updateTabTitle(int index)
	{

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

	}

	@Override
	public void updateTabTitleColor(int index)
	{

	}

	@Override
	public void updateTabIcon(int index)
	{

	}

	@Override
	public String getTabTitle(int index)
	{
		return "";
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
		return true;
	}
}
