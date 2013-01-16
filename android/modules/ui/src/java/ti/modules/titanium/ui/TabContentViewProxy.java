package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.ActivityProxy;

import ti.modules.titanium.ui.widget.tabgroup.TiUIAbstractTab;

/**
 * A special view for the content of a tab.
 * @see {@link TiUIAbstractTab#getContentView()}
 */
@Kroll.proxy(parentModule=UIModule.class)
public class TabContentViewProxy extends ViewProxy {
	@Kroll.getProperty(name="_internalActivity")
	@Override
	public ActivityProxy getActivityProxy() {
		return super.getActivityProxy();
	}
}
