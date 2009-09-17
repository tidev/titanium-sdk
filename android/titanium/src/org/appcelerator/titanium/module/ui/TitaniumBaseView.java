package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.os.Handler;
import android.os.Message;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ScrollView;

public abstract class TitaniumBaseView extends FrameLayout
	implements ITitaniumView, Handler.Callback
{
	private static final String LCAT = "TiBaseView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static final String EVENT_FOCUSED = "focused";
	public static final String EVENT_FOCUSED_JSON = "{type:'" + EVENT_FOCUSED + "'}";
	public static final String EVENT_UNFOCUSED = "unfocused";
	public static final String EVENT_UNFOCUSED_JSON = "{type:'" + EVENT_UNFOCUSED + "'}";

	protected static final int MSG_OPEN = 200;
	protected static final int MSG_CLOSE = 201;

	protected static final String MSG_EXTRA_CALLBACK = "cb";

	protected TitaniumModuleManager tmm;
	protected Handler handler;
	protected TitaniumJSEventManager eventManager;
	protected String key;
	protected String name;
	protected boolean hasBeenOpened;


	public TitaniumBaseView(TitaniumModuleManager tmm)
	{
		super(tmm.getAppContext());
		init(tmm);
	}

	public TitaniumBaseView(TitaniumModuleManager tmm, int defStyle) {
		super(tmm.getAppContext(), null, defStyle);
		init(tmm);
	}

	private void init(TitaniumModuleManager tmm)
	{
		this.tmm = tmm;

		this.handler = new Handler(this);

		this.eventManager = new TitaniumJSEventManager(tmm);
		this.eventManager.supportEvent(EVENT_FOCUSED);
		this.eventManager.supportEvent(EVENT_UNFOCUSED);

		this.hasBeenOpened = false;
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		switch(msg.what)
		{
			case MSG_OPEN : {
				doPreOpen();
				doOpen();
				doPostOpen();
				handled = true;
				break;
			}
			case MSG_CLOSE : {
				doClose();
				handled = true;
				break;
			}
		}

		return handled;
	}

	public View getNativeView() {
		return this;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public int addEventListener(String eventName, String listener) {
		return eventManager.addListener(eventName, listener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventManager.removeListener(eventName, listenerId);
	}

	public void dispatchApplicationEvent(String eventName, String data) {
	}

	public void dispatchWindowFocusChanged(boolean hasFocus) {
		tmm.getWebView().dispatchWindowFocusChanged(hasFocus);
	}

	public void dispatchConfigurationChange(Configuration newConfig) {
		//tmm.getWebView().dispatchConfigurationChange(newConfig);
	}

	// Called on the current view, so forward to our controller
	public boolean dispatchOptionsItemSelected(MenuItem item) {
		return tmm.getWebView().dispatchOptionsItemSelected(item);
	}

	// Called on the current view, so forward to our controller
	public boolean dispatchPrepareOptionsMenu(Menu menu) {
		return tmm.getWebView().dispatchPrepareOptionsMenu(menu);
	}

	public ITitaniumLifecycle getLifecycle() {
		// TODO Auto-generated method stub
		return null;
	}

	public void showing() {
		if (!hasBeenOpened) {
			handler.obtainMessage(MSG_OPEN).sendToTarget();
		} else {
			eventManager.invokeSuccessListeners(EVENT_FOCUSED, EVENT_FOCUSED_JSON);
		}
	}

	public void hiding() {
		eventManager.invokeSuccessListeners(EVENT_UNFOCUSED, EVENT_UNFOCUSED_JSON);
	}


	public boolean isPrimary() {
		return true;
	}

	public void processOptions(String options)
	{
		try {
			JSONObject o = new JSONObject(options);

			if (o.has("name")) {
				setName(o.getString("name"));
			}

			processLocalOptions(o);

		} catch (JSONException e) {
			Log.e(LCAT,"Error processing options: " + options, e);
		}
	}

	protected void doPreOpen() {
		FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
		setLayoutParams(params);
		setPadding(5,5,5,5);
		setFocusable(false);
		setFocusableInTouchMode(false);
		setClickable(false);
	}

	protected void doPostOpen() {
		View contentView = getContentView();
		if (contentView != null) {
			FrameLayout.LayoutParams params = getContentLayoutParams();
			if (params == null) {
				params = new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
			}
			addView(getContentView(), params);
		}
		invalidate();
		eventManager.invokeSuccessListeners(EVENT_FOCUSED, EVENT_FOCUSED_JSON);
		hasBeenOpened = true;
	}

	protected void doClose() {
		destroyDrawingCache();
		removeAllViews();
	}

	protected FrameLayout.LayoutParams getContentLayoutParams() {
		return new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT);
	}

	protected abstract void processLocalOptions(JSONObject o) throws JSONException;
	protected abstract void doOpen();
	protected abstract View getContentView();
}
