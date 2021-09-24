const query = `
  PREFIX ex: <http://example.org#>
  PREFIX sh: <http://www.w3.org/ns/shacl#>
  PREFIX oslo: <http://data.vlaanderen.be/ns#>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX org: <http://www.w3.org/ns/org#>
  PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
  SELECT * WHERE {
    ?uri a ex:TrafficMeasureTemplate.
    ?conceptUri a ex:Concept;
    ex:label ?label;
    ex:template ?uri;
    ex:relation ?relationUri.
    ?relationUri a ex:MustUseRelation ;
    ex:signConcept ?signUri.
    ?signUri skos:definition ?definition;
      org:classification ?classification;
      mobiliteit:grafischeWeergave ?image.
    ?classification skos:prefLabel ?classificationLabel.
  }
`;

export default async function fetchData() {
  const queryResult = await executeQuery(query);
  const data = parseData(queryResult);
  return data;
}

function parseData(queryResult) {
  const bindings = queryResult.results.bindings;
  const data = {};
  for (let binding of bindings) {
    const uri = binding.uri.value;
    if (!data[uri]) {
      data[uri] = {
        uri: uri,
        label: binding.label.value,
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

async function executeQuery(query) {
  const encodedQuery = encodeURIComponent(query.trim());
  const endpoint = `http://localhost:8002/sparql`;
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
