import React, { Component } from 'react';

class ParkingPanel extends Component {
  render() {
    return (
      <div className="col-sm-4">
        <div className={"panel panel-default " + this.props.class}>
          <div className="panel-heading">
            <h3 className="panel-title">{this.props.description}</h3>
          </div>
          <div className="panel-body">
            {this.props.delta}
          </div>
        </div>
      </div>
    )
  }
}

export default ParkingPanel