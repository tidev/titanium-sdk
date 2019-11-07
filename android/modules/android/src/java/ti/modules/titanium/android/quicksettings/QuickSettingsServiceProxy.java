package ti.modules.titanium.android.quicksettings;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.IntentProxy;
import org.appcelerator.titanium.proxy.ServiceProxy;
import org.appcelerator.titanium.view.TiDrawableReference;

import android.annotation.TargetApi;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.graphics.drawable.Icon;
import android.service.quicksettings.TileService;

@TargetApi(24)
@Kroll.proxy
public class QuickSettingsServiceProxy extends ServiceProxy
{

	private static final String TAG = "QuickSettingsService";

	private TileService tileService;
	//workaround for dealing with Icon class
	private Object pathObject = null;
	private AlertDialog.Builder builder;

	public QuickSettingsServiceProxy(TileService serviceInstance)
	{
		tileService = serviceInstance;
	}

	//Update the tile with the latest changes
	@Kroll.method
	public void updateTile()
	{
		tileService.getQsTile().updateTile();
	}

	//Setting Tile's icon
	@Kroll.method
	public void setIcon(Object path)
	{
		tileService.getQsTile().setIcon(Icon.createWithBitmap(
			TiDrawableReference.fromObject(TiApplication.getAppRootOrCurrentActivity(), path).getBitmap()));
		pathObject = path;
	}

	//Setting Tile's state
	@Kroll.method
	public void setState(int state)
	{
		tileService.getQsTile().setState(state);
	}

	//Setting Tile's label
	@Kroll.method
	public void setLabel(String label)
	{
		tileService.getQsTile().setLabel(label);
	}

	//Getting Tile'c icon
	@Kroll.method
	public Object getIcon()
	{
		return pathObject;
	}

	//Getting Tile's state
	@Kroll.method
	public int getState()
	{
		return tileService.getQsTile().getState();
	}

	//Getting Tile's label
	@Kroll.method
	public String getLabel()
	{
		return tileService.getQsTile().getLabel().toString();
	}

	//Checks if the lock screen is showing.
	@Kroll.method
	public final boolean isLocked()
	{
		return tileService.isLocked();
	}

	//Checks if the device is in a secure state.
	@Kroll.method
	public final boolean isSecure()
	{
		return tileService.isSecure();
	}

	//Used to show a dialog.
	@Kroll.method
	public void showDialog(KrollDict krollDictionary)
	{
		tileService.showDialog(createDialogFromDictionary(krollDictionary));
	}

	//Start an activity while collapsing the panel.
	@Kroll.method
	public void startActivityAndCollapse(IntentProxy intent)
	{
		tileService.startActivityAndCollapse(intent.getIntent());
	}

	//Prompts the user to unlock the device before executing the JS file.
	@Kroll.method
	final void unlockAndRun(final String jsToEvaluate)
	{
		tileService.unlockAndRun(new Runnable() {
			@Override
			public void run()
			{
				KrollRuntime.getInstance().evalString(jsToEvaluate);
			}
		});
	}

	private Dialog createDialogFromDictionary(KrollDict krollDict)
	{
		builder = new AlertDialog.Builder(tileService.getApplicationContext());
		String[] buttonText = null;
		if (krollDict.containsKey(TiC.PROPERTY_TITLE)) {
			builder.setTitle(krollDict.getString(TiC.PROPERTY_TITLE));
		}
		if (krollDict.containsKey(TiC.PROPERTY_MESSAGE)) {
			builder.setMessage(krollDict.getString(TiC.PROPERTY_MESSAGE));
		}
		if (krollDict.containsKey(TiC.PROPERTY_BUTTON_NAMES)) {
			buttonText = krollDict.getStringArray(TiC.PROPERTY_BUTTON_NAMES);
		} else if (krollDict.containsKey(TiC.PROPERTY_OK)) {
			buttonText = new String[] { krollDict.getString(TiC.PROPERTY_OK) };
		}
		if (krollDict.containsKey(TiC.PROPERTY_OPTIONS)) {
			String[] optionText = krollDict.getStringArray(TiC.PROPERTY_OPTIONS);
			int selectedIndex =
				krollDict.containsKey(TiC.PROPERTY_SELECTED_INDEX) ? krollDict.getInt(TiC.PROPERTY_SELECTED_INDEX) : -1;
			if (selectedIndex >= optionText.length) {
				Log.d(TAG, "Ooops invalid selected index specified: " + selectedIndex, Log.DEBUG_MODE);
				selectedIndex = -1;
			}

			processOptions(optionText, selectedIndex);
		}

		if (buttonText != null) {
			processButtons(buttonText);
		}
		return builder.create();
	}

	private void processOptions(String[] optionText, int selectedIndex)
	{
		builder.setSingleChoiceItems(optionText, selectedIndex, new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int which)
			{
				KrollDict eventDictionary = new KrollDict();
				eventDictionary.put(TiC.PROPERTY_ITEM_INDEX, which);
				fireEvent(TiC.EVENT_TILE_DIALOG_OPTION_SELECTED, eventDictionary);
			}
		});
	}

	private void processButtons(String[] buttonText)
	{
		builder.setPositiveButton(null, null);
		builder.setNegativeButton(null, null);
		builder.setNeutralButton(null, null);
		builder.setOnCancelListener(new DialogInterface.OnCancelListener() {
			@Override
			public void onCancel(DialogInterface dialog)
			{
				dialog.dismiss();
				fireEvent(TiC.EVENT_TILE_DIALOG_CANCELED, null);
			}
		});

		for (int id = 0; id < buttonText.length; id++) {
			String text = buttonText[id];

			switch (id) {
				case 0:
					builder.setPositiveButton(text, new DialogInterface.OnClickListener() {
						@Override
						public void onClick(DialogInterface dialog, int which)
						{
							fireEvent(TiC.EVENT_TILE_DIALOG_POSITIVE, null);
						}
					});
					break;
				case 1:
					builder.setNeutralButton(text, new DialogInterface.OnClickListener() {
						@Override
						public void onClick(DialogInterface dialog, int which)
						{
							fireEvent(TiC.EVENT_TILE_DIALOG_NEUTRAL, null);
						}
					});
					break;
				case 2:
					builder.setNegativeButton(text, new DialogInterface.OnClickListener() {
						@Override
						public void onClick(DialogInterface dialog, int which)
						{
							fireEvent(TiC.EVENT_TILE_DIALOG_NEGATIVE, null);
						}
					});
					break;
				default:
					Log.e(TAG, "Only 3 buttons are supported");
			}
		}
	}
}
