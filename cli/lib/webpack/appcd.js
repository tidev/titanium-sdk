const EventEmitter = require('events');

/**
 * Creates a simplified promise-based client for Appcd
 *
 * @param {object} client A appcd-client instance
 * @return {object} Promisified wrapper around appcd-client
 */
const appcd = (client) => ({
	host: client.host,
	port: client.port,
	async connect(options) {
		return new Promise((resolve, reject) => {
			client.connect(options)
				.once('connected', resolve)
				.once('error', reject);
		});
	},
	disconnect() {
		client.disconnect();
	},
	async get(path) {
		return this.request({ path });
	},
	async post(path, data = {}) {
		return this.request({ path, data });
	},
	async request(options) {
		return new Promise((resolve, reject) => {
			client
				.request(options)
				.once('response', response => resolve(response))
				.once('error', e => reject(e));
		});
	},
	async subscribe(path) {
		return new Promise((resolve, reject) => {
			const subscription = new Subscription(path);
			client
				.request({
					path,
					type: 'subscribe'
				})
				.on('response', (data, response) => {
					if (typeof data === 'string' && data === 'Subscribed') {
						subscription.sid = response.sid;
						return resolve(subscription);
					}

					subscription.emit('message', data);
				})
				.once('close', () => {
					subscription.emit('close');
				})
				.once('finish', () => {
					subscription.emit('close');
				})
				.once('error', e => {
					if (!subscription.sid) {
						reject(e);
					} else {
						subscription.emit('error', e);
					}
				});
		});
	}
});

class Subscription extends EventEmitter {
	constructor(path) {
		super();
		this.path = path;
		this.sid = null;
	}
	async unsubscribe() {
		if (!this.sid) {
			return;
		}

		await appcd.request({
			path: this.path,
			sid: this.sid
		});
		this.sid = null;
	}
}

module.exports = appcd;
