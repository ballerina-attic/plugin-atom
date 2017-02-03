'use babel';
import { CompositeDisposable } from 'atom'
console.log(require('path'))

let BallerinaLexer = require('./generated-parser/BallerinaLexer')
let BallerinaParser = require('./generated-parser/BallerinaParser');

let antlr4 = require('./antlr4/index');
require('./js/jquery-1.7.1.min');
require('./js/utils');

DOMListener = require('dom-listener')
let SubAtom = require('sub-atom')
let subs = new SubAtom

makerValueHolderArray = new Array();
markerCounter = 0;
subscriptions2 = new CompositeDisposable()

export default {

  subscriptions: null,
  packageView: null,

  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'language-ballerina:parse': () => this.parse()
    }))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  parse() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      for (i = 0; i < makerValueHolderArray.length; i++) {
          let marker = makerValueHolderArray[i];
          marker.destroy();
      }
      makerValueHolderArray = new Array();
      markerCounter = 0;
      let selection = editor.getText()
      let chars = new antlr4.InputStream(selection);
      let lexer = new BallerinaLexer.BallerinaLexer(chars);
      let tokens  = new antlr4.CommonTokenStream(lexer);
      let parser = new BallerinaParser.BallerinaParser(tokens);
      parser.buildParseTrees = true;
      let tree = parser.compilationUnit();
      if(tree["parser"]["_syntaxErrors"] == 0) {
        atom.notifications.addSuccess("Parsed successfully.");
      } else {
        atom.notifications.addError("Parse unsuccessful.");
      }
    }
  }
};
