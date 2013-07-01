/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.graphics.Rect;
import android.text.Editable;
import android.text.InputType;
import android.text.TextUtils.TruncateAt;
import android.text.TextWatcher;
import android.text.method.DialerKeyListener;
import android.text.method.DigitsKeyListener;
import android.text.method.NumberKeyListener;
import android.text.method.PasswordTransformationMethod;
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
	private static final String TAG = "TiUIText";

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
	@SuppressWarnings("unused")
	private static final int KEYBOARD_NAMEPHONE_PAD = 6;
	private static final int KEYBOARD_DEFAULT = 7;
	private static final int KEYBOARD_DECIMAL_PAD = 8;
	
	// UIModule also has these as values - there's a chance they won't stay in sync if somebody changes one without changing these
	private static final int TEXT_AUTOCAPITALIZATION_NONE = 0;
	private static final int TEXT_AUTOCAPITALIZATION_SENTENCES = 1;
	private static final int TEXT_AUTOCAPITALIZATION_WORDS = 2;
	private static final int TEXT_AUTOCAPITALIZATION_ALL = 3;

	private boolean field;
	private int maxLength = -1;
	private boolean isTruncatingText = false;

	protected TiEditText tv;
	
	public class TiEditText extends EditText 
	{
		public TiEditText(Context context) 
		{
			super(context);
		}
		
		/** 
		 * Check whether the called view is a text editor, in which case it would make sense to 
		 * automatically display a soft input window for it.
		 */
		@Override
		public boolean onCheckIsTextEditor () {
			if (proxy.hasProperty(TiC.PROPERTY_SOFT_KEYBOARD_ON_FOCUS)
					&& TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_SOFT_KEYBOARD_ON_FOCUS)) == TiUIView.SOFT_KEYBOARD_HIDE_ON_FOCUS) {
					return false;
			}
			if (proxy.hasProperty(TiC.PROPERTY_EDITABLE)
					&& !(TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_EDITABLE)))) {
				return false;
			}
			return true;
		}

		@Override
		protected void onLayout(boolean changed, int left, int top, int right, int bottom)
		{
			super.onLayout(changed, left, top, right, bottom);
			TiUIHelper.firePostLayoutEvent(proxy);
		}
	}

	public TiUIText(TiViewProxy proxy, boolean field)
	{
		super(proxy);
		Log.d(TAG, "Creating a text field", Log.DEBUG_MODE);
		
		this.field = field;
		tv = new TiEditText(getProxy().getActivity());
		if (field) {
			tv.setSingleLine();
			tv.setMaxLines(1);
		}
		tv.addTextChangedListener(this);
		tv.setOnEditorActionListener(this);
		tv.setOnFocusChangeListener(this); // TODO refactor to TiUIView?
		tv.setIncludeFontPadding(true); 
		if (field) {
			tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		} else {
			tv.setGravity(Gravity.TOP | Gravity.LEFT);
		}
		setNativeView(tv);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		if (d.containsKey(TiC.PROPERTY_ENABLED)) {
			tv.setEnabled(TiConvert.toBoolean(d, TiC.PROPERTY_ENABLED, true));
		}
		
		if (d.containsKey(TiC.PROPERTY_MAX_LENGTH) && field) {
			maxLength = TiConvert.toInt(d.get(TiC.PROPERTY_MAX_LENGTH), -1);
		}
		if (d.containsKey(TiC.PROPERTY_VALUE)) {
			tv.setText(d.getString(TiC.PROPERTY_VALUE));
		} else {
			tv.setText("");
		}
		
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			tv.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR));
		}
		
		if (d.containsKey(TiC.PROPERTY_HINT_TEXT)) {
			tv.setHint(d.getString(TiC.PROPERTY_HINT_TEXT));
		}
		
		if (d.containsKey(TiC.PROPERTY_ELLIPSIZE)) {
			if (TiConvert.toBoolean(d, TiC.PROPERTY_ELLIPSIZE)) {
				tv.setEllipsize(TruncateAt.END);
			} else {
				tv.setEllipsize(null);
			}
		}
		
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(tv, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN) || d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String textAlign = null;
			String verticalAlign = null;
			if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN)) {
				textAlign = d.getString(TiC.PROPERTY_TEXT_ALIGN);
			}
			if (d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
				verticalAlign = d.getString(TiC.PROPERTY_VERTICAL_ALIGN);
			}
			handleTextAlign(textAlign, verticalAlign);
		}
		
		if (d.containsKey(TiC.PROPERTY_RETURN_KEY_TYPE)) {
			handleReturnKeyType(TiConvert.toInt(d.get(TiC.PROPERTY_RETURN_KEY_TYPE), RETURNKEY_DEFAULT));
		}
		
		if (d.containsKey(TiC.PROPERTY_KEYBOARD_TYPE) || d.containsKey(TiC.PROPERTY_AUTOCORRECT) || d.containsKey(TiC.PROPERTY_PASSWORD_MASK) || d.containsKey(TiC.PROPERTY_AUTOCAPITALIZATION) || d.containsKey(TiC.PROPERTY_EDITABLE)) {
			handleKeyboard(d);
		}
		
		if (d.containsKey(TiC.PROPERTY_AUTO_LINK)) {
			TiUIHelper.linkifyIfEnabled(tv, d.get(TiC.PROPERTY_AUTO_LINK));
		}
	}


	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}
		if (key.equals(TiC.PROPERTY_ENABLED)) {
			tv.setEnabled(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_VALUE)) {
			tv.setText(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_MAX_LENGTH)) {
			maxLength = TiConvert.toInt(newValue);
			//truncate if current text exceeds max length
			Editable currentText = tv.getText();
			if (maxLength >= 0 && currentText.length() > maxLength) {
				CharSequence truncateText = currentText.subSequence(0, maxLength);
				int cursor = tv.getSelectionStart() - 1;
				if (cursor > maxLength) {
					cursor = maxLength;
				}
				tv.setText(truncateText);
				tv.setSelection(cursor);
			}
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			tv.setTextColor(TiConvert.toColor((String) newValue));
		} else if (key.equals(TiC.PROPERTY_HINT_TEXT)) {
			tv.setHint((String) newValue);
		} else if (key.equals(TiC.PROPERTY_ELLIPSIZE)) {
			if (TiConvert.toBoolean(newValue)) {
				tv.setEllipsize(TruncateAt.END);
			} else {
				tv.setEllipsize(null);
			}
		} else if (key.equals(TiC.PROPERTY_TEXT_ALIGN) || key.equals(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String textAlign = null;
			String verticalAlign = null;
			if (key.equals(TiC.PROPERTY_TEXT_ALIGN)) {
				textAlign = TiConvert.toString(newValue);
			} else if (proxy.hasProperty(TiC.PROPERTY_TEXT_ALIGN)){
				textAlign = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_TEXT_ALIGN));
			}
			if (key.equals(TiC.PROPERTY_VERTICAL_ALIGN)) {
				verticalAlign = TiConvert.toString(newValue);
			} else if (proxy.hasProperty(TiC.PROPERTY_VERTICAL_ALIGN)){
				verticalAlign = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_VERTICAL_ALIGN));
			}
			handleTextAlign(textAlign, verticalAlign);
		} else if (key.equals(TiC.PROPERTY_KEYBOARD_TYPE) || (key.equals(TiC.PROPERTY_AUTOCORRECT) || key.equals(TiC.PROPERTY_AUTOCAPITALIZATION) || key.equals(TiC.PROPERTY_PASSWORD_MASK) || key.equals(TiC.PROPERTY_EDITABLE))) {
			KrollDict d = proxy.getProperties();
			handleKeyboard(d);
		} else if (key.equals(TiC.PROPERTY_RETURN_KEY_TYPE)) {
			handleReturnKeyType(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(tv, (HashMap) newValue);
		} else if (key.equals(TiC.PROPERTY_AUTO_LINK)){
			TiUIHelper.linkifyIfEnabled(tv, newValue);
		} else {
		
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void afterTextChanged(Editable editable)
	{
		if (maxLength >= 0 && editable.length() > maxLength) {
			// The input characters are more than maxLength. We need to truncate the text and reset text.
			isTruncatingText = true;
			String newText = editable.subSequence(0, maxLength).toString();
			int cursor = tv.getSelectionStart();
			if (cursor > maxLength) {
				cursor = maxLength;
			}
			tv.setText(newText); // This method will invoke onTextChanged() and afterTextChanged().
			tv.setSelection(cursor);
		} else {
			isTruncatingText = false;
		}
	}

	@Override
	public void beforeTextChanged(CharSequence s, int start, int before, int count)
	{

	}

	@Override
	public void onTextChanged(CharSequence s, int start, int before, int count)
	{
		/**
		 * There is an Android bug regarding setting filter on EditText that impacts auto completion.
		 * Therefore we can't use filters to implement "maxLength" property. Instead we manipulate
		 * the text to achieve perfect parity with other platforms.
		 * Android bug url for reference: http://code.google.com/p/android/issues/detail?id=35757
		 */
		if (maxLength >= 0 && s.length() > maxLength) {
			// Can only set truncated text in afterTextChanged. Otherwise, it will crash.
			return;
		}
		String newText = tv.getText().toString();
		if (!isTruncatingText || (isTruncatingText && proxy.shouldFireChange(proxy.getProperty(TiC.PROPERTY_VALUE), newText))) {
			KrollDict data = new KrollDict();
			data.put(TiC.PROPERTY_VALUE, newText);
			proxy.setProperty(TiC.PROPERTY_VALUE, newText);
			fireEvent(TiC.EVENT_CHANGE, data);
		}
	}

	@Override
	public void focus()
	{
		super.focus();
		if (nativeView != null) {
			if (proxy.hasProperty(TiC.PROPERTY_EDITABLE) 
					&& !(TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_EDITABLE)))) {
				TiUIHelper.showSoftKeyboard(nativeView, false);
			}
			else {
				TiUIHelper.requestSoftInputChange(proxy, nativeView);
			}
		}
	}

	@Override
	public void onFocusChange(View v, boolean hasFocus)
	{
		if (hasFocus) {
			Boolean clearOnEdit = (Boolean) proxy.getProperty(TiC.PROPERTY_CLEAR_ON_EDIT);
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
	protected KrollDict getFocusEventObject(boolean hasFocus)
	{
		KrollDict event = new KrollDict();
		event.put(TiC.PROPERTY_VALUE, tv.getText().toString());
		return event;
	}

	@Override
	public boolean onEditorAction(TextView v, int actionId, KeyEvent keyEvent)
	{
		String value = tv.getText().toString();
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_VALUE, value);

		proxy.setProperty(TiC.PROPERTY_VALUE, value);
		Log.d(TAG, "ActionID: " + actionId + " KeyEvent: " + (keyEvent != null ? keyEvent.getKeyCode() : null),
			Log.DEBUG_MODE);
		
		//This is to prevent 'return' event from being fired twice when return key is hit. In other words, when return key is clicked,
		//this callback is triggered twice (except for keys that are mapped to EditorInfo.IME_ACTION_NEXT or EditorInfo.IME_ACTION_DONE). The first check is to deal with those keys - filter out
		//one of the two callbacks, and the next checks deal with 'Next' and 'Done' callbacks, respectively.
		//Refer to TiUIText.handleReturnKeyType(int) for a list of return keys that are mapped to EditorInfo.IME_ACTION_NEXT and EditorInfo.IME_ACTION_DONE.
		if ((actionId == EditorInfo.IME_NULL && keyEvent != null) || 
				actionId == EditorInfo.IME_ACTION_NEXT || 
				actionId == EditorInfo.IME_ACTION_DONE ) {
			fireEvent("return", data);
		}

		Boolean enableReturnKey = (Boolean) proxy.getProperty(TiC.PROPERTY_ENABLE_RETURN_KEY);
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

	public void handleKeyboard(KrollDict d) 
	{
		int type = KEYBOARD_ASCII;
		boolean passwordMask = false;
		boolean editable = true;
		int autocorrect = InputType.TYPE_TEXT_FLAG_AUTO_CORRECT;
		int autoCapValue = 0;

		if (d.containsKey(TiC.PROPERTY_AUTOCORRECT) && !TiConvert.toBoolean(d, TiC.PROPERTY_AUTOCORRECT, true)) {
			autocorrect = InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS;
		}

		if (d.containsKey(TiC.PROPERTY_EDITABLE)) {
			editable = TiConvert.toBoolean(d, TiC.PROPERTY_EDITABLE, true);
		}

		if (d.containsKey(TiC.PROPERTY_AUTOCAPITALIZATION)) {

			switch (TiConvert.toInt(d.get(TiC.PROPERTY_AUTOCAPITALIZATION), TEXT_AUTOCAPITALIZATION_NONE)) {
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
					Log.w(TAG, "Unknown AutoCapitalization Value ["+d.getString(TiC.PROPERTY_AUTOCAPITALIZATION)+"]");
				break;
			}
		}

		if (d.containsKey(TiC.PROPERTY_PASSWORD_MASK)) {
			passwordMask = TiConvert.toBoolean(d, TiC.PROPERTY_PASSWORD_MASK, false);
		}

		if (d.containsKey(TiC.PROPERTY_KEYBOARD_TYPE)) {
			type = TiConvert.toInt(d.get(TiC.PROPERTY_KEYBOARD_TYPE), KEYBOARD_DEFAULT);
		}

		int typeModifiers = autocorrect | autoCapValue;
		int textTypeAndClass = typeModifiers;
		// For some reason you can't set both TYPE_CLASS_TEXT and TYPE_TEXT_FLAG_NO_SUGGESTIONS together.
		// Also, we need TYPE_CLASS_TEXT for passwords.
		if (autocorrect != InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS || passwordMask) {
			textTypeAndClass = textTypeAndClass | InputType.TYPE_CLASS_TEXT;
		}
		tv.setCursorVisible(true);
		switch(type) {
			case KEYBOARD_DEFAULT:
			case KEYBOARD_ASCII:
				// Don't need a key listener, inputType handles that.
				break;
			case KEYBOARD_NUMBERS_PUNCTUATION:
				textTypeAndClass |= InputType.TYPE_CLASS_NUMBER;
				tv.setKeyListener(new NumberKeyListener()
				{
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
				break;
			case KEYBOARD_URL:
				Log.d(TAG, "Setting keyboard type URL-3", Log.DEBUG_MODE);
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				textTypeAndClass |= InputType.TYPE_TEXT_VARIATION_URI;
				break;
			case KEYBOARD_DECIMAL_PAD:
				textTypeAndClass |= (InputType.TYPE_NUMBER_FLAG_DECIMAL | InputType.TYPE_NUMBER_FLAG_SIGNED);
			case KEYBOARD_NUMBER_PAD:
				tv.setKeyListener(DigitsKeyListener.getInstance(true,true));
				textTypeAndClass |= InputType.TYPE_CLASS_NUMBER;
				break;
			case KEYBOARD_PHONE_PAD:
				tv.setKeyListener(DialerKeyListener.getInstance());
				textTypeAndClass |= InputType.TYPE_CLASS_PHONE;
				break;
			case KEYBOARD_EMAIL_ADDRESS:
				textTypeAndClass |= InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS;
				break;
		}
		if (passwordMask) {
			textTypeAndClass |= InputType.TYPE_TEXT_VARIATION_PASSWORD;
			// Sometimes password transformation does not work properly when the input type is set after the transformation method.
			// This issue has been filed at http://code.google.com/p/android/issues/detail?id=7092
			tv.setInputType(textTypeAndClass);
			tv.setTransformationMethod(PasswordTransformationMethod.getInstance());

			//turn off text UI in landscape mode b/c Android numeric passwords are not masked correctly in landscape mode.
			if (type == KEYBOARD_NUMBERS_PUNCTUATION || type == KEYBOARD_DECIMAL_PAD || type == KEYBOARD_NUMBER_PAD) {
				tv.setImeOptions(EditorInfo.IME_FLAG_NO_EXTRACT_UI);
			}

		} else {
			tv.setInputType(textTypeAndClass);
			if (tv.getTransformationMethod() instanceof PasswordTransformationMethod) {
				tv.setTransformationMethod(null);
			}
		}
		if (!editable) {
			tv.setKeyListener(null);
			tv.setCursorVisible(false);
		}

		if (!field) {
			tv.setSingleLine(false);
		}
	}

	public void setSelection(int start, int end) 
	{
		int textLength = tv.length();
		if (start < 0 || start > textLength || end < 0 || end > textLength) {
			Log.w(TAG, "Invalid range for text selection. Ignoring.");
			return;
		}
		tv.setSelection(start, end);
	}

	public void handleReturnKeyType(int type)
	{
		switch(type) {
			case RETURNKEY_GO:
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
			case RETURNKEY_GOOGLE:
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
			case RETURNKEY_JOIN:
				tv.setImeOptions(EditorInfo.IME_ACTION_DONE);
				break;
			case RETURNKEY_NEXT:
				tv.setImeOptions(EditorInfo.IME_ACTION_NEXT);
				break;
			case RETURNKEY_ROUTE:
				tv.setImeOptions(EditorInfo.IME_ACTION_DONE);
				break;
			case RETURNKEY_SEARCH:
				tv.setImeOptions(EditorInfo.IME_ACTION_SEARCH);
				break;
			case RETURNKEY_YAHOO:
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
			case RETURNKEY_DONE:
				tv.setImeOptions(EditorInfo.IME_ACTION_DONE);
				break;
			case RETURNKEY_EMERGENCY_CALL:
				tv.setImeOptions(EditorInfo.IME_ACTION_GO);
				break;
			case RETURNKEY_DEFAULT:
				tv.setImeOptions(EditorInfo.IME_ACTION_UNSPECIFIED);
				break;
			case RETURNKEY_SEND:
				tv.setImeOptions(EditorInfo.IME_ACTION_SEND);
				break;
		}
	}
}
