/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

/**
 * Simple object representing a point on the map.
 */
public class MapPoint {

	private double latitude;
	private double longitude;
	
	public MapPoint(double latitude, double longitude) 
	{
		this.latitude = latitude;
		this.longitude = longitude;
	}
	
	public double getLatitude() 
	{
		return latitude;
	}
	
	public double getLongitude() 
	{
		return longitude;
	}
}
