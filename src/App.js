import React, { Component } from 'react';
import Consumer from './Util/Consumer';

class App extends Component {

  constructor() {
    super();

    // This is code from the old index.js illustrating consumer usage
    /*let consumer = new Consumer({parallel: false});
    consumer.on('data', function(triple) {
      console.log("Index received " + triple);
    });
    consumer.getInterval("2017-04-16T15:50:00", "2017-04-16T16:10:00");*/
  }

  render() {
    return (
      <div className="App">
        <p>HELLO WORLD</p>
      </div>
    );
  }
}

export default App;
