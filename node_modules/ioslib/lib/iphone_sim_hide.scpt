(*
Script to hide iPhone simulator window

Usage: Call this script with one argument, which is the full path to the
iPhone Simulator's ".app" package.
*)

on run argv
	if (count of argv) is 1 then
		set iphone_simulator to item 1 of argv
		tell application iphone_simulator to set visible to false
	end if
end run
