(*
Script to wait until the iPhone Simulator is responding to AppleScript,
and then tell it to activate (come to the foreground).

We don't just want to activate it without first waiting to see if it is
running, because another script has already launched it, so if we
just did an activate now, we could end up with two instances of
the iPhone Simulator.

Usage: Call this script with one argument, which is the full path to the
iPhone Simulator's ".app" package.
*)

on run argv
	if (count of argv) is 1 then
		set iphone_simulator to item 1 of argv

		set max_wait_time to 5 --- seconds
		set delay_time to 0.01 --- seconds
		set repeat_count to max_wait_time / delay_time

		repeat repeat_count times
			if application iphone_simulator is running then
				tell application iphone_simulator to activate
				exit repeat
			end if

			delay delay_time
		end repeat
	end if
end run
