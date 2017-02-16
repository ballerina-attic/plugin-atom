'use babel';

import { _ } from 'lodash';
import { Dictionary } from './Dictionary';
import { BallerinaClassReader } from './BallerinaClassReader';
import ioUtil from './ioUtil';
import ballerinaUtil from './ballerinaUtil';
const walk = require('walk');

export class BallerinaClassLoader {

  constructor(ballerinaHome, javaHome) {
    this.javaHome = javaHome || process.env.JAVA_HOME;
    this.ballerinaHome = ballerinaHome;
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
    const classReader = new BallerinaClassReader(true, true, this.ballerinaHome, this.javaHome);
    const rtJarPath = classReader.ballerinaSrcPath();
    // console.log(rtJarPath);
    if (rtJarPath) {
      var classMembers = true;
      promise = classReader.readAllClassesFromClasspath(rtJarPath, (className, classContent) => {
            return this._addClass(className, classContent);
    });
    } else {
      // TODO reject promise on error and notify about error afterwards
      atom.notifications.addError('autocomplete-ballerina:\nballerina ballerina-native.jar not found',
          { dismissable: true });
      promise = Promise.resolve();
    }
    return promise;
  }

  _addClass(className, classContent) {
    // console.log(className);
    // console.log(classContent);
    this.dict.add(className, classContent);
    return Promise.resolve();
  }

  // _addClassMember(classDesc, member, lastUsed) {
  //   try {
  //     const simpleName = ballerinaUtil.getSimpleName(classDesc.className);
  //     const prototype = member.replace(/\).*/, ');')
  //         .replace(/,\s/g, ',').trim();
  //     if (prototype.indexOf('{') !== -1) {
  //       // console.log('?? ' + prototype);
  //     } else {
  //       let type = null;
  //       if (prototype.indexOf(classDesc.className + '(') !== -1) {
  //         type = 'constructor';
  //       } else if (prototype.indexOf('(') !== -1) {
  //         type = 'method';
  //       } else {
  //         type = 'property';
  //       }
  //
  //       const name = type !== 'constructor' ?
  //           prototype.match(/\s([^\(\s]*)[\(;]/)[1] : classDesc.simpleName;
  //       const paramStr = type !== 'property' ?
  //           prototype.match(/\((.*)\)/)[1] : null;
  //       const key = name + (type !== 'property' ? '(' + paramStr + ')' : '');
  //
  //       const memberDesc = {
  //         type: type,
  //         name: name,
  //         simpleName: simpleName,
  //         className: classDesc.className,
  //         packageName: classDesc.packageName,
  //         lastUsed: lastUsed || 0,
  //         classDesc: classDesc,
  //         member: {
  //           name: name,
  //           returnType: type !== 'constructor'
  //               ? _.last(prototype.replace(/\(.*\)/, '')
  //               .match(/([^\s]+)\s/g)).trim()
  //               : classDesc.className,
  //           visibility: this._determineVisibility(prototype),
  //           params: paramStr ? paramStr.split(',') : null,
  //           prototype: prototype,
  //         },
  //       };
  //       if (type === 'constructor') {
  //         classDesc.constructors.push(memberDesc);
  //       } else {
  //         // const key = (prototype.match(/\s([^\s]*\(.*\));/) ||
  //         //   prototype.match(/\s([^\s]*);/))[1];
  //         this.dict.add(classDesc.className, key, memberDesc);
  //         classDesc.members.push(memberDesc);
  //       }
  //     }
  //   } catch (err) {
  //     // console.warn(err);
  //   }
  // }

}
