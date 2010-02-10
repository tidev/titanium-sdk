package ti.modules.titanium.ui.widget;

import java.io.ByteArrayInputStream;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBackgroundImageLoadTask;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;

import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.View.OnClickListener;

public class TiUIImageView extends TiUIView
	implements OnClickListener
{
	private static final String LCAT = "TiUIImageView";
	private static final boolean DBG = TiConfig.LOGD;

	private static final String EVENT_CLICK = "click";

	private class BgImageLoader extends TiBackgroundImageLoadTask
	{

		public BgImageLoader(TiContext tiContext, Integer imageWidth, Integer imageHeight) {
			super(tiContext, imageWidth, imageHeight);
		}

		@Override
		protected void onPostExecute(Drawable d) {
			super.onPostExecute(d);

			if (d != null) {
				TiImageView view = getView();
				if (view != null) {
					view.setImageDrawable(d);
				}
			}
		}
	}

	public TiUIImageView(TiViewProxy proxy) {
		super(proxy);

		if (DBG) {
			Log.d(LCAT, "Creating an ImageView");
		}

		TiImageView view = new TiImageView(proxy.getContext());
		setNativeView(view);
		view.setOnClickListener(this);
	}

	private TiImageView getView() {
		return (TiImageView) nativeView;
	}

	@Override
	public void processProperties(TiDict d)
	{
		TiImageView view = getView();

		if (d.containsKey("url")) {
			new BgImageLoader(getProxy().getTiContext(), null, null).load(TiConvert.toString(d, "url"));
		}
		if (d.containsKey("canScale")) {
			view.setCanScaleImage(TiConvert.toBoolean(d, "canScale"));
		}
		if (d.containsKey("image")) {
			TiBlob blob = TiConvert.toBlob(d, "image");
			view.setImageDrawable(Drawable.createFromStream(
				new ByteArrayInputStream(blob.getBytes()), "blob"));
		} else {
			getProxy().internalSetDynamicValue("image", null, false);
		}

		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		TiImageView view = getView();

		if (key.equals("canScale")) {
			view.setCanScaleImage(TiConvert.toBoolean(newValue));
		} else if (key.equals("url")) {
			new BgImageLoader(getProxy().getTiContext(), null, null).load(TiConvert.toString(newValue));
		} else if (key.equals("image")) {
			if (newValue instanceof TiBlob) {
				TiBlob blob = (TiBlob) newValue;
				view.setImageDrawable(Drawable.createFromStream(
					new ByteArrayInputStream(blob.getBytes()), "blob"));
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void onClick(View view) {
		proxy.fireEvent(EVENT_CLICK, null);
	}
}
