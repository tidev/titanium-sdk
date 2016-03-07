"use strict";

var Checker = require( "jscs" ),
    jscsConfig = require( "jscs/lib/cli-config" ),

    assign = require( "lodash" ).assign,
    hooker = require( "hooker" );

exports.init = function( grunt ) {

    // Task specific options
    var taskOptions = [ "config", "force", "reporter", "reporterOutput" ];

    /**
     * @see jQuery.isEmptyObject
     * @private
     */
    function isEmptyObject( obj ) {
        var name;

        for ( name in obj ) {
            return false;
        }

        return true;
    }

    /**
     * Default reporter
     * @private
     * @param {errorsCollection} errorsCollection
     */
    function defaultReporter( errorsCollection ) {
        errorsCollection.forEach( function( errors ) {
            if ( !errors.isEmpty() ) {
                errors.getErrorList().forEach( function( error ) {
                    grunt.log.writeln( errors.explainError( error, true ) );
                } );
            }
        } );
    }

    /**
     * Create new instance of jscs Checker module
     * @constructor
     * @param {Object} options
     * @return {JSCS}
     */
    function JSCS( options ) {
        this.checker = new Checker();
        this.options = options;
        this._reporter = null;

        this.checker.registerDefaultRules();
        this.checker.configure( this.getConfig() );

        this.registerReporter( options.reporter );
    }

    /**
     * @see Checker#checkPath
     */
    JSCS.prototype.check = function( path ) {
        var checkPath = this.checker.checkPath( path );

        checkPath.fail( function( error ) {
            grunt.warn( error );
        } );

        return checkPath;
    };

    /**
     * @see Checker#fix
     */
    JSCS.prototype.fix = function( path ) {
        var fixPath = this.checker.fixPath( path );

        fixPath.fail( function( error ) {
            grunt.warn( error );
        } );

        return fixPath;
    };

    /**
     * Get config
     * @return {Object}
     */
    JSCS.prototype.getConfig = function() {
        var configOption = this.options.config,
            config = this.findConfig(),
            options = this.getOptions();

        // If the config option is null, but we have inline options,
        // we'll only use them as our config.
        if ( configOption == null && !isEmptyObject( options ) ) {
            config = options;

        } else {
            assign( config, options );
        }

        this.throwForConfig( config );

        return config;
    };

    /**
     * Throw if something wrong with config file or with inline options
     * @param {Object} config
    **/
    JSCS.prototype.throwForConfig = function( config ) {
        var configOption = this.options.config;

        if ( isEmptyObject( config ) ) {
            if ( configOption && typeof configOption === "string" ) {
                if ( grunt.file.exists( configOption ) ) {
                    grunt.fatal( "\"" + configOption + "\" config is empty" );

                } else {
                    grunt.fatal( "The config file \"" + configOption + "\" was not found" );
                }

            } else {
                grunt.fatal( "Neither config file nor grunt options were defined" );
            }
        }

        return this;
    };

    /**
     * Read config file
     * @return {Object}
     */
    JSCS.prototype.findConfig = function() {
        var config = this.options && this.options.config;

        // If falsy value different than undefined was given, we'll return empty object
        if ( !config && config != null ) {
            return {};
        }

        // true or null will use default jscs config loader
        config = config === true ? null : config;
        return jscsConfig.load( config, process.cwd() ) || {};
    };

    /**
     * Get inline options
     * @return {Object}
     */
    JSCS.prototype.getOptions = function() {
        var option,
            _options = {};

        // Copy options to another object so this method would not be destructive
        for ( option in this.options ) {

            // If to jscs would be given a grunt task option
            // that not defined in jscs it would throw
            if ( !~taskOptions.indexOf( option ) ) {
                _options[ option ] = this.options[ option ];
            }
        }

        return _options;
    };

    /**
     * Register reporter
     * @param {String} name - name or path to the reporter
     * @return {Reporter|null}
     */
    JSCS.prototype.registerReporter = function( name ) {
        if ( !name ) {
            this._reporter = defaultReporter;

            return this;
        }

        var reporter = jscsConfig.getReporter( name );

        if ( reporter.writer ) {
            this._reporter = reporter.writer;

            return this;
        }

        grunt.fatal( "Reporter \"" + reporter.path + "\" does not exist" );
    };

    /**
     * Return reporter
     * @return {Reporter}
     */
    JSCS.prototype.getReporter = function() {
        return this._reporter;
    };

    /**
     * Set errors collection as instance property
     * @param {errorsCollection} errorsCollection
     */
    JSCS.prototype.setErrors = function( errorsCollection ) {

        // Filter excluded files ("excludeFiles" option)
        this._errors = errorsCollection.filter( function( errors ) {
            return errors;
        } );

        return this;
    };

    /**
     * Return instance errors
     * @return {Array}
     */
    JSCS.prototype.getErrors = function() {
        return this._errors;
    };

    /**
     * Count and return errors
     * @param {errorsCollection} [errorsCollection]
     * @return {Number}
     */
    JSCS.prototype.count = function() {
        var result = 0;

        this._errors.forEach( function( errors ) {
            result += errors.getErrorCount();
        } );

        return result;
    };

    /**
     * Send errors to the reporter
     * @return {JSCS}
     */
    JSCS.prototype.report = function() {
        var options = this.options,
            shouldHook = options.reporterOutput,
            content = "";

        if ( shouldHook ) {
            hooker.hook( process.stdout, "write", {
                pre: function( out ) {
                    content += out;

                    return hooker.preempt();
                }
            } );
        }

        this._result = this._reporter( this._errors );

        if ( shouldHook ) {
            grunt.file.write( options.reporterOutput, content );
            hooker.unhook( process.stdout, "write" );
        }

        return this;
    };

    /**
     * Print number of found errors
     * @return {JSCS}
     */
    JSCS.prototype.notify = function() {
        var errorCount = this.count();

        if ( errorCount ) {
            grunt.log.error( errorCount + " code style errors found!" );

        } else {
            grunt.log.ok( this._errors.length + " files without code style errors." );
        }

        return this;
    };

    return JSCS;
};
