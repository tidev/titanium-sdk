package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiAnimation;

import android.graphics.drawable.ColorDrawable;
import android.view.Window;

public class UIModule extends TiModule
{
	private static TiDict constants;

	public UIModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public TiDict getConstants()
	{
		if (constants == null)
		{
			constants = new TiDict();

			constants.put("RETURNKEY_GO", 0);
			constants.put("RETURNKEY_GOOGLE", 1);
			constants.put("RETURNKEY_JOIN", 2);
			constants.put("RETURNKEY_NEXT", 3);
			constants.put("RETURNKEY_ROUTE", 4);
			constants.put("RETURNKEY_SEARCH", 5);
			constants.put("RETURNKEY_YAHOO", 6);
			constants.put("RETURNKEY_DONE", 7);
			constants.put("RETURNKEY_EMERGENCY_CALL", 8);
			constants.put("RETURNKEY_DEFAULT", 9);
			constants.put("RETURNKEY_SEND", 10);

			constants.put("KEYBOARD_APPEARANCE_DEFAULT", -1); // Not supported
			constants.put("KEYBOARD_APPEARANCE_ALERT", -1); // Not supported

			constants.put("KEYBOARD_ASCII", 0);
			constants.put("KEYBOARD_NUMBERS_PUNCTUATION", 1);
			constants.put("KEYBOARD_URL", 2);
			constants.put("KEYBOARD_NUMBER_PAD", 3);
			constants.put("KEYBOARD_PHONE_PAD", 4);
			constants.put("KEYBOARD_EMAIL", 5);
			constants.put("KEYBOARD_NAMEPHONE_PAD", 6);
			constants.put("KEYBOARD_DEFAULT", 7);

			constants.put("INPUT_BORDERSTYLE_NONE", 0);
			constants.put("INPUT_BORDERSTYLE_ROUNDED", 1);
			constants.put("INPUT_BORDERSTYLE_BEZEL", 2);
			constants.put("INPUT_BORDERSTYLE_LINE", 3);
			constants.put("INPUT_BUTTONMODE_ONFOCUS", 0);
			constants.put("INPUT_BUTTONMODE_ALWAYS", 1);
			constants.put("INPUT_BUTTONMODE_NEVER", 2);

			constants.put("MAP_VIEW_STANDARD", 1);
			constants.put("MAP_VIEW_SATELLITE", 2);
			constants.put("MAP_VIEW_HYBRID", 3);

			constants.put("TABLEVIEW_POSITION_ANY", 0);
			constants.put("TABLEVIEW_POSITION_TOP", 1);
			constants.put("TABLEVIEW_POSITION_MIDDLE", 2);
			constants.put("TABLEVIEW_POSITION_BOTTOM", 3);

			constants.put("TEXT_ALIGNMENT_LEFT", "left");
			constants.put("TEXT_ALIGNMENT_CENTER", "center");
			constants.put("TEXT_ALIGNMENT_RIGHT", "right");
		}

		return constants;
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if ("backgroundColor".equals(key)) {
			Window w = getTiContext().getRootActivity().getWindow();
			if (w != null) {
				w.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor((String)newValue)));
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
}
