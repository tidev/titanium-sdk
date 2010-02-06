package ti.modules.titanium.ui.iphone.animationstyle;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class AnimationStyleModule extends TiModule
{

	private static TiDict constants;

	public AnimationStyleModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("FLIP_FROM_LEFT", "iphone only");
		}

		return constants;
	}

}
