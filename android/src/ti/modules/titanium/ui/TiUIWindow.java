package ti.modules.titanium.ui;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TitaniumCompositeLayout;

import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.View;
import android.view.Window;

public class TiUIWindow extends TiUIView
	implements Handler.Callback
{
	private static final String LCAT = "TiUIWindow";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int MSG_ACTIVITY_CREATED = 1000;
	private static final int MSG_ANIMATE = 100;

	protected String activityKey;
	protected Activity windowActivity;
	protected TitaniumCompositeLayout liteWindow;

	protected boolean lightWeight;
	protected Handler handler;

	protected Messenger messenger;
	protected int messageId;

	private static AtomicInteger idGenerator;

	public TiUIWindow(TiViewProxy proxy, TiDict options, Messenger messenger, int messageId)
	{
		super(proxy);

		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}
		this.messenger = messenger;
		this.messageId = messageId;
		this.handler = new Handler(this);

		TiDict props = proxy.getDynamicProperties();
		boolean newActivity = requiresNewActivity(props);
		if (!newActivity && options != null && options.containsKey("tabOpen")) {
			newActivity = TiConvert.toBoolean(options,"tabOpen");
		}

		if (newActivity)
		{
			lightWeight = false;
			Activity activity = proxy.getTiContext().getActivity();
			Intent intent = createIntent(activity);
			activity.startActivity(intent);
		} else {
			lightWeight = true;
			liteWindow = new TitaniumCompositeLayout(proxy.getContext());
			setNativeView(liteWindow);
			handlePostOpen();
		}
	}

	public TiUIWindow(TiViewProxy proxy, Activity activity)
	{
		super(proxy);

		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		windowActivity = activity;
		lightWeight = false;

		this.handler = new Handler(this);

		handlePostOpen();
	}

	protected void handlePostOpen() {
		//TODO unique key per window, params for intent
		activityKey = "window$" + idGenerator.incrementAndGet();
		TiDict props = proxy.getDynamicProperties();

		// if url, create a new context.
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
						url = TiFileHelper2.joinSegments(baseUrl,fname);
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
						baseUrl = "app://" + baseUrl;
						url = TiFileHelper2.joinSegments(baseUrl,fname);
					} else {
						baseUrl = "app://" + path;
						url = TiFileHelper2.joinSegments(baseUrl,fname);
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
				preload.put("currentTabGroup", ((TiWindowProxy) proxy).getTabGroupProxy());
				preload.put("currentTab", ((TiWindowProxy) proxy).getTabProxy());
			}

			TiContext tiContext = null;
			if (lightWeight) {
				tiContext = TiContext.createTiContext(proxy.getTiContext().getActivity(), preload, baseUrl);
			} else {
				tiContext = TiContext.createTiContext(windowActivity, preload, baseUrl);
			}

			try {
				this.proxy.switchContext(tiContext);
				tiContext.evalFile(url);
			} catch (IOException e) {
				Log.e(LCAT, "Error opening URL: " + url, e);
			}
		}
		if (messenger != null) {
			Message msg = Message.obtain();
			msg.what = messageId;
			try {
				messenger.send(msg);
			} catch (RemoteException e) {
				Log.e(LCAT, "Unable to send message: " + e.getMessage(), e);
			}
		}
		if (lightWeight) {
			ITiWindowHandler windowHandler = proxy.getTiContext().getTiApp().getWindowHandler();
			if (windowHandler != null) {
				windowHandler.addWindow(liteWindow, getLayoutParams());
			}
			handler.obtainMessage(MSG_ANIMATE).sendToTarget();
		}
	}

	public void close() {
		if (!lightWeight) {
			if (windowActivity != null) {
				windowActivity.finish();
				windowActivity = null;
			}
		} else {
			if (liteWindow != null) {
				ITiWindowHandler windowHandler = proxy.getTiContext().getTiApp().getWindowHandler();
				if (windowHandler != null) {
					windowHandler.removeWindow(liteWindow);
				}
				liteWindow.removeAllViews();
				liteWindow = null;
			}
		}
	}
	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_ACTIVITY_CREATED :
				Log.w(LCAT, "Received Activity creation message");
				windowActivity = (Activity) msg.obj;
				handlePostOpen();
				return true;
			case MSG_ANIMATE : {
				animate();
				return true;
			}
		}
		return false;
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
		View layout = nativeView;
		if (!lightWeight) {
			TiActivity tia = (TiActivity) windowActivity;
			layout = tia.getLayout();
		}
		return layout;
	}

	@Override
	public void processProperties(TiDict d)
	{
		// Prefer image to color.
		if (d.containsKey("backgroundImage")) {
			throw new IllegalArgumentException("Please Implement.");
		} else if (d.containsKey("backgroundColor")) {
			ColorDrawable bgColor = TiConvert.toColorDrawable(d, "backgroundColor");
			if (!lightWeight) {
				Window w = windowActivity.getWindow();
				w.setBackgroundDrawable(bgColor);
			} else {
				nativeView.setBackgroundDrawable(bgColor);
			}
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

	protected boolean requiresNewActivity(TiDict options)
	{
		boolean activityRequired = false;

		if (options != null) {
			if (options.containsKey("fullscreen") ||
					options.containsKey("navBarHidden") ||
					options.containsKey("tabOben"))
			{
				activityRequired = true;
			}
		}

		return activityRequired;
	}

	protected Intent createIntent(Activity activity)
	{
		TiDict props = proxy.getDynamicProperties();
		Intent intent = new Intent(activity, TiActivity.class);

		if (props.containsKey("fullscreen")) {
			intent.putExtra("fullscreen", TiConvert.toBoolean(props, "fullscreen"));
		}
		if (props.containsKey("navBarHidden")) {
			intent.putExtra("navBarHidden", TiConvert.toBoolean(props, "navBarHidden"));
		}
		if (props.containsKey("url")) {
			intent.putExtra("url", TiConvert.toString(props, "url"));
		}
		intent.putExtra("finishRoot", activity.isTaskRoot());
		Messenger messenger = new Messenger(handler);
		intent.putExtra("messenger", messenger);
		intent.putExtra("messageId", MSG_ACTIVITY_CREATED);

		return intent;
	}

}
