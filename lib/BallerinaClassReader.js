'use babel';

import { _ } from 'lodash';
import ioUtil from './ioUtil';
import atomBallerinaUtil from './atomBallerinaUtil';
const walk = require('walk');

export class BallerinaClassReader {

    constructor(ballerinaHome) {
        this.ballerinaHome = ballerinaHome;
    }

    readAllClassesFromPath(isSystemPackage, path, callback) {
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
              return this.readClassesByName(isSystemPackage, path, classFilePaths, callback);
        });

    }

    readClassesByName(isSystemPackage, classpath, cNames, callback) {
        let serialPromise = Promise.resolve();
        _.each(cNames, (cName) => {
            promise = ioUtil.readFile(classpath + cName).then(ballerinaClass => {
                var fileFolder = atomBallerinaUtil.getPackageName(classpath + cName);
                var fileName = atomBallerinaUtil.getFileName(classpath + cName);
                callback(isSystemPackage, ballerinaClass, fileFolder, fileName);
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
