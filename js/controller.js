// Game Controller - Handles user input and game logic
class GameController {
  constructor({ model, view, app } = args) {
    this.model = model;
    this.view = view;
    this.app = app;

    // Game state
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;

    // Initialize event listeners
    this.initEventListeners();
  }

  // Set up event listeners
  initEventListeners() {
    const gameBoard = this.view.gameBoard;
    const undoButton = this.view.undoButton;
    const resetButton = this.view.resetButton;

    // Touch and mouse events for block selection
    gameBoard.addEventListener("mousedown", (e) => this.startDrag(e));
    gameBoard.addEventListener("touchstart", (e) => this.startDrag(e), {
      passive: false,
    });

    window.addEventListener("mousemove", (e) => this.continueDrag(e));
    window.addEventListener("touchmove", (e) => this.continueDrag(e), {
      passive: false,
    });

    window.addEventListener("mouseup", (e) => this.endDrag(e));
    window.addEventListener("touchend", (e) => this.endDrag(e), {
      passive: false,
    });

    // Undo button
    undoButton.addEventListener("click", () => this.undoLastMove());

    // Update undo button state
    this.view.updateUndoButton();

    // Reset Button
    resetButton.addEventListener("click", () => this.resetGame());
  }

  // Start a drag operation (select first block)
  startDrag(e) {
    if (!this.model.state.isInteractive) return;

    e.preventDefault();
    this.isDragging = true;

    // Get touch/mouse position
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    // Store last position
    this.lastX = x;
    this.lastY = y;

    // Get block at position
    const block = this.getBlockAtPosition(x, y);
    if (block) {
      this.selectBlock(block);
    }

    // Clear canvas
    this.view.clearConnectionLines();
  }

  // Continue a drag operation (select additional blocks)
  continueDrag(e) {
    if (!this.isDragging || !this.model.state.isInteractive) return;
    e.preventDefault();

    // Get touch/mouse position
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    //Draw the line
    this.lastX = x;
    this.lastY = y;
    this.view.drawConnectionLines(x, y);

    // Get block at position - should now return the actual block from model.state.grid
    const block = this.getBlockAtPosition(x, y);
    this.app.log("verbose", "Block at position", block);

    if (!block) {
      return;
    }

    this.app.log("verbose", "Current selection", this.model.state.selectedBlocks);

    // Check if we already have selected blocks
    if (this.model.state.selectedBlocks.length > 0) {
      const lastBlock = this.model.state.selectedBlocks[this.model.state.selectedBlocks.length - 1];
      this.app.log("verbose", "Last selected block", lastBlock);

      // Check if we're going backward (deselecting)
      if (this.model.state.selectedBlocks.length >= 2) {
        //Compare the selected block and two blocks back (2 back is including reselectin the block)
        const secondLastBlock = this.model.state.selectedBlocks[this.model.state.selectedBlocks.length - 2];
        
        //Check if they match
        if (block === secondLastBlock) {
          // Remove the last block from selection (going backward)
          const removedBlock = this.model.state.selectedBlocks.pop();
          this.app.log("info", "Removing last block", removedBlock);

          // Deselect visually
          removedBlock.element.classList.remove("selected");

          // Update merge value
          this.model.state.currentMergeValue = this.model.calculateMergeValue(this.model.state.selectedBlocks);
          this.app.log("info", "Updated merge value", this.model.state.currentMergeValue);

          if (this.model.state.selectedBlocks.length > 0) {
            this.view.showMergeValue(this.model.state.currentMergeValue);
          } else {
            this.view.hideMergeValue();
          }
          
          //Don't select, already in selected array
          return;
        }
      }

      // Skip if the block is already in our selection
      if (this.model.isBlockInSelection(block)) {
        this.app.log("verbose", "Block already in selection?", {block, selectedBlocks: this.model.state.selectedBlocks});
        return;
      }

      // Check adjacency with last selected block
      if (!this.model.areBlocksAdjacent(lastBlock, block)) {
        // Not adjacent, don't select
        this.app.log("info", "Rejecting selection: not adjacent to last block");
        return;
      }

      // Check if first two values match
      if (this.model.state.selectedBlocks.length === 1 && block.value !== lastBlock.value) {
        // First two values don't match
        this.app.log("info", "First two values don't match", {firstValue: lastBlock.value, secondValue: block.value});
        return;
      }

      // Ensure we only go up one level after the first two block
      if (block.value !== lastBlock.value && block.value !== lastBlock.value * 2) {
        // Would merge more than one level up
        this.app.log("info", "Rejecting selection: would merge more than one level up or go down", {block, lastBlock});
        return;
      }
    }

    // If we get here, the selection is valid
    this.app.log("info", "Adding block to selection", block);
    this.selectBlock(block);
  }

