package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumImageView;
import org.appcelerator.titanium.module.ui.TitaniumBaseView;
import org.json.JSONException;
import org.json.JSONObject;

import android.view.View;

public class TitaniumImageView extends TitaniumBaseView
	implements ITitaniumImageView
{

	public TitaniumImageView(TitaniumModuleManager tmm) {
		super(tmm);
	}

	@Override
	protected void doOpen() {
	}

	@Override
	protected void processLocalOptions(JSONObject o) throws JSONException {
		// TODO Auto-generated method stub

	}

	@Override
	protected View getContentView() {
		// TODO Auto-generated method stub
		return null;
	}

	public void setScale(boolean scale) {
		// TODO Auto-generated method stub

	}

	public void setURL(String url) {
		// TODO Auto-generated method stub

	}

}
