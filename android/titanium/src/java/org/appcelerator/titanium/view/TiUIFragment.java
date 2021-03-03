package org.appcelerator.titanium.view;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;

public abstract class TiUIFragment extends TiUIView implements Handler.Callback
{
	private Fragment fragment;
	private boolean fragmentCommitted = false;
	protected boolean fragmentOnly = false;
	private ArrayList<TiUIView> childrenToRealize = new ArrayList<>();

	public TiUIFragment(TiViewProxy proxy, Activity activity)
	{
		super(proxy);
		children.add(this);
		// When 'fragmentOnly' property is enabled, we generate the standalone fragment, enabling
		// us to add it directly to other fragment managers.
		if (proxy.hasProperty(TiC.PROPERTY_FRAGMENT_ONLY)) {
			fragmentOnly = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_FRAGMENT_ONLY), false);
		}

		if (fragmentOnly) {
			fragment = createFragment();
		} else {
			TiCompositeLayout container = new TiCompositeLayout(activity, proxy) {
				@Override
				public boolean dispatchTouchEvent(MotionEvent ev)
				{
					return interceptTouchEvent(ev) || super.dispatchTouchEvent(ev);
				}
			};
			container.setId(View.generateViewId());
			setNativeView(container);

			FragmentManager manager = ((FragmentActivity) activity).getSupportFragmentManager();
			FragmentTransaction transaction = manager.beginTransaction();
			transaction.runOnCommit(onCommitRunnable);
			fragment = createFragment();
			transaction.add(container.getId(), fragment);
			transaction.commitAllowingStateLoss();
		}
	}

	private Runnable onCommitRunnable = new Runnable() {
		@Override
		public void run()
		{
			// Draw all the children that have been added prior the fragment transaction commit.
			realizeFragmentViews();
			fragmentCommitted = true;
		}
	};

	public void realizeFragmentViews()
	{
		for (TiUIView child : childrenToRealize) {
			// Draw the views
			((ViewGroup) getNativeView()).addView(child.getOuterView(), child.getLayoutParams());
			// Move them to the default children array
			children.add(child);
		}
		// Clear and nullify the childrenToRealize array
		childrenToRealize.clear();
		childrenToRealize = null;
	}

	@Override
	public void add(TiUIView child)
	{
		// If the fragment transaction has been committed add the children the usual way
		if (fragmentCommitted) {
			super.add(child);
		} else {
			// If the fragment has not been added to the native view add the children in
			// the array to be realized
			childrenToRealize.add(child);
		}
	}

	@Override
	public void insertAt(TiUIView child, int position)
	{
		if (fragmentCommitted) {
			// take into account the fragment added to the container
			super.insertAt(child, position + 1);
		} else {
			childrenToRealize.add(position, child);
		}
	}

	@Override
	public void remove(TiUIView child)
	{
		if (childrenToRealize != null && childrenToRealize.contains(child)) {
			childrenToRealize.remove(child);
		}
		super.remove(child);
	}

	public Fragment getFragment()
	{
		return fragment;
	}

	public boolean handleMessage(Message msg)
	{
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
					FragmentManager childManager = fragment.getActivity().getSupportFragmentManager();
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
