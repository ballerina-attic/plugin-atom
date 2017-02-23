'use babel';

import { _ } from 'lodash';
import ioUtil from './ioUtil';
import atomBallerinaUtil from './atomBallerinaUtil';
const walk = require('walk');

export class BallerinaClassReader {

    constructor(loadClassMembers, ignoreInnerClasses, ballerinaHome) {
        this.loadClassMembers = loadClassMembers;
        this.ignoreInnerClasses = ignoreInnerClasses;
        this.ballerinaHome = ballerinaHome;
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
              return this.readClassesByName(path, classFilePaths, callback);
        });

    }

    readClassesByName(classpath, cNames, callback) {
        // Filter and format class names from cNames that can be either
        // class names or file paths
        // console.log(cNames);
        // console.log(classpath);
        // var folderStructure = classpath.split("/");
        // var fileFolder = folderStructure[folderStructure.length-2];
        let serialPromise = Promise.resolve();
        _.each(cNames, (cName) => {
            promise = ioUtil.readFile(classpath + cName).then(ballerinaClass => {
                console.log(classpath + cName);
                var fileFolder = atomBallerinaUtil.getPackageName(classpath + cName);
                callback(ballerinaClass, fileFolder);
            });
        });
        return serialPromise;
    }

    ballerinaSrcPath() {
        const baseDir = this.ballerinaHome;
        if (baseDir) {
          return baseDir.replace(/[\/\\]$/, '') + '/src/';
        }
        return '';
    }
}
