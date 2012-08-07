package ti.modules.titanium.platform;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;

import android.os.Build;
import android.content.res.Configuration;

@Kroll.module(parentModule=PlatformModule.class)
public class AndroidModule extends PlatformModule{

	@Kroll.constant public static final int API_LEVEL = Build.VERSION.SDK_INT;

	@Kroll.constant public static final int PHYSICAL_SIZE_CATEGORY_UNDEFINED = Configuration.SCREENLAYOUT_SIZE_UNDEFINED;
	@Kroll.constant public static final int PHYSICAL_SIZE_CATEGORY_SMALL = Configuration.SCREENLAYOUT_SIZE_SMALL;
	@Kroll.constant public static final int PHYSICAL_SIZE_CATEGORY_NORMAL = Configuration.SCREENLAYOUT_SIZE_NORMAL;
	@Kroll.constant public static final int PHYSICAL_SIZE_CATEGORY_LARGE = Configuration.SCREENLAYOUT_SIZE_LARGE;
	@Kroll.constant public static final int PHYSICAL_SIZE_CATEGORY_XLARGE = 4; // Configuration.SCREENLAYOUT_SIZE_XLARGE (API 9)
	
	@Kroll.getProperty @Kroll.method
	public int getPhysicalSizeCategory() {
		int size = TiApplication.getInstance().getApplicationContext().getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK;
		switch(size) {
			case Configuration.SCREENLAYOUT_SIZE_SMALL :
			case Configuration.SCREENLAYOUT_SIZE_NORMAL :
			case Configuration.SCREENLAYOUT_SIZE_LARGE : 
			case 4 : // Configuration.SCREENLAYOUT_SIZE_XLARGE (API 9)
				return size;
			case Configuration.SCREENLAYOUT_SIZE_UNDEFINED:
			default :
				return PHYSICAL_SIZE_CATEGORY_UNDEFINED;
		}
	}

	public AndroidModule()
	{
		super();
	}
	
}
