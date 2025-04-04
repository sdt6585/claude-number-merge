// Game View - Manages game rendering and animations
class GameView {
  constructor(model) {
    this.model = model;

    // Cache DOM elements
    this.gameBoard = document.getElementById("game-board");
    this.scoreDisplay = document.getElementById("score");
    this.levelDisplay = document.getElementById("level");
    this.mergeValueDisplay = document.getElementById("merge-value");
    this.undoButton = document.getElementById("undo-button");
    this.resetButton = document.getElementById("reset-button");
    this.canvas = document.getElementById("line-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.currentTargetDisplay = document.getElementById("current-target");
    this.nextLevelDisplay = document.getElementById("next-level");

    // Resize the canvas to match the display size
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  // Resize canvas to match display size
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  // Initialize the game board display
  initializeBoard() {
    // Set grid dimensions
    this.gameBoard.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;
    this.gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;

    // Clear any existing blocks
    this.gameBoard.innerHTML = "";

    // Create and add blocks to the game board
    for (let logicalRow = 0; logicalRow < config.rows; logicalRow++) {
      for (let col = 0; col < config.cols; col++) {
        const visualPos = this.model.getVisualPosition(logicalRow, col);

        // Create new block element
        const block = document.createElement("div");
        block.className = "block";

        // Set position attributes (data attributes store logical position)
        block.dataset.row = logicalRow;
        block.dataset.col = col;

        // Set CSS grid position (visual position)
        block.style.gridColumn = col + 1;
        block.style.gridRow = visualPos.row + 1;

        // Get random value from available values
        const value = this.model.getRandomValue();
        block.textContent = this.model.formatNumber(value);
        block.style.backgroundColor = this.model.getBlockColor(value);

        // Add to game board
        this.gameBoard.appendChild(block);

        // Update the model's grid
        this.model.state.grid[logicalRow][col] = { value, element: block };

        // Update highest value if necessary
        if (value > this.model.state.highestValue) {
          this.model.state.highestValue = value;
        }
      }
    }

    // Update displays
    this.updateHighestValueDisplay();
    this.updateScoreDisplay();
    this.updateLevelDisplay();
    this.updateTargetDisplays();
  }

  // Update score display
  updateScoreDisplay() {
    this.scoreDisplay.textContent = this.model.formatNumber(this.model.state.score);
  }

  // Update level display
  updateLevelDisplay() {
    this.levelDisplay.textContent = this.model.state.level;
  }

  // Update the highest value blocks display
  updateHighestValueDisplay() {
    // Remove highest class from all blocks
    document.querySelectorAll(".block.highest").forEach((el) => {
      el.classList.remove("highest");
    });

    // Find blocks with the highest value and mark them
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (this.model.state.grid[row][col] !== null && this.model.state.grid[row][col].value === this.model.state.highestValue) {
          this.model.state.grid[row][col].element.classList.add("highest");
        }
      }
    }
  }

  // Update the target displays
  updateTargetDisplays() {
    const targetValue = this.model.calculateTargetValue();
    const nextLevelValue = targetValue * 2;

    this.currentTargetDisplay.textContent = this.model.formatNumber(targetValue);
    this.currentTargetDisplay.style.backgroundColor = this.model.getBlockColor(targetValue);

    this.nextLevelDisplay.textContent = this.model.formatNumber(nextLevelValue);
    this.nextLevelDisplay.style.backgroundColor = this.model.getBlockColor(nextLevelValue);
  }

  // Show merge value display
  showMergeValue(value) {
    this.mergeValueDisplay.textContent = this.model.formatNumber(value);
    this.mergeValueDisplay.style.opacity = "1";
  }

  // Hide merge value display
  hideMergeValue() {
    this.mergeValueDisplay.style.opacity = "0";
  }

