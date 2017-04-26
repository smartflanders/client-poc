/*let N3 = require('n3');
let config = require('config');
let moment = require('moment-timezone');
let EventEmitter = require('events');
let Stream = require('stream');*/

let N3 = require('n3');
let http = require('follow-redirects').http;
let moment = require('moment-timezone');
let EventEmitter = require('events');
let Stream = require('stream');

// TODO refactor this: IntervalConsumer should be a subclass of Consumer

function Processor(emitter, id) {
  let writer = new Stream.Writable({ objectMode: true });
  writer.write = function (triple) {
    emitter.emit('gotTriple', triple);
  };
  writer.on('finish', function() {
    emitter.emit('processorFinished', id)
  });
  return writer;
}

class Consumer extends Stream.Readable {
  constructor(conf = {parallel: true}) {
    super({objectMode: true});
    this.triples = [];
    this.conf = conf;
    this.baseUrl = "https://linked.open.gent/parking/";
    this.requestParams = {
        "path": this.baseUrl
    };
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

    // Variables for sequential use (parallel = false in conf)
    if (!conf.parallel) {
      this.requestQueue = [];
      this.performRequestFromQueue = this.performRequestFromQueue.bind(this);
      this.emitter.on('readyForRequest', this.performRequestFromQueue);
    }

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
    }
  }

  processTriple(triple) {
    if (triple.predicate === this.buildingBlocks.previous || triple.predicate === this.buildingBlocks.next) {
      let ts = Consumer.parseTimestampFromLink(triple.object);
      if (Consumer.intervalContains(this.interval, ts)) {
        if (this.conf.parallel) {
          this.performRequest(triple.object);
        } else {
          this.requestQueue.push(triple.object);
        }
      }
    }
    //if (triple.predicate === this.buildingBlocks.numberOfVacantSpaces) {
      this.triples.push(triple);
      this._read();
    //}
  }

  performRequestFromQueue() {
    let object = this.requestQueue.pop();
    this.performRequest(object);
  }

  // From and to are timestamp strings, eg: "2017-04-15T15:45:00"
  getInterval(from, to=Consumer.momentToString(moment())) {
    this.interval = {from: from, to: to};
    this.performRequest(this.baseUrl + "?time=" + from);
  }

  processorFinished(id) {
    this.finishedProcessors[id] = true;
    if (!this.conf.parallel) this.emitter.emit('readyForRequest');
    let allFinished = true;
    for (let proc_id in this.finishedProcessors) {
      if (this.finishedProcessors.hasOwnProperty(proc_id) && !this.finishedProcessors[proc_id]) {
        allFinished = false;
      }
    }
    if (allFinished) {
      /*this.triples.sort((a,b) => {
        let aTime = moment(a.graph.substring(a.graph.length - 19));
        let bTime = moment(b.graph.substring(b.graph.length - 19));
        return aTime-bTime;
      });
      this.logTriples();*/
    }
  }

  addProcessor() {
    let proc = new Processor(this.emitter, this.nextId);
    this.finishedProcessors[this.nextId] = false;
    this.nextId++;
    return proc;
  }

  _read() {
    let triple = this.triples.pop();
    if (triple !== undefined) {
      this.push(triple)
    }
  }

  /*logTriples() {
    this.triples.forEach((triple) => {
      console.log(triple.graph + "\t" + triple.subject + "\t" + triple.object);
    })
  }*/

  static intervalContains(interval, timestamp) {
    let interval_moment = {from: moment(interval.from), to: moment(interval.to)};
    let timestamp_moment = moment(timestamp);
    return interval_moment.from <= timestamp_moment && timestamp_moment < interval_moment.to;
  }

  // TODO use normal moment, makes this obsolete
  static momentToString(mom) {
    return mom.format().substr(0,19);
  }

  static parseTimestampFromLink(link) {
    let len = link.length;
    return link.substring(len-19);
  }
}

module.exports = Consumer;