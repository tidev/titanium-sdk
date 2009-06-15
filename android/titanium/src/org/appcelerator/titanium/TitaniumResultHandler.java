package org.appcelerator.titanium;

import android.content.Intent;

public interface TitaniumResultHandler
{
	public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data);
}
