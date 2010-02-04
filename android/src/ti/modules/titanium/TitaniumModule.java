package ti.modules.titanium;

import java.io.IOException;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.Log;

public class TitaniumModule
	extends TiModule
{
	private static final String LCAT = "TitaniumModule";
	private static TiDict constants;

	public TitaniumModule(TiContext tiContext) {
		super(tiContext);

	}

	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("version", "0.9.0");
		}

		return constants;
	}

	public void include(Object[] files) {
		for(Object filename : files) {
			try {
				getTiContext().evalFile((String)filename);
			} catch (IOException e) {
				Log.e(LCAT, "Error while evaluating: " + filename, e);
			}
		}
	}
}
