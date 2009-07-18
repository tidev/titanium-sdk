package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumSwitch;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Message;
import org.appcelerator.titanium.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.ToggleButton;

public class TitaniumSwitch extends TitaniumBaseNativeControl
	implements ITitaniumSwitch, OnClickListener
{
	private static final String LCAT = "TiSwitch";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CLICK = 300;

	public static final String CLICK_EVENT = "click";

	private boolean value;

	public TitaniumSwitch(TitaniumModuleManager tmm) {
		super(tmm);

		eventManager.supportEvent(CLICK_EVENT);
		value = true; // default
	}

	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		super.setLocalOptions(o);

		if (o.has("value")) {
			this.value = o.getBoolean("value");
		}
	}

	@Override
	public void open(String json) {
		TitaniumModuleManager ttm = softModuleMgr.get();
		if (ttm != null && control == null) {
			ToggleButton b = new ToggleButton(ttm.getActivity());
			b.setChecked(value);
			control = b;

			control.setOnClickListener(this);
			control.isFocusable();
			control.setId(100);

			if (id != null) {
				TitaniumWebView wv = ttm.getActivity().getWebView();
				if (wv != null) {
					wv.addListener(this);
					wv.addControl(control);
				} else {
					Log.e(LCAT, "No webview, control not added");
				}
			}
		}
	}

	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_CLICK) {
			ToggleButton b = (ToggleButton) control;
			value = b.isChecked();
			eventManager.invokeSuccessListeners("click", "{ value : " + value + "}");
		}

		return super.handleMessage(msg);
	}

	public void onClick(View view) {
		handler.obtainMessage(MSG_CLICK).sendToTarget();
	}

}
