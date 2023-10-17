/*
- Tiles are in the center of the board and they are randomly shuffled
- Each player starts with 21 tiles

- press new game, takes 12 tiles from the centre tiles area and give them to the player
- players can then create words using these tiles
- players can also swap tiles for new ones from the centre tiles area by pressing dump (take 3 tiles from the play area and return 1)
- players can also take a new tile from the centre tiles area by pressing peel (take 1 tile from the centre tiles area)

*/

/*----- constants -----*/
const letters = {'a': 13, 'b': 3, 'c': 3, 'd': 6, 'e': 18, 'f': 3, 'g': 4, 'h': 3, 'i': 12, 'j': 2, 'k': 2, 'l': 5, 'm': 3, 'n': 8, 'o': 11, 'p': 3, 'q': 2, 'r': 9, 's': 6, 't': 9, 'u': 6, 'v': 3, 'w': 3, 'y': 3, 'z': 2
};

/*----- state variables -----*/
const originalTiles = [];
const shuffledTiles = [];
const randomValues = [];
let html = '';
let htmlPlayer = '';
let selectedTile = null;
let letterTileElements;

/*----- cached elements  -----*/
const state = {
    tile: document.querySelectorAll('.tile'),
    player: 'player1',
    computer: 'computer'
}

const originalTilesElement = document.getElementById('original-tiles');

/*----- event listeners -----*/
const placeTile = () => {
    state.player = (state.player === 'player1') ? 'computer' : 'player1';
}

document.getElementById('new-game').addEventListener('click', () => {
    buildOriginalTiles();
    shuffleTiles(document.getElementById('original-tiles'));
});

document.getElementById('split').addEventListener('click', () => {
    split(shuffledTiles, 21, document.getElementById('player-tiles'));
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();
});

document.getElementById('peel').addEventListener('click', () => {
    peel(shuffledTiles, 1, document.getElementById('player-tiles'));
});

document.getElementById('dump').addEventListener('click', () => {
    dump(shuffledTiles, 3, document.getElementById('player-tiles'));
});



/*----- functions -----*/
function buildOriginalTiles() {
    originalTiles.length = 0;
    for (let letter in letters) {
        for (let i = 0; i < letters[letter]; i++) {
            originalTiles.push(letter);
        }
    }
    return originalTiles;
};

const buildPlayArea = (element) => {
    html = '';
    for (let i = 0; i < 209; i++) {
        html += `<div class="tile-play-area"></div>`;
    }
    element.innerHTML = html;
};

buildPlayArea(document.getElementById('play-area'));

// const tiles = document.querySelectorAll('.tile-play-area');

// function tileClickListener() {
//   console.log('Tile clicked!');
// }

// tiles.forEach(tile => {
//   tile.addEventListener('click', () => {
//     if (tile.textContent === '') {
//         const playerTile = randomValues.pop();
//         tile.textContent = playerTile;
//         console.log(playerTile);
//         console.log(randomValues);
//         document.getElementById('player-tiles').innerHTML = htmlPlayer;
//     }
//   });
// });
const attachLetterTileEventListeners = () => {
    if (letterTileElements) {
        letterTileElements.forEach(letterTile => {
            letterTile.addEventListener('click', () => {
                selectedTile = letterTile.textContent;
            });
        });
    }
}

const updatePlayerTiles = () => {
    // Clear the player's hand
    const playerTilesElement = document.getElementById('player-tiles');
    playerTilesElement.innerHTML = '';

    // Rebuild the player's hand with the updated tiles
    randomValues.forEach((tile, index) => {
        playerTilesElement.innerHTML += `<div class="player-tiles" data-index="${index}">${tile}</div>`;
    });

    // Reattach event listeners to the new tiles
    letterTileElements = document.querySelectorAll('.player-tiles');
    attachLetterTileEventListeners();
}

const emptyTiles = document.querySelectorAll('.tile-play-area');
emptyTiles.forEach(emptyTile => {
    emptyTile.addEventListener('click', () => {
        if (selectedTile && emptyTile.textContent === '') {
            // Place the selected tile's letter in the empty square
            emptyTile.textContent = selectedTile;

            const tileIndex = emptyTile.getAttribute('data-index');

            randomValues.splice(tileIndex, 1); // Remove the selected tile from the player's tiles
            
            updatePlayerTiles(); // Update the player's tiles on the screen
            
            selectedTile = null; // Clear the selected tile
        }
    });
});

