package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;

import ti.modules.titanium.ui.TabProxy;
import android.app.ActionBar;
import android.app.Fragment;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

public class TiUIActionBarTab extends TiUIAbstractTab {

	public static class TabFragment extends Fragment {
		private View contentView;

		public void setContentView(View view) {
			contentView = view;
		}

		@Override
		public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
			return contentView;
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
		fragment.setContentView(getContentView());
	}

}
