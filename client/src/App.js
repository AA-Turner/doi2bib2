import React, { Component } from 'react';
import './App.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Doi2Bib from './components/Doi2Bib';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <div className="container">
            <Switch>
              <Route path="/bib/*" component={Doi2Bib} />
              <Route path="*" component={Doi2Bib} />
            </Switch>
          </div>
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
