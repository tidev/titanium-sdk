package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TabProxy;

public abstract class TiUIAbstractTabGroup extends TiUIView {

	public TiUIAbstractTabGroup(TabGroupProxy proxy) {
		super(proxy);
	}

	/**
	 * Add the provided tab to this group.
	 */
	public abstract void addTab(TabProxy tab);

	/**
	 * Changes the selected tab of the group.
	 *
	 * @param tab the tab that will become selected
	 */
	public abstract void selectTab(TabProxy tab);

	/**
	 * Returns the currently selected tab.
	 */
	public abstract TabProxy getSelectedTab();

	// TODO(josh): implement the activity clean up in this abstract class.
	// The activity management for both tab group implementations can share
	// a lot of common code.
	public abstract void close();

}
