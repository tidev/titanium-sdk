package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.view.Gravity;
import android.widget.TextView;

public class TiUILabel extends TiUIView
{
	private static final String LCAT = "TiUILabel";
	private static final boolean DBG = TiConfig.LOGD;

	public TiUILabel(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a text label");
		}
		TextView tv = new TextView(getProxy().getContext());
		tv.setGravity(Gravity.TOP | Gravity.LEFT);
		tv.setPadding(0, 0, 0, 0);
		setNativeView(tv);
	}

	@Override
	public void processProperties(TiDict d)
	{
		super.processProperties(d);

		TextView tv = (TextView) getNativeView();
		// Only accept one, prefer text to title.
		if (d.containsKey("text")) {
			tv.setText(TiConvert.toString(d,"text"));
		} else if (d.containsKey("title")) { //TODO this may not need to be supported.
			tv.setText(TiConvert.toString(d,"title"));
		}

		if (d.containsKey("color")) {
			tv.setTextColor(TiConvert.toColor(d, "color"));
		}
//		if (d.containsKey("backgroundColor")) {
//			tv.setBackgroundColor(TiConvert.toColor(d, "backgroundColor"));
//		}
		if (d.containsKey("highlightedColor")) {
			tv.setHighlightColor(TiConvert.toColor(d, "highlightedColor"));
		}
		if (d.containsKey("font")) {
			TiUIHelper.styleText(tv, d.getTiDict("font"));
		}
		if (d.containsKey("textAlign")) {
			String textAlign = d.getString("textAlign");
			setAlignment(tv, textAlign);
		}
	}

	private void setAlignment(TextView tv, String textAlign) {
		if ("left".equals(textAlign)) {
			tv.setGravity(Gravity.TOP | Gravity.LEFT);
		} else if ("center".equals(textAlign)) {
			tv.setGravity(Gravity.TOP | Gravity.CENTER_HORIZONTAL);
		} else if ("right".equals(textAlign)) {
			tv.setGravity(Gravity.TOP | Gravity.RIGHT);
		} else {
			Log.w(LCAT, "Unsupported alignment: " + textAlign);
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		TextView tv = (TextView) getNativeView();
		if (key.equals("text")) {
			tv.setText(TiConvert.toString(newValue));
		} else if (key.equals("color")) {
			tv.setTextColor(TiConvert.toColor((String) newValue));
//		} else if (key.equals("backgroundColor")) {
//			tv.setBackgroundColor(TiConvert.toColor((String) newValue));
		} else if (key.equals("highlightedColor")) {
			tv.setHighlightColor(TiConvert.toColor((String) newValue));
		} else if (key.equals("textAlignment")) {
			setAlignment(tv, (String) newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
}
