/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tabgroup;

import android.animation.LayoutTransition;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewParent;
import android.view.Window;

import androidx.annotation.ColorInt;
import androidx.core.graphics.ColorUtils;

import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.bottomnavigation.BottomNavigationItemView;
import com.google.android.material.bottomnavigation.BottomNavigationMenuView;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.bottomnavigation.LabelVisibilityMode;
import com.google.android.material.shape.CornerFamily;
import com.google.android.material.shape.MaterialShapeDrawable;
import com.google.android.material.shape.ShapeAppearanceModel;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;

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
	private final ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	// endregion

	public TiUIBottomNavigationTabGroup(TabGroupProxy proxy, TiBaseActivity activity)
	{
		super(proxy, activity);
	}

	// Overriding addTab method to provide a proper guard for trying to add more tabs than the limit
	// for BottomNavigationView class.
	@Override
	public void addTab(TabProxy tabProxy)
	{
		if (this.mBottomNavigationView == null) {
			return;
		}
		final int MAX_TABS = this.mBottomNavigationView.getMaxItemCount();
		if (this.tabs.size() < MAX_TABS) {
			super.addTab(tabProxy);
		} else {
			Log.w(TAG, "Bottom style TabGroup cannot have more than " + MAX_TABS + " tabs.");
		}
	}

	@Override
	public void addViews(TiBaseActivity activity)
	{
		// Manually calculate the proper position of the BottomNavigationView.
		int resourceID = activity.getResources().getIdentifier("design_bottom_navigation_height", "dimen",
															   activity.getPackageName());
		this.mBottomNavigationHeightValue = activity.getResources().getDimensionPixelSize(resourceID);

		// Fetch padding properties. If at least 1 property is non-zero, then show a floating tab bar.
		final TiDimension paddingLeft = TiConvert.toTiDimension(
			this.proxy.getProperty(TiC.PROPERTY_PADDING_LEFT), TiDimension.TYPE_LEFT);
		final TiDimension paddingRight = TiConvert.toTiDimension(
			this.proxy.getProperty(TiC.PROPERTY_PADDING_RIGHT), TiDimension.TYPE_RIGHT);
		final TiDimension paddingBottom = TiConvert.toTiDimension(
			this.proxy.getProperty(TiC.PROPERTY_PADDING_BOTTOM), TiDimension.TYPE_BOTTOM);
		final boolean isFloating
			=  ((paddingLeft != null) && (paddingLeft.getValue() > 0))
			|| ((paddingRight != null) && (paddingRight.getValue() > 0))
			|| ((paddingBottom != null) && (paddingBottom.getValue() > 0));

		// Create the bottom tab navigation view.
		mBottomNavigationView = new BottomNavigationView(activity);
		mBottomNavigationView.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View view, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				// Update bottom inset based on tab bar's height and position in window.
				insetsProvider.setBottomBasedOn(view);
			}
		});
		if (isFloating) {
			// Set up tab bar to look like a floating toolbar with rounded corners.
			MaterialShapeDrawable shapeDrawable = null;
			Drawable background = this.mBottomNavigationView.getBackground();
			if (background instanceof MaterialShapeDrawable) {
				shapeDrawable = (MaterialShapeDrawable) background;
			} else {
				shapeDrawable = new MaterialShapeDrawable();
				background = shapeDrawable;
				mBottomNavigationView.setBackground(shapeDrawable);
			}
			ShapeAppearanceModel model = shapeDrawable.getShapeAppearanceModel();
			float radius = (new TiDimension("17dp", TiDimension.TYPE_LEFT)).getAsPixels(mBottomNavigationView);
			model = model.toBuilder().setAllCorners(CornerFamily.ROUNDED, radius).build();
			shapeDrawable.setShapeAppearanceModel(model);
			this.mBottomNavigationView.setPadding((int) (radius * 0.75), 0, (int) (radius * 0.75), 0);
			mBottomNavigationView.setElevation(
				(new TiDimension("8dp", TiDimension.TYPE_BOTTOM)).getAsPixels(mBottomNavigationView));
			this.mBottomNavigationView.setOnApplyWindowInsetsListener((view, insets) -> {
				// Add additional padding to compensate for device notch and translucent status/nav bars.
				int leftInsetPixels
					= ((paddingLeft != null) ? paddingLeft.getAsPixels(view) : 0)
					+ insets.getStableInsetLeft();
				int rightInsetPixels
					= ((paddingRight != null) ? paddingRight.getAsPixels(view) : 0)
					+ insets.getStableInsetRight();
				int bottomInsetPixels
					= ((paddingBottom != null) ? paddingBottom.getAsPixels(view) : 0)
					+ insets.getStableInsetBottom();
				TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) view.getLayoutParams();
				params.optionLeft = new TiDimension(leftInsetPixels, TiDimension.TYPE_LEFT);
				params.optionRight = new TiDimension(rightInsetPixels, TiDimension.TYPE_RIGHT);
				params.optionBottom = new TiDimension(bottomInsetPixels, TiDimension.TYPE_BOTTOM);
				insets.consumeSystemWindowInsets();
				return insets;
			});
		}
		this.mBottomNavigationView.setFitsSystemWindows(!isFloating);
		this.mBottomNavigationView.setItemRippleColor(
			TiUIAbstractTabGroup.createRippleColorStateListFrom(getColorPrimary()));

		// Add tab bar and view pager to the root Titanium view.
		// Note: If getFitsSystemWindows() returns false, then Titanium window's "extendSafeArea" is set true.
		//       This means the bottom tab bar should overlap/overlay the view pager content.
		TiCompositeLayout compositeLayout = (TiCompositeLayout) activity.getLayout();
		{
			TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
			params.autoFillsWidth = true;
			params.autoFillsHeight = true;
			if (compositeLayout.getFitsSystemWindows() && !isFloating) {
				params.optionBottom = new TiDimension(mBottomNavigationHeightValue, TiDimension.TYPE_BOTTOM);
			}
			compositeLayout.addView(this.tabGroupViewPager, params);
		}
		{
			TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
			params.autoFillsWidth = true;
			if (isFloating) {
				params.optionLeft = paddingLeft;
				params.optionRight = paddingRight;
				params.optionBottom = paddingBottom;
			} else {
				params.optionBottom = new TiDimension(0, TiDimension.TYPE_BOTTOM);
			}
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
	public void addTabItemInController(TiViewProxy tabProxy)
	{
		// Guard for the limit of tabs in the BottomNavigationView.
		if (this.mMenuItemsArray.size() == 5) {
			Log.e(TAG, "Trying to add more than five tabs in a TabGroup with TABS_STYLE_BOTTOM_NAVIGATION style.");
			return;
		}
		// Create a new item with id representing its index in mMenuItemsArray.
		MenuItem menuItem = this.mBottomNavigationView.getMenu().add(0, this.mMenuItemsArray.size(), 0, "");
		// Set the click listener.
		menuItem.setOnMenuItemClickListener(this);
		// Add the MenuItem to the menu of BottomNavigationView.
		this.mMenuItemsArray.add(menuItem);
		// Get the MenuItem index
		int index = this.mMenuItemsArray.size() - 1;
		updateDrawablesAfterNewItem(index);
		// Handle shift mode.
		final int shiftMode = proxy.getProperties().optInt(TiC.PROPERTY_SHIFT_MODE, 1);
		switch (shiftMode) {
			case 0:
				this.mBottomNavigationView.setLabelVisibilityMode(LabelVisibilityMode.LABEL_VISIBILITY_LABELED);
				break;
			case 1:
				this.mBottomNavigationView.setLabelVisibilityMode(LabelVisibilityMode.LABEL_VISIBILITY_AUTO);
				break;
			case 2:
				// NOTE: Undocumented for now, will create new property that has parity with iOS.
				this.mBottomNavigationView.setLabelVisibilityMode(LabelVisibilityMode.LABEL_VISIBILITY_UNLABELED);
				break;
		}
	}

	private void updateDrawablesAfterNewItem(int index)
	{
		// Set the title.
		updateTabTitle(index);
		// Set the icon.
		updateTabIcon(index);
		// Set the badge
		updateBadge(index);
		// Set the badge color
		updateBadgeColor(index);
		for (int i = 0; i < this.mBottomNavigationView.getMenu().size(); i++) {
			// Set the title text color.
			updateTabTitleColor(i);
			// Set the background drawable.
			updateTabBackgroundDrawable(i);
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
		for (TiUITab tabView : tabs) {
			addTabItemInController(tabView.getProxy());
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
		if ((currentlySelectedIndex >= 0) && (currentlySelectedIndex < this.tabs.size()) && (getProxy() != null)) {
			TiViewProxy tabProxy = this.tabs.get(currentlySelectedIndex).getProxy();
			if (tabProxy != null) {
				tabProxy.fireEvent(TiC.EVENT_UNSELECTED, null, false);
			}
		}
		currentlySelectedIndex = position;
		// The ViewPager has changed current page from swiping.
		// Or any other interaction with it that can cause page change.
		// Set the proper item in the controller.
		this.mBottomNavigationView.getMenu().getItem(position).setChecked(true);
		// Trigger the select event firing for the newly selected tab.
		((TabGroupProxy) getProxy()).onTabSelected(position);
	}

	@Override
	public void setBackgroundColor(int colorInt)
	{
		// Update tab bar's background color.
		Drawable drawable = mBottomNavigationView.getBackground();
		if (drawable instanceof MaterialShapeDrawable) {
			MaterialShapeDrawable shapeDrawable = (MaterialShapeDrawable) drawable;
			shapeDrawable.setFillColor(ColorStateList.valueOf(colorInt));
			shapeDrawable.setElevation(0); // Drawable will tint the fill color if elevation is non-zero.
		} else {
			mBottomNavigationView.setBackgroundColor(colorInt);
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
	public void updateTabBackgroundDrawable(int index)
	{
		try {
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			TiViewProxy tabProxy = tabs.get(index).getProxy();
			if (hasCustomBackground(tabProxy) || hasCustomIconTint(tabProxy)) {
				BottomNavigationMenuView bottomMenuView =
					((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
				Drawable drawable = createBackgroundDrawableForState(tabProxy, android.R.attr.state_checked);
				drawable = new RippleDrawable(createRippleColorStateListFrom(getActiveColor(tabProxy)), drawable, null);
				bottomMenuView.getChildAt(index).setBackground(drawable);
			}
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
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
		this.mBottomNavigationView.getMenu().getItem(index).setTitle(title);
	}

	public void setTabBarVisible(boolean visible)
	{
		ViewParent viewParent = this.tabGroupViewPager.getParent();

		// Resize the view pager (the tab's content) to compensate for shown/hidden tab bar.
		// Not applicable if Titanium "extendSafeArea" is true, because tab bar overlaps content in this case.
		if ((viewParent instanceof View) && ((View) viewParent).getFitsSystemWindows()) {
			TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
			params.autoFillsWidth = true;
			params.optionBottom = new TiDimension(!visible ? 0 : mBottomNavigationHeightValue, TiDimension.TYPE_BOTTOM);

			// make it a bit slower when moving up again so it won't show the background
			int duration = !visible ? 200 : 400;
			LayoutTransition lt = new LayoutTransition();
			lt.enableTransitionType(LayoutTransition.CHANGING);
			lt.setDuration(duration);
			this.tabGroupViewPager.setLayoutTransition(lt);
			this.tabGroupViewPager.setLayoutParams(params);
		}

		if (visible) {
			this.mBottomNavigationView.animate().translationY(0f).setDuration(200);
		} else {
			this.mBottomNavigationView.animate().translationY(mBottomNavigationView.getHeight()).setDuration(200);
		}

		this.insetsProvider.setBottomBasedOn(this.mBottomNavigationView);
	}

	@SuppressLint("RestrictedApi")
	@Override
	public void updateBadge(int index)
	{
		if ((index < 0) || (index >= this.tabs.size())) {
			return;
		}

		TiViewProxy tabProxy = this.tabs.get(index).getProxy();
		if (tabProxy == null) {
			return;
		}

		Object badgeValue = tabProxy.getProperty(TiC.PROPERTY_BADGE);
		if ((badgeValue == null) && !TiUIHelper.isUsingMaterialTheme(this.mBottomNavigationView.getContext())) {
			return;
		}

		int menuItemId = this.mBottomNavigationView.getMenu().getItem(index).getItemId();
		BadgeDrawable badgeDrawable = this.mBottomNavigationView.getOrCreateBadge(menuItemId);
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
			int menuItemId = this.mBottomNavigationView.getMenu().getItem(index).getItemId();
			BadgeDrawable badgeDrawable = this.mBottomNavigationView.getOrCreateBadge(menuItemId);
			badgeDrawable.setBackgroundColor(
				TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_BADGE_COLOR), tabProxy.getActivity()));
		}
	}

	@Override
	public void updateTabTitleColor(int index)
	{
		try {
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			TiViewProxy tabProxy = tabs.get(index).getProxy();
			if (hasCustomTextColor(tabProxy)) {
				// Set the TextView textColor.
				BottomNavigationMenuView bottomMenuView =
					((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
				((BottomNavigationItemView) bottomMenuView.getChildAt(index))
					.setTextColor(textColorStateList(tabProxy, android.R.attr.state_checked));
			}
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
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
		this.mBottomNavigationView.getMenu().getItem(index).setIcon(drawable);
	}

	@Override
	public String getTabTitle(int index)
	{
		// Validate index.
		if (index < 0 || index > tabs.size() - 1) {
			return null;
		}
		return this.mBottomNavigationView.getMenu().getItem(index).getTitle().toString();
	}

	/**
	 * After a menu item is clicked this method sends the proper index to the ViewPager to a select
	 * a page. Also takes care of sending SELECTED/UNSELECTED events from the proper tabs.
	 * @param item The menu item that was clicked on.
	 * @return Returns true if overridden and to prevent tab selection. Returns false to allow tab selection.
	 */
	@Override
	public boolean onMenuItemClick(MenuItem item)
	{
		// The controller has changed its selected item.
		int index = this.mMenuItemsArray.indexOf(item);
		// Guard for clicking on the currently selected tab.
		// This is required to have parity with the default style tab.
		if (index == this.currentlySelectedIndex) {
			return true;
		}
		if ((index != currentlySelectedIndex) && (getProxy() != null)) {
			if ((currentlySelectedIndex >= 0) && (currentlySelectedIndex < this.tabs.size())) {
				TiViewProxy tabProxy = this.tabs.get(currentlySelectedIndex).getProxy();
				if (tabProxy != null) {
					tabProxy.fireEvent(TiC.EVENT_UNSELECTED, null, false);
				}
			}
			currentlySelectedIndex = index;
		}
		// Make the ViewPager to select the proper page too.
		selectTab(index);

		// Trigger the select event firing for the new tab.
		((TabGroupProxy) getProxy()).onTabSelected(index);
		return false;
	}

	private void updateIconTint()
	{
		for (int i = 0; i < this.tabs.size(); i++) {
			final TiViewProxy tabProxy = this.tabs.get(i).getProxy();
			if (hasCustomIconTint(tabProxy)) {
				final boolean selected = i == currentlySelectedIndex;
				Drawable drawable = this.mBottomNavigationView.getMenu().getItem(i).getIcon();
				drawable = updateIconTint(tabProxy, drawable, selected);
				this.mBottomNavigationView.getMenu().getItem(i).setIcon(drawable);
			}
		}
	}

	@Override
	public void selectTab(int tabIndex)
	{
		super.selectTab(tabIndex);

		updateIconTint();
		updateTabBackgroundDrawable(tabIndex);
	}

	public static ColorStateList createRippleColorStateListFrom(@ColorInt int colorInt)
	{
		int[][] rippleStates = new int[][] {
			// Selected tab states.
			new int[] { android.R.attr.state_selected, android.R.attr.state_pressed },
			new int[] { android.R.attr.state_selected, android.R.attr.state_focused, android.R.attr.state_hovered },
			new int[] { android.R.attr.state_selected, android.R.attr.state_focused },
			new int[] { android.R.attr.state_selected, android.R.attr.state_hovered },
			new int[] { android.R.attr.state_selected },

			// Unselected tab states.
			new int[] { android.R.attr.state_pressed },
			new int[] { android.R.attr.state_focused, android.R.attr.state_hovered },
			new int[] { android.R.attr.state_focused },
			new int[] { android.R.attr.state_hovered },
			new int[] {}
		};
		int[] rippleColors = new int[] {
			// The "selected" tab tap colors.
			ColorUtils.setAlphaComponent(colorInt, 128),
			ColorUtils.setAlphaComponent(colorInt, 128),
			ColorUtils.setAlphaComponent(colorInt, 128),
			ColorUtils.setAlphaComponent(colorInt, 48),
			ColorUtils.setAlphaComponent(colorInt, 48),

			// The "unselected" tab tap color.
			ColorUtils.setAlphaComponent(colorInt, 128),
			ColorUtils.setAlphaComponent(colorInt, 128),
			ColorUtils.setAlphaComponent(colorInt, 128),
			ColorUtils.setAlphaComponent(colorInt, 48),
			ColorUtils.setAlphaComponent(colorInt, 48)
		};
		return new ColorStateList(rippleStates, rippleColors);
	}
}
