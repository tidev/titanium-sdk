package org.appcelerator.titanium.config;

import org.appcelerator.titanium.util.TitaniumColorHelper;

import android.graphics.Color;
import android.util.Log;


public class TitaniumWindowInfo implements Comparable<TitaniumWindowInfo>
{
	private static final String LCAT = "TiWindowInfo";

	protected int appearanceOrder;

	protected String windowBackgroundColor;
	protected String windowBackgroundImage;
	protected int backgroundColor;
	protected String windowId;
	protected String windowOrientation;
	protected String windowTitle;
	protected String windowUrl;
	protected String windowType;
	protected String windowIconUrl;
	protected String windowSize;
	protected boolean windowIsFullscreen;

	TitaniumWindowInfo(int appearanceOrder) {
		this.appearanceOrder = appearanceOrder;

		// configure defaults
		backgroundColor = Color.YELLOW; // Something garish
		windowOrientation = "either";
		windowType = "single";
		windowIsFullscreen = false;
	}

	public String getWindowId() {
		return windowId;
	}

	public void setWindowId(String windowId) {
		this.windowId = windowId;
	}
	public String getWindowBackgroundColor() {
		return windowBackgroundColor;
	}

	public boolean hasBackgroundColor() {
		return windowBackgroundColor != null;
	}

	public int getBackgroundColor() {
		return backgroundColor;
	}

	public void setWindowBackgroundColor(String windowBackgroundColor) {
		int color = -1;
		try {
			color = TitaniumColorHelper.parseColor(windowBackgroundColor);
			this.windowBackgroundColor = windowBackgroundColor;
			backgroundColor = color;
		} catch (IllegalArgumentException e) {
			Log.w(LCAT, "Unable to decode color: " + windowBackgroundColor);
		}
	}

	public String getWindowBackgroundImage() {
		return windowBackgroundImage;
	}

	public void setWindowBackgroundImage(String windowBackgroundImage) {
		this.windowBackgroundImage = windowBackgroundImage;
	}

	public boolean hasWindowBackgroundImage() {
		return windowBackgroundImage != null;
	}

	public String getWindowOrientation() {
		return windowOrientation;
	}

	public void setWindowOrientation(String windowOrientation) {
		String orientation = windowOrientation.toLowerCase();
		if ("portrait".compareTo(orientation) == 0 ||
				"landscape".compareTo(orientation) == 0 ||
				"either".compareTo(orientation) == 0)
		{
			this.windowOrientation = windowOrientation;
		} else {
			Log.w(LCAT, "orientation must be one of 'portrait', 'landscape', or 'either' received: " + windowOrientation);
		}
	}

	public String getWindowTitle() {
		return windowTitle;
	}

	public void setWindowTitle(String windowTitle) {
		this.windowTitle = windowTitle;
	}

	public String getWindowUrl() {
		return windowUrl;
	}

	public void setWindowUrl(String windowUrl) {
		this.windowUrl = windowUrl;
	}

	public String getWindowType() {
		return windowType;
	}

	public void setWindowType(String windowType) {
		this.windowType = windowType;
	}

	public String getWindowIconUrl() {
		return windowIconUrl;
	}

	public void setWindowIconUrl(String windowIconUrl) {
		this.windowIconUrl = windowIconUrl;
	}

	public String getWindowSize() {
		return windowSize;
	}

	public void setWindowSize(String windowSize) {
		this.windowSize = windowSize;
	}

	public int getAppearanceOrder() {
		if (appearanceOrder < 0) {
			throw new IllegalStateException("appearanceOrder not set.");
		}
		return appearanceOrder;
	}

	public void setAppearanceOrder(int appearanceOrder) {
		this.appearanceOrder = appearanceOrder;
	}

	public boolean isWindowFullscreen() {
		return windowIsFullscreen;
	}

	public void setWindowFullscreen(boolean windowIsFullscreen) {
		this.windowIsFullscreen = windowIsFullscreen;
	}

	public int compareTo(TitaniumWindowInfo o) {
		int v1 = appearanceOrder;
		int v2 = o.appearanceOrder;

		int result = 0;
		if (v1 < v2) {
			result = -1;
		} else if (v1 > v2) {
			result = 1;
		}
		return result;
	}

}
