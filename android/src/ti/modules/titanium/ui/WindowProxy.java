package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;
import org.appcelerator.titanium.view.TiWindowProxy;
import org.json.JSONObject;

/*
 * @interface TiUIWindowProxy : TiWindowProxy
{
@private
	NSURL *url;
	NSMutableArray *views;
	TiViewProxy *activeView;
	KrollBridge *context;
	BOOL hasToolbar;
	BOOL focused;
}

-(void)addView:(id)args;
-(void)removeView:(id)args;
-(void)showView:(id)args;


 */
public class WindowProxy extends TiWindowProxy
{
	private String url;
	ArrayList<TiViewProxy> views;
	TiViewProxy activeView;

	public WindowProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}

	@Override
	protected void handleOpen()
	{
		//TODO ignore multiple opens
		TiUIView v = getView();
//		TiContext ctx = getTiContext();
//		ctx.getActivity().addContentView(v.getNativeView(), v.getLayoutParams());
	}

	@Override
	protected void handleClose()
	{

	}

	@Override
	public TiUIView createView()
	{
		return new TiUIWindow(this);
	}

	public void addView(TiViewProxy view)
	{
		if (views == null) {
			views = new ArrayList<TiViewProxy>();
		}
		synchronized(views) {
			views.add(view);
		}
	}

	public void removeView(TiViewProxy view)
	{
		if (views != null) {
			synchronized(views) {
				views.remove(view);
			}
		}
	}

	public void showView(TiViewProxy view)
	{

	}

	public void showView(TiViewProxy view, JSONObject options)
	{

	}
}
