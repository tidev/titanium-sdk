package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumSwitch;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Message;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.ToggleButton;

public class TitaniumSwitch extends TitaniumBaseNativeControl
	implements ITitaniumSwitch, OnClickListener
{
	@SuppressWarnings("unused")
	private static final String LCAT = "TiSwitch";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CLICK = 300;

	public static final String CLICK_EVENT = "click";

	private boolean value;
	private String color;
	private String backgroundColor;

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
		if (o.has("color")) {
			this.color = o.getString("color");
		}
		if (o.has("backgroundColor")) {
			this.backgroundColor = o.getString("backgroundColor");
		}
	}

	@Override
	public void createControl(TitaniumModuleManager tmm, JSONObject openArgs) {
		ToggleButton b = new ToggleButton(tmm.getActivity());
		b.setChecked(value);

		if (color != null) {
			b.setTextColor(TitaniumColorHelper.parseColor(color));
		}

		if (backgroundColor != null) {
			b.setBackgroundColor(TitaniumColorHelper.parseColor(backgroundColor));
		}

		control = b;

		control.setOnClickListener(this);
		control.isFocusable();
		control.setId(100);
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
