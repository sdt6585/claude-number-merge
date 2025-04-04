# Number Merge Puzzle Game - Development Prompt

## Project Overview
I am building a number-based puzzle game where players merge blocks with the same values to create higher-value blocks. The game follows an MVC architecture with clean separation of concerns between game logic, rendering, and user input handling.

## Core Game Mechanics
- Grid-based playing field (8x5 default)
- Blocks contain numbers that are powers of 2 (1, 2, 4, 8, 16...)
- Player can connect blocks by dragging across them
- The first two blocks in a chain must have the same value
- Subsequent blocks can be either:
  - The same value as previous blocks
  - One level higher (2x value) than previous blocks
- Combining 3+ blocks of the same value gives a 33% bonus value
- Merged value is the smallest power of 2 greater than or equal to the sum of the merged blocks
- When blocks are merged, new blocks fall from the top to fill empty spaces
- Level progression system that removes lower values and introduces higher values
- Game state is saved automatically to localStorage

## Technical Requirements
- Vanilla JavaScript (no frameworks)
- MVC architecture:
  - **Model**: Handles game state, logic, and rules
  - **View**: Renders the game, handles animations
  - **Controller**: Processes user input, coordinates model and view
- Responsive design that works on both desktop and mobile
- Touch and mouse input support
- Modern CSS with animations
- No external dependencies

## Features to Implement
1. **Core Mechanics**:
   - Block selection and chain validation
   - Merging logic with value calculations
   - Gravity system for blocks to fall when spaces are created
   - Level progression system

2. **User Interface**:
   - Game board with colorful, clearly visible blocks
   - Score display and level indicator
   - Visual feedback for selections and merges
   - Undo button with cooldown
   - Reset button for starting fresh

3. **Visual Effects**:
   - Merge animations
   - Block falling animations
   - Level-up effects
   - Connection lines between selected blocks

4. **Game Progression**:
   - Increasing difficulty with higher levels
   - Color cycling for visual feedback on level changes
   - Target display showing next level threshold

5. **Data Management**:
   - Save/load system using localStorage
   - Undo functionality with state history

## Performance Considerations
- Optimize animations for smooth gameplay
- Efficient hit detection for block selection
- Minimal DOM manipulations
- Use requestAnimationFrame for animations when appropriate
- Consider using CSS transitions for simpler animations
- Test on various devices for responsiveness and performance

## Future Enhancements
- Special blocks with unique abilities
- Daily challenges
- Statistics tracking
- Achievements system
- Different game modes (timed, endless, puzzle)
- Sound effects and music
- Enhanced visual themes