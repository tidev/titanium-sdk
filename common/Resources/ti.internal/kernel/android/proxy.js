/**
 * This hangs the Proxy type off Ti namespace. It also generates a hidden _properties object
 * that is used to store property values on the JS side for java Proxies.
 * Basically these get/set methods are fallbacks for when a Java proxy doesn't have a native method to handle getting/setting the property.
 * (see Proxy.h/ProxyBindingV8.cpp.fm for more info)
 * @param {object} tiBinding the underlying 'Titanium' native binding (see KrollBindings::initTitanium)
 * @param {object} Ti the global.Titanium object
 */
export default function ProxyBootstrap(tiBinding, Ti) {
	const Proxy = tiBinding.Proxy;
	Ti.Proxy = Proxy;

	Proxy.defineProperties = function (proxyPrototype, names) {
		const properties = {};
		const len = names.length;

		for (let i = 0; i < len; ++i) {
			const name = names[i];
			properties[name] = {
				get: function () { // eslint-disable-line no-loop-func
					return this.getProperty(name);
				},
				set: function (value) { // eslint-disable-line no-loop-func
					this.setPropertyAndFire(name, value);
				},
				enumerable: true
			};
		}

		Object.defineProperties(proxyPrototype, properties);
	};

	Object.defineProperty(Proxy.prototype, 'getProperty', {
		value: function (property) {
			return this._properties[property];
		},
		enumerable: false
	});

	Object.defineProperty(Proxy.prototype, 'setProperty', {
		value: function (property, value) {
			return this._properties[property] = value;
		},
		enumerable: false
	});

	Object.defineProperty(Proxy.prototype, 'setPropertiesAndFire', {
		value: function (properties) {
			const ownNames = Object.getOwnPropertyNames(properties);
			const len = ownNames.length;
			const changes = [];

			for (let i = 0; i < len; ++i) {
				const property = ownNames[i];
				const value = properties[property];

				if (!property) {
					continue;
				}

				const oldValue = this._properties[property];
				this._properties[property] = value;

				if (value !== oldValue) {
					changes.push([ property, oldValue, value ]);
				}
			}

			if (changes.length > 0) {
				this.onPropertiesChanged(changes);
			}
		},
		enumerable: false
	});
}
