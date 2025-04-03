// Game configuration
const config = {
  //Logging-Debugging
  logLevel: 'info',
  // Grid dimensions
  rows: 8,
  cols: 5,
  
  // Initial values available in the game
  initialValues: [1, 2, 4, 8, 16, 32],
  
  // Colors for different block values
  colors: [
      '#3498db', // Blue
      '#e74c3c', // Red
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Teal
      '#e67e22'  // Burnt Orange
  ],
  
  // Visual settings
  blockSize: 60,
  
  // Game mechanics
  levelUpGap: 6,                 // How many levels ahead the target value is
  undoCooldown: 10,               // Turns until undo is available again
  
  // Value distribution for new blocks
  valueDistribution: {
      lowestValue: 0.6,           // 60% chance for the lowest value
      secondLowestValue: 0.25,    // 25% chance for the second lowest
      otherValues: 0.15           // 15% chance for other values
  },
  
  // Animation durations (in ms)
  animationDuration: {
      merge: 500,
      disappear: 500,
      fall: 300,
      appear: 300,
      levelUp: 2000
  }
};