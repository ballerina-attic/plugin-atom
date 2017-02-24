'use babel';

import { _ } from 'lodash';
import atomBallerinaUtil from './atomBallerinaUtil';
import ballerinaUtil from './ballerinaUtil';

export class AtomAutocompleteProvider {

    constructor(classLoader) {
        this.classLoader = classLoader;
        // settings for autocomplete-plus
        this.selector = '.source.bal';
        this.disableForSelector = '.source.bal .comment';
    }

    configure(config) {
        // settings for autocomplete-plus
        this.inclusionPriority = config.inclusionPriority;
        this.excludeLowerPriority = config.excludeLowerPriority;
        this.foldImports = config.foldImports;
    }

    // autocomplete-plus
    getSuggestions({editor, bufferPosition, prefix: origPrefix}) {
        const line = atomBallerinaUtil.getLine(editor, bufferPosition);
        const prevWord = atomBallerinaUtil.getPrevWord(editor, bufferPosition);
        const text = atomBallerinaUtil.getWord(editor, bufferPosition, true);
        const prefix = text.substring(0, text.lastIndexOf('.'));
        const suffix = origPrefix.replace('.', '');
        if(";" !== suffix) {
            var classes;
            var suggestions = [];
            //importing packages
            if("import" === prevWord) {
                var preFormattedText = text;
                if("" !== text) {
                    var n = text.lastIndexOf(".");
                    preFormattedText = text.substring(0, n);
                }
                classes = this.classLoader.findPackage(preFormattedText);
                for (var i=0; null != classes && i<classes.length; i++) {
                    var suggest = {
                        text: classes[i],
                        displayText: classes[i],
                        type: "package",
                        importPackage: false
                    };
                    suggestions.push(suggest);
                }
            } else {
                var packageRegEx = /([\w]+)/g;
                var packageMatch = packageRegEx.exec(text);
                var packageName;
                var type;
                //checking whether its an annotation
                if(packageMatch != null && 0 != text.indexOf("@")) {
                    if(packageMatch[0] === text) {
                        //checking whether its a package
                        classes = this.classLoader.findSimplePackage(text);
                        for (var i=0; null != classes && i<classes.length; i++) {
                            var suggest = {
                                text: classes[i],
                                displayText: classes[i],
                                type: 'package',
                                importPackage: true
                            };
                            suggestions.push(suggest);
                        }
                        //checking whether its a function of the current package
                        packageName = atomBallerinaUtil.getCurrentPackageName(editor);
                        if(packageName || "" === packageName) {
                            packageName = atomBallerinaUtil.getImpliedCurrentPackageName(editor);
                        }
                        classes = this.classLoader.findPackageFunctionsAndStructs(packageName, text);
                        for (var i=0; null != classes && i<classes.length; i++) {
                            var suggest = {
                                text: classes[i].value,
                                displayText: classes[i].value,
                                leftLabel: classes[i].returnType,
                                type: classes[i].type,
                                packageName: packageName
                            };
                            suggestions.push(suggest);
                        }
                        
                    } else {
                        var packageAndTypeRegEx = /([\w]+):([\w]+)/g;
                        var packageAndTypeRegEx2 = /([\w]+):/g;
                        var packageAndTypeMatch = packageAndTypeRegEx.exec(text);
                        var packageAndTypeMatch2 = packageAndTypeRegEx2.exec(text);
                        if(packageAndTypeMatch != null && packageAndTypeMatch[0] === text) {
                            packageName = packageAndTypeMatch[1];
                            type = packageAndTypeMatch[2];
                            classes = this.classLoader.findPackageFunctionsAndStructs(packageName, type);
                            for (var i=0; null != classes && i<classes.length; i++) {
                                var suggest = {
                                    text: classes[i].value,
                                    displayText: classes[i].value,
                                    leftLabel: classes[i].returnType,
                                    type: classes[i].type
                                };
                                suggestions.push(suggest);
                            }
                        } else if (packageAndTypeMatch2 != null && packageAndTypeMatch2[0] === text) {
                            packageName = packageAndTypeMatch2[1];
                            type = "";
                            classes = this.classLoader.findPackageFunctionsAndStructs(packageName, type);
                            for (var i = 0; null != classes && i < classes.length; i++) {
                                var suggest = {
                                    text: classes[i].value,
                                    displayText: classes[i].value,
                                    leftLabel: classes[i].returnType,
                                    type: classes[i].type
                                };
                                suggestions.push(suggest);
                            }
                        } else {
                            var packageAndTypeAndActionRegEx = /([\w]+):([\w]+)\.([\w]+)/g;
                            var packageAndTypeAndActionRegEx2 = /([\w]+):([\w]+)\./g;
                            var packageAndTypeAndActionMatch = packageAndTypeAndActionRegEx.exec(text);
                            var packageAndTypeAndActionMatch2 = packageAndTypeAndActionRegEx2.exec(text);
                            if(packageAndTypeAndActionMatch != null && packageAndTypeAndActionMatch[0] === text) {
                                packageName = packageAndTypeAndActionMatch[1];
                                type = packageAndTypeAndActionMatch[2];
                                var action = packageAndTypeAndActionMatch[3];
                                classes = this.classLoader.findPackageActions(packageName, type, action);
                                for (var i=0; null != classes && i<classes.length; i++) {
                                    var suggest = {
                                        text: classes[i].value,
                                        displayText: classes[i].value,
                                        leftLabel: classes[i].returnType,
                                        type: classes[i].type
                                    };
                                    suggestions.push(suggest);
                                }
                            } else if(packageAndTypeAndActionMatch2 != null && packageAndTypeAndActionMatch2[0] === text) {
                                packageName = packageAndTypeAndActionMatch2[1];
                                type = packageAndTypeAndActionMatch2[2];
                                classes = this.classLoader.findPackageActions(packageName, type, "");
                                for (var i=0; null != classes && i<classes.length; i++) {
                                    var suggest = {
                                        text: classes[i].value,
                                        displayText: classes[i].value,
                                        leftLabel: classes[i].returnType,
                                        type: classes[i].type
                                    };
                                    suggestions.push(suggest);
                                }
                            } else {
                                var structVariableTypeRegex = /([\w\d$&?@#^*%]+)\./g;
                                var structVariableTypeMatch = structVariableTypeRegex.exec(text);
                                if(structVariableTypeMatch != null) {
                                    var structVariable = structVariableTypeMatch[1];
                                    var structTypeRegex = new RegExp("(([\\w\\d$&?@#^_*%]+):)?([\\w\\d$&?@_#^*%]+)[\\s]+(" + structVariable + ")","g");
                                    var structTypeMatch = structTypeRegex.exec(editor.getText());
                                    if(structTypeMatch != null) {
                                        var packageStructure;
                                        if(structTypeMatch[2] != null) {
                                            packageStructure = atomBallerinaUtil.getPackageStructureViaPackageName(structTypeMatch[2], editor);
                                        } else {
                                            packageStructure = atomBallerinaUtil.getCurrentPackageName(editor);
                                            if(packageStructure == null || packageStructure == "") {
                                                packageStructure = atomBallerinaUtil.getImpliedCurrentPackageName(editor);
                                            }
                                        }
                                        if(packageStructure != null) {
                                            classes = this.classLoader.findStructAttributes(packageStructure, structTypeMatch[3]);
                                            for (var i=0; null != classes && i<classes.length; i++) {
                                                var suggest = {
                                                    text: classes[i].name,
                                                    displayText: classes[i].name,
                                                    leftLabel: classes[i].type,
                                                    type: "attribute"
                                                };
                                                suggestions.push(suggest);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return suggestions;
        }
    }

    // autocomplete-plus
    onDidInsertSuggestion({editor, suggestion}) {
        if (suggestion.type === 'package' && suggestion.importPackage == true) {
            // Add import statement of a package name is entered.
            var packageName = suggestion.text;
            var packageStructure = this.classLoader.findPackageToImport(packageName);
            atomBallerinaUtil.importClass(editor, packageStructure, false);
        }
    }

}
