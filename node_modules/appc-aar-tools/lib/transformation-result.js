/* jshint node: true, esversion: 6 */
'use strict';

/**
 * Simple data structure to store information about the transformation result
 */
class TransformationResult {
  /**
   * Constructs a new transformation result
   */
  constructor() {
    this.jars = [];
    this.packageName = null;
  }

  /**
   * Adds the path of a .jar to the set of found JARs inside the AAR
   */
  addJar(jarName) {
    this.jars.push(jarName);
  }
}

module.exports = TransformationResult;
