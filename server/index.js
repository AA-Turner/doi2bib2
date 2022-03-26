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
  return doi2bib(body.records[0].doi)
});

const arxivid2doi = (arxivid) => fetch('https://arxiv.org/bibtex/' + arxivid).then(response => {
  if (!response.ok) throw new Error(response.statusCode);
  return response.text()
})

const http = require('http'),
    express = require('express'),
    app = express(),
    port = process.env.PORT || 3001,
    path = require('path'),

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));


const genErrorHandler = (res) => {
  return (errorCode) => {
    if (http.STATUS_CODES[errorCode]) {
      res.writeHead(errorCode);
      res.end(http.STATUS_CODES[errorCode]);
    } else {
      res.writeHead(500);
      res.end(http.STATUS_CODES[500]);
    }
  };
}

app.get('/2/doi2bib', (req, res) => {
  res.set('Content-Type', 'application/x-bibtex');
  if (!/^10\..+\/.+$/.test(req.query.id)) {
    res.writeHead(400);
    res.end('Invalid DOI');
  } else {
    doi2bib(req.query.id).then(res.end, genErrorHandler(res));
  }
});

app.get('/2/pmid2bib', (req, res) => {
  res.set('Content-Type', 'application/x-bibtex');
  if (!/^\d+$|^PMC\d+(\.\d+)?$/.test(req.query.id)) {
    res.writeHead(400);
    res.end('Invalid PMID');
  } else {
    pmid2doi(req.query.id).then(res.end, genErrorHandler(res));
  }
});

app.get('/2/arxivid2bib', (req, res) => {
  res.set('Content-Type', 'application/x-bibtex');
  if (!/^\d+\.\d+(v(\d+))?$/.test(req.query.id)) {
    res.writeHead(400);
    res.end('Invalid arXiv ID');
  } else {
    arxivid2doi(req.query.id).then(res.end, genErrorHandler(res));
  }
});

app.listen(
  port,
  '127.0.0.1',
  () => {console.log('node server started')},
);
