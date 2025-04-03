// App Entry Point
document.addEventListener('DOMContentLoaded', () => {
  //Create app
  let app = {};

  //Setup logging
  app.log = function (level, message, data) {
    const levels = {
      error: 0,
      info: 1,
      verbose: 2
    }

    logLevel = levels[level];
    configLevel = levels[config.logLevel];

    if (logLevel <= configLevel) {
      console.log(`${level}: ${message}`, data)
    }
  }

  
  // Create MVC components
  const model = new GameModel();
  const view = new GameView(model);
  const controller = new GameController({model, view, app});
  
  // Initialize the game
  controller.initGame({app});
  
  // Optional: Add window resize handler to redraw connection lines
  window.addEventListener('resize', () => {
      view.clearConnectionLines();
      view.resizeCanvas();
  });
  
  // Prevent default touch behavior on the game container to avoid scrolling issues
  const gameContainer = document.getElementById('game-container');
  gameContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
  }, { passive: false });
  
  console.log('Number Merge Puzzle Game initialized!');
});