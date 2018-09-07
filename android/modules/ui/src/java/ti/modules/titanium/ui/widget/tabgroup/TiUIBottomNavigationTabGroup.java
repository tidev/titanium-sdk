package ti.modules.titanium.ui.widget.tabgroup;

import android.app.Activity;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Bundle;
import android.support.design.internal.BottomNavigationMenuView;
import android.support.design.widget.BottomNavigationView;
import android.support.v7.view.menu.MenuBuilder;
import android.util.TypedValue;
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
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;

import java.util.ArrayList;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

public class TiUIBottomNavigationTabGroup extends TiUIAbstractTabGroup implements MenuItem.OnMenuItemClickListener
{
	BottomNavigationView mBottomNavigationView;
	ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	ArrayList<TabProxy> mTabProxiesArray = new ArrayList<>();
	private int mBottomNavigationHeightValue;

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

		mBottomNavigationView = new BottomNavigationView(activity);

		// Set the colorPrimary as backgroundColor by default
		TypedValue typedValue = new TypedValue();
		TypedArray a = activity.obtainStyledAttributes(typedValue.data, new int[] { android.R.attr.colorPrimary });

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
		MenuItem menuItem = this.mBottomNavigationView.getMenu().add(null);
		menuItem.setOnMenuItemClickListener(this);
		Drawable drawable = TiUIHelper.getResourceDrawable(tabProxy.getProperty(TiC.PROPERTY_ICON));
		menuItem.setIcon(drawable);
		menuItem.setTitle(tabProxy.getProperty(TiC.PROPERTY_TITLE).toString());
		this.mMenuItemsArray.add(menuItem);

		try {
			ArrayList<TabProxy> tabs = ((TabGroupProxy) proxy).getTabList();
			BottomNavigationMenuView bottomMenuView = ((BottomNavigationMenuView) this.mBottomNavigationView.getChildAt(0));
			// BottomNavigationMenuView rebuilds itself after adding a new item, so we need to reset the colors each time.
			for (int i = 0; i < this.mMenuItemsArray.size(); i++) {
				RippleDrawable backgroundRippleDrawable = createBackgroundDrawableForState(tabs.get(i), android.R.attr.state_checked);
				bottomMenuView.getChildAt(i).setBackground(backgroundRippleDrawable);
			}
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
		this.mBottomNavigationView.getMenu().getItem(position).setChecked(true);
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
	public void onCreate(Activity activity, Bundle savedInstanceState)
	{
	}

	@Override
	public void onStart(Activity activity)
	{
	}

	@Override
	public boolean onMenuItemClick(MenuItem item) {
		int index = this.mMenuItemsArray.indexOf(item);
		selectTab(index);
		return true;
	}
}
