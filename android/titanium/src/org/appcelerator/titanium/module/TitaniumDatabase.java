package org.appcelerator.titanium.module;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumDB;
import org.appcelerator.titanium.api.ITitaniumDatabase;
import org.appcelerator.titanium.module.db.TitaniumDB;

import android.content.Context;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.util.Config;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumDatabase extends TitaniumBaseModule implements
		ITitaniumDatabase
{
	private static final String LCAT = "TiDatabase";
	private static final boolean DBG = Config.LOGD;

	protected String lastException;

	public TitaniumDatabase(TitaniumModuleManager moduleMgr, String name) {
		super(moduleMgr, name);
	}

	@Override
	public void register(WebView webView) {
		String name = getModuleName();
		if (DBG) {
			Log.d(LCAT, "Registering TitaniumDatabase as " + name);
		}
		webView.addJavascriptInterface((ITitaniumDatabase) this, name);
	}

	public ITitaniumDB open(String name)
	{
		ITitaniumDB tdb = null;

		try {
			SQLiteDatabase db = getWebView().getContext().openOrCreateDatabase(name, Context.MODE_PRIVATE, null);
			if (DBG) {
				Log.d(LCAT, "Opened database: " + name);
			}

			tdb = new TitaniumDB(getWebView().getContext(), name, db);
		} catch (SQLException e) {
			String msg = "Error opening database: " + name + " msg=" + e.getMessage();
			Log.e(LCAT, msg, e);
			setException(msg);
		}

		return tdb;
	}

	protected void setException(String msg) {
		lastException = msg;

	}
	public String getLastException() {
		String e = lastException;
		lastException = null;
		return e;
	}

}
