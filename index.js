let N3 = require('n3');
let http = require('follow-redirects').http;
let config = require('config');
let moment = require('moment-timezone');
let EventEmitter = require('events');

function Processor(emitter, id) {
  let writer = new require('stream').Writable({ objectMode: true });
  writer.write = function (triple) {
    emitter.emit('gotTriple', triple);
  };
  writer.on('finish', function() {
    emitter.emit('processorFinished', id)
  });
  return writer;
}

class Consumer {
  constructor() {
    this.triples = [];
    this.requestParams = config.get('requestParams');
    this.buildingBlocks = {
        "next": "http://www.w3.org/ns/hydra/core#next",
        "previous": "http://www.w3.org/ns/hydra/core#previous",
        "numberOfVacantSpaces": "http://vocab.datex.org/terms#parkingNumberOfVacantSpaces"
    };
    this.emitter = new EventEmitter();

    this.interval = {from: "", to: ""};
    this.finishedProcessors = {};
    this.aggregatedLinks = [];
    this.nextId = 0;

    this.processTriple = this.processTriple.bind(this);
    this.emitter.on('gotTriple', this.processTriple);

    this.processorFinished = this.processorFinished.bind(this);
    this.emitter.on('processorFinished', this.processorFinished);
  }

  performRequest(path) {
    if (this.aggregatedLinks.indexOf(path) === -1) {
      this.aggregatedLinks.push(path);
      let params = Object.assign({}, this.requestParams);
      if (path !== undefined) {
        params.path = path;
      }
      let proc = this.addProcessor();
      http.request(params, (res) => {
        let streamParser = N3.StreamParser();
        res.pipe(streamParser);
        streamParser.pipe(proc);
      }).end();
    } else {
      console.log("Already fetched " + path + ", aborting.");
    }
  }

  processTriple(triple) {
    // TODO What if this is slower than HTTP?? -> github issue
    if (triple.predicate === this.buildingBlocks.previous || triple.predicate === this.buildingBlocks.next) {
      let ts = Consumer.parseTimestampFromLink(triple.object);
      if (Consumer.intervalContains(this.interval, ts)) {
        console.log(ts + " is included in interval, performing request.");
        this.performRequest(triple.object);
      } else {
        console.log(ts + " was not contained in interval.");
      }
    }
    if (triple.predicate === this.buildingBlocks.numberOfVacantSpaces) {
      this.triples.push(triple);
    }
  }

  // From and to are timestamp strings, eg: "2017-04-15T15:45:00"
  getInterval(from, to=Consumer.momentToString(moment())) {
    this.interval = {from: from, to: to};
    this.performRequest("/parking?time=" + from);
  }

  processorFinished(id) {
    console.log("Processor finished");
    this.finishedProcessors[id] = true;
    let allFinished = true;
    for (let proc_id in this.finishedProcessors) {
      if (this.finishedProcessors.hasOwnProperty(proc_id) && !this.finishedProcessors[proc_id]) {
        allFinished = false;
      }
    }
    if (allFinished) {
      console.log("All processors finished");
      this.triples.sort((a,b) => {
        let aTime = moment(a.graph.substring(a.graph.length - 19));
        let bTime = moment(b.graph.substring(b.graph.length - 19));
        return aTime-bTime;
      });
      this.logTriples();
    }
  }

  addProcessor() {
    let proc = new Processor(this.emitter, this.nextId);
    this.finishedProcessors[this.nextId] = false;
    this.nextId++;
    return proc;
  }

  logTriples() {
    this.triples.forEach((triple) => {
      console.log(triple.graph + "\t" + triple.subject + "\t" + triple.object);
    })
  }

  static intervalContains(interval, timestamp) {
    let interval_moment = {from: moment(interval.from), to: moment(interval.to)};
    console.log(interval.from);
    console.log(interval_moment.from);
    let timestamp_moment = moment(timestamp);
    return interval_moment.from <= timestamp_moment && timestamp_moment < interval_moment.to;
  }

  static momentToString(mom) {
    return mom.format().substr(0,19);
  }

  static parseTimestampFromLink(link) {
    let len = link.length;
    return link.substring(len-26, len-7);
  }
}

let consumer = new Consumer();
consumer.getInterval("2017-04-16T15:50:00", "2017-04-16T16:10:00");