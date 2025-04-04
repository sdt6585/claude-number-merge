# Number Merge Puzzle Game

A challenging number merge puzzle game where you combine blocks with the same values to create higher numbers and advance through levels.

## How to Play

1. **Objective**: Merge blocks to create higher numbers and reach level targets
2. **Basic Mechanics**:
   - Connect blocks by clicking/touching and dragging across them
   - The first two blocks must have the same value
   - After that, you can either:
     - Continue connecting blocks with the same value
     - Connect blocks one level higher (double the value)
   - Creating a chain of 3+ same-value blocks gives a 33% bonus
   - Longer chains create higher value blocks

3. **Leveling Up**:
   - Each level has a target value (shown in the top right)
   - When you create a block that meets or exceeds the target, you level up
   - With each level-up:
     - The lowest block value is removed from the game
     - A new higher value is added to possible blocks
     - Colors shift to provide visual feedback

4. **Controls**:
   - Click/touch and drag to select and merge blocks
   - Undo button: Reverts your last move (available every 10 turns)
   - Reset button: Starts a fresh game

## Game Features

- Adaptive difficulty that increases as you progress
- Smooth animations for merges, falls, and level-ups
- Automatic saving of your game progress
- Simple, intuitive touch/mouse controls
- Clean, colorful visual design

## Strategy Tips

- Plan your merges to create chains of same-value blocks for bonus
- Try to create "staircases" of increasingly valuable blocks
- Save your undo for critical moments
- Think several moves ahead to set up valuable combinations

## Technical Details

The game is built using vanilla JavaScript with an MVC architecture:
- Model: Handles game logic and state management
- View: Handles rendering and animations
- Controller: Manages user input and coordinates between Model and View

Game progress is automatically saved to localStorage, so you can continue where you left off.

## Development

To run the game locally:

1. Clone the repository
2. Open index.html in a browser
3. No build process required!

## Future Enhancements

- Additional game modes
- Achievements and statistics
- More strategic special blocks
- Online leaderboards

## License

[MIT License](LICENSE)
