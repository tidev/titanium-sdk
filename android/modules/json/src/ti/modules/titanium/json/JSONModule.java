/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.json;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.TiConvert;
import org.json.JSONException;
import org.json.JSONObject;

public class JSONModule extends TiModule {

	public JSONModule(TiContext context) {
		super(context);
	}

	public String stringify(Object data) {
		if (data instanceof TiDict) {
			return TiConvert.toJSON((TiDict)data).toString();
		} else if (data instanceof Object[]) {
			Object[] objects = (Object[])data;
			StringBuilder sb = new StringBuilder();
			sb.append("[");
			for (int i = 0; i < objects.length; i++) {
				sb.append(stringify(objects[i]));
				if (i < objects.length - 1) {
					sb.append(", ");
				}
			}
			sb.append("]");
			return sb.toString();
		} else return data.toString();
	}

	public TiDict parse(String json)
		throws JSONException
	{
		return new TiDict(new JSONObject(json));
	}

}
