/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.kroll.KrollDict;

public class TiPropertyResolver
{
	private KrollDict[] propSets;

	public TiPropertyResolver(KrollDict... propSets)
	{
		int len = propSets.length;
		this.propSets = new KrollDict[len];
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

	public KrollDict findProperty(String key)
	{
		KrollDict result = null;

		for(KrollDict d : propSets) {
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

		for(KrollDict d : propSets) {
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
