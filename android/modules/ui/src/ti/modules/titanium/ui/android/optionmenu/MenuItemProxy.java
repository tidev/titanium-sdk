package ti.modules.titanium.ui.android.optionmenu;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;

public class MenuItemProxy extends TiProxy {

	public MenuItemProxy(TiContext tiContext, Object[] args) {
		super(tiContext);

		if (args != null && args.length > 0) {
			TiDict options = (TiDict) args[0];

			setProperties(options);
		}
	}
}
