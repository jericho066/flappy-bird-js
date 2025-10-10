# Flappy Bird JS

A fully-featured Flappy Bird clone built with JavaScript and HTML5 Canvas. This project includes smooth animations, sound effects, sprite-based graphics, and responsive gameplay.

## Features
- Bird animation with three color options
- Pipe obstacles with random heights and colors
- Day and night backgrounds
- Score display using sprite images
- Game over and restart functionality
- Sound effects for flapping, scoring, hitting, and dying
- Flash effects when hitting pipes and ground.
- Responsive canvas that adapts to window size
- Mouse, touch, and keyboard controls
- Graceful fallback to colored shapes/text if assets fail to load

## Demo 
[Live Demo](https://jericho066.github.io/flappy-bird-js/)

## Folder Structure
```
index.html
src/
  script.js
  assets/
    sounds/
      die.ogg
      hit.ogg
      point.ogg
      wing.ogg
    sprites/
      bg/
        background-day.png
        background-night.png
      birds/
        bluebird-downflap.png
        bluebird-midflap.png
        bluebird-upflap.png
        redbird-downflap.png
        redbird-midflap.png
        redbird-upflap.png
        yellowbird-downflap.png
        yellowbird-midflap.png
        yellowbird-upflap.png
      others/
        base.png
        gameover.png
        message.png
        PlayButton.png
      pipes/
        pipe-green.png
        pipe-red.png
      score/
        0.png
        1.png
        2.png
        3.png
        4.png
        5.png
        6.png
        7.png
        8.png
        9.png
```

## How to Run
1. **Clone the repository:**
   ```
   git clone https://github.com/jericho066/flappy-bird-js.git
   cd flappy-bird-js
   ```
2. **Start a local server:**
   - Use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code, or run:
     ```
     python -m http.server
     ```
     or
     ```
     npx serve
     ```
3. **Open `index.html` in your browser.**

## Controls
- **Click/Tap/Spacebar:** Flap the bird
- **Restart:** Click the restart button or press Spacebar after game over

## Credits
- This project uses assets from Samuel Custodio [https://github.com/samuelcust/flappy-bird-assets] under the MIT License

## License
This project is licensed under <a href="https://github.com/jericho066/flappy-bird-js/blob/main/LICENSE">MIT</a> License.
