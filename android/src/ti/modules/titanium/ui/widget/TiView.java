package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TitaniumCompositeLayout;

public class TiView extends TiUIView
{

	public TiView(TiViewProxy proxy) {
		super(proxy);

		setNativeView(new TitaniumCompositeLayout(proxy.getContext()));
	}

	@Override
	public void processProperties(TiDict d)
	{

		super.processProperties(d);
	}

}
