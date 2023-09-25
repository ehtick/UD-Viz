// Everything there should be contributed at some point in itowns

const THREE = require('three');
const itowns = require('itowns');

/** CAMERA */

/**
 * Makes the camera move to focus on the target position.
 *
 * @param {itowns.View} view The iTowns view.
 * @param {itowns.PlanarControls} controls The camera controls.
 * @param {THREE.Vector3} targetPos The target position.
 * @param {*} [options] Optional parameters for the travel. Accepted entries
 * are :
 * - `duration` : the duration of the movement, in seconds. The promise will
 * resolve after this value. If not specified, the value `auto` is used for
 * the movement (see the `PlanarControls.initateTravel` method), and the promise
 * resolves imediatly.
 * - `verticalDistance` : Desired height of the camera relative to the target
 * position.
 * - `horizontalDistance` : Desired distance of the camera from the target
 * position.
 * @returns {Promise} Promise of the camera focusing on target
 * @todo this function is used by widget should be contribute to itowns or be remove
 */
export function focusCameraOn(view, controls, targetPos, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const duration = options.duration || null;
      const verticalDist = options.verticalDistance || 800;
      const horizontalDist = options.horizontalDistance || 1000;

      const cameraPos = view.camera.camera3D.position.clone();
      const direction = new THREE.Vector3().subVectors(targetPos, cameraPos);
      const currentDist = Math.sqrt(
        direction.x * direction.x + direction.y * direction.y
      );
      cameraPos.addScaledVector(direction, 1 - horizontalDist / currentDist);
      cameraPos.z = targetPos.z + verticalDist;
      const travelDuration = duration ? duration : 'auto';
      const timeoutDuration = duration ? duration * 1000 : 0;
      controls.initiateTravel(cameraPos, travelDuration, targetPos, true);
      setTimeout(resolve, timeoutDuration);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 *
 * Focus a C3DTiles Layer
 *
 * @param {itowns.PlanarView} itownsView - view
 * @param {itowns.C3DTilesLayer} layer - layer to focus
 * @todo this function is used by widget should be contribue or removed
 */
export function focusC3DTilesLayer(itownsView, layer) {
  if (!layer.isC3DTilesLayer) return;

  const coordinates = itownsView.camera.position();
  const extent = layer.extent;
  coordinates.x = (extent.east + extent.west) / 2;
  coordinates.y = (extent.north + extent.south) / 2;
  coordinates.z = 200;
  if (layer.tileset.tiles[0])
    coordinates.z = layer.tileset.tiles[0].boundingVolume.box.max.z;
  focusCameraOn(itownsView, itownsView.controls, coordinates, {
    verticalDistance: 200,
    horizontalDistance: 200,
  });
}

/**
 * fetchC3DTileFeatureWithNodeText takes a parameter `batchTableKey` and returns a feature from a `3DTileslayer` if
 * the batch table content of the feature contains a given `batchTableValue` string in the given key. Returns an object
 * containing the first matching feature and its layer.
 *
 * @param {itowns.PlanarView} itownsView - view
 * @param {string} batchTableKey a given batch table key
 * @param {string} batchTableValue a given batch table value
 * @returns {object} containting the feature and the layer containing the feature
 */
export function fetchC3DTileFeatureWithNodeText(
  itownsView,
  batchTableKey,
  batchTableValue
) {
  let result = null;
  itownsView
    .getLayers()
    .filter((el) => el.isC3DTilesLayer)
    .forEach((c3DTilesLayer) => {
      for (const [
        // eslint-disable-next-line no-unused-vars
        tileId,
        tileC3DTileFeatures,
      ] of c3DTilesLayer.tilesC3DTileFeatures) {
        // eslint-disable-next-line no-unused-vars
        for (const [batchId, c3DTileFeature] of tileC3DTileFeatures) {
          if (
            c3DTileFeature.getInfo().batchTable[batchTableKey] ==
            batchTableValue
          ) {
            result = {
              feature: c3DTileFeature,
              layer: c3DTilesLayer,
            };
            break;
          }
        }
      }
    });

  return result;
}