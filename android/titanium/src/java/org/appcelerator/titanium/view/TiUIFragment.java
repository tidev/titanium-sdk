package org.appcelerator.titanium.view;

import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.view.MotionEvent;

public abstract class TiUIFragment extends TiUIView implements Handler.Callback
{
	private static int viewId = 1000;

	private Fragment fragment;
	protected boolean fragmentOnly = false;


	public TiUIFragment(TiViewProxy proxy, Activity activity)
	{
		super(proxy);
		// When 'fragmentOnly' property is enabled, we generate the standalone fragment, enabling
		// us to add it directly to other fragment managers.
		if (proxy.hasProperty(TiC.PROPERTY_FRAGMENT_ONLY)) {
			fragmentOnly = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_FRAGMENT_ONLY), false);
		}

		if (fragmentOnly) {
			fragment = createFragment();
		} else {
			TiCompositeLayout container = new TiCompositeLayout(activity, proxy)
			{
				@Override
				public boolean dispatchTouchEvent(MotionEvent ev)
				{
					return interceptTouchEvent(ev) || super.dispatchTouchEvent(ev);
				}
			};
			container.setId(viewId++);
			setNativeView(container);

			FragmentManager manager = ((FragmentActivity) activity).getSupportFragmentManager();
			FragmentTransaction transaction = manager.beginTransaction();
			fragment = createFragment();
			transaction.add(container.getId(), fragment);
			transaction.commitAllowingStateLoss();
		}

	}


	public Fragment getFragment()
	{
		return fragment;
	}

	public boolean handleMessage (Message msg) {
		//overwriting so descendents don't have to
		return true;
	}

	protected boolean interceptTouchEvent(MotionEvent ev)
	{
		return false;
	}

	@Override
	public void release()
	{
		if (fragment != null) {
			FragmentManager fragmentManager = fragment.getFragmentManager();
			if (fragmentManager != null) {
				FragmentTransaction transaction = null;
				Fragment tabFragment = fragmentManager.findFragmentById(android.R.id.tabcontent);
				if (tabFragment != null) {
					FragmentManager childManager = tabFragment.getChildFragmentManager();
					transaction = childManager.beginTransaction();
				} else {
					transaction = fragmentManager.beginTransaction();
				}
				transaction.remove(fragment);
				transaction.commit();
			}
		}
		super.release();
	}

	protected abstract Fragment createFragment();
}
