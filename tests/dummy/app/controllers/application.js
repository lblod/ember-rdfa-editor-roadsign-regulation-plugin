import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import xmlFormat from 'xml-formatter';
import { basicSetup, EditorState, EditorView } from '@codemirror/basic-setup';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';

export default class ApplicationController extends Controller {
  @tracked debug;
  @tracked xmlDebuggerOpen = false;
  @tracked debuggerContent = '';
  @tracked htmlDebuggerOpen = false;
  unloadListener;
  xmlEditor;
  htmlEditor;
  plugins = ['roadsign-regulation'];
  controller;

  @tracked _editorController;

  get editorController() {
    if (!this._editorController) {
      throw new Error('Accessing controller before editor init');
    }
    return this._editorController;
  }

  get formattedXmlContent() {
    if (this.debuggerContent) {
      try {
        return xmlFormat(this.debuggerContent);
      } catch (e) {
        return this.debuggerContent;
      }
    }
    return this.debuggerContent;
  }

  setup() {
    this.unloadListener = () => {
      this.saveEditorContentToLocalStorage();
    };
    window.addEventListener('beforeunload', this.unloadListener);
  }

  teardown() {
    if (this.unloadListener) {
      window.removeEventListener('beforeunload', this.unloadListener);
    }
  }

  @action
  initDebug(info) {
    this.debug = info;
  }

  @action
  setupXmlEditor(element) {
    this.xmlEditor = new EditorView({
      state: EditorState.create({
        extensions: [basicSetup, xml()],
      }),
      parent: element,
    });
    this.xmlEditor.dispatch({
      changes: { from: 0, insert: this.debuggerContent },
    });
  }

  @action
  setupHtmlEditor(element) {
    this.htmlEditor = new EditorView({
      state: EditorState.create({
        extensions: [basicSetup, html()],
      }),
      parent: element,
    });
    this.htmlEditor.dispatch({
      changes: { from: 0, insert: this.debuggerContent },
    });
  }

  setHtmlContent(content) {
    this.editorController.executeCommand(
      'insert-html',
      content,
      this.editorController.rangeFactory.fromAroundAll()
    );
  }

  setXmlContent(content) {
    this.editorController.executeCommand(
      'insert-xml',
      content,
      this.editorController.rangeFactory.fromAroundAll()
    );
  }

  getXmlContent() {
    const content = this.editorController.executeQuery(
      'get-content',
      'xml',
      this.editorController.rangeFactory.fromAroundAll()
    );
    if (!content) {
      return '';
    }
    return xmlFormat(content.innerHTML);
  }

  getHtmlContent() {
    const content = this.editorController.executeQuery(
      'get-content',
      'html',
      this.editorController.rangeFactory.fromAroundAll()
    );
    if (!content) {
      return '';
    }
    return content.innerHTML;
  }

