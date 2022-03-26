/* REQUESTS */

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

/* BIBTEX PARSING */

const SPECIAL_CHARS = {
  'à': '\\`a',
  'ô': '\\^o',
  'ê': '\\^e',
  'â': '\\^a',
  '®': '{\\textregistered}',
  'ç': '\\c{c}',
  'ö': '\\"{o}',
  'ä': '\\"{a}',
  'ü': '\\"{u}',
  'Ö': '\\"{O}',
  'Ä': '\\"{A}',
  'Ü': '\\"{U}'
};

const MONTHS = {
  "jan": "01",
  "feb": "02",
  "mar": "03",
  "apr": "04",
  "may": "05",
  "jun": "06",
  "jul": "07",
  "aug": "08",
  "sep": "09",
  "oct": "10",
  "nov": "11",
  "dec": "12",
}

/**
 * Sometimes, the greek chars aren't properlty formatted in the received bib.
 * e.g. the bib for 10.1002/cncr.29046 contains {\varEpsilon} instead of {$\varEpsilon$}.
 * There, we inject the missing $ chars into the title string.
 */
const insertDollars = (str) => str.replace(/(\{)(\\var[A-Z]?[a-z]*)(\})/, '$1$$$2$$$3');

const encodeSpecialChars = (str) => str.replace(
  new RegExp(Object.keys(SPECIAL_CHARS).join('|'),'gi'),
  (matched) => SPECIAL_CHARS[matched]
);

const parseBibTex = (bibTexText) => {
  parsed = Bibparser.parse(bibStr);

  if (parsed.tags.pages === 'n/a-n/a') {delete parsed.tags.pages;
  if (parsed.tags.pages && parsed.tags.pages.indexOf('--') === -1) {
    parsed.tags.pages = parsed.tags.pages.replace(/-/g, '--');
  }

  /* id specific */
  if (parsed.id) parsed.id = parsed.id.replace(/_/g, '');

  // bib url contains url encoding -> we decode those characters here
  if (parsed.tags.url) parsed.tags.url = decodeURIComponent(parsed.tags.url);
  
  const title = parsed.tags.title
  if (title) parsed.tags.title = (Array.isArray(title)) ? title.map(t => insertDollars(t)) : insertDollars(title);
  parsed.tags.date = parsed.tags.year + "-" + MONTHS[parsed.tags.month]
  delete parsed.tags.year;
  delete parsed.tags.month;

  return parsed
}

const renderBibLaTex = (parsed) => {
  let result = '@' + parsed.type + '{' + parsed.id;
  for (const [key, value] of parsed.tags) result += ',\n  ' + key + ' = {' + encodeSpecialChars(value.join ? value.join(', ') : value) + '}';
  return result + '\n}';
};

const getURLFromParsedBib = (parsed) => parsed.tags.url;


/* PAGE DISPLAY */

const BIB = '/bib/';
const URL_PATHNAME = window.location.pathname
const URL_DOI = (URL_PATHNAME.startsWith(BIB)) ? URL_PATHNAME.substring(BIB.length) : ''
const divResult = document.getElementById("result")
const inputBibInput = document.getElementById("bibInput")

const resultProceed = () => {
  inputBibInput.classList.remove("is-invalid")
  divResult.innerHTML = '<i className="fa fa-refresh fa-spin"></i>'
}
const resultSuccess = (bib, url) => {
  inputBibInput.classList.remove("is-invalid")
  divResult.innerHTML = '<pre className="bibtex-code text-left"><code>' + bib + '</code></pre>'
            + '<a href="' + url + '" target="_blank">' + url + '</a>'
}
const resultFailure = (error) => {
  inputBibInput.classList.add("is-invalid")
  divResult.innerHTML = '<pre className="text-danger text-left">' + error + '</pre>'
}

const processResponse = data => {
  const parsed = parseBibTex(data);
  resultSuccess(renderBibLaTex(parsed), getURLFromParsedBib(parsed))
}

const generateBib = (bibID) => {
  bibID = bibID.replace(/ /g, '');
  resultProceed()

  if (bibID.match(/^10\..+\/.+$/i)) {
    doi2bib(bibID).then(processResponse).catch(resultFailure)
  } else if (bibID.match(/^doi:?10\..+\/.+$/i)) {
    bibID = bibID.substring(4);
    doi2bib(bibID).then(processResponse).catch(resultFailure)
  } else if (bibID.match(/^(https?:\/\/)?(dx\.)?doi\.org\/10\..+\/.+$/i)) {
    bibID = bibID.substr(bibID.indexOf('doi.org/') + 8)
    doi2bib(bibID).then(processResponse).catch(resultFailure)
  } else if (bibID.match(/^\d+$|^PMC\d+(\.\d+)?$/)) {
    pmid2doi(bibID).then(processResponse).catch(resultFailure)
  } else if (bibID.match(/^arxiv:\d+\.\d+(v(\d+))?/i)) {
    bibID = bibID.substring(6);
    arxivid2doi(bibID).then(processResponse).catch(resultFailure)
  } else if (bibID.match(/^\d+\.\d+(v(\d+))?/i)) {
    arxivid2doi(bibID).then(processResponse).catch(resultFailure)
  } else {
    bibID = ''
    resultFailure('Invalid ID. Must be DOI, PMID, or arXiv ID (after 2007).')
  }
  return bibID
  }

const handleSubmit = (event) => {
  event.preventDefault();
  const bibID = generateBib();
  if (bibID) window.history.push(BIB + bibID);
}
const handleKeyPress = (event) => if (event.key === 'Enter') handleSubmit(event)

document.addEventListener("DOMContentLoaded", () => {
  if (URL_DOI) generateBib(URL_DOI)
})
