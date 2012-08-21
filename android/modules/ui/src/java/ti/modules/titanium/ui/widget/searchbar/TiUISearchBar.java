/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.searchbar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.widget.TiUIText;
import android.view.Gravity;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup.LayoutParams;
import android.widget.ImageButton;
import android.widget.RelativeLayout;

public class TiUISearchBar extends TiUIText
{
	protected ImageButton cancelBtn;
	
	public interface OnSearchChangeListener {
		public void filterBy(String text);
	}
	
	protected OnSearchChangeListener searchChangeListener;
	
	public TiUISearchBar(final TiViewProxy proxy)
	{
		super(proxy, true);

		// TODO Add Filter support

		// Steal the Text's nativeView. We're going to replace it with our layout.
		cancelBtn = new ImageButton(proxy.getActivity());
		cancelBtn.isFocusable();
		cancelBtn.setId(101);
		cancelBtn.setImageResource(android.R.drawable.ic_input_delete);
		// set some minimum dimensions for the cancel button, in a density-independent way.
		final float scale = cancelBtn.getContext().getResources().getDisplayMetrics().density;
		cancelBtn.setMinimumWidth((int) (48 * scale));
		cancelBtn.setMinimumHeight((int) (20 * scale));
		cancelBtn.setOnClickListener(new OnClickListener()
		{
			public void onClick(View view)
			{
				/* TODO try {
					proxy.set(getProxy().getTiContext().getScope(), "value", "");
				} catch (NoSuchFieldException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}*/
				proxy.fireEvent("cancel", null);
			}
		});

		RelativeLayout layout = new RelativeLayout(proxy.getActivity())
		{
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		};

		layout.setGravity(Gravity.NO_GRAVITY);
		layout.setPadding(0,0,0,0);

		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		params.addRule(RelativeLayout.LEFT_OF, 101);
//		params.setMargins(4, 4, 4, 4);
		layout.addView(tv, params);

		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
//		params.setMargins(0, 4, 4, 4);
		layout.addView(cancelBtn, params);

		setNativeView(layout);
	}
	
	@Override
	public void onTextChanged(CharSequence s, int start, int before, int count) {
		if (this.searchChangeListener != null) {
			this.searchChangeListener.filterBy(s.toString());
		}
		super.onTextChanged(s, start, before, count);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		if (d.containsKey("showCancel")) {
			boolean showCancel = TiConvert.toBoolean(d, "showCancel");
			cancelBtn.setVisibility(showCancel ? View.VISIBLE : View.GONE);
		} else if (d.containsKey("barColor")) {
			nativeView.setBackgroundColor(TiConvert.toColor(d, "barColor"));
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals("showCancel")) {
			boolean showCancel = TiConvert.toBoolean(newValue);
			cancelBtn.setVisibility(showCancel ? View.VISIBLE : View.GONE);
		} else if (key.equals("barColor")) {
			nativeView.setBackgroundColor(TiConvert.toColor(TiConvert.toString(newValue)));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}
	
	public void setOnSearchChangeListener(OnSearchChangeListener listener) {
		this.searchChangeListener = listener;
	}
}
