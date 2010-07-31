package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.TiConvert;

public class PickerRowProxy extends TiProxy 
{

	public PickerRowProxy(TiContext tiContext)
	{
		super(tiContext);
	}
	
	public PickerRowProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext);
		if (args != null && args.length > 0) {
			setProperties((TiDict) args[0]);
		}
	}

	@Override
	public String toString()
	{
		String text = "[PickerRow]";
		if (hasDynamicValue("title")) {
			text = TiConvert.toString(getDynamicProperties(), "title");
		}
		return text;
	}
	
}
