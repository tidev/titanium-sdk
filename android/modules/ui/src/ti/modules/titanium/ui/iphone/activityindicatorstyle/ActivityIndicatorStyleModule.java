package ti.modules.titanium.ui.iphone.activityindicatorstyle;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class ActivityIndicatorStyleModule extends TiModule
{

	private static TiDict constants;

	public ActivityIndicatorStyleModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("BIG", "iphone only");
			constants.put("DARK", "iphone only");
			constants.put("PLAIN", "iphone only");
		}

		return constants;
	}

}