  // Show level up notification
  showLevelUp(levelsToIncrease) {
    /*** TODO: Fix this - deleted the element, need to create the element, add it, and then show the level up amount 
     * Old element <div id="level-up">Level Up!</div>
     * Changing to an alert for now
     */
    // this.levelUpDisplay.textContent = levelsToIncrease > 1 ? `Level Up! +${levelsToIncrease} levels` : "Level Up!";
    // this.levelUpDisplay.style.opacity = "1";

    // setTimeout(() => {
      // this.levelUpDisplay.style.opacity = "0";
    // }, config.animationDuration.levelUp);

    alert(levelsToIncrease > 1 ? `Level Up! +${levelsToIncrease} levels` : "Level Up!");
  }

  // Draw connection lines between selected blocks
  drawConnectionLines(currentX, currentY) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.model.state.selectedBlocks.length === 0) return;

    // Draw connections between selected blocks
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();

    // Get the center of the first block
    const firstBlock = this.model.state.selectedBlocks[0];
    const firstElement = this.model.state.grid[firstBlock.row][firstBlock.col].element;
    const firstRect = firstElement.getBoundingClientRect();
    const startX = firstRect.left + firstRect.width / 2;
    const startY = firstRect.top + firstRect.height / 2;

    // Convert to canvas coordinates
    const canvasRect = this.canvas.getBoundingClientRect();
    this.ctx.moveTo(startX - canvasRect.left, startY - canvasRect.top);

    // Draw lines between all selected blocks
    for (let i = 1; i < this.model.state.selectedBlocks.length; i++) {
      const block = this.model.state.selectedBlocks[i];
      const element = this.model.state.grid[block.row][block.col].element;
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - canvasRect.left;
      const y = rect.top + rect.height / 2 - canvasRect.top;

      this.ctx.lineTo(x, y);
    }

    // Draw line to current position
    if (currentX && currentY) {
      this.ctx.lineTo(currentX - canvasRect.left, currentY - canvasRect.top);
    }

    // Add a pulsing effect
    const time = Date.now() / 1000;
    const pulseWidth = 3 + Math.sin(time * 5) * 2;
    this.ctx.lineWidth = pulseWidth;

    this.ctx.stroke();
  }

  // Clear connection lines
  clearConnectionLines() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Select a block (visual selection)
  selectBlock(block) {
    if (!this.model.state.grid[block.row][block.col]) return;

    this.model.state.grid[block.row][block.col].element.classList.add("selected");

    // Update merge value display
    const mergeValue = this.model.calculateMergeValue(this.model.state.selectedBlocks);
    this.showMergeValue(mergeValue);
  }

  // Deselect all blocks
  deselectAllBlocks() {
    this.model.state.selectedBlocks.forEach((block) => {
      if (this.model.state.grid[block.row][block.col]) {
        this.model.state.grid[block.row][block.col].element.classList.remove("selected");
      }
    });
    this.hideMergeValue();
  }

  // Helper function to create a promise that resolves after a delay
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Animate merge effect
  async animateMerge(lastBlock, otherBlocks, mergeValue) {
    const animationPromises = [];
    this.model.state.animationsInProgress++;

    // Get the first selected block element (target for merge)
    const targetElement = this.model.state.grid[lastBlock.row][lastBlock.col].element;

    // Animate all other blocks to disappear
    for (const block of otherBlocks) {
      const element = this.model.state.grid[block.row][block.col].element;

      // Start disappear animation
      element.classList.add("disappearing");

      // Create promise for this animation
      const animPromise = new Promise((resolve) => {
        const handler = () => {
          element.removeEventListener("animationend", handler);
          element.remove();
          resolve();
        };
        element.addEventListener("animationend", handler);
      });

      animationPromises.push(animPromise);
    }

    // Start merge animation on the target block
    targetElement.classList.add("merging");

    // Create promise for the target animation
    const targetAnimPromise = new Promise((resolve) => {
      const handler = () => {
        targetElement.removeEventListener("animationend", handler);
        targetElement.classList.remove("merging");

        // Update the target block with new value
        targetElement.textContent = this.model.formatNumber(mergeValue);
        targetElement.style.backgroundColor = this.model.getBlockColor(mergeValue);

        resolve();
      };
      targetElement.addEventListener("animationend", handler);
    });

    animationPromises.push(targetAnimPromise);

    // Wait for all animations to complete
    await Promise.all(animationPromises);

    this.model.state.animationsInProgress--;
    return true;
  }

  // Animate blocks falling to fill empty spaces
  async animateFallingBlocks(moves) {
    const animationPromises = [];
    this.model.state.animationsInProgress++;

    // Animate each block moving
    for (const move of moves) {
      const { element, fromRow, fromCol, toRow, toCol } = move;

      // Set new data attributes
      element.dataset.row = toRow;
      element.dataset.col = toCol;

      // Calculate CSS grid position (visual position)
      const visualPos = this.model.getVisualPosition(toRow, toCol);
      element.style.gridRow = visualPos.row + 1;
      element.style.gridColumn = toCol + 1;

      // Animate the fall
      element.classList.add("falling");

      // Create promise for this animation
      const animPromise = new Promise((resolve) => {
        const handler = () => {
          element.removeEventListener("animationend", handler);
          element.classList.remove("falling");
          resolve();
        };
        element.addEventListener("animationend", handler);
      });

      animationPromises.push(animPromise);
    }

    // Wait for all animations to complete
    await Promise.all(animationPromises);

    this.model.state.animationsInProgress--;
    return true;
  }

  // Animate new blocks appearing at the top
  async animateNewBlocks(newBlocks) {
    const animationPromises = [];
    this.model.state.animationsInProgress++;

    // Add and animate each new block
    for (const blockData of newBlocks) {
      const { row, col, value } = blockData;

      // Calculate visual position
      const visualPos = this.model.getVisualPosition(row, col);

      // Create a new block element
      const block = document.createElement("div");
      block.className = "block appearing";
      block.dataset.row = row;
      block.dataset.col = col;

      // Set position in grid
      block.style.gridColumn = col + 1;
      block.style.gridRow = visualPos.row + 1;

      // Set content and style
      block.textContent = this.model.formatNumber(value);
      block.style.backgroundColor = this.model.getBlockColor(value);

      // Add to game board
      this.gameBoard.appendChild(block);

      // Create promise for this animation
      const animPromise = new Promise((resolve) => {
        const handler = () => {
          block.removeEventListener("animationend", handler);
          block.classList.remove("appearing");
          resolve();
        };
        block.addEventListener("animationend", handler);
      });

      animationPromises.push(animPromise);

      // Store reference to the element in the model
      blockData.element = block;
    }

    // Wait for all animations to complete
    await Promise.all(animationPromises);

    this.model.state.animationsInProgress--;
    return true;
  }

  // Update undo button state
  updateUndoButton() {
    this.undoButton.disabled = !this.model.state.undoAvailable || !this.model.state.previousState;
  }

  // Restore the board from a previous state (for undo)
  restoreBoardFromState(previousState) {
    // Clear the board
    this.gameBoard.innerHTML = "";

    // Create a new grid with blocks based on the previous state
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const cellData = previousState.grid[row][col];

        if (cellData !== null) {
          const visualPos = this.model.getVisualPosition(row, col);

          // Create block element
          const block = document.createElement("div");
          block.className = "block";
          block.dataset.row = row;
          block.dataset.col = col;

          // Set position in grid
          block.style.gridColumn = col + 1;
          block.style.gridRow = visualPos.row + 1;

          // Set content and style
          block.textContent = this.model.formatNumber(cellData.value);
          block.style.backgroundColor = this.model.getBlockColor(cellData.value);

          // Add to game board
          this.gameBoard.appendChild(block);

          // Update the grid
          this.model.state.grid[row][col] = { value: cellData.value, element: block };
        }
      }
    }
  }

  // Update the colors of all blocks after a level up
  updateAllBlockColors() {
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (this.model.state.grid[row][col] !== null) {
          const blockValue = this.model.state.grid[row][col].value;
          this.model.state.grid[row][col].element.style.backgroundColor = this.model.getBlockColor(blockValue);
        }
      }
    }
  }
}
