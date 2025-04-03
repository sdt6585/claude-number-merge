// Game Model - Manages game state and logic
class GameModel {
  constructor() {
      // Initialize the game state
      this.state = {
          grid: Array(config.rows).fill().map(() => Array(config.cols).fill(null)),
          level: 1,
          score: 0,
          selectedBlocks: [],
          currentMergeValue: 0,
          availableValues: [...config.initialValues],
          highestValue: config.initialValues[0],
          undoAvailable: true,
          turnsUntilUndoAvailable: 0,
          previousState: null,
          colorIndex: 0,
          animationsInProgress: 0,
          isInteractive: true
      };
  }

  // Create a deep copy of the current state for undo functionality
  storePreviousState() {
      const serializedGrid = this.state.grid.map(row => 
          row.map(cell => 
              cell ? { 
                  value: cell.value, 
                  row: cell.element.dataset.row, 
                  col: cell.element.dataset.col 
              } : null
          )
      );
      
      this.state.previousState = {
          grid: serializedGrid,
          score: this.state.score,
          level: this.state.level,
          highestValue: this.state.highestValue,
          availableValues: [...this.state.availableValues],
          colorIndex: this.state.colorIndex
      };
  }

  // Get a random value from available values based on configured distribution
  getRandomValue() {
      const rand = Math.random();
      
      if (rand < config.valueDistribution.lowestValue) {
          // Highest probability for the lowest value
          return this.state.availableValues[0];
      } else if (rand < config.valueDistribution.lowestValue + config.valueDistribution.secondLowestValue) {
          // Medium probability for the second lowest value
          return this.state.availableValues[Math.min(1, this.state.availableValues.length - 1)];
      } else {
          // Low probability for any other value
          const index = Math.floor(Math.random() * this.state.availableValues.length);
          return this.state.availableValues[index];
      }
  }

  // Get color for a block based on its value
  getBlockColor(value) {
      const index = this.state.availableValues.indexOf(value);
      if (index >= 0) {
          return config.colors[(this.state.colorIndex + index) % config.colors.length];
      }
      
      // If the value is not in available values (e.g., merged value), 
      // use the color of the highest available value
      return config.colors[(this.state.colorIndex + this.state.availableValues.length - 1) % config.colors.length];
  }

  // Format a number for display (e.g., 1000 → 1K)
  formatNumber(num) {
      if (num < 1000) return num;
      
      const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
      
      // For values beyond the standard notation
      if (num >= 1e36) {
          const log1000 = Math.floor(Math.log10(num) / 3);
          if (log1000 <= 36) {
              // First use a, b, c, d
              return Math.floor(num / Math.pow(10, 3 * (log1000 - 12))) + 
                     String.fromCharCode(96 + (log1000 - 12));
          } else {
              // Then use aa, ab, ac, etc.
              const firstChar = Math.floor((log1000 - 37) / 26) + 97;
              const secondChar = ((log1000 - 37) % 26) + 97;
              return Math.floor(num / Math.pow(10, 3 * log1000)) + 
                     String.fromCharCode(firstChar) + String.fromCharCode(secondChar);
          }
      }
      
      // Standard notation (K, M, B, etc.)
      const magnitude = Math.floor(Math.log10(num) / 3);
      return Math.floor(num / Math.pow(10, 3 * magnitude)) + units[magnitude];
  }

  // Calculate the merge value for a set of blocks
  calculateMergeValue(blocks) {
    if (blocks.length < 2) return 0;
    
    // Extract values from blocks
    const values = blocks.map(block => this.state.grid[block.row][block.col].value);
    
    // Group values
    const valueGroups = {};
    values.forEach(value => {
        valueGroups[value] = (valueGroups[value] || 0) + 1;
    });
    
    let totalValue = 0;
    
    // Calculate contribution of each value group
    for (const [value, count] of Object.entries(valueGroups)) {
        // Apply bonus for groups of 3 or more
        if (count >= 3) {
            totalValue += value * count * 1.33;
        } else {
            totalValue += value * count;
        }
    }
    
    // Find the smallest power of 2 that's >= our total
    return Math.pow(2, Math.ceil(Math.log2(totalValue)));
  }

  // Check if blocks are adjacent (including diagonally if allowed)
  areBlocksAdjacent(block1, block2) {
      const rowDiff = Math.abs(block1.row - block2.row);
      const colDiff = Math.abs(block1.col - block2.col);
      
      return (rowDiff <= 1 && colDiff <= 1); // Adjacent or diagonal
  }

  // Check if a block is already in the selection
  isBlockInSelection(block) {
      return this.state.selectedBlocks.some(b => b.row === block.row && b.col === block.col);
  }

  // Reset the block selection
  resetSelection() {
      this.state.selectedBlocks = [];
      this.state.currentMergeValue = 0;
  }

  // Calculate target value for level up
  calculateTargetValue() {
      const highestAvailableValue = this.state.availableValues[this.state.availableValues.length - 1];
      // Set target to be config.levelUpGap levels ahead of current max shown value
      return highestAvailableValue * Math.pow(2, config.levelUpGap);
  }

  // Check if the game should level up based on a new value
  shouldLevelUp(value) {
      const targetValue = this.calculateTargetValue();
      return value >= targetValue;
  }

  // Calculate how many levels to increase
  calculateLevelsToIncrease(value) {
      let levelsToIncrease = 0;
      let currentTargetVal = this.calculateTargetValue();
      
      // Keep leveling up as long as the merged value exceeds targets
      while (value >= currentTargetVal) {
          levelsToIncrease++;
          // The next target would be double the current target
          currentTargetVal *= 2;
      }
      
      return levelsToIncrease;
  }

  // Apply level up
  levelUp(levelsToIncrease) {
    for (let i = 0; i < levelsToIncrease; i++) {
        // Level up!
        this.state.level++;
        
        // Rotate color pattern
        this.state.colorIndex = (this.state.colorIndex + 1) % config.colors.length;
        
        // Update available values:
        // Remove the lowest value
        this.state.availableValues.shift();
        
        // Always add the next power of 2
        const highestAvailableValue = this.state.availableValues[this.state.availableValues.length - 1];
        const newHighValue = highestAvailableValue * 2;
        this.state.availableValues.push(newHighValue);
    }
  }

  // Update undo availability after a move
  updateUndoAvailability() {
      if (!this.state.undoAvailable && this.state.turnsUntilUndoAvailable > 0) {
          this.state.turnsUntilUndoAvailable--;
          
          if (this.state.turnsUntilUndoAvailable === 0) {
              this.state.undoAvailable = true;
              return true; // Indicates undo became available
          }
      }
      return false; // No change in undo availability
  }

  // Get the logical position in our grid (0,0 at bottom left)
  // from the visual position in CSS grid (0,0 at top left)
  getLogicalPosition(visualRow, col) {
      // Invert the row to have (0,0) at bottom left
      const logicalRow = config.rows - 1 - visualRow;
      return { row: logicalRow, col };
  }

  // Get the visual position in CSS grid (0,0 at top left)
  // from the logical position in our grid (0,0 at bottom left)
  getVisualPosition(logicalRow, col) {
      // Invert the row to have (0,0) at top left
      const visualRow = config.rows - 1 - logicalRow;
      return { row: visualRow, col };
  }
}