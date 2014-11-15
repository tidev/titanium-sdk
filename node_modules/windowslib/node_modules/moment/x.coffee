a.hasOwnProperty(b)
moment = require './moment'

inp = "2014-08-03T13:12:57.886Z"
console.log inp
d = new Date(inp)
# Sun Aug 03 2014 21:12:57 GMT+0800 (CST)
console.log "got", moment(d).format() # 'YYYY-MM-DD HH:mm:ss')
console.log "exp", "2014-08-03 09:12:57"
# "2014-08-03 09:12:57"
