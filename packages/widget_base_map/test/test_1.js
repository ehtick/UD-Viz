() => {
  return new Promise((resolve) => {
    /**
     * @type {typeof import("../../../bin/indexExamples") }
     */
    const udviz = window.udviz;

    const crs = 'EPSG:3857';

    const instance = new udviz.widgetBaseMap.BaseMap(
      new udviz.itowns.View(crs, document.createElement('div')),
      [],
      new udviz.itowns.Extent(crs, 0, 1, 0, 1)
    );

    console.log(instance.baseMapLayersConfigs);

    resolve();
  });
};