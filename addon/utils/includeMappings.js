function generateTextTemplate(uri, name) {
  return `
    <span typeof="ext:Mapping" resource="${uri}">\${${name}}</span>
  `
}

export default function includeMappings(html, mappings) {
  let finalHtml = html;
  for(let mapping of mappings) {
    if(mapping.type === 'text') {
      finalHtml = finalHtml.replaceAll(
        `\${${mapping.name}}`,
        generateTextTemplate(mapping.uri, mapping.name)
      )
    }
    if(mapping.type === 'codelist') {
      finalHtml = finalHtml.replaceAll(
        `\${${mapping.name}}`,
        generateCodelistTemplate(mapping.uri, mapping.name)
      )
    }
    
  }
}