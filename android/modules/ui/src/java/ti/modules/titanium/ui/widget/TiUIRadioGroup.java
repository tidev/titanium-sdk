package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.view.Gravity;
import android.widget.RadioGroup;

public class TiUIRadioGroup extends TiUIView
{
	RadioGroup rdg = null;

	public TiUIRadioGroup(final TiViewProxy proxy)
	{
		super(proxy);
		rdg = new RadioGroup(proxy.getActivity())
		{
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}

		};
		rdg.setGravity(Gravity.CENTER);
		setNativeView(rdg);
	}
}
