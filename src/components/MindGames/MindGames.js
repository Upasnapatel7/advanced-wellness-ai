import React, { useState, useEffect, useCallback } from 'react';
import './MindGames.css';

const MindGames = () => {
    const [currentGame, setCurrentGame] = useState(null);
    const [scores, setScores] = useState({
        memoryMatrix: 0,
        quickMath: 0,
        patternMaster: 0,
        focusFlow: 0
    });

    const updateScore = useCallback((gameName, score) => {
        setScores(prev => ({
            ...prev,
            [gameName]: Math.max(prev[gameName], score)
        }));
    }, []);

    const games = {
        memoryMatrix: {
            title: 'Memory Matrix',
            description: 'Remember the pattern and test your visual memory',
            icon: '🎯',
            component: (props) => <MemoryMatrix {...props} />
        },
        quickMath: {
            title: 'Quick Math',
            description: 'Solve math problems against the clock',
            icon: '⚡',
            component: (props) => <QuickMath {...props} />
        },
        patternMaster: {
            title: 'Pattern Master',
            description: 'Identify the missing piece in sequences',
            icon: '🔍',
            component: (props) => <PatternMaster {...props} />
        },
        focusFlow: {
            title: 'Focus Flow',
            description: 'Track the moving target with precision',
            icon: '🎯',
            component: (props) => <FocusFlow {...props} />
        }
    };

    const startGame = (gameName) => {
        setCurrentGame(gameName);
    };

    const returnToMenu = () => {
        setCurrentGame(null);
    };

    if (currentGame) {
        const GameComponent = games[currentGame].component;
        return (
            <GameComponent 
                onReturn={returnToMenu}
                onUpdateScore={updateScore}
            />
        );
    }

    return (
        <div className="mind-games-container">
            <header className="mind-games-header">
                <h1>🧠 Mind Gym</h1>
                <p>Boost Your Brain Power with Fun Exercises!</p>
            </header>
            
            <div className="score-board">
                <h3>Your Scores</h3>
                <div className="scores-container">
                    {Object.entries(scores).map(([game, score]) => (
                        <div key={game} className="score-item">
                            <span>{games[game].title}:</span>
                            <span>{score}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="games-grid">
                {Object.entries(games).map(([gameKey, game]) => (
                    <div key={gameKey} className="game-card">
                        <div className="game-icon">{game.icon}</div>
                        <h3>{game.title}</h3>
                        <p>{game.description}</p>
                        <button 
                            className="play-btn"
                            onClick={() => startGame(gameKey)}
                        >
                            Play Now
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Memory Matrix Game Component
const MemoryMatrix = ({ onReturn, onUpdateScore }) => {
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [sequence, setSequence] = useState([]);
    const [userSequence, setUserSequence] = useState([]);
    const [isShowing, setIsShowing] = useState(false);

    const generateSequence = useCallback(() => {
        const sequenceLength = 2 + level;
        const totalCells = 16;
        const newSequence = [];
        
        for (let i = 0; i < sequenceLength; i++) {
            let cell;
            do {
                cell = Math.floor(Math.random() * totalCells);
            } while (newSequence.includes(cell));
            newSequence.push(cell);
        }
        setSequence(newSequence);
    }, [level]);

    const showSequence = () => {
        if (isShowing) return;
        
        setIsShowing(true);
        setUserSequence([]);
        
        let delay = 0;
        sequence.forEach((cellIndex, index) => {
            setTimeout(() => {
                const cell = document.querySelector(`[data-index="${cellIndex}"]`);
                cell?.classList.add('active');
                setTimeout(() => {
                    cell?.classList.remove('active');
                    if (index === sequence.length - 1) {
                        setTimeout(() => setIsShowing(false), 500);
                    }
                }, 800);
            }, delay);
            delay += 1000;
        });
    };

    const cellClick = (index) => {
        if (isShowing) return;

        const newUserSequence = [...userSequence, index];
        setUserSequence(newUserSequence);

        const cell = document.querySelector(`[data-index="${index}"]`);
        cell?.classList.add('selected');

        if (newUserSequence.length === sequence.length) {
            checkSequence(newUserSequence);
        }
    };

    const checkSequence = (userSeq) => {
        const isCorrect = sequence.every((cell, index) => cell === userSeq[index]);

        if (isCorrect) {
            const newScore = score + level * 10;
            setScore(newScore);
            setLevel(level + 1);
            setTimeout(() => {
                generateSequence();
                showSequence();
            }, 1000);
        } else {
            alert(`Game Over! Your score: ${score}`);
            onUpdateScore('memoryMatrix', score);
            onReturn();
        }
    };

    useEffect(() => {
        generateSequence();
    }, [generateSequence]);

    return (
        <div className="game-container">
            <div className="game-header">
                <button className="back-btn" onClick={onReturn}>← Back to Menu</button>
                <h2>Memory Matrix</h2>
                <div className="game-stats">
                    <span>Score: {score}</span>
                    <span>Level: {level}</span>
                </div>
            </div>
            
            <div className="memory-game">
                <div className="memory-grid">
                    {Array.from({ length: 16 }, (_, i) => (
                        <div
                            key={i}
                            className="memory-cell"
                            data-index={i}
                            onClick={() => cellClick(i)}
                        />
                    ))}
                </div>
                <div className="game-info">
                    <p>Remember the highlighted cells!</p>
                    <button 
                        className="action-btn" 
                        onClick={showSequence}
                        disabled={isShowing}
                    >
                        Show Sequence
                    </button>
                </div>
            </div>
        </div>
    );
};

// Quick Math Game Component
const QuickMath = ({ onReturn, onUpdateScore }) => {
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentProblem, setCurrentProblem] = useState(null);

    const generateProblem = useCallback(() => {
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let num1, num2, answer;

        switch(operation) {
            case '+':
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * 50) + 25;
                num2 = Math.floor(Math.random() * 50) + 1;
                answer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * 12) + 1;
                num2 = Math.floor(Math.random() * 12) + 1;
                answer = num1 * num2;
                break;
            default:
                num1 = 1;
                num2 = 1;
                answer = 2;
        }

        const options = [answer];
        while (options.length < 4) {
            const wrongAnswer = answer + Math.floor(Math.random() * 20) - 10;
            if (wrongAnswer !== answer && !options.includes(wrongAnswer) && wrongAnswer > 0) {
                options.push(wrongAnswer);
            }
        }

        setCurrentProblem({
            num1, num2, operation, answer,
            options: options.sort(() => Math.random() - 0.5)
        });
    }, []);

    const checkAnswer = (selectedAnswer) => {
        if (selectedAnswer === currentProblem.answer) {
            const newScore = score + 10 * level;
            setScore(newScore);
            setLevel(level + 1);
            generateProblem();
        } else {
            endGame();
        }
    };

    const endGame = useCallback(() => {
        alert(`Time's up! Your score: ${score}`);
        onUpdateScore('quickMath', score);
        onReturn();
    }, [score, onUpdateScore, onReturn]);

    useEffect(() => {
        generateProblem();
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [generateProblem, endGame]);

    if (!currentProblem) return null;

    return (
        <div className="game-container">
            <div className="game-header">
                <button className="back-btn" onClick={onReturn}>← Back to Menu</button>
                <h2>Quick Math</h2>
                <div className="game-stats">
                    <span>Score: {score}</span>
                    <span>Level: {level}</span>
                </div>
            </div>

            <div className="math-game">
                <div className="time-bar">
                    <div 
                        className="time-fill" 
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                </div>
                
                <div className="math-problem">
                    <h2>{currentProblem.num1} {currentProblem.operation} {currentProblem.num2} = ?</h2>
                </div>
                
                <div className="math-options">
                    {currentProblem.options.map((option, index) => (
                        <button
                            key={index}
                            className="math-option"
                            onClick={() => checkAnswer(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                
                <div className="game-info">
                    <p>Time Left: {timeLeft}s | Solve as many problems as you can!</p>
                </div>
            </div>
        </div>
    );
};

// Pattern Master Game Component
const PatternMaster = ({ onReturn, onUpdateScore }) => {
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [currentPattern, setCurrentPattern] = useState(null);

    const generateOptions = useCallback((correctAnswer, isString = false) => {
        const options = [correctAnswer];
        while (options.length < 4) {
            let option;
            if (isString) {
                const shapes = ['▲', '●', '■', '★', '◆'];
                const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
                const allOptions = [...shapes, ...colors];
                option = allOptions[Math.floor(Math.random() * allOptions.length)];
            } else {
                option = correctAnswer + Math.floor(Math.random() * 20) - 10;
            }
            if (!options.includes(option) && option !== correctAnswer) {
                options.push(option);
            }
        }
        return options.sort(() => Math.random() - 0.5);
    }, []);

    // Move these functions inside the component to avoid dependency issues
    const generateNumericPattern = useCallback(() => {
        const sequence = [];
        const start = Math.floor(Math.random() * 10) + 1;
        const operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        const step = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < 4; i++) {
            let value;
            switch(operation) {
                case '+': value = start + (i * step); break;
                case '-': value = start - (i * step); break;
                case '*': value = start * Math.pow(step, i); break;
                default: value = start + i;
            }
            sequence.push(value);
        }
        
        const missingIndex = Math.floor(Math.random() * 4);
        const answer = sequence[missingIndex];
        sequence[missingIndex] = '?';
        
        return { type: 'numeric', sequence, answer, options: generateOptions(answer, false) };
    }, [generateOptions]);

    const generateShapePattern = useCallback(() => {
        const shapes = ['▲', '●', '■', '★', '◆'];
        const sequence = [];
        let currentShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        for (let i = 0; i < 4; i++) {
            sequence.push(currentShape);
            const currentIndex = shapes.indexOf(currentShape);
            currentShape = shapes[(currentIndex + 1) % shapes.length];
        }
        
        const missingIndex = Math.floor(Math.random() * 4);
        const answer = sequence[missingIndex];
        sequence[missingIndex] = '?';
        
        return { type: 'shape', sequence, answer, options: generateOptions(answer, true) };
    }, [generateOptions]);

    const generateColorPattern = useCallback(() => {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
        const sequence = [];
        let currentColor = colors[Math.floor(Math.random() * colors.length)];
        
        for (let i = 0; i < 4; i++) {
            sequence.push(currentColor);
            const currentIndex = colors.indexOf(currentColor);
            currentColor = colors[(currentIndex + 1) % colors.length];
        }
        
        const missingIndex = Math.floor(Math.random() * 4);
        const answer = sequence[missingIndex];
        sequence[missingIndex] = '?';
        
        return { type: 'color', sequence, answer, options: generateOptions(answer, true) };
    }, [generateOptions]);

    const generatePattern = useCallback(() => {
        const patternTypes = ['numeric', 'shape', 'color'];
        const type = patternTypes[Math.floor(Math.random() * patternTypes.length)];
        
        let pattern;
        switch(type) {
            case 'numeric':
                pattern = generateNumericPattern();
                break;
            case 'shape':
                pattern = generateShapePattern();
                break;
            case 'color':
                pattern = generateColorPattern();
                break;
            default:
                pattern = generateNumericPattern();
        }
        
        setCurrentPattern(pattern);
    }, [generateColorPattern, generateNumericPattern, generateShapePattern]);

    const checkAnswer = (selectedAnswer) => {
        // eslint-disable-next-line eqeqeq
        if (selectedAnswer == currentPattern.answer) {
            const newScore = score + 15;
            setScore(newScore);
            setLevel(level + 1);
            generatePattern();
        } else {
            alert(`Game Over! Your score: ${score}`);
            onUpdateScore('patternMaster', score);
            onReturn();
        }
    };

    useEffect(() => {
        generatePattern();
    }, [generatePattern]);

    if (!currentPattern) return null;

    return (
        <div className="game-container">
            <div className="game-header">
                <button className="back-btn" onClick={onReturn}>← Back to Menu</button>
                <h2>Pattern Master</h2>
                <div className="game-stats">
                    <span>Score: {score}</span>
                    <span>Level: {level}</span>
                </div>
            </div>

            <div className="pattern-game">
                <div className="pattern-display">
                    <div className="pattern-sequence">
                        {currentPattern.sequence.map((item, index) => (
                            <span key={index} className={`pattern-item ${currentPattern.type}`}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="pattern-options">
                    {currentPattern.options.map((option, index) => (
                        <button
                            key={index}
                            className="pattern-option"
                            onClick={() => checkAnswer(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <div className="game-info">
                    <p>Identify the missing element in the pattern!</p>
                </div>
            </div>
        </div>
    );
};

// Focus Flow Game Component
const FocusFlow = ({ onReturn, onUpdateScore }) => {
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [clickCount, setClickCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);

    const handleTargetClick = () => {
        setClickCount(prev => prev + 1);
        setSuccessCount(prev => prev + 1);
        const newScore = score + 10 * level;
        setScore(newScore);
        
        if (successCount + 1 >= 5) {
            setLevel(prev => prev + 1);
            setSuccessCount(0);
        }
    };

    const handleMissClick = () => {
        setClickCount(prev => prev + 1);
        
        if (clickCount + 1 - successCount >= 3) {
            alert(`Game Over! Your score: ${score}`);
            onUpdateScore('focusFlow', score);
            onReturn();
        }
    };

    const accuracy = clickCount > 0 ? Math.round((successCount / clickCount) * 100) : 100;

    return (
        <div className="game-container">
            <div className="game-header">
                <button className="back-btn" onClick={onReturn}>← Back to Menu</button>
                <h2>Focus Flow</h2>
                <div className="game-stats">
                    <span>Score: {score}</span>
                    <span>Level: {level}</span>
                </div>
            </div>

            <div className="focus-game">
                <div className="focus-area" onClick={handleMissClick}>
                    <div 
                        className="target" 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTargetClick();
                        }}
                        style={{
                            width: `${Math.max(50 - (level * 2), 20)}px`,
                            height: `${Math.max(50 - (level * 2), 20)}px`
                        }}
                    />
                </div>
                <div className="game-info">
                    <p>Click the target as many times as you can!</p>
                    <p>Accuracy: {accuracy}% | Level: {level}</p>
                    <p>Target size decreases as level increases!</p>
                </div>
            </div>
        </div>
    );
};

export default MindGames;