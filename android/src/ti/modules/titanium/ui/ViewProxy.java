package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiViewProxy;

public abstract class ViewProxy extends TiViewProxy
{
	public ViewProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}
}
