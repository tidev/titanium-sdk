package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumSlider;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Message;
import android.widget.SeekBar;

public class TitaniumSlider extends TitaniumBaseNativeControl
	implements ITitaniumSlider, SeekBar.OnSeekBarChangeListener
{
	private static final String LCAT = "TiSwitch";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int MSG_CHANGE = 300;

	public static final String CHANGE_EVENT = "change";

	private int min;
	private int max;
	private int pos;

	public TitaniumSlider(TitaniumModuleManager tmm) {
		super(tmm);

		eventManager.supportEvent(CHANGE_EVENT);
		this.min = 0;
		this.max = 10;
		this.pos = 0;
	}

	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		super.setLocalOptions(o);

		if (o.has("min")) {
			this.min = o.getInt("min");
		}
		if (o.has("max")) {
			this.max = o.getInt("max");
		}
		if (o.has("pos")) {
			this.pos = o.getInt("pos");
		}
	}

	@Override
	public void open(String json) {
		TitaniumModuleManager ttm = softModuleMgr.get();
		if (ttm != null && control == null) {
			SeekBar b = new SeekBar(ttm.getActivity());
			b.setOnSeekBarChangeListener(this);
			b.setMax(Math.abs(max) + Math.abs(min));
			b.setProgress(pos + Math.abs(min));

			control = b;

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
		if (msg.what == MSG_CHANGE) {
			SeekBar b = (SeekBar) control;
			if (b != null) {
				pos = b.getProgress();
				//scale the position to the range
				int thePos = pos + min;
				eventManager.invokeSuccessListeners("change", "{ value : " + thePos + "}");
			}
		}

		return super.handleMessage(msg);
	}

	public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
		handler.obtainMessage(MSG_CHANGE).sendToTarget();
	}

	public void onStartTrackingTouch(SeekBar seekBar) {
	}

	public void onStopTrackingTouch(SeekBar seekBar) {

	}
}
