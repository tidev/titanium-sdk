/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.io.IOException;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Message;
import android.view.ViewGroup;

public abstract class TiBaseTableViewItem extends ViewGroup implements Handler.Callback
{
	private static final String LCAT = "TitaniamBaseTableViewItem";
	private static final boolean DBG = TiConfig.LOGD;
	
	private static final Bitmap childIndicatorBitmap = BitmapFactory.decodeStream(TiDict.class.getResourceAsStream("/org/appcelerator/titanium/res/drawable/btn_more.png"));
	private static final Bitmap checkIndicatorBitmap = BitmapFactory.decodeStream(TiDict.class.getResourceAsStream("/org/appcelerator/titanium/res/drawable/btn_check_buttonless_on.png"));
	
	protected Handler handler;
	protected TiContext tiContext;
	protected TiFileHelper tfh;
	protected String className;

	public TiBaseTableViewItem(TiContext tiContext)
	{
		super(tiContext.getActivity());
		this.tiContext = tiContext;
		this.handler = new Handler(this);
	}

	public abstract void setRowData(Item item);
	public abstract Item getRowData();
	
	public boolean handleMessage(Message msg)
	{
		return false;
	}

	public boolean providesOwnSelector() {
		return false;
	}

	public String getLastClickedViewName() {
		return null;
	}

	private BitmapDrawable createDrawable(Bitmap bitmap)
	{
		try {
			return new BitmapDrawable(bitmap);
		} catch (Throwable t) {
			try {
				Log.e(LCAT, t.getClass().getName() + ": " + t.getMessage(), t);
				return null;
			} catch(Exception e) {
				// ignore - logging failed
				return null;
			}
		} 
	}
	
	public BitmapDrawable createHasChildDrawable() {
		return createDrawable(childIndicatorBitmap);
	}
	
	public BitmapDrawable createHasCheckDrawable() {
		return createDrawable(checkIndicatorBitmap);
	}

	public Drawable loadDrawable(String url) {
		if (tfh == null) {
			tfh = new TiFileHelper(tiContext.getActivity());
		}
		return tfh.loadDrawable(url, false);
	}

	public String getClassName() {
		return className;
	}

	public void setClassName(String className) {
		this.className = className;
	}
	
	public void setBackgroundImageProperty(TiDict d, String property)
	{
		String path = TiConvert.toString(d, property);
		String url = tiContext.resolveUrl(null, path);
		TiBaseFile file = TiFileFactory.createTitaniumFile(tiContext, new String[] { url }, false);
		try {
			setBackgroundDrawable(new BitmapDrawable(TiUIHelper.createBitmap(file.getInputStream())));
		} catch (IOException e) {
			Log.e(LCAT, "Error creating background image from path: " + path.toString(), e);
		}
	}
	
	public void setBackgroundFromProperties(TiDict props)
	{
		if (props.containsKey("backgroundImage")) {
			setBackgroundImageProperty(props, "backgroundImage");
		} else if (props.containsKey("backgroundColor")) {
			Integer bgColor = TiConvert.toColor(props, "backgroundColor");
			setBackgroundColor(bgColor);
		}
		if (props.containsKey("opacity")) {
			TiUIHelper.setDrawableOpacity(getBackground(), TiConvert.toFloat(props, "opacity"));
		}
	}
}
