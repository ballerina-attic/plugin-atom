'use babel';
import { CompositeDisposable } from 'atom'
import { BallerinaClassLoader } from './BallerinaClassLoader';
import { AtomAutocompleteProvider } from './atomAutocompleteProvider';

let BallerinaLexer = require('./generated-parser/BallerinaLexer');
let BallerinaParser = require('./generated-parser/BallerinaParser');

var ConsoleErrorListener = require('./antlr4/error/ErrorListener').ConsoleErrorListener;
let antlr4 = require('./antlr4/index');
require('./js/jquery-1.7.1.min');

DOMListener = require('dom-listener');
SubAtom = require('sub-atom');

makerValueHolderArray = new Array();
errorLinesMap = new Array();
errorListeners = new Array();
markerCounter = 0;

grammerBallerina = false;
currentPanelId = -1;
currentEditor = null;
errorListener = null;

class LanguageBallerina {
  constructor() {
      this.config = require('./config.json');
      this.subscriptions = undefined;
      this.provider = undefined;
      this.classLoader = undefined;
      this.classpath = null;
      this.initialized = false;
      this.listener = null;
      atom.workspace.observeTextEditors(function(editor) {
        var editorView, keypressHandler;
        editorView = atom.views.getView(editor);
        return editorView.addEventListener('keyup', keypressHandler = function(event) {
          if(grammerBallerina) {
            if(null != this.listener) {
              this.listener.destroy();
            }
            let editor
            if (editor = atom.workspace.getActiveTextEditor()) {
              for (i = 0; i < makerValueHolderArray.length; i++) {
                  let marker = makerValueHolderArray[i];
                  marker.destroy();
              }
              for (i = 0; i < errorListeners.length; i++) {
                  let listener = errorListeners[i];
                  listener.dispose();
              }
              errorLinesMap = new Array();
              errorListeners = new Array();
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
        });
      });
      //extending the antlr4 syntaxError function
      ConsoleErrorListener.prototype.syntaxError = (function(_super) {
          return function(ecognizer, offendingSymbol, line, column, msg, e) {
              line--;
          		let editor = currentEditor;
          		if (editor = atom.workspace.getActiveTextEditor()) {
          			 let range = [[line, 0], [line , 0]]
          			 let marker = editor.markBufferRange(range, {invalidate: 'never'})
          			 let decoration = editor.decorateMarker(marker, {type: 'line-number', class: "red-square id"+markerCounter + '-' + currentPanelId})
                 if(null != this.listener) {
                   this.listener.destroy();
                 }
                 let errorClass = 'div.line-number.red-square.id' + markerCounter + '-' + currentPanelId;
          			 let disposable;
                 if(!errorLinesMap[errorClass]) {
                   let eventHandler = errorListener.add(errorClass, 'mouseover', function(event) {
            					disposable = atom.tooltips.add(event.target, {
            									title: "line " + line + ":" + column + " " + msg,
            									trigger: 'manual',
            									html: true,
            									class: "error"
            								});
            			 });
                   errorListeners.push(eventHandler);
            			 eventHandler = errorListener.add(errorClass, 'mouseout', function(event) {
            				  disposable.dispose();
            			 });
                   errorListeners.push(eventHandler);
                 }
                //  subs.add(errorClass, 'mouseover', function(event) {
                //     console.log("NEWWW");
                //  })
          			 errorLinesMap.push(errorClass);
          			 makerValueHolderArray.push(marker);
          		}
          };
      })(ConsoleErrorListener.prototype.syntaxError);
    }

  activate() {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'language-ballerina:parse': () => this.parse()
    }))

    // Listen for buffer change
    this.subscriptions.add(
      atom.workspace.onDidStopChangingActivePaneItem((paneItem) => {
        this._onChange(paneItem);
      })
    );

    this.classLoader = new BallerinaClassLoader(atom.config.get('language-ballerina.ballerinaHome'));
    this.provider = new AtomAutocompleteProvider(this.classLoader);
    this.classLoader.loadSystemLibsImpl();

  }

  deactivate() {
    this.subscriptions.dispose()
  }

  parse() {
    if(grammerBallerina) {
      if(null != this.listener) {
        this.listener.destroy();
      }
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        for (i = 0; i < makerValueHolderArray.length; i++) {
            let marker = makerValueHolderArray[i];
            marker.destroy();
        }
        for (i = 0; i < errorListeners.length; i++) {
            let listener = errorListeners[i];
            listener.dispose();
        }
        errorLinesMap = new Array();
        errorListeners = new Array();
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
  }

  getProvider() {
      return this.provider;
  }

  _onChange(paneItem) {
    // subs = new SubAtom(document.querySelector('.line-numbers'));
    errorListener = new DOMListener(document.querySelector('.line-numbers'));
    if(null != paneItem && null != paneItem.id && null != atom.workspace.getActiveTextEditor()) {
        currentEditor = atom.workspace.getActiveTextEditor();
        currentPanelId = paneItem.id;
        if ("Ballerina" === atom.workspace.getActiveTextEditor().getGrammar().name) {
          grammerBallerina = true;
        } else {
          grammerBallerina = false;
        }
        this.parse();
    }
  }
}
export default new LanguageBallerina();
