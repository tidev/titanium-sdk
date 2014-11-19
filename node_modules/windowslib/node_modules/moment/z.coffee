moment = require './moment'

moment().add(moment.duration('m', 5))
moment.duration().add(moment.duration('m', 5))

moment().subtract(moment.duration(5, 'm'))
moment.duration().subtract(moment.duration(5, 'm'))
