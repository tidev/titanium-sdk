/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.facebook;

import java.io.IOException;
import java.util.Map;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.util.TiConvert;

import android.os.Bundle;

public final class Utils
{
	public static Bundle mapToBundle(Map<String, Object> map)
	{
		if (map == null) return new Bundle();
		Bundle bundle = new Bundle(map.size());
		
		for (String key : map.keySet()) {
			Object val = map.get(key);
			if (val == null) {
				bundle.putString(key, null);
			} else if (val instanceof TiBlob) {
				bundle.putByteArray(key, ((TiBlob)val).getBytes());
			} else if (val instanceof TiBaseFile) {
				try {
					bundle.putByteArray(key, ((TiBaseFile)val).read().getBytes());
				} catch (IOException e) {
					Log.e("FacebookModule-Util", "Unable to put '" + key + "' value into bundle: " + e.getLocalizedMessage(), e);
				}
			} else {
				bundle.putString(key, TiConvert.toString(val));
			}
		}
		
		return bundle;
	}
}
