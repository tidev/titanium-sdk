package org.appcelerator.titanium;

import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.content.Intent;
import android.os.Bundle;

public class TitaniumSingleActivity extends TitaniumActivityGroup
{

	public TitaniumSingleActivity() {
		// TODO Auto-generated constructor stub
	}

	public TitaniumSingleActivity(boolean singleActivityMode) {
		super(singleActivityMode);
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		ArrayList<TitaniumWindowInfo> windows = appInfo.getWindows();
		TitaniumWindowInfo info = windows.get(0);

		TitaniumIntentWrapper appIntent = new TitaniumIntentWrapper(new Intent(this, TitaniumActivity.class));
		appIntent.setWindowId(info.getWindowId());

		launch(appIntent);
	}
}
