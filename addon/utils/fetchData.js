function generateSignsQuery(type, code, betekenis, category) {
  return `
    PREFIX ex: <http://example.org#>
    PREFIX lblodMobilitiet: <http://data.lblod.info/vocabularies/mobiliteit/>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    PREFIX oslo: <http://data.vlaanderen.be/ns#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX org: <http://www.w3.org/ns/org#>
    PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
    SELECT * WHERE {
      ?uri a ext:Template;
        ext:value ?templateValue.
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
      ${
        category ? `<${category}>` : '?classification'
      } skos:prefLabel ?classificationLabel.
      ${code ? `FILTER( REGEX(?label, "${code}"))` : ''}
      ${betekenis ? `FILTER( REGEX(?definition, "${betekenis}"))` : ''}
    } LIMIT 10
`;
}

const classificationsQuery = `
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
    SELECT * WHERE {
      ?classificationUri a mobiliteit:Verkeersbordcategorie;
        skos:prefLabel ?classificationLabel.
    }
`;

export default async function fetchData() {
  const signsQueryResult = await executeQuery(generateSignsQuery());
  const signs = parseSignsData(signsQueryResult);
  const classificationsQueryResult = await executeQuery(classificationsQuery);
  const classifications = parseClassificationsData(classificationsQueryResult);
  return { signs, classifications };
}

export async function fetchSigns(type, code, betekenis, category) {
  const query = generateSignsQuery(type, code, betekenis, category);
  const queryResult = await executeQuery(query);
  const signs = parseSignsData(queryResult);
  return signs;
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
        signs: [],
        clasiffications: [],
        images: [],
        definitions: [],
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
    const definition = binding.definition.value;
    if (!data[uri].definitions.includes(definition)) {
      data[uri].definitions.push(definition);
    }
    data[uri].signs.push({
      definition: definition,
      clasiffication: classification,
      image: image,
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

async function executeQuery(query) {
  const encodedQuery = encodeURIComponent(query.trim());
  const endpoint = `http://localhost:4502/sparql`;
  const response = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: {
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: `query=${encodedQuery}`,
  });
  console.log(response);
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(
      `Request to Vlaamse Codex was unsuccessful: [${response.status}] ${response.statusText}`
    );
  }
}
