import os, subprocess, types, sys, re

def check_output_for_error(output, match, error_in_first_match):
	success = re.findall(match, output)
	if len(success) > 0:
		if (error_in_first_match):
			print "[ERROR] %s" % success[0]
			sys.exit(1)
		else:
			return True
	else:
		return False

def check_and_print_err(err, warning_regex):
	errored = False
	for line in err.splitlines():
		warning_match = None
		if warning_regex != None:
			warning_match = re.search(warning_regex, line)
		if warning_match != None:
			sys.stderr.write("[WARN] %s\n" % line)
		else:
			errored = True
			sys.stderr.write("[ERROR] %s\n" % line)
		sys.stderr.flush()
	return errored

def run(args, ignore_error=False, debug=True, ignore_output=False, warning_regex=None,
		return_error=False, return_process=False, protect_arg_positions=None):
	if debug:
		args_to_log = list(args)
		if protect_arg_positions:
			for position in protect_arg_positions:
				if position >= len(args_to_log):
					continue
				args_to_log[position] = "*" * len(args_to_log[position])

		print "[DEBUG] %s" % subprocess.list2cmdline(args_to_log)
		sys.stdout.flush()

	if ignore_output:
		subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).wait()
		return None

	process = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
	(so, se) = process.communicate()

	if type(se) != types.NoneType and len(se) > 0:
		if not ignore_error:
			err = str(se)
			if 'adb' in args[0] and ' bytes in ' in err:
				# adb emits data about compile into stderr so we ignore it in special case
				pass
			else:
				if (check_and_print_err(err, warning_regex)):
					if return_process:
						return (None, process)
					else:
						return None

	if return_error:
		if return_process:
			return so, se, process
		else:
			return so, se
	elif return_process:
		return so, process
	else:
		return so
