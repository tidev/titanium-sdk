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
	
	public final TiDict getStylesheet(String objectId, Collection<String> classes, String density, String basename)
	{
		Log.d(TAG, "getStylesheet id: "+objectId+", classes: "+classes+", density: " + density + ", basename: " + basename);
		TiDict result = new TiDict();
		if (classesMap != null && classesMap.containsKey(basename))
		{
			HashMap<String, TiDict> classMap = classesMap.get(basename);
			for (String clazz : classes) {
				TiDict classDict = classMap.get(clazz);
				if (classDict != null) {
					result.putAll(classDict);
				}
			}
		}
		if (classesDensityMap != null && classesDensityMap.containsKey(basename))
		{
			HashMap<String,TiDict> classDensityMap = classesDensityMap.get(basename).get(density);
			if (classDensityMap != null) {
				for (String clazz : classes) {
					TiDict classDensityDict = classDensityMap.get(clazz);
					if (classDensityDict != null) {
						result.putAll(classDensityDict);
					}
				}
			}
		}
		if (idsMap != null && objectId != null && idsMap.containsKey(objectId))
		{
			TiDict idDict = idsMap.get(basename).get(objectId);
			if (idDict != null) {
				result.putAll(idDict);
			}
		}
		if (idsDensityMap != null && objectId != null && idsDensityMap.containsKey(basename))
		{
			HashMap<String,TiDict> idDensityMap = idsDensityMap.get(basename).get(density);
			if (idDensityMap != null && idDensityMap.containsKey(objectId)) 
			{
				TiDict idDensityDict = idDensityMap.get(objectId);
				if (idDensityDict != null) {
					result.putAll(idDensityDict);
				}
			}
		}
		return result;
	}
}
