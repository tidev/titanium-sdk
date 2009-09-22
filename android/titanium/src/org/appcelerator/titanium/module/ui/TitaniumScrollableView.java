package org.appcelerator.titanium.module.ui;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumScrollableView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.ui.widgets.TitaniumArrowView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumAnimationFactory;
import org.appcelerator.titanium.util.TitaniumAnimationPair;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.graphics.Color;
import android.os.Message;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.Animation.AnimationListener;
import android.widget.AdapterView;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;
import android.widget.ViewAnimator;

public class TitaniumScrollableView extends TitaniumBaseView
	implements ITitaniumScrollableView, AnimationListener
{
	private static final String LCAT = "TiScrollableView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String EVENT_SCROLL = "scroll";

	private static final int ANIM_DURATION = 500;

	private static final int PAGE_LEFT = 200;
	private static final int PAGE_RIGHT = 201;

	static final int MSG_SHOW_PAGER = 400;
	static final int MSG_HIDE_PAGER = 401;

	ArrayList<ITitaniumView> views;

	protected ViewAnimator gallery;
	protected TitaniumAnimationPair animPrev;
	protected TitaniumAnimationPair animNext;
	protected AtomicBoolean inAnimation;

	protected RelativeLayout pager;
	protected View glass;
	protected boolean showPagingControl;
	protected String viewJSON;
	final protected TitaniumScrollableView me;

	public TitaniumScrollableView(TitaniumModuleManager tmm)
	{
		super(tmm);
		me = this;
		showPagingControl = true;
		viewJSON = "[]";
		inAnimation = new AtomicBoolean(false);

		eventManager.supportEvent(EVENT_SCROLL);
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

		openViewAfterOptions = true;
		openViewDelay = 0;
	}

	@Override
	protected void doOpen()
	{
		Context context = getContext();
		setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		setFocusable(true);
		setFocusableInTouchMode(true);
		setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);

		animPrev = TitaniumAnimationFactory.getAnimationFor("slide-from-left", ANIM_DURATION);
		animPrev.setAnimationListener(this);

		animNext = TitaniumAnimationFactory.getAnimationFor("slide-from-right", ANIM_DURATION);
		animNext.setAnimationListener(this);

		gallery = new ViewAnimator(context);
		gallery.setFocusable(false);
		gallery.setFocusableInTouchMode(false);
		gallery.setClickable(false);

		addView(gallery, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		//gallery.setOnItemSelectedListener(this);

		pager = new RelativeLayout(context);
		pager.setFocusable(false);
		pager.setFocusableInTouchMode(false);

		TitaniumArrowView left = new TitaniumArrowView(context);
		left.setVisibility(View.INVISIBLE);
		left.setId(PAGE_LEFT);
		left.setMinimumWidth(80);
		left.setMinimumHeight(80);
		left.setOnClickListener(new OnClickListener(){

			public void onClick(View v) {
				movePrevious();

			}});
		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		pager.addView(left, params);

		TitaniumArrowView right = new TitaniumArrowView(context);
		right.setLeft(false);
		right.setVisibility(View.INVISIBLE);
		right.setId(PAGE_RIGHT);
		right.setMinimumWidth(80);
		right.setMinimumHeight(80);
		right.setOnClickListener(new OnClickListener(){

			public void onClick(View v) {
				moveNext();
			}});
		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		pager.addView(right, params);

		pager.setVisibility(View.GONE);

		addView(pager, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));

		glass = new View(getContext()) {

			@Override
			public boolean onTouchEvent(MotionEvent event) {
				boolean handled = false;

				if (event.getAction() == MotionEvent.ACTION_DOWN && showPagingControl) {
					if (pager.getVisibility() != View.VISIBLE) {
						gallery.onTouchEvent(event);
					}
				}

				if (!handled) {
					handled = super.onTouchEvent(event);
				}
				return handled;
			}

			@Override
			public boolean onTrackballEvent(MotionEvent event) {
				Log.w(LCAT, "TRACKBALL");
				return super.onTrackballEvent(event);
			}


		};
		glass.setBackgroundColor(Color.argb(100, 0, 0, 255));
		glass.setFocusable(false);
		glass.setFocusableInTouchMode(false);

		//addView(glass);

		setViews(viewJSON);
	}

	public int getSelectedItemPosition() {
		return gallery.getDisplayedChild();
	}

	public boolean hasPrevious() {
		return getSelectedItemPosition() > 0;
	}

	public boolean hasNext() {
		return getSelectedItemPosition() < gallery.getChildCount() - 1;
	}

	public void movePrevious() {
		if (inAnimation.get()) return;

		int pos = getSelectedItemPosition();
		if (pos > 0) {
			int from = pos;
			int to = pos - 1;
			views.get(from).hiding();
			animPrev.apply(gallery);
			gallery.setDisplayedChild(to);
			views.get(to).showing();
			onScrolled(from, to);
			if (pager.getVisibility() == View.VISIBLE) {
				setPagerTimeout();
			}
		}
	}

	public void moveNext() {
		if (inAnimation.get()) return;

		int pos = getSelectedItemPosition();
		if (pos < gallery.getChildCount() - 1) {
			int from = pos;
			int to = pos + 1;
			views.get(from).hiding();
			animNext.apply(gallery);
			gallery.setDisplayedChild(to);
			views.get(to).showing();
			onScrolled(from, to);
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
	protected View getContentView() {
		return null;
	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;

		switch(msg.what) {
			case MSG_SHOW_PAGER :
				if (showPagingControl) {
					View v = null;

					v = findViewById(PAGE_LEFT);

					if (v != null) {
						v.setVisibility(hasPrevious() ? View.VISIBLE : View.INVISIBLE);
					}

					v = findViewById(PAGE_RIGHT);

					if (v != null) {
						v.setVisibility(hasNext() ? View.VISIBLE : View.INVISIBLE);
					}

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
			if (views != null) {
				views.clear();
			} else {
				views = new ArrayList<ITitaniumView>();
			}

			for (int i = 0; i < a.length(); i++) {
				ITitaniumView tv = tmm.getActivity().getViewByName(a.getString(i));
				if (tv != null) {
					views.add(tv);
					gallery.addView(tv.getNativeView());
				}
			}
		} catch (JSONException e) {
			Log.e(LCAT, "Error setting views: " + json, e);
		}
	}

	public void setShowPagingControl(boolean showPagingControl) {
		this.showPagingControl = showPagingControl;
		if (!showPagingControl) {
			handler.sendEmptyMessage(MSG_HIDE_PAGER);
		} else {
			handler.sendEmptyMessage(MSG_SHOW_PAGER);
		}
	}

	public void scrollToView(int position) {
		if(position < gallery.getChildCount()) {
			int current = getSelectedItemPosition();
			if (current < position) {
				while(getSelectedItemPosition() < position) {
					moveNext();
				}
			} else if (position > current) {
				while(getSelectedItemPosition() > position) {
					movePrevious();
				}
			}
		}
	}

	public ArrayList<ITitaniumView> getViews() {
		return views;
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event) {
		boolean handled = super.dispatchKeyEvent(event);

		if (!handled && event.getAction() == KeyEvent.ACTION_DOWN) {
			switch (event.getKeyCode()) {
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
			}
		}

		return handled;
	}

	@Override
	public boolean dispatchTrackballEvent(MotionEvent event) {
		boolean handled = false;

		if (showPagingControl) {
			if (pager.getVisibility() != View.VISIBLE) {
				handler.sendEmptyMessage(MSG_SHOW_PAGER);
			}
			setPagerTimeout();
		}

		handled = super.dispatchTrackballEvent(event);
		return handled;
	}

	public void onScrolled(int from, int to)
	{
		View v = null;

		if (eventManager.hasListeners(EVENT_SCROLL)) {
			try {
				JSONObject o = new JSONObject();
				o.put("index",to);
				eventManager.invokeSuccessListeners(EVENT_SCROLL, o.toString());
			} catch (JSONException e) {
				Log.e(LCAT, "Error sending scroll event: ", e);
			}
		}

		v = findViewById(PAGE_LEFT);

		if (v != null) {
			v.setVisibility(hasPrevious() ? View.VISIBLE : View.INVISIBLE);
		}

		v = findViewById(PAGE_RIGHT);

		if (v != null) {
			v.setVisibility(hasNext() ? View.VISIBLE : View.INVISIBLE);
		}
	}

	public void onNothingSelected(AdapterView<?> view)
	{
	}

	public void onAnimationRepeat(Animation anim) {

	}

	public void onAnimationEnd(Animation anim) {
		inAnimation.set(false);
	}

	public void onAnimationStart(Animation anim) {
		inAnimation.set(true);
	}

}
