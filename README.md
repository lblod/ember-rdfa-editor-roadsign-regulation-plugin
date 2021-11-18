roadsign-regulation-plugin
==============================================================================

A plugin that fetches data from the mow regulation and roadsign registry.

*Note*: this plugin uses the new plugin architecture. It needs to be passed to the editor for inititialization.

```
    <Rdfa::RdfaEditor
            class="au-c-rdfa-editor"
            @profile={{@profile}}
            @rdfaEditorInit={{this.rdfaEditorInit}}
            @editorOptions={{this.editorOptions}}
            @toolbarOptions={{this.toolbarOptions}}
            @plugins={{array 'roadsign-regulation'}
            />


```

The default endpoint the plugin will query is https://roadsigns.lblod.info/sparql . This can be overwritten by setting
`roadsignRegulationPlugin.endpoint` in your `config/environment.js`.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install roadsign-regulation-plugin
```


Usage
------------------------------------------------------------------------------

[Longer description of how to use the addon in apps.]


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
