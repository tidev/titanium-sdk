package ti.modules.titanium.ui.activityindicator;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

import ti.modules.titanium.ui.widget.TiUIActivityIndicator;

public class ActivityIndicatorModule extends TiModule
{
	private static TiDict constants;

	public ActivityIndicatorModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("STATUS_BAR", TiUIActivityIndicator.STATUS_BAR);
			constants.put("DIALOG", TiUIActivityIndicator.DIALOG);

			constants.put("INDETERMINANT", TiUIActivityIndicator.INDETERMINANT);
			constants.put("DETERMINANT", TiUIActivityIndicator.DETERMINANT);
		}

		return constants;
	}
}
