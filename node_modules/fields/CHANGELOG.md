0.1.12 (1/30/2014)
-------------------
 * Fixed bug where select field validate callbacks that fail were not triggering
   the select field to reprompt correctly.

0.1.11 (9/28/2013)
-------------------
 * Fixed a bug where an exception thrown from a field's validate() function's
   callback would be caught even though the error happened in the callback,
   not the actual validate() function. Now exceptions from the callback are
   rethrown.

0.1.10 (9/28/2013)
-------------------
 * Instead of extra whitespace after errors that was added in 0.1.9, now you can
   just use a custom formatter and do whatever you'd like with the error.

0.1.9 (9/27/2013)
-------------------
 * Added one more line of whitespace after printing an error message.

0.1.8 (9/25/2013)
-------------------
 * Added missing "pre-prompt" event to File and Select fields.

0.1.7 (9/18/2013)
-------------------
 * Added "pre-prompt" and "post-prompt" events to all field types.
 * Fixed bug when instantiating a Set using the method format.
 * Moved Select field option pre-rendering to the prompt() function so that
   options can be modified prior to prompting.
 * Added "autoSelectOne" flag to Select fields to skip the prompting if there
   is only one option.
 * If a Select field doesn't have any options, it immediately fire the callback.
 * Named all public anonymous functions.

0.1.6 (9/13/2013)
-------------------
 * Added stopOnError flag to Set field. By default, an field that errors will
   break out of the set prompting, but now you can set this flag to false and it
   will continue prompting.
 * Added repromptOnError flag to all fields. If a field has a validate()
   function, then by default if it fails, then the field is re-prompted. You now
   can set this to false and it will stop prompting when an error occurs.
 * Cleaned up readme so that it hopefully is more readable.
 * Note: when a Set finished prompting for a field with a next() function, it
   now passes the error as the first argument, then the value. Before it just
   passed the value.

0.1.5 (9/10/2013)
-------------------
 * Fixed bug with file field tab completion not properly completing partial
   matches.
 * Fixed bug with file field tab completion causing an exception when
   encountering a broken symlink.

0.1.4 (7/30/2013)
-------------------
 * Fixed bug with file field tab completion not properly handling '~'
   (home directory) or directories containing a single file.

0.1.3 (7/29/2013)
-------------------
 * Fixed bug with select fields where relistOnError=true was not firing properly
   if custom validators returned an error.

0.1.2 (7/23/2013)
-------------------
 * Fixed bug set, but undefined default values being rendered as an empty string.
 * Fixed bug with default value being a number.
 * Run a select field's validate() before checking values against options so
   values can be transformed.
 * Added support for accelerators such as "e__x__it" where "x" is the
   accelerator and it maps to "exit".

0.1.1 (7/22/2013)
-------------------
 * Fixed bug with a select field instance is used more than once
 * Added screenshots to readme

0.1.0 (7/18/2013)
-------------------
 * Initial release
