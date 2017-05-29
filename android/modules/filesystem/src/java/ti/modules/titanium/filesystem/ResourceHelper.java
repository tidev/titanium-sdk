package ti.modules.titanium.filesystem;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.view.TiDrawableReference;

public class ResourceHelper {

	private ResourceHelper() {
		instance = new ResourceHelper();
	}

	public static ResourceHelper getInstance() {
		return instance;
	}

	private static ResourceHelper instance;

	public static TiDrawableReference makeImageSource(KrollProxy proxy, Object object)
	{
		if (object instanceof FileProxy) {
			return TiDrawableReference.fromFile(proxy.getActivity(), ((FileProxy) object).getBaseFile());
		} else if (object instanceof String) {
			return TiDrawableReference.fromUrl(proxy, (String) object);
		} else {
			return TiDrawableReference.fromObject(proxy.getActivity(), object);
		}
	}
}
