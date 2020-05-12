export default function bootstrap(global, kroll) {
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
