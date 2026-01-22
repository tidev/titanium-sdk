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
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.ColorUtils;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.bottomnavigation.BottomNavigationMenuView;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.navigation.NavigationBarView;
import com.google.android.material.shape.CornerFamily;
import com.google.android.material.shape.MaterialShapeDrawable;
import com.google.android.material.shape.ShapeAppearanceModel;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiIconDrawable;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import java.util.ArrayList;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.WindowProxy;

/**
 * TabGroup implementation using BottomNavigationView as a controller.
 */
public class TiUIBottomNavigation extends TiUIAbstractTabGroup implements BottomNavigationView.OnItemSelectedListener
{

	protected final static String TAG = "TiUIBottomNavigation";
	private static int id_layout = 0;
	private static int id_content = 0;
	private static int id_bottomNavigation = 0;
	private int currentlySelectedIndex = -1;
	private ArrayList<MenuItem> mMenuItemsArray = new ArrayList<MenuItem>();
	private static DrawerLayout layout = null;
	private FrameLayout centerView;
	private BottomNavigationView bottomNavigation;
	private ArrayList<Object> tabsArray = new ArrayList<Object>();
	private static AppCompatActivity activity;
	private TiViewProxy leftView;
	private TiViewProxy rightView;
	private FrameLayout leftFrame = null;
	private FrameLayout rightFrame = null;
	private int leftWidth;
	private int rightWidth;
	private ActionBarDrawerToggle drawerToggle = null;
	static int id_drawer_open_string = 0;
	static int id_drawer_close_string = 0;

	public TiUIBottomNavigation(TabGroupProxy proxy, TiBaseActivity activity)
	{
		super(proxy, activity);
	}

	// Overriding addTab method to provide a proper guard for trying to add more tabs than the limit
	// for BottomNavigationView class.
	@Override
	public void addTab(TabProxy tabProxy)
	{
		if (this.bottomNavigation == null) {
			return;
		}
		final int MAX_TABS = this.bottomNavigation.getMaxItemCount();
		if (this.tabs.size() < MAX_TABS) {
			super.addTab(tabProxy);
		} else {
			Log.w(TAG, "Bottom style TabGroup cannot have more than " + MAX_TABS + " tabs.");
		}
	}

	private Drawable setIcon(Object icon, Object iconFamily)
	{
		Drawable drawable = null;

		if (icon instanceof Number) {
			drawable = TiUIHelper.getResourceDrawable((int) icon);
		} else if (iconFamily != null) {
			drawable = new TiIconDrawable(TiConvert.toString(icon), TiConvert.toString(iconFamily));
		} else {
			drawable = TiUIHelper.getResourceDrawable(icon);
		}
		return drawable;
	}

