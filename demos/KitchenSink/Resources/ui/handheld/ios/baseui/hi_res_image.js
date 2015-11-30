function hires_img(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	win.backgroundImage = "/images/fence.jpg";
	return win;
};

module.exports = hires_img;