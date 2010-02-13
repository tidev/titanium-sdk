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
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.view.View;
import android.view.Window;

public class TiUIWindow extends TiUIView
{
	private static final String LCAT = "TiUIWindow";
	private static final boolean DBG = TiConfig.LOGD;

	protected String activityKey;
	protected Activity activity;
	protected boolean lightWeight;

	private static AtomicInteger idGenerator;

	public TiUIWindow(TiViewProxy proxy, TiActivity activity)
	{
		super(proxy);

		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		if (activity != null) {
			this.activity = activity;
			lightWeight = false;
		} else {
			this.activity = proxy.getTiContext().getActivity();
			lightWeight = true;
		}

		//TODO unique key per window, params for intent
		activityKey = "window$" + idGenerator.incrementAndGet();

		// if url, create a new context.
		TiDict props = proxy.getDynamicProperties();
		if (props.containsKey("url")) {

			String url = props.getString("url");
			String baseUrl = proxy.getTiContext().getBaseUrl();

			Log.e(LCAT, "BASEURL: " + baseUrl);
			if (url != null) {
				Log.e(LCAT, "RELURL: " + url);
			}

			try {
				URI uri = new URI(url);
				String scheme = uri.getScheme();
				if (scheme == null) {
					String path = uri.getPath();
					String fname = null;
					int lastIndex = path.lastIndexOf("/");
					if (lastIndex > 0) {
						fname = path.substring(lastIndex+1);
						path = path.substring(0, lastIndex);
					}

					if (url.startsWith("/")) {
						baseUrl = "app:/" + path;
					} else if (path.startsWith("../")) {
						String[] right = path.split("/");
						String[] left = null;
						if (baseUrl.contains("://")) {
							String[] tmp = baseUrl.split("://");
							left = tmp[1].split("/");
						} else {
							left = baseUrl.split("/");
						}

						int rIndex = 0;
						int lIndex = left.length;

						while(right[rIndex].equals("..")) {
							lIndex--;
							rIndex++;
						}
						String sep = "";
						StringBuilder sb = new StringBuilder();
						for (int i = 0; i < lIndex; i++) {
							sb.append(sep).append(left[i]);
							sep = "/";
						}
						for (int i = rIndex; i < right.length; i++) {
							sb.append(sep).append(right[i]);
							sep = "/";
						}
						baseUrl = sb.toString();
						if (!baseUrl.endsWith("/")) {
							baseUrl = baseUrl + "/";
						}
						url = baseUrl + fname;
						baseUrl = "app://" + baseUrl;
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

			if (proxy instanceof TiWindowProxy && ((TiWindowProxy) proxy).getTabProxy() != null) {
				preload.put("currentTab", ((TiWindowProxy) proxy).getTabProxy());
			}

			TiContext tiContext = TiContext.createTiContext(this.activity, preload, baseUrl);
			try {
				this.proxy.switchContext(tiContext);
				tiContext.evalFile(url);
			} catch (IOException e) {
				Log.e(LCAT, "Error opening URL: " + url, e);
				activity.finish();
			}
		}
	}

	@Override
	public View getNativeView() {

		View v = super.getNativeView();

		if (!lightWeight) {
			v = getLayout();
		}

		return v;
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
