import React, { Component } from 'react';
import Consumer from './Util/Consumer';
import moment from 'moment';
import {Sparklines, SparklinesLine} from 'react-sparklines';

class App extends Component {

  constructor() {
    super();

    this.momentStringLength = moment().format('YYYY-MM-DDTHH:mm:ss').length;

    this.buildingBlocks = {
      predicates: {
        vacantSpaces: "http://vocab.datex.org/terms#parkingNumberOfVacantSpaces",
        totalSpaces: "http://vocab.datex.org/terms#parkingNumberOfSpaces",
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
    };

    let consumer = new Consumer({parallel: false});
    let _this = this;
    consumer.on('data', function(triple) {
      _this.processTriple(triple);
    });
    let from = moment().subtract(15, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
    consumer.getAllFrom(from);
  }

  processTriple(triple) {
    if (this.state.parkings[triple.subject] !== undefined) {
      let parking = this.state.parkings[triple.subject];
      if (triple.predicate === this.buildingBlocks.predicates.description) {
        parking.description = this.extractLiteral(triple.object);
        this.setState({parkings: Object.assign(this.state.parkings, {[triple.subject]: parking})});
      }
      if (triple.predicate === this.buildingBlocks.predicates.vacantSpaces) {
        parking.recordings[triple.graph.substr(triple.graph.length - this.momentStringLength)] = parseInt(this.extractLiteral(triple.object), 10);
        //parking.delta = this.calculateSpaceDelta(parking);
        this.setState({parkings: Object.assign(this.state.parkings, {[triple.subject]: parking})});
      }
      if (triple.predicate === this.buildingBlocks.predicates.totalSpaces) {
        parking.totalSpaces = parseInt(this.extractLiteral(triple.object), 10);
      }
    }
  }

  extractLiteral(string) {
    return string.substring(1, string.length-1);
  }

  /*calculateSpaceDelta(parking) {
    if (Object.keys(parking.recordings).length >= 2) {
      let sortedKeys = Object.keys(parking.recordings).sort((a, b) => {
        return moment(a) - moment(b);
      });
      let first = parking.recordings[sortedKeys[0]];
      let last = parking.recordings[sortedKeys[sortedKeys.length-1]];
      return last-first;
    }
  }*/

  render() {
      return (<div className="App">
        <div className="page-header">
          <h1>SmartFlanders <small>Proof of concept</small></h1>
        </div>
        <div className="col-md-10 col-md-offset-1">
          <div className="panel panel-default panel-primary">
            <div className="panel-heading">Recente trends</div>
            <div className="panel-body">
              <table className="table">
                <tbody>
                  <tr><th>Parking</th><th>Vrije plaatsen</th><th>Trend</th></tr>
                  {Object.keys(this.state.parkings).map((el, i) => {
                    let parking = this.state.parkings[el];
                    let sortedKeys = Object.keys(parking.recordings).sort((a, b) => {
                      return moment(a) - moment(b);
                    });
                    let data = [];
                    sortedKeys.forEach((key) => {
                      data.push(parking.recordings[key]);
                    });
                    let last = parking.recordings[sortedKeys[sortedKeys.length-1]];
                    let percentage = ((last / parking.totalSpaces) * 100).toPrecision(2);
                    return (<tr key={i}>
                      <td>{parking.description}</td>
                      <td>{last + '/' + parking.totalSpaces + ' (' + percentage + '%)'}</td>
                      <td>
                        <Sparklines data={data} limit={data.length}>
                          <SparklinesLine color="#253e56"/>
                        </Sparklines>
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>);
  }
}

export default App;
