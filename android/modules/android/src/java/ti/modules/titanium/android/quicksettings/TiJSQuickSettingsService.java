package ti.modules.titanium.android.quicksettings;

import android.os.Build;
import android.service.quicksettings.TileService;
import android.support.annotation.RequiresApi;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.ServiceProxy;

@RequiresApi(api = Build.VERSION_CODES.N)
public class TiJSQuickSettingsService extends TileService
{

	private final ServiceProxy proxy;

	public TiJSQuickSettingsService(String url)
	{
		//create a proxy for this service
		proxy = new QuickSettingsServiceProxy(this);
		//get the source to be run
		byte[] source = KrollAssetHelper.readAssetBytes(url);
		//run the module
		KrollRuntime.getInstance().runModuleBytes(source, url, proxy);
	}

	//Called when the user clicks on this tile.
	@Override
	public void onClick()
	{
		proxy.fireEvent(TiC.EVENT_CLICK, null);
	}

	//Called when the user adds this tile to Quick Settings.
	@Override
	public void onTileAdded()
	{
		proxy.fireEvent(TiC.EVENT_TILE_ADDED, null);
	}

	//Called when the user removes this tile from Quick Settings.
	@Override
	public void onTileRemoved()
	{
		proxy.fireEvent(TiC.EVENT_TILE_REMOVED, null);
	}

	//Called by the system to notify a Service that it is no longer used and is being removed.
	@Override
	public void onDestroy()
	{
		proxy.fireEvent(TiC.EVENT_DESTROY, null);
	}

	//Called when this tile moves into a listening state.
	@Override
	public void onStartListening()
	{
		proxy.fireEvent(TiC.EVENT_START_LISTENING, null);
	}

	//Called when this tile moves out of the listening state.
	@Override
	public void onStopListening()
	{
		proxy.fireEvent(TiC.EVENT_STOP_LISTENING, null);
	}
}
