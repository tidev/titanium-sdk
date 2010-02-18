package ti.modules.titanium.ui.iphone.statusbar;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class StatusBarModule extends TiModule
{

	private static TiDict constants;

	public StatusBarModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("DEFAULT", "iphone only");
			constants.put("GRAY", "iphone only");
			constants.put("OPAQUE_BLACK", "iphone only");
			constants.put("TRANSLUCENT_BLACK", "iphone only");
		}

		return constants;
	}
}
