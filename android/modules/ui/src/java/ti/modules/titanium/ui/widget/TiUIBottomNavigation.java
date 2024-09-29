package ti.modules.titanium.ui.widget;

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

import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.widget.tabgroup.TiUITab;

public class TiUIBottomNavigation extends TiUIView implements BottomNavigationView.OnItemSelectedListener
{
	private static final String TAG = "BottomNavigation";
	static int id_layout = 0;
	static int id_content = 0;
	static int id_bottomNavigation = 0;
	private final ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	private RelativeLayout layout = null;
	private FrameLayout centerView;
	private BottomNavigationView bottomNavigation;
	private Object[] tabsArray;

	public TiUIBottomNavigation(TiViewProxy proxy, TiBaseActivity activity)
	{
		super(proxy);
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

	private void selectTab(int id)
	{
		TabProxy tp = ((TabProxy) tabsArray[id]);
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

	public void setTabs(Object tabs)
	{
		if (tabs instanceof Object[] objArray) {
			tabsArray = objArray;
			for (Object tabView : tabsArray) {
				if (tabView instanceof TabProxy tp) {
					MenuItem menuItem = bottomNavigation.getMenu().add(0, this.mMenuItemsArray.size(), 0, "");
					tp.setNavBar(this, menuItem.getItemId());
					menuItem.setTitle(tp.getProperty(TiC.PROPERTY_TITLE).toString());
					Drawable drawable = TiUIHelper.getResourceDrawable(tp.getProperty(TiC.PROPERTY_ICON));
					menuItem.setIcon(drawable);
					this.mMenuItemsArray.add(menuItem);
				}
			}
		}
	}

	@Override
	public void release()
	{
		if (layout != null) {
			layout.removeAllViews();
			layout = null;
		}
		if (centerView != null) {
			centerView.removeAllViews();
			centerView = null;
		}
		super.release();
		proxy = null;
	}
}
