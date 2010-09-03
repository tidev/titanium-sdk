/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiFileHelper2;
import org.appcelerator.titanium.util.TiPropertyResolver;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

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
import android.view.View.OnFocusChangeListener;
import android.view.ViewGroup.LayoutParams;

public class TiUIWindow extends TiUIView
	implements Handler.Callback
{
	private static final String LCAT = "TiUIWindow";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int WINDOW_ZINDEX = Integer.MAX_VALUE - 2; // Arbitrary number;
	private static final int MSG_ACTIVITY_CREATED = 1000;
	private static final int MSG_POST_OPEN = 1001;
	private static final int MSG_BOOTED = 1002;

	private static final int MSG_ANIMATE = 100;

	private static final String[] NEW_ACTIVITY_REQUIRED_KEYS = { "fullscreen", "navBarHidden", "modal"};

	protected String activityKey;
	protected Activity windowActivity;
	protected TiCompositeLayout liteWindow;

	protected boolean lightWeight;
	protected boolean animate;
	protected Handler handler;

	protected Messenger messenger;
	protected int messageId;

	protected int lastWidth;
	protected int lastHeight;
	private WeakReference<TiContext> createdContext;

	private static AtomicInteger idGenerator;

	public TiUIWindow(TiViewProxy proxy, KrollDict options, Messenger messenger, int messageId)
	{
		super(proxy);

		animate = true;
		
		//proxy.setModelListener(this);
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}
		this.messenger = messenger;
		this.messageId = messageId;
		this.handler = new Handler(this);

		this.lastWidth = LayoutParams.FILL_PARENT;
		this.lastHeight = LayoutParams.FILL_PARENT;

		KrollDict props = proxy.getProperties();
		TiPropertyResolver resolver = new TiPropertyResolver(options, props);
		boolean newActivity = requiresNewActivity(resolver);
		if (!newActivity && options != null && options.containsKey("tabOpen")) {
			newActivity = TiConvert.toBoolean(options,"tabOpen");
		}

		boolean vertical = isVerticalLayout(resolver);

		if (newActivity)
		{
			lightWeight = false;
			Activity activity = proxy.getTiContext().getActivity();
			Intent intent = createIntent(activity, options);
			KrollDict d = resolver.findProperty("animated");
			if (d != null) {
				if (d.containsKey("animated")) {
					animate = TiConvert.toBoolean(d, "animated");
				}
			}
			if (!animate) {
				intent.addFlags(65536); // Intent.FLAG_ACTIVITY_NO_ANIMATION not available in API 4
				intent.putExtra("animate", false);
				activity.startActivity(intent);
				TiUIHelper.overridePendingTransition(activity);
			} else {
				activity.startActivity(intent);
			}
		} else {
			lightWeight = true;
			liteWindow = new TiCompositeLayout(proxy.getContext(), vertical);
			layoutParams.autoFillsHeight = true;
			layoutParams.autoFillsWidth = true;

			setNativeView(liteWindow);
			proxy.setModelListener(this);
			handlePostOpen();
		}
		
		resolver.release();
		resolver = null;
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
		KrollDict props = proxy.getProperties();

		getLayout().setClickable(true);
		registerForTouch(getLayout());
		getLayout().setOnFocusChangeListener(new OnFocusChangeListener() {
			public void onFocusChange(View view, boolean hasFocus) {
				proxy.fireEvent(hasFocus ? "focus" : "blur", new KrollDict());
			}
		});

		// if url, create a new context.
		if (props.containsKey("url")) {

			String url = props.getString("url");
			String baseUrl = proxy.getTiContext().getBaseUrl();

			if (DBG) {
				Log.e(LCAT, "BASEURL: " + baseUrl);
				if (url != null) {
					Log.e(LCAT, "RELURL: " + url);
				}
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
							if (baseUrl.equals("app://"))
							{
								left = new String[] {};
							}
							else
							{
								int idx = baseUrl.indexOf("://");
								left = baseUrl.substring(idx+3).split("/");
							}
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

			KrollDict preload = new KrollDict();
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
						createdContext = new WeakReference<TiContext>(proxy.switchContext(ftiContext));
						if (!lightWeight && windowActivity instanceof TiActivity) {
							TiActivity tiActivity = (TiActivity)windowActivity;
							tiActivity.setCreatedContext(createdContext.get());
							tiActivity.setWindowProxy((TiWindowProxy)proxy);
						}
						Messenger m = new Messenger(handler);
						ftiContext.evalFile(furl, m, MSG_BOOTED);
					} catch (IOException e) {
						Log.e(LCAT, "Error opening URL: " + furl, e);
					}
				}}).start();
		} else if (!lightWeight) {
			TiContext tiContext = TiContext.createTiContext(windowActivity, new KrollDict(), proxy.getTiContext().getBaseUrl());
			createdContext = new WeakReference<TiContext>(proxy.switchContext(tiContext));
			if (windowActivity instanceof TiActivity) {
				TiActivity tiActivity = (TiActivity)windowActivity;
				tiActivity.setCreatedContext(createdContext.get());
				tiActivity.setWindowProxy((TiWindowProxy)proxy);
			}
			handleBooted();
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
				TiCompositeLayout.LayoutParams params = getLayoutParams();
				params.optionZIndex = WINDOW_ZINDEX;
				windowHandler.addWindow(liteWindow, params);
			}
			handler.obtainMessage(MSG_ANIMATE).sendToTarget();
		} else if (windowActivity != null && windowActivity instanceof TiActivity) {
			((TiActivity) windowActivity).fireInitialFocus(); 
		}
	}
	public void close(KrollDict options) 
	{
		KrollDict data = new KrollDict();
		data.put("source", proxy);
		proxy.fireEvent("close", data);

		KrollDict props = proxy.getProperties();
		TiPropertyResolver resolver = new TiPropertyResolver(options, props);
		props = resolver.findProperty("animated");
		boolean animateOnClose = animate;
		if (props != null && props.containsKey("animated")) {
			animateOnClose = props.getBoolean("animated");
		}

		if (createdContext != null && createdContext.get() != null) {
			createdContext.get().dispatchEvent("close", data, proxy);
			createdContext.clear();
		}
		if (!lightWeight) {
			if (windowActivity != null) {
				if (!animateOnClose) {
					windowActivity.finish();
					TiUIHelper.overridePendingTransition(windowActivity);
				} else {
					windowActivity.finish();					
				}
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
				if (DBG) {
					Log.w(LCAT, "Received Activity creation message");
				}
				windowActivity = (Activity) msg.obj;
				proxy.setModelListener(this);

				handler.sendEmptyMessage(MSG_POST_OPEN);
				return true;
			case MSG_ANIMATE : {
				animate();
				return true;
			}
			case MSG_POST_OPEN : {
				try
				{
					handlePostOpen();
				}
				catch(Exception ex)
				{
					Log.e(LCAT,"Exception in handlePostOpen: "+ex,ex);
				}
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

	private void handleBackgroundColor(KrollDict d)
	{
		if (proxy.getProperty("backgroundColor") != null) {
			Integer bgColor = TiConvert.toColor(d, "backgroundColor");
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
	}

	@Override
	public void processProperties(KrollDict d)
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
			ColorDrawable bgColor = TiConvert.toColorDrawable(d, "backgroundColor");
			if (!lightWeight) {
				windowActivity.getWindow().setBackgroundDrawable(bgColor);
			} else {
				nativeView.setBackgroundDrawable(bgColor);
			}
		} else if (d.containsKey("title")) {
			String title = TiConvert.toString(d,"title");
			proxy.getTiContext().getActivity().setTitle(title);
		}

		// Don't allow default processing.
		d.remove("backgroundImage");
		d.remove("backgroundColor");

		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals("backgroundImage")) {
			if (newValue != null) {
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
			} else {
				handleBackgroundColor(proxy.getProperties());
			}
		} else if (key.equals("backgroundColor")) {
			KrollDict d = proxy.getProperties();
			handleBackgroundColor(d);
		} else if (key.equals("width") || key.equals("height")) {
			Window w = proxy.getTiContext().getActivity().getWindow();
			int width = lastWidth;
			int height = lastHeight;

			if (key.equals("width")) {
				if (newValue != null) {
					width = TiConvert.toInt(newValue);
				} else {
					width = LayoutParams.FILL_PARENT;
				}
			}
			if (key.equals("height")) {
				if (newValue != null) {
					height = TiConvert.toInt(newValue);
				} else {
					height = LayoutParams.FILL_PARENT;
				}
			}
			w.setLayout(width, height);

			lastWidth = width;
			lastHeight = height;
		} else if (key.equals("title")) {
			String title = TiConvert.toString(newValue);
			proxy.getTiContext().getActivity().setTitle(title);
		} else if (key.equals("layout")) {
			if (!lightWeight) {
				boolean vertical = TiConvert.toString(newValue).equals("vertical");
				TiCompositeLayout layout = null;
				if (windowActivity instanceof TiActivity) {
					layout = ((TiActivity)windowActivity).getLayout();
				} else if (windowActivity instanceof TiTabActivity) {
					layout = ((TiTabActivity)windowActivity).getLayout();
				}
				if (layout != null) {
					layout.setVerticalLayout(vertical);
				}
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	protected boolean requiresNewActivity(TiPropertyResolver resolver)
	{
		return resolver.hasAnyOf(NEW_ACTIVITY_REQUIRED_KEYS);
	}

	protected boolean isVerticalLayout(TiPropertyResolver resolver)
	{
		boolean vertical = false;
		KrollDict d = resolver.findProperty("layout");
		if (d != null) {
			vertical = TiConvert.toString(d, "layout").equals("vertical");
		}
		return vertical;
	}

	protected Intent createIntent(Activity activity, KrollDict options)
	{
		TiPropertyResolver resolver = new TiPropertyResolver(options, proxy.getProperties());

		Intent intent = new Intent(activity, TiActivity.class);

		KrollDict props = resolver.findProperty("fullscreen");
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
		props = resolver.findProperty("layout");
		if (props != null && props.containsKey("layout")) {
			intent.putExtra("vertical", TiConvert.toString(props, "layout").equals("vertical"));
		}

		boolean finishRoot = false;
		props = resolver.findProperty("exitOnClose");
		if (props != null && props.containsKey("exitOnClose")) {
			finishRoot = TiConvert.toBoolean(props, "exitOnClose");
		}
		resolver.release();
		resolver = null;

		intent.putExtra("finishRoot", finishRoot);
		Messenger messenger = new Messenger(handler);
		intent.putExtra("messenger", messenger);
		intent.putExtra("messageId", MSG_ACTIVITY_CREATED);

		return intent;
	}
}