	@Override
	public void addViews(TiBaseActivity activity)
	{
		mMenuItemsArray = new ArrayList<>();
		if (tabsArray == null) {
			tabsArray = new ArrayList<Object>();
		}

		try {
			id_layout = TiRHelper.getResource("layout.titanium_ui_bottom_navigation");
			id_content = TiRHelper.getResource("id.bottomNavBar_content");
			id_bottomNavigation = TiRHelper.getResource("id.bottomNavBar");

			LayoutInflater inflater = LayoutInflater.from(TiApplication.getAppRootOrCurrentActivity());
			layout = (DrawerLayout) inflater.inflate(id_layout, null, false);
			bottomNavigation = layout.findViewById(id_bottomNavigation);
			centerView = layout.findViewById(id_content);

			bottomNavigation.setOnItemSelectedListener(this);
			TiUIBottomNavigation.activity = activity;
			activity.setLayout(layout);
			if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_PADDING_LEFT)
				|| proxy.hasPropertyAndNotNull(TiC.PROPERTY_PADDING_RIGHT)
				|| proxy.hasPropertyAndNotNull(TiC.PROPERTY_PADDING_BOTTOM)) {
				// Floating Bottom Navigation
				// Fetch padding properties. If at least 1 property is non-zero, then show a floating tab bar.
				final TiDimension paddingLeft = TiConvert.toTiDimension(
					proxy.getProperty(TiC.PROPERTY_PADDING_LEFT), TiDimension.TYPE_LEFT);
				final TiDimension paddingRight = TiConvert.toTiDimension(
					proxy.getProperty(TiC.PROPERTY_PADDING_RIGHT), TiDimension.TYPE_RIGHT);
				final TiDimension paddingBottom = TiConvert.toTiDimension(
					proxy.getProperty(TiC.PROPERTY_PADDING_BOTTOM), TiDimension.TYPE_BOTTOM);
				final boolean isFloating
					= ((paddingLeft != null) && (paddingLeft.getValue() > 0))
					|| ((paddingRight != null) && (paddingRight.getValue() > 0))
					|| ((paddingBottom != null) && (paddingBottom.getValue() > 0));

				if (isFloating) {
					// Set up tab bar to look like a floating toolbar with rounded corners.
					int pLeft = (paddingLeft != null) ? paddingLeft.getAsPixels(bottomNavigation) : 0;
					int pRight = (paddingRight != null) ? paddingRight.getAsPixels(bottomNavigation) : 0;
					int pBottom = (paddingBottom != null) ? paddingBottom.getAsPixels(bottomNavigation) : 0;

					MaterialShapeDrawable shapeDrawable = null;
					Drawable background = bottomNavigation.getBackground();
					if (background instanceof MaterialShapeDrawable) {
						shapeDrawable = (MaterialShapeDrawable) background;
					} else {
						shapeDrawable = new MaterialShapeDrawable();
						background = shapeDrawable;
						bottomNavigation.setBackground(shapeDrawable);
					}
					ShapeAppearanceModel model = shapeDrawable.getShapeAppearanceModel();
					float radius = (new TiDimension("17dp", TiDimension.TYPE_LEFT)).getAsPixels(bottomNavigation);
					model = model.toBuilder().setAllCorners(CornerFamily.ROUNDED, radius).build();
					shapeDrawable.setShapeAppearanceModel(model);
					bottomNavigation.setPadding((int) (radius * 0.75), 0, (int) (radius * 0.75), 0);
					bottomNavigation.setElevation(
						(new TiDimension("8dp", TiDimension.TYPE_BOTTOM)).getAsPixels(bottomNavigation));
					RelativeLayout.LayoutParams params
						= (RelativeLayout.LayoutParams) bottomNavigation.getLayoutParams();
					params.setMargins(pLeft, 0, pRight, pBottom);

					RelativeLayout.LayoutParams paramsCenter
						= (RelativeLayout.LayoutParams) centerView.getLayoutParams();
					paramsCenter.removeRule(RelativeLayout.ABOVE);
				}
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
		setEnabled();
	}

