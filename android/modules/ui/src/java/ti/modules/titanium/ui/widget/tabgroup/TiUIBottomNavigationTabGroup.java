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
import android.support.design.internal.BottomNavigationItemView;
import android.support.design.internal.BottomNavigationMenuView;
import android.support.design.widget.BottomNavigationView;
import android.support.v7.view.menu.MenuBuilder;
import android.util.TypedValue;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;

import java.lang.reflect.Field;
import java.util.ArrayList;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

public class TiUIBottomNavigationTabGroup extends TiUIAbstractTabGroup implements MenuItem.OnMenuItemClickListener
{
	BottomNavigationView mBottomNavigationView;
	ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	ArrayList<TabProxy> mTabProxiesArray = new ArrayList<>();
	private int mBottomNavigationHeightValue;
	// BottomNavigationView lacks anything similar to onTabUnselected method of TabLayout.OnTabSelectedListener.
	// We track the previously selected item index manually to mimic the behavior in order to keep parity across styles.
	private int currentlySelectedIndex = -1;

	public TiUIBottomNavigationTabGroup(TabGroupProxy proxy, TiBaseActivity activity, Bundle savedInstanceState) {
		super(proxy, activity, savedInstanceState);
	}

	@Override
	public void addViews(TiBaseActivity activity) {
		// Manually calculate the proper position of the BottomNavigationView
		int resourceID = activity.getResources().getIdentifier("design_bottom_navigation_height", "dimen", activity.getPackageName());
		mBottomNavigationHeightValue = activity.getResources().getDimensionPixelSize(resourceID);

		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		params.autoFillsWidth = true;
		params.optionBottom = new TiDimension(mBottomNavigationHeightValue, TiDimension.TYPE_BOTTOM);

		this.mBottomNavigationView = new BottomNavigationView(activity);

		TiCompositeLayout.LayoutParams bottomNavigationParams = new TiCompositeLayout.LayoutParams();
		bottomNavigationParams.autoFillsWidth = true;
		bottomNavigationParams.optionBottom = new TiDimension(0, TiDimension.TYPE_BOTTOM);
		((TiCompositeLayout) activity.getLayout()).addView(tabGroupViewPager, params);
		((TiCompositeLayout) activity.getLayout()).addView(mBottomNavigationView, bottomNavigationParams);
		setNativeView(tabGroupViewPager);
	}

	@Override
	public void disableTabNavigation(boolean disable) {
		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		params.autoFillsWidth = true;
		if (disable) {
			params.optionBottom = new TiDimension(0, TiDimension.TYPE_BOTTOM);
			mBottomNavigationView.setVisibility(View.GONE);
		} else {
			params.optionBottom = new TiDimension(mBottomNavigationHeightValue, TiDimension.TYPE_BOTTOM);
			mBottomNavigationView.setVisibility(View.VISIBLE);
		}
		tabGroupViewPager.setLayoutParams(params);
	}

