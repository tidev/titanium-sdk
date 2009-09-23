package org.appcelerator.titanium.module.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumCompositeView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

public class TitaniumCompositeView extends TitaniumBaseView
	implements ITitaniumCompositeView
{
	private static final String LCAT = "TiCompositeView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	ArrayList<ITitaniumView> views;

	public TitaniumCompositeView(TitaniumModuleManager tmm)
	{
		super(tmm);
	}

	@Override
	protected void processLocalOptions(JSONObject o) throws JSONException
	{
		openViewAfterOptions = true;
		openViewDelay = 0;
	}

	@Override
	protected void doOpen()
	{
		Context context = getContext();
		setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		setFocusable(true);
		setFocusableInTouchMode(true);
		setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = super.handleMessage(msg);
		return handled;
	}

	public void addView(String key, String layout) {
		// TODO Auto-generated method stub

	}

	@Override
	protected View getContentView() {
		// TODO Auto-generated method stub
		return null;
	}

}
