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

  readAllClassesFromJar(jarPath, callback) {
    return ioUtil.exec('"' + this.javaBinDir() + 'jar" tf "' + jarPath + '"')
    .then(stdout => {
      const filePaths = stdout.match(new RegExp('[\\S]*\\.class', 'g'));
      return this.readClassesByName(jarPath, filePaths, false, callback);
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
      // console.log(classpath);
      // console.log(classNamesArray);
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

  // TODO: This is a quick and ugly hack. Replace with an separate
  // ballerinap parser module
  parseBallerinapClass(ballerinapClass, parseArgs) {
    let desc = null;

    if (!parseArgs) {
      const extend = ballerinapClass.match(/extends ([^\s]+)/);
      desc = {
        className: ballerinapClass.match(/(class|interface)\s(\S*)\s/)[2]
          .replace(/\<.*/g, ''),
        extend: extend ? extend[1] : null,
        members: ballerinapClass.match(/(\S.*);/g),
      };
    } else {
      desc = {
        className: null,
        extend: null,
        members: [],
        members2: [],
      };

      let status = 'header';
      let parsingArgs = false;

      _.each(ballerinapClass.split(/[\r\n]+/), l => {
        const line = l.trim();
        const lineIndent = l.match(/^\s*/)[0].length;

        if (status === 'header') {
          if (/class|interface/.test(line)) {
            // Parse class/interface name and extends
            const extend = ballerinapClass.match(/extends ([^\s]+)/);
            desc.extend = extend ? extend[1] : null;
            desc.className = ballerinapClass.match(/(class|interface)\s(\S*)\s/)[2]
              .replace(/\<.*/g, '');
          }
          if (line.indexOf('{') !== -1) {
            // Start parsing class members
            status = 'members';
          }
        } else if (status === 'members') {
          if (lineIndent === 2) {
            // Add new member
            desc.members2.push({
              prototype: line,
              args: [],
            });
            parsingArgs = false;
          } else if (lineIndent === 4) {
            parsingArgs = /MethodParameters/.test(line);
          } else if (lineIndent === 6 && parsingArgs &&
              line.indexOf(' ') === -1) {
            desc.members2[desc.members2.length - 1].args.push(line);
          } else if (line === '}') {
            status = 'end';
          }
        }
      });

      _.each(desc.members2, member => {
        let tmp = member.prototype;

        // NOTE: quick hack for generics support
        for (let i = 0; i < 5; i++) {
          const t = tmp.replace(/<(.*),\s+(.*)>/, '&lt;$1|comma|$2&gt;');
          tmp = t;
        }

        _.each(member.args, arg => {
          if (tmp.indexOf(',') !== -1) {
            tmp = tmp.replace(',', ' ' + arg + '=');
          } else {
            tmp = tmp.replace(')', ' ' + arg + ')');
          }
        });
        tmp = tmp.replace(/=/g, ',');

        // NOTE: quick hack for generics support
        tmp = tmp.replace(/&lt;/g, '<');
        tmp = tmp.replace(/&gt;/g, '>');
        tmp = tmp.replace(/\|comma\|/g, ',');

        member.prototype = tmp;
        desc.members.push(tmp);
      });
    }

    return desc;
  }

  ballerinaBinDir() {
    const baseDir = this.ballerinaHome; //|| process.env.BALLERINA_HOME;
    if (baseDir) {
      return baseDir.replace(/[\/\\]$/, '') + '/bin/';
    }
    return '';
  }
  ballerinaLinDir() {
    const baseDir = this.ballerinaHome; //|| process.env.BALLERINA_HOME;
    if (baseDir) {
      return baseDir.replace(/[\/\\]$/, '') + '/bin/';
    }
    return '';
  }
  javaBinDir() {
    const baseDir = this.javaHome || process.env.JAVA_HOME;
    if (baseDir) {
      return baseDir.replace(/[\/\\]$/, '') + '/bre/lib/ballerina-native-0.8.0-SNAPSHOT';
    }
    return '';
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
