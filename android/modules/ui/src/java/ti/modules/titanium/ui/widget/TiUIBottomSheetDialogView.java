/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.res.Configuration;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.AppCompatTextView;
import androidx.appcompat.widget.LinearLayoutCompat;

import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.bottomsheet.BottomSheetDialog;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIBottomSheetDialogView extends TiUIView
{
	private static final String TAG = "TiUIBottomSheetView";
	int id_drawer_layout = 0;
	int id_bottomSheet = 0;
	LinearLayoutCompat layout;
	AppCompatActivity appCompatActivity;
	BottomSheetBehavior<RelativeLayout> bottomSheetBehavior;
	LinearLayoutCompat bsLayout;
	int peakHeight = 32;
	BottomSheetDialog dialog;
	float density = TiApplication.getInstance().getResources().getDisplayMetrics().density;
	int cancelable = -1;

	public TiUIBottomSheetDialogView(TiViewProxy proxy)
	{
		super(proxy);
		appCompatActivity = (AppCompatActivity) proxy.getActivity();
		if (this.nativeView == null) {
			processProperties(getProxy().getProperties());
		}
	}

	@Override
	public void add(TiUIView child)
	{
		View view = getNativeView(child.getProxy());
		Object width = child.getProxy().getProperty(TiC.PROPERTY_WIDTH);
		Object height = child.getProxy().getProperty(TiC.PROPERTY_HEIGHT);

		int w = RelativeLayout.LayoutParams.MATCH_PARENT;
		if (width.equals(TiC.LAYOUT_SIZE)) {
			w = RelativeLayout.LayoutParams.WRAP_CONTENT;
		} else if (width.equals(TiC.LAYOUT_FILL)) {
			w = RelativeLayout.LayoutParams.MATCH_PARENT;
		} else {
			w = (int) TiConvert.toTiDimension(TiConvert.toString(width), TiDimension.TYPE_WIDTH).getAsPixels(view);
		}

		int h = RelativeLayout.LayoutParams.MATCH_PARENT;
		if (height.equals(TiC.LAYOUT_SIZE)) {
			h = RelativeLayout.LayoutParams.WRAP_CONTENT;
		} else if (height.equals(TiC.LAYOUT_FILL)) {
			h = RelativeLayout.LayoutParams.MATCH_PARENT;
		} else {
			h = (int) TiConvert.toTiDimension(TiConvert.toString(height), TiDimension.TYPE_HEIGHT).getAsPixels(view);
		}

		RelativeLayout.LayoutParams rlp = new RelativeLayout.LayoutParams(w, h);
		bsLayout.addView(view, rlp);
	}

	private View getNativeView(TiViewProxy viewProxy)
	{
		TiUIView view = viewProxy.getOrCreateView();
		View outerView = view.getOuterView();
		View nativeView = outerView != null ? outerView : view.getNativeView();
		ViewGroup parentViewGroup = (ViewGroup) nativeView.getParent();
		if (parentViewGroup != null) {
			parentViewGroup.removeAllViews();
		}
		return nativeView;
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		try {
			id_drawer_layout = TiRHelper.getResource("layout.titanium_ui_bottomsheet_dialog");
			id_bottomSheet = TiRHelper.getResource("id.bottomSheet");
		} catch (TiRHelper.ResourceNotFoundException e) {
			//
		}
		LayoutInflater inflater = LayoutInflater.from(proxy.getActivity());
		layout = (LinearLayoutCompat) inflater.inflate(id_drawer_layout, null);
		bsLayout = layout.findViewById(id_bottomSheet);

		if (d.containsKeyAndNotNull(TiC.PROPERTY_TITLE)) {
			AppCompatTextView tf = new AppCompatTextView(proxy.getActivity());
			tf.setId(View.generateViewId());
			LinearLayoutCompat.LayoutParams lp = new LinearLayoutCompat.LayoutParams(
				LinearLayoutCompat.LayoutParams.MATCH_PARENT,	LinearLayoutCompat.LayoutParams.WRAP_CONTENT);
			tf.setLayoutParams(lp);
			tf.setText(d.getString(TiC.PROPERTY_TITLE));
			Configuration config = TiApplication.getInstance().getResources().getConfiguration();
			tf.setTextColor(Color.WHITE);
			if ((config.uiMode & Configuration.UI_MODE_NIGHT_YES) != 0) {
				//
			} else {
				tf.setTextColor(Color.BLACK);
			}
			int paddingValue = (int) (15 * density);
			tf.setPadding(paddingValue, paddingValue, paddingValue, paddingValue);
			tf.setTextSize(20);
			bsLayout.addView(tf);
		}

		if (d.containsKeyAndNotNull(TiC.PROPERTY_OPTIONS)) {

			String[] options = d.getStringArray(TiC.PROPERTY_OPTIONS);

			for (int i = 0, len = options.length; i < len; i++) {
				AppCompatTextView tf = new AppCompatTextView(proxy.getActivity());
				tf.setId(View.generateViewId());
				LinearLayoutCompat.LayoutParams lp = new LinearLayoutCompat.LayoutParams(
					LinearLayoutCompat.LayoutParams.MATCH_PARENT,	LinearLayoutCompat.LayoutParams.WRAP_CONTENT);
				tf.setLayoutParams(lp);
				tf.setText(options[i]);
				int paddingValue = (int) (15 * density);
				tf.setPadding(paddingValue, paddingValue, paddingValue, paddingValue);
				tf.setTextSize(20);
				bsLayout.addView(tf);

				int finalI = i;
				tf.setOnClickListener(new View.OnClickListener()
				{
					@Override
					public void onClick(View v)
					{
						KrollDict event = new KrollDict();
						event.put("index", finalI);
						event.put("cancel", cancelable == finalI);
						fireEvent("click", event);
					}
				});
			}
		} else if (d.containsKeyAndNotNull(TiC.PROPERTY_ANDROID_VIEW)) {
			TiViewProxy tv = (TiViewProxy) d.get(TiC.PROPERTY_ANDROID_VIEW);
			add(tv.getOrCreateView());
		}

		dialog = new BottomSheetDialog(TiApplication.getAppCurrentActivity());
		dialog.setContentView(layout);

	}

	public void show()
	{
		dialog.show();
	}
}
