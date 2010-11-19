var getdata_url = 'http://test.archimedes.com/rich/get529coll.php';

    //app colors
var color_white        = '#FFFFFF';
var color_black        = '#000000';
var color_gray         = '#666666';
var color_gray         = '#666666';
var color_blue         = '#2A3A80';	//headers
var color_red          = '#AA0000';
var color_ltblue       = '#336699';	//text input fields
var color_searchlimits = '#FFADAD';	//Search button & results (tableview) bg color when search params are in effect

// search params (by State searches only):
//   parm_rn:  random college lookup (value ignored, but only available from State screen)
//   parm_cy:  college years (2, 4, or 0/null=either)
//   parm_pp:  public/private (1=public, 2=private, or 0/null=either)
//   parm_emn: min enrollment size (excludes schools w/no enrollment data)
//   parm_emx: max enrollment size (excludes schools w/no enrollment data)
//   parm_cmn: min cost (always out-of-state for public schools)
//   parm_cmx: max cost (always out-of-state for public schools)

    //test settings
// Ti.App.Properties.setInt('parm_cy', 4);
// Ti.App.Properties.setInt('parm_pp', 2);
// Ti.App.Properties.setInt('parm_cmn', 0);
// Ti.App.Properties.setInt('parm_cmx', 10000);
// Ti.App.Properties.setInt('parm_emn', 1000);
// Ti.App.Properties.setInt('parm_emx', 50000);

    //0-based values for app params (Settings screen; sliders use 1-based values due to Titanium bug)
var cy_vals = ['2 and 4 Year Colleges', '2-Year Colleges Only', '4-Year Colleges Only'];
var pp_vals = ['Public and Private Colleges', 'Public Colleges Only', 'Private Colleges Only'];

