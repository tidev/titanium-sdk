/**
 * 
 */
package ti.modules.titanium.android.notificationmanager;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.android.PendingIntentProxy;
import android.app.Activity;
import android.app.Notification;
import android.app.PendingIntent;

@Kroll.proxy(creatableInModule=NotificationManagerModule.class)
public class NotificationProxy extends KrollProxy 
{
	private static final String LCAT = "TiNotification";
	private static boolean DBG = TiConfig.LOGD;
	
	protected Notification notification;
	
	public NotificationProxy(TiContext tiContext) 
	{
		super(tiContext);
	}	
		
	@Override
	public void handleCreationDict(KrollDict d) {
		super.handleCreationDict(d);
		
		if (d != null) {
			
			int iconId = android.R.drawable.stat_sys_warning;
			String tickerText = null;
			long when = System.currentTimeMillis();
			
			//icon
			if (d.containsKey("icon")) {
				String iconUrl = TiConvert.toString(d, "icon");
				if (DBG) {
					Log.d(LCAT, "Setting icon: " + iconUrl);
				}
				Activity activity = getTiContext().getActivity();
				if (getTiContext().getActivity().getApplication() instanceof TiApplication) {
					Activity currentActivity = ((TiApplication) getTiContext().getActivity().getApplication()).getCurrentActivity();
					if (currentActivity != null) {
						activity = currentActivity;
					}
				}
				String iconFullUrl = getTiContext().resolveUrl(null, iconUrl);
				if (DBG) {
					Log.d(LCAT, "Resolved Icon URL: " + iconFullUrl);
				}
				
				iconId = TiUIHelper.getResourceId(getTiContext(), iconFullUrl);
				if (iconId == 0) {
					Log.w(LCAT, "No image found for " + iconUrl);
				}
			}
			
			//tickerText
			if (d.containsKey("tickerText")) {
				tickerText = TiConvert.toString(d, "tickerText");
				if (DBG) {
					Log.d(LCAT, "Setting tickerText: " + tickerText);
				}
			}
			//when
			if (d.containsKey("when")) {
				when = ((Double) TiConvert.toDouble(d, "when")).longValue();
				if (DBG) {
					Log.d(LCAT, "Setting when: " + when);
				}
			}

			notification = new Notification(iconId, tickerText, when);
			
			// audioStreamType
			if (d.containsKey("audioStreamType")) {
				int value = TiConvert.toInt(d,"audioStreamType");
				if (DBG) {
					Log.d(LCAT, "Setting audioStreamType: " + value);
				}
				notification.audioStreamType = value;
			}
			
			//contentView -- not supported
			if (d.containsKey("contentView")) {
				if (DBG) {
					Log.d(LCAT, "Setting contentView -- Not yet supported");
				}
			}
			//defaults
			if (d.containsKey("defaults")) {
				int defaults = TiConvert.toInt(d, "defaults");

				if (DBG) {
					Log.d(LCAT, "Setting defaults: " + defaults);
				}
				notification.defaults = defaults;
			}
			//deleteIntent
			if (d.containsKey("deleteIntent")) {
				if (DBG) {
					Log.d(LCAT, "Setting deleteIntent");
				}
				PendingIntentProxy intentProxy = (PendingIntentProxy) d.get("deleteIntent");
				notification.deleteIntent = intentProxy.getPendingIntent();
			}
			//flags
			if (d.containsKey("flags")) {
				int flags = TiConvert.toInt(d, "flags");
				if (DBG) {
					Log.d(LCAT, "Setting flags: " + flags);
				}
				notification.flags = flags;
			} else {
				notification.flags = Notification.FLAG_AUTO_CANCEL;
			}
			//iconLevel
			if (d.containsKey("iconLevel")) {
				if (DBG) {
					Log.d(LCAT, "Setting iconLevel: -- not yet implemented.");
				}
			}
			//ledARGB
			if (d.containsKey("ledColor")) {
				if (DBG) {
					Log.d(LCAT, "Setting ledColor: -- not yet implemented");
				}
			}
			//ledOffMS
			if (d.containsKey("ledOffMS")) {
				int ledOffMS = TiConvert.toInt(d, "ledOffMS");
				if (DBG) {
					Log.d(LCAT, "Setting ledOffMS: " + ledOffMS);
				}
				notification.ledOffMS = ledOffMS;
			}
			//ledOnMS
			if (d.containsKey("ledOnMS")) {
				int ledOnMS = TiConvert.toInt(d, "ledOnMS");
				if (DBG) {
					Log.d(LCAT, "Setting ledOnMS: " + ledOnMS);
				}
				notification.ledOnMS = ledOnMS;
			}
			//number
			if (d.containsKey("number")) {
				int number = TiConvert.toInt(d, "number");
				if (DBG) {
					Log.d(LCAT, "Setting number: " + number);
				}
				notification.number = number;
			}
			//sound -- not implemented
			if (d.containsKey("sound")) {
				if (DBG) {
					Log.d(LCAT, "Setting sound: -- not yet implemented.");
				}
			}
			//vibrate -- not implemented yet
			if (d.containsKey("vibratePattern")) {
				if (DBG) {
					Log.d(LCAT, "Setting vibratePattern -- not yet implemented.");
				}
			}
			
			String contentTitle = "";
			String contentText = "";
			PendingIntent contentIntent = null;
			
			if (d.containsKeyAndNotNull("contentTitle")) {
				contentTitle = TiConvert.toString(d, "contentTitle");
			}
			if (d.containsKeyAndNotNull("contentText")) {
				contentText = TiConvert.toString(d, "contentText");
			}
			if (d.containsKey("contentIntent")) {
				if (DBG) {
					Log.d(LCAT, "Setting contentIntent");
				}
				PendingIntentProxy intentProxy = (PendingIntentProxy) d.get("contentIntent");
				contentIntent = intentProxy.getPendingIntent();
			}

			notification.setLatestEventInfo(getTiContext().getTiApp(), contentTitle, contentText, contentIntent);
		}

	}


	public Notification getNotification() { 
		return notification;
	}
}
