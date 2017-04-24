import React, { Component } from 'react';
import Consumer from './Util/Consumer';

class App extends Component {

  constructor() {
    super();

    this.state = {
      triples: []
    };

    let consumer = new Consumer({parallel: false});
    let _this = this;
    consumer.on('data', function(triple) {
      //console.log(triple.graph + "\t" + triple.subject + "\t" + triple.object);
      let state = _this.state;
      state.triples.push(triple);
      _this.setState(state);
    });
    consumer.getInterval("2017-04-24T23:30:00");
  }

  render() {
    return (
      <div className="App">
        <h1>APP</h1>
        <table>
          <tr><th>subject</th><th>predicate</th><th>object</th></tr>
          {this.state.triples.map((el, i) => {
            return (
              <tr key={i}>
                <td>{el.subject}</td>
                <td>{el.predicate}</td>
                <td>{el.object}</td>
              </tr>
            )
          })}
        </table>
      </div>
    );
  }
}

export default App;
