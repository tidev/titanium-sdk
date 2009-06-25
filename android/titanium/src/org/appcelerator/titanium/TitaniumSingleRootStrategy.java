package org.appcelerator.titanium;

import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.content.Intent;
import android.os.Bundle;

public class TitaniumSingleRootStrategy implements ITitaniumAppStrategy {

	public TitaniumSingleRootStrategy() {
	}

	public void onCreate(final TitaniumActivityGroup tag, Bundle savedInstanceState) {
		TitaniumApplication app = (TitaniumApplication) tag.getApplication();
		ArrayList<TitaniumWindowInfo> windows = app.getAppInfo().getWindows();
		TitaniumWindowInfo info = windows.get(0);

		TitaniumIntentWrapper appIntent = new TitaniumIntentWrapper(new Intent(tag, TitaniumActivity.class));
		appIntent.setWindowId(info.getWindowId());

		tag.launch(appIntent);
	}
}
