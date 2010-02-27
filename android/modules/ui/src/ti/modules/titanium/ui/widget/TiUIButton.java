package ti.modules.titanium.ui.widget;

import java.io.IOException;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;

public class TiUIButton extends TiUIView
	implements OnClickListener
{
	private static final String LCAT = "TiUIButton";
	private static final boolean DBG = TiConfig.LOGD;

	public TiUIButton(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a button");
		}
		Button btn = new Button(proxy.getContext());
		btn.setOnClickListener(this);
		setNativeView(btn);
	}
	
	@Override
	public void processProperties(TiDict d)
	{
		super.processProperties(d);

		Button btn = (Button)getNativeView();
		if (d.containsKey("image")) {
			Object value = d.get("image");
			if (value instanceof String) {
				try {
					String url = getProxy().getTiContext().resolveUrl(null, (String)value);
					TiBaseFile file = TiFileFactory.createTitaniumFile(getProxy().getTiContext(), new String[] { url }, false);
					Bitmap bitmap = TiUIHelper.createBitmap(file.getInputStream());
					
					btn.setBackgroundDrawable(new BitmapDrawable(bitmap));
				} catch (IOException e) {
					Log.e(LCAT, "Error setting button image", e);
				}
			}
		}
		if (d.containsKey("title")) {
			btn.setText(d.getString("title"));
		}
		if (d.containsKey("color")) {
			btn.setTextColor(TiConvert.toColor(d, "color"));
		}
	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		Button btn = (Button) getNativeView();
		if (key.equals("title")) {
			btn.setText((String) newValue);
		} else if (key.equals("color")) {
			btn.setTextColor(TiConvert.toColor(TiConvert.toString(newValue)));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void onClick(View v) {
		proxy.fireEvent("click", null);
	}
}
