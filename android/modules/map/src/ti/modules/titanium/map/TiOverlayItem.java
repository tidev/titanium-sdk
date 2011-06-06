/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import org.appcelerator.titanium.proxy.TiViewProxy;

import com.google.android.maps.GeoPoint;
import com.google.android.maps.OverlayItem;

public class TiOverlayItem extends OverlayItem
{
	private String leftButtonPath;
	private String rightButtonPath;
	private TiViewProxy leftView;
	private TiViewProxy rightView;
	private AnnotationProxy proxy;

	public TiOverlayItem(GeoPoint location, String title, String snippet, AnnotationProxy proxy) {
		super(location,title,snippet);
		this.proxy = proxy;
	}

	public void setLeftButton(String path) {
		leftButtonPath = path;
	}

	public String getLeftButton() {
		return leftButtonPath;
	}

	public void setRightButton(String path) {
		rightButtonPath = path;
	}

	public String getRightButton() {
		return rightButtonPath;
	}

	public void setLeftView(TiViewProxy leftView) {
		this.leftView = leftView;
	}

	public TiViewProxy getLeftView()
	{
		return leftView;
	}

	public void setRightView(TiViewProxy rightView) {
		this.rightView = rightView;
	}

	public TiViewProxy getRightView()
	{
		return rightView;
	}

	public AnnotationProxy getProxy() {
		return proxy;
	}
	public boolean hasData() {
		return getTitle() != null || getSnippet() != null | leftButtonPath != null || rightButtonPath != null;
	}
}
