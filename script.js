let data = [];  // Global variable to store the data

// Load data from the external file (e.g., data.json)
fetch('data.json')
  .then(response => response.json())
  .then(loadedData => {
    data = loadedData; // Store the data after loading
    console.log(data); // Log to check data is loaded
  })
  .catch(error => console.error('Error loading data:', error));

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Adjust canvas size for responsiveness
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle resizing of the window
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let bow = { x: 100, y: canvas.height / 2, radius: 60, angle: 0, stringPulled: 0 };
let arrows = [];
let words = [];
let currentMeaning = "";
let score = 0;
let isGameRunning = false;
let gameInterval;
let timerInterval;
let timeLeft = 60; // Set a default time limit

// Start the game
document.getElementById("startGame").addEventListener("click", startGame);

function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    score = 0;
    words = [];
    arrows = [];
    currentMeaning = pickRandomMeaning();
    spawnWords();
    gameInterval = setInterval(updateGame, 20);
    timerInterval = setInterval(updateTimer, 1000);
}

// Pick a random meaning to display
function pickRandomMeaning() {
    const random = data[Math.floor(Math.random() * data.length)];
    return random.meaning;
}

// Spawn words randomly
function spawnWords() {
    setInterval(() => {
        const randomWord = data[Math.floor(Math.random() * data.length)];
        words.push({
            ...randomWord,
            x: canvas.width,
            y: Math.random() * (canvas.height - 50) + 25,
            speed: 2,
        });
    }, 2000);
}

// Event listeners for mouse and touch
canvas.addEventListener("mousedown", (e) => {
    bow.stringPulled = -20; // Pull the string
});

canvas.addEventListener("mouseup", (e) => {
    bow.stringPulled = 0; // Release the string
    arrows.push({
        x: bow.x + 50,
        y: bow.y,
        speed: 5,
    });
});

// Handle touch events for mobile devices
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Prevent the default action (e.g., scrolling)
    bow.stringPulled = -20; // Pull the string
});

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    bow.stringPulled = 0; // Release the string
    arrows.push({
        x: bow.x + 50,
        y: bow.y,
        speed: 5,
    });
});

// Aim bow with mouse or touch
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    bow.y = mouseY; // Adjust bow's vertical position based on mouse
});

// Handle touch move (for mobile)
canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    bow.y = touchY; // Adjust bow's vertical position based on touch
});

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBow();
    drawRope();
    moveArrows();
    moveWords();
    checkCollisions();
    drawArrows();
    drawWords();
    drawScore();
    drawCurrentMeaning();
    drawMessage(); // Display message on screen
    drawTimer(); // Display the timer
}

// Draw bow as arc
function drawBow() {
    ctx.beginPath();
    ctx.arc(bow.x, bow.y, bow.radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "brown";
    ctx.stroke();
    ctx.closePath();
}

// Draw rope for the bow
function drawRope() {
    ctx.beginPath();
    const offset = bow.stringPulled;
    ctx.moveTo(bow.x, bow.y - bow.radius);
    ctx.lineTo(bow.x + offset, bow.y);
    ctx.lineTo(bow.x, bow.y + bow.radius);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
}

// Draw arrows
function drawArrows() {
    ctx.fillStyle = "black";
    arrows.forEach(arrow => {
        ctx.fillRect(arrow.x, arrow.y - 2, 40, 4); // Longer arrow shape
        ctx.beginPath();
        ctx.moveTo(arrow.x + 40, arrow.y); // Arrow tip
        ctx.lineTo(arrow.x + 45, arrow.y - 3);
        ctx.lineTo(arrow.x + 45, arrow.y + 3);
        ctx.fill();
    });
}

// Draw words
function drawWords() {
    ctx.font = "20px Arial";
    words.forEach(word => {
        ctx.fillStyle = "blue";
        ctx.fillText(word.word, word.x, word.y); // Draw the word
        
        // Draw the pronunciation next to the word
        ctx.fillStyle = "green";
        ctx.fillText(`(${word.pronunciation})`, word.x + 60, word.y);
    });
}

// Move arrows
function moveArrows() {
    arrows = arrows.filter(arrow => {
        arrow.x += arrow.speed;
        return arrow.x < canvas.width;
    });
}

// Move words
function moveWords() {
    words.forEach(word => {
        word.x -= word.speed;
    });
    words = words.filter(word => word.x > 0);
}

// Check collisions
let correctHits = 0; // Correct hits counter
let totalHits = 0; // Total attempts counter
let message = ""; // To display messages when a word is hit
let messageTimer = 0; // Timer to clear the message after a while

function checkCollisions() {
    arrows.forEach((arrow, arrowIndex) => {
        words.forEach((word, wordIndex) => {
            if (
                arrow.x < word.x + 50 &&
                arrow.x + 40 > word.x &&
                arrow.y < word.y + 20 &&
                arrow.y > word.y - 20
            ) {
                totalHits++; // Increase total attempts count

                if (word.meaning === currentMeaning) {
                    // Correct match
                    correctHits++; // Increase correct hits counter
                    currentMeaning = pickRandomMeaning(); // Update displayed meaning
                    message = "Correct!";
                } else {
                    // Wrong match
                    currentMeaning = pickRandomMeaning(); // Update to new meaning on wrong hit
                    message = `WRONG! ${word.word}: ${word.meaning}`;
                }
                messageTimer = 100; // Display message for a short duration
                words.splice(wordIndex, 1); // Remove the word
                arrows.splice(arrowIndex, 1); // Remove the arrow
            }
        });
    });
}

// Draw messages
function drawMessage() {
    if (messageTimer > 0) {
        ctx.fillStyle = message.startsWith("WRONG") ? "red" : "green";
        ctx.font = "20px Arial";
        ctx.fillText(message, canvas.width / 2 - 100, canvas.height / 2);
        messageTimer--;
    }
}

// Draw timer
function drawTimer() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Time Left: ${timeLeft}s`, canvas.width - 120, 30); // Display time left
}

// Draw score
function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${correctHits}/${totalHits}`, 10, 30); // Display score as correct/total hits
}

// Draw current meaning
function drawCurrentMeaning() {
    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.fillText("Meaning: " + currentMeaning, canvas.width / 2 - 80, 30);
}

// Update timer
function updateTimer() {
    timeLeft--;
    if (timeLeft <= 0) {
        stopGame(); // Stop the game when time runs out
    }
}

// // Stop the game when time runs out
// function stopGame() {
//     clearInterval(gameInterval);
//     clearInterval(timerInterval);
//     isGameRunning = false;
//     drawGameOverMessage();
// }

// Draw game-over message
function drawGameOverMessage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Game Over! Your Score: ${correctHits}/${totalHits}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText("Click Start Game to Play Again", canvas.width / 2, canvas.height / 2 + 20);
}
