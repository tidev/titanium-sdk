package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

import ti.modules.titanium.ui.ImageViewProxy;
import ti.modules.titanium.ui.LabelProxy;
import android.app.Activity;

public class TiTemplate {
	
	private HashMap<String, TiViewProxy> viewProxies;
	
	public static final String DEFAULT_TEMPLATE = "defaultTemplate";
	public static final String DEFAULT_LABEL_BINDING = "title";
	public static final String DEFAULT_IMAGE_BINDING = "leftImage";

	
	private String templateID;
	private int templateType;
	
	private KrollDict defaultLabelProperties;
	private KrollDict defaultImageProperties;
	
	private KrollDict cellProperties;
	private KrollDict properties;
	
	public TiTemplate(String id, KrollDict properties) {
		viewProxies = new HashMap<String, TiViewProxy>();
		templateID = id;
		templateType = -1;
		defaultLabelProperties = new KrollDict();
		defaultImageProperties = new KrollDict();
		this.properties = properties;
		processProperties(properties);
	
	}
	
	private void processProperties(KrollDict properties) {
		if (properties.containsKey(TiC.PROPERTY_PROPERTIES)) {
			
		}
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
		//Generate label proxy
		LabelProxy labelProxy = new LabelProxy();
		labelProxy.setActivity(activity);
		//Generate properties
		defaultLabelProperties.put("left", "30%");
		//bind the proxy
		viewProxies.put(DEFAULT_LABEL_BINDING, labelProxy);
		
		//Generate image proxy
		ImageViewProxy imageProxy = new ImageViewProxy();
		imageProxy.setActivity(activity);
		//Generate properties
		defaultImageProperties.put("left", "0");
		defaultImageProperties.put("height", "100");
		defaultImageProperties.put("width", "100");
		//bind the proxy
		viewProxies.put(DEFAULT_IMAGE_BINDING, imageProxy);
	}
	
	public KrollDict getDefaultLabelProperties() {
		return defaultLabelProperties;
	}
	
	public KrollDict getDefaultImageProperties() {
		return defaultImageProperties;
	}
	
	public KrollDict mergeProperties(KrollDict dict1, KrollDict dict2) {
		dict1.putAll(dict2);
		return dict1;
		/*KrollDict result = new KrollDict();
		Set<String> keySet1 = dict1.keySet();
		for (Object key:  dict2.keySet()) {
			if (!keySet1.contains(key) || (keySet1.contains(key) && !dict1.get(key).equals(dict2.get(key)))) {
				dict1.
			}
		}

		return result;*/
	}
}
