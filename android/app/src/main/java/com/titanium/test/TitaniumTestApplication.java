/* AUTO-GENERATED FILE.  DO NOT MODIFY.
 *
 * This class was automatically generated by
 * Appcelerator. It should not be modified by hand.
 */

package com.titanium.test;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.runtime.v8.V8Runtime;
import org.appcelerator.kroll.util.KrollAssetCache;
import org.appcelerator.titanium.TiApplication;

public final class TitaniumTestApplication extends TiApplication
{
	private static final String TAG = "TitaniumTestApplication";

	@Override
	public void onCreate()
	{
		appInfo = new TitaniumTestAppInfo(this);

		// KrollAssetHelper.setAssetCrypt(new AssetCryptImpl());

		// Load cache as soon as possible.
		KrollAssetCache.init(this);

		super.onCreate();

		V8Runtime runtime = new V8Runtime();
		KrollRuntime.init(this, runtime);
		postOnCreate();
	}
}
