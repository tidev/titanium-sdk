
//TODO: this should be wired from native but i'm putting here so i don't forget

(function(){
 function _rm(a,b,c){a[b]=function(){c.apply(this,arguments)}}_rm(console,'debug',function(a){Ti.API.debug(a)});_rm(console,'log',function(a){Ti.API.log(a)});_rm(console,'info',function(a){Ti.API.info(a)});_rm(console,'warn',function(a){Ti.API.warn(a)});_rm(console,'error',function(a){Ti.API.error(a)})}
)();

