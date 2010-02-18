package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TiDict;

public class TiPropertyResolver
{
	private TiDict[] propSets;

	public TiPropertyResolver(TiDict... propSets)
	{
		int len = propSets.length;
		this.propSets = new TiDict[len];
		for (int i = 0; i < len; i++) {
			this.propSets[i] = propSets[i];
		}
	}

	public void release() {
		for (int i = 0; i < propSets.length; i++) {
			propSets[i] = null;
		}
		propSets = null;
	}

	public TiDict findProperty(String key)
	{
		TiDict result = null;

		for(TiDict d : propSets) {
			if (d != null) {
				if (d.containsKey(key)) {
					result = d;
					break;
				}
			}
		}

		return result;
	}

	public boolean hasAnyOf(String[] keys)
	{
		boolean found = false;

		for(TiDict d : propSets) {
			if (d != null) {
				for (String key : keys) {
					if (d.containsKey(key)) {
						found = true;
						break;
					}
				}
				if (found) {
					break;
				}
			}
		}

		return found;
	}
}
