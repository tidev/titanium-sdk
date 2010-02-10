package ti.modules.titanium.ui;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiRootActivity.TiActivityRef;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;

import android.app.Activity;
import android.view.View;
import android.view.Window;

public class TiUIWindow extends TiUIView
{
	private static final String LCAT = "TiUIWindow";
	private static final boolean DBG = TiConfig.LOGD;

	protected String activityKey;
	protected Activity activity;

	private static AtomicInteger idGenerator;

	public TiUIWindow(TiViewProxy proxy)
	{
		super(proxy);
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		//TODO unique key per window, params for intent
		activityKey = "window$" + idGenerator.incrementAndGet();

		TiActivityRef ref = proxy.getTiContext().getRootActivity().launchActivity(activityKey);
		this.activity = ref.activity;
		TiActivity tia = (TiActivity) activity;
		setNativeView(ref.activity.getWindow().getDecorView());

		// if url, create a new context.
		TiDict props = proxy.getDynamicProperties();
		if (props.containsKey("url")) {

			String url = props.getString("url");
			String baseUrl = null;

			try {
				URI uri = new URI(url);
				String scheme = uri.getScheme();
				if (scheme == null) {
					String path = uri.getPath();
					int lastIndex = path.lastIndexOf("/");
					if (lastIndex > 0) {
						path = path.substring(0, lastIndex);
					}

					if (url.startsWith("/")) {
						baseUrl = "app:/" + path;
					} else {
						baseUrl = "app://" + path;
					}
				} else if (scheme == "app") {
					baseUrl = url;
				} else {
					throw new IllegalArgumentException("Scheme not implemented for " + url);
				}
			} catch (URISyntaxException e) {
				Log.w(LCAT, "Error parsing url: " + e.getMessage(), e);
			}

			if (DBG) {
				Log.i(LCAT, "Window has URL: " + url);
			}

			TiDict preload = new TiDict();
			preload.put("currentWindow", proxy);

			TiContext tiContext = TiContext.createTiContext(activity, preload, baseUrl);
			try {
				this.proxy.switchContext(tiContext);
				tiContext.evalFile(url);
			} catch (IOException e) {
				Log.e(LCAT, "Error opening URL: " + url, e);
				activity.finish();
			}
		}
	}

	public View getLayout() {
		TiActivity tia = (TiActivity) activity;
		return tia.getLayout();
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
//			Window w = activity.getWindow();
//			w.setBackgroundDrawable(TiConvert.toColorDrawable((String) newValue));
			View v = getNativeView();
			v.setBackgroundDrawable(TiConvert.toColorDrawable((String) newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
}
