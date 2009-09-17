package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumPicker;
import org.appcelerator.titanium.api.ITitaniumPickerConstants;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.widgets.TitaniumPickerView;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Message;

public class TitaniumPicker extends TitaniumBaseNativeControl
	implements ITitaniumPicker,
	ITitaniumPickerConstants
{
	private static final String LCAT = "TiPicker";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private TitaniumPickerHelper helper;

	public TitaniumPicker(TitaniumModuleManager tmm) {
		super(tmm);
		helper = new TitaniumPickerHelper(tmm.getActivity(), handler, eventManager);
	}

	@Override
	protected void setLocalOptions(JSONObject o) throws JSONException
	{
		super.setLocalOptions(o);
		helper.processOptions(o);
	}

	@Override
	public void createControl(TitaniumModuleManager tmm)
	{
		Context context = tmm.getActivity();

		TitaniumPickerView tp = new TitaniumPickerView(context);
		helper.setView(tp);
		control = tp;
	}

	@Override
	public boolean handleMessage(Message msg) {
		boolean handled = helper.handleMessage(msg);
		if (!handled) {
			handled = super.handleMessage(msg);
		}

		return handled;
	}

	public int getSelectedRow(int col)
	{
		return helper.getSelectedRow(col);
	}

	public void selectRow(int col, int row, String json) {
		handler.obtainMessage(MSG_SELECTROW, col, row, json).sendToTarget();
	}

	public void setColumnData(int col, String json) {
		handler.obtainMessage(MSG_SETCOLUMNDATA, col, -1, json).sendToTarget();
	}

	public void setData(String json) {
		handler.obtainMessage(MSG_SETDATA, json).sendToTarget();
	}

}
