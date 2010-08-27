/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app.properties;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.json.JSONException;
import org.json.JSONObject;

public class PropertiesModule extends TiModule {

	private static final String LCAT = "PropertiesModule";
	private TiProperties appProperties;
	
	public PropertiesModule(TiContext tiContext) {
		super(tiContext);
		
		appProperties = tiContext.getTiApp().getAppProperties();
		
	}

	public Boolean getBool(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			if (appProperties.hasProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return appProperties.getBool(key, false);
			} 
			
			if (args.length > 1) {
				// grab the default that's been passed
				return TiConvert.toBoolean(args[1]);
			}			
		}
		
		// TODO: Explore again returning native undefined, rather than: 
		//  - null, org.mozilla.javascript.Undefined@44e89068 (proxy) or org.mozilla.javascript.Undefined (none of which allow '=== undefined' comparison) 
		//		KrollBridge kb = (KrollBridge)this.getTiContext().getJSContext();
		//		KrollContext kc = kb.getKrollContext();
		//		return KrollObject.fromNative(Undefined.instance, kb.getKrollContext());
		
		return null;
	}
	
	public Double getDouble(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			if (appProperties.hasProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return appProperties.getDouble(key, 0.0f);
			} 
			
			if (args.length > 1) {
				// grab the default that's been passed
				return TiConvert.toDouble(args[1]);
			}			
		}
		
		// Should throw something - as we always expect at least a key
		return null;
	}
	
	public Integer getInt(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			if (appProperties.hasProperty(key)) {
				// It has the property - so the default isn't needed really
				return appProperties.getInt(key, 0);
			} 
			
			// So the property doesn't exist
			
			if (args.length > 1) {
				// grab the default that's been passed
				return TiConvert.toInt(args[1]);
			}	
			
		} 
		
		return null;
	}	
	
	public Object getString(Object[] args) {
		
		if (null != args && args.length>0) {
			String key = TiConvert.toString(args[0]);
			
			if (appProperties.hasProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return appProperties.getString(key, "");
			} 
			
			if (args.length > 1) {
				// grab the default that's been passed
				return TiConvert.toString(args[1]);
			}			
		}
		
		return null;
	}	
	
	public Object getList(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			String[] values = new String[0];
			if (appProperties.hasListProperty(key)) {			
				//auto transform JSON data into objects 
				values = appProperties.getList(key, values);
			} else {
				if (args.length > 1) {
					// grab the default that's been passed
					Object t = args[1];
					values = TiConvert.toStringArray((Object[])args[1]);
				} else {
					return null;
				}
			}
			// Now we should process values - we want the default process to happen with both stored & default values
			
			Object list[] = new Object[values.length];
			for (int i = 0; i < values.length; i++) {
				String value = values[i];
				if (value.startsWith("{") && value.endsWith("}")) {
					try {
						list[i] = new KrollDict(new JSONObject(value));
					} catch (JSONException e) {
						Log.e(LCAT, "Error converting JSON string to KrollDict, property:" + key, e);
					}
				} else {
					list[i] = value;
				}
			}
			return list;
		}
		return null;
	}

	public boolean hasProperty(String key) {
		return appProperties.hasProperty(key);
	}

	public String[] listProperties() {
		return appProperties.listProperties();
	}

	public void removeProperty(String key) {
		appProperties.removeProperty(key);
	}

	public void setBool(String key, boolean value) {
		appProperties.setBool(key, value);
	}

	public void setDouble(String key, double value) {
		appProperties.setDouble(key, value);
	}

	public void setInt(String key, int value) {
		appProperties.setInt(key, value);
	}

	public void setList(String key, Object[] value) {
		
		Log.i(LCAT, "setList passed with ["+key+"] and a list of ["+value.length+"] items.");

		String[] valueList = new String[value.length];
		for (int i = 0; i < value.length; i++) {
			Object v = value[i];
			if (v instanceof KrollDict) {
				valueList[i] = TiConvert.toJSON((KrollDict)v).toString();
			} else if (v instanceof Object[]) {
				valueList[i] = TiConvert.toJSONArray((Object[])v).toString();
			} else {
				valueList[i] = v.toString();
			}
		}
		appProperties.setList(key, valueList);
	}

	public void setString(String key, String value) {
		appProperties.setString(key, value);
	}
	
	
}
