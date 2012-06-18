/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import java.util.ArrayList;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Point;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapView;
import com.google.android.maps.Overlay;
import com.google.android.maps.Projection;

/**
 * Simple object defining a map route. 
 */
public class MapRoute {

	private MapPoint[] points;
	private ArrayList<RouteOverlay> routes;
	private int color;
	private int width;
	private String name;
	
	/**
	 *  Android overlay that draw routes on the map view.
	 */
	public class RouteOverlay extends Overlay {
		private GeoPoint gp1;
		private GeoPoint gp2;
		private int color;
		private int width;
		
		public RouteOverlay(GeoPoint gp1, GeoPoint gp2, int color, int width) 
		{
			this.gp1 = gp1;
			this.gp2 = gp2;
			this.color = color;
			this.width = width;
		}
		
		@Override
		public void draw(Canvas canvas, MapView mapView, boolean shadow) 
		{
		    Projection projection = mapView.getProjection();
		    Paint paint = new Paint();
		    Point point = new Point();
		    projection.toPixels(gp1, point);
		    paint.setColor(color);
		    Point point2 = new Point();
		    projection.toPixels(gp2, point2);
		    paint.setStrokeWidth(width);
		    paint.setAlpha(255);
		    canvas.drawLine(point.x, point.y, point2.x, point2.y, paint);
		    super.draw(canvas, mapView, shadow);
		}
	}
	
	public MapRoute(MapPoint[] points, int color, int width, String name)  
	{
		this.color = color;
		this.width = width;
		this.points = points;
		this.routes = new ArrayList<RouteOverlay>();
		this.name = name;
		
		generateRoutes();
	}
	
	public MapPoint[] getPoints() 
	{
		return points;
	}
	
	public ArrayList<RouteOverlay> getRoutes() 
	{
		return routes;
	}
	
	public String getName() 
	{
		return name;
	}
	
	public int getColor()
	{
		return color;
	}
	
	public int getWidth()
	{
		return width;
	}
	
	private void generateRoutes() 
	{
		
		for (int i = 0; i < points.length - 1; i++) {
			MapPoint mr1 = points[i];
			MapPoint mr2 = points[i+1];
			GeoPoint gp1 = new GeoPoint(scaleToGoogle(mr1.getLatitude()), scaleToGoogle(mr1.getLongitude()));
			GeoPoint gp2 = new GeoPoint(scaleToGoogle(mr2.getLatitude()), scaleToGoogle(mr2.getLongitude()));
			RouteOverlay o = new RouteOverlay (gp1, gp2, getColor(), getWidth());
			routes.add(o);
		}
	}
	
	private int scaleToGoogle(double value)
	{
		return (int)(value * 1000000);
	}
	
}
