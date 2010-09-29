package org.appcelerator.titanium;

import java.util.Collection;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.util.Log;

public abstract class TiStylesheet {
	private static final String TAG = "TiStylesheet";
	
	protected final HashMap<String,HashMap<String,KrollDict>> classesMap;
	protected final HashMap<String,HashMap<String,KrollDict>> idsMap;
	protected final HashMap<String,HashMap<String,HashMap<String,KrollDict>>> classesDensityMap;
	protected final HashMap<String,HashMap<String,HashMap<String,KrollDict>>> idsDensityMap;
	
	// The concrete implementation fills these
	public TiStylesheet() {
		classesMap = new HashMap<String,HashMap<String,KrollDict>>();
		idsMap = new HashMap<String,HashMap<String,KrollDict>>();
		classesDensityMap = new HashMap<String, HashMap<String,HashMap<String,KrollDict>>>();
		idsDensityMap = new HashMap<String, HashMap<String,HashMap<String,KrollDict>>>();
	}
	
	public final KrollDict getStylesheet(String objectId, Collection<String> classes, String density, String basename)
	{
		Log.d(TAG, "getStylesheet id: "+objectId+", classes: "+classes+", density: " + density + ", basename: " + basename);
		KrollDict result = new KrollDict();
		if (classesMap != null && classesMap.containsKey(basename))
		{
			HashMap<String, KrollDict> classMap = classesMap.get(basename);
			for (String clazz : classes) {
				KrollDict classDict = classMap.get(clazz);
				if (classDict != null) {
					result.putAll(classDict);
				}
			}
		}
		if (classesDensityMap != null && classesDensityMap.containsKey(basename))
		{
			HashMap<String,KrollDict> classDensityMap = classesDensityMap.get(basename).get(density);
			if (classDensityMap != null) {
				for (String clazz : classes) {
					KrollDict classDensityDict = classDensityMap.get(clazz);
					if (classDensityDict != null) {
						result.putAll(classDensityDict);
					}
				}
			}
		}
		if (idsMap != null && objectId != null && idsMap.containsKey(objectId))
		{
			KrollDict idDict = idsMap.get(basename).get(objectId);
			if (idDict != null) {
				result.putAll(idDict);
			}
		}
		if (idsDensityMap != null && objectId != null && idsDensityMap.containsKey(basename))
		{
			HashMap<String,KrollDict> idDensityMap = idsDensityMap.get(basename).get(density);
			if (idDensityMap != null && idDensityMap.containsKey(objectId)) 
			{
				KrollDict idDensityDict = idDensityMap.get(objectId);
				if (idDensityDict != null) {
					result.putAll(idDensityDict);
				}
			}
		}
		return result;
	}
}
