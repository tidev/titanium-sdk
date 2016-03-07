'use strict';
var chalk = require( 'chalk' );
var table = require( 'text-table' );

/**
 * @param {Errors[]} errorsCollection
 */
module.exports = function( errorsCollection ) {
  var errorCount = 0;
  /**
   * Formatting every error set.
   */
  var report = errorsCollection.map( function( errors ) {
    if ( ! errors.isEmpty() ) {
      errorCount += errors.getErrorCount();

      var output = errors.getErrorList().map( function( error ) {
        return [
          '',
          chalk.gray( error.line ),
          chalk.gray( error.column ),
          process.platform !== 'win32' ? chalk.blue( error.message ) : chalk.cyan( error.message )
        ];
      } );

      return [
        '',
        chalk.underline( errors.getFilename() ),
        table( output ),
        ''
      ].join('\n');
    }
    return '';
  });

  if ( errorCount ) {
    // Output results
    console.log( report.join('') );
  } else {
    console.log( 'No code style errors found.' );
  }
};

// Expose path to reporter so it can be configured in e.g. grunt-jscs-checker
module.exports.path = __dirname;
