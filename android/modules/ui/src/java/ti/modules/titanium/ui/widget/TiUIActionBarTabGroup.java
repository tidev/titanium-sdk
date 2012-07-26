package ti.modules.titanium.ui.widget;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import android.app.ActionBar.Tab;
import android.app.ActionBar.TabListener;
import android.app.Fragment;
import android.app.FragmentTransaction;

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
public class TiUIActionBarTabGroup extends TiUIAbstractTabGroup implements TabListener {

	private static class TabInfo {
		/*
		 * The fragment that will provide the content view of the tab.
		 * This fragment will be attached when the tab is selected and
		 * detached when it is later unselected.
		 */
		public Fragment fragment;

		/*
		 * Tracks if this tab's fragment has been attached yet.
		 * This should always be initialized to 'false' and only
		 * set to 'true' when the tab has been selected for the first time.
		 */
		public boolean isFragmentAttached = false;
	}

	public TiUIActionBarTabGroup(TabGroupProxy proxy) {
		super(proxy);
	}

	@Override
	public void addTab(TabProxy tab) {
		// TODO(josh): implement
	}

	@Override
	public void selectTab(TabProxy tab) {
		// TODO(josh): implement		
	}

	@Override
	public TabProxy getSelectedTab() {
		// TODO(josh): implement
		return null;
	}

	@Override
	public void close() {
		// TODO(josh): remove this stud once TiUIAbstractTabGrup
		// implements this functionality.
	}

	@Override
	public void onTabSelected(Tab tab, FragmentTransaction ft) {
		TabInfo tabInfo = (TabInfo) tab.getTag();

		if (!tabInfo.isFragmentAttached) {
			// When the tab is first selected we must attach
			// the tab fragment to the tab group's activity.
			// At the same time we will also place the fragment's
			// view into the content container.
			ft.add(android.R.id.content, tabInfo.fragment);
			tabInfo.isFragmentAttached = true;

		} else {
			// If the tab's fragment is already attached to the activity
			// we just need to re-attach it to make it visible once again.
			ft.attach(tabInfo.fragment);
		}
	}

	@Override
	public void onTabUnselected(Tab tab, FragmentTransaction ft) {
		TabInfo tabInfo = (TabInfo) tab.getTag();

		// When the tab is unselected remove the fragment's view and
		// detach the fragment from the activity. We need to clear the
		// tab group's content area for the next tab that gets selected.
		ft.detach(tabInfo.fragment);
	}

	@Override
	public void onTabReselected(Tab tab, FragmentTransaction ft) {
	}

}
