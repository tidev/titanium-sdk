package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIRadioButton;
import android.app.Activity;


@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = { TiC.PROPERTY_FONT, TiC.PROPERTY_COLOR })
public class RadioButtonProxy extends TiViewProxy
{

	@Override
	public TiUIView createView(Activity activity)
	{

		return new TiUIRadioButton(this);
	}

	@Kroll.getProperty @Kroll.method
	public String getText()
	{
		TiUIView radView = peekView();
		return ((TiUIRadioButton) radView).getText();
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
