import includeInstructions from './includeInstructions';
function generateSignsQuery(type, code, betekenis, category, pageStart = 0) {
  const prefixes = `
    PREFIX ex: <http://example.org#>
    PREFIX lblodMobilitiet: <http://data.lblod.info/vocabularies/mobiliteit/>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    PREFIX oslo: <http://data.vlaanderen.be/ns#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  `;
  const insideQuery = `
    ?uri a ext:Template;
      ext:value ?templateValue;
      ext:annotated ?templateAnnotated.
    {
      SELECT * WHERE {
        ?uri ext:mapping ?mapping.
        ?mapping ext:variableType 'instruction';
          ext:variable ?instructionName;
          ext:instructionVariable ?instructionVariable.
        ?instruction ext:annotated ?instructionAnnotated;
          ext:value ?instructionValue.
        ?conceptUri a lblodMobilitiet:TrafficMeasureConcept;
        skos:prefLabel ?label;
        ext:template ?uri;
        ext:relation ?relationUri.
        ?relationUri a ext:MustUseRelation ;
        ext:concept ?signUri.
        ?signUri a ${type ? `<${type}>` : '?signType'};
          skos:definition ?definition;
          org:classification ${category ? `<${category}>` : '?classification'};
          mobiliteit:grafischeWeergave ?image.
      }
    }
      
    ${
      category ? `<${category}>` : '?classification'
    } skos:prefLabel ?classificationLabel.
    ${code ? `FILTER( REGEX(?label, "${code}"))` : ''}
    ${betekenis ? `FILTER( REGEX(?definition, "${betekenis}"))` : ''}
  `;
  const selectQuery = `
    ${prefixes}
    SELECT * WHERE {
      ${insideQuery}
    } LIMIT 10 OFFSET ${pageStart}
  `;
  const countQuery = `
    ${prefixes}
    SELECT (COUNT(?uri) as ?count) WHERE {
      ${insideQuery}
    }
  `;
  return { selectQuery, countQuery };
}

const classificationsQuery = `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
    SELECT * WHERE {
      ?classificationUri a mobiliteit:Verkeersbordcategorie;
        skos:prefLabel ?classificationLabel.
    }
`;

export default async function fetchData(endpoint) {
  const { signs, count } = await fetchSigns(endpoint);
  const classificationsQueryResult = await executeQuery(
    endpoint,
    classificationsQuery
  );
  const classifications = parseClassificationsData(classificationsQueryResult);
  return { signs, classifications, count };
}

export async function fetchSigns(
  endpoint,
  type,
  code,
  betekenis,
  category,
  pageStart
) {
  const { selectQuery, countQuery } = generateSignsQuery(
    type,
    code,
    betekenis,
    category,
    pageStart
  );
  console.log(selectQuery);
  const queryResult = await executeQuery(endpoint, selectQuery);
  const signs = parseSignsData(queryResult);
  const signsWithInstructionsValue = signs.map((sign) => {
    sign.templateValue = includeInstructions(
      sign.templateValue,
      sign.instructions,
      false
    );
    return sign;
  });
  const countResult = await executeQuery(endpoint, countQuery);
  const count = Number(countResult.results.bindings[0].count.value);
  return { signs: signsWithInstructionsValue, count };
}

function parseSignsData(queryResult) {
  const bindings = queryResult.results.bindings;
  const data = {};
  for (let binding of bindings) {
    const uri = binding.uri.value;
    if (!data[uri]) {
      data[uri] = {
        uri: uri,
        label: binding.label.value,
        templateValue: binding.templateValue.value,
        templateAnnotated: binding.templateAnnotated.value,
        signs: [],
        clasiffications: [],
        images: [],
        definitions: [],
        instructions: [],
      };
    }
    const classification = binding.classificationLabel.value;
    if (!data[uri].clasiffications.includes(classification)) {
      data[uri].clasiffications.push(classification);
    }
    const image = binding.image.value;
    if (!data[uri].images.includes(image)) {
      data[uri].images.push(image);
    }
    data[uri].signs.push({
      clasiffication: classification,
      image: image,
    });
    const mapping = binding.mapping.value;
    const instructionName = binding.instructionName.value;
    const instructionVariable = binding.instructionVariable.value;
    const instructionValue = binding.instructionValue.value;
    const instructionAnnotated = binding.instructionAnnotated.value;
    data[uri].instructions.push({
      uri: mapping,
      name: instructionName,
      variable: instructionVariable,
      value: instructionValue,
      annotated: instructionAnnotated,
    });
  }
  const dataArray = [];
  for (let key in data) {
    dataArray.push(data[key]);
  }
  return dataArray;
}

function parseClassificationsData(queryResult) {
  const bindings = queryResult.results.bindings;
  return bindings.map((binding) => ({
    value: binding.classificationUri.value,
    label: binding.classificationLabel.value,
  }));
}

async function executeQuery(endpoint, query) {
  const encodedQuery = encodeURIComponent(query.trim());
  const response = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: {
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: `query=${encodedQuery}`,
  });
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(
      `Request to MOW backend was unsuccessful: [${response.status}] ${response.statusText}`
    );
  }
}

export async function fetchInstructions(endpoint, uri) {
  const query = `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    SELECT * WHERE {
      <${uri}> a ext:Template;
        ext:mapping ?mapping.
      ?mapping ext:variableType 'instruction';
        ext:variable ?name;
        ext:instructionVariable ?instruction.
      ?instruction ext:annotated ?annotated.
    }
  `;
  const result = await executeQuery(endpoint, query);
  const bindings = result.results.bindings;
  return bindings.map((binding) => ({
    uri: binding.mapping.value,
    name: binding.name.value,
    annotated: binding.annotated.value,
  }));
}
