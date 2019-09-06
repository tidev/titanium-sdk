/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseService;
import org.appcelerator.titanium.TiBaseService.TiServiceBinder;

import android.app.Notification;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.ServiceConnection;
import android.Manifest;
import android.os.Build;
import android.os.IBinder;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

@Kroll.proxy
/**
 * This is a proxy representation of the Android Service type.
 * Refer to <a href="http://developer.android.com/reference/android/app/Service.html" >Android Service</a> for more details.
 */
public class ServiceProxy extends KrollProxy
{
	private Service service;
	private boolean forBoundServices;
	private int serviceInstanceId;
	private IntentProxy intentProxy;
	private int notificationId;
	private KrollProxy notificationProxy;
	private int foregroundServiceType;

	// Set only if the service is started via bindService as opposed to startService
	private ServiceConnection serviceConnection = null;

	private static final String TAG = "TiServiceProxy";

	public ServiceProxy()
	{
	}

	/**
	 * For when creating a service proxy directly, for later binding using bindService()
	 */
	public ServiceProxy(IntentProxy intentProxy)
	{
		setIntent(intentProxy);
		forBoundServices = true;
	}

	/**
	 * For when a service started via startService() creates a proxy when it starts running
	 */
	public ServiceProxy(Service service, Intent intent, int serviceInstanceId)
	{
		this.service = service;
		setIntent(intent);
		this.serviceInstanceId = serviceInstanceId;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getServiceInstanceId()
	// clang-format on
	{
		return serviceInstanceId;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public IntentProxy getIntent()
	// clang-format on
	{
		return intentProxy;
	}

	public void setIntent(Intent intent)
	{
		setIntent(new IntentProxy(intent));
	}

	/**
	 * Sets the IntentProxy.
	 * @param intentProxy the proxy to set.
	 */
	public void setIntent(IntentProxy intentProxy)
	{
		this.intentProxy = intentProxy;
	}

	@Kroll.method
	public void start()
	{
		if (!forBoundServices) {
			Log.w(
				TAG,
				"Only services created via Ti.Android.createService can be started via the start() command. Ignoring start() request.");
			return;
		}
		bindAndInvokeService();
	}

	@Kroll.method
	public void stop()
	{
		Log.d(TAG, "Stopping service", Log.DEBUG_MODE);
		if (!forBoundServices) {
			if (service != null) {
				Log.d(TAG, "stop via stopService", Log.DEBUG_MODE);
				service.stopSelf();
			}
		} else {
			unbindService();
		}
	}

	@Kroll.method
	public void foregroundNotify(int notificationId, KrollProxy notificationProxy,
								 @Kroll.argument(optional = true) int foregroundServiceType)
	{
		// Validate arguments.
		if (notificationId == 0) {
			throw new RuntimeException("Notification ID argument cannot be set to zero.");
		}
		if (notificationProxy == null) {
			throw new RuntimeException("Notification object argument cannot be null.");
		}

		// Update service's foreground state.
		synchronized (this)
		{
			this.notificationId = notificationId;
			this.notificationProxy = notificationProxy;
			this.foregroundServiceType = foregroundServiceType;
		}
		updateForegroundState();
	}

	@Kroll.method
	public void foregroundCancel()
	{
		// Update service's foreground state.
		synchronized (this)
		{
			this.notificationId = 0;
			this.notificationProxy = null;
		}
		updateForegroundState();
	}

	private void bindAndInvokeService()
	{
		// Do not continue if already done.
		if (serviceConnection != null) {
			return;
		}

		// Set up the service listener.
		serviceConnection = new ServiceConnection() {
			public void onServiceDisconnected(ComponentName name)
			{
			}

			public void onServiceConnected(ComponentName name, IBinder service)
			{
				if (service instanceof TiServiceBinder) {
					TiServiceBinder binder = (TiServiceBinder) service;
					ServiceProxy proxy = ServiceProxy.this;
					TiBaseService tiService = (TiBaseService) binder.getService();
					proxy.serviceInstanceId = tiService.nextServiceInstanceId();
					Log.d(TAG, tiService.getClass().getSimpleName() + " service successfully bound", Log.DEBUG_MODE);
					proxy.invokeBoundService(tiService);
				}
			}
		};

		// Start the service.
		TiApplication.getInstance().bindService(this.getIntent().getIntent(), serviceConnection,
												Context.BIND_AUTO_CREATE);
	}

	private void unbindService()
	{
		if (service instanceof TiBaseService) {
			((TiBaseService) service).unbindProxy(this);
		}

		Context context = TiApplication.getInstance();
		if (context == null) {
			Log.w(TAG, "Cannot unbind service.  tiContext.getTiApp() returned null");
			return;
		}

		if (serviceConnection != null) {
			Log.d(TAG, "Unbinding service", Log.DEBUG_MODE);
			context.unbindService(serviceConnection);
			serviceConnection = null;
		}
	}

	protected void invokeBoundService(Service boundService)
	{
		// Keep a reference to the service.
		this.service = boundService;
		if (!(boundService instanceof TiBaseService)) {
			Log.w(TAG, "Service " + boundService.getClass().getSimpleName()
						   + " is not a Ti Service.  Cannot start directly.");
			return;
		}

		// Enable the foreground state if configured.
		if ((this.notificationId != 0) && (this.notificationProxy != null)) {
			updateForegroundState();
		}

		// Start executing the Titanium script assigned to this service.
		TiBaseService tiService = (TiBaseService) boundService;
		Log.d(TAG, "Calling tiService.start for this proxy instance", Log.DEBUG_MODE);
		tiService.start(this);
	}

	@Override
	public void release()
	{
		super.release();
		Log.d(TAG, "Nullifying wrapped service", Log.DEBUG_MODE);
		this.service = null;
		this.notificationProxy = null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.Service";
	}

	private void updateForegroundState()
	{
		// Do not continue if we don't have access to the service yet.
		if (this.service == null) {
			return;
		}

		// Update the service on the main UI thread.
		runOnMainThread(new Runnable() {
			@Override
			public void run()
			{
				// Fetch the service. (Make sure it hasn't been released.)
				Service service = ServiceProxy.this.service;
				if (service == null) {
					return;
				}

				// Fetch the proxy's notification and ID.
				int notificationId = 0;
				Notification notificationObject = null;
				int foregroundServiceType = 0;
				try {
					// Fetch notification settings from proxy.
					synchronized (ServiceProxy.this)
					{
						notificationId = ServiceProxy.this.notificationId;
						if (notificationId != 0) {
							final String CLASS_NAME =
								"ti.modules.titanium.android.notificationmanager.NotificationProxy";
							Class proxyClass = Class.forName(CLASS_NAME);
							Object object = proxyClass.cast(ServiceProxy.this.notificationProxy);
							if (object != null) {
								Method method = proxyClass.getMethod("buildNotification");
								notificationObject = (Notification) method.invoke(object);
							}
							foregroundServiceType = ServiceProxy.this.foregroundServiceType;
						}
					}

					// If given notification was assigned Titanium's default channel, then make sure it's set up.
					// Note: Notification channels are only supported on Android 8.0 and higher.
					if ((notificationObject != null) && (Build.VERSION.SDK_INT >= 26)) {
						final String CLASS_NAME =
							"ti.modules.titanium.android.notificationmanager.NotificationManagerModule";
						Class managerClass = Class.forName(CLASS_NAME);
						String defaultChannelId = (String) managerClass.getField("DEFAULT_CHANNEL_ID").get(null);
						if (defaultChannelId.equals(notificationObject.getChannelId())) {
							Method method = managerClass.getMethod("useDefaultChannel");
							method.invoke(null);
						}
					}
				} catch (Exception ex) {
					// We want reflection exceptions to cause a crash so that our unit tests will catch it.
					throw new RuntimeException(ex);
				}

				// Determine if service is configured for the foreground or background.
				boolean isForeground = (notificationId != 0) && (notificationObject != null);

				// For foreground services, check if "AndroidManifest.xml" has "FOREGROUND_SERVICE" permission,
				// but only if the app is "targeting" API Level 28 (android 9.0) or higher.
				boolean hasPermission = true;
				final String permissionName = "android.permission.FOREGROUND_SERVICE";
				try {
					if (isForeground) {
						String packageName = service.getPackageName();
						PackageManager packageManager = service.getPackageManager();
						PackageInfo packageInfo =
							packageManager.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);
						ApplicationInfo appInfo = packageManager.getApplicationInfo(packageName, 0);
						if (appInfo.targetSdkVersion >= 28) {
							// Fetch array of manifest permissions and find the one required.
							// Note: We can't use Context.checkCallingOrSelfPermission() on older OS versions
							//       since it'll always fail for newer OS permission constants, but we want
							//       to check anyways in case app developer doesn't test on newest OS.
							boolean wasFound = false;
							if (packageInfo.requestedPermissions != null) {
								for (String nextPermissionName : packageInfo.requestedPermissions) {
									if (permissionName.equals(nextPermissionName)) {
										wasFound = true;
										break;
									}
								}
							}
							hasPermission = wasFound;
						}
					}
				} catch (Exception ex) {
					// Something else went wrong. Assume we have permission and proceed.
					Log.w(TAG, ex.getMessage(), ex);
				}
				if (!hasPermission) {
					// We don't have permission. Log an error.
					String message =
						"[Developer Error] Ti.Android.Service.foregroundNotify() requires manifest permission: "
						+ permissionName;
					Log.e(TAG, message);

					// Throw an exception, but only if in developer mode.
					// This allows Titanium to display an exception dialog to the developer stating what's wrong.
					boolean isProduction =
						TiApplication.getInstance().getDeployType().equals(TiApplication.DEPLOY_TYPE_PRODUCTION);
					if (!isProduction) {
						throw new RuntimeException(message);
					}
				}

				// Enable/Disable the service's foreground state.
				// Note: A notification will be shown in the status bar while enabled.
				try {
					if (isForeground) {
						if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
							service.startForeground(notificationId, notificationObject, foregroundServiceType);
						} else {
							service.startForeground(notificationId, notificationObject);
						}
					} else {
						service.stopForeground(true);
					}
				} catch (Exception ex) {
					Log.e(TAG, ex.getMessage(), ex);
				}
			}
		});
	}
}
