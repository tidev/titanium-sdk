package ti.modules.titanium.ui.widget;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;
import android.view.Gravity;
import android.widget.RadioButton;

public class TiUIRadioButton extends TiUIView
{
	RadioButton rdo = null;

	public TiUIRadioButton(final TiViewProxy proxy)
	{
		super(proxy);

		rdo = new RadioButton(proxy.getActivity())
		{
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}

		};
		rdo.setGravity(Gravity.CENTER);
		setNativeView(rdo);
	}

	
	@Override
	public void processProperties(KrollDict d)
	{
		// TODO Auto-generated method stub
		super.processProperties(d);
		rdo = (RadioButton) getNativeView();
		if (d.containsKey(TiC.PROPERTY_TEXT)) {
			rdo.setText(d.getString(TiC.PROPERTY_TEXT));
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(rdo, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			rdo.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR));
		}
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		rdo = (RadioButton) getNativeView();
		if (key.equals(TiC.PROPERTY_TEXT)) {
			rdo.setText((String) newValue);
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			rdo.setTextColor(TiConvert.toColor(TiConvert.toString(newValue)));
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(rdo, (HashMap) newValue);
		}
		else {
		super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
	
	public void setTextColor(String color)
	{
		rdo.setTextColor(TiConvert.toColor(color));
	}

	public Boolean isChecked()
	{
		return rdo.isChecked();
	}
	
	public String getText()
	{
		return TiConvert.toString(rdo.getText());
	}
 
}
