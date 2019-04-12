const tty = {
	isatty: () => false,
	ReadStream: () => {
		throw new Error('tty.ReadStream is not implemented');
	},
	WriteStream: () => {
		throw new Error('tty.WriteStream is not implemented');
	}
};

export default tty;
