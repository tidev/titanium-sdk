package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TabGroupProxy;
import ti.modules.titanium.ui.TiTabActivity;
import android.graphics.drawable.ColorDrawable;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TabHost;
import android.widget.TabWidget;
import android.widget.TabHost.OnTabChangeListener;
import android.widget.TabHost.TabSpec;

public class TiUITabGroup extends TiUIView
	implements OnTabChangeListener
{
	private static final String LCAT = "TiUITabGroup";
	private static final boolean DBG = TiConfig.LOGD;

	private TabHost tabHost;
	private TabWidget tabWidget;
	private FrameLayout tabContent;

	private String lastTabId;
	private TiDict tabChangeEventData;

	public TiUITabGroup(TiViewProxy proxy, TiTabActivity activity)
	{
		super(proxy);

		tabHost = new TabHost(activity);

		tabHost.setOnTabChangedListener(this);

		tabWidget = new TabWidget(proxy.getContext());
		tabWidget.setId(android.R.id.tabs); // Required by contract w/ host

		tabContent = new FrameLayout(proxy.getContext());
		tabContent.setId(android.R.id.tabcontent);
		tabContent.setPadding(0, 68, 0, 0); //TODO, user control?

		tabHost.addView(tabWidget, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT));
		tabHost.addView(tabContent, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		//tabHost.setup(proxy.getTiContext().getRootActivity().getLocalActivityManager());
		tabHost.setup(activity.getLocalActivityManager());


        tabHost.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor("#ff1a1a1a")));

		setNativeView(tabHost);
		activity.getLayout().addView(tabHost);

  		lastTabId = null;
	}

	public TabSpec newTab(String id)
	{
		return tabHost.newTabSpec(id);
	}

	public void addTab(TabSpec tab) {
		tabHost.addTab(tab);
	}


	@Override
	protected TiDict getFocusEventObject(boolean hasFocus) {
		if (tabChangeEventData == null) {
			TabHost th = (TabHost) getNativeView();
			return ((TabGroupProxy) proxy).buildFocusEvent(th.getCurrentTabTag(), lastTabId);
		} else {
			return tabChangeEventData;
		}
	}

	@Override
	public void onTabChanged(String id)
	{
		if (DBG) {
			Log.i(LCAT,"Tab change from " + lastTabId + " to " + id);
		}

		tabChangeEventData = ((TabGroupProxy) proxy).buildFocusEvent(id, lastTabId);
		lastTabId = id;
	}
}
