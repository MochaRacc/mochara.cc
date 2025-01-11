import * as PIXI from "pixi.js";
import { AdvancedBloomFilter, AsciiFilter } from "pixi-filters";
import tetra from "../img/mocha.png";

export function init(error = false) {
  const app = new PIXI.Application({ resizeTo: window });
  document.body.appendChild(app.view as HTMLCanvasElement);

  const tetraSprite = PIXI.Sprite.from(tetra, {
    mipmap: PIXI.MIPMAP_MODES.ON
  });

  tetraSprite.anchor.set(0.5);

  const bloomFilter = new AdvancedBloomFilter({ threshold: 0.6 });
  tetraSprite.filters = [bloomFilter];
  tetraSprite.scale.set(0.17);

  let elapsed = 0.0;
  app.ticker.add((delta) => (elapsed += delta));

  app.ticker.add(() => {
    // float the dog
    tetraSprite.x = app.screen.width / (3 / 2);
    tetraSprite.y = Math.cos(elapsed / 50) * 20 + app.screen.height / 2;
    bloomFilter.bloomScale = (Math.sin(elapsed / 100) + 1) / 2;
  });