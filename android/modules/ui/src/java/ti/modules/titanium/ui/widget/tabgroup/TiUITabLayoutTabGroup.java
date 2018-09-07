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
import android.support.design.widget.TabLayout;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiColorHelper;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

/**
 * Tab group implementation using the Action Bar navigation tabs.
 *
 * When the target SDK version and device framework level is 11 or higher
 * we will use this implementation to place the tabs inside the action bar.
 * Each tab window provides a fragment which is made visible by a fragment
 * transaction when it is selected.
 *
 * See http://developer.android.com/guide/topics/ui/actionbar.html#Tabs
 * for further details on how Action bar tabs work.
 */
public class TiUITabLayoutTabGroup extends TiUIAbstractTabGroup
{
	TabLayout mTabLayout;

	public TiUITabLayoutTabGroup(TabGroupProxy proxy, TiBaseActivity activity, Bundle savedInstanceState)
	{
		// Setup the action bar for navigation tabs.
		super(proxy, activity, savedInstanceState);

	}

	@Override
	public void disableTabNavigation(boolean disable) {
		if (disable) {
			mTabLayout.setVisibility(View.GONE);
		} else {
			mTabLayout.setVisibility(View.VISIBLE);
		}
	}

	@Override
	public void addViews(TiBaseActivity activity) {

		mTabLayout = new TabLayout(activity);
		// Set the colorPrimary as backgroundColor by default

		mTabLayout.setBackgroundColor(colorPrimaryInt);

		/*TypedArray textColorPrimary = activity.obtainStyledAttributes(typedValue.data, new int[] { android.R.attr.textColor });
		int textColor = textColorPrimary.getColor(0, 0);
		mTabLayout.setTabTextColors(Color.rgb(255, 255, 255), Color.rgb(255, 255, 255));*/

		mTabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
			@Override
			public void onTabSelected(TabLayout.Tab tab) {
				selectTab(mTabLayout.getSelectedTabPosition());
			}

			@Override
			public void onTabUnselected(TabLayout.Tab tab) {

			}

			@Override
			public void onTabReselected(TabLayout.Tab tab) {

			}
		});
		TiCompositeLayout.LayoutParams tabLayoutLP = new TiCompositeLayout.LayoutParams();
		tabLayoutLP.autoFillsWidth = true;
		mTabLayout.setLayoutParams(tabLayoutLP);
		((TiCompositeLayout) activity.getLayout()).setLayoutArrangement(TiC.LAYOUT_VERTICAL);
		TiCompositeLayout.LayoutParams params = new TiCompositeLayout.LayoutParams();
		params.autoFillsWidth = true;
		((ViewGroup) activity.getLayout()).addView(mTabLayout);
		((ViewGroup) activity.getLayout()).addView(tabGroupViewPager, params);
		setNativeView(tabGroupViewPager);
	}

	@Override
	public void addTabItemInController(TabProxy tabProxy) {

		TabLayout.Tab newTab = mTabLayout.newTab();
		// Set the title.
		newTab.setText(tabProxy.getProperty(TiC.PROPERTY_TITLE).toString());
		// Set the icon.
		Drawable iconDrawable = TiDrawableReference.fromObject(getProxy(), tabProxy.getProperty(TiC.PROPERTY_ICON)).getDrawable();
		newTab.setIcon(iconDrawable);
		mTabLayout.addTab(newTab);

		RippleDrawable backgroundRippleDrawable = createBackgroundDrawableForState(tabProxy, android.R.attr.state_selected);

		// Go through the layout to set the background color state drawable manually for each tab.
		// Currently we support only the default type of TabLayout which has a SlidingTabStrip.
		try {
			LinearLayout stripLayout = ((LinearLayout) mTabLayout.getChildAt(0));
			// Get the just added TabView as a LinearLayout in order to set the background.
			LinearLayout tabLL = ((LinearLayout) stripLayout.getChildAt(mTabLayout.getTabCount() - 1));
			tabLL.setBackground(backgroundRippleDrawable);
		} catch (Exception e) {
			Log.w(TAG, WARNING_LAYOUT_MESSAGE);
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
			if (tabsDisabled) {
				savedSwipeable = TiConvert.toBoolean(newValue);
			} else {
				swipeable = TiConvert.toBoolean(newValue);
			}
		} else if (key.equals(TiC.PROPERTY_SMOOTH_SCROLL_ON_TAB_CLICK)) {
			smoothScrollOnTabClick = TiConvert.toBoolean(newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void removeTabItemFromController(int position) {

	}

	@Override
	public void selectTabItemInController(int position) {
		mTabLayout.getTabAt(position).select();
	}

	@Override
	public void selectTab(TabProxy tabProxy)
	{

	}

	@Override
	public void setBackgroundDrawable(Drawable drawable) {
		mTabLayout.setBackground(drawable);
	}

	@Override
	public void onCreate(Activity activity, Bundle savedInstanceState)
	{
	}

	@Override
	public void onStart(Activity activity)
	{
	}

}
