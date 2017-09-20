import React, { Component } from 'react';
import moment from 'moment';
import {Sparklines, SparklinesLine} from 'react-sparklines';
import query from 'smartflanders-data-query'

class App extends Component {

    constructor() {
        super();

        this.state = {
            parkings: [],
            measurements: {}
        };
    }

    refresh() {
        console.log("Refresh");
        let dq = new query();
        dq.addDataset('https://linked.open.gent/parking');
        let parkings = [];
        let measurements = {};
        let _this = this;

        dq.getParkings().subscribe(parking => {
            parkings.push(parking);
            measurements[parking.uri] = [];
        }, (error) => {console.log(error)}, () => {
            const from = moment().unix()-60*15;
            const to = moment().unix();
            dq.getInterval(from, to).subscribe(meas => {
                    measurements[meas.parkingUrl].push(meas);
                },
                (error) => console.log(error),
                () => {
                    _this.setState({
                        parkings: parkings,
                        measurements: measurements
                    })
                })
        })
    }

    componentWillMount() {
        this.refresh();
        setInterval(() => this.refresh(), 30000);
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
                      let measurements = this.state.measurements[parking.uri];
                      let last = measurements[0]; let first = measurements[measurements.length - 1];
                      let percentage = ((last.value / parking.totalSpaces) * 100).toPrecision(2);
                      let change = last.value - first.value;

                      let data = [];
                      for (let index = measurements.length-1; index >= 0; index--) {
                          data.push(measurements[index].value);
                      }

                      return (<tr key={i}>
                        <td>{parking.label}</td>
                        <td>{last.value + '/' + parking.totalSpaces + ' (' + percentage + '%)'}</td>
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
