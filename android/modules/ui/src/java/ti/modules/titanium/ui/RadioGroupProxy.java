package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.widget.TiUIRadioGroup;
import android.app.Activity;


@Kroll.proxy(creatableInModule = UIModule.class)
public class RadioGroupProxy extends TiViewProxy
{

	@Override
	public TiUIView createView(Activity activity)
	{
		// TODO Auto-generated method stub
		return new TiUIRadioGroup(this);
	}

	@Kroll.getProperty @Kroll.method
	public RadioButtonProxy getSelectedRadio()
	{
		TiUIRadioGroup radGrView = (TiUIRadioGroup) peekView();
		RadioButtonProxy rt = null;
		for (TiViewProxy iterable_element : radGrView.getProxy().getChildren()) {
			if (((RadioButtonProxy) iterable_element).isChecked()) {
				rt = (RadioButtonProxy) iterable_element;
			}
		}
		return rt;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.RadioGroup";
	}

}
