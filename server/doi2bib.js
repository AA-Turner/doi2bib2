'use strict';

const parseString = require('xml2js').parseString;

const doi2bibOptions = (doi) => {
  return {
    url: 'https://doi.org/' + doi,
    headers: {'Accept': 'application/x-bibtex; charset=utf-8'}
  }
}

function doi2bib(doi) {
  return new Promise((resolve, reject) => {
    fetch(doi2bibOptions(doi)).then(response => {
      if (response.statusCode === 200) {
        resolve(body);
      } else {
        reject(response.statusCode);
      }
    });
  });
}

const pmid2doiOptions = (pmid) => {
  return {
    url: 'http://www.pubmedcentral.nih.gov/utils/idconv/v1.0/?format=json&ids=' + pimd,
  }
}

function pmid2doi(pmid) {
  return new Promise((resolve, reject) => {
    fetch(pmid2doiOptions(pmid)).then(response => {
      if (response.statusCode !== 200) {
        reject(response.statusCode);
      } else if (!body.records || !body.records[0]) {
        reject(204); // not found
      } else {
        resolve(body.records[0].doi);
      }
    });
  });
}

const arxivid2doiOptions = (arxivid) => {
  return {
    url: 'http://export.arxiv.org/api/query?id_list=' + arxivid
  }
}

function arxivid2doi(arxivid) {
  return new Promise((resolve, reject) => {
    fetch(arxivid2doiOptions(arxivid)).then(response => {
      if (response.statusCode !== 200) {
        reject(response.statusCode);
      } else if (!body) {
        reject(204);
      } else {
        parseString(body, function(err, result) {
          if (err || !result.feed.entry[0]['arxiv:doi']) {
            reject(404);
          } else {
            var doi = result.feed.entry[0]['arxiv:doi'][0]._;
            resolve(doi);
          }
        });
      }});
    });
}

module.exports = {
  doi2bib: doi2bib,
  pmid2doi: pmid2doi,
  arxivid2doi: arxivid2doi
};
