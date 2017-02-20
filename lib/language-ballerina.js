'use babel';
import { CompositeDisposable } from 'atom'
import { BallerinaClassLoader } from './BallerinaClassLoader';
import { AtomAutocompleteProvider } from './atomAutocompleteProvider';

let BallerinaLexer = require('./generated-parser/BallerinaLexer');
let BallerinaParser = require('./generated-parser/BallerinaParser');

var ConsoleErrorListener = require('./antlr4/error/ErrorListener').ConsoleErrorListener;
let antlr4 = require('./antlr4/index');
require('./js/jquery-1.7.1.min');

makerValueHolderArray = [];
markerCounter = 0;
disposableTooltips = {};
errorClasses = [];
grammerBallerina = false;
currentPanelId = -1;
currentEditor = null;

class LanguageBallerina {
    constructor() {
        this.config = require('./config.json');
        this.subscriptions = undefined;
        this.provider = undefined;
        this.classLoader = undefined;

        atom.workspace.observeTextEditors(function (editor) {
            var editorView, keypressHandler;
            editorView = atom.views.getView(editor);
            return editorView.addEventListener('keyup', keypressHandler = function (event) {
                if (grammerBallerina) {
                    if (editor = atom.workspace.getActiveTextEditor()) {
                        for (var i = 0; i < makerValueHolderArray.length; i++) {
                            let marker = makerValueHolderArray[i];
                            marker.destroy();
                        }
                        for (var i = 0; i < errorClasses.length; i++) {
                            var className = errorClasses[i];
                            $(document).off('mouseover', className);
                            $(document).off('mouseout', className);
                        }
                        for (var disposableTooltip in disposableTooltips) {
                            if (disposableTooltips.hasOwnProperty(disposableTooltip)) {
                                disposableTooltips[disposableTooltip].dispose();
                            }
                        }
                        disposableTooltips = {};
                        errorClasses = [];
                        makerValueHolderArray = [];
                        let selection = editor.getText()
                        let chars = new antlr4.InputStream(selection);
                        let lexer = new BallerinaLexer.BallerinaLexer(chars);
                        let tokens = new antlr4.CommonTokenStream(lexer);
                        let parser = new BallerinaParser.BallerinaParser(tokens);
                        parser.buildParseTrees = true;
                        let tree = parser.compilationUnit();
                    }
                }
            });
        });
        //extending the antlr4 syntaxError function
        ConsoleErrorListener.prototype.syntaxError = (function (_super) {
            return function (ecognizer, offendingSymbol, line, column, msg, e) {
                line--;
                if (editor = atom.workspace.getActiveTextEditor()) {
                    let range = [[line, 0], [line, 0]];
                    let marker = editor.markBufferRange(range, {invalidate: 'never'});
                    markerCounter++;
                    let decoration = editor.decorateMarker(marker, {
                        type: 'line-number',
                        class: "red-square id" + markerCounter + '-' + currentPanelId
                    });
                    let errorClass = 'div.line-number.red-square.id' + markerCounter + '-' + currentPanelId;
                    let errorClassDivided = 'line-number red-square id' + markerCounter + '-' + currentPanelId;
                    $(document).on('mouseover', errorClass, function () {
                        disposableTooltips[errorClass] =
                            atom.tooltips.add(
                            document.getElementsByClassName(errorClassDivided)[0],
                            {
                                title: "line " + line + ":" + column + " " + msg,
                                trigger: 'manual',
                                html: true,
                                class: "error"
                            }
                        );
                    });

                    $(document).on('mouseout', errorClass, function () {
                        if(disposableTooltips[errorClass]) {
                            disposableTooltips[errorClass].dispose();
                        }
                    });
                    errorClasses.push(errorClass);
                    makerValueHolderArray.push(marker);
                }
            };
        })(ConsoleErrorListener.prototype.syntaxError);
    }

    activate() {
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'language-ballerina:parse': () => this.parse()
        }))
        // Listen for panel change
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
        if (grammerBallerina) {
            if (editor = atom.workspace.getActiveTextEditor()) {
                for (i = 0; i < makerValueHolderArray.length; i++) {
                    let marker = makerValueHolderArray[i];
                    marker.destroy();
                }
                for (var i = 0; i < errorClasses.length; i++) {
                    var className = errorClasses[i];
                    $(document).off('mouseover', className);
                    $(document).off('mouseout', className);
                }
                for (var disposableTooltip in disposableTooltips) {
                    if (disposableTooltips.hasOwnProperty(disposableTooltip)) {
                        disposableTooltips[disposableTooltip].dispose();
                    }
                }
                disposableTooltips = {};
                errorClasses = [];
                makerValueHolderArray = [];
                markerCounter = 0;
                let selection = editor.getText();
                let chars = new antlr4.InputStream(selection);
                let lexer = new BallerinaLexer.BallerinaLexer(chars);
                let tokens = new antlr4.CommonTokenStream(lexer);
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
        if (null != paneItem && null != paneItem.id && null != atom.workspace.getActiveTextEditor()) {
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
