import { POTENTIALLY_ZONAL_URI } from './constants';

function buildFilters({ zonality, type, codes, category }) {
  const filters = [];
  if (zonality) {
    filters.push(
      `FILTER(?zonality IN (<${zonality}>, <${POTENTIALLY_ZONAL_URI}>))`
    );
  }
  if (type) {
    filters.push(`FILTER(?signType = <${type}>)`);
  }
  if (codes) {
    filters.push(`
        ${codes
          .map(
            (uri) => `
              ?uri ext:relation/ext:concept <${uri}>.
            `
          )
          .join(' ')}
    `);
  }
  if (category) {
    filters.push(`FILTER(?signClassification = <${category}>)`);
  }
  return filters;
}

export function generateMeasuresQuery({
  zonality,
  type,
  codes,
  category,
  pageStart = 0,
  count,
}) {
  const filters = buildFilters({ zonality, type, codes, category });
  let pagination = '';
  if (!count) {
    pagination = `LIMIT 10 OFFSET ${pageStart}`;
  }
  const query = `
SELECT ${
    count
      ? '(COUNT(DISTINCT(?template)) AS ?count)'
      : '?uri ?label ?basicTemplate ?annotatedTemplate ?zonality ?temporal'
  }
WHERE {
    ?uri a lblodMobiliteit:TrafficMeasureConcept;
         skos:prefLabel ?label;
         ext:zonality ?zonality;
         ext:relation ?relationUri;
         ext:template ?template.
         ?template ext:annotated ?annotatedTemplate;
                   ext:value ?basicTemplate.
    ?relationUri a ext:MustUseRelation ;
                 ext:concept ?signUri.
    ?signUri a ?signType;
             skos:prefLabel ?signCode.
            
    ${filters.join('\n')}
  OPTIONAL {
    ?uri ext:temporal ?temporal.
  }
  OPTIONAL {
    ?signUri org:classification ?signClassification.
  }
}
${
  count
    ? ''
    : `GROUP BY ?uri ?label ?template ?zonality\n ORDER BY strlen(str(?label)) ?label`
}
${pagination}
`;
  return query;
}
