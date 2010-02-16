package ti.modules.titanium.platform;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;

public class PlatformModule extends TiModule
{

	protected DisplayCapsProxy displayCaps;

	public PlatformModule(TiContext context) {
		super(context);
	}

	public String getName() {
		return "android";
	}

	public DisplayCapsProxy getDisplayCaps() {
		if (displayCaps == null) {
			displayCaps = new DisplayCapsProxy(getTiContext());
		}
		return displayCaps;
	}
}
