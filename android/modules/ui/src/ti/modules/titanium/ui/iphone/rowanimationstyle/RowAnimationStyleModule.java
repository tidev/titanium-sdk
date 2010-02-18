package ti.modules.titanium.ui.iphone.rowanimationstyle;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class RowAnimationStyleModule extends TiModule
{

	private static TiDict constants;

	public RowAnimationStyleModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("DOWN", "iphone only");
			constants.put("LEFT", "iphone only");
			constants.put("RIGHT", "iphone only");
			constants.put("UP", "iphone only");
		}

		return constants;
	}
}
