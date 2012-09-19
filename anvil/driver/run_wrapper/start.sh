#!/bin/bash
process="run.sh"

if ps aux | grep -v grep | grep "$process" > /dev/null
then
        echo "<$process> still running"

else
        echo "<$process> is not running, starting..."

        # make sure we move to the location that the script lives in case this
        # script is invoked from somewhere else
        cd $(dirname $0)

        sh $process &
fi