var stlist = [];
var i = 0;
stlist[i++] = Ti.UI.createPickerRow({code:'AL', title:'Alabama'});
stlist[i++] = Ti.UI.createPickerRow({code:'AK', title:'Alaska'});
stlist[i++] = Ti.UI.createPickerRow({code:'AZ', title:'Arizona'});
stlist[i++] = Ti.UI.createPickerRow({code:'AR', title:'Arkansas'});
stlist[i++] = Ti.UI.createPickerRow({code:'CA', title:'California'});
stlist[i++] = Ti.UI.createPickerRow({code:'CO', title:'Colorado'});
stlist[i++] = Ti.UI.createPickerRow({code:'CT', title:'Connecticut'});
stlist[i++] = Ti.UI.createPickerRow({code:'DC', title:'District of Columbia'});
stlist[i++] = Ti.UI.createPickerRow({code:'DE', title:'Delaware'});
stlist[i++] = Ti.UI.createPickerRow({code:'FL', title:'Florida'});
stlist[i++] = Ti.UI.createPickerRow({code:'GA', title:'Georgia'});
stlist[i++] = Ti.UI.createPickerRow({code:'HI', title:'Hawaii'});
stlist[i++] = Ti.UI.createPickerRow({code:'ID', title:'Idaho'});
stlist[i++] = Ti.UI.createPickerRow({code:'IL', title:'Illinois'});
stlist[i++] = Ti.UI.createPickerRow({code:'IN', title:'Indiana'});
stlist[i++] = Ti.UI.createPickerRow({code:'IA', title:'Iowa'});
stlist[i++] = Ti.UI.createPickerRow({code:'KS', title:'Kansas'});
stlist[i++] = Ti.UI.createPickerRow({code:'KY', title:'Kentucky'});
stlist[i++] = Ti.UI.createPickerRow({code:'LA', title:'Louisiana'});
stlist[i++] = Ti.UI.createPickerRow({code:'ME', title:'Maine'});
stlist[i++] = Ti.UI.createPickerRow({code:'MD', title:'Maryland'});
stlist[i++] = Ti.UI.createPickerRow({code:'MA', title:'Massachusetts'});
stlist[i++] = Ti.UI.createPickerRow({code:'MI', title:'Michigan'});
stlist[i++] = Ti.UI.createPickerRow({code:'MN', title:'Minnesota'});
stlist[i++] = Ti.UI.createPickerRow({code:'MS', title:'Mississippi'});
stlist[i++] = Ti.UI.createPickerRow({code:'MO', title:'Missouri'});
stlist[i++] = Ti.UI.createPickerRow({code:'MT', title:'Montana'});
stlist[i++] = Ti.UI.createPickerRow({code:'NE', title:'Nebraska'});
stlist[i++] = Ti.UI.createPickerRow({code:'NV', title:'Nevada'});
stlist[i++] = Ti.UI.createPickerRow({code:'NH', title:'New Hampshire'});
stlist[i++] = Ti.UI.createPickerRow({code:'NJ', title:'New Jersey'});
stlist[i++] = Ti.UI.createPickerRow({code:'NM', title:'New Mexico'});
stlist[i++] = Ti.UI.createPickerRow({code:'NY', title:'New York'});
stlist[i++] = Ti.UI.createPickerRow({code:'NC', title:'North Carolina'});
stlist[i++] = Ti.UI.createPickerRow({code:'ND', title:'North Dakota'});
stlist[i++] = Ti.UI.createPickerRow({code:'OH', title:'Ohio'});
stlist[i++] = Ti.UI.createPickerRow({code:'OK', title:'Oklahoma'});
stlist[i++] = Ti.UI.createPickerRow({code:'OR', title:'Oregon'});
stlist[i++] = Ti.UI.createPickerRow({code:'PA', title:'Pennsylvania'});
stlist[i++] = Ti.UI.createPickerRow({code:'RI', title:'Rhode Island'});
stlist[i++] = Ti.UI.createPickerRow({code:'SC', title:'South Carolina'});
stlist[i++] = Ti.UI.createPickerRow({code:'SD', title:'South Dakota'});
stlist[i++] = Ti.UI.createPickerRow({code:'TN', title:'Tennessee'});
stlist[i++] = Ti.UI.createPickerRow({code:'TX', title:'Texas'});
stlist[i++] = Ti.UI.createPickerRow({code:'UT', title:'Utah'});
stlist[i++] = Ti.UI.createPickerRow({code:'VT', title:'Vermont'});
stlist[i++] = Ti.UI.createPickerRow({code:'VA', title:'Virginia'});
stlist[i++] = Ti.UI.createPickerRow({code:'WA', title:'Washington'});
stlist[i++] = Ti.UI.createPickerRow({code:'WV', title:'West Virginia'});
stlist[i++] = Ti.UI.createPickerRow({code:'WI', title:'Wisconsin'});
stlist[i++] = Ti.UI.createPickerRow({code:'WY', title:'Wyoming'});

//#####################################################################################

function get_params() {
    var tval;
	//for each param, add it to returned object if it is not null/empty/0 value
    if ((tval = Ti.App.Properties.getInt('parm_cy'))) {
	this.cy = tval;
    }
    if ((tval = Ti.App.Properties.getInt('parm_pp'))) {
	this.pp = tval;
    }
    if ((tval = Ti.App.Properties.getInt('parm_emn'))) {
	this.emn = tval;
    }
    if ((tval = Ti.App.Properties.getInt('parm_emx'))) {
	this.emx = tval;
    }
    if ((tval = Ti.App.Properties.getInt('parm_cmn'))) {
	this.cmn = tval;
    }
    if ((tval = Ti.App.Properties.getInt('parm_cmx'))) {
	this.cmx = tval;
    }
} //get_params

//#####################################################################################

function commas(nStr, zeroval) {	//zeroval is optional arg with value to be display if nStr evals to 0
    nStr += '';		//interpret as string
    if (nStr==null || nStr*1 == 0) {	//but check for 0 (numeric) value
	return (zeroval ? zeroval : '0');
    }
    var x = nStr.split('.');
    var x1 = x[0];		//number before decimal (even if no decimal)
    var x2 = (x.length > 1 ? '.' + x[1] : '');	//preserve decimal part, if any
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
	x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
} //commas

