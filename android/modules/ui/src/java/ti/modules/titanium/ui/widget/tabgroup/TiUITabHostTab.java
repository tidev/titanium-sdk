package ti.modules.titanium.ui.widget.tabgroup;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.TabProxy;
import android.widget.TabHost.TabSpec;

public class TiUITabHostTab extends TiUIAbstractTab {
	final String id = Integer.toHexString(hashCode());

	public TiUITabHostTab(TabProxy proxy) {
		super(proxy);
	}

	void setupTabSpec(TabSpec spec) {
		KrollDict properties = proxy.getProperties();

		String title = properties.optString(TiC.PROPERTY_TITLE, "");
		Object icon = properties.get(TiC.PROPERTY_ICON);
		spec.setIndicator(title, icon != null ? TiUIHelper.getResourceDrawable(icon) : null);
	}

}
