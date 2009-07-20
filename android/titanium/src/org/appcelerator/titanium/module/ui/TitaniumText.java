package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumText;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Message;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.widget.EditText;

public class TitaniumText extends TitaniumBaseNativeControl
	implements ITitaniumText, TextWatcher
{
	private static final String LCAT = "TiSwitch";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CHANGE = 300;

	public static final String CHANGE_EVENT = "change";

	private CharSequence value;
	private String color;
	private String backgroundColor;

	public TitaniumText(TitaniumModuleManager tmm) {
		super(tmm);

		eventManager.supportEvent(CHANGE_EVENT);
		value = "";
	}

	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		super.setLocalOptions(o);

		if (o.has("value")) {
			this.value = o.getString("value");
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
		EditText tv = new EditText(tmm.getActivity());
		control = tv;

		tv.addTextChangedListener(this);
		tv.setText(value);
		tv.setGravity(Gravity.TOP | Gravity.LEFT);

		if (color != null) {
			tv.setTextColor(TitaniumColorHelper.parseColor(color));
		}
		if (backgroundColor != null) {
			tv.setBackgroundColor(TitaniumColorHelper.parseColor(backgroundColor));
		}

		control.isFocusable();
		control.setId(100);
	}

	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_CHANGE) {
			EditText tv = (EditText) control;
			value = tv.getText();
			JSONObject o = new JSONObject();
			try {
				o.put("value", value);
				eventManager.invokeSuccessListeners("change", o.toString());
			} catch (JSONException e) {
				Log.e(LCAT, "Error setting value: ", e);
			}
		}

		return super.handleMessage(msg);
	}

	public void afterTextChanged(Editable s) {

	}

	public void beforeTextChanged(CharSequence s, int start, int count, int after) {
	}

	public void onTextChanged(CharSequence s, int start, int before, int count) {
		handler.obtainMessage(MSG_CHANGE).sendToTarget();
	}
}
