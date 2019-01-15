package ti.modules.titanium.android;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;

import android.os.Environment;

@Kroll.module(parentModule = AndroidModule.class)
public class EnvironmentModule extends KrollModule
{
	@Kroll.constant
	public static final String MEDIA_BAD_REMOVAL = Environment.MEDIA_BAD_REMOVAL;
	@Kroll.constant
	public static final String MEDIA_CHECKING = Environment.MEDIA_CHECKING;
	@Kroll.constant
	public static final String MEDIA_MOUNTED = Environment.MEDIA_MOUNTED;
	@Kroll.constant
	public static final String MEDIA_MOUNTED_READ_ONLY = Environment.MEDIA_MOUNTED_READ_ONLY;
	@Kroll.constant
	public static final String MEDIA_NOFS = Environment.MEDIA_NOFS;
	@Kroll.constant
	public static final String MEDIA_REMOVED = Environment.MEDIA_REMOVED;
	@Kroll.constant
	public static final String MEDIA_SHARED = Environment.MEDIA_SHARED;
	@Kroll.constant
	public static final String MEDIA_UNMOUNTABLE = Environment.MEDIA_UNMOUNTABLE;
	@Kroll.constant
	public static final String MEDIA_UNMOUNTED = Environment.MEDIA_UNMOUNTED;

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getDataDirectory()
	// clang-format on
	{
		return Environment.getDataDirectory().getAbsolutePath();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getDownloadCacheDirectory()
	// clang-format on
	{
		return Environment.getDownloadCacheDirectory().getAbsolutePath();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getExternalStorageDirectory()
	// clang-format on
	{
		return Environment.getExternalStorageDirectory().getAbsolutePath();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getExternalStorageState()
	// clang-format on
	{
		return Environment.getExternalStorageState();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getRootDirectory()
	// clang-format on
	{
		return Environment.getRootDirectory().getAbsolutePath();
	}
}
