package org.appcelerator.titanium.annotations.manifest;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Currently icon/theme type elements are simple string elements rather than their own annotation type
 * Expedience vs verbose/time - having their own type would facilitate generating resources
 * 
 * Android defaults have been chosen when defined, otherwise sensible defaults are used.
 * 
 */

@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.ANNOTATION_TYPE, ElementType.METHOD, ElementType.PACKAGE,  ElementType.TYPE})
public @interface Ti {
	
	/**
	 * The module annotation is an internal interface that allows Ti to load the module
	 * 
	 * This will need expanding a little more to allow namespace mapping 
	 * - so that module don't need to be in the ti.modules.titanium package
	 */
	public @interface module {
		String name();
		version version();
		version dependsUponTitanium() default @version(buildVersion=0, minorVersion=3, majorVersion=1);
		String[] requiresComponents() default {};
	}
	
	public @interface version {
		int buildVersion() default 0;
		int minorVersion() default 0;
		int majorVersion() default 1;			
	}
	
	public @interface manifest {
		
		/*
		 * Supporting or simple types
		 */
		public @interface usesLibrary {
			String value();
		}
		
		public @interface usesFeature {
			public String name();
			boolean required() default false;
		}
		
		public @interface category  {
			String value() default "";
		}
		public @interface filter {
			String value() default "";
		}
		public @interface action {
			String value() default "";
		}
		
		public @interface intentFilter {
			action action() default @action();
			category category() default @category();
			data data() default @data();
		}
		
		public @interface data {
			String host() default "";
			String path() default "";
			String pathPrefix() default "";
			String port() default "";
			String scheme() default "";
		}

		public @interface sdk {
			int minVersion();
			int maxVersion();
			int targetVersion();
		}
		
		public @interface requiresPermissions {
			requiresPermission[] value();
		}
		
		public @interface requiresPermission {
			String name();
			String protectionLevel() default "";
			String label() default "";
			String description() default "";
			String permissionGroup() default ""; 
		}		
		
		/**
		 * Complex types
		 */
		public @interface activity {
			public enum configChangesTypes { mcc, mnc, locale, touchScreen, keyboard, keyboardHidden, navigation, orientation, screenLayout, fontScale, uiMode };
			public enum launchModeTypes { standard, multiple, singleTop, singleTask, singleInstance };
			public enum screenOrientationTypes { unspecified, user, behind, landscape, portrait, sensor, nosensor};
			public enum windowSoftInputModeTypes { stateUnspecified, stateUnchanged, stateHidden, stateAlwaysHidden, stateVisible, stateAlwaysVisible, adjustUnspecified, adjustResize, adjustPan};
			
			String name();
			configChangesTypes[] configChanges();
			String theme() default "";
			String label() default "";
			intentFilter intentFilter() default @intentFilter(action = @action);
			boolean allowTaskReparenting() default false;
			boolean alwaysRetainTaskState() default false;
			boolean clearTaskOnLaunch() default false;
			boolean enabled() default true;
			boolean excludeFromRecents() default false;
			boolean exported() default true;
			boolean finishOnTaskLaunch() default false;
			String icon() default "";
			launchModeTypes[] launchMode() default launchModeTypes.standard;
			boolean multiProcess() default false;
			boolean noHistory() default false;
			requiresPermission permission() default @requiresPermission(name="");
			String process() default "";
			screenOrientationTypes[] screenOrientation() default screenOrientationTypes.unspecified;
			boolean stateNoNeeded() default false;
			String taskAffinity() default "";
			windowSoftInputModeTypes[] windowSoftInputMode() default windowSoftInputModeTypes.stateUnspecified;			
		}
		
		public @interface receiver {
			String name();
			boolean enabled() default true;
			boolean exported() default true;
			String icon() default "";
			String label() default "";
			String permission() default "";
			String process() default "";
			action[] filters();
		}
		
		public @interface service {
			String name();
			requiresPermission permission();
			boolean enabled() default true;
			String icon() default "";
			String label() default "";
			String process() default "";
		}

		public @interface provider {
			String[] authorities() default {};
			boolean enabled() default true;
	        boolean exported() default true;
	        boolean grantUriPermissions() default true;
	        String icon() default "";
	        int initOrder() default 0;
	        String label() default "";
	        boolean multiprocess() default true;
	        String name();
	        String[] permission() default {};
	        String process() default "";
	        String readPermission() default "";
	        boolean syncable() default false;
	        String writePermission() default "";
		}
	}
}