  // End a drag operation (merge selected blocks)
  async endDrag(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.isDragging = false;

    // Merge selected blocks if valid
    if (this.model.state.selectedBlocks.length >= 2 && this.model.state.isInteractive) {
      const mergeValue = this.model.calculateMergeValue(this.model.state.selectedBlocks);

      // Store previous state for undo
      this.model.storePreviousState();

      // Disable interaction during animations
      this.model.state.isInteractive = false;

      // Hide merge value display
      this.view.hideMergeValue();

      // Process the merge
      await this.processMerge(mergeValue);

      // Reset undo counter
      if (this.model.state.undoAvailable) {
        this.model.state.turnsUntilUndoAvailable = config.undoCooldown;
      }
    } else {
      // Reset selection
      this.resetSelection();
    }

    // Clear canvas
    this.view.clearConnectionLines();
  }

  // Process a merge operation
  async processMerge(mergeValue) {
    //Ensure it's a valid merge (at least two valid selections that net a positive merge value)
    if (mergeValue <= 0 || this.model.state.selectedBlocks.length < 2) {
      this.model.state.isInteractive = true;
      this.resetSelection();
      return;
    }

    // Get the last selected block as the target and all other blocks
    const lastBlock = this.model.state.selectedBlocks[this.model.state.selectedBlocks.length - 1];
    const otherBlocks = this.model.state.selectedBlocks.slice(0, -1);

    // Animate the merge
    await this.view.animateMerge(lastBlock, otherBlocks, mergeValue);

    // Update the model with new value
    this.model.state.grid[lastBlock.row][lastBlock.col].value = mergeValue;

    // Remove other blocks from the grid
    for (const block of otherBlocks) {
      this.model.state.grid[block.row][block.col] = null;
    }

    // Check if this is a new highest value
    if (mergeValue > this.model.state.highestValue) {
      this.model.state.highestValue = mergeValue;
      this.view.updateHighestValueDisplay();

      // Check for level up conditions
      await this.checkForLevelUp(mergeValue);
    }

    // Update score
    this.model.state.score += mergeValue;
    this.view.updateScoreDisplay();

    // Fill empty spaces
    await this.fillEmptySpaces();

    // Re-enable interaction if no other animations are running
    if (this.model.state.animationsInProgress === 0) {
      this.model.state.isInteractive = true;
    }

    // Reset selection
    this.resetSelection();

    // Update undo button state
    this.view.updateUndoButton();

    //Save Game State
    this.saveGameState();
  }

  // Check for level up and apply if needed
  async checkForLevelUp(value) {
    if (this.model.shouldLevelUp(value)) {
      // Calculate level increase
      const levelsToIncrease = this.model.calculateLevelsToIncrease(value);

      // Apply level up
      this.model.levelUp(levelsToIncrease);

      // Show level up notification
      this.view.showLevelUp(levelsToIncrease);

      // Update UI
      this.view.updateLevelDisplay();
      this.view.updateAllBlockColors();
      this.view.updateTargetDisplays();

      // Wait for level up animation
      await this.view.delay(config.animationDuration.levelUp / 2);
    }
  }

  // Fill empty spaces with new blocks
  async fillEmptySpaces() {
    // We'll track moves and new blocks for animation
    const movesToAnimate = [];
    const newBlocks = [];

    // First, find which columns have empty spaces
    for (let col = 0; col < config.cols; col++) {
      // Process column from bottom to top
      for (let row = 0; row < config.rows; row++) {
        if (this.model.state.grid[row][col] === null) {
          // Look for the nearest block above to move down
          let blockFound = false;

          for (let r = row + 1; r < config.rows; r++) {
            if (this.model.state.grid[r][col] !== null) {
              // Found a block, move it down
              const block = this.model.state.grid[r][col];

              // Add to moves to animate
              movesToAnimate.push({
                element: block.element,
                fromRow: r,
                fromCol: col,
                toRow: row,
                toCol: col,
              });

              // Update the grid
              this.model.state.grid[row][col] = block;
              this.model.state.grid[r][col] = null;

              blockFound = true;
              break;
            }
          }

          // If no block found to move down, we'll add a new one at top later
          if (!blockFound) {
            // Row position is kept for the empty cell, it will be filled with a new block
            newBlocks.push({
              row: row,
              col: col,
              value: this.model.getRandomValue(),
            });
          }
        }
      }
    }

    // Animate falling blocks first if there are any
    if (movesToAnimate.length > 0) {
      await this.view.animateFallingBlocks(movesToAnimate);
    }

    // Then animate new blocks appearing
    if (newBlocks.length > 0) {
      await this.view.animateNewBlocks(newBlocks);

      // Update the grid with new blocks
      for (const block of newBlocks) {
        this.model.state.grid[block.row][block.col] = {
          value: block.value,
          element: block.element,
        };
      }
    }

    // Update the highest value display
    this.view.updateHighestValueDisplay();
  }

