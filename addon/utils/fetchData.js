import includeInstructions from './includeInstructions';
import { POTENTIALLY_ZONAL_URI } from './constants';

function generateExpandQuery(uri) {
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
      <${uri}> a lblodMobilitiet:TrafficMeasureConcept;
      skos:prefLabel ?label;
        ext:template ?templateUri;
        ext:zonality ?zonality;
        ext:relation ?relationUri.
        ?relationUri a ext:MustUseRelation ;
        ext:concept ?signUri.
        ?templateUri ext:value ?templateValue;
          ext:annotated ?templateAnnotated.
        ?signUri skos:definition ?definition;
          ext:zonality ?signZonality;
          skos:prefLabel ?signCode;
          org:classification ?classification;
          mobiliteit:grafischeWeergave ?image.
        ?classification skos:prefLabel ?classificationLabel.
        OPTIONAL {
          ?uri ext:mapping ?mapping.
          ?mapping ext:variableType 'instruction';
            ext:variable ?instructionName;
            ext:instructionVariable ?instructionVariable.
          ?instructionVariable ext:annotated ?instructionAnnotated;
            ext:value ?instructionValue.
        }
    }
  `;
}

function generateSignsQuery(
  zonality,
  type,
  code,
  betekenis,
  category,
  pageStart = 0
) {
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
    ?templateUri a ext:Template;
      ext:value ?templateValue;
      ext:annotated ?templateAnnotated.
    {
      SELECT * WHERE {
        ?uri a lblodMobilitiet:TrafficMeasureConcept;
        skos:prefLabel ?label;
        ext:template ?templateUri;
        ext:zonality ?zonality;
        ext:relation ?relationUri.
        ?relationUri a ext:MustUseRelation ;
        ext:concept ?signUri.
        ?signUri a ${type ? `<${type}>` : '?signType'};
          ext:zonality ?signZonality;
          skos:definition ?definition;
          skos:prefLabel ?signCode;
          org:classification ${category ? `<${category}>` : '?classification'};
          mobiliteit:grafischeWeergave ?image.
        OPTIONAL {
          ?templateUri ext:mapping ?mapping.
          ?mapping ext:variableType 'instruction';
            ext:variable ?instructionName;
            ext:instructionVariable ?instructionVariable.
          ?instructionVariable ext:annotated ?instructionAnnotated;
            ext:value ?instructionValue.
        }
      }
    }
    ${
      zonality
        ? `FILTER(?zonality IN (<${zonality}>, <${POTENTIALLY_ZONAL_URI}>))`
        : ''
    }
    ${
      category ? `<${category}>` : '?classification'
    } skos:prefLabel ?classificationLabel.
    ${code ? `FILTER( CONTAINS(LCASE(?label), "${code.toLowerCase()}"))` : ''}
    ${
      betekenis
        ? `FILTER( CONTAINS(LCASE(?definition), "${betekenis.toLowerCase()}"))`
        : ''
    }
  `;

  const selectQuery = `
    ${prefixes}
    SELECT DISTINCT ?uri WHERE {
      ${insideQuery}
    } LIMIT 10 OFFSET ${pageStart}
  `;
  const countQuery = `
    ${prefixes}
    SELECT (COUNT( DISTINCT ?uri) as ?count) WHERE {
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
  zonality,
  type,
  code,
  betekenis,
  category,
  pageStart
) {
  const { selectQuery, countQuery } = generateSignsQuery(
    zonality,
    type,
    code,
    betekenis,
    category,
    pageStart
  );
  const queryResult = await executeQuery(endpoint, selectQuery);
  const signsResult = await Promise.all(
    queryResult.results.bindings.map((binding) =>
      executeQuery(endpoint, generateExpandQuery(binding.uri.value))
    )
  );
  const signs = parseSignsData(signsResult);
  const signsWithInstructionsValue = signs.map((sign) => {
    if (sign.instructions) {
      sign.templateValue = includeInstructions(
        sign.templateValue,
        sign.instructions,
        false
      );
    }
    return sign;
  });
  const countResult = await executeQuery(endpoint, countQuery);
  const count = Number(countResult.results.bindings[0].count.value);
  return { signs: signsWithInstructionsValue, count };
}

function parseSignsData(arrayOfUris) {
  const data = [];
  for (let uriInfo of arrayOfUris) {
    const bindings = uriInfo.results.bindings;
    const uri = bindings[0].templateUri.value;
    const dataElement = {
      uri: uri,
      zonality: bindings[0].zonality.value,
      measureUri: bindings[0].uri.value,
      label: bindings[0].label.value,
      templateValue: bindings[0].templateValue.value,
      templateAnnotated: bindings[0].templateAnnotated.value,
      signs: [],
      clasiffications: [],
      images: [],
      definitions: [],
      instructions: [],
      instructionsUris: [],
    };
    for (let binding of bindings) {
      const classification = binding.classificationLabel.value;
      if (!dataElement.clasiffications.includes(classification)) {
        dataElement.clasiffications.push(classification);
      }
      const image = binding.image.value;
      if (!dataElement.images.includes(image)) {
        dataElement.images.push(image);
      }
      const signPresent = dataElement.signs.find(
        (sign) => sign.clasiffication === classification && sign.image === image
      );
      if (!signPresent) {
        dataElement.signs.push({
          clasiffication: classification,
          image: image,
          uri: binding.signUri.value,
          code: binding.signCode.value,
          zonality: binding.signZonality.value,
        });
      }
      if (binding.mapping) {
        const mapping = binding.mapping.value;
        const instructionName = binding.instructionName.value;
        const instructionVariable = binding.instructionVariable.value;
        const instructionValue = binding.instructionValue.value;
        const instructionAnnotated = binding.instructionAnnotated.value;
        if (!dataElement.instructionsUris.includes(mapping)) {
          dataElement.instructionsUris.push(mapping);
          dataElement.instructions.push({
            uri: mapping,
            name: instructionName,
            variable: instructionVariable,
            value: instructionValue,
            annotated: instructionAnnotated,
          });
        }
      }
    }
    data.push(dataElement);
  }
  return data;
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