  @action
  rdfaEditorInit(controller) {
    const presetContent = `<div property="prov:generated" resource="http://data.lblod.info/id/besluiten/ea1d2b7e-cc37-4b1d-b2a7-4ce9f30ee0b4" typeof="besluit:Besluit https://data.vlaanderen.be/id/concept/BesluitType/256bd04a-b74b-4f2a-8f5d-14dda4765af9 ext:BesluitNieuweStijl">
    <p>Openbare titel besluit:</p>
    <h4 class="h4" property="eli:title" datatype="xsd:string"><span class="mark-highlight-manual">Geef titel besluit op</span></h4>
    <span style="display:none;" property="eli:language" resource="http://publications.europa.eu/resource/authority/language/NLD" typeof="skos:Concept">&nbsp;</span>
    <p>Korte openbare beschrijving:</p>
    <p property="eli:description" datatype="xsd:string"><span class="mark-highlight-manual">Geef korte beschrijving op</span></p>
    <br>
   
    <div property="besluit:motivering" lang="nl">
      <p>
        <span class="mark-highlight-manual">geef bestuursorgaan op</span>,
      </p>
      <br>
   
      <h5>Bevoegdheid</h5>
       <ul class="bullet-list"><li><span class="mark-highlight-manual">Rechtsgrond die bepaalt dat dit orgaan bevoegd is.</span></li></ul>
       <br>
   
      <h5>Juridische context</h5>
      <ul class="bullet-list"><li><a href="https://codex.vlaanderen.be/doc/document/1009730">Nieuwe gemeentewet</a>&nbsp;(KB 24/06/1988)</li><li>decreet <a class="annotation" href="https://codex.vlaanderen.be/doc/document/1029017" property="eli:cites" typeof="eli:LegalExpression">over het lokaal bestuur</a> van 22/12/2017</li><li>wet <a class="annotation" href="https://codex.vlaanderen.be/doc/document/1009628" property="eli:cites" typeof="eli:LegalExpression">betreffende de politie over het wegverkeer (wegverkeerswet - Wet van 16 maart 1968)</a></li><li>wegcode -&nbsp;<span data-editor-highlight="true">Koninklijk Besluit van 1 december 1975 houdende algemeen reglement op de politie van het wegverkeer en van het gebruik van de openbare weg.</span></li><li>code van de wegbeheerder -&nbsp;<span data-editor-highlight="true">ministrieel besluit van 11 oktober 1976 houdende de minimumafmetingen en de bijzondere plaatsingsvoorwaarden van de verkeerstekens</span></li></ul>
      <br>
      <em>specifiek voor aanvullende reglementen op het wegverkeer  (= politieverordeningen m.b.t. het wegverkeer voor wat betreft permanente of periodieke verkeerssituaties)</em>
      <ul class="bullet-list"><li>decreet <a class="annotation" href="https://codex.vlaanderen.be/doc/document/1016816" property="eli:cites" typeof="eli:LegalExpression">betreffende de aanvullende reglementenop het wegverkeer en de plaatsing en bekostiging van de verkeerstekens </a>(16 mei 2008)</li><li>Besluit van de Vlaamse Regering <a class="annotation" href="https://codex.vlaanderen.be/doc/document/1017729" property="eli:cites" typeof="eli:LegalExpression">betreffende de aanvullende reglementen en de plaatsing en bekostiging van verkeerstekens</a>&ZeroWidthSpace; van 23 januari 2009</li><li><a href="https://codex.vlaanderen.be/doc/document/1035938" property="eli:cites" typeof="eli:LegalExpression">Omzendbrief MOB/2009/01 van 3 april 2009 gemeentelijke aanvullende reglementen op de politie over het wegverkeer</a></li></ul>
   
      <h5>Feitelijke context en argumentatie</h5>
      <ul class="bullet-list"><li><span class="mark-highlight-manual">Voeg context en argumentatie in</span></li></ul>
    </div>
    <br>
    <br>
   
    <h5>Beslissing</h5>
   
    <div property="prov:value" datatype="xsd:string">
      <div property="eli:has_part" resource="http://data.lblod.info/artikels/bbeb89ae-998b-4339-8de4-c8ab3a0679b5" typeof="besluit:Artikel">
        <div property="eli:number" datatype="xsd:string">Artikel 1</div>
        <span style="display:none;" property="eli:language" resource="http://publications.europa.eu/resource/authority/language/NLD" typeof="skos:Concept">&nbsp;</span>
        <div property="prov:value" datatype="xsd:string">
          <span class="mark-highlight-manual">Voer inhoud in</span>
        </div>
      </div>
      <br>
      <div class="mark-highlight-manual"><span data-editor-highlight="true">Voeg nieuw artikel in</span></div>
      <br>
    </div>
   </div>`;
    this._editorController = controller;
    this.setHtmlContent(presetContent);
    const editorDone = new CustomEvent('editor-done');
    window.dispatchEvent(editorDone);
  }

  @action
  setDebuggerContent(content) {
    this.debuggerContent = content;
  }

  @action
  setEditorContent(type, content) {
    if (this._editorController) {
      if (type === 'html') {
        this.setHtmlContent(content);
        this.saveEditorContentToLocalStorage();
      } else {
        this.setXmlContent(content);
        this.saveEditorContentToLocalStorage();
      }
    }
  }

  @action openContentDebugger(type) {
    if (this._editorController) {
      if (type === 'xml') {
        this.debuggerContent = this.getXmlContent();
        this.xmlDebuggerOpen = true;
      } else {
        this.debuggerContent = this.getHtmlContent();
        this.htmlDebuggerOpen = true;
      }
    }
  }

  @action closeContentDebugger(type, save) {
    if (type === 'xml') {
      this.debuggerContent = this.xmlEditor.state.sliceDoc();
      this.xmlDebuggerOpen = false;
    } else {
      this.debuggerContent = this.htmlEditor.state.sliceDoc();
      this.htmlDebuggerOpen = false;
    }
    if (save) {
      const content = this.debuggerContent;
      if (!content) {
        //xml parser doesn't accept an empty string
        this.setEditorContent('html', '');
      } else {
        this.setEditorContent(type, content);
      }
    }
  }

  saveEditorContentToLocalStorage() {
    if (this._editorController) {
      const content = this.getHtmlContent();
      localStorage.setItem('EDITOR_CONTENT', content || '');
    }
  }
}
