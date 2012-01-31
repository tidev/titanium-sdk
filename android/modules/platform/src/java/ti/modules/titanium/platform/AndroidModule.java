package ti.modules.titanium.platform;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import android.os.Build;

@Kroll.module(parentModule=PlatformModule.class)
public class AndroidModule extends PlatformModule{

	@Kroll.constant public static final int API_LEVEL = Build.VERSION.SDK_INT;
	
	public AndroidModule()
	{
		super();
	}
	
}
