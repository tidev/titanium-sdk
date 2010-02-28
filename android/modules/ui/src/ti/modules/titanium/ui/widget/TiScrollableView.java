package ti.modules.titanium.ui.widget;

import java.util.ArrayList;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiAnimationFactory;
import org.appcelerator.titanium.util.TiAnimationPair;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiEventHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;

import ti.modules.titanium.ui.ScrollableViewProxy;
import android.graphics.Color;
import android.os.Handler;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.RelativeLayout;
import android.widget.ViewAnimator;

public class TiScrollableView extends TiCompositeLayout
{
	private static final String LCAT = "TiUIScrollableView";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int ANIM_DURATION = 500;

	private static final int PAGE_LEFT = 200;
	private static final int PAGE_RIGHT = 201;

	protected RelativeLayout pager;
	protected View glass;
	protected boolean showPagingControl;
	
	protected ViewAnimator gallery;
	protected TiAnimationPair animPrev;
	protected TiAnimationPair animNext;
	final protected TiScrollableView me;

	protected ArrayList<TiViewProxy> views;
	protected ScrollableViewProxy proxy;
	protected Handler handler;
	
	public TiScrollableView(ScrollableViewProxy proxy, Handler handler)
	{
		super(proxy.getContext());
		
		this.proxy = proxy;
		this.handler = handler;
		me = this;
		showPagingControl = true;
		
		//below this was in "doOpen"
		//setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		setFocusable(true);
		setFocusableInTouchMode(true);
		setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);

		animPrev = TiAnimationFactory.getAnimationFor("slide-from-left", ANIM_DURATION);
		animPrev.setAnimationListener(proxy);

		animNext = TiAnimationFactory.getAnimationFor("slide-from-right", ANIM_DURATION);
		animNext.setAnimationListener(proxy);

		gallery = new ViewAnimator(proxy.getContext());
		gallery.setFocusable(false);
		gallery.setFocusableInTouchMode(false);
		gallery.setClickable(false);

		TiCompositeLayout.LayoutParams p = new TiCompositeLayout.LayoutParams();
		p.autoFillsHeight = p.autoFillsWidth = true;
		
		addView(gallery, p);
		//gallery.setOnItemSelectedListener(this);

		pager = new RelativeLayout(proxy.getContext());
		pager.setFocusable(false);
		pager.setFocusableInTouchMode(false);

		TiArrowView left = new TiArrowView(proxy.getContext());
		left.setVisibility(View.INVISIBLE);
		left.setId(PAGE_LEFT);
		left.setMinimumWidth(80);
		left.setMinimumHeight(80);
		left.setOnClickListener(new OnClickListener(){
			public void onClick(View v) {
				doMovePrevious();
			}});
		RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		pager.addView(left, params);

		TiArrowView right = new TiArrowView(proxy.getContext());
		right.setLeft(false);
		right.setVisibility(View.INVISIBLE);
		right.setId(PAGE_RIGHT);
		right.setMinimumWidth(80);
		right.setMinimumHeight(80);
		right.setOnClickListener(new OnClickListener(){
			public void onClick(View v) {
				TiScrollableView.this.proxy.moveNext();
			}});
		params = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		pager.addView(right, params);

		pager.setVisibility(View.GONE);

