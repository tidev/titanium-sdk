package org.appcelerator.titanium.util;

import android.content.Intent;

public interface TiActivitySupport
{
	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler handler);
	public int getUniqueResultCode();
}
