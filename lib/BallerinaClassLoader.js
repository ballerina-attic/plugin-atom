'use babel';

import { _ } from 'lodash';
import { Dictionary } from './Dictionary';
import { BallerinaClassReader } from './BallerinaClassReader';
const walk = require('walk');

export class BallerinaClassLoader {

    constructor(ballerinaHome) {
        this.ballerinaHome = ballerinaHome || process.env.BALLERINA_HOME;
        this.dict = new Dictionary();
    }

    findPackage(namePrefix) {
        return this.dict.searchPackage(namePrefix);
    }

    findPackageFunctionsAndStructs(packageName, namePrefix) {
        return this.dict.searchPackageFunctionsAndStructs(packageName, namePrefix);
    }

    findStructAttributes(packageName, structName) {
        return this.dict.searchStructAttributes(packageName, structName);
    }

    findSimplePackage(namePrefix) {
        return this.dict.searchSimplePackage(namePrefix);
    }

    findPackageActions(packageName, type, action) {
        return this.dict.searchPackageActions(packageName, type, action);
    }

    findPackageToImport(packageName) {
        return this.dict.getPackageUsingPackageName(packageName);
    }

    loadSystemLibsImpl() {
        const classReader = new BallerinaClassReader(this.ballerinaHome);
        const srcPath = classReader.ballerinaSrcPath();
        if (srcPath) {
            var classMembers = true;
            promise = classReader.readAllClassesFromPath(true, srcPath, (isSystemPackage, classContent) => {
                return this._addClass(isSystemPackage, classContent);
            });
        } else {
            atom.notifications.addError('autocomplete-ballerina:' +
              '\nballerina BALLERINA_HOME not found. Create environment variable or specify location in plugin settings',
              { dismissable: true });
            promise = Promise.resolve();
        }
        return promise;
    }

    loadProjectDependencies(packageDir) {
        const classReader = new BallerinaClassReader(this.ballerinaHome);
        if (packageDir) {
            var classMembers = true;
            promise = classReader.readAllClassesFromPath(false, packageDir, (isSystemPackage, classContent, fileFolder, fileName) => {
                    return this._addClass(isSystemPackage, classContent, fileFolder, fileName);

        });
        } else {
            // TODO reject promise on error and notify about error afterwards
            atom.notifications.addError('autocomplete-ballerina:' +
                '\nballerina BALLERINA_HOME not found. Create environment variable or specify location in plugin settings',
                { dismissable: true });
            promise = Promise.resolve();
        }
        return promise;
    }


    _addClass(classNameWithPackage, classContent, fileFolder, fileName) {
        this.dict.add(classNameWithPackage, classContent, fileFolder, fileName);
        return Promise.resolve();
    }

}
