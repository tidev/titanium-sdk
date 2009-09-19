package org.appcelerator.titanium.module.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumScrollableView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.widgets.TitaniumArrowView;
import org.appcelerator.titanium.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Message;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.Gallery;
import android.widget.RelativeLayout;
import android.widget.AdapterView.OnItemSelectedListener;

public class TitaniumScrollableView extends TitaniumBaseView
	implements ITitaniumScrollableView, OnItemSelectedListener
{
	private static final String LCAT = "TiScrollableView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final int PAGE_LEFT = 200;
	private static final int PAGE_RIGHT = 201;

	static final int MSG_SHOW_PAGER = 400;
	static final int MSG_HIDE_PAGER = 401;

	class LocalGallery extends Gallery
	{
		ArrayList<ITitaniumView> views;

		LocalGallery(Context context) {
			super(context, null, -1);

			setSpacing(0);
			setVerticalFadingEdgeEnabled(false);
			setUnselectedAlpha(0.85f);
			setGravity(Gravity.CENTER);
		}

		public void setViews(ArrayList<ITitaniumView> v)
		{
			this.views = v;

	        BaseAdapter adapter = new BaseAdapter() {

				public int getCount() {
					return views.size();
				}

				public Object getItem(int position) {
					return views.get(position);
				}

				public long getItemId(int position) {
					return position;
				}

				public View getView(int position, View convertView, ViewGroup parent) {
					ITitaniumView tv = views.get(position);
					tv.showing();
					View view = tv.getNativeView();
					view.setLayoutParams(new Gallery.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
					return view;
				}
	        };

	        setAdapter(adapter);
		}

		public ArrayList<ITitaniumView> getViews() {
			return views;
		}

		public boolean hasPrevious() {
			return getSelectedItemPosition() > 0;
		}

		public boolean hasNext() {
			return getSelectedItemPosition() < getAdapter().getCount() - 1;
		}

		public void movePrevious() {
			int pos = getSelectedItemPosition();
			if (pos > 0) {
				setSelection(pos - 1, true);
				if (pager.getVisibility() == View.VISIBLE) {
					setPagerTimeout();
				}
			}
		}

		public void moveNext() {
			int pos = getSelectedItemPosition();
			if (pos < getAdapter().getCount() - 1) {
				setSelection(pos + 1, true);
				if (pager.getVisibility() == View.VISIBLE) {
					setPagerTimeout();
				}
			}
		}

		public void setPagerTimeout() {
			handler.removeMessages(MSG_HIDE_PAGER);
			handler.sendEmptyMessageDelayed(MSG_HIDE_PAGER, 3000);
		}

		@Override
		public boolean onKeyDown(int keyCode, KeyEvent event) {
			boolean handled = false;
			switch (keyCode) {
				case KeyEvent.KEYCODE_DPAD_LEFT : {
					movePrevious();
					handled = true;
					break;
				}
				case KeyEvent.KEYCODE_DPAD_RIGHT : {
					moveNext();
					handled = true;
					break;
				}
				default :
					handled = super.onKeyDown(keyCode, event);
			}
			return handled;
		}

		@Override
		public boolean onTouchEvent(MotionEvent event)
		{
			if (pager.getVisibility() != View.VISIBLE) {
				handler.sendEmptyMessage(MSG_SHOW_PAGER);
			}
			setPagerTimeout();
			return super.onTouchEvent(event);
		}
	}

	protected LocalGallery gallery;
	protected RelativeLayout pager;
	protected boolean showPagingControl;
	protected String viewJSON;


	public TitaniumScrollableView(TitaniumModuleManager tmm)
	{
		super(tmm);
		showPagingControl = true;
		viewJSON = "[]";
	}

	@Override
	protected void processLocalOptions(JSONObject o) throws JSONException
	{
		if (o.has("views")) {
			this.viewJSON = o.getJSONArray("views").toString();
		}
		if (o.has("showPagingControl")) {
			this.showPagingControl = o.getBoolean("showPagingControl");
		}
	}

	@Override
	protected void doOpen() {
		Context context = getContext();
		setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));

		gallery = new LocalGallery(context);
		addView(gallery, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		gallery.setOnItemSelectedListener(this);

		pager = new RelativeLayout(context);

		TitaniumArrowView left = new TitaniumArrowView(context);
		left.setVisibility(View.INVISIBLE);
		left.setId(PAGE_LEFT);
		left.setMinimumWidth(100/2);
		left.setMinimumHeight(100);
		left.setOnClickListener(new OnClickListener(){

			public void onClick(View v) {
				gallery.movePrevious();

			}});
		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		pager.addView(left, params);

		TitaniumArrowView right = new TitaniumArrowView(context);
		right.setLeft(false);
		right.setVisibility(View.INVISIBLE);
		right.setId(PAGE_RIGHT);
		right.setMinimumWidth(100/2);
		right.setMinimumHeight(100);
		right.setOnClickListener(new OnClickListener(){

			public void onClick(View v) {
				gallery.moveNext();

			}});
		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		pager.addView(right, params);

		pager.setVisibility(View.GONE);

		addView(pager);

		setViews(viewJSON);
	}

	@Override
	protected View getContentView() {
		return null;
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		switch(msg.what) {
			case MSG_SHOW_PAGER :
				if (showPagingControl) {
					pager.setVisibility(View.VISIBLE);
					handled = true;
				}
				break;
			case MSG_HIDE_PAGER :
				pager.setVisibility(View.INVISIBLE);
				handled = true;
				break;
			default :
				handled = super.handleMessage(msg);
		}

		return handled;
	}

	public void setViews(String json)
	{
		if (DBG) {
			Log.d(LCAT, "Views JSON: " + json);
		}
		try {
			JSONArray a = new JSONArray(json);
			ArrayList<ITitaniumView> views = new ArrayList<ITitaniumView>();
			for (int i = 0; i < a.length(); i++) {
				ITitaniumView tv = tmm.getActivity().getViewByName(a.getString(i));
				if (tv != null) {
					views.add(tv);
				}
			}
			gallery.setViews(views);
		} catch (JSONException e) {
			Log.e(LCAT, "Error setting views: " + json, e);
		}
	}

	public void setShowPagingControl(boolean showPagingControl) {
		this.showPagingControl = showPagingControl;
	}

	public void scrollToView(int position) {
		if(position < gallery.getAdapter().getCount()) {
			gallery.setSelection(position, true);
		}
	}

	public ArrayList<ITitaniumView> getViews() {
		return gallery.getViews();
	}

	public void onItemSelected(AdapterView<?> parent, View view, int position, long id)
	{
		findViewById(PAGE_LEFT).setVisibility(gallery.hasPrevious() ? View.VISIBLE : View.INVISIBLE);
		findViewById(PAGE_RIGHT).setVisibility(gallery.hasNext() ? View.VISIBLE : View.INVISIBLE);
	}

	public void onNothingSelected(AdapterView<?> view)
	{
	}

}
