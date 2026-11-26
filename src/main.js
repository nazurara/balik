// Mode HD: kanvas 1920x1080, dunia tetap 960x540 (kamera zoom 2x). Teks dirender 2x agar tajam.
(function () {
  const F = Phaser.GameObjects.GameObjectFactory.prototype, t = F.text;
  F.text = function () { return t.apply(this, arguments).setResolution(2); };
})();
function startGame() {
  if (window.__balik) return;
  window.__balik = new Phaser.Game({
    type: Phaser.AUTO, width: 1920, height: 1080, parent: 'game', backgroundColor: '#0e0b1c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 1400 }, debug: false } },
    input: { activePointers: 4 },
    fps: { smoothStep: false, min: 10 },
    render: { antialias: true, roundPixels: false },
    scene: [PreBootScene, BootScene, TitleScene, StoryScene, InterludeScene, GameScene, EndingScene]
  });
}
const fontReady = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('20px "Pixelify Sans"'), new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
fontReady.then(startGame, startGame);
