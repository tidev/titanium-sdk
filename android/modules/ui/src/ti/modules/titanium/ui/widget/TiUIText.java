/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Rect;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.text.method.DialerKeyListener;
import android.text.method.DigitsKeyListener;
import android.text.method.NumberKeyListener;
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

public class TiUIText extends TiUIView
	implements TextWatcher, OnEditorActionListener, OnFocusChangeListener
{
	private static final String LCAT = "TiUIText";
	private static final boolean DBG = TiConfig.LOGD;

	public static final int RETURNKEY_GO = 0;
	public static final int RETURNKEY_GOOGLE = 1;
	public static final int RETURNKEY_JOIN = 2;
	public static final int RETURNKEY_NEXT = 3;
	public static final int RETURNKEY_ROUTE = 4;
	public static final int RETURNKEY_SEARCH = 5;
	public static final int RETURNKEY_YAHOO = 6;
	public static final int RETURNKEY_DONE = 7;
	public static final int RETURNKEY_EMERGENCY_CALL = 8;
	public static final int RETURNKEY_DEFAULT = 9;
	public static final int RETURNKEY_SEND = 10;

	private static final int KEYBOARD_ASCII = 0;
	private static final int KEYBOARD_NUMBERS_PUNCTUATION = 1;
	private static final int KEYBOARD_URL = 2;
	private static final int KEYBOARD_NUMBER_PAD = 3;
	private static final int KEYBOARD_PHONE_PAD = 4;
	private static final int KEYBOARD_EMAIL_ADDRESS = 5;
	private static final int KEYBOARD_NAMEPHONE_PAD = 6;
	private static final int KEYBOARD_DEFAULT = 7;
	
	// UIModule also has these as values - there's a chance they won't stay in sync if somebody changes one without changing these
	private static final int TEXT_AUTOCAPITALIZATION_NONE = 0;
	private static final int TEXT_AUTOCAPITALIZATION_SENTENCES = 1;
	private static final int TEXT_AUTOCAPITALIZATION_WORDS = 2;
	private static final int TEXT_AUTOCAPITALIZATION_ALL = 3;

	private boolean field;

	protected EditText tv;

	public TiUIText(TiViewProxy proxy, boolean field) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a text field");
		}
		this.field = field;
		tv = new EditText(getProxy().getContext());
		if (field) {
			tv.setSingleLine();
			tv.setMaxLines(1);
		}
		tv.addTextChangedListener(this);
		tv.setOnEditorActionListener(this);
		tv.setOnFocusChangeListener(this); // TODO refactor to TiUIView?
		tv.setIncludeFontPadding(true); 
		//tv.setPadding(5, 0, 5, 0);
		if (field) {
			tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		} else {
			tv.setGravity(Gravity.TOP | Gravity.LEFT);
		}
		setNativeView(tv);

	}


	@Override
	public void processProperties(TiDict d)
	{
		super.processProperties(d);

		if (d.containsKey("enabled")) {
			tv.setEnabled(d.getBoolean("enabled"));
		}
		if (d.containsKey("value")) {
			tv.setText(d.getString("value"));
		}
		if (d.containsKey("color")) {
			tv.setTextColor(TiConvert.toColor(d, "color"));
		}
		if (d.containsKey("hintText")) {
			tv.setHint(d.getString("hintText"));
		}
		if (d.containsKey("font")) {
			TiUIHelper.styleText(tv, d.getTiDict("font"));
		}
		if (d.containsKey("textAlign") || d.containsKey("verticalAlign")) {
			String textAlign = null;
			String verticalAlign = null;
			if (d.containsKey("textAlign")) {
				textAlign = d.getString("textAlign");
			}
			if (d.containsKey("verticalAlign")) {
				verticalAlign = d.getString("verticalAlign");
			}
			handleTextAlign(textAlign, verticalAlign);
		}
		if (d.containsKey("returnKeyType")) {
			handleReturnKeyType(d.getInt("returnKeyType"));
		}
		if (d.containsKey("keyboardType") || d.containsKey("autocorrect") || d.containsKey("passwordMask") || d.containsKey("autocapitalization"))
		{
			handleKeyboard(d);
			
		}
	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		if (key.equals("enabled")) {
			tv.setEnabled(TiConvert.toBoolean(newValue));
		} else if (key.equals("value")) {
			tv.setText((String) newValue);
		} else if (key.equals("color")) {
			tv.setTextColor(TiConvert.toColor((String) newValue));
		} else if (key.equals("hintText")) {
			tv.setHint((String) newValue);
		} else if (key.equals("textAlign") || key.equals("verticalAlign")) {
			String textAlign = null;
			String verticalAlign = null;
			if (key.equals("textAlign")) {
				textAlign = TiConvert.toString(newValue);
			}
			if (key.equals("verticalAlign")) {
				verticalAlign = TiConvert.toString(newValue);
			}
			handleTextAlign(textAlign, verticalAlign);
		} else if (key.equals("keyboardType") || (key.equals("autocorrect") || key.equals("autocapitalization") || key.equals("passwordMask"))) {
			TiDict d = proxy.getDynamicProperties();
			handleKeyboard(d);
		} else if (key.equals("returnKeyType")) {
			handleReturnKeyType(TiConvert.toInt(newValue));
		} else if (key.equals("font")) {
			TiUIHelper.styleText(tv, (TiDict) newValue);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}


	public void afterTextChanged(Editable tv) {
	}


	public void beforeTextChanged(CharSequence s, int start, int before, int count) {

	}


	public void onTextChanged(CharSequence s, int start, int before, int count)
	{
		String value = tv.getText().toString();
		TiDict data = new TiDict();
		data.put("value", value);

		proxy.internalSetDynamicValue("value", value, false);
		proxy.fireEvent("change", data);
	}


	public void onFocusChange(View v, boolean hasFocus) {
		if (hasFocus) {
			Boolean clearOnEdit = (Boolean) proxy.getDynamicValue("clearOnEdit");
			if (clearOnEdit != null && clearOnEdit) {
				((EditText) nativeView).setText("");
			}
			Rect r = new Rect();
			nativeView.getFocusedRect(r);
			nativeView.requestRectangleOnScreen(r);

		}
		super.onFocusChange(v, hasFocus);
	}

	@Override
	protected TiDict getFocusEventObject(boolean hasFocus)
	{
		TiDict event = new TiDict();
		event.put("value", tv.getText().toString());
		return event;
	}

	public boolean onEditorAction(TextView v, int actionId, KeyEvent keyEvent)
	{
		String value = tv.getText().toString();
		TiDict data = new TiDict();
		data.put("value", value);

		proxy.internalSetDynamicValue("value", value, false);
		if (DBG) {
			Log.e(LCAT, "ActionID: " + actionId + " KeyEvent: " + (keyEvent != null ? keyEvent.getKeyCode() : null));
		}
		if (actionId != EditorInfo.IME_ACTION_GO) {
			proxy.fireEvent("return", data);
		}

		Boolean enableReturnKey = (Boolean) proxy.getDynamicValue("enableReturnKey");
		if (enableReturnKey != null && enableReturnKey && v.getText().length() == 0) {
			return true;
		}
		return false;
	}

	public void handleTextAlign(String textAlign, String verticalAlign)
	{
		if (verticalAlign == null) {
			verticalAlign = field ? "middle" : "top";
		}
		if (textAlign == null) {
			textAlign = "left";
		}
		TiUIHelper.setAlignment(tv, textAlign, verticalAlign);
	}

	public void handleKeyboard(TiDict d) 
	{
		int type = KEYBOARD_ASCII;
		int passwordMask = 0;
		int autocorrect = InputType.TYPE_TEXT_FLAG_AUTO_CORRECT | InputType.TYPE_TEXT_FLAG_AUTO_CORRECT;
		int autoCapValue = 0;
		
		if (d.containsKey("autocorrect")) {
			if(TiConvert.toBoolean(d, "autocorrect")) {
				autocorrect = InputType.TYPE_TEXT_FLAG_AUTO_CORRECT | InputType.TYPE_TEXT_FLAG_AUTO_CORRECT;
			} else {
				autocorrect = 0;
			}
		}

		if (d.containsKey("autocapitalization")) {
			
			switch (TiConvert.toInt(d,"autocapitalization")) {
				case TEXT_AUTOCAPITALIZATION_NONE:
					autoCapValue = 0;
					break;
				case TEXT_AUTOCAPITALIZATION_ALL:
					autoCapValue = InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS | 
						InputType.TYPE_TEXT_FLAG_CAP_SENTENCES |
						InputType.TYPE_TEXT_FLAG_CAP_WORDS
						;
					break;
				case TEXT_AUTOCAPITALIZATION_SENTENCES:
					autoCapValue = InputType.TYPE_TEXT_FLAG_CAP_SENTENCES;
					break;
				
				case TEXT_AUTOCAPITALIZATION_WORDS:
					autoCapValue = InputType.TYPE_TEXT_FLAG_CAP_WORDS;
					break;
	
				default:
					Log.w(LCAT, "Unknown AutoCapitalization Value ["+d.getString("autocapitalization")+"]");
				break;
			}
		}
				
		if (d.containsKey("passwordMask")) {
			if(TiConvert.toBoolean(d,"passwordMask")) {
				passwordMask = InputType.TYPE_TEXT_VARIATION_PASSWORD;
			}
		}		

		if (d.containsKey("keyboardType")) {
			type = TiConvert.toInt(d, "keyboardType");
		}
		
		int typeModifiers = autocorrect | passwordMask | autoCapValue;
		
		switch(type) {
			case KEYBOARD_ASCII :
				tv.setKeyListener(TextKeyListener.getInstance(autocorrect != 0, Capitalize.NONE));
				tv.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_NORMAL | typeModifiers);
				break;
			case KEYBOARD_NUMBERS_PUNCTUATION :
				tv.setInputType(InputType.TYPE_CLASS_NUMBER | typeModifiers);
				tv.setKeyListener(new NumberKeyListener() {
					
					@Override
					public int getInputType() {
						return InputType.TYPE_CLASS_NUMBER;
					}
					
					@Override
					protected char[] getAcceptedChars() {
						return new char[] {
							'0', '1', '2','3','4','5','6','7','8','9',
							'.','-','+','_','*','-','!','@', '#', '$',
							'%', '^', '&', '*', '(', ')', '=',
							'{', '}', '[', ']', '|', '\\', '<', '>',
							',', '?', '/', ':', ';', '\'', '"', '~'
						};
					}
				});
				//tv.setKeyListener(DigitsKeyListener.getInstance());
				if (passwordMask != 0) {
					tv.setTransformationMethod(PasswordTransformationMethod.getInstance());
				}
				break;
			case KEYBOARD_URL :
				Log.i(LCAT, "Setting keyboard type URL-3");
				//tv.setKeyListener(TextKeyListener.getInstance(autocorrect, Capitalize.NONE));
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				tv.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI | typeModifiers);
				break;
			case KEYBOARD_NUMBER_PAD :
				tv.setKeyListener(DigitsKeyListener.getInstance(true,true));
				tv.setInputType(InputType.TYPE_CLASS_NUMBER | typeModifiers);
				if (passwordMask != 0) {
					tv.setTransformationMethod(PasswordTransformationMethod.getInstance());
				}
				break;
			case KEYBOARD_PHONE_PAD :
				tv.setKeyListener(DialerKeyListener.getInstance());
				tv.setInputType(InputType.TYPE_CLASS_PHONE | typeModifiers);
				if (passwordMask != 0) {
					tv.setTransformationMethod(PasswordTransformationMethod.getInstance());
				}
				break;
			case KEYBOARD_EMAIL_ADDRESS :
				tv.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS | typeModifiers);
				break;
			case KEYBOARD_DEFAULT :
				tv.setKeyListener(TextKeyListener.getInstance(autocorrect != 0, Capitalize.NONE));
				tv.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_NORMAL | typeModifiers);
				break;
		}

		if (!field) {
			tv.setSingleLine(false);
		}
	}
	
	public void handleReturnKeyType(int type)
	{
		switch(type) {
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
			case RETURNKEY_DEFAULT :
				tv.setImeOptions(EditorInfo.IME_ACTION_UNSPECIFIED);
				break;
			case RETURNKEY_SEND :
				tv.setImeOptions(EditorInfo.IME_ACTION_SEND);
				break;
		}
	}
}
