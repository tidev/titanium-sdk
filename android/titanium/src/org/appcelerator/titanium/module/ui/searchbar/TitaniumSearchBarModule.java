package org.appcelerator.titanium.module.ui.searchbar;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.TitaniumBaseModule;
import org.appcelerator.titanium.module.map.TitaniumMapView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumDispatchException;

import android.os.Message;
import android.webkit.WebView;

public class TitaniumSearchBarModule extends TitaniumBaseModule
{
	private static final String LCAT = "TiSearchBarModule";
	private static final boolean DBG = TitaniumConfig.LOGD;

	protected static final int MSG_CREATE_SEARCHBAR = FIRST_MODULE_ID + 0;

	public TitaniumSearchBarModule(TitaniumModuleManager manager, String moduleName) {
		super(manager, moduleName);
	}

	@Override
	public void register(WebView webView) {
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumMap as " + moduleName + " using TitaniumMethod.");
		}

		tmm.registerInstance(moduleName, this);
	}

	@Override
	public boolean handleMessage(Message msg) {
		boolean handled =  super.handleMessage(msg);

		if (!handled) {
			switch(msg.what) {
			case MSG_CREATE_SEARCHBAR :
				Holder h = (Holder) msg.obj;
				h.setAndRelease(new TitaniumSearchBar(tmm));
				handled = true;
				break;
			}
		}

		return handled;
	}

	public String createSearchBar()
	{
		TitaniumSearchBar sbar = (TitaniumSearchBar) createObject(MSG_CREATE_SEARCHBAR);
		String name = tmm.generateId("TiSearchBar");
		tmm.registerInstance(name, sbar);

		return name;
	}
}
