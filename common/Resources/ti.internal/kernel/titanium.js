/* globals OS_ANDROID,OS_IOS */
import invoker from './android/invoker';
import ProxyBootstrap from './android/proxy';

export default function bootstrap(global, kroll) {

	if (OS_ANDROID) {
		const tiBinding = kroll.binding('Titanium');
		const Ti = tiBinding.Titanium;
		const bootstrap = kroll.NativeModule.require('bootstrap');
		// The bootstrap defines lazy namespace property tree **and**
		// sets up special APIs that get wrapped to pass along sourceUrl via a KrollInvocation object
		bootstrap.bootstrap(Ti);
		bootstrap.defineLazyBinding(Ti, 'API'); // Basically does the same thing iOS does for API module (lazy property getter)

		// Here, we go through all the specially marked APIs to generate the wrappers to pass in the sourceUrl
		// TODO: This is all insane, and we should just bake it into the Proxy conversion stuff to grab and pass along sourceUrl
		// Rather than carry it all over the place like this!
		// We already need to generate a KrollInvocation object to wrap the sourceUrl!
		function TitaniumWrapper(context) {
			const sourceUrl = this.sourceUrl = context.sourceUrl;
			const scopeVars = new kroll.ScopeVars({ sourceUrl });
			Ti.bindInvocationAPIs(this, scopeVars);
		}
		TitaniumWrapper.prototype = Ti;
		Ti.Wrapper = TitaniumWrapper;

		// -----------------------------------------------------------------------
		// This loops through all known APIs that require an
		// Invocation object and wraps them so we can pass a
		// source URL as the first argument
		Ti.bindInvocationAPIs = function (wrapperTi, scopeVars) {
			for (const api of Ti.invocationAPIs) {
				// separate each invoker into it's own private scope
				invoker.genInvoker(wrapperTi, Ti, 'Titanium', api, scopeVars);
			}
		};

		ProxyBootstrap(tiBinding, Ti);

		return new TitaniumWrapper({
			// Even though the entry point is really ti://kroll.js, that will break resolution of urls under the covers!
			// So basically just assume app.js as the relative file base
			sourceUrl: 'app://app.js'
		});
	} else if (OS_IOS) {
		// On iOS, really we just need to set up the TopTiModule binding stuff, then hang lazy property getters for the top-level modules like UI, API, etc
		const Ti = kroll.binding('topTi');
		const modules = [
			'Accelerometer', 'Analytics', 'App', 'API', 'Calendar', 'Codec', 'Contacts',
			'Database', 'Filesystem', 'Geolocation', 'Gesture', 'Locale', 'Media',
			'Network', 'Platform', 'Stream', 'Utils', 'UI', 'WatchSession', 'XML'
		];
		for (const modName of modules) {
			// This makes the namespace "lazy" - we instantiate it on demand and then
			// replace the lazy init with straight property value when done
			Object.defineProperty(Ti, modName, {
				configurable: true, // must be configurable to be able to change the property to static value after access
				enumerable: false,
				// writable: true, // cannot specify writable with a getter
				get: function () {
					const realModule = kroll.binding(modName);
					// Now replace our lazy getter on the property with a value
					Object.defineProperty(Ti, modName, {
						configurable: false,
						enumerable: false,
						writable: false,
						value: realModule
					});
					return realModule;
				}
			});
		}
		return Ti;
	}
}
