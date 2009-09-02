package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumText;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.Rect;
import android.os.Message;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.text.method.DialerKeyListener;
import android.text.method.DigitsKeyListener;
import android.text.method.PasswordTransformationMethod;
import android.text.method.TextKeyListener;
import android.text.method.TextKeyListener.Capitalize;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnFocusChangeListener;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.TextView.OnEditorActionListener;

public class TitaniumTextField extends TitaniumBaseNativeControl
	implements ITitaniumText, TextWatcher, OnEditorActionListener, OnFocusChangeListener
{
	private static final String LCAT = "TiTextField";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CHANGE = 300;
	private static final int MSG_RETURN = 301;
	private static final int MSG_SETVALUE = 302;

	private static final int TEXT_ALIGN_LEFT = 0;
	private static final int TEXT_ALIGN_CENTER = 1;
	private static final int TEXT_ALIGN_RIGHT = 2;

	private static final int RETURNKEY_GO = 0;
	private static final int RETURNKEY_GOOGLE = 1;
	private static final int RETURNKEY_JOIN = 2;
	private static final int RETURNKEY_NEXT = 3;
	private static final int RETURNKEY_ROUTE = 4;
	private static final int RETURNKEY_SEARCH = 5;
	private static final int RETURNKEY_YAHOO = 6;
	private static final int RETURNKEY_DONE = 7;
	private static final int RETURNKEY_EMERGENCY_CALL = 8;

	private static final int KEYBOARD_ASCII = 0;
	private static final int KEYBOARD_NUMBERS_PUNCTUATION = 1;
	private static final int KEYBOARD_URL = 2;
	private static final int KEYBOARD_NUMBER_PAD = 3;
	private static final int KEYBOARD_PHONE_PAD = 4;
	private static final int KEYBOARD_EMAIL_ADDRESS = 5;


	public static final String CHANGE_EVENT = "change";
	public static final String RETURN_EVENT = "return";

	private CharSequence value;
	private String color;
	private String backgroundColor;
	private boolean enableReturnKey;
	private boolean hasPasswordMask;
	private int returnKeyType;
	private int keyboardType;
	private boolean autocorrect;
	private int textAlign;
	private boolean clearOnEdit;
	private CharSequence hintText;

	public TitaniumTextField(TitaniumModuleManager tmm) {
		super(tmm);

		eventManager.supportEvent(CHANGE_EVENT);
		eventManager.supportEvent(RETURN_EVENT);

		value = "";
		enableReturnKey = false;
		//returnKeyType;
		keyboardType = KEYBOARD_ASCII;
		autocorrect = true;
		textAlign = TEXT_ALIGN_LEFT;
		clearOnEdit = false;
		hintText = "";
		hasPasswordMask = false;
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
		if (o.has("returnKeyType")) {
			this.returnKeyType = o.getInt("returnKeyType");
		}
		if (o.has("keyboardType")) {
			this.keyboardType = o.getInt("keyboardType");
		}
		if (o.has("autocorrect")) {
			this.autocorrect = o.getBoolean("autocorrect");
		}
		if (o.has("passwordMask")) {
			this.hasPasswordMask = o.getBoolean("passwordMask");
		}
		if (o.has("hintText")) {
			this.hintText = o.getString("hintText");
		}
		if (o.has("textAlign")) {
			String align = o.getString("textAlign");
			if ("left".equals(align)) {
				this.textAlign = TEXT_ALIGN_LEFT;
			} else if ("right".equals(align)) {
				this.textAlign = TEXT_ALIGN_RIGHT;
			} else if ("center".equals(align)) {
				this.textAlign = TEXT_ALIGN_CENTER;
			} else {
				Log.w(LCAT, "Ignoring unknown alignment type: " + align);
			}
		}
		if (o.has("clearOnEdit")) {
			this.clearOnEdit = o.getBoolean("clearOnEdit");
		}
	}

	@Override
	public void createControl(TitaniumModuleManager tmm) {
		EditText tv = new EditText(tmm.getAppContext());
		control = tv;

		tv.setSingleLine();
		tv.setMaxLines(1);
		tv.addTextChangedListener(this);
		tv.setOnEditorActionListener(this);
		tv.setOnFocusChangeListener(this);
		tv.setText(value);
		tv.setHint(hintText);
		tv.setPadding(10, 5, 10, 7);
		tv.setTextSize(15.0f);

		switch(textAlign) {
			case TEXT_ALIGN_LEFT : tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT); break;
			case TEXT_ALIGN_CENTER : tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.CENTER_HORIZONTAL); break;
			case TEXT_ALIGN_RIGHT : tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.RIGHT); break;
		}

		switch(returnKeyType) {
			case RETURNKEY_GO :
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
			case RETURNKEY_GOOGLE :
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
			case RETURNKEY_JOIN :
				tv.setImeOptions(EditorInfo.IME_ACTION_DONE);
				break;
			case RETURNKEY_NEXT :
				tv.setImeOptions(EditorInfo.IME_ACTION_NEXT);
				break;
			case RETURNKEY_ROUTE :
				tv.setImeOptions(EditorInfo.IME_ACTION_DONE);
				break;
			case RETURNKEY_SEARCH :
				tv.setImeOptions(EditorInfo.IME_ACTION_SEARCH);
				break;
			case RETURNKEY_YAHOO :
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
			case RETURNKEY_DONE :
				tv.setImeOptions(EditorInfo.IME_ACTION_DONE);
				break;
			case RETURNKEY_EMERGENCY_CALL :
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
		}

		switch(keyboardType) {
			case KEYBOARD_ASCII :
				tv.setKeyListener(TextKeyListener.getInstance(autocorrect, Capitalize.NONE));
				break;
			case KEYBOARD_NUMBERS_PUNCTUATION :
				tv.setKeyListener(DigitsKeyListener.getInstance());
				break;
			case KEYBOARD_URL :
				tv.setKeyListener(TextKeyListener.getInstance(autocorrect, Capitalize.NONE));
				tv.setRawInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
				break;
			case KEYBOARD_NUMBER_PAD :
				tv.setKeyListener(DigitsKeyListener.getInstance(true,true));
				tv.setRawInputType(InputType.TYPE_CLASS_NUMBER);
				break;
			case KEYBOARD_PHONE_PAD :
				tv.setKeyListener(DialerKeyListener.getInstance());
				break;
			case KEYBOARD_EMAIL_ADDRESS :
				tv.setKeyListener(TextKeyListener.getInstance(autocorrect, Capitalize.NONE));
				tv.setRawInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
				break;
		}

		if (color != null) {
			tv.setTextColor(TitaniumColorHelper.parseColor(color));
		}
		if (backgroundColor != null) {
			tv.setBackgroundColor(TitaniumColorHelper.parseColor(backgroundColor));
		}

		if (hasPasswordMask) {
			tv.setTransformationMethod(PasswordTransformationMethod.getInstance());
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

	public void onFocusChange(View view, boolean hasFocus) {
		if (hasFocus) {
			if (clearOnEdit) {
				((EditText) control).setText("");
			}
			Rect r = new Rect();
			control.getFocusedRect(r);
			control.requestRectangleOnScreen(r);
		}
		super.onFocusChange(view, hasFocus);
	}

	public String getValue() {
		return (String) value;
	}

	public void setValue(String value) {
		handler.obtainMessage(MSG_SETVALUE, value).sendToTarget();
	}
}
