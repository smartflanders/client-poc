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

  render() {
      return (<div className="App">
        <div>
          <div style={{display: 'inline-block', position: 'absolute', marginLeft: '20px'}} className="panel panel-default panel-primary">
            <div className="panel-heading">Recente trends</div>
            <div className="panel-body">
              <table className="table">
                <tbody>
                  <tr><th>Parking</th><th>Vrije plaatsen</th><th>Trend 15 min</th></tr>
                  {Object.keys(this.state.parkings).map((el, i) => {
                    let parking = this.state.parkings[el];
                    let keys = Object.keys(parking.recordings);
                    let data = [];
                    keys.forEach((key) => {
                      if (moment().subtract(15, 'minutes').isBefore(moment(key))) {
                        data.push(parking.recordings[key]);
                      }
                    });
                    let last = parking.recordings[keys[keys.length-1]];
                    let percentage = ((last / parking.totalSpaces) * 100).toPrecision(2);
                    let change = data[data.length-1]-data[0];
                    return (<tr key={i}>
                      <td>{parking.description}</td>
                      <td>{last + '/' + parking.totalSpaces + ' (' + percentage + '%)'}</td>
                      <td>
                        <Sparklines data={data} limit={data.length} svgHeight={10} svgWidth={100} style={{marginRight: '10px'}}>
                          <SparklinesLine color="#253e56"/>
                        </Sparklines>
                        {change <= 0 ? change : '+' + change}
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
