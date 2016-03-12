/**
 * Dev by rotorgames
 * Email: rotorgames@bk.ru
 * Git: https://github.com/rotorgames
 * Branch: https://github.com/rotorgames/titanium_mobile/tree/3_5_X_TiShadow_service
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.kroll.common.Log;

public class TiShadowHelper {
	
	private static final String TAG = "TiShadowHelper";
	
	protected static TiFileFactory tiFileFactory;
	protected static TiApplication tiApp = TiApplication.getInstance();
	protected static TiProperties tiProp =  tiApp.getAppProperties();
    
	public static Boolean isTishadow()
	{
		String tiShadowVersion = tiProp.getString("tishadow:version", "");
		if(tiShadowVersion != ""){
			Log.i(TAG, "Tishadow "+tiShadowVersion+": enabled");
			return true;
		}else{
			Log.i(TAG, "Tishadow: disabled");
			return false;
		}
	}
	
	public static String getDataDirectory()
	{
		String appName = tiApp.getAppInfo().getName().replaceAll(" ", "_");
		String dataDirectory = tiFileFactory.getDataDirectory(true).toString();
		String path = dataDirectory+"/"+appName+"/android/";
		
		Log.i(TAG, "Use path: "+path);
		
		return path;
	}
}
