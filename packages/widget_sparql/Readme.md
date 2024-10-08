# @ud-viz/widget_sparql

[![NPM package version](https://badgen.net/npm/v/@ud-viz/widget_sparql)](https://npmjs.com/package/@ud-viz/widget_sparql)

## SPARQL Module

The SPARQL Module adds basic functionality to query and visualize Semantic Web data stored in a Strabon Triple-store from a UD-Viz interface.

## Basic functionalities

The basic functionalities of the SPARQL module include:

- Query a [SPARQL Endpoint](https://github.com/VCityTeam/UD-SV/blob/master/Vocabulary/Readme.md#SPARQL-Endpoint) via HTTP request.
- Data is returned in the form of RDF and vizualised with [D3.js](https://d3js.org/) as a graph.
- The vizualised graph data can be used to select, focus on, and highlight corresponding to city objects.

## Installation

You can install the package via npm:

```bash
npm install @ud-viz/widget_sparql
```

## Usage

For an example of how to the SPARQL Widget to a UD-Viz web application see the [SPARQLWidget example](https://github.com/VCityTeam/UD-Viz/blob/master/examples/widget_sparql.html)

### User Interface

The Interface is composed of a **SPARQL Query** window containing a text box for composing queries to send to a [SPARQL Endpoint](https://github.com/VCityTeam/UD-SV/blob/master/Vocabulary/Readme.md#SPARQL-Endpoint).

![SPARQL widget interface](./img/interface.png)

The _Results Format_ dropdown menu can be used to select how the query results will be visualised. Currently 3 formats are supported:

- [Graph](#graph-view)
- [Table](#table)
- [JSON](#json)

#### Graph View

A displayed graph can be zoomed in and out using the mouse wheel and panned by clicking and dragging the background of the graph. In addition, nodes can be moved by clicking and dragging them.

![Vizualize SPARQL query result in D3](./img/sparql-widget-demo.gif)

In order to propery colorize the nodes of a graph a SPARQL query must be formulated following a simple subject-predicate-object [RDF triple](https://github.com/VCityTeam/UD-SV/blob/master/Vocabulary/Readme.md#triple) structure. Colors will be assigned as a function each node's `rdf:type`. Thus 4 data must be selected:

- ?subject
- ?object
- ?predicate
- ?subjectType
- ?objectType

For example the following query on [this](https://github.com/VCityTeam/UD-Graph/blob/sparql-demo/SPARQL_Demo/data/LYON_1ER_BATI_2015-20_bldg-patched.rdf) RDF dataset returns all building city objects in a city model:

```sql
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
PREFIX gmlowl:  <http://www.opengis.net/ont/gml#>
PREFIX units: <http://www.opengis.net/def/uom/OGC/1.0/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX strdf: <http://strdf.di.uoa.gr/ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX core: <http://www.opengis.net/citygml/2.0/core#>
PREFIX bldg: <http://www.opengis.net/citygml/building/2.0/building#>

# Return all CityGML City Objects
SELECT ?subject ?subjectType ?predicate ?object ?objectType
WHERE {
  ?subject a core:CityModel ;
    ?predicate ?object .
  ?subject a ?subjectType .
  ?object a bldg:Building .
  ?object a ?objectType .

  FILTER(?subjectType != <http://www.w3.org/2002/07/owl#NamedIndividual>)
  FILTER(?objectType != <http://www.w3.org/2002/07/owl#NamedIndividual>)
}
```

An example of the visualization of this query:

![Pick City Object from Graph](./img/pickcityobjectfromgraph.gif)

#### Table

The table view features a filter for searching for data within a column. In addition rows can be sorted in ascending or descending order by column.
The table also provides features for filtering and ordering the table contents.

![Table view demonstraction](./img/sparql-widget-table-demo.gif)

#### JSON

The JSON view returns a collapsible representation of the query reponse.

![JSON view demonstraction](./img/sparql-widget-json-demo.gif)

#### Customizing events with D3

D3 provides event handlers for when users interact with elements of the visualized data.
These events can be used to add functionality to the interface depending on the needs of an application.

In the example below, the URIs of nodes in the graph correspond with identifiers of objects in the tileset batch table.

- _mouseover_ and _mouseout_ events are used to highlight the corresponding geometry of the object in the 3D scene.
- A _click_ event is used to zoom in on the corresponding geometry.

![an example of customized D3 mouse events](./img/node-event-example.gif)

To see how this can be done check out the [SPARQL module example](./../../examples/widget_sparql.html)

## Code architecture

The SPARQL code is divided into 3 subfolders:

```mermaid
flowchart TD
  A(SPARQL) --> Model
  A(SPARQL) --> Server
  A(SPARQL) --> View
```

- The model classes are responsible for providing data structures for storing and formating the data returned by the server.
  - The `Table` and `Graph` classes use the [D3.js](https://d3js.org/) library to provide data structures for formating data from the `SparqlEndpointService`.
  - The `URI` class provides a data structure for storing URI strings.
- The server classes are responsible for providing an interface or adapter for transmitting data between the other module classes and the server.
  - The class responsible for making the requests is the `SparqlEndpointService`. Using a SPARQL query, it fetches [RDF](https://github.com/VCityTeam/UD-SV/blob/master/Vocabulary/Readme.md#resource-description-framework) data from the server as a JSON Object data structure.
  - The `SparqlEndpointResponseProvider` is an `EventSender` for informing classes subscribed to its events, when the `SparqlEndpointService` sends or receives data.
- The view is responsible for displaying the data retrieved from the view model and providing a user interface. It has a `SparqlWidgetView` class which manages a `SparqlQueryWindow` window class. This window is responsible for providing the user a form for entering and executing queries using the `SparqlEndpointResponseProvider` class and vizualising the data returned by the provider.

## Module Configuration

The module takes two configuration files:

1. Server configuration
2. Widget (view+model) configuration

### Widget Configuration

The minimal configuration required to make a SPARQL server class work is the following :

```json
{
  "url": "http://localhost:9999/strabon/",
  "url_parameters": "Query?handle=download&format=SPARQL/JSON&view=HTML&query="
}
```

- `sparqlModule.url` represents the base URL for the server.
- `sparqlModule.url_parameters` represents the URL parameters to query the server via an HTTP request.

The SPARQL Query Service for interfacing with Strabon expects the URL to correspond to a REST API, where query routes are in the form `{url}{url_parameters}`

Parameters can also be configured to define custom queries in the interface:
See the [SparqlEndpointService](https://vcityteam.github.io/UD-Viz/html/browser/SparqlEndpointService.html) documentation for more information

### View/Model Configuration

The minimal configuration required to make a SPARQL Widget class work is the following :

```json
{
  "height": 500,
  "width": 500,
  "fontSize": 4
  "fontFamily": "Arial",
  "strokeWidth": 0.75,
  "nodeSize": 7,
  "defaultColor": "#dedede",
  "linkColor": "#999",
  "nodeStrokeColor": "black",
  "fontSizeLegend": 14,
}
```

- `height` the height (in pixels) of a d3 canvas for visualizing graphs
- `width` the width (in pixels) of a d3 canvas for visualizing graphs
- `fontSize` fontsize to be used in the d3 canvas for labeling graph nodes
- `fontFamily` fontfamily to be used in the d3 canvas for labeling graph nodes
- `strokeWidth` the width (in pixels) of the color of the nodes' and links' stroke
- `nodeSize` the radius (in pixels) of the circles representing the nodes
- `defaultColor` the color of the nodes without the property `color_id`
- `linkColor` the color of the links
- `nodeStrokeColor` the color of the nodes' stroke
- `fontSizeLegend` fontsize to be used in the d3 canvas for displaying the legend

Parameters can also be configured to use custom labels instead of full URI namespaces in the legend.

```json
{
    "namespaceLabels": {
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "rdf",
      "http://www.w3.org/2000/01/rdf-schema#": "rdfs",
      "http://www.w3.org/2002/07/owl#": "owl",
      "http://www.w3.org/2004/02/skos/core#": "skos",
      "http://www.opengis.net/gml#": "gml",
      "http://www.opengis.net/ont/geosparql#": "geo",
      "https://raw.githubusercontent.com/VCityTeam/UD-Graph/master/Ontologies/Workspace/3.0/transactiontypes#": "type",
      "https://dataset-dl.liris.cnrs.fr/rdf-owl-urban-data-ontologies/Ontologies/CityGML/3.0/building#": "bldg",
      "https://dataset-dl.liris.cnrs.fr/rdf-owl-urban-data-ontologies/Ontologies/CityGML/3.0/construction#": "con",
      "http://def.isotc211.org/iso19107/2003/CoordinateGeometry#": "iso19107-cm",
  }
}
```

It is also possible to configure custom queries. You can either define a query with the `exploration` attribute or the `filepath` attribute:

- the `filepath` attribute is used to specify a path to a file in which a sparql query has already been written
- the `exploration` attribute is used to set the context for queries updated gradually by the user thanks to the `SparqlQuery.js` class and the method `updateExplorationQuery` of the `SparqlQueryWidget.js` class

When an exploration query is selected, clicking on an element in the 3D scene adds the corresponding node and its children to the graph.

```json
{
  "queries": [
      {
        "title": "Exploration query",
        "formats": {
          "graph": "Graph",
          "json": "JSON"
        },
        "exploration": {
          "prefix": [
            ["bldg", "https://dataset-dl.liris.cnrs.fr/rdf-owl-urban-data-ontologies/Ontologies/CityGML/2.0/building#"],
            ["skos", "http://www.w3.org/2004/02/skos/core#"],
            ["data", "https://dataset-dl.liris.cnrs.fr/rdf-owl-urban-data-ontologies/Datasets/Villeurbanne/2018/GratteCiel_2018_split#"]
          ],
          "select_variable": [
            "subject",
            "subjectType",
            "predicate",
            "object",
            "objectType"
          ],
          "options": [
            ["FILTER", "?subjectType != owl:NamedIndividual"],
            ["FILTER", "!bound(?objectType) || ?objectType != owl:NamedIndividual"],
            ["FILTER", "?subject != owl:NamedIndividual"],
            ["FILTER", "?object != owl:NamedIndividual"]
          ]
        }
      },
      {
        "title": "Construct query",
        "formats": {
          "graph": "Graph",
          "json": "JSON"
        },
        "filepath": "./assets/queries/construct.rq"
      }
    ]
  }
```

## The D3GraphCanvas.js class

Two new parameters have been added to the `D3GraphCanvas.js` class:

- the handleZoom function for configuring zoom management in the graph
- the formatResponse function for formatting the JSON response into node and link objects

The formatResponse function should add the nodes and links to the attributes `nodes` and `links` of the instance of `Graph.js`.

```js
data.nodes = [
  {
    id: "node's id",
    type: "node's type", // OPTIONAL 
    color_id: "node's color in hex", // OPTIONAL 
  },
]

data.links = [
  {
    source: "source node's id",
    target: "target node's id", 
    label: "link's label" 
  },
]

```

It can also define the `legend` attribute of the Graph `data`.

```js
data.legend = [
  {
    type: "description",
    color: "color to the rectangle associated to the description", 
  },
]
```

Two default parameters are defined to handle the zoom and format the response returned by an instance of the `SparqlEndpointResponseProvider.js` class.

## The SparqlQuery.js class

The SPARQL query class is used for writing SPARQL queries based on defined conditions. Here are the conditions that can be defined:

- the variables following the SELECT statement
- the conditions in the WHERE clause
- the different options and filters of the query
- the prefixes

Then, the method `generateQuery` builds and returns the corresponding query.

Here is the architecture of the built query:

```rq
[prefix]
SELECT ?select_variable[0] , ?select_variable[1] , ...
WHERE
{
  {
    where_conditions[0]
  } UNION {
    where_conditions[1]
  } UNION {
    ...
  }
  options[0][0] { options[0][1] } # options[0][0] = OPTIONAL
  options[1][0] ( options[1][1] ) # options[1][0] = FILTER
  ...
}
```

## Documentation

> [Online Documentation](https://vcityteam.github.io/UD-Viz/html/widget_sparql/)

## Contributing

Contributions are welcome! Feel free to submit bug reports, feature requests, or pull requests on the GitHub repository. See [Contributing.md](https://github.com/VCityTeam/UD-Viz/blob/master/docs/static/Contributing.md).

## License

This package is licensed under the [GNU Lesser General Public License Version 2.1](https://github.com/VCityTeam/UD-Viz/blob/master/LICENSE.md), with copyright attributed to the University of Lyon.

## Credits

`@ud-viz/widget_sparql` is developed and maintained by [VCityTeam](https://github.com/VCityTeam). See [Contributors.md](https://github.com/VCityTeam/UD-Viz/blob/master/docs/static/Contributors.md).
