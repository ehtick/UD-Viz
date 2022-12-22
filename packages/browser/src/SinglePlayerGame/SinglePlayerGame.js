import * as Component from '../../Component/Component.js';
import { AssetsManager } from '../../Views/AssetsManager/AssetsManager';
import * as Views from '../../Views/Views';
import { Game } from '@ud-viz/core';
import { BrowserContext } from '../../Game/BrowserContext.js';

/**
 * A Class contaning method to easily instanciate a browser game based on the ud-viz game engine
 */

export class BrowserGame {
  constructor() {
    this.gameView = null;
    this.browserContext = null;
  }

  /**
   *
   * @returns {GameView} return the gameview of the local game
   */
  getGameView() {
    return this.gameView;
  }

  /**
   * Dispose the application
   */
  dispose() {
    this.gameView.dispose();
  }

  /**
   * Start a local game based on the world, the config and some options
   *
   * @param {World} world world to start
   * @param {string} configPath the path of the config file
   * @param {object} options
   * @returns
   */
  start(world, configPath, options = {}) {
    const _this = this;

    return new Promise((resolve) => {
      Component.SystemUtils.File.loadJSON(configPath).then(function (config) {
        const assetsManager = new AssetsManager(
          options.worldScripts,
          options.browserScripts
        );
        assetsManager
          .loadFromConfig(
            config.assetsManager,
            options.htmlParent || document.body
          )
          .then(function () {
            _this
              .startWithAssetsLoaded(world, assetsManager, config, options)
              .then(resolve);
          });
      });
    });
  }

  startWithAssetsLoaded(world, assetsManager, config, options = {}) {
    const worldStateComputer = new Game.WorldStateComputer(assetsManager, 60);

    worldStateComputer.start(world);

    // Smooth rendering with delay
    const interpolator = new Game.WorldStateInterpolator(
      config.worldStateInterpolator.renderDelay
    );

    // register computer into the interpolator
    interpolator.onFirstState(worldStateComputer.computeCurrentState(false));
    worldStateComputer.addAfterTickRequester(function () {
      interpolator.onNewState(worldStateComputer.computeCurrentState(false));
    });

    if (options.localScriptModules) console.error('no localscripts module');

    this.gameView = new Views.GameView({
      htmlParent: options.htmlParent || document.body,
      config: config,
      userData: options.userData,
    });

    // command from input manager are pull from worldstatecomputer
    worldStateComputer.addAfterTickRequester(() => {
      worldStateComputer.onCommands(
        this.gameView.getInputManager().computeCommands()
      );
    });

    // ref worldstate computer
    this.browserContext = new BrowserContext(assetsManager, interpolator, {
      worldStateComputer: worldStateComputer,
    });

    // Start gameview tick
    return this.gameView.start(this.browserContext);
  }

  getBrowserContext() {
    return this.browserContext;
  }
}