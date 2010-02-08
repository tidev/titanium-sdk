package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;

import android.R;
import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TabHost;
import android.widget.TabWidget;
import android.widget.TabHost.TabSpec;

public class TiUITabGroup extends TiUIView
{

	TabHost tabHost;
	TabWidget tabWidget;
	FrameLayout tabContent;

	public TiUITabGroup(TiViewProxy proxy)
	{
		super(proxy);

		tabHost = new TabHost(proxy.getContext());

		tabWidget = new TabWidget(proxy.getContext());
		tabWidget.setId(android.R.id.tabs); // Required by contract w/ host

		tabContent = new FrameLayout(proxy.getContext());
		tabContent.setId(android.R.id.tabcontent);
		tabContent.setPadding(0, 68, 0, 0); //TODO, user control?

		tabHost.addView(tabWidget, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.WRAP_CONTENT));
		tabHost.addView(tabContent, new LinearLayout.LayoutParams(
                  LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));

		tabHost.setup(proxy.getTiContext().getRootActivity().getLocalActivityManager());

        tabHost.setBackgroundDrawable(new ColorDrawable(TiConvert.toColor("#ff1a1a1a")));

		setNativeView(tabHost);
	}

	public TabSpec newTab(String id)
	{
		return tabHost.newTabSpec(id);
	}

	public void addTab(TabSpec tab) {
		tabHost.addTab(tab);
	}
}
