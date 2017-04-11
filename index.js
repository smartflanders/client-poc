let N3 = require('n3');
let http = require('follow-redirects').http;
let stream = require('stream');
let config = require('config');
let moment = require('moment-timezone');

class Consumer extends stream.Writable {
  constructor() {
    super();
    this.triples = [];
    this.streamParser = N3.StreamParser();
    this.requestParams = config.get('requestParams');
    this.buildingBlocks = config.get('buildingBlocks');
  }

  performRequest(path) {
    let params = this.requestParams;
    if (path !== undefined) {
        params.path = path;
    }
    http.request(params, (res) => {
        res.pipe(this.streamParser);
        this.streamParser.pipe(this);
    }).end();
  }

  write(triple) {
    // TODO decide what happens with triple here (is it a prev/next link, is it a recording, ...)
    // TODO how can we see if the stream is available? HTTP request queue? https://nodejs.org/api/events.html
    // What if this is slower than HTTP?? -> github issue
    if (triple.predicate === this.buildingBlocks.previous) {
      this.parseTimestampFromLink(triple.object);
    }
    if (triple.predicate === this.buildingBlocks.next) {
      this.parseTimestampFromLink(triple.object);
    }
    this.triples.push(triple);
  }

  parseTimestampFromLink(link) {
    let len = link.length;
    return moment(link.substring(len-26, len-7));
  }

  logTriples() {
    console.log(this.triples);
  }
}

let consumer = new Consumer();
consumer.performRequest();
