'use babel';


export class Dictionary {

    constructor() {
        this.head = {key: "", children: []};
        this.tail = [];
    }

    add(packageContent, fileFolder) {
        var regEx = /package (.*)\b[;]?/g;
        var match = regEx.exec(packageContent);
        var packageStructure;
        if(match !== null) {
            packageStructure = match[1];
        } else {
            packageStructure = fileFolder;
        }
        // console.log("package structure: " + packageStructure);
        var currentPackages = packageStructure.split(".");
        var curNode = this.head;
        var newNode = null;
        var currPosition = 0;
        var curPackage = currentPackages[currPosition];

        while(typeof curNode.children[curPackage] !== "undefined" && curPackage.length > currPosition){
            // console.log("package: " + curPackage);
            curNode = curNode.children[curPackage];
            currPosition++;
            curPackage = currentPackages[currPosition];
        }
        while(currentPackages.length > currPosition) {
            // console.log("adding new package: " + curPackage);
            currPosition++;
            newNode = {
                key : curPackage,
                value : currentPackages.length == currPosition ? packageContent : undefined,
                children : {}
            };
            curNode.children[curPackage] = newNode;
            curNode = newNode;
            curPackage = currentPackages[currPosition];
        }

        var matchPackageContentRegEx = /package (.*)\b[;]?/g;
        var matchPackageContent = matchPackageContentRegEx.exec(packageContent);
        if(matchPackageContent !== null) {
            var packageHeader = matchPackageContent[0];
            //removing package header for regex matching purpose
            packageContent = packageContent.replace(packageHeader, "\n");
        }
        curNode.packageStructure = packageStructure;
        // curNode.isSystemPackage = isSystemPackage;
        var object = {constructorList: [], functionList: [], typeconvertorList: []};

        //getting native action lists
        var nativeActionRegEx = /(w*)(\s)+((.*)(\s)*\((.*)\)(\s)*){\s+((native action (([^\s]*)(\s)*\((.*)\)(\s)*)\((.*)\).*);\s*)+/g;
        var nativeActionMatch = nativeActionRegEx.exec(packageContent);
        while(nativeActionMatch !== null) {
            var constructorObject = {};
            var constructorContent = nativeActionMatch[0];

            //get constructor types
            var constructorRegEx = /\b((.*)(\s)+((.*)(\s)+\((.*)(\s)*)){/g;
            var matchedConstructor = constructorRegEx.exec(constructorContent);
            if(matchedConstructor !== null) {
                constructorObject.constructor = matchedConstructor[5];
                constructorObject.constructorParams = matchedConstructor[4];
                constructorObject.type = matchedConstructor[2];
            }
            //get native action lists
            var actionRegEx = /((native action (([^\s]*)(\s)*\((.*)\)(\s)*)\((.*)\).*);\s*)/g;
            var matchedAction = actionRegEx.exec(constructorContent);
            constructorObject.actionList = [];
            while(matchedAction !== null) {
                var actionObject = {};
                actionObject.function = matchedAction[3];
                actionObject.returnType = matchedAction[8];
                constructorObject.actionList.push(actionObject);
                matchedAction = actionRegEx.exec(constructorContent);
            }
            object.constructorList.push(constructorObject);
            nativeActionMatch = regEx.exec(packageContent);
        }
        var functionObject;
        //getting native function lists
        var nativeFunctionRegEx = /native function ([\w]+\s*\([\w\s\d,\[\]]*\))\s*(\((.*)\))?/g;
        var nativeFunctionMatch = nativeFunctionRegEx.exec(packageContent);
        while(nativeFunctionMatch !== null) {
            functionObject = {};
            functionObject.type = "function";
            functionObject.function = nativeFunctionMatch[1];
            functionObject.returnType = nativeFunctionMatch[3];
            object.functionList.push(functionObject);
            nativeFunctionMatch = nativeFunctionRegEx.exec(packageContent);
        }

        //getting native function lists
        var functionRegEx = /function ([\w]+\s*\([\w\s\d,\[\]]*\))\s*(\((.*)\))?/g;
        var functionMatch = functionRegEx.exec(packageContent);
        while(functionMatch !== null) {
            functionObject = {};
            functionObject.type = "function";
            functionObject.function = functionMatch[1];
            functionObject.returnType = functionMatch[3];
            object.functionList.push(functionObject);
            functionMatch = functionRegEx.exec(packageContent);
        }

        //getting native typeconverter lists
        var typeConverterRegEx = /typeconvertor ([\w]+\s*\([\w\s\d,\[\]]*\))\s*(\((.*)\))?/g;
        var typeConverterMatch = typeConverterRegEx.exec(packageContent);
        while(typeConverterMatch !== null) {
            functionObject = {};
            functionObject.type = "typeconvertor";
            functionObject.function = typeConverterMatch[1];
            functionObject.returnType = typeConverterMatch[3];
            object.typeconvertorList.push(functionObject);
            typeConverterMatch = typeConverterRegEx.exec(packageContent);
        }

        //getting structs
        var structRegex = /struct[\s]+[\w\d$&+,:;=?@#|'<>.-^*()%!]+[\s]{([\s\w\d;]*)}/g;

        object.packageStructure = packageStructure;


        if(null == this.tail[curNode.key]) {
            this.tail[curNode.key] = object;
        } else {
            if(null == this.tail[curNode.key].constructorList) {
                this.tail[curNode.key].constructorList = object.constructorList
            } else {
                for (var i=0; i < object.constructorList.length; i++) {
                    this.tail[curNode.key].constructorList.push(object.constructorList[i]);
                }
            }
            if(null == this.tail[curNode.key].functionList) {
                this.tail[curNode.key].functionList = object.functionList
            } else {
                for (var i=0; i < object.functionList.length; i++) {
                    this.tail[curNode.key].functionList.push(object.functionList[i]);
                }
            }
            if(null == this.tail[curNode.key].typeconvertorList) {
                this.tail[curNode.key].typeconvertorList = object.typeconvertorList
            } else {
                for (var i=0; i < object.typeconvertorList.length; i++) {
                    this.tail[curNode.key].typeconvertorList.push(object.typeconvertorList[i]);
                }
            }
        }

    };

    searchPackage(packageStructure) {
      var curNode = this.head;
      var currPosition = 0;
      var resultArray = [];
      var property;
      if("" ===  packageStructure) {
          for (property in curNode.children) {
              if (curNode.children.hasOwnProperty(property)) {
                  resultArray.push(property);
              }
          }
          return resultArray;
      } else {
          var currentPackages = packageStructure.split(".");
          var curPackage = currentPackages[currPosition];
          while (typeof curNode.children[curPackage] !== "undefined" && curPackage.length > currPosition){
              curNode = curNode.children[curPackage];
              currPosition++;
              curPackage = currentPackages[currPosition];
          }
          if (currPosition == currentPackages.length) {
              for (property in curNode.children) {
                  if (curNode.children.hasOwnProperty(property)) {
                      resultArray.push(property);
                  }
              }
              return resultArray;
          } else {
              return null;
          }
      }
    }

    searchPackageFunctions(packageName, functionPrefix){
        var property;
        var resultArray = [];
        for (property in this.tail) {
            if (this.tail.hasOwnProperty(property)) {
                var node = this.tail[property];
                if(property === packageName) {
                    if(functionPrefix.length == 0) {
                        if(null != node.constructorList) {
                            for (var i=0; i < node.constructorList.length; i++) {
                                resultArray.push(node.constructorList[i].type + "|" + node.constructorList[i].constructor);
                                resultArray.push(node.constructorList[i].type + "|" + node.constructorList[i].constructorParams);
                            }
                        }
                        if(null != node.functionList) {
                            for (var i=0; i < node.functionList.length; i++) {
                                resultArray.push(node.functionList[i].returnType + "|" + node.functionList[i].function);
                            }
                        }
                        if(null != node.typeconvertorList) {
                            for (var i=0; i < node.typeconvertorList.length; i++) {
                                resultArray.push(node.typeconvertorList[i].returnType + "|" +node.typeconvertorList[i].function);
                            }
                        }
                    } else if (functionPrefix.length != 0) {
                        if(null != node.constructorList) {
                            for (var i=0; i < node.constructorList.length; i++) {
                                if(node.constructorList[i].constructor.indexOf(functionPrefix) == 0) {
                                    resultArray.push(node.constructorList[i].type + "|" + node.constructorList[i].constructor);
                                    resultArray.push(node.constructorList[i].type + "|" + node.constructorList[i].constructorParams);
                                }
                            }
                        }
                        if(null != node.functionList) {
                            for (var i=0; i < node.functionList.length; i++) {
                                if(node.functionList[i].function.indexOf(functionPrefix) == 0) {
                                    resultArray.push(node.functionList[i].returnType + "|" + node.functionList[i].function);
                                }
                            }
                        }
                        if(null != node.typeconvertorList) {
                            for (var i=0; i < node.typeconvertorList.length; i++) {
                                if(node.typeconvertorList[i].typeconvertor.indexOf(functionPrefix) == 0) {
                                    resultArray.push(node.typeconvertorList[i].returnType + "|" +node.typeconvertorList[i].function);
                                }
                            }
                        }
                    }
                }
            }
        }
        return resultArray;
    }

    searchPackageActions(packageName, type, action) {
        var property;
        var resultArray = [];
        for (property in this.tail) {
            if (this.tail.hasOwnProperty(property)) {
                var node = this.tail[property];
                if(property === packageName) {
                    if(null != node.constructorList) {
                        for (var i=0; i < node.constructorList.length; i++) {
                            if(node.constructorList[i].constructor === type) {
                                for (var j=0; j < node.constructorList[i].actionList.length; j++) {
                                    if("" === action) {
                                        resultArray.push(node.constructorList[i].actionList[j].returnType + "|" + node.constructorList[i].actionList[j].function);
                                    } else {
                                        if(node.constructorList[i].actionList[j].indexOf(action) == 0) {
                                            resultArray.push(node.constructorList[i].actionList[j].returnType + "|" + node.constructorList[i].actionList[j].function);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return resultArray;
    }
    
    searchSimplePackage(packageName) {
        var property;
        var resultArray = [];
        for (property in this.tail) {
            if (this.tail.hasOwnProperty(property)) {
                if(property.indexOf(packageName) == 0) {
                    resultArray.push(property);
                }
            }
        }
        return resultArray;
    }

    getPackageUsingPackageName(packageName) {
        var property;
        for (property in this.tail) {
            if (this.tail.hasOwnProperty(property)) {
                if(packageName === property) {
                    var node = this.tail[property];
                    return node.packageStructure;
                }
            }
        }
    }
}
