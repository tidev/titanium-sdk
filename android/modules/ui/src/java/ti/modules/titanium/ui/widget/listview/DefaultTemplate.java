package ti.modules.titanium.ui.widget.listview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import ti.modules.titanium.ui.ImageViewProxy;
import ti.modules.titanium.ui.LabelProxy;
import ti.modules.titanium.ui.widget.listview.TiTemplate.DataItem;
import android.app.Activity;

public class DefaultTemplate extends TiTemplate {

	public static final String DEFAULT_LABEL_BINDING = "title";
	public static final String DEFAULT_IMAGE_BINDING = "image";

	public DefaultTemplate(String id, KrollDict properties, Activity activity) {
		super(id, properties);
		generateDefaultProps(activity);
	}
	
	public void generateDefaultProps(Activity activity) {
		
		//Generate root item data proxy
		ListItemProxy proxy = new ListItemProxy();
		proxy.setActivity(activity);
		rootItem = new DataItem(proxy, TiC.PROPERTY_PROPERTIES, null);
		dataItems.put(itemID, rootItem);

		//Init default properties for our proxies
		KrollDict defaultLabelProperties = new KrollDict();
		KrollDict defaultImageProperties = new KrollDict();

		//Generate label proxy
		LabelProxy labelProxy = new LabelProxy();
		labelProxy.setActivity(activity);
		//Generate properties
		defaultLabelProperties.put("left", "10%");
		defaultLabelProperties.put("text", "label");
		//bind the proxy and default properties
		DataItem labelItem = new DataItem(labelProxy, DEFAULT_LABEL_BINDING, rootItem);
		dataItems.put(DEFAULT_LABEL_BINDING, labelItem);
		//set default properties
		labelItem.setDefaultProperties(defaultLabelProperties);
		//add child
		rootItem.addChild(labelItem);
		
		//Generate image proxy
		ImageViewProxy imageProxy = new ImageViewProxy();
		imageProxy.setActivity(activity);
		//Generate properties
		defaultImageProperties.put("right", "0");
		defaultImageProperties.put("height", "100");
		defaultImageProperties.put("width", "100");
		//bind the proxy and default properties
		DataItem imageItem = new DataItem (imageProxy, DEFAULT_IMAGE_BINDING, rootItem);
		dataItems.put(DEFAULT_IMAGE_BINDING, imageItem);
		//set default properties
		imageItem.setDefaultProperties(defaultImageProperties);
		//add child
		rootItem.addChild(imageItem);
		

	}
	private void parseDefaultData(KrollDict data) {
		if (!data.containsKey(TiC.PROPERTY_PROPERTIES)) {
			return;
		}
		
		KrollDict properties = data.getKrollDict(TiC.PROPERTY_PROPERTIES);
		KrollDict clone_properties = new KrollDict((HashMap)properties.clone());
		if (clone_properties.containsKey(TiC.PROPERTY_TITLE)) {
			KrollDict text = new KrollDict();
			text.put(TiC.PROPERTY_TEXT, TiConvert.toString(clone_properties, TiC.PROPERTY_TITLE));
			data.put(TiC.PROPERTY_TITLE, text);
			if (clone_properties.containsKey(TiC.PROPERTY_FONT)) {
				text.put(TiC.PROPERTY_FONT, clone_properties.getKrollDict(TiC.PROPERTY_FONT).clone());
				clone_properties.remove(TiC.PROPERTY_FONT);
			}
			if (clone_properties.containsKey(TiC.PROPERTY_COLOR)) {
				text.put(TiC.PROPERTY_COLOR, clone_properties.get(TiC.PROPERTY_COLOR));
				clone_properties.remove(TiC.PROPERTY_COLOR);
			}
			clone_properties.remove(TiC.PROPERTY_TITLE);
		}
		
		if (clone_properties.containsKey(TiC.PROPERTY_IMAGE)) {
			KrollDict image = new KrollDict();
			image.put(TiC.PROPERTY_IMAGE, TiConvert.toString(clone_properties, TiC.PROPERTY_IMAGE));
			data.put(TiC.PROPERTY_IMAGE, image);
			clone_properties.remove(TiC.PROPERTY_IMAGE);
		}
		
		data.put(TiC.PROPERTY_PROPERTIES, clone_properties);
	}
	
	public void updateDefaultProperties(KrollDict data) {

		parseDefaultData(data);
		super.updateDefaultProperties(data);
	}

	public void mergeWithDefaultProperties(KrollDict data) {
		parseDefaultData(data);
		super.mergeWithDefaultProperties(data);
	}
}
