import { RequestService } from '../../../../Components/Request/RequestService';
import {SparqlEndpointFetcher} from "fetch-sparql-endpoint";

/**
 * The SPARQL Endpoint Service which contains connection information for
 * a specific SPARQL Endpoint.
 */
export class SparqlEndpointService extends RequestService {
  /**
   * Creates a SPARQL Endpoint Service
   *
   * @param {object} config The configuration of UD-Viz.
   * @param {object} config.sparqlModule The sparqlModule configuration.
   * @param {string} config.sparqlModule.url The SPARQL endpoint url.
   * @param {string} config.sparqlModule.url_parameters The SPARQL endpoint url parameters.
   */
  constructor(config) {
    super();

    if (
      !!config &&
      !!config.sparqlModule &&
      !!config.sparqlModule.url &&
      !!config.sparqlModule.url_parameters
    ) {
      // wget "http://localhost:9999/strabon/Query?handle=download&query=%0ASELECT+*%0AWHERE+%7B+%0A%09%3Fs+%3Fp+%3Fo%09%0A%7D%0A&format=SPARQL/JSON&view=HTML"
      this.url = config.sparqlModule.url;
      this.url_parameters = config.sparqlModule.url_parameters;
    } else {
      throw 'The given configuration is incorrect.';
    }

    /**
     * SPARQL endpoint query handler
     * @type {SparqlEndpointFetcher} 
     */
    this.queryFetcher = new SparqlEndpointFetcher();
  }

  /**
   * Perform a SPARQL Query. Cache and return the response
   *
   * @async
   * @param {string} query The query to be sent to the SPARQL endpoint.
   * @return {Promise<Object>}
   */
  async querySparqlEndpoint(query) {
    let full_url = this.url + this.url_parameters + encodeURI(query);
    let options = {};

    let request = await this.request('GET', full_url, options);

    if (request.status !== 200) {
      throw 'Could not query SPARQL endpoint: ' + request.statusText;
    }

    let response = JSON.parse(request.responseText);
    // const bindingsStream = await this.queryFetcher.fetchBindings('http://localhost:9999/strabon/', 'SELECT * WHERE { ?s ?p ?o } LIMIT 100');
    // bindingsStream.on('data', (bindings) => console.log(bindings));

    console.log(query);
    console.log(response);
    return response;
  }
}
