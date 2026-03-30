import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Trophy, RefreshCw } from 'lucide-react';

// --- Types & Constants ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 120;

const TRACKS = [
  { id: 1, title: 'Neon Pulse (AI Gen)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Cybernetic Drift (AI Gen)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Synthwave Echoes (AI Gen)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => nextTrack();

  // --- Snake Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    let isOccupied = true;
    while (isOccupied) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood!;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameStarted || gameOver) {
        if (e.key === 'Enter' || e.key === ' ') {
          resetGame();
        }
        return;
      }

      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setDirection(prev => prev !== 'DOWN' ? 'UP' : prev);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setDirection(prev => prev !== 'UP' ? 'DOWN' : prev);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, gameOver]);

  useEffect(() => {
    if (!isGameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (direction) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Check wall collision
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, isGameStarted, generateFood, highScore]);


  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 font-sans flex flex-col items-center justify-center p-4 selection:bg-fuchsia-500/30">
      
      {/* CRT Effects */}
      <div className="static-noise"></div>
      <div className="scanlines"></div>

      {/* Background Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ffff]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff00ff]/10 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        
        {/* Left Column: Title & Score */}
        <div className="flex flex-col items-center lg:items-start space-y-8 order-2 lg:order-1">
          <div className="text-center lg:text-left">
            <h1 
              data-text="NEON SNAKE"
              className="text-6xl md:text-8xl font-glitch tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-[#00ffff] to-[#ff00ff] drop-shadow-[0_0_25px_rgba(0,255,255,0.8)] animate-glitch leading-tight uppercase relative"
            >
              NEON<br/>SNAKE
            </h1>
            <p className="text-[#00ffff] mt-4 text-2xl uppercase tracking-[0.4em] font-digital drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
              Cybernetic Beats
            </p>
          </div>

          <div className="flex gap-6">
            <div className="bg-gray-950 border-2 border-[#00ffff] p-4 rounded-none shadow-[4px_4px_0px_#ff00ff]">
              <p className="text-xs text-[#00ffff] uppercase tracking-wider mb-1 font-digital text-xl">Score</p>
              <p className="text-5xl font-digital text-[#00ffff] drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">{score.toString().padStart(4, '0')}</p>
            </div>
            <div className="bg-gray-950 border-2 border-[#ff00ff] p-4 rounded-none shadow-[4px_4px_0px_#00ffff]">
              <p className="text-xs text-[#ff00ff] uppercase tracking-wider mb-1 flex items-center gap-1 font-digital text-xl">
                <Trophy className="w-4 h-4" /> Best
              </p>
              <p className="text-5xl font-digital text-[#ff00ff] drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]">{highScore.toString().padStart(4, '0')}</p>
            </div>
          </div>
        </div>

        {/* Center Column: Game Board */}
        <div className="flex justify-center order-1 lg:order-2">
          <div className="relative p-1 bg-[#00ffff] shadow-[0_0_30px_rgba(0,255,255,0.4)]">
            <div 
              className="bg-gray-950 overflow-hidden relative"
              style={{ 
                width: `${GRID_SIZE * 20}px`, 
                height: `${GRID_SIZE * 20}px`,
                backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {!isGameStarted && !gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 z-20">
                  <button 
                    onClick={resetGame}
                    className="px-8 py-3 bg-[#ff00ff] text-white font-digital text-3xl tracking-widest uppercase transition-all shadow-[4px_4px_0px_#00ffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#00ffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  >
                    INITIALIZE
                  </button>
                  <p className="mt-6 text-[#00ffff] text-xl font-digital animate-pulse">AWAITING INPUT...</p>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 z-20">
                  <h2 className="text-5xl font-glitch text-[#ff00ff] mb-2 drop-shadow-[0_0_15px_rgba(255,0,255,0.8)]" data-text="FATAL ERROR">FATAL ERROR</h2>
                  <p className="text-[#00ffff] mb-8 font-digital text-2xl">SYS.SCORE: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-[#00ffff] text-[#00ffff] font-digital text-2xl tracking-widest uppercase transition-all shadow-[4px_4px_0px_#ff00ff] hover:bg-[#00ffff]/20 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#ff00ff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  >
                    <RefreshCw className="w-5 h-5" /> REBOOT
                  </button>
                </div>
              )}

              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <div
                    key={`${segment.x}-${segment.y}-${index}`}
                    className="absolute rounded-none"
                    style={{
                      left: `${segment.x * 20}px`,
                      top: `${segment.y * 20}px`,
                      width: '20px',
                      height: '20px',
                      backgroundColor: isHead ? '#00ffff' : '#008888',
                      boxShadow: isHead ? '0 0 15px #00ffff' : 'none',
                      zIndex: isHead ? 10 : 1,
                      border: '1px solid #030712'
                    }}
                  />
                );
              })}

              {/* Food */}
              <div
                className="absolute rounded-none animate-pulse"
                style={{
                  left: `${food.x * 20}px`,
                  top: `${food.y * 20}px`,
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#ff00ff',
                  boxShadow: '0 0 20px #ff00ff',
                  border: '1px solid #030712'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Music Player */}
        <div className="flex flex-col items-center lg:items-end order-3 w-full max-w-sm mx-auto lg:mx-0">
          <div className="w-full bg-gray-950 border-2 border-[#ff00ff] p-6 rounded-none shadow-[6px_6px_0px_#00ffff] relative overflow-hidden group">
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-none ${isPlaying ? 'bg-[#00ffff] shadow-[0_0_10px_#00ffff] animate-pulse' : 'bg-gray-800'}`} />
                  <span className="text-lg font-digital text-[#00ffff] uppercase tracking-widest">AUDIO.SYS</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 bg-[#ff00ff] rounded-none transition-all duration-75 ${isPlaying ? 'animate-[bounce_0.5s_infinite]' : 'h-1'}`}
                      style={{ 
                        height: isPlaying ? `${Math.random() * 20 + 4}px` : '4px',
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-8 text-center lg:text-left border-l-4 border-[#00ffff] pl-4">
                <h3 className="text-2xl font-digital text-white truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" title={TRACKS[currentTrackIndex].title}>
                  {TRACKS[currentTrackIndex].title}
                </h3>
                <p className="text-lg text-[#ff00ff] font-digital mt-1">SEQ {currentTrackIndex + 1}/{TRACKS.length}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <button 
                  onClick={prevTrack}
                  className="text-[#00ffff] hover:text-[#ff00ff] transition-colors hover:scale-110"
                >
                  <SkipBack className="w-8 h-8 fill-current drop-shadow-[0_0_8px_currentColor]" />
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 flex items-center justify-center bg-gray-950 border-2 border-[#00ffff] text-[#00ffff] shadow-[4px_4px_0px_#ff00ff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#ff00ff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current drop-shadow-[0_0_8px_currentColor]" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1 drop-shadow-[0_0_8px_currentColor]" />
                  )}
                </button>

                <button 
                  onClick={nextTrack}
                  className="text-[#00ffff] hover:text-[#ff00ff] transition-colors hover:scale-110"
                >
                  <SkipForward className="w-8 h-8 fill-current drop-shadow-[0_0_8px_currentColor]" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-[#ff00ff] hover:text-[#00ffff] transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-6 h-6 drop-shadow-[0_0_8px_currentColor]" />
                  ) : (
                    <Volume2 className="w-6 h-6 drop-shadow-[0_0_8px_currentColor]" />
                  )}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-full h-2 bg-gray-900 border border-[#00ffff] rounded-none appearance-none cursor-pointer accent-[#ff00ff]"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        onEnded={handleTrackEnd}
        crossOrigin="anonymous"
      />
    </div>
  );
}
