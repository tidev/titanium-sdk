package ti.modules.titanium.ui.widget;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.view.TiUIView;

import java.util.ArrayList;

public class TiUIBottomNavigation extends TiUIView implements BottomNavigationView.OnItemSelectedListener
{
	private static final String TAG = "BottomNavigation";
	static int id_layout = 0;
	static int id_content = 0;
	static int id_bottomNavigation = 0;
	private final ArrayList<MenuItem> mMenuItemsArray = new ArrayList<>();
	private RelativeLayout layout = null;
	private TiViewProxy centerView;
	private BottomNavigationView bottomNavigation;

	public TiUIBottomNavigation(TiViewProxy proxy, TiBaseActivity activity)
	{
		super(proxy);
		try {
			id_layout = TiRHelper.getResource("layout.titanium_ui_bottom_navigation");
			id_content = TiRHelper.getResource("id.bottomNavBar_content");
			id_bottomNavigation = TiRHelper.getResource("id.bottomNavBar");

			LayoutInflater inflater = LayoutInflater.from(TiApplication.getAppRootOrCurrentActivity());
			layout = (RelativeLayout) inflater.inflate(id_layout, null, false);
			bottomNavigation = layout.findViewById(id_bottomNavigation);

			bottomNavigation.setOnItemSelectedListener(this);

			activity.setLayout(layout);
			setTabs(new Object[2]);
		} catch (Exception ex) {
			Log.e(TAG, "XML resources could not be found!!!" + ex.getMessage());
		}

	}

	@Override
	public boolean onNavigationItemSelected(@NonNull MenuItem item)
	{
		Log.i("----", "Selected item: " + item.getItemId());
		return false;
	}

	public void setTabs(Object[] tabs)
	{
		Log.i("---", "hier");
		for (Object tabView : tabs) {
			Log.i("---", "1");
			MenuItem menuItem = bottomNavigation.getMenu().add(0, this.mMenuItemsArray.size(), 0, "");
			menuItem.setTitle("test");
			menuItem.setIcon(R.drawable.titanium_icon_checkcircle);
			// Set the click listener.
			//menuItem.setOnMenuItemClickListener(this);
			// Add the MenuItem to the menu of BottomNavigationView.
			this.mMenuItemsArray.add(menuItem);
		}
	}

//	public void setContent(TiViewProxy viewProxy)
//	{
//		if (viewProxy == null || viewProxy == this.centerView) {
//			return;
//		}
//
//		viewProxy.setActivity(proxy.getActivity());
//		TiUIView contentView = viewProxy.getOrCreateView();
//
//		View view = contentView.getOuterView();
//		LinearLayout container = (LinearLayout) layout.findViewById(id_content);
//		TiCompositeLayout content = (TiCompositeLayout) container.getChildAt(1);
//		ViewParent viewParent = view.getParent();
//		if (viewParent != null && viewParent != content && viewParent instanceof ViewGroup) {
//			((ViewGroup) viewParent).removeView(view);
//		}
//		content.addView(view, contentView.getLayoutParams());
//		if (this.centerView != null) {
//			content.removeView(this.centerView.getOrCreateView().getNativeView());
//		}
//		this.centerView = viewProxy;
//	}
}
