package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiWindowProxy;

import ti.modules.titanium.ui.TabProxy;
import ti.modules.titanium.ui.ViewProxy;
import ti.modules.titanium.ui.widget.TiView;
import android.app.ActionBar;
import android.app.Fragment;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

public class TiUIActionBarTab extends TiUIAbstractTab {

	public static class TabFragment extends Fragment {
		private TiView contentView;

		public void setContentWindow(TiWindowProxy windowProxy) {
			ViewProxy contentProxy = new ViewProxy();
			contentProxy.setActivity(windowProxy.getActivity());
			contentView = (TiView) contentProxy.getOrCreateView();
			windowProxy.getKrollObject().setWindow(contentProxy);
		}

		@Override
		public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
			if (contentView != null) {
				return contentView.getNativeView();
			}

			return null;
		}
	}

	ActionBar.Tab tab;

	/**
	 * The fragment that will provide the content view of the tab.
	 * This fragment will be attached when the tab is selected and
	 * detached when it is later unselected. This reference will be
	 * initialized when the tab is first selected.
	 */
	TabFragment fragment;

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

	/**
	 * Initialize this tab's fragment. Called by the tab group
	 * when the tab is first selected to create the fragment which
	 * will display the tab's content view.
	 */
	void initializeFragment() {
		fragment = new TabFragment();

		Object windowProxy = proxy.getProperty("window");
		if (windowProxy instanceof TiWindowProxy) {
			fragment.setContentWindow((TiWindowProxy) windowProxy);
		}
	}

}
