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
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.appcelerator.titanium.util.TiPropertyResolver;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout;

import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
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
	private static final int MSG_POST_OPEN = 1001;
	private static final int MSG_BOOTED = 1002;

	private static final int MSG_ANIMATE = 100;

	private static final String[] NEW_ACTIVITY_REQUIRED_KEYS = { "fullscreen", "navBarHidden", "modal"};

	protected String activityKey;
	protected Activity windowActivity;
	protected TiCompositeLayout liteWindow;

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
		TiPropertyResolver resolver = new TiPropertyResolver(options, props);
		boolean newActivity = requiresNewActivity(resolver);
		if (!newActivity && options != null && options.containsKey("tabOpen")) {
			newActivity = TiConvert.toBoolean(options,"tabOpen");
		}

		resolver.release();
		resolver = null;

		if (newActivity)
		{
			lightWeight = false;
			Activity activity = proxy.getTiContext().getActivity();
			Intent intent = createIntent(activity, options);
			activity.startActivity(intent);
		} else {
			lightWeight = true;
			liteWindow = new TiCompositeLayout(proxy.getContext());
			layoutParams.autoFillsHeight = true;
			layoutParams.autoFillsWidth = true;

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
					} else {
						fname = path;
						path = null;
					}

					if (url.startsWith("/")) {
						baseUrl = "app:/" + path;
						url = TiFileHelper2.joinSegments(baseUrl,fname);
					} else if (path == null && fname != null) {
						url = TiFileHelper2.joinSegments(baseUrl, fname);
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

			final TiContext ftiContext = tiContext;
			final String furl = url;

			new Thread(new Runnable(){

				@Override
				public void run() {
					try {
						proxy.switchContext(ftiContext);
						Messenger m = new Messenger(handler);
						ftiContext.evalFile(furl, m, MSG_BOOTED);
					} catch (IOException e) {
						Log.e(LCAT, "Error opening URL: " + furl, e);
					}
				}}).start();
		} else {
			handleBooted();
		}
	}

	protected void handleBooted() {
		if (messenger != null) {
			Message msg = Message.obtain();
			msg.what = messageId;
			try {
				messenger.send(msg);
			} catch (RemoteException e) {
				Log.e(LCAT, "Unable to send message: " + e.getMessage(), e);
			} finally {
				messenger = null;
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
				handler.sendEmptyMessage(MSG_POST_OPEN);
				return true;
			case MSG_ANIMATE : {
				animate();
				return true;
			}
			case MSG_POST_OPEN : {
				handlePostOpen();
				return true;
			}
			case MSG_BOOTED :
			{
				if (DBG) {
					Log.i(LCAT, "Received booted notification");
				}
				handleBooted();
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
			String path = proxy.getTiContext().resolveUrl(null, TiConvert.toString(d, "backgroundImage"));
			TiFileHelper tfh = new TiFileHelper(proxy.getContext().getApplicationContext());
			Drawable bd = tfh.loadDrawable(path, false);
			if (bd != null) {
				if (!lightWeight) {
					windowActivity.getWindow().setBackgroundDrawable(bd);
				} else {
					nativeView.setBackgroundDrawable(bd);
				}
			}
		} else if (d.containsKey("backgroundColor")) {
			ColorDrawable bgColor = TiConvert.toColorDrawable(d, "backgroundColor", "opacity");
			if (!lightWeight) {
				windowActivity.getWindow().setBackgroundDrawable(bgColor);
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
		if (key.equals("backgroundImage")) {
			String path = proxy.getTiContext().resolveUrl(null, TiConvert.toString(newValue));
			TiFileHelper tfh = new TiFileHelper(proxy.getTiContext().getTiApp());
			Drawable bd = tfh.loadDrawable(path, false);
			if (bd != null) {
				if (!lightWeight) {
					windowActivity.getWindow().setBackgroundDrawable(bd);
				} else {
					nativeView.setBackgroundDrawable(bd);
				}
			}
		} else if (key.equals("opacity") || key.equals("backgroundColor")) {
			TiDict d = proxy.getDynamicProperties();
			if (proxy.getDynamicValue("backgroundColor") != null) {
				Integer bgColor = TiConvert.toColor(d, "backgroundColor", "opacity");
				Drawable cd = new ColorDrawable(bgColor);
				if (lightWeight) {
					nativeView.setBackgroundDrawable(cd);
				} else {
					Window w = windowActivity.getWindow();
					w.setBackgroundDrawable(cd);
				}
			} else {
				Log.w(LCAT, "Unable to set opacity w/o a backgroundColor");
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	protected boolean requiresNewActivity(TiPropertyResolver resolver)
	{
		return resolver.hasAnyOf(NEW_ACTIVITY_REQUIRED_KEYS);
	}

	protected Intent createIntent(Activity activity, TiDict options)
	{
		TiPropertyResolver resolver = new TiPropertyResolver(options, proxy.getDynamicProperties());

		Intent intent = new Intent(activity, TiActivity.class);

		TiDict props = resolver.findProperty("fullscreen");
		if (props != null && props.containsKey("fullscreen")) {
			intent.putExtra("fullscreen", TiConvert.toBoolean(props, "fullscreen"));
		}
		props = resolver.findProperty("navBarHidden");
		if (props != null && props.containsKey("navBarHidden")) {
			intent.putExtra("navBarHidden", TiConvert.toBoolean(props, "navBarHidden"));
		}
		props = resolver.findProperty("modal");
		if (props != null && props.containsKey("modal")) {
			intent.putExtra("modal", TiConvert.toBoolean(props, "modal"));
		}
		props = resolver.findProperty("url");
		if (props != null && props.containsKey("url")) {
			intent.putExtra("url", TiConvert.toString(props, "url"));
		}
		resolver.release();
		resolver = null;

		intent.putExtra("finishRoot", activity.isTaskRoot());
		Messenger messenger = new Messenger(handler);
		intent.putExtra("messenger", messenger);
		intent.putExtra("messageId", MSG_ACTIVITY_CREATED);

		return intent;
	}
}
