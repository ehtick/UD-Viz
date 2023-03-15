/** @file @ud-viz/browser API */

// Template

export { SideBarWidget } from './SideBarWidget/SideBarWidget';

export { SinglePlayerGamePlanar } from './SinglePlayerGamePlanar/SinglePlayerGamePlanar';

export { MultiPlayerGamePlanar } from './MultiPlayerGamePlanar/MultiPlayerGamePlanar';

// Template.Component

export * from './Component/GUI/GUI';

export { TilesManager } from './Component/Itowns/3DTiles/TilesManager';

export { getTileFromMesh } from './Component/Itowns/3DTiles/3DTilesUtils';

import * as ExternalScriptTemplate from './Component/Game/External/ScriptTemplate/ScriptTemplate';
export { ExternalScriptTemplate };

import * as ExternalGame from './Component/Game/External/ExternalGame';
export { ExternalGame };

import * as FileUtil from './Component/FileUtil';
export { FileUtil };

import * as THREEUtil from './Component/THREEUtil';
export { THREEUtil };

import * as Widget from './Component/Widget/Widget';
export { Widget };

export { InputManager } from './Component/InputManager';

export { RequestService } from './Component/RequestService';

export { SocketIOWrapper } from './Component/SocketIOWrapper';

export { AssetManager } from './Component/AssetManager/AssetManager';

export { Frame3DPlanar, Frame3DBase } from './Component/Frame3D/Frame3D';

export { Billboard } from './Component/Frame3D/Component/Billboard';

export { RequestAnimationFrameProcess } from './Component/RequestAnimationFrameProcess';

import * as Shared from '@ud-viz/shared';
export { Shared };

export {
  setup3DTilesLayer,
  add3DTilesLayers,
  addBaseMapLayer,
  addElevationLayer,
  addGeoJsonLayers,
  addLabelLayers,
} from './Component/Itowns/AddLayerFromConfig';

export * from './Component/HTMLUtil';

/**
 * @class CityObject
 * @class CityObjectID
 */
export {
  CityObject,
  CityObjectID,
} from './Component/Itowns/3DTiles/Model/CityObject';

/**
 * External packages => These packages should be peerDep to force user of @ud-viz/browser to npm i them
 * Make a second index.js (indexBundle.js) so examples can still work
 * Like itowns => https://github.com/iTowns/itowns/blob/master/src/MainBundle.js
 *
 * - @ud-viz/shared also ?
 */

// itowns
import * as itowns from 'itowns';
import * as itownsWidgets from 'itowns/widgets';
export { itowns, itownsWidgets };

// // Jquery => should be peerDep for lib purpose
// import * as jquery from 'jquery';
// export { jquery };

// THREE
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
export {
  THREE,
  OrbitControls,
  TransformControls,
  ConvexGeometry,
  EffectComposer,
  RenderPass,
  ShaderPass,
};

// proj4
import * as proj4 from 'proj4';
export { proj4 };

// jquery
import * as jquery from 'jquery';
export { jquery };
