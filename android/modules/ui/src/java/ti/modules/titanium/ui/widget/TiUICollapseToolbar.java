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

import androidx.appcompat.widget.Toolbar;
import androidx.coordinatorlayout.widget.CoordinatorLayout;

import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.appbar.CollapsingToolbarLayout;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

public class TiUICollapseToolbar extends TiUIView
{
	private static final String TAG = "TiUICollapseToolbar";
	TiCompositeLayout content = null;
	AppBarLayout appBarLayout;
	CollapsingToolbarLayout collapseToolbarLayout;
	int contentScrimColor = -1;
	int barColor = -1;
	int scrollFlags = -1;
	ImageView imageView = null;
	Toolbar toolbar = null;
	KrollFunction homeIconFunction = null;
	boolean homeAsUp = false;
	TiViewProxy localContentView = null;

	public TiUICollapseToolbar(TiViewProxy proxy)
	{
		super(proxy);
		this.proxy = proxy;

		try {
			int id_collapse_toolbar = TiRHelper.getResource("layout.titanium_ui_collapse_toolbar");
			int id_imageView = TiRHelper.getResource("id.collapseImageView");
			int id_content = TiRHelper.getResource("id.collapseContent");
			int id_appbar = TiRHelper.getResource("id.appBarLayout");
			int id_toolbarLayout = TiRHelper.getResource("id.collapseToolbarLayout");
			int id_toolbar = TiRHelper.getResource("id.toolbar");
			LayoutInflater inflater = LayoutInflater.from(TiApplication.getAppCurrentActivity());
			CoordinatorLayout layout = (CoordinatorLayout) inflater.inflate(id_collapse_toolbar, null);
			imageView = layout.findViewById(id_imageView);
			appBarLayout = layout.findViewById(id_appbar);
			toolbar = appBarLayout.findViewById(id_toolbar);
			collapseToolbarLayout = appBarLayout.findViewById(id_toolbarLayout);

			content = layout.findViewById(id_content);
			if (barColor != -1) {
				setBarColor(barColor);
			}
			if (contentScrimColor != -1) {
				setContentScrimColor(contentScrimColor);
			}
			if (scrollFlags != -1) {
				setFlags(scrollFlags);
			}
			if (homeAsUp) {
				setDisplayHomeAsUp(homeAsUp);
			}
			if (localContentView != null) {
				setContentView(localContentView);
			}
			setNativeView(layout);
		} catch (Exception e) {
			Log.i(TAG, "Layout error: " + e.getMessage());
		}
	}

	public void setContentView(TiViewProxy viewProxy)
	{
		localContentView = viewProxy;
		if (viewProxy == null || content == null) {
			return;
		}
		viewProxy.setActivity(proxy.getActivity());
		TiUIView contentView = viewProxy.getOrCreateView();
		View view = contentView.getOuterView();
		ViewParent viewParent = view.getParent();
		if (viewParent != null && viewParent != content && viewParent instanceof ViewGroup) {
			((ViewGroup) viewParent).removeView(view);

			contentView.getLayoutParams().autoFillsHeight = true;
			contentView.getLayoutParams().autoFillsWidth = true;
		}
		content.addView(view, contentView.getLayoutParams());
	}

	public void setBarColor(int color)
	{
		barColor = color;
		if (collapseToolbarLayout != null) collapseToolbarLayout.setBackgroundColor(color);
	}

	public void setContentScrimColor(int color)
	{
		contentScrimColor = color;
		if (collapseToolbarLayout != null) {
			collapseToolbarLayout.setContentScrimColor(color);
		}
	}

	public void setonHomeIconItemSelected(KrollFunction value)
	{
		homeIconFunction = value;
	}

	public void setTitle(String title)
	{
		if (collapseToolbarLayout != null) collapseToolbarLayout.setTitle(title);
	}

	public void setDisplayHomeAsUp(boolean value)
	{
		if (collapseToolbarLayout != null && toolbar != null && value) {
			toolbar.setNavigationIcon(R.drawable.ic_action_back);
			toolbar.setNavigationOnClickListener(v -> {
				if (homeIconFunction != null) {
					homeIconFunction.callAsync(proxy.getKrollObject(), new Object[] {});
				}
			});
		}
		homeAsUp = value;
	}

	public void setImage(Bitmap bitmap)
	{
		if (bitmap == null) {
			Log.e(TAG, "Bitmap empty");
			return;
		}
		imageView.setImageBitmap(bitmap);
		imageView.setVisibility(View.VISIBLE);
	}

	private void setContainerHeight(int height)
	{
		ViewGroup.LayoutParams layout = collapseToolbarLayout.getLayoutParams();
		TiDimension nativeSize = TiConvert.toTiDimension(TiConvert.toString(height), TiDimension.TYPE_HEIGHT);
		layout.height = nativeSize.getAsPixels(collapseToolbarLayout);
		collapseToolbarLayout.setLayoutParams(layout);
	}

	public void setFlags(int value)
	{
		if (collapseToolbarLayout != null) {
			AppBarLayout.LayoutParams params =
				(AppBarLayout.LayoutParams) collapseToolbarLayout.getLayoutParams();
			params.setScrollFlags(value);
		}
		scrollFlags = value;
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
		if (d.containsKey(TiC.PROPERTY_CONTENT_VIEW)) {
			setContentView((TiViewProxy) d.get(TiC.PROPERTY_CONTENT_VIEW));
		}
		if (d.containsKey("contentScrimColor")) {
			setContentScrimColor(TiConvert.toColor(
				d.getString("contentScrimColor"), TiApplication.getAppCurrentActivity()));
		}
	}
}