  // Get the block at a given screen position
  getBlockAtPosition(x, y) {
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      if (element.classList.contains("block")) {
        const rect = element.getBoundingClientRect();

        // Create a smaller hit box (70% of the block size)
        const hitBoxScale = 0.7;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const hitBoxWidth = rect.width * hitBoxScale;
        const hitBoxHeight = rect.height * hitBoxScale;

        // Check if click/touch is within the smaller hit box
        if (x >= centerX - hitBoxWidth / 2 && x <= centerX + hitBoxWidth / 2 && y >= centerY - hitBoxHeight / 2 && y <= centerY + hitBoxHeight / 2) {
          const row = parseInt(element.dataset.row);
          const col = parseInt(element.dataset.col);

          // Get the actual model block and add row/col properties
          const block = this.model.state.grid[row][col];

          // Add row and col to the block object
          block.row = row;
          block.col = col;

          return block;
        }
      }
    }
    return null;
  }

  // Select a block
  selectBlock(block) {
    //Make sure it's a valid block that exists
    if (!this.model.state.grid[block.row][block.col]) return;

    //Make sure it's not already selected
    if (this.model.isBlockInSelection(block)) {
      return;
    }

    // Add block to selection
    this.model.state.selectedBlocks.push(block);

    // Update visual selection
    this.view.selectBlock(block);

    // Update merge value
    this.model.state.currentMergeValue = this.model.calculateMergeValue(this.model.state.selectedBlocks);
  }

  // Reset block selection
  resetSelection() {
    this.view.deselectAllBlocks();
    this.model.resetSelection();
  }

  // Undo the last move
  undoLastMove() {
    if (!this.model.state.undoAvailable || !this.model.state.previousState) return;

    // Restore previous state
    const previousState = this.model.state.previousState;

    // Update the view
    this.view.restoreBoardFromState(previousState);

    // Restore other state data
    this.model.state.score = previousState.score;
    this.model.state.level = previousState.level;
    this.model.state.highestValue = previousState.highestValue;
    this.model.state.availableValues = [...previousState.availableValues];
    this.model.state.colorIndex = previousState.colorIndex;

    // Update displays
    this.view.updateScoreDisplay();
    this.view.updateLevelDisplay();
    this.view.updateHighestValueDisplay();
    this.view.updateTargetDisplays();

    // Disable undo until cooldown is over
    this.model.state.undoAvailable = false;
    this.view.updateUndoButton();
  }

  // Save game state to localStorage
  saveGameState() {
    try {
      // Create a serializable version of the grid
      const serializableGrid = this.model.state.grid.map((row) => row.map((cell) => (cell ? { value: cell.value } : null)));

      // Create a serializable state object
      const saveState = {
        grid: serializableGrid,
        level: this.model.state.level,
        score: this.model.state.score,
        highestValue: this.model.state.highestValue,
        availableValues: [...this.model.state.availableValues],
        colorIndex: this.model.state.colorIndex,
      };

      localStorage.setItem("numberMergePuzzleState", JSON.stringify(saveState));
    } catch (e) {
      console.error("Failed to save game state:", e);
    }
  }

  // Load game state from localStorage
  loadGameState() {
    try {
      const savedState = localStorage.getItem("numberMergePuzzleState");
      if (!savedState) return false;

      const state = JSON.parse(savedState);

      // Restore state properties
      this.model.state.level = state.level;
      this.model.state.score = state.score;
      this.model.state.highestValue = state.highestValue;
      this.model.state.availableValues = [...state.availableValues];
      this.model.state.colorIndex = state.colorIndex;

      // Clear the board
      this.view.gameBoard.innerHTML = "";

      // Create a new grid with blocks based on the saved state
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const cellData = state.grid[row][col];

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
            this.view.gameBoard.appendChild(block);

            // Update the grid
            this.model.state.grid[row][col] = {
              value: cellData.value,
              element: block,
            };
          }
        }
      }

      // Update displays
      this.view.updateHighestValueDisplay();
      this.view.updateScoreDisplay();
      this.view.updateLevelDisplay();
      this.view.updateTargetDisplays();

      return true;
    } catch (e) {
      console.error("Failed to load game state:", e);
      return false;
    }
  }

  // Reset game
  resetGame() {
    let confirmed = confirm("Are you sure you wan to reset you game?");

    if (confirmed) {
      localStorage.removeItem("numberMergePuzzleState");
      window.location.reload();
    }
  }

  // Initialize the game
  initGame() {
    // Try to load saved state first
    const loadedSuccessfully = this.loadGameState();

    // If no saved state found or loading failed, initialize a new board
    if (!loadedSuccessfully) {
      this.view.initializeBoard();
    }

    this.view.updateUndoButton();
  }
}
