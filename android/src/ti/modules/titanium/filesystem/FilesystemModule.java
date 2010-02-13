package ti.modules.titanium.filesystem;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;

public class FilesystemModule extends TiModule
{
	private static final String LCAT = "TiFilesystem";
	private static final boolean DBG = TiConfig.LOGD;

	public static int MODE_READ = 0;
	public static int MODE_WRITE = 1;
	public static int MODE_APPEND = 2;

	private static String[] RESOURCES_DIR = { "app://" };
	private static TiDict constants;

	public FilesystemModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants()
	{
		if (constants == null) {
			constants = new TiDict();

			constants.put("MODE_READ", MODE_READ);
			constants.put("MODE_WRITE", MODE_WRITE);
			constants.put("MODE_APPEND", MODE_APPEND);
		}

		return constants;
	}

	// Methods
	public FileProxy createTempFile()
	{
		return null;
	}

	public FileProxy createTempDirectory()
	{
		return null;
	}

	public boolean isExternalStoragePresent() {
		return false;
	}

	public FileProxy getFile(Object[] parts)
	{
		String[] sparts = TiConvert.toStringArray(parts);
		return new FileProxy(getTiContext(), sparts);
	}

	public FileProxy getApplicationDirectory()
	{
		return null;
	}

	public FileProxy getApplicationDataDirectory(boolean privateStorage) {
		return null;
	}

	public String getResourcesDirectory()
	{
		return "app://";
	}
}
