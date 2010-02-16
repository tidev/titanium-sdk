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

			constants.put("ACTION", "iphone only");
			constants.put("ADD", "iphone only");
			constants.put("BOOKMARKS", "iphone only");
			constants.put("CAMERA", "iphone only");
			constants.put("CANCEL", "iphone only");
			constants.put("COMPOSE", "iphone only");
			constants.put("CONTACT_ADD", "iphone only");
			constants.put("DISCLOSURE", "iphone only");
			constants.put("DONE", "iphone only");
			constants.put("EDIT", "iphone only");
			constants.put("FAST_FORWARD", "iphone only");
			constants.put("FIXED_SPACE", "iphone only");
			constants.put("FLEXIBLE_SPACE", "iphone only");
			constants.put("INFO_DARK", "iphone only");
			constants.put("INFO_LIGHT", "iphone only");
			constants.put("ORGANIZE", "iphone only");
			constants.put("PAUSE", "iphone only");
			constants.put("PLAY", "iphone only");
			constants.put("REFRESH", "iphone only");
			constants.put("REPLY", "iphone only");
			constants.put("REWIND", "iphone only");
			constants.put("SAVE", "iphone only");
			constants.put("SEARCH", "iphone only");
			constants.put("SPINNER", "iphone only");
			constants.put("STOP", "iphone only");
			constants.put("TRASH", "iphone only");
		}

		return constants;
	}

}
