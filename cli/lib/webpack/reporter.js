const LogUpdate = require('./log-update');

/**
 * Webpack progress reporter.
 *
 * Based on the fancy reporter from webpackbar, modified to work with the
 * progress data reported from appcd-plugin-webpack.
 *
 * @see https://github.com/nuxt/webpackbar/blob/894a16bcb000c448570ccdc96ddd9a5cef9dfc95/src/reporters/fancy.js
 */
class ProgressBarReporter {
	constructor() {
		this.lastRender = Date.now();
		this.logUpdate = new LogUpdate();
	}

	start() {
		this.renderProgress({
			progress: -1,
			message: 'Starting ...'
		});
	}

	done(data) {
		this.renderProgress({
			progress: 100,
			message: '',
			hasErrors: data.hasErrors
		});
		this.logUpdate.done();
	}

	progress(state) {
		if (Date.now() - this.lastRender > 50) {
			this.renderProgress(state);
		}
	}

	renderProgress(state) {
		let line1;
		let line2;
		let details = state.details || [];

		if (state.progress >= 0 && state.progress < 100) {
			line1 = [
				'● webpack'.green,
				this.renderBar(state.progress),
				state.message,
				`(${state.progress || 0}%)`,
				`${details[0] || ''}`.gray,
				`${details[1] || ''}`.gray
			].join(' ');

			let colorizedRequest = '';
			if (state.request) {
				colorizedRequest = state.request.split('❱')
					.map(v => v.gray)
					.join(' ❱ '.blue);
			}
			line2 = colorizedRequest;
		} else {
			let icon = ' ';

			if (state.hasErrors) {
				icon = '✖';
			} else if (state.progress === 100) {
				icon = '✔';
			} else if (state.progress === -1) {
				icon = '◯';
			}

			line1 = `${icon} webpack`.green;
			line2 = `  ${state.message}`.gray;
		}

		this.lastRender = Date.now();
		this.logUpdate.render(`\n${line1}\n${line2}\n`);
	}

	renderBar(progress) {
		const barLength = 25;
		const fillWidth = progress * (barLength / 100);
		const background = '█'.white;
		const foreground = '█'.green;
		const range = [];
		for (let i = 0; i < barLength; i++) {
			range.push(i);
		}

		return range
			.map(i => (i < fillWidth ? foreground : background))
			.join('');
	}
}

class SimpleReporter {
	constructor(logger) {
		this.logger = logger;
	}

	start() {
		const badge = ' WAIT '.bgCyan.black;
		this.logger.info(`${badge} ${'Compiling ...'.cyan}`);
	}

	progress() {

	}

	done() {

	}
}

module.exports = {
	ProgressBarReporter,
	SimpleReporter
};
