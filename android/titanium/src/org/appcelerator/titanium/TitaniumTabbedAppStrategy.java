package org.appcelerator.titanium;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.config.TitaniumWindowInfo;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import org.appcelerator.titanium.util.Log;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TabHost;
import android.widget.TabWidget;

public class TitaniumTabbedAppStrategy implements ITitaniumAppStrategy
{
	private static final String LCAT = "TiTabbedStrategy";
	@SuppressWarnings("unused")
	private static final boolean DBG = TitaniumConfig.LOGD;

	public TitaniumTabbedAppStrategy() {
	}

	public void onCreate(TitaniumActivityGroup tag, Bundle savedInstanceState)
	{
		TitaniumApplication app = (TitaniumApplication) tag.getApplication();

        TabHost tabHost = new TabHost(tag);
        LinearLayout.LayoutParams linearParams = new LinearLayout.LayoutParams(
                LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);

        TabWidget tabWidget = new TabWidget(tag);

        tabWidget.setId(android.R.id.tabs);
        tabWidget.setPadding(0, 4, 0, 0);
        tabHost.addView(tabWidget, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT));
        FrameLayout frameLayout = new FrameLayout(tag);
        frameLayout.setId(android.R.id.tabcontent);
        frameLayout.setPadding(0, 68, 0, 0);
        tabHost.addView(frameLayout, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));

        tabHost.setup(tag.getLocalActivityManager());

        ArrayList<TitaniumWindowInfo> windows = app.getAppInfo().getWindows();
        boolean addedToContentView = false;

        int len = windows.size();
        for (int i = 0; i < len; i++) {
        	TitaniumWindowInfo info = windows.get(i);

			TabHost.TabSpec spec = null;
			spec = tabHost.newTabSpec(info.getWindowId());

			String windowIconUrl = info.getWindowIconUrl();

			if (windowIconUrl != null) {
				Drawable d = null;
				InputStream is = null;
				try {
					TitaniumFileHelper tfh = new TitaniumFileHelper(tag);
					is = tfh.openInputStream(windowIconUrl, false);
					if (is != null) {
						d = new BitmapDrawable(is);
					}
				} catch (IOException e) {
					Log.e(LCAT, "Unable to process file: " + windowIconUrl, e);
				} finally {
					if (is != null) {
						try {
							is.close();
						} catch (IOException e) {
							//Ignore
						}
					}
				}

				if (d != null) {
					spec.setIndicator(info.getWindowTitle(), d);
				} else {
					spec.setIndicator(info.getWindowTitle());
				}
			} else {
				spec.setIndicator(info.getWindowTitle());
			}

			Class<?> activity = TitaniumApplication.getActivityForType(info.getWindowType());
			TitaniumIntentWrapper tabIntent = new TitaniumIntentWrapper(new Intent(tag, activity));
			tabIntent.updateUsing(info);
			spec.setContent(tabIntent.getIntent());

			tabHost.addTab(spec);

			if (!addedToContentView) {
		 		tag.setContentView(tabHost,linearParams);
		 		addedToContentView = true;
			}
        }

	}

}
