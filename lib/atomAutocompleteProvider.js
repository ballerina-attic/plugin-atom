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
        const text = atomBallerinaUtil.getWord(editor, bufferPosition, true).replace('@', '');
        const prefix = text.substring(0, text.lastIndexOf('.'));
        const suffix = origPrefix.replace('.', '');
        if(";" !== suffix) {
            var classes;
            var suggestions = [];
            var typeDecoration;
            if("import" === prevWord) {
                var preFormattedText = text;
                if("" !== text) {
                    var n = text.lastIndexOf(".");
                    preFormattedText = text.substring(0, n);
                }
                typeDecoration = "package";
                classes = this.classLoader.findPackage(preFormattedText);
                for (var i=0; null != classes && i<classes.length; i++) {
                    var suggest = {
                        text: classes[i],
                        displayText: classes[i],
                        type: typeDecoration,
                        importPackage: false
                    };
                    suggestions.push(suggest);
                }
            } else {
                var packageRegEx = /([\w]+)/g;
                var packageMatch = packageRegEx.exec(text);
                var packageName;
                var type;
                if(packageMatch != null) {
                    if(packageMatch[0] === text) {
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
                    } else {
                        var packageAndTypeRegEx = /([\w]+):([\w]+)/g;
                        var packageAndTypeRegEx2 = /([\w]+):/g;
                        var packageAndTypeMatch = packageAndTypeRegEx.exec(text);
                        var packageAndTypeMatch2 = packageAndTypeRegEx2.exec(text);
                        if(packageAndTypeMatch != null && packageAndTypeMatch[0] === text) {
                            packageName = packageAndTypeMatch[1];
                            type = packageAndTypeMatch[2];
                            classes = this.classLoader.findPackageFunctions(packageName, type);
                            for (var i=0; null != classes && i<classes.length; i++) {
                                var class1 = classes[i].split("|");
                                var returnType;
                                if("undefined" === class1[0]) {
                                    returnType = "";
                                } else {
                                    returnType = class1[0];
                                }
                                var suggest = {
                                    text: class1[1],
                                    displayText: class1[1],
                                    leftLabel: returnType,
                                    type: 'function'
                                };
                                suggestions.push(suggest);
                            }
                        } else if (packageAndTypeMatch2 != null && packageAndTypeMatch2[0] === text) {
                            packageName = packageAndTypeMatch2[1];
                            type = "";
                            classes = this.classLoader.findPackageFunctions(packageName, type);
                            for (var i = 0; null != classes && i < classes.length; i++) {
                                var class1 = classes[i].split("|");
                                var returnType;
                                if ("undefined" === class1[0]) {
                                    returnType = "";
                                } else if (class1[0].indexOf('connector') != -1){
                                    returnType = 'connector';
                                    type = 'connector';
                                } else {
                                    returnType = class1[0];
                                    type = 'function';
                                }
                                var suggest = {
                                    text: class1[1],
                                    displayText: class1[1],
                                    leftLabel: returnType,
                                    type: type
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
                                    var class1 = classes[i].split("|");
                                    var returnType;
                                    if("undefined" === class1[0]) {
                                        returnType = "";
                                    } else {
                                        returnType = class1[0];
                                    }
                                    var suggest = {
                                        text: class1[1],
                                        displayText: class1[1],
                                        type: 'action',
                                        leftLabel: returnType
                                    };
                                    suggestions.push(suggest);
                                }
                            } else if(packageAndTypeAndActionMatch2 != null && packageAndTypeAndActionMatch2[0] === text) {
                                packageName = packageAndTypeAndActionMatch2[1];
                                type = packageAndTypeAndActionMatch2[2];
                                classes = this.classLoader.findPackageActions(packageName, type, "");
                                for (var i=0; null != classes && i<classes.length; i++) {
                                    var class1 = classes[i].split("|");
                                    var returnType;
                                    if("undefined" === class1[0]) {
                                        returnType = "";
                                    } else {
                                        returnType = class1[0];
                                    }
                                    var suggest = {
                                        text: class1[1],
                                        displayText: class1[1],
                                        type: 'action',
                                        leftLabel: returnType
                                    };
                                    suggestions.push(suggest);
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
            // Add import statement if simple class name was used as a completion text
            var packageName = suggestion.text;
            var packageStructure = this.classLoader.findPackageToImport(packageName);
            atomBallerinaUtil.importClass(editor, packageStructure, false);
        }
    }

}
