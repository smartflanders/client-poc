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
      parkings: {
        "https://stad.gent/id/parking/P7": {recordings: {}},
        "https://stad.gent/id/parking/P1": {recordings: {}},
        "https://stad.gent/id/parking/P10": {recordings: {}},
        "https://stad.gent/id/parking/P4": {recordings: {}},
        "https://stad.gent/id/parking/P8": {recordings: {}},
        "https://stad.gent/id/parking/P2": {recordings: {}}
      },
      intervalBorders: []
    };

    let consumer = new Consumer({parallel: false});
    let _this = this;
    consumer.on('data', function(triple) {
      _this.processTriple(triple);
    });
    let from = moment().subtract(15, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
    consumer.getInterval(from);
  }

  processTriple(triple) {
    if (this.state.parkings[triple.subject] !== undefined) {
      let parking = this.state.parkings[triple.subject];
      if (triple.predicate === this.buildingBlocks.predicates.description) {
        parking.description = this.extractLiteral(triple.object);
        this.setState({parkings: Object.assign(this.state.parkings, {[triple.subject]: parking})});
      }
      if (triple.predicate === this.buildingBlocks.predicates.vacantSpaces) {
        parking.recordings[triple.graph.substr(triple.graph.length - this.momentStringLength)] = triple.object;
        parking.delta = this.calculateSpaceDelta(parking);
        this.setState({parkings: Object.assign(this.state.parkings, {[triple.subject]: parking}), intervalBorders: this.calculateClassIntervalBorders()});
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

  calculateClassIntervalBorders() {
    let deltas = [];
    Object.keys(this.state.parkings).forEach((key) => {
      deltas.push(this.state.parkings[key].delta);
    });
    deltas.sort((a,b) => a-b);
    let diff = deltas[deltas.length-1] - deltas[0];
    let intervalLength = Math.round(diff/3);
    return [deltas[0] + intervalLength, deltas[0] + 2*intervalLength]
  }

  getClassForDelta(delta) {
    let borders = this.state.intervalBorders;
    if (borders) {
      if (delta < borders[0]) {
        return "panel-danger";
      } else if (delta < borders[1]) {
        return "panel-info";
      } else {
        return "panel-success";
      }
    }
    return "panel-info";
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar navbar-default">
          <a className="navbar-brand" href="#">SmartFlanders: Proof of concept</a>
        </nav>
        {Object.keys(this.state.parkings).map((el, i) => {
          return <ParkingPanel
            description={this.state.parkings[el].description}
            delta={this.state.parkings[el].delta}
            class={this.getClassForDelta(this.state.parkings[el].delta)}
            key={i}/>
        })}
        <div>
          {this.state.intervalBorders[0]}
        </div>
        <div>
          {this.state.intervalBorders[1]}
        </div>
      </div>


    );
  }
}

export default App;
