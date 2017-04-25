import React, { Component } from 'react';
import Consumer from './Util/Consumer';
import moment from 'moment';
import ParkingPanel from './ParkingPanel'

class App extends Component {

  constructor() {
    super();

    this.momentStringLength = moment().format('YYYY-MM-DDTHH:mm:ss').length;

    this.buildingBlocks = {
      predicates: {
        vacantSpaces: "http://vocab.datex.org/terms#parkingNumberOfVacantSpaces",
        description: "http://purl.org/dc/terms/description"
      },
    };

    this.state = {
      "https://stad.gent/id/parking/P7": {recordings: {}},
      "https://stad.gent/id/parking/P1": {recordings: {}},
      "https://stad.gent/id/parking/P10": {recordings: {}},
      "https://stad.gent/id/parking/P4": {recordings: {}},
      "https://stad.gent/id/parking/P8": {recordings: {}},
      "https://stad.gent/id/parking/P2": {recordings: {}}
    };

    let consumer = new Consumer({parallel: false});
    let _this = this;
    consumer.on('data', function(triple) {
      _this.processTriple(triple);
    });
    let from = moment().subtract(15, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
    consumer.getInterval(from);
    console.log(from);
  }

  processTriple(triple) {
    if (this.state[triple.subject] !== undefined) {
      let parking = this.state[triple.subject];
      if (triple.predicate === this.buildingBlocks.predicates.description) {
        parking.description = this.extractLiteral(triple.object);
        this.setState({[triple.subject]: parking});
      }
      if (triple.predicate === this.buildingBlocks.predicates.vacantSpaces) {
        parking.recordings[triple.graph.substr(triple.graph.length - this.momentStringLength)] = triple.object;
        parking.delta = this.calculateSpaceDelta(parking);
        this.setState({[triple.subject]: parking});
      }
    }
  }

  extractLiteral(string) {
    return string.substring(1, string.length-1);
  }

  calculateSpaceDelta(parking) {
    if (Object.keys(parking.recordings).length >= 2) {
      let sortedKeys = Object.keys(parking.recordings).sort((a, b) => {
        return moment(a) - moment(b);
      });
      let first = parseInt(this.extractLiteral(parking.recordings[sortedKeys[0]]));
      let last = parseInt(this.extractLiteral(parking.recordings[sortedKeys[sortedKeys.length-1]]));
      return last-first;
    }
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar navbar-default">
          <a className="navbar-brand" href="#">SmartFlanders: Proof of concept</a>
        </nav>
        {Object.keys(this.state).map((el, i) => {
          return <ParkingPanel
            description={this.state[el].description}
            delta={this.state[el].delta}/>
        })}
      </div>


    );
  }
}

export default App;
