'use babel';

import {_} from 'lodash';
import ballerinaUtil from './ballerinaUtil';

class AtomBallerinaUtil {

    getCurrentPackageName(editor) {
        return this._lastMatch(editor.getText(), /package ([^;]*);/);
    }

    getImpliedCurrentPackageName(editor) {
        var projectDirPath = atom.project.getDirectories()[0].realPath;
        var projectDirs = projectDirPath.split("/");
        var projectDir = projectDirs[projectDirs.length-1];
        var filePath = editor.buffer.file.path;
        var projectFilePath = filePath.substr(filePath.indexOf(projectDir));
        var currentFileSegments = projectFilePath.split("/");
        var currentFile = currentFileSegments[currentFileSegments.length-1];
        return projectFilePath.replace("/" + currentFile, "");
    }

    getPackageName(filePath) {
        var projectDirPath = atom.project.getDirectories()[0].realPath;
        var projectDirs = projectDirPath.split("/");
        var projectDir = projectDirs[projectDirs.length-1];
        var projectFilePath = filePath.substr(filePath.indexOf(projectDir));
        var currentFileSegments = projectFilePath.split("/");
        var currentFile = currentFileSegments[currentFileSegments.length-1];
        return projectFilePath.replace("/" + currentFile, "");
    }

    getFileName(filePath) {
        var paths = filePath.split("/");
        return paths[paths.length-1].replace(".bal", "");
    }

    getPackageStructureViaPackageName(packageName, editor) {
        var importPackageRegex = new RegExp("import (.*.?(" + packageName + "));","g");
        var importPackageMatch = importPackageRegex.exec(editor.getText());
        if(importPackageMatch != null) {
            return importPackageMatch[1];
        } else {
            return null;
        }
    }
    

    getCurrentClassSimpleName(editor) {
        return editor.getTitle().split('.')[0];
    }

    getCurrentClassName(editor) {
        return this.getCurrentPackageName(editor) + '.' + this.getCurrentClassName(editor);
    }

    getImportedClassName(editor, classSimpleName) {
        return this._lastMatch(editor.getText(), new RegExp('import (.*' + classSimpleName + ');'));
    }

    getLine(editor, bufferPosition) {
        return editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    }

    getWord(editor, bufferPosition, removeParenthesis) {
        const line = this.getLine(editor, bufferPosition);
        return this.getLastWord(line, removeParenthesis);
    }

    getLastWord(line, removeParenthesis) {
        const result = this._lastMatch(line, /[^\s-]+$/);
        return removeParenthesis ? result.replace(/.*\(/, '') : result;
    }

    getPrevWord(editor, bufferPosition) {
        const words = this.getLine(editor, bufferPosition).split(/[\s\(]+/);
        return words.length >= 2 ? words[words.length - 2] : null;
    }

    importClass(editor, className, foldImports) {
        // Add import statement if import does not already exist.
        const packageName = ballerinaUtil.getPackageName(className);
        if (!this.getImportedClassName(editor, className) && packageName !== this.getCurrentPackageName(editor)) {
            this.organizeImports(editor, 'import ' + className + ';', foldImports);
        }
    }

    getImports(editor) {
        const buffer = editor.getBuffer();
        return buffer.getText().match(/import\s.*;/g) || [];
    }

    organizeImports(editor, newImport, foldImports) {
        var buffer = editor.getBuffer();
        var imports = this.getImports(editor);
        var packageStructure = this.getCurrentPackageName(editor);
        buffer.replace(/import\s.*;[\r\n]+/g, '');
        buffer.replace(/\bpackage\s.*;[\r\n]+/g, '');
        if (newImport) {
            imports.push(newImport);
        }
        for (var i = 0; i < imports.length; i++) {
            buffer.insert([0, 0], imports[i] + '\n');
        }
        if (packageStructure) {
            buffer.insert([0, 0], 'package ' + packageStructure + ';\n');
        }
    }

    foldImports(editor) {
        const firstRow = 0;
        let lastRow = 0;
        const buffer = editor.getBuffer();
        buffer.scan(/import\s.*;/g, (m) => {
            lastRow = m.range.end.row;
        });
        
        if (lastRow) {
            const pos = editor.getCursorBufferPosition();
            editor.setSelectedBufferRange([[firstRow, 0], [lastRow, 0]]);
            editor.foldSelectedLines();
            editor.setCursorBufferPosition(pos);
        }
    }

    _lastMatch(str, regex) {
        const array = str.match(regex) || [''];
        return array[array.length - 1];
    }

}

export default new AtomBallerinaUtil();
