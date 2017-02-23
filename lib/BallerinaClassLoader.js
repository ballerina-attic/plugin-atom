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

    setBallerinaHome(ballerinaHome) {
        this.ballerinaHome = ballerinaHome;
    }

    findClass(namePrefix) {
        return this.dict.search(namePrefix);
    }

    findPackage(namePrefix) {
        return this.dict.searchPackage(namePrefix);
    }

    findPackageFunctions(packageName, namePrefix) {
        return this.dict.searchPackageFunctions(packageName, namePrefix);
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

    findSuperClassName(className) {
        const classes = this.findClass(className);
        const clazz = _.find(classes, c => {
            return c.className === className;
        });
        return clazz ? clazz.extend : null;
    }

    findClassMember(className, namePrefix) {
        return this.dict.find(className, namePrefix);
    }

    touchClass(className) {
        const classDescs = this.findClass(className);
        if (classDescs.length) {
            this.touch(classDescs[0]);
        }
    }

    touch(classDesc) {
        this.dict.touch(classDesc);
    }

    loadSystemLibsImpl() {
        const classReader = new BallerinaClassReader(true, true, this.ballerinaHome);
        const srcPath = classReader.ballerinaSrcPath();
        if (srcPath) {
            var classMembers = true;
            promise = classReader.readAllClassesFromPath(srcPath, (classContent) => {
                return this._addClass(classContent);
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

    loadProjectDependencies(packageDir) {
        const classReader = new BallerinaClassReader(true, true, this.ballerinaHome);
        if (packageDir) {
            var classMembers = true;
            promise = classReader.readAllClassesFromPath(packageDir, (classContent, fileFolder) => {
                    return this._addClass(classContent, fileFolder);

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


    _addClass(classNameWithPackage, classContent, fileFolder) {
        // console.log(classNameWithPackage);
        // console.log(classContent);
        // ballerina/lang/exceptions/natives.bal
        this.dict.add(classNameWithPackage, classContent, fileFolder);
        return Promise.resolve();
    }

}
