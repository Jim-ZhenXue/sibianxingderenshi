class GeometryKingdom {
    constructor() {
        this.initializeGame();
        this.setupEventListeners();
        this.startGame();
    }

    initializeGame() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Game state
        this.gameState = {
            level: 1,
            score: 0,
            lives: 3,
            exp: 0,
            selectedCharacter: null,
            inventory: [],
            achievements: [],
            mode: 'draw'
        };

        // Drawing state
        this.points = [];
        this.isDragging = false;
        this.selectedPoint = null;
        this.isDrawing = false;

        // Game levels
        this.levels = [
            {
                id: 1,
                name: "认识四边形",
                description: "画一个任意四边形",
                hint: "点击画布上的四个点来创建一个四边形",
                reward: { coins: 100, exp: 50 },
                validate: (points) => points.length === 4
            },
            {
                id: 2,
                name: "长方形大师",
                description: "画一个长方形（四个角都是直角）",
                hint: "记住：长方形的四个角都是90度",
                reward: { coins: 150, exp: 75 },
                validate: (points) => this.isRectangle(points)
            },
            {
                id: 3,
                name: "完美正方形",
                description: "画一个正方形（四条边相等，四个角都是直角）",
                hint: "正方形的四条边长度相等，四个角都是90度",
                reward: { coins: 200, exp: 100 },
                validate: (points) => this.isSquare(points)
            },
            {
                id: 4,
                name: "平行四边形挑战",
                description: "画一个平行四边形（对边平行且相等）",
                hint: "确保对边平行，并且长度相等",
                reward: { coins: 250, exp: 125 },
                validate: (points) => this.isParallelogram(points)
            },
            {
                id: 5,
                name: "梯形探索",
                description: "画一个梯形（只有一组对边平行）",
                hint: "梯形只有一组对边平行，另一组不平行",
                reward: { coins: 300, exp: 150 },
                validate: (points) => this.isTrapezoid(points)
            }
        ];

        // Current level
        this.currentLevel = this.levels[0];
        
        // Update UI
        this.updateUI();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Button events
        document.getElementById('drawMode').addEventListener('click', () => this.setMode('draw'));
        document.getElementById('dragMode').addEventListener('click', () => this.setMode('drag'));
        document.getElementById('eraseMode').addEventListener('click', () => this.setMode('erase'));
        document.getElementById('checkButton').addEventListener('click', () => this.checkAnswer());
        document.getElementById('hintButton').addEventListener('click', () => this.showHint());
        document.getElementById('resetButton').addEventListener('click', () => this.resetLevel());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        // Character selection
        document.querySelectorAll('.character').forEach(char => {
            char.addEventListener('click', (e) => this.selectCharacter(e.currentTarget.dataset.character));
        });

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setMode(mode) {
        this.gameState.mode = mode;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}Mode`).classList.add('active');
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch(this.gameState.mode) {
            case 'draw':
                if (this.points.length < 4) {
                    this.points.push({ x, y });
                    this.draw();
                }
                break;
            case 'drag':
                this.selectedPoint = this.findNearestPoint(x, y);
                this.isDragging = true;
                break;
            case 'erase':
                const pointToRemove = this.findNearestPoint(x, y);
                if (pointToRemove) {
                    this.points = this.points.filter(p => p !== pointToRemove);
                    this.draw();
                }
                break;
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.selectedPoint) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.selectedPoint.x = x;
        this.selectedPoint.y = y;
        this.draw();
    }

    handleMouseUp() {
        this.isDragging = false;
        this.selectedPoint = null;
    }

    findNearestPoint(x, y) {
        return this.points.find(point => {
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            return distance < 20;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw shape
        if (this.points.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.points[0].x, this.points[0].y);
            
            for (let i = 1; i < this.points.length; i++) {
                this.ctx.lineTo(this.points[i].x, this.points[i].y);
            }

            if (this.points.length === 4) {
                this.ctx.lineTo(this.points[0].x, this.points[0].y);
            }
            
            this.ctx.strokeStyle = '#1a73e8';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // Draw points
        this.points.forEach((point, index) => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fill();
            
            // Draw point labels
            this.ctx.fillStyle = '#333';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(String.fromCharCode(65 + index), point.x + 10, point.y + 10);
        });
    }

    drawGrid() {
        const gridSize = 30;
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    checkAnswer() {
        if (this.points.length !== 4) {
            this.showMessage('请先画一个完整的四边形！');
            return;
        }

        if (this.currentLevel.validate(this.points)) {
            this.showSuccess();
        } else {
            this.gameState.lives--;
            this.updateUI();
            this.showMessage('不太对，再试试看！');
            
            if (this.gameState.lives <= 0) {
                this.gameOver();
            }
        }
    }

    showSuccess() {
        const reward = this.currentLevel.reward;
        this.gameState.score += reward.coins;
        this.gameState.exp += reward.exp;
        
        document.getElementById('rewardCoins').textContent = reward.coins;
        document.getElementById('rewardExp').textContent = reward.exp;
        document.getElementById('levelCompleteDialog').style.display = 'flex';
        
        this.updateUI();
        this.checkAchievements();
    }

    showMessage(message) {
        // You can implement a more sophisticated message system
        alert(message);
    }

    showHint() {
        this.showMessage(this.currentLevel.hint);
    }

    nextLevel() {
        const nextLevelIndex = this.levels.indexOf(this.currentLevel) + 1;
        if (nextLevelIndex < this.levels.length) {
            this.currentLevel = this.levels[nextLevelIndex];
            this.resetLevel();
            document.getElementById('levelCompleteDialog').style.display = 'none';
        } else {
            this.showMessage('恭喜你完成了所有关卡！');
        }
    }

    resetLevel() {
        this.points = [];
        this.draw();
        this.updateUI();
    }

    gameOver() {
        document.getElementById('gameOverDialog').style.display = 'flex';
    }

    restartGame() {
        this.gameState.lives = 3;
        this.gameState.score = 0;
        this.gameState.exp = 0;
        this.currentLevel = this.levels[0];
        this.resetLevel();
        document.getElementById('gameOverDialog').style.display = 'none';
    }

    selectCharacter(character) {
        this.gameState.selectedCharacter = character;
        document.querySelectorAll('.character').forEach(char => {
            char.classList.toggle('selected', char.dataset.character === character);
        });
    }

    updateUI() {
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('playerLevel').textContent = Math.floor(this.gameState.exp / 100) + 1;
        document.getElementById('currentMission').textContent = this.currentLevel.description;
        
        // Update lives display
        const livesContainer = document.querySelector('.lives');
        livesContainer.innerHTML = Array(this.gameState.lives).fill('<i class="fas fa-heart"></i>').join('');
    }

    // Geometry validation methods
    isRectangle(points) {
        const angles = this.calculateAngles(points);
        return angles.every(angle => Math.abs(angle - 90) < 10);
    }

    isSquare(points) {
        if (!this.isRectangle(points)) return false;
        
        const sides = this.calculateSides(points);
        const firstSide = sides[0];
        return sides.every(side => Math.abs(side - firstSide) < 10);
    }

    isParallelogram(points) {
        const slopes = this.calculateSlopes(points);
        return Math.abs(slopes[0] - slopes[2]) < 0.1 && 
               Math.abs(slopes[1] - slopes[3]) < 0.1;
    }

    isTrapezoid(points) {
        const slopes = this.calculateSlopes(points);
        const parallel1 = Math.abs(slopes[0] - slopes[2]) < 0.1;
        const parallel2 = Math.abs(slopes[1] - slopes[3]) < 0.1;
        return (parallel1 && !parallel2) || (!parallel1 && parallel2);
    }

    calculateAngles(points) {
        const angles = [];
        for (let i = 0; i < 4; i++) {
            const prev = points[(i + 3) % 4];
            const curr = points[i];
            const next = points[(i + 1) % 4];
            
            const angle = this.calculateAngle(prev, curr, next);
            angles.push(angle);
        }
        return angles;
    }

    calculateAngle(p1, p2, p3) {
        const angle = Math.atan2(p3.y - p2.y, p3.x - p2.x) -
                     Math.atan2(p1.y - p2.y, p1.x - p2.x);
        return Math.abs(angle * 180 / Math.PI);
    }

    calculateSides(points) {
        const sides = [];
        for (let i = 0; i < 4; i++) {
            const curr = points[i];
            const next = points[(i + 1) % 4];
            const distance = Math.sqrt(
                Math.pow(next.x - curr.x, 2) + Math.pow(next.y - curr.y, 2)
            );
            sides.push(distance);
        }
        return sides;
    }

    calculateSlopes(points) {
        const slopes = [];
        for (let i = 0; i < 4; i++) {
            const curr = points[i];
            const next = points[(i + 1) % 4];
            const slope = (next.y - curr.y) / (next.x - curr.x);
            slopes.push(slope);
        }
        return slopes;
    }

    checkAchievements() {
        const achievements = [
            {
                id: 'first_shape',
                name: '初次创作',
                description: '完成第一个四���形',
                condition: () => this.gameState.score > 0
            },
            {
                id: 'perfect_square',
                name: '完美主义者',
                description: '画出一个完美的正方形',
                condition: () => this.currentLevel.name === "完美正方形" && this.points.length === 4
            },
            {
                id: 'speed_master',
                name: '快速大师',
                description: '在30秒内完成一关',
                condition: () => true // 需要实现计时功能
            }
        ];

        achievements.forEach(achievement => {
            if (!this.gameState.achievements.includes(achievement.id) && achievement.condition()) {
                this.gameState.achievements.push(achievement.id);
                this.showMessage(`获得成就：${achievement.name} - ${achievement.description}`);
            }
        });
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new GeometryKingdom();
}); 