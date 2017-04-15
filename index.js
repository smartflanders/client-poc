let N3 = require('n3');
let http = require('follow-redirects').http;
let config = require('config');
let moment = require('moment-timezone');
let EventEmitter = require('events');

function Processor(emitter) {
  let writer = new require('stream').Writable({ objectMode: true });
  writer.write = function (triple) {
    emitter.emit('gotTriple', triple);
  };
  writer.on('unpipe', function() {
    emitter.emit('processorFinished', this)
  });
  return writer;
}

class Consumer {
  constructor() {
    this.triples = [];
    this.requestParams = config.get('requestParams');
    this.buildingBlocks = config.get('buildingBlocks');
    this.emitter = new EventEmitter();

    this.interval = {from: "", to: ""};

    this.processTriple = this.processTriple.bind(this);
    this.emitter.on('gotTriple', this.processTriple);

    this.processorFinished = this.processorFinished.bind(this);
    this.emitter.on('processorFinished', this.processorFinished);
  }

  performRequest(path) {
    let params = Object.assign({}, this.requestParams);
    if (path !== undefined) {
        params.path = path;
    }
    let _this = this;
    http.request(params, (res) => {
      let streamParser = N3.StreamParser();
      res.pipe(streamParser);
      streamParser.pipe(new Processor(_this.emitter));
    }).end();
  }

  processTriple(triple) {
    // What if this is slower than HTTP?? -> github issue
    if (triple.predicate === this.buildingBlocks.previous) {
      console.log(this.parseTimestampFromLink(triple.object));
    }
    if (triple.predicate === this.buildingBlocks.next) {
      console.log(this.parseTimestampFromLink(triple.object));
    }
    if (triple.predicate === this.buildingBlocks.numberOfVacantSpaces) {
      this.triples.push(triple);
      console.log(triple);
    }
  }

  // From and to are timestamp strings, eg: "2017-04-15T15:45:00"
  getInterval(from, to=this.momentToString(moment())) {
    this.interval = {from: from, to: to};
    this.performRequest("/parking?time=" + from);
    this.performRequest("/parking?time=" + to);
  }

  momentToString(mom) {
    return mom.format().substr(0,19);
  }

  processorFinished(proc) {
    console.log("Processor finished");
  }

  parseTimestampFromLink(link) {
    let len = link.length;
    return moment(link.substring(len-26, len-7));
  }
}

let consumer = new Consumer();
consumer.getInterval("2017-04-15T15:45:00");