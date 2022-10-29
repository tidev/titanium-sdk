/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.graphics.Bitmap;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.ImageView;

import androidx.coordinatorlayout.widget.CoordinatorLayout;

import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.appbar.CollapsingToolbarLayout;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

public class TiUICollapseToolbar extends TiUIView
{
	private static final String TAG = "TiUICollapseToolbar";
	//ImageView imageView;
	TiCompositeLayout content;
	AppBarLayout appBarLayout;
	CollapsingToolbarLayout collapseToolbarLayout;
	int barColor = -1;
	ImageView img = null;

	public TiUICollapseToolbar(TiViewProxy proxy)
	{
		super(proxy);
		this.proxy = proxy;

		try {
			int id_collapse_toolbar = TiRHelper.getResource("layout.titanium_ui_collapse_toolbar");
			//int id_imageView = TiRHelper.getResource("id.collapseImageView");
			int id_content = TiRHelper.getResource("id.collapseContent");
			int id_appbar = TiRHelper.getResource("id.appBarLayout");
			int id_toolbar = TiRHelper.getResource("id.collapseToolbarLayout");
			LayoutInflater inflater = LayoutInflater.from(TiApplication.getAppCurrentActivity());
			CoordinatorLayout layout = (CoordinatorLayout) inflater.inflate(id_collapse_toolbar, null);
			//imageView = layout.findViewById(id_imageView);
			appBarLayout = layout.findViewById(id_appbar);
			collapseToolbarLayout = appBarLayout.findViewById(id_toolbar);

			content = layout.findViewById(id_content);
			if (barColor != -1) {
				collapseToolbarLayout.setBackgroundColor(barColor);
			}
			setNativeView(layout);
		} catch (Exception e) {
			Log.i(TAG, "Layout error: " + e.getMessage());
		}
	}

	public void setContentView(TiViewProxy viewProxy)
	{
		if (viewProxy == null) {
			return;
		}
		viewProxy.setActivity(proxy.getActivity());
		TiUIView contentView = viewProxy.getOrCreateView();
		View view = contentView.getOuterView();
		ViewParent viewParent = view.getParent();
		if (viewParent != null && viewParent != content && viewParent instanceof ViewGroup) {
			((ViewGroup) viewParent).removeView(view);
		}
		content.addView(view, contentView.getLayoutParams());
	}

	public void setBarColor(int color)
	{
		barColor = color;
		if (collapseToolbarLayout != null) collapseToolbarLayout.setBackgroundColor(color);
	}

	public void setTitle(String title)
	{
		if (collapseToolbarLayout != null) collapseToolbarLayout.setTitle(title);
	}

	public void setImage(Bitmap bitmap)
	{
		if (bitmap == null) {
			Log.e(TAG, "Bitmap empty");
			return;
		}

		if (img == null) {
			img = new ImageView(TiApplication.getAppCurrentActivity());
			//ViewGroup.LayoutParams layout = img.getLayoutParams();
			//layout.height = collapseToolbarLayout.getHeight();
			//CollapsingToolbarLayout.LayoutParams newParams = (CollapsingToolbarLayout.LayoutParams) layout;
			//newParams.setCollapseMode(CollapsingToolbarLayout.LayoutParams.COLLAPSE_MODE_PARALLAX);
			//img.setLayoutParams(layout);
			collapseToolbarLayout.addView(img, 0);
		}
		img.setImageBitmap(bitmap);
		img.setScaleType(ImageView.ScaleType.CENTER_CROP);
	}

	private void setContainerHeight(int height)
	{
		ViewGroup.LayoutParams layout = collapseToolbarLayout.getLayoutParams();
		TiDimension nativeSize = TiConvert.toTiDimension(TiConvert.toString(height), TiDimension.TYPE_HEIGHT);
		layout.height = nativeSize.getAsPixels(collapseToolbarLayout);
		collapseToolbarLayout.setLayoutParams(layout);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		if (d.containsKey("barColor")) {
			setBarColor(TiConvert.toColor(d.getString("barColor")));
		}
		if (d.containsKey(TiC.PROPERTY_IMAGE)) {
			Bitmap bmp = TiDrawableReference.fromObject(TiApplication.getAppCurrentActivity(),
				d.get(TiC.PROPERTY_IMAGE)).getBitmap(false);
			setImage(bmp);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			setTitle(d.getString(TiC.PROPERTY_TITLE));
		}
		if (d.containsKey(TiC.PROPERTY_HEIGHT)) {
			setContainerHeight(d.getInt(TiC.PROPERTY_HEIGHT));
		}
	}
}
