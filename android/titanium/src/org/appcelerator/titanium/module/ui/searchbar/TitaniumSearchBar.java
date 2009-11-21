package org.appcelerator.titanium.module.ui.searchbar;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.module.ui.TitaniumBaseNativeControl;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumColorHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Message;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup.LayoutParams;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.TextView.OnEditorActionListener;

public class TitaniumSearchBar extends TitaniumBaseNativeControl
	implements TextWatcher, OnEditorActionListener
{
	private static final String LCAT = "TiSearchBar";

	private static final int MSG_CHANGE = 300;
	private static final int MSG_CANCEL = 301;
	private static final int MSG_SETVALUE = 302;
	private static final int MSG_RETURN = 303;


	public static final String CHANGE_EVENT = "change";
	public static final String CANCEL_EVENT = "cancel";
	public static final String RETURN_EVENT = "return";

	private CharSequence value;
	private String color;
	private String backgroundColor;
	private boolean enableReturnKey;
	private String fontSize;
	private String fontWeight;
	private boolean showCancel;
	private String barColor;

	EditText tv;
	ImageButton cancelBtn;

	public interface OnSearchChangeListener {
		public void filterBy(String s);
	}

	private OnSearchChangeListener searchChangeListener;

	public TitaniumSearchBar(TitaniumModuleManager tmm)
	{
		super(tmm);

		eventManager.supportEvent(CHANGE_EVENT);
		eventManager.supportEvent(CANCEL_EVENT);
		eventManager.supportEvent(RETURN_EVENT);
		value = "";
		showCancel = true;
	}


	@Override
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
		if (o.has("showCancel")) {
			this.showCancel = o.getBoolean("showCancel");
		}
		if (o.has("barColor")) {
			this.barColor = o.getString("barColor");
		}
	}


	@Override
	public void createControl(TitaniumModuleManager tmm)
	{
		tv = new EditText(tmm.getAppContext());
		tv.isFocusable();
		tv.setId(100);

		tv.addTextChangedListener(this);
		tv.setOnEditorActionListener(this);
		tv.setText(value);
		tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		tv.setPadding(4,2,4,2);
		tv.setSingleLine();
		TitaniumUIHelper.styleText(tv, fontSize, fontWeight);

		if (color != null) {
			tv.setTextColor(TitaniumColorHelper.parseColor(color));
		}
		if (backgroundColor != null) {
			tv.setBackgroundColor(TitaniumColorHelper.parseColor(backgroundColor));
		}

		cancelBtn = new ImageButton(tmm.getAppContext());
		cancelBtn.isFocusable();
		cancelBtn.setId(101);
		cancelBtn.setPadding(0,0,0,0);
		Drawable d = new BitmapDrawable(this.getClass().getResourceAsStream("cancel.png"));
		cancelBtn.setImageDrawable(d);
		cancelBtn.setMinimumWidth(48);

		cancelBtn.setVisibility(showCancel ? View.VISIBLE : View.GONE);
		cancelBtn.setOnClickListener(new OnClickListener(){

			public void onClick(View view) {
				handler.sendEmptyMessage(MSG_CANCEL);
			}});

		RelativeLayout layout = new RelativeLayout(tmm.getAppContext());
		control = layout;

		layout.setGravity(Gravity.NO_GRAVITY);
		layout.setPadding(0,0,0,0);
		if (barColor != null) {
			layout.setBackgroundColor(TitaniumColorHelper.parseColor(barColor));
		}

		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		params.addRule(RelativeLayout.LEFT_OF, 101);
		params.setMargins(4, 4, 0, 4);
		layout.addView(tv, params);

		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		params.setMargins(0, 4, 4, 4);
		layout.addView(cancelBtn, params);
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_CHANGE) {
			value = tv.getText().toString();
			if (searchChangeListener != null) {
				searchChangeListener.filterBy(value.toString());
			}
			JSONObject o = new JSONObject();
			try {
				o.put("value", value);
				eventManager.invokeSuccessListeners(CHANGE_EVENT, o.toString());
			} catch (JSONException e) {
				Log.e(LCAT, "Error setting value: ", e);
			}
		} else if (msg.what == MSG_SETVALUE) {
			doSetValue((String) msg.obj);
		} else if (msg.what == MSG_CANCEL) {
			doSetValue((String) msg.obj);
			eventManager.invokeSuccessListeners(CANCEL_EVENT, null);
		}  else if (msg.what == MSG_RETURN) {
			value = tv.getText().toString();
			JSONObject o = new JSONObject();
			try {
				o.put("value", value);
				eventManager.invokeSuccessListeners(RETURN_EVENT, o.toString());
			} catch (JSONException e) {
				Log.e(LCAT, "Error setting value: ", e);
			}
		}

		return super.handleMessage(msg);
	}

	protected void doSetValue(String value)
	{
		this.value = value;
		tv.setText(value);
	}

	public String getValue() {
		return (String) value;
	}

	public void setValue(String value) {
		handler.obtainMessage(MSG_SETVALUE, value).sendToTarget();
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

	public void setOnSearchChangeListener(OnSearchChangeListener listener) {
		searchChangeListener = listener;
	}
}
