package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.widget.TiUIRadioButton;
import android.app.Activity;


@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = { TiC.PROPERTY_FONT, TiC.PROPERTY_VERTICAL_ALIGN, })
public class RadioButtonProxy extends TiViewProxy
{

	private String text;

	@Override
	public TiUIView createView(Activity activity)
	{

		return new TiUIRadioButton(this);
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);
		if (dict.containsKey(TiC.PROPERTY_TEXT)) {
			text = TiConvert.toString(dict, TiC.PROPERTY_TEXT);
		}

	}

	@Kroll.getProperty @Kroll.method
	public String getText()
	{
		return text;
	}

	@Kroll.getProperty @Kroll.method
	public Boolean isChecked()
	{
		TiUIView radView = peekView();
		return ((TiUIRadioButton) radView).isChecked();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.RadioButton";
	}
}
