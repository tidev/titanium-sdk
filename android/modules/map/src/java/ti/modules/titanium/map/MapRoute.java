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
		private Point point;
		private Point point2;
		private Paint paint;
		
		public RouteOverlay(GeoPoint gp1, GeoPoint gp2, int color, int width) 
		{
			this.gp1 = gp1;
			this.gp2 = gp2;
			this.paint = new Paint();
			paint.setStrokeWidth(width);
			paint.setAlpha(255);
			paint.setColor(color);
			this.point = new Point();
			this.point2 = new Point();

		}
		
		@Override
		public void draw(Canvas canvas, MapView mapView, boolean shadow) 
		{
		    Projection projection = mapView.getProjection();
		    projection.toPixels(gp1, point);
		    projection.toPixels(gp2, point2);
		    canvas.drawLine(point.x, point.y, point2.x, point2.y, paint);
		    super.draw(canvas, mapView, shadow);
		}
		
	}
	
	public MapRoute(MapPoint[] points, int color, int width, String name)  
	{
		this.color = color;
		this.width = width;
		this.routes = new ArrayList<RouteOverlay>();
		this.name = name;
		
		generateRoutes(points);
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
	
	private void generateRoutes(MapPoint[] points) 
	{
		MapPoint mr1;
		MapPoint mr2;
		GeoPoint gp1;
		GeoPoint gp2;
		RouteOverlay o;
		for (int i = 0; i < points.length - 1; i++) {
			mr1 = points[i];
			mr2 = points[i+1];
			gp1 = new GeoPoint(scaleToGoogle(mr1.getLatitude()), scaleToGoogle(mr1.getLongitude()));
			gp2 = new GeoPoint(scaleToGoogle(mr2.getLatitude()), scaleToGoogle(mr2.getLongitude()));
			o = new RouteOverlay (gp1, gp2, getColor(), getWidth());
			routes.add(o);
		}
	}
	
	private int scaleToGoogle(double value)
	{
		return (int)(value * 1000000);
	}
	
}
