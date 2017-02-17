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

      //extending the antlr4 syntaxError function
      ConsoleErrorListener.prototype.syntaxError = (function(_super) {
          return function(ecognizer, offendingSymbol, line, column, msg, e) {
              line--;
          		let editor
          		if (editor = atom.workspace.getActiveTextEditor()) {
          		   let range = [[line, 0], [line , 0]]
          		   let marker = editor.markBufferRange(range, {invalidate: 'never'})
          		   let decoration = editor.decorateMarker(marker, {type: 'line-number', class: "red-square id"+markerCounter})

          		   var listener = new DOMListener(document.querySelector('.line-numbers'))
          		   let disposable;
          		   listener.add('div.line-number.red-square.id'+markerCounter, 'mouseover', function(event) {
          		      disposable = atom.tooltips.add(event.target, {
          		              title: "line " + line + ":" + column + " " + msg,
          		              trigger: 'manual',
          		              html: true,
          		                  class: "error"
          		            });
          		   });
          		   listener.add('div.line-number.red-square.id'+markerCounter, 'mouseout', function(event) {
                   if(null != disposable) {
                     disposable.dispose();
                   }
          		   });
          		   errorLinesMap.push(line);
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

  _onChange(paneItem) {
    this.parse();
  }
}
export default new LanguageBallerina();
