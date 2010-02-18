package ti.modules.titanium.ui.iphone.tableviewstyle;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class TableViewStyleModule extends TiModule
{
	private static TiDict constants;

	public TableViewStyleModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("GROUPED", "iphone only");
			constants.put("PLAIN", "iphone only");
		}

		return constants;
	}
}
