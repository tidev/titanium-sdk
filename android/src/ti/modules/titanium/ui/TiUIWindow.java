package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiRootActivity.TiActivityRef;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;

import android.app.Activity;
import android.view.Window;

public class TiUIWindow extends TiUIView
{

	protected String key;
	protected Activity activity;

	public TiUIWindow(TiViewProxy proxy)
	{
		super(proxy);
		//TODO unique key per window, params for intent
		TiActivityRef ref = proxy.getTiContext().getRootActivity().launchActivity("FIXME");
		this.activity = ref.activity;
//		this.layout.addView(activity.getWindow().getDecorView());
		TiActivity tia = (TiActivity) activity;
		setNativeView(tia.getLayout());
	}

	@Override
	public void processProperties(TiDict d)
	{
		// Prefer image to color.
		if (d.containsKey("backgroundImage")) {
			throw new IllegalArgumentException("Please Implement.");
		} else if (d.containsKey("backgroundColor")) {
			Window w = activity.getWindow();
			w.setBackgroundDrawable(TiConvert.toColorDrawable(d, "backgroundColor"));
		}

		// Don't allow default processing.
		d.remove("backgroundImage");
		d.remove("backgroundColor");

		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (key.equals("backgroundColor")) {
			Window w = activity.getWindow();
			w.setBackgroundDrawable(TiConvert.toColorDrawable((String) newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
}
