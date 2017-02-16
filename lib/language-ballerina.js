'use babel';
import { CompositeDisposable } from 'atom'
import { BallerinaClassLoader } from './BallerinaClassLoader';
import { AtomAutocompleteProvider } from './AtomAutocompleteProvider';

let BallerinaLexer = require('./generated-parser/BallerinaLexer');
let BallerinaParser = require('./generated-parser/BallerinaParser');

let antlr4 = require('./antlr4/index');
require('./js/jquery-1.7.1.min');

DOMListener = require('dom-listener');

makerValueHolderArray = new Array();
errorLinesMap = new Array();
markerCounter = 0;
subscriptions2 = new CompositeDisposable();

class LanguageBallerina {
  constructor() {
      // console.log("BALLERINA_HOME set to: " + atom.config.get('language-ballerina.ballerinaHome'));
      this.config = require('./config.json');
      this.subscriptions = undefined;
      this.provider = undefined;
      this.classLoader = undefined;
      this.classpath = null;
      this.initialized = false;

      atom.workspace.observeTextEditors(function(editor) {
        var editorView, keypressHandler;
        editorView = atom.views.getView(editor);
        return editorView.addEventListener('keyup', keypressHandler = function(event) {
          let editor
          if (editor = atom.workspace.getActiveTextEditor()) {
            for (i = 0; i < makerValueHolderArray.length; i++) {
                let marker = makerValueHolderArray[i];
                marker.destroy();
            }
            makerValueHolderArray = new Array();
            let selection = editor.getText()
            let chars = new antlr4.InputStream(selection);
            let lexer = new BallerinaLexer.BallerinaLexer(chars);
            let tokens  = new antlr4.CommonTokenStream(lexer);
            let parser = new BallerinaParser.BallerinaParser(tokens);
            parser.buildParseTrees = true;
            let tree = parser.compilationUnit();
          }
        });
      });
    }

  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'language-ballerina:parse': () => this.parse()
    }))

    this.classLoader = new BallerinaClassLoader(atom.config.get('language-ballerina.ballerinaHome'), atom.config.get('language-ballerina.javaHome'));
    this.provider = new AtomAutocompleteProvider(this.classLoader);
      this.classLoader.loadSystemLibsImpl();
  }

  deactivate() {
    this.subscriptions.dispose()
  }

  parse() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      for (i = 0; i < makerValueHolderArray.length; i++) {
          let marker = makerValueHolderArray[i];
          marker.destroy();
      }
      makerValueHolderArray = new Array();
      let selection = editor.getText()
      let chars = new antlr4.InputStream(selection);
      let lexer = new BallerinaLexer.BallerinaLexer(chars);
      let tokens  = new antlr4.CommonTokenStream(lexer);
      let parser = new BallerinaParser.BallerinaParser(tokens);
      parser.buildParseTrees = true;
      let tree = parser.compilationUnit();
    }
  }

  getProvider() {
      return this.provider;
  }
}
export default new LanguageBallerina();
