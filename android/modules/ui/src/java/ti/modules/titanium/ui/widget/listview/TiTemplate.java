package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

import ti.modules.titanium.ui.LabelProxy;
import android.app.Activity;

public class TiTemplate {
	
	private HashMap<String, TiViewProxy> viewProxies;
	
	public static final String DEFAULT_TEMPLATE = "defaultTemplate";
	public static final String DEFAULT_BINDING = "title";
	
	private String templateID;
	private int templateType;
	
	public TiTemplate(String id) {
		viewProxies = new HashMap<String, TiViewProxy>();
		templateID = id;
		templateType = -1;
	}
	
	public String getTemplateID() {
		return templateID;
	}
	
	public void setType(int type) {
		templateType = type;
	}
	
	public int getType() {
		return templateType;
	}
	
	/**
	 * Returns the bound viewProxy if exists, otherwise returns null
	 */
	public TiViewProxy getViewProxy(String binding) {
		if (viewProxies.containsKey(binding)) {
			return viewProxies.get(binding);
		}
		return null;
	}
	
	public void generateDefaultProps(Activity activity) {
		//Generate default proxy and its properties, which in this case is
		//a label with a simple text
		LabelProxy proxy = new LabelProxy();
		proxy.setProperty(TiC.PROPERTY_TEXT, "myLabel");
		proxy.setActivity(activity);
		//bind the proxy
		viewProxies.put(DEFAULT_BINDING, proxy);
	}
	
}