// Add a click event listener to each letter tile

const shuffleTiles = (element) => {
    html = '';
    shuffledTiles.length = 0;
    // make a varible called tiles that has the keys of the letters object and the value of the letters object is how many of that letter there are
    for (let i = 0; i < originalTiles.length; i++) {
        const randomIndex = Math.floor(Math.random() * originalTiles.length);
        shuffledTiles.push(originalTiles[randomIndex]);
        html += `<div class="tile-area">${originalTiles[randomIndex]}</div>`;
    }

    element.innerHTML = html;
    return shuffledTiles;
}

function split(array, count, element) {
    randomValues.length = 0;
    htmlPlayer = '';
    //const startTilesCopy = [...array]; // Create a copy of the original array to avoid modifying it
    
    // Get 21 random values
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * array.length);
        const randomValue = array.splice(randomIndex, 1)[0]; // Remove the selected value from the array
        randomValues.push(randomValue);
        shuffledTiles.splice(randomIndex, 1);
        htmlPlayer += `<div class="player-tiles" data-index="${randomIndex}">${randomValue}</div>`;
    }
    
    // const playerTiles = document.querySelectorAll(`.${className}`);
    // playerTiles.forEach((tile, index) => {
    //     tile.innerHTML = randomValues[index];
    // });

    //  Update the original-tiles element with the 21 random tiles
    const originalTilesElement = document.getElementById('original-tiles');
    originalTilesElement.innerHTML = ''; // Clear the content
    
    shuffledTiles.forEach((value) => {
        originalTilesElement.innerHTML += `<div class="tile-area">${value}</div>`;
    });
    element.innerHTML = htmlPlayer;
    
    return randomValues;
};

function peel(array, count, element) {
    randomValues.length = 0;
    //htmlPlayer = '';
    const startTilesCopy = [...array]; // Create a copy of the original array to avoid modifying it
    
    // Get 21 random values
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * startTilesCopy.length);
        const randomValue = startTilesCopy.splice(randomIndex, 1)[0]; // Remove the selected value from the array
        randomValues.push(randomValue);
        shuffledTiles.splice(randomIndex, 1);
        console.log(randomValues)
        htmlPlayer += `<div class="player-tiles">${array[randomIndex]}</div>`;
    }
    console.log(htmlPlayer);
    
    // const playerTiles = document.querySelectorAll(`.${className}`);
    // playerTiles.forEach((tile, index) => {
    //     tile.innerHTML = randomValues[index];
    // });

    //  Update the original-tiles element with the 21 random tiles
    const originalTilesElement = document.getElementById('original-tiles');
    originalTilesElement.innerHTML = ''; // Clear the content
    
    shuffledTiles.forEach((value) => {
        originalTilesElement.innerHTML += `<div class="tile-area">${value}</div>`;
    });
    element.innerHTML = htmlPlayer;
    startTiles = startTilesCopy; // Restore the original array
    
    return randomValues;
};

function dump(array, count, element) {
    randomValues.length = 0;
    //htmlPlayer = '';
    const startTilesCopy = [...array]; // Create a copy of the original array to avoid modifying it
    
    // Get 21 random values
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * startTilesCopy.length);
        const randomValue = startTilesCopy.splice(randomIndex, 1)[0]; // Remove the selected value from the array
        randomValues.push(randomValue);
        shuffledTiles.splice(randomIndex, 1);
        console.log(randomValues)
        htmlPlayer += `<div class="player-tiles">${array[randomIndex]}</div>`;
    }
    console.log(htmlPlayer);
    
    // const playerTiles = document.querySelectorAll(`.${className}`);
    // playerTiles.forEach((tile, index) => {
    //     tile.innerHTML = randomValues[index];
    // });

    //  Update the original-tiles element with the 21 random tiles
    const originalTilesElement = document.getElementById('original-tiles');
    originalTilesElement.innerHTML = ''; // Clear the content
    
    shuffledTiles.forEach((value) => {
        originalTilesElement.innerHTML += `<div class="tile-area">${value}</div>`;
    });
    element.innerHTML = htmlPlayer;
    startTiles = startTilesCopy; // Restore the original array
    
    return randomValues;
};