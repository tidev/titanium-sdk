package org.appcelerator.tidev.module;

import org.appcelerator.tidev.TiDevAppLauncherActivity;
import org.appcelerator.tidev.api.ILauncher;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.util.TitaniumIntentWrapper;

import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;

public class TiDevLauncher extends TitaniumBaseModule implements ILauncher {

	public TiDevLauncher(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);
	}

	@Override
	public void register(WebView webView) {
		webView.addJavascriptInterface((ILauncher) this, getModuleName());
	}

	public void launchApp(String url) {
		// Start the launcher activity
		Intent intent = new Intent(getContext(), TiDevAppLauncherActivity.class);
		TitaniumIntentWrapper ti = new TitaniumIntentWrapper(intent);
		ti.setIsContent(true);
		ti.getIntent().setData(Uri.parse(url));
		getContext().startActivity(ti.getIntent());
	}
}
