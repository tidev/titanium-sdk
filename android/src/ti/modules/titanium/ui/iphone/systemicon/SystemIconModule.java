package ti.modules.titanium.ui.iphone.systemicon;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class SystemIconModule extends TiModule
{
	private static TiDict constants;

	public SystemIconModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("BOOKMARKS", "iphone only");
			constants.put("CONTACTS", "iphone only");
			constants.put("DOWNLOADS", "iphone only");
			constants.put("FAVORITES", "iphone only");
			constants.put("FEATURED", "iphone only");
			constants.put("HISTORY", "iphone only");
			constants.put("MORE", "iphone only");
			constants.put("MOST_RECENT", "iphone only");
			constants.put("MOST_VIEWED", "iphone only");
			constants.put("RECENTS", "iphone only");
			constants.put("SEARCH", "iphone only");
			constants.put("TOP_RATED", "iphone only");
		}

		return constants;
	}

}
