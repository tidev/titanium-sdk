package ti.modules.titanium.ui.iphone.tableviewseparatorstyle;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class TableViewSeparatorStyleModule extends TiModule
{
	private static TiDict constants;

	public TableViewSeparatorStyleModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("NONE", "iphone only");
			constants.put("SINGLE_LINE", "iphone only");
		}

		return constants;
	}
}