		p = new TiCompositeLayout.LayoutParams();
		p.autoFillsHeight = true;
		p.autoFillsWidth = true;
		addView(pager, p);

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
	}

	public int getSelectedItemPosition() {
		synchronized(gallery) {
			return gallery.getDisplayedChild();
		}
	}

	public boolean hasPrevious() {
		return getSelectedItemPosition() > 0;
	}
 
	public boolean hasNext() {
		synchronized (gallery) {
			return getSelectedItemPosition() < gallery.getChildCount() - 1;
		}
	}

	public void doMovePrevious() {
		synchronized(gallery) {
			int pos = getSelectedItemPosition();
			if (pos > 0) {
				int from = pos;
				int to = pos - 1;
				TiEventHelper.fireFocused(views.get(from));
				animPrev.apply(gallery);
				gallery.setDisplayedChild(to);
				TiEventHelper.fireUnfocused(views.get(to));
				onScrolled(from, to);
				if (pager.getVisibility() == View.VISIBLE) {
					proxy.setPagerTimeout();
				}
			}
		}
	}

	public void doMoveNext() {
		synchronized(gallery) {
			int pos = getSelectedItemPosition();
			if (pos < gallery.getChildCount() - 1) {
				int from = pos;
				int to = pos + 1;
				TiEventHelper.fireFocused(views.get(from));
				animNext.apply(gallery);
				gallery.setDisplayedChild(to);
				TiEventHelper.fireUnfocused(views.get(to));
				onScrolled(from, to);
				if (pager.getVisibility() == View.VISIBLE) {
					proxy.setPagerTimeout();
				}
			}
		}
	}
	
	public void showPager() {
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
	}
	
	public void hidePager() {
		pager.setVisibility(View.INVISIBLE);
	}

	public void setViews(Object viewsObject)
	{
		if (DBG) {
			Log.d(LCAT, "Views: " + viewsObject);
		}
		if (views != null) {
			views.clear();
		} else {
			views = new ArrayList<TiViewProxy>();
		}

		if (viewsObject instanceof Object[]) {
			Object[] views = (Object[])viewsObject;
			gallery.removeAllViews();
			for (int i = 0; i < views.length; i++) {
				if (views[i] instanceof TiViewProxy) {
					TiViewProxy tv = (TiViewProxy)views[i];
					this.views.add(tv);
					gallery.addView(tv.getView(null).getNativeView());
				}
			}
			if (views.length >= 0) {
				((TiViewProxy)views[0]).show(new TiDict());
			}
		}
	}
	
	public void addView(TiViewProxy proxy) 
	{
		if (proxy != null) {
			this.views.add(proxy);
			gallery.addView(proxy.getView(null).getNativeView());
		}
	}

	public void setShowPagingControl(boolean showPagingControl) {
		this.showPagingControl = showPagingControl;
	}
	
	public void doScrollToView(int position) {
		if(position < gallery.getChildCount()) {
			int current = getSelectedItemPosition();
			if (current < position) {
				while(getSelectedItemPosition() < position) {
					doMoveNext();
				}
			} else if (current > position) {
				while(getSelectedItemPosition() > position) {
					TiScrollableView.this.proxy.movePrevious();
				}
			}
		}
	}
	
	public void doScrollToView(TiViewProxy view)
	{
		if (views.contains(view)) {
			doScrollToView(views.indexOf(view));
		}
	}

	public ArrayList<TiViewProxy> getViews() {
		return views; 
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event) {
		boolean handled = false;

		if (event.getAction() == KeyEvent.ACTION_DOWN) {
			switch (event.getKeyCode()) {
				case KeyEvent.KEYCODE_DPAD_LEFT : {
					proxy.movePrevious();
					handled = true;
					break;
				}
				case KeyEvent.KEYCODE_DPAD_RIGHT : {
					proxy.moveNext();
					handled = true;
					break;
				}
			}
		}

		if (!handled) {
			handled = super.dispatchKeyEvent(event);
		}

		return handled;
	}

	@Override
	public boolean dispatchTrackballEvent(MotionEvent event) {
		boolean handled = false;

		if (showPagingControl) {
			if (pager.getVisibility() != View.VISIBLE) {
				handler.sendEmptyMessage(ScrollableViewProxy.MSG_SHOW_PAGER);
			}
			proxy.setPagerTimeout();
		}

		handled = super.dispatchTrackballEvent(event);
		return handled;
	}

	public void onScrolled(int from, int to)
	{
		View v = null;

		proxy.fireScroll(to);

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
}
