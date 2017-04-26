import React, { Component } from 'react';
import {Sparklines, SparklinesLine} from 'react-sparklines';

class ParkingPanel extends Component {
  constructor(props) {
    super(props);

    this.parking = this.props.parking;
  }

  render() {
    let data = [];
    Object.keys(this.parking.recordings).forEach((key) => {
      data.push(this.parking.recordings[key]);
    });

    return (
      <div className="col-sm-4">
        <div className={"panel panel-default " + this.props.class}>
          <div className="panel-heading">
            <h3 className="panel-title">{this.props.description}</h3>
          </div>
          <div className="panel-body">
            <Sparklines data={data} limit={data.length}>
              <SparklinesLine color="#253e56"/>
            </Sparklines>
            <span className="badge">{data[0]}</span>
          <span className="glyphicon glyphicon-arrow-right" style={{marginLeft: "10px", marginRight: "10px"}}/>
            <span className="badge">{data[data.length-1]}</span>
          </div>
        </div>
      </div>
    )
  }
}

export default ParkingPanel