export function commonOptions(logger, config) {
	return {
		'log-level': {
			abbr: 'l',
			callback(value) {
				if (Object.hasOwn(logger.levels, value)) {
					logger.setLevel(value);
				}
			},
			desc: 'minimum logging level',
			default: config.cli.logLevel || 'trace',
			hint: 'level',
			values: logger.getLevels()
		}
	};
}
