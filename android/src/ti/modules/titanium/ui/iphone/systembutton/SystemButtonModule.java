package ti.modules.titanium.ui.iphone.systembutton;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class SystemButtonModule extends TiModule
{
	private static TiDict constants;

	public SystemButtonModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("FLEXIBLE_SPACE", "iphone only");
			constants.put("FIXED_SPACE", "iphone only");
		}

		return constants;
	}

}
