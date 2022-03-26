'use strict';

const doi2bib = (doi) => fetch('https://doi.org/' + doi, {headers: {'Accept': 'application/x-bibtex; charset=utf-8'}}).then(response => {
  if (!response.ok) throw new Error(response.statusCode);
  return response.text()
});

const pmid2doi = (pmid) => fetch('https://www.pubmedcentral.nih.gov/utils/idconv/v1.0/?format=json&ids=' + pmid).then(response => {
  if (!response.ok) throw new Error(response.statusCode);
  return response.json()
}).then(body => {
  if (!body.records || !body.records[0]) throw new Error(204); // not found
  return body.records[0].doi
});

const arxivid2doi = (arxivid) => fetch('https://arxiv.org/bibtex/' + arxivid).then(response => {
  if (!response.ok) throw new Error(response.statusCode);
  return response.text()
})

module.exports = {
  doi2bib: doi2bib,
  pmid2doi: pmid2doi,
  arxivid2doi: arxivid2doi
};
