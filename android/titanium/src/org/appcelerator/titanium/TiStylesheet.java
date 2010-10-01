package org.appcelerator.titanium;

import java.util.Collection;
import java.util.HashMap;

import org.appcelerator.titanium.util.Log;

public abstract class TiStylesheet {
	private static final String TAG = "TiStylesheet";
	
	protected final HashMap<String,HashMap<String,TiDict>> classesMap;
	protected final HashMap<String,HashMap<String,TiDict>> idsMap;
	protected final HashMap<String,HashMap<String,HashMap<String,TiDict>>> classesDensityMap;
	protected final HashMap<String,HashMap<String,HashMap<String,TiDict>>> idsDensityMap;
	
	// The concrete implementation fills these
	public TiStylesheet() {
		classesMap = new HashMap<String,HashMap<String,TiDict>>();
		idsMap = new HashMap<String,HashMap<String,TiDict>>();
		classesDensityMap = new HashMap<String, HashMap<String,HashMap<String,TiDict>>>();
		idsDensityMap = new HashMap<String, HashMap<String,HashMap<String,TiDict>>>();
	}

	protected void addAll(TiDict result, HashMap<String, TiDict> map, String key) {
		if (map != null) {
			TiDict d = map.get(key);
			if (d != null) {
				result.putAll(d);
			}
		}
	}
	
	public final TiDict getStylesheet(String objectId, Collection<String> classes, String density, String basename)
	{
		Log.d(TAG, "getStylesheet id: "+objectId+", classes: "+classes+", density: " + density + ", basename: " + basename);
		TiDict result = new TiDict();
		if (classesMap != null)
		{
			HashMap<String, TiDict> classMap = classesMap.get(basename);
			HashMap<String, TiDict> globalMap = classesMap.get("global");
			if (globalMap != null || classMap != null) {
				for (String clazz : classes) {
					addAll(result, globalMap, clazz);
					addAll(result, classMap, clazz);
				}
			}
		}
		if (classesDensityMap != null)
		{
			HashMap<String,TiDict> globalDensityMap = null;
			if (classesDensityMap.containsKey("global")) {
				globalDensityMap = classesDensityMap.get("global").get(density);
			}

			HashMap<String, TiDict> classDensityMap = null;
			if (classesDensityMap.containsKey(basename)) {
				classDensityMap = classesDensityMap.get(basename).get(density);
			}

			if (globalDensityMap != null || classDensityMap != null) {
				for (String clazz : classes) {
					addAll(result, globalDensityMap, clazz);
					addAll(result, classDensityMap, clazz);
				}
			}
		}
		if (idsMap != null && objectId != null)
		{
			addAll(result, idsMap.get("global"), objectId);
			addAll(result, idsMap.get(basename), objectId);
		}
		if (idsDensityMap != null && objectId != null)
		{
			HashMap<String,TiDict> globalDensityMap = null;
			if (idsDensityMap.containsKey("global")) {
				globalDensityMap = idsDensityMap.get("global").get(density);
			}
			HashMap<String,TiDict> idDensityMap = null;
			if (idsDensityMap.containsKey(basename)) {
				idDensityMap = idsDensityMap.get(basename).get(density);
			}
			addAll(result, globalDensityMap, objectId);
			addAll(result, idDensityMap, objectId);
		}
		return result;
	}
}
