package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiBaseWindowProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.ViewProxy;
import android.app.ActionBar;
import android.app.ActionBar.Tab;
import android.app.ActionBar.TabListener;
import android.app.Activity;
import android.app.Fragment;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

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
	private ActionBar actionBar;

	private class TiUIActionBarTab extends TiUIView {
		private ActionBar.Tab tab;

		/**
		 * The fragment that will provide the content view of the tab.
		 * This fragment will be attached when the tab is selected and
		 * detached when it is later unselected. This reference will be
		 * initialized when the tab is first selected.
		 */
		private Fragment fragment;

		public TiUIActionBarTab(TabProxy proxy, ActionBar.Tab tab) {
			super(proxy);
			this.tab = tab;

			// We need to register for property changes from the proxy.
			proxy.setModelListener(this);

			// Provide a reference to this instance by placing
			// a reference inside the "tag" slot that ActionBar.Tab provides.
			tab.setTag(this);
		}

		@Override
		public void processProperties(KrollDict d) {
			super.processProperties(d);

			String title = d.getString(TiC.PROPERTY_TITLE);
			if (title != null) {
				tab.setText(title);
			}
		}

		private void initializeFragment() {
			ViewProxy content = new ViewProxy();
			content.setActivity(proxy.getActivity());

			Object window = proxy.getProperty("window");
			if (window instanceof TiBaseWindowProxy) {
				((TiBaseWindowProxy) window).getKrollObject().setWindow(content);
			}

			fragment = new TabFragment(content.getOrCreateView().getNativeView());
		}
	}

	public static class TabFragment extends Fragment {
		private View content;

		public TabFragment(View content) {
			this.content = content;
		}

		@Override
		public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
			return content;
		}
	}

	public TiUIActionBarTabGroup(TabGroupProxy proxy, Activity activity) {
		super(proxy, activity);
		actionBar = activity.getActionBar();

		// Setup the action bar for navigation tabs.
		actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_TABS);
		actionBar.setDisplayShowTitleEnabled(false);

		FrameLayout content = new FrameLayout(activity);
		activity.setContentView(content);
		setNativeView(content);
	}

	@Override
	public void addTab(TabProxy tabProxy) {
		ActionBar.Tab tab = actionBar.newTab();
		tab.setTabListener(this);

		// Create a view for this tab proxy.
		tabProxy.setView(new TiUIActionBarTab(tabProxy, tab));

		actionBar.addTab(tab, tabProxy.isActive());
	}

	@Override
	public void removeTab(TabProxy tabProxy) {
		TiUIActionBarTab tabView = (TiUIActionBarTab) tabProxy.peekView();
		actionBar.removeTab(tabView.tab);
	}

	@Override
	public void selectTab(TabProxy tabProxy) {
		TiUIActionBarTab tabView = (TiUIActionBarTab) tabProxy.peekView();
		if (tabView == null) {
			// The tab has probably not been added to this group yet.
			return;
		}

		actionBar.selectTab(tabView.tab);
	}

	@Override
	public TabProxy getSelectedTab() {
		ActionBar.Tab tab = actionBar.getSelectedTab();
		if (tab == null) {
			// There is no selected tab currently for this action bar.
			// This probably means the tab group contains no tabs.
			return null;
		}

		TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();
		return (TabProxy) tabView.getProxy();
	}

	@Override
	public void close() {
		// TODO(josh): remove this stud once TiUIAbstractTabGrup
		// implements this functionality.
	}

	@Override
	public void onTabSelected(Tab tab, FragmentTransaction ft) {
		TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();

		// Check if this tab's fragment has been initialized already.
		if (tabView.fragment == null) {
			// If not we will create it here then attach it
			// to the tab group activity inside the "content" container.
			tabView.initializeFragment();
			ft.add(android.R.id.content, tabView.fragment);

		} else {
			// If the fragment is already attached just make it visible.
			ft.show(tabView.fragment);
		}

	}

	@Override
	public void onTabUnselected(Tab tab, FragmentTransaction ft) {
		TiUIActionBarTab tabView = (TiUIActionBarTab) tab.getTag();

		// Hide the currently selected fragment since another tab is
		// in the process of being selected.
		ft.hide(tabView.fragment);
	}

	@Override
	public void onTabReselected(Tab tab, FragmentTransaction ft) {
	}

}
