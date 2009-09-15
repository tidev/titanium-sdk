package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumText;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.Typeface;
import android.os.Message;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.KeyEvent;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.TextView.OnEditorActionListener;

public class TitaniumText extends TitaniumBaseNativeControl
	implements ITitaniumText, TextWatcher, OnEditorActionListener
{
	private static final String LCAT = "TiSwitch";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CHANGE = 300;
	private static final int MSG_RETURN = 301;
	private static final int MSG_SETVALUE = 302;

	public static final String CHANGE_EVENT = "change";
	public static final String RETURN_EVENT = "return";

	private CharSequence value;
	private String color;
	private String backgroundColor;
	private boolean enableReturnKey;
	private String fontSize;
	private String fontWeight;

	public TitaniumText(TitaniumModuleManager tmm) {
		super(tmm);

		eventManager.supportEvent(CHANGE_EVENT);
		eventManager.supportEvent(RETURN_EVENT);
		value = "";
		enableReturnKey = false;
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
		if (o.has("enableReturnKey")) {
			this.enableReturnKey = o.getBoolean("enableReturnKey");
		}
		if (o.has("fontSize")) {
			this.fontSize = o.getString("fontSize");
		}
		if (o.has("fontWeight")) {
			this.fontWeight = o.getString("fontWeight");
		}
	}

	@Override
	public void createControl(TitaniumModuleManager tmm) {
		EditText tv = new EditText(tmm.getAppContext());
		control = tv;

		tv.addTextChangedListener(this);
		tv.setOnEditorActionListener(this);
		tv.setText(value);
		tv.setGravity(Gravity.TOP | Gravity.LEFT);
		tv.setPadding(10, 5, 10, 7);
		TitaniumUIHelper.styleText(tv, fontSize, fontWeight);

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
				eventManager.invokeSuccessListeners(CHANGE_EVENT, o.toString());
			} catch (JSONException e) {
				Log.e(LCAT, "Error setting value: ", e);
			}
		} else if (msg.what == MSG_RETURN) {
			EditText tv = (EditText) control;
			value = tv.getText();
			JSONObject o = new JSONObject();
			try {
				o.put("value", value);
				eventManager.invokeSuccessListeners(RETURN_EVENT, o.toString());
			} catch (JSONException e) {
				Log.e(LCAT, "Error setting value: ", e);
			}
		} else if (msg.what == MSG_SETVALUE) {
			EditText tv = (EditText) control;
			value = (String) msg.obj;
			tv.setText(value);
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

	public boolean onEditorAction(TextView v, int actionId, KeyEvent keyEvent)
	{
		handler.obtainMessage(MSG_RETURN, actionId, 0, keyEvent).sendToTarget();
		if ((enableReturnKey && v.getText().length() == 0)) {
			return true;
		}
		return false;
	}

	public String getValue() {
		return (String) value;
	}

	public void setValue(String value) {
		handler.obtainMessage(MSG_SETVALUE, value).sendToTarget();
	}
}
