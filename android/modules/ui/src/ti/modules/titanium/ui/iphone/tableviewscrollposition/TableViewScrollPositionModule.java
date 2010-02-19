package ti.modules.titanium.ui.iphone.tableviewscrollposition;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class TableViewScrollPositionModule extends TiModule
{
	private static TiDict constants;

	public TableViewScrollPositionModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("TOP", "iphone only");
			constants.put("BOTTOM", "iphone only");
		}

		return constants;
	}
}
