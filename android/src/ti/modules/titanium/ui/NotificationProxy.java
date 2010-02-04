package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;

import ti.modules.titanium.ui.widget.TiUINotification;

public class NotificationProxy extends TiViewProxy
{
	public NotificationProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}

	@Override
	public TiUIView createView()
	{
		return new TiUINotification(this);
	}

	@Override
	protected void handleShow(TiDict options) {
		super.handleShow(options);

		TiUINotification n = (TiUINotification) getView();
		n.show(options);
	}
}