	@Override
	public void addTabItemInController(TiViewProxy tabProxy)
	{
		// Guard for the limit of tabs in the BottomNavigationView.
		if (this.mMenuItemsArray.size() == 5) {
			Log.e(TAG, "Trying to add more than five tabs in a TabGroup with TABS_STYLE_BOTTOM_NAVIGATION style.");
			return;
		}

		tabsArray.add(tabProxy);
		MenuItem menuItem = bottomNavigation.getMenu().add(0, mMenuItemsArray.size(), 0, "");
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_TITLE)) {
			menuItem.setTitle(tabProxy.getProperty(TiC.PROPERTY_TITLE).toString());
		}
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_ICON)) {
			menuItem.setIcon(setIcon(tabProxy.getProperty(TiC.PROPERTY_ICON), tabProxy.getProperty("iconFamily")));
		}

		mMenuItemsArray.add(menuItem);
		int index = this.mMenuItemsArray.size() - 1;
		updateDrawablesAfterNewItem(index);

		final int shiftMode = proxy.getProperties().optInt(TiC.PROPERTY_SHIFT_MODE, 1);
		switch (shiftMode) {
			case 0:
				this.bottomNavigation.setLabelVisibilityMode(NavigationBarView.LABEL_VISIBILITY_LABELED);
				break;
			case 1:
				this.bottomNavigation.setLabelVisibilityMode(NavigationBarView.LABEL_VISIBILITY_AUTO);
				break;
			case 2:
				// NOTE: Undocumented for now, will create new property that has parity with iOS.
				this.bottomNavigation.setLabelVisibilityMode(NavigationBarView.LABEL_VISIBILITY_UNLABELED);
				break;
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
		this.bottomNavigation.getMenu().clear();
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
		// select first tab and fire event
		currentlySelectedIndex = position;
		((TabGroupProxy) getProxy()).onTabSelected(position);
	}

	private void updateDrawablesAfterNewItem(int index)
	{
		updateTabTitle(index);
		updateTabIcon(index);
		updateBadge(index);
		updateBadgeColor(index);

		for (int i = 0; i < this.bottomNavigation.getMenu().size(); i++) {
			// Set the title text color.
			updateTabTitleColor(i);
			// Set the background drawable.
			updateTabBackgroundDrawable(i);
		}
	}

	@Override
	public void setBackgroundColor(int colorInt)
	{
		if (bottomNavigation == null) {
			return;
		}
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
			TiViewProxy tabProxy = ((TabProxy) tabsArray.get(index));
			boolean hasTouchFeedback = TiConvert.toBoolean(tabProxy.getProperty(TiC.PROPERTY_TOUCH_FEEDBACK), true);
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

			if (!hasTouchFeedback) {
				Drawable drawable = new RippleDrawable(ColorStateList.valueOf(Color.TRANSPARENT), null, null);
				this.bottomNavigation.getChildAt(0).setBackground(drawable);
			}

			if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BACKGROUND_COLOR)) {
				BottomNavigationMenuView bottomMenuView =
					((BottomNavigationMenuView) this.bottomNavigation.getChildAt(0));
				bottomMenuView.getChildAt(index).setBackgroundColor(TiConvert.toColor(
					tabProxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR), TiApplication.getAppRootOrCurrentActivity()
				));
			}
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	@Override
	public void updateTabTitle(int index)
	{
		if ((index < 0) || (index >= this.tabs.size()) || tabsArray == null || tabsArray.isEmpty()) {
			return;
		}

		TiViewProxy tabProxy = ((TabProxy) tabsArray.get(index));
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
		if ((index < 0) || (index >= tabsArray.size())) {
			return;
		}

		TiViewProxy tabProxy = ((TabProxy) tabsArray.get(index));
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

		TiViewProxy tabProxy = ((TabProxy) tabsArray.get(index));
		if (tabProxy == null) {
			return;
		}

		// TODO: reset to default value when property is null
		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_BADGE_COLOR)) {
			Log.w(TAG, "badgeColor is deprecated.  Use badgeBackgroundColor instead.");
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
			TiViewProxy tabProxy = ((TabProxy) tabsArray.get(index));
			if (hasCustomTextColor(tabProxy)) {
				this.bottomNavigation.setItemTextColor(textColorStateList(tabProxy, android.R.attr.state_checked));
			}
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
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
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
		}
	}

	@Override
	public void updateTabIcon(int index)
	{
		if ((index < 0) || (index >= this.tabs.size()) || tabsArray == null || tabsArray.isEmpty()) {
			return;
		}

		TiViewProxy tabProxy = ((TabProxy) tabsArray.get(index));
		if (tabProxy == null) {
			return;
		}

		if (tabProxy.hasPropertyAndNotNull(TiC.PROPERTY_ICON)) {
			this.bottomNavigation.getMenu().getItem(index).setIcon(setIcon(
				tabProxy.getProperty(TiC.PROPERTY_ICON),
				tabProxy.getProperty("iconFamily")
			));
		}
		updateIconTint();
	}

	private void updateIconTint()
	{
		for (int i = 0; i < this.bottomNavigation.getMenu().size(); i++) {
			if (i < tabsArray.size()) {
				TiViewProxy tabProxy = ((TabProxy) tabsArray.get(i));
				if (hasCustomIconTint(tabProxy)) {
					final boolean selected = i == currentlySelectedIndex;
					Drawable drawable = this.bottomNavigation.getMenu().getItem(i).getIcon();
					drawable = updateIconTint(tabProxy, drawable, selected);
					this.bottomNavigation.getMenu().getItem(i).setIcon(drawable);
				}
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
	public void setEnabled()
	{
		for (int i = 0; i < this.bottomNavigation.getMenu().size(); i++) {
			this.bottomNavigation.getMenu().getItem(i).setEnabled(!tabsDisabled);
		}
	}

	@Override
	public void selectTab(int tabIndex)
	{
		super.selectTab(tabIndex);
		if (tabsArray == null || tabsArray.isEmpty()) {
			return;
		}

		// unselected event
		if ((currentlySelectedIndex >= 0) && (tabIndex != currentlySelectedIndex)
			&& (currentlySelectedIndex < this.tabs.size()) && (getProxy() != null)) {
			TiViewProxy tabProxy = ((TabProxy) tabsArray.get(currentlySelectedIndex));
			if (tabProxy != null) {
				tabProxy.fireEvent(TiC.EVENT_UNSELECTED, null, false);
			}
		}
		currentlySelectedIndex = tabIndex;

		TabProxy tp = ((TabProxy) tabsArray.get(tabIndex));
		if (tp != null) {
			TiUITab abstractTab = new TiUITab(tp);

			centerView.removeAllViews();
			TiUIView view = abstractTab.getWindowProxy().getOrCreateView();
			if (view != null) {
				centerView.addView(view.getOuterView());
			}
		}
		updateIconTint();
	}

	@Override
	public boolean onNavigationItemSelected(@NonNull MenuItem item)
	{
		item.setChecked(true);
		selectTab(item.getItemId());
		((TabGroupProxy) getProxy()).onTabSelected(item.getItemId());
		return true;
	}

	public void showHideTabBar(boolean visible)
	{
		super.setTabGroupVisibilityWithAnimation(bottomNavigation, visible);
	}

	public void setTabGroupVisibility(boolean visible)
	{
		super.setTabGroupVisibility(bottomNavigation, visible);
	}

	@Override
	public void onViewSizeAvailable(Runnable runnable)
	{
		if (bottomNavigation.getHeight() > 0) {
			// Height is already available, run immediately.
			runnable.run();
		} else {
			// Height not available, post it to run after a layout pass.
			bottomNavigation.post(runnable);
		}
	}

	private void initLeft()
	{
		if (leftFrame != null) {
			return;
		}
		leftFrame = new FrameLayout(proxy.getActivity());

		DrawerLayout.LayoutParams frameLayout = new DrawerLayout.LayoutParams(DrawerLayout.LayoutParams.WRAP_CONTENT,
			DrawerLayout.LayoutParams.MATCH_PARENT);
		frameLayout.gravity = GravityCompat.START;
		leftFrame.setLayoutParams(frameLayout);

		layout.addView(leftFrame);

		if (drawerToggle == null) {
			initDrawerToggle();
		}
	}

	private void initRight()
	{
		if (rightFrame != null) {
			return;
		}
		rightFrame = new FrameLayout(proxy.getActivity());

		DrawerLayout.LayoutParams frameLayout = new DrawerLayout.LayoutParams(DrawerLayout.LayoutParams.WRAP_CONTENT,
			DrawerLayout.LayoutParams.MATCH_PARENT);
		frameLayout.gravity = GravityCompat.END;
		rightFrame.setLayoutParams(frameLayout);

		layout.addView(rightFrame);

		if (drawerToggle == null) {
			initDrawerToggle();
		}
	}

	private void initDrawerToggle()
	{

		final AppCompatActivity activity = (AppCompatActivity) proxy.getActivity();
		if (activity == null) {
			return;
		}
		if (activity.getSupportActionBar() != null) {
			activity.getSupportActionBar().setHomeButtonEnabled(true);
			activity.getSupportActionBar().setDisplayHomeAsUpEnabled(true);
		}

		try {
			if (id_drawer_open_string == 0) {
				id_drawer_open_string = TiRHelper.getResource("string.drawer_layout_open");
			}
			if (id_drawer_close_string == 0) {
				id_drawer_close_string = TiRHelper.getResource("string.drawer_layout_close");
			}
		} catch (Exception ex) {}

		drawerToggle = new ActionBarDrawerToggle(activity, layout, id_drawer_open_string, id_drawer_close_string) {
			@Override
			public void onDrawerClosed(View drawerView)
			{
				super.onDrawerClosed(drawerView);
				// Ensure the home button stays enabled and visible
				if (activity.getSupportActionBar() != null) {
					activity.getSupportActionBar().setDisplayHomeAsUpEnabled(true);
					activity.getSupportActionBar().setHomeButtonEnabled(true);
				}
				drawerClosedEvent(drawerView);
			}

			@Override
			public void onDrawerOpened(View drawerView)
			{
				super.onDrawerOpened(drawerView);
				// Ensure the home button stays enabled and visible
				if (activity.getSupportActionBar() != null) {
					activity.getSupportActionBar().setDisplayHomeAsUpEnabled(true);
					activity.getSupportActionBar().setHomeButtonEnabled(true);
				}
				drawerOpenedEvent(drawerView);
			}

			@Override
			public void onDrawerSlide(View drawerView, float slideOffset)
			{
				super.onDrawerSlide(drawerView, slideOffset);
				drawerSlideEvent(drawerView, slideOffset);
			}

			@Override
			public void onDrawerStateChanged(int state)
			{
				super.onDrawerStateChanged(state);
				drawerStateChangedEvent(state);
			}
		};
		layout.addDrawerListener(drawerToggle);
		layout.post(new Runnable() {
			@Override
			public void run()
			{
				drawerToggle.syncState();
				// Ensure initial state is correct
				if (activity.getSupportActionBar() != null) {
					activity.getSupportActionBar().setDisplayHomeAsUpEnabled(true);
					activity.getSupportActionBar().setHomeButtonEnabled(true);
				}
			}
		});
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);
		if (d.containsKey(TiC.PROPERTY_LEFT_VIEW)) {
			Object leftView = d.get(TiC.PROPERTY_LEFT_VIEW);
			if (leftView instanceof TiViewProxy) {
				if (leftView instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				this.leftView = (TiViewProxy) leftView;
				this.initLeft();
				this.leftFrame.addView(getNativeView(this.leftView));
			} else {
				Log.e(TAG, "invalid type for leftView");
			}
		}
		if (d.containsKey(TiC.PROPERTY_RIGHT_VIEW)) {
			Object rightView = d.get(TiC.PROPERTY_RIGHT_VIEW);
			if (rightView instanceof TiViewProxy) {
				if (rightView instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				this.rightView = (TiViewProxy) rightView;
				this.initRight();
				this.rightFrame.addView(getNativeView(this.rightView));
			} else {
				Log.e(TAG, "invalid type for rightView");
			}
		}
		if (d.containsKey(TiC.PROPERTY_LEFT_WIDTH)) {
			if (leftFrame != null) {
				if (d.get(TiC.PROPERTY_LEFT_WIDTH).equals(TiC.LAYOUT_SIZE)) {
					leftFrame.getLayoutParams().width = DrawerLayout.LayoutParams.WRAP_CONTENT;
				} else if (d.get(TiC.PROPERTY_LEFT_WIDTH).equals(TiC.LAYOUT_FILL)) {
					leftFrame.getLayoutParams().width = DrawerLayout.LayoutParams.MATCH_PARENT;
				} else if (!d.get(TiC.PROPERTY_LEFT_WIDTH).equals(TiC.SIZE_AUTO)) {
					leftWidth = getDevicePixels(d.get(TiC.PROPERTY_LEFT_WIDTH));
					leftFrame.getLayoutParams().width = leftWidth;
				}
			}
		} else {
			if (leftFrame != null) {
				leftFrame.getLayoutParams().width = DrawerLayout.LayoutParams.MATCH_PARENT;
			}
		}
		if (d.containsKey(TiC.PROPERTY_RIGHT_WIDTH)) {
			if (rightFrame != null) {
				if (d.get(TiC.PROPERTY_RIGHT_WIDTH).equals(TiC.LAYOUT_SIZE)) {
					rightFrame.getLayoutParams().width = DrawerLayout.LayoutParams.WRAP_CONTENT;
				} else if (d.get(TiC.PROPERTY_RIGHT_WIDTH).equals(TiC.LAYOUT_FILL)) {
					rightFrame.getLayoutParams().width = DrawerLayout.LayoutParams.MATCH_PARENT;
				} else if (!d.get(TiC.PROPERTY_RIGHT_WIDTH).equals(TiC.SIZE_AUTO)) {
					rightWidth = getDevicePixels(d.get(TiC.PROPERTY_RIGHT_WIDTH));
					rightFrame.getLayoutParams().width = rightWidth;
				}
			}
		} else {
			if (rightFrame != null) {
				rightFrame.getLayoutParams().width = DrawerLayout.LayoutParams.MATCH_PARENT;
			}
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		super.propertyChanged(key, oldValue, newValue, proxy);
		if (key.equals(TiC.PROPERTY_LEFT_VIEW)) {
			if (newValue == null || newValue == this.leftView) {
				return;
			}
			TiViewProxy newProxy = null;
			int index = 0;
			boolean isFirst = false;
			if (this.leftView != null) {
				index = this.leftFrame.indexOfChild(this.leftView.getOrCreateView().getNativeView());
			} else {
				// first left view
				isFirst = true;
			}
			if (newValue instanceof TiViewProxy) {
				if (newValue instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				newProxy = (TiViewProxy) newValue;
				initLeft();
				this.leftFrame.addView(newProxy.getOrCreateView().getOuterView(), index);
			} else {
				Log.e(TAG, "invalid type for leftView");
			}
			if (this.leftView != null) {
				this.leftFrame.removeView(this.leftView.getOrCreateView().getNativeView());
			}
			this.leftView = newProxy;
			if (isFirst) {
				// set initial width
				leftFrame.getLayoutParams().width = DrawerLayout.LayoutParams.MATCH_PARENT;
			}
		} else if (key.equals(TiC.PROPERTY_RIGHT_VIEW)) {
			if (newValue == null || newValue == this.rightView) {
				return;
			}
			TiViewProxy newProxy = null;
			int index = 0;
			boolean isFirst = false;
			if (this.rightView != null) {
				index = this.rightFrame.indexOfChild(this.rightView.getOrCreateView().getNativeView());
			} else {
				// first left view
				isFirst = true;
			}
			if (newValue instanceof TiViewProxy) {
				if (newValue instanceof WindowProxy) {
					throw new IllegalStateException("cannot add window as a child view of other window");
				}
				newProxy = (TiViewProxy) newValue;
				initRight();
				this.rightFrame.addView(newProxy.getOrCreateView().getOuterView(), index);
			} else {
				Log.e(TAG, "invalid type for rightView");
			}
			if (this.rightView != null) {
				this.rightFrame.removeView(this.rightView.getOrCreateView().getNativeView());
			}
			this.rightView = newProxy;
			if (isFirst) {
				// set initial width
				rightFrame.getLayoutParams().width = DrawerLayout.LayoutParams.MATCH_PARENT;
			}
		} else if (key.equals(TiC.PROPERTY_LEFT_WIDTH)) {
			if (leftFrame == null) {
				return;
			}
			initLeft();

			if (newValue.equals(TiC.LAYOUT_SIZE)) {
				leftWidth = DrawerLayout.LayoutParams.WRAP_CONTENT;
			} else if (newValue.equals(TiC.LAYOUT_FILL)) {
				leftWidth = DrawerLayout.LayoutParams.MATCH_PARENT;
			} else if (!newValue.equals(TiC.SIZE_AUTO)) {
				leftWidth = getDevicePixels(newValue);
			}

			DrawerLayout.LayoutParams leftFrameLayout =
				new DrawerLayout.LayoutParams(leftWidth, DrawerLayout.LayoutParams.MATCH_PARENT);
			leftFrameLayout.gravity = GravityCompat.START;
			this.leftFrame.setLayoutParams(leftFrameLayout);

		} else if (key.equals(TiC.PROPERTY_RIGHT_WIDTH)) {
			if (rightFrame == null) {
				return;
			}
			initRight();

			if (newValue.equals(TiC.LAYOUT_SIZE)) {
				rightWidth = DrawerLayout.LayoutParams.WRAP_CONTENT;
			} else if (newValue.equals(TiC.LAYOUT_FILL)) {
				rightWidth = DrawerLayout.LayoutParams.MATCH_PARENT;
			} else if (!newValue.equals(TiC.SIZE_AUTO)) {
				rightWidth = getDevicePixels(newValue);
			}

			DrawerLayout.LayoutParams rightFrameLayout =
				new DrawerLayout.LayoutParams(rightWidth, DrawerLayout.LayoutParams.MATCH_PARENT);
			rightFrameLayout.gravity = GravityCompat.END;
			this.rightFrame.setLayoutParams(rightFrameLayout);

		} else if (key.equals(TiC.PROPERTY_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_LEFT_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(newValue), GravityCompat.START);
		} else if (key.equals(TiC.PROPERTY_RIGHT_DRAWER_LOCK_MODE)) {
			layout.setDrawerLockMode(TiConvert.toInt(newValue), GravityCompat.END);
		}
	}

	private int getDevicePixels(Object value)
	{
		TiDimension nativeSize = TiConvert.toTiDimension(TiConvert.toString(value), TiDimension.TYPE_WIDTH);
		return nativeSize.getAsPixels(layout);
	}

	private View getNativeView(TiViewProxy viewProxy)
	{
		TiUIView view = viewProxy.getOrCreateView();
		View outerView = view.getOuterView();
		View nativeView = outerView != null ? outerView : view.getNativeView();
		ViewGroup parentViewGroup = (ViewGroup) nativeView.getParent();
		if (parentViewGroup != null) {
			parentViewGroup.removeAllViews();
		}
		return nativeView;
	}

	public void toggleLeft()
	{
		if (layout.isDrawerOpen(GravityCompat.START)) {
			closeLeft();
		} else {
			openLeft();
		}
	}

	public void openLeft()
	{
		layout.openDrawer(GravityCompat.START);
	}

	public void closeLeft()
	{
		layout.closeDrawer(GravityCompat.START);
	}

	public void toggleRight()
	{
		if (layout.isDrawerOpen(GravityCompat.END)) {
			closeRight();
		} else {
			openRight();
		}
	}

	public void openRight()
	{
		layout.openDrawer(GravityCompat.END);
	}

	public void closeRight()
	{
		layout.closeDrawer(GravityCompat.END);
	}

	public boolean isLeftOpen()
	{
		return layout.isDrawerOpen(GravityCompat.START);
	}

	public boolean isRightOpen()
	{
		return layout.isDrawerOpen(GravityCompat.END);
	}

	public boolean isLeftVisible()
	{
		return layout.isDrawerVisible(GravityCompat.START);
	}

	public boolean isRightVisible()
	{
		return layout.isDrawerVisible(GravityCompat.END);
	}

	private void drawerClosedEvent(View drawerView)
	{
		if (proxy.hasListeners(TiC.EVENT_CLOSE)) {
			KrollDict options = new KrollDict();
			if (drawerView.equals(leftFrame)) {
				options.put("drawer", "left");
			} else if (drawerView.equals(rightFrame)) {
				options.put("drawer", "right");
			}
			proxy.fireEvent(TiC.EVENT_CLOSE, options);
		}
	}

	private void drawerOpenedEvent(View drawerView)
	{
		if (proxy.hasListeners(TiC.EVENT_OPEN)) {
			KrollDict options = new KrollDict();
			if (drawerView.equals(leftFrame)) {
				options.put("drawer", "left");
			} else if (drawerView.equals(rightFrame)) {
				options.put("drawer", "right");
			}
			proxy.fireEvent(TiC.EVENT_OPEN, options);
		}
	}

	private void drawerStateChangedEvent(int state)
	{
		if (proxy.hasListeners(TiC.EVENT_CHANGE)) {
			KrollDict options = new KrollDict();
			options.put("state", state);
			options.put("idle", (state == DrawerLayout.STATE_IDLE));
			options.put("dragging", (state == DrawerLayout.STATE_DRAGGING));
			options.put("settling", (state == DrawerLayout.STATE_SETTLING));
			proxy.fireEvent(TiC.EVENT_CHANGE, options);
		}
	}

	private void drawerSlideEvent(View drawerView, float slideOffset)
	{
		if (proxy.hasListeners(TiC.EVENT_SLIDE)) {
			KrollDict options = new KrollDict();
			options.put("offset", slideOffset);
			if (drawerView.equals(leftFrame)) {
				options.put("drawer", "left");
			} else if (drawerView.equals(rightFrame)) {
				options.put("drawer", "right");
			}
			proxy.fireEvent(TiC.EVENT_SLIDE, options);
		}
	}
}
