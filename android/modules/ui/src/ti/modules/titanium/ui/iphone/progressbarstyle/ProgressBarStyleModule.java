package ti.modules.titanium.ui.iphone.progressbarstyle;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class ProgressBarStyleModule extends TiModule
{
	private static TiDict constants;

	public ProgressBarStyleModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("BAR", "iphone only");
			constants.put("PLAIN", "iphone only");
		}

		return constants;
	}
}
