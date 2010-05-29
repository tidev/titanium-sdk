/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
// // cause the middle section to be hidden to 
// // make it look better when keyboard is shown
// $("#email,#pass").focus(function()
// {
//    $(".connect_logo").css("display","none"); 
// });
// 
// // reshow it
// $("#email,#pass").blur(function()
// {
//    $(".connect_logo").css("display",""); 
// });
// 
// $('#login').click(function()
// {
//    $(".connect_logo").css("display",""); 
// });

// replace our HREFs to the mobile version
$("a").each(function()
{
   var href = $(this).attr("href");
   if (href.indexOf("www.facebook.")!=-1)
   {
      href = href.replace("www.facebook.","m.facebook.");
      $(this).attr("href",href);
   }
});

// set the test_cookie cookie that FB needs
$.cookie("test_cookie","1", { expires: 7, path: '/', domain: '.facebook.com', secure: false });
