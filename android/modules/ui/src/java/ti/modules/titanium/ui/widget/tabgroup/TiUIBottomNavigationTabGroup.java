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
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.Window;

import androidx.annotation.ColorInt;
import androidx.core.graphics.ColorUtils;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.bottomnavigation.BottomNavigationItemView;
import com.google.android.material.bottomnavigation.BottomNavigationMenuView;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationBarView;
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
	// BottomNavigationView lacks anything similar to onTabUnselected method of TabLayout.OnTabSelectedListener.
	// We track the previously selected item index manually to mimic the behavior in order to keep parity across styles.
	private int currentlySelectedIndex = -1;
	private BottomNavigationView mBottomNavigationView;
	private final ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	// The tab bar's last known rendered height. A hidden tab bar measures zero, so we keep the
	// last non-zero value in order to restore the content offset when it is shown again.
	private int lastTabBarHeight;
	// The bottom offset currently applied to the view pager. Used to avoid re-assigning layout
	// params with an unchanged value, which would trigger an endless layout pass.
	private int appliedViewPagerOffset = -1;
	// Set true if the tab bar is styled as a floating toolbar, in which case it is meant to
	// overlay the tab content instead of offsetting it.
	private boolean isFloatingTabBar;
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

		this.isFloatingTabBar = isFloating;

		// Create the bottom tab navigation view.
		mBottomNavigationView = new BottomNavigationView(activity);
		mBottomNavigationView.addOnLayoutChangeListener(new View.OnLayoutChangeListener() {
			@Override
			public void onLayoutChange(
				View view, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				// Update bottom inset based on tab bar's actual height and position in window.
				insetsProvider.setBottomBasedOn(view);

				// Remember the tab bar's rendered height for as long as it has one.
				if (view.getHeight() > 0) {
					lastTabBarHeight = view.getHeight();
				}

				// Offset the tab content so that the tab bar does not cover it. This must be done
				// here rather than in addViews() because the tab bar's height is not known until
				// it has been laid out at least once.
				updateViewPagerBottomOffset(view.getVisibility() == View.VISIBLE);
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
		//       Otherwise the view pager is offset by the tab bar's measured height via
		//       updateViewPagerBottomOffset(), once the tab bar has been laid out.
		TiCompositeLayout compositeLayout = (TiCompositeLayout) activity.getLayout();
		{
			TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
			params.autoFillsWidth = true;
			params.autoFillsHeight = true;
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
		setEnabled();
	}

	/**
	 * Enable or disable tabs click event.
	 */
	@Override
	public void setEnabled()
	{
		Menu menu = this.mBottomNavigationView.getMenu();
		for (int i = 0; i < menu.size(); i++) {
			menu.getItem(i).setEnabled(!tabsDisabled);
		}
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
				this.mBottomNavigationView.setLabelVisibilityMode(NavigationBarView.LABEL_VISIBILITY_LABELED);
				break;
			case 1:
				this.mBottomNavigationView.setLabelVisibilityMode(NavigationBarView.LABEL_VISIBILITY_AUTO);
				break;
			case 2:
				// NOTE: Undocumented for now, will create new property that has parity with iOS.
				this.mBottomNavigationView.setLabelVisibilityMode(NavigationBarView.LABEL_VISIBILITY_UNLABELED);
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
		if (drawable instanceof MaterialShapeDrawable shapeDrawable) {
			shapeDrawable.setFillColor(ColorStateList.valueOf(colorInt));
			shapeDrawable.setElevation(0); // Drawable will tint the fill color if elevation is non-zero.
		} else {
			mBottomNavigationView.setBackgroundColor(colorInt);
		}

		// Apply given color to bottom navigation bar if using a "solid" theme.
		if (isUsingSolidTitaniumTheme() && (Build.VERSION.SDK_INT >= 27)) {
			Activity activity = (this.proxy != null) ? this.proxy.getActivity() : null;
			Window window = (activity != null) ? activity.getWindow() : null;
			if (window != null) {
				window.setNavigationBarColor(colorInt);
				WindowInsetsControllerCompat insetsController =
					WindowCompat.getInsetsController(window, window.getDecorView());
				if (insetsController != null) {
					insetsController.setAppearanceLightNavigationBars(
						ColorUtils.calculateLuminance(colorInt) > 0.5);
				}
			}
		}
	}

	@Override
	public void updateTabBackgroundDrawable(int index)
	{
		try {
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			TiViewProxy tabProxy = tabs.get(index).getProxy();
			boolean hasTouchFeedbackColor = tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR);
			if (hasCustomBackground(tabProxy) || hasCustomIconTint(tabProxy) || hasTouchFeedbackColor) {
				BottomNavigationMenuView bottomMenuView =
					((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
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
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	@Override
	public void updateActiveIndicatorColor(int color)
	{

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

	public void showHideTabBar(boolean visible)
	{
		super.setTabGroupViewPagerLayout(visible, this.lastTabBarHeight, true);
		this.appliedViewPagerOffset = visible ? this.lastTabBarHeight : 0;
		super.setTabGroupVisibilityWithAnimation(mBottomNavigationView, visible);
	}

	public void setTabGroupVisibility(boolean visible)
	{
		super.setTabGroupViewPagerLayout(visible, this.lastTabBarHeight, false);
		this.appliedViewPagerOffset = visible ? this.lastTabBarHeight : 0;
		super.setTabGroupVisibility(mBottomNavigationView, visible);
	}

	/**
	 * Offsets the bottom of the tab content so that the tab bar does not overlap it.
	 * <p>
	 * Called whenever the tab bar is laid out, since the bar's height is only known at that point.
	 * @param tabBarVisible Set true if the tab bar is currently shown.
	 */
	private void updateViewPagerBottomOffset(boolean tabBarVisible)
	{
		// A floating tab bar is meant to overlay the content.
		if (this.isFloatingTabBar) {
			return;
		}

		// Not applicable if Titanium's "extendSafeArea" is true, because the tab bar is
		// supposed to overlap the content in that case.
		ViewParent viewParent = this.tabGroupViewPager.getParent();
		if (!(viewParent instanceof View) || !((View) viewParent).getFitsSystemWindows()) {
			return;
		}

		ViewGroup.LayoutParams layoutParams = this.tabGroupViewPager.getLayoutParams();
		if (!(layoutParams instanceof TiCompositeLayout.LayoutParams)) {
			return;
		}

		// Only re-apply when the offset has actually changed. Assigning layout params from
		// within a layout pass would otherwise cause an endless layout loop.
		int offset = tabBarVisible ? this.lastTabBarHeight : 0;
		if (offset == this.appliedViewPagerOffset) {
			return;
		}
		this.appliedViewPagerOffset = offset;

		TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) layoutParams;
		params.optionBottom = new TiDimension(offset, TiDimension.TYPE_BOTTOM);
		this.tabGroupViewPager.setLayoutParams(params);
	}

	@Override
	public void onViewSizeAvailable(Runnable runnable)
	{
		if (mBottomNavigationView.getHeight() > 0) {
			// Height is already available, run immediately.
			runnable.run();
		} else {
			// Height not available, post it to run after a layout pass.
			mBottomNavigationView.post(runnable);
		}
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
			Log.w(TAG, "badgeColor is deprecated.  Use badgeBackgroundColor instead.");
			int menuItemId = this.mBottomNavigationView.getMenu().getItem(index).getItemId();
			BadgeDrawable badgeDrawable = this.mBottomNavigationView.getOrCreateBadge(menuItemId);
			badgeDrawable.setBackgroundColor(
				TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_BADGE_COLOR), tabProxy.getActivity()));
		}
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BADGE_BACKGROUND_COLOR)) {
			int menuItemId = this.mBottomNavigationView.getMenu().getItem(index).getItemId();
			BadgeDrawable badgeDrawable = this.mBottomNavigationView.getOrCreateBadge(menuItemId);
			badgeDrawable.setBackgroundColor(
				TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_BADGE_BACKGROUND_COLOR), tabProxy.getActivity()));
		}
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BADGE_TEXT_COLOR)) {
			int menuItemId = this.mBottomNavigationView.getMenu().getItem(index).getItemId();
			BadgeDrawable badgeDrawable = this.mBottomNavigationView.getOrCreateBadge(menuItemId);
			badgeDrawable.setBadgeTextColor(
				TiConvert.toColor(tabProxy.getProperty(TiC.PROPERTY_BADGE_TEXT_COLOR), tabProxy.getActivity()));
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
		updateIconTint();
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
		if (tabsDisabled) {
			return true;
		}

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