	@Override
	public void addTabItemInController(TabProxy tabProxy) {
		// Create a new item with id representing its index in mMenuItemsArray.
		MenuItem menuItem = this.mBottomNavigationView.getMenu().add(null);
		menuItem.setOnMenuItemClickListener(this);
		Drawable drawable = TiUIHelper.getResourceDrawable(tabProxy.getProperty(TiC.PROPERTY_ICON));
		menuItem.setIcon(drawable);
		menuItem.setTitle(tabProxy.getProperty(TiC.PROPERTY_TITLE).toString());
		this.mMenuItemsArray.add(menuItem);
		// TabLayout automatically select the first tab that is added to it,
		// but BottomNavigationView does not do that, so we manually trigger it.
		// That's necessary to match the behavior across styles.
		if (this.mMenuItemsArray.size() == 1) {
			((TabGroupProxy) getProxy()).onTabSelected(tabProxy);
			currentlySelectedIndex = 0;
		}
		setDrawables();
		if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_SHIFT_MODE)) {
			if (!((Boolean) proxy.getProperty(TiC.PROPERTY_SHIFT_MODE))) {
				disableShiftMode();
			}
		}
	}

	private void setDrawables() {
		try {
			ArrayList<TabProxy> tabs = ((TabGroupProxy) proxy).getTabList();
			BottomNavigationMenuView bottomMenuView = ((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			for (int i = 0; i < this.mMenuItemsArray.size(); i++) {
				TabProxy tabProxy = tabs.get(i);
				RippleDrawable backgroundRippleDrawable = createBackgroundDrawableForState(tabProxy, android.R.attr.state_checked);
				bottomMenuView.getChildAt(i).setBackground(backgroundRippleDrawable);
				// Set the TextView textColor.
				 ((BottomNavigationItemView) bottomMenuView.getChildAt(i)).setTextColor(textColorStateList(tabProxy, android.R.attr.state_checked));
			}
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	private void disableShiftMode() {
		BottomNavigationMenuView menuView = ((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
		try {
			Field shiftingMode = menuView.getClass().getDeclaredField("mShiftingMode");
			shiftingMode.setAccessible(true);
			shiftingMode.setBoolean(menuView, false);
			shiftingMode.setAccessible(false);
			for (int i = 0; i < menuView.getChildCount(); i++) {
				BottomNavigationItemView item = (BottomNavigationItemView) menuView.getChildAt(i);
				// noinspection RestrictedApi
				item.setShiftingMode(false);
				// set once again checked value, so view will be updated
				// noinspection RestrictedApi
				item.setChecked(item.getItemData().isChecked());
			}
		} catch (NoSuchFieldException e) {
			Log.e(TAG, "Unable to get shift mode field", e);
		} catch (IllegalAccessException e) {
			Log.e(TAG, "Unable to change value of shift mode", e);
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		// TODO Auto-generated method stub
		super.processProperties(d);
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			// TODO: Deal with title property
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
			//TODO: Deal with Title property
		} else if (key.equals(TiC.PROPERTY_SWIPEABLE)) {
			swipeable = TiConvert.toBoolean(newValue);
		} else if (key.equals(TiC.PROPERTY_SMOOTH_SCROLL_ON_TAB_CLICK)) {
			smoothScrollOnTabClick = TiConvert.toBoolean(newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void removeTabItemFromController(int position) {
		this.mBottomNavigationView.getMenu().clear();
		this.mMenuItemsArray.clear();
		for (TabProxy tabProxy: ((TabGroupProxy) proxy).getTabList()) {
			addTabItemInController(tabProxy);
		}
	}

	@Override
	public void selectTabItemInController(int position) {
		// Fire the UNSELECTED event from the currently selected tab.
		((TabGroupProxy) getProxy()).getTabList().get(currentlySelectedIndex).fireEvent(TiC.EVENT_UNSELECTED, null, false);
		currentlySelectedIndex = position;
		// The ViewPager has changed current page from swiping.
		// Or any other interaction with it that can cause page change.
		// Set the proper item in the controller.
		this.mBottomNavigationView.getMenu().getItem(position).setChecked(true);
		// Trigger the select event firing for the newly selected tab.
		((TabGroupProxy) getProxy()).onTabSelected(position);
	}

	@Override
	public void selectTab(TabProxy tabProxy)
	{

	}

	@Override
	public void setBackgroundDrawable(Drawable drawable) {
		this.mBottomNavigationView.setBackground(drawable);
	}

	@Override
	public boolean onMenuItemClick(MenuItem item) {
		// The controller has changed its selected item.
		int index = this.mMenuItemsArray.indexOf(item);
		if (index != currentlySelectedIndex) {
			((TabGroupProxy) getProxy()).getTabList().get(currentlySelectedIndex).fireEvent(TiC.EVENT_UNSELECTED, null, false);
			currentlySelectedIndex = index;
		}
		// Make the ViewPager to select the proper page too.
		selectTab(index);
		// Trigger the select event firing for the new tab.
		((TabGroupProxy) getProxy()).onTabSelected(index);
		return false;
	}
}
