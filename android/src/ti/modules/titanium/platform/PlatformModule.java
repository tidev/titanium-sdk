package ti.modules.titanium.platform;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;

public class PlatformModule extends TiModule {

	public PlatformModule(TiContext context) {
		super(context);
	}
	
	public String getName() {
		return "android";
	}
}
