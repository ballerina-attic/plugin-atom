'use babel';

import { _ } from 'lodash';
import ioUtil from './ioUtil';
const walk = require('walk');

export class BallerinaClassReader {

  constructor(loadClassMembers, ignoreInnerClasses, ballerinaHome) {
    this.loadClassMembers = loadClassMembers;
    this.ignoreInnerClasses = ignoreInnerClasses;
    this.ballerinaHome = ballerinaHome;
  }

  readAllClassesFromClasspath(classpath, callback) {
    let serialPromise = Promise.resolve();
    // We split with ; on Windows
    const paths = classpath.split(classpath.indexOf(';') !== -1 ? ';' : ':');
    _.each(paths, path => {
      if (path) {
        // TODO
        serialPromise = serialPromise.then(() => {
          return this.readAllClassesFromPath(path, callback);
        });
      }
    });
    return serialPromise;
  }

  readAllClassesFromPath(path, callback) {
    let promise = null;
    // Gather all class files from a directory and its subdirectories
    const classFilePaths = [];
    promise = new Promise((resolve) => {
          const walker = walk.walk(path, () => { });
      walker.on('directories', (root, dirStatsArray, next) => { next(); });
      walker.on('file', (root, fileStats, next) => {
          if (fileStats.name.endsWith('.bal')) {
          const classFilePath = (root + '/' + fileStats.name)
              .replace(path + '/', '').replace(path + '\\', '');
          classFilePaths.push(classFilePath);
        }
        next();
      });
      walker.on('errors', (root, nodeStatsArray, next) => { next(); });
      walker.on('end', () => { resolve(); });
    });
    // Read classes
    return promise.then(() => {
          return this.readClassesByName(path, classFilePaths, true, callback);
    });

  }

  readClassesByName(classpath, cNames, parseArgs, callback) {
    // Filter and format class names from cNames that can be either
    // class names or file paths
    const classNames = _(cNames).filter((className) => {
      return className && (className.indexOf('$') === -1 ||
        !this.ignoreInnerClasses);
    }).map((className) => {
      return className.replace('.bal', '').replace(/[\/\\]/g, '.').trim();
    }).value();
      // console.log(classNames);
    let promise = null;

    if (this.loadClassMembers) {
      // Read class info with ballerinap
      promise = this.readClassesByNameWithBallerinap(classpath, classNames, cNames, parseArgs, callback);
    } else {
      // Just do callback with class name only
      _.each(classNames, (className) => {
        //classpath and ballerina.lang.map.map
        callback(classpath, { className: className });
      });
      promise = Promise.resolve();
    }
    return promise;
  }

  readClassesByNameWithBallerinap(classpath, classNamesArray, cNames, parseArgs, callback) {
    let serialPromise = Promise.resolve();
      _.each(cNames, (cName) => {
          // console.log(cName);
          ///Users/ramindu/wso2/git/ballerina/ballerina/modules/distribution/target/ballerina-0.8.0-SNAPSHOT/src/ and ballerina.lang.map.map
          promise = ioUtil.readFile(classpath + cName).then(ballerinaClass => {
                // let serialPromise = Promise.resolve();
                // const classDesc = this.parseBallerinapClass(ballerinapClass, parseArgs);
                //   console.log(ballerinaClass);
                callback(cName, ballerinaClass);
          });
        });
    return serialPromise;
  }

  ballerinaSrcPath() {
    const baseDir = this.ballerinaHome; //|| process.env.BALLERINA_HOME;
    if (baseDir) {
      return baseDir.replace(/[\/\\]$/, '') + '/src/';
    }
    return '';
  }
  ballerinaBrePath() {
    const baseDir = this.ballerinaHome; //|| process.env.BALLERINA_HOME;
    if (baseDir) {
      return baseDir.replace(/[\/\\]$/, '') + '/bre/lib/ballerina-native-0.8.0-M4.jar';
    }
    return '';
  }

}
