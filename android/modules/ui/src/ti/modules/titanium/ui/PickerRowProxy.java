package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;

public class PickerRowProxy extends TiProxy 
{
	private static final String LCAT = "PickerRowProxy";

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
	
	/*
	 * For mimicking a ViewProxy, which is what this should be.
	 * When we allow complex content (views) inside row, we'll
	 * change to extend TiViewProxy and these won't be necessary.
	 */
	public void add(Object child) 
	{
		Log.w(LCAT, "PickerRow does not support child controls");
	}
	public void remove(Object child) 
	{
		Log.w(LCAT, "PickerRow does not support child controls");
	}
		
}
