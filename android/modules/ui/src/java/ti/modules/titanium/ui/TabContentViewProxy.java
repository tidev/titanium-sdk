package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.ActivityProxy;

import ti.modules.titanium.ui.widget.tabgroup.TiUITab;

/**
 * A special view for the content of a tab.
 * @see {@link TiUITab#getContentView()}
 */
@Kroll.proxy(parentModule = UIModule.class)
public class TabContentViewProxy extends ViewProxy
{
	@Kroll.getProperty(name = "_internalActivity")
	@Override
	public ActivityProxy getActivityProxy()
	{
		return super.getActivityProxy();
	}
}
