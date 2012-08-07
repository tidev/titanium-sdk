package ti.modules.titanium.ui.widget.tabgroup;

import ti.modules.titanium.ui.TabProxy;

public class TiUITabHostTab extends TiUIAbstractTab {
	final String id = Integer.toHexString(hashCode());

	public TiUITabHostTab(TabProxy proxy) {
		super(proxy);
	}

}
