import includeInstructions from './includeInstructions';
import { POTENTIALLY_ZONAL_URI } from './constants';


function buildFilters({zonality, type, code , category}) {
  const filters = [];
  if (zonality) {
    filters.push(`FILTER(?zonality IN (<${zonality}>, <${POTENTIALLY_ZONAL_URI}>))`);
  }
  if (type) {
    filters.push(`FILTER(?signType = <${(type)}>)`);
  }
  if (code) {
    filters.push(`FILTER(CONTAINS(LCASE(?label), "${code.toLowerCase()}"))`);
  }
  if (category) {
    filters.push(`FILTER(?signClassification = <${category}>)`);
  }
  return filters;
}

export function generateMeasuresQuery({zonality, type, code, category, pageStart = 0, count}) {
  const filters = buildFilters({zonality, type, code, category});
  let pagination = '';
  if (!count) {
    pagination = `LIMIT 10 OFFSET ${pageStart}`;
  }
  const query = `
SELECT ${count ? '(COUNT(DISTINCT(?template)) AS ?count)': '?uri ?label ?basicTemplate ?annotatedTemplate ?zonality'}
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
             skos:prefLabel ?signCode;
             org:classification ?signClassification.
    ${filters.join("\n")}
}
${count ? '' : `GROUP BY ?uri ?label ?template ?zonality\n ORDER BY ?label` }
${pagination}
`;
  return query;
}


