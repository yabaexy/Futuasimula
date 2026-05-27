import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowUpDown, Disc, Coins, HelpCircle, Trophy, ShieldAlert, Cpu, Heart, ChevronRight, Zap, RefreshCw, ShieldCheck } from 'lucide-react';
import { WalletState, SubscriptionDuration } from '../types';

interface MiniGameZoneProps {
  wallet: WalletState;
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'NONE';
  onAddTransaction: (hash: string, action: string, amount: number, status: 'SUCCESS' | 'FAILED') => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

type GameType = 'TETRIS' | 'PONG' | 'SLOTS' | 'BLACKJACK' | 'ROULETTE';

export const MiniGameZone: React.FC<MiniGameZoneProps> = ({
  wallet,
  setWallet,
  subscriptionStatus,
  onAddTransaction,
  triggerToast,
}) => {
  const [activeGame, setActiveGame] = useState<GameType>('TETRIS');

  // Unified credits/USDT handler
  const isVip = subscriptionStatus === 'ACTIVE';
  const [demoCredits, setDemoCredits] = useState(1000);

  const getAvailableBalance = () => {
    return isVip && wallet.isConnected ? wallet.usdtBalance : demoCredits;
  };

  const deductFunds = (amount: number): boolean => {
    const bal = getAvailableBalance();
    if (bal < amount) {
      triggerToast('error', isVip ? '지갑의 모의 USDT 잔액이 부족합니다. 상단에서 Faucet 충전을 수행해 주세요!' : '데모 크레딧이 부족합니다. 하단에서 크레딧 충전을 눌러주세요.');
      return false;
    }

    if (isVip && wallet.isConnected) {
      setWallet(prev => ({
        ...prev,
        usdtBalance: parseFloat(Math.max(0, prev.usdtBalance - amount).toFixed(2))
      }));
    } else {
      setDemoCredits(prev => Math.max(0, prev - amount));
    }
    return true;
  };

  const addFunds = (amount: number, gameName: string) => {
    if (amount <= 0) return;
    
    if (isVip && wallet.isConnected) {
      setWallet(prev => ({
        ...prev,
        usdtBalance: parseFloat((prev.usdtBalance + amount).toFixed(2))
      }));
      // Record to transaction history
      const txChars = 'abcdef0123456789';
      let gameHash = '0xgame';
      for (let i = 0; i < 58; i++) {
        gameHash += txChars.charAt(Math.floor(Math.random() * txChars.length));
      }
      onAddTransaction(gameHash, `${gameName} 게임 당첨 정산 완료`, amount, 'SUCCESS');
    } else {
      setDemoCredits(prev => prev + amount);
    }
  };


  // ==========================================
  // GAME 1: TETRIS (테트리스)
  // ==========================================
  const COLS = 10;
  const ROWS = 20;
  const SHAPES = {
    I: [[1, 1, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    T: [[0, 1, 0], [1, 1, 1]],
    Z: [[1, 1, 0], [0, 1, 1]],
  };
  const COLORS = {
    I: 'bg-cyan-500 border-cyan-400',
    J: 'bg-blue-500 border-blue-400',
    L: 'bg-orange-500 border-orange-400',
    O: 'bg-yellow-500 border-yellow-400',
    S: 'bg-green-500 border-green-400',
    T: 'bg-purple-500 border-purple-400',
    Z: 'bg-red-500 border-red-400',
  };

  const [grid, setGrid] = useState<string[][]>(() => Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    type: keyof typeof SHAPES;
    x: number;
    y: number;
  } | null>(null);
  const [tetrisScore, setTetrisScore] = useState(0);
  const [tetrisGameOver, setTetrisGameOver] = useState(false);
  const [tetrisPlaying, setTetrisPlaying] = useState(false);
  const [tetrisLevel, setTetrisLevel] = useState(1);
  const [tetrisRewardMsg, setTetrisRewardMsg] = useState('');

  // Spawn random piece
  const spawnPiece = () => {
    const keys = Object.keys(SHAPES) as (keyof typeof SHAPES)[];
    const randType = keys[Math.floor(Math.random() * keys.length)];
    const shape = SHAPES[randType];
    const width = shape[0].length;
    const x = Math.floor((COLS - width) / 2);
    const y = 0;

    // Check game over
    if (checkCollision(shape, x, y, grid)) {
      setTetrisGameOver(true);
      setTetrisPlaying(false);
      
      // Calculate reward (Tetris line clear gains USDT/demo chips!)
      if (tetrisScore > 0) {
        const reward = Math.floor(tetrisScore / 10);
        if (reward > 0) {
          addFunds(reward, 'Futua Tetris');
          setTetrisRewardMsg(`🎉 게임종료! 점수 정산 완료: +${reward} ${isVip ? 'USDT' : '데모 크레딧'}`);
          triggerToast('success', `테트리스 정산 완료! ${reward} 획득`);
        }
      }
      return;
    }

    setCurrentPiece({ shape, type: randType, x, y });
  };

  const checkCollision = (shape: number[][], ax: number, ay: number, currentGrid: string[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const nextX = ax + c;
          const nextY = ay + r;
          
          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) return true;
          if (nextY >= 0 && currentGrid[nextY][nextX] !== '') return true;
        }
      }
    }
    return false;
  };

  const rotatePiece = () => {
    if (!currentPiece || !tetrisPlaying) return;
    const shape = currentPiece.shape;
    const n = shape.length;
    const m = shape[0].length;
    const rotated = Array(m).fill(null).map(() => Array(n).fill(0));
    
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        rotated[c][n - 1 - r] = shape[r][c];
      }
    }

    if (!checkCollision(rotated, currentPiece.x, currentPiece.y, grid)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  };

  const moveLeft = () => {
    if (!currentPiece || !tetrisPlaying) return;
    if (!checkCollision(currentPiece.shape, currentPiece.x - 1, currentPiece.y, grid)) {
      setCurrentPiece({ ...currentPiece, x: currentPiece.x - 1 });
    }
  };

  const moveRight = () => {
    if (!currentPiece || !tetrisPlaying) return;
    if (!checkCollision(currentPiece.shape, currentPiece.x + 1, currentPiece.y, grid)) {
      setCurrentPiece({ ...currentPiece, x: currentPiece.x + 1 });
    }
  };

  const moveDown = () => {
    if (!currentPiece || !tetrisPlaying) return;
    if (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1, grid)) {
      setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 });
    } else {
      // Freeze piece
      freezePiece();
    }
  };

  const dropHard = () => {
    if (!currentPiece || !tetrisPlaying) return;
    let tempY = currentPiece.y;
    while (!checkCollision(currentPiece.shape, currentPiece.x, tempY + 1, grid)) {
      tempY++;
    }
    currentPiece.y = tempY;
    freezePiece();
  };

  const freezePiece = () => {
    if (!currentPiece) return;
    const { shape, type, x, y } = currentPiece;
    const nextGrid = grid.map(row => [...row]);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const gridY = y + r;
          const gridX = x + c;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            nextGrid[gridY][gridX] = type;
          }
        }
      }
    }

    // Checking full rows to clear
    let linesCleared = 0;
    const filteredGrid = nextGrid.filter(row => row.some(cell => cell === ''));
    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
      linesCleared++;
    }

    if (linesCleared > 0) {
      const addedScore = linesCleared === 4 ? 400 : linesCleared === 3 ? 180 : linesCleared === 2 ? 80 : 30;
      setTetrisScore(prev => {
        const next = prev + addedScore;
        setTetrisLevel(Math.floor(next / 500) + 1);
        return next;
      });
      triggerToast('info', `🔥 Line Clear! +${addedScore} PTS`);
    }

    setGrid(filteredGrid);
    spawnPiece();
  };

  const startTetris = () => {
    // Initial deduction for VIP subscription matching simulation
    const gameFee = isVip ? 1 : 0; // VIP limits free-bets or fees, standard slot wagers
    if (gameFee > 0 && !wallet.isConnected) {
      triggerToast('error', '상단에서 지갑 연결을 먼저 완료해 주세요!');
      return;
    }

    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    setTetrisScore(0);
    setTetrisLevel(1);
    setTetrisGameOver(false);
    setTetrisRewardMsg('');
    setTetrisPlaying(true);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeGame !== 'TETRIS' || !tetrisPlaying) return;
      if (e.key === 'ArrowLeft') { moveLeft(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { moveRight(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { rotatePiece(); e.preventDefault(); }
      if (e.key === 'ArrowDown') { moveDown(); e.preventDefault(); }
      if (e.key === ' ') { dropHard(); e.preventDefault(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame, tetrisPlaying, currentPiece, grid]);

  // Game loop interval
  useEffect(() => {
    if (!tetrisPlaying) return;
    const intervalTime = Math.max(100, 800 - (tetrisLevel - 1) * 80);
    const id = setInterval(() => {
      moveDown();
    }, intervalTime);
    return () => clearInterval(id);
  }, [tetrisPlaying, currentPiece, grid, tetrisLevel]);

  // Auto spawn first piece
  useEffect(() => {
    if (tetrisPlaying && !currentPiece) {
      spawnPiece();
    }
  }, [tetrisPlaying, currentPiece]);


  // ==========================================
  // GAME 2: PONG (퐁)
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pongPlaying, setPongPlaying] = useState(false);
  const [pongScore, setPongScore] = useState({ player: 0, cpu: 0 });
  const [pongWinner, setPongWinner] = useState<string | null>(null);
  const [playerPaddleY, setPlayerPaddleY] = useState(150); // range 0 to 300

  // Pong Loop using animation frame
  useEffect(() => {
    if (!pongPlaying || activeGame !== 'PONG') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let ballX = 300;
    let ballY = 200;
    let ballVX = Math.random() > 0.5 ? 4 : -4;
    let ballVY = (Math.random() * 2 - 1) * 3;
    const ballRadius = 8;

    const paddleWidth = 10;
    const paddleHeight = 80;
    let cpuY = 150;

    let localPlayerY = playerPaddleY;

    let animationFrameId: number;

    const gameLoop = () => {
      // 1. Move Ball
      ballX += ballVX;
      ballY += ballVY;

      // 2. Wall Collisions (Top/Bottom)
      if (ballY - ballRadius <= 0) {
        ballY = ballRadius;
        ballVY = -ballVY;
      } else if (ballY + ballRadius >= 400) {
        ballY = 400 - ballRadius;
        ballVY = -ballVY;
      }

      // 3. Left/Right Paddle collision calculations
      // Left Paddle (Player)
      if (ballVX < 0 && ballX - ballRadius <= 30 && ballX - ballRadius >= 15) {
        if (ballY >= localPlayerY && ballY <= localPlayerY + paddleHeight) {
          ballVX = -ballVX * 1.1; // speed acceleration
          // spin depending on paddle hitting spot
          const hitSpot = (ballY - (localPlayerY + paddleHeight / 2)) / (paddleHeight / 2);
          ballVY = hitSpot * 5;
        }
      }

      // Right Paddle (CPU)
      if (ballVX > 0 && ballX + ballRadius >= 570 && ballX + ballRadius <= 585) {
        if (ballY >= cpuY && ballY <= cpuY + paddleHeight) {
          ballVX = -ballVX * 1.1;
          const hitSpot = (ballY - (cpuY + paddleHeight / 2)) / (paddleHeight / 2);
          ballVY = hitSpot * 5;
        }
      }

      // 4. CPU AI logic (moves towards ball with delay/easing)
      const cpuSpeed = 3.6 + (isVip ? 1.0 : 0); // Active VIP gets enhanced AI difficulty
      const targetY = ballY - paddleHeight / 2;
      cpuY += (targetY - cpuY) * 0.12;
      cpuY = Math.max(0, Math.min(320, cpuY));

      // 5. Misses and Scoring
      if (ballX < 0) {
        // CPU Scores
        setPongScore(prev => {
          const next = { ...prev, cpu: prev.cpu + 1 };
          if (next.cpu >= 5) {
            setPongWinner('CPU');
            setPongPlaying(false);
            triggerToast('error', '퐁 게임에서 CPU에게 패배하였습니다!');
          } else {
            // Reset ball
            ballX = 300;
            ballY = 200;
            ballVX = 4;
            ballVY = (Math.random() * 2 - 1) * 3;
          }
          return next;
        });
      } else if (ballX > 600) {
        // Player Scores
        setPongScore(prev => {
          const next = { ...prev, player: prev.player + 1 };
          if (next.player >= 5) {
            setPongWinner('PLAYER');
            setPongPlaying(false);
            const prize = isVip ? 20 : 100; // USDT or credits
            addFunds(prize, 'Cyber Pong');
            triggerToast('success', `🎉 승리! 퐁 게임에서 승리하여 +${prize} ${isVip ? 'USDT' : '데모 크레딧'}을 정산받았습니다!`);
          } else {
            ballX = 300;
            ballY = 200;
            ballVX = -4;
            ballVY = (Math.random() * 2 - 1) * 3;
          }
          return next;
        });
      }

      // Limit max speeds
      ballVX = Math.max(-12, Math.min(12, ballVX));

      // 6. Draw Scene
      ctx.fillStyle = '#070b13';
      ctx.fillRect(0, 0, 600, 400);

      // Dash Line Center
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(300, 0);
      ctx.lineTo(300, 400);
      ctx.stroke();

      // Left Paddle (Neon Emerald)
      ctx.fillStyle = '#10b981';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';
      ctx.fillRect(20, localPlayerY, paddleWidth, paddleHeight);

      // Right Paddle (Neon Blue/Cyber Punk)
      ctx.fillStyle = '#3b82f6';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#3b82f6';
      ctx.fillRect(570, cpuY, paddleWidth, paddleHeight);

      // Ball (Glow Amber)
      ctx.fillStyle = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0; // Reset shadow

      // Pull fresh state value of slider
      ctx.canvas.addEventListener('mousemove', (e) => {
        const bounds = canvas.getBoundingClientRect();
        const mouseY = e.clientY - bounds.top;
        localPlayerY = Math.max(0, Math.min(320, mouseY - paddleHeight / 2));
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [pongPlaying, activeGame, playerPaddleY]);

  const startPong = () => {
    setPongScore({ player: 0, cpu: 0 });
    setPongWinner(null);
    setPongPlaying(true);
  };


  // ==========================================
  // GAME 3: SLOT MACHINE (슬롯머신)
  // ==========================================
  const SLOT_EMOJIS = ['🟢', '🪙', '💠', '⭐', '🟣', '💎'];
  const SLOT_NAMES = ['USDT', 'BNB', 'ETH', 'STARS', 'SOL', 'BTC'];
  
  const [slotReels, setSlotReels] = useState(['🟢', '🪙', '💠']);
  const [slotBet, setSlotBet] = useState(10);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [slotPayoutMsg, setSlotPayoutMsg] = useState('');

  const spinSlots = () => {
    if (slotSpinning) return;
    if (!deductFunds(slotBet)) return;

    setSlotSpinning(true);
    setSlotPayoutMsg('');

    // Simulated reel flashing animation sequence
    let flashCount = 0;
    const interval = setInterval(() => {
      setSlotReels([
        SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
        SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
        SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)]
      ]);
      flashCount++;

      if (flashCount >= 18) {
        clearInterval(interval);
        
        // Final roll values
        const finalReels = [
          SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
          SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
          SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)]
        ];
        
        setSlotReels(finalReels);
        calculateSlotResult(finalReels);
        setSlotSpinning(false);
      }
    }, 80);
  };

  const calculateSlotResult = (reels: string[]) => {
    const [r1, r2, r3] = reels;
    
    // Triple elements matches
    if (r1 === r2 && r2 === r3) {
      let multiplier = 5;
      let name = '일반 매칭';

      if (r1 === '⭐') { multiplier = 50; name = 'VIP SUPER STARS'; }
      else if (r1 === '💎') { multiplier = 25; name = 'GRAND GIGA CHAD BTC'; }
      else if (r1 === '🪙') { multiplier = 15; name = 'GOLDEN BNB SMART MATCH'; }
      else if (r1 === '🟢') { multiplier = 10; name = 'USDT STEADY REVENUE'; }
      
      const prize = slotBet * multiplier;
      addFunds(prize, 'Neon Slots');
      setSlotPayoutMsg(`🔥 TRIPLE JACKPOT! [${name}] - ${multiplier}배 획득! +${prize} ${isVip ? 'USDT' : 'CR'}`);
      triggerToast('success', `슬롯머신 트리플 잭팟! +${prize}`);
    } 
    // Double matches
    else if (r1 === r2 || r2 === r3 || r1 === r3) {
      const prize = slotBet * 2;
      addFunds(prize, 'Neon Slots');
      setSlotPayoutMsg(`⭐ DOUBLE MATCH! 더블 상금 2배 달성: +${prize} ${isVip ? 'USDT' : 'CR'}`);
    } else {
      setSlotPayoutMsg('😢 아쉽게도 꽝입니다. 다시 한 번 행운을 시험해 보세요.');
    }
  };


  // ==========================================
  // GAME 4: BLACKJACK (블랙잭)
  // ==========================================
  interface Card {
    suit: '♠' | '♥' | '♦' | '♣';
    value: string;
    num: number;
  }

  const [blackjackBet, setBlackjackBet] = useState(20);
  const [blackjackState, setBlackjackState] = useState<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'GAME_OVER'>('BETTING');
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [blackjackStatusMsg, setBlackjackStatusMsg] = useState('');

  const initDeck = () => {
    const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck: Card[] = [];

    for (const s of suits) {
      for (const v of values) {
        let n = parseInt(v);
        if (['J', 'Q', 'K'].includes(v)) n = 10;
        else if (v === 'A') n = 11;
        newDeck.push({ suit: s, value: v, num: n });
      }
    }

    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    return newDeck;
  };

  const calculateHandValue = (hand: Card[]) => {
    let value = hand.reduce((acc, card) => acc + card.num, 0);
    let aces = hand.filter(card => card.value === 'A').length;

    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  };

  const dealBlackjack = () => {
    if (blackjackState !== 'BETTING') return;
    if (!deductFunds(blackjackBet)) return;

    const gameDeck = initDeck();
    const p1 = gameDeck.pop()!;
    const d1 = gameDeck.pop()!;
    const p2 = gameDeck.pop()!;
    const d2 = gameDeck.pop()!;

    const initialPlayerHand = [p1, p2];
    const initialDealerHand = [d1, d2];

    setPlayerHand(initialPlayerHand);
    setDealerHand(initialDealerHand);
    setDeck(gameDeck);

    // Check Natural Blackjack
    const playerVal = calculateHandValue(initialPlayerHand);
    if (playerVal === 21) {
      // Blackjack!
      const winnings = Math.floor(blackjackBet * 2.5);
      addFunds(winnings, 'Web3 Blackjack');
      setBlackjackState('GAME_OVER');
      setBlackjackStatusMsg(`🎉 BLACKJACK! 네추럴 블랙잭 달성: +${winnings} ${isVip ? 'USDT' : 'CR'}`);
      triggerToast('success', '블랙잭 당첨!');
    } else {
      setBlackjackState('PLAYING');
      setBlackjackStatusMsg('Hit(추가 가동) 혹은 Stand(스톱)을 판단해 주십시오.');
    }
  };

  const hitBlackjack = () => {
    if (blackjackState !== 'PLAYING') return;
    const gameDeck = [...deck];
    const newCard = gameDeck.pop()!;
    const nextHand = [...playerHand, newCard];

    setPlayerHand(nextHand);
    setDeck(gameDeck);

    const val = calculateHandValue(nextHand);
    if (val > 21) {
      setBlackjackState('GAME_OVER');
      setBlackjackStatusMsg('💥 버스트(Bust)! 카드 합이 21을 초과하여 배팅 부결 손실이 발생했습니다.');
      triggerToast('error', '버스트! 패배');
    }
  };

  const standBlackjack = () => {
    if (blackjackState !== 'PLAYING') return;
    setBlackjackState('DEALER_TURN');
    
    // Simulate dealer playing (AI stands on 17)
    let currentDealerHand = [...dealerHand];
    const currentDeck = [...deck];

    const dealerActionLoop = () => {
      const dealerVal = calculateHandValue(currentDealerHand);
      if (dealerVal < 17 && currentDeck.length > 0) {
        currentDealerHand.push(currentDeck.pop()!);
        setDealerHand([...currentDealerHand]);
        setTimeout(dealerActionLoop, 600);
      } else {
        finalizeBlackjack(currentDealerHand);
      }
    };

    setTimeout(dealerActionLoop, 600);
  };

  const finalizeBlackjack = (finalDealerHand: Card[]) => {
    const playerVal = calculateHandValue(playerHand);
    const dealerVal = calculateHandValue(finalDealerHand);

    if (dealerVal > 21) {
      const winnings = blackjackBet * 2;
      addFunds(winnings, 'Web3 Blackjack');
      setBlackjackStatusMsg(`🎉 승리! 딜러 버스트: +${winnings} ${isVip ? 'USDT' : 'CR'}`);
      triggerToast('success', '딜러 버스트로 승리!');
    } else if (playerVal > dealerVal) {
      const winnings = blackjackBet * 2;
      addFunds(winnings, 'Web3 Blackjack');
      setBlackjackStatusMsg(`🎉 승리! 카드 총합 우세: +${winnings} ${isVip ? 'USDT' : 'CR'}`);
      triggerToast('success', '블랙잭 승리!');
    } else if (playerVal < dealerVal) {
      setBlackjackStatusMsg(`😢 패배! 딜러 카드 총합 더 높음 (${dealerVal} vs ${playerVal})`);
    } else {
      // Draw Push (refund)
      addFunds(blackjackBet, 'Web3 Blackjack');
      setBlackjackStatusMsg('🤝 무승부(Push). 배팅 에스크로 원금이 반환 처리되었습니다.');
    }

    setBlackjackState('GAME_OVER');
  };

  const resetBlackjack = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setBlackjackStatusMsg('');
    setBlackjackState('BETTING');
  };


  // ==========================================
  // GAME 5: BETTING ROULETTE (베팅 룰렛)
  // ==========================================
  const ROULETTE_NUMBERS = [
    { num: 0, color: 'green' },
    { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' }, { num: 4, color: 'black' },
    { num: 21, color: 'red' }, { num: 2, color: 'black' }, { num: 25, color: 'red' }, { num: 17, color: 'black' },
    { num: 34, color: 'red' }, { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
    { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' }, { num: 8, color: 'black' },
    { num: 23, color: 'red' }, { num: 10, color: 'black' }, { num: 5, color: 'red' }, { num: 24, color: 'black' },
    { num: 16, color: 'red' }, { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
    { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' }, { num: 22, color: 'black' },
    { num: 18, color: 'red' }, { num: 29, color: 'black' }, { num: 7, color: 'red' }, { num: 28, color: 'black' },
    { num: 12, color: 'red' }, { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' }
  ];

  const [rouletteBetType, setRouletteBetType] = useState<'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'ZERO'>('RED');
  const [rouletteBetAmount, setRouletteBetAmount] = useState(25);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<{ num: number; color: string } | null>(null);
  const [rouletteStatusMsg, setRouletteStatusMsg] = useState('');
  const [wheelOffset, setWheelOffset] = useState(0); // for visual visual scroll element

  const spinRoulette = () => {
    if (rouletteSpinning) return;
    if (!deductFunds(rouletteBetAmount)) return;

    setRouletteSpinning(true);
    setRouletteResult(null);
    setRouletteStatusMsg('');

    // Spinning ticker logic
    let tickCount = 0;
    const scrollInterval = setInterval(() => {
      setWheelOffset(prev => (prev + 1) % ROULETTE_NUMBERS.length);
      tickCount++;

      if (tickCount >= 30) {
        clearInterval(scrollInterval);

        // Final drop spot
        const landIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
        const winSpot = ROULETTE_NUMBERS[landIndex];
        
        setWheelOffset(landIndex);
        setRouletteResult(winSpot);
        calculateRoulettePayout(winSpot);
        setRouletteSpinning(false);
      }
    }, 100);
  };

  const calculateRoulettePayout = (spot: typeof ROULETTE_NUMBERS[0]) => {
    const { num, color } = spot;
    const isEven = num !== 0 && num % 2 === 0;
    const isOdd = num !== 0 && num % 2 !== 0;

    let isWin = false;
    let multiplier = 2;

    if (rouletteBetType === 'RED' && color === 'red') isWin = true;
    else if (rouletteBetType === 'BLACK' && color === 'black') isWin = true;
    else if (rouletteBetType === 'ZERO' && num === 0) { isWin = true; multiplier = 35; }
    else if (rouletteBetType === 'EVEN' && isEven) isWin = true;
    else if (rouletteBetType === 'ODD' && isOdd) isWin = true;

    if (isWin) {
      const prize = rouletteBetAmount * multiplier;
      addFunds(prize, 'VIP Chess Roulette');
      setRouletteStatusMsg(`🎉 당첨! [${color.toUpperCase()} ${num}] 당첨 요건에 도달했습니다: +${prize} ${isVip ? 'USDT' : 'CR'}`);
      triggerToast('success', `룰렛 당첨! +${prize}`);
    } else {
      setRouletteStatusMsg(`😢 낙첨! 결과: [${color.toUpperCase()} ${num}]. 행운은 돌고 돕니다.`);
    }
  };


  return (
    <div className="bg-slate-900 border border-slate-805 rounded-2xl shadow-2xl overflow-hidden mt-6" id="minigame-hub">
      {/* 1. Header Section */}
      <div className="p-6 pb-4 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 animate-bounce">
            <span className="p-1 text-emerald-400 bg-emerald-500/10 rounded-lg">
              <Trophy size={16} />
            </span>
            <span className="text-xs font-semibold uppercase text-emerald-400 font-mono tracking-widest">Web3 Multi Arena Zone</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Futua Simula 프리미엄 미니게임 센터</h3>
          <p className="text-slate-400 text-xs mt-1">
            테트리스, 퐁 및 카지노 도박(슬롯머신, 블랙잭, 베팅 룰렛)을 통합한 하이엔드 Web3 엔터테인먼트 존입니다.
          </p>
        </div>

        {/* Dynamic Gaming Status (VIP/Free) */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-805 flex items-center gap-2">
            <Coins size={14} className="text-yellow-500 shrink-0" />
            <div>
              <span className="text-slate-500 text-4xs uppercase font-bold block leading-none">사용 가능 칩고</span>
              <span className="text-white font-mono text-sm font-extrabold leading-none mt-1 inline-block">
                {isVip ? `${wallet.usdtBalance.toFixed(2)} USDT` : `${demoCredits} Credits`}
              </span>
            </div>
          </div>

          {!isVip && (
            <button
              id="btn-faucet-demo-credits"
              onClick={() => {
                setDemoCredits(prev => prev + 500);
                triggerToast('success', '데모용 카지노 칩 500 Credits가 무상 충전되었습니다!');
              }}
              className="px-2.5 py-2 bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-lg text-3xs font-extrabold cursor-pointer transition flex items-center gap-1"
            >
              <RefreshCw size={11} />
              데모 충전
            </button>
          )}
        </div>
      </div>

      {/* VIP alert ribbon matching license state */}
      <div className={`p-3 text-xs flex items-center justify-between px-6 ${
        isVip 
          ? 'bg-emerald-950/20 border-b border-emerald-900/10 text-emerald-400' 
          : 'bg-yellow-950/25 border-b border-yellow-905/10 text-yellow-500'
      }`}>
        <div className="flex items-center gap-2">
          {isVip ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          <p className="text-3xs sm:text-2xs">
            {isVip 
              ? '✓ VIP 특권 가동: 본 미니게임의 배팅금/수익금 정산은 실제 연동 메타마스크 지갑의 오프체인 USDT 잔고 및 Netlify 원장 히스토리와 상호 융합 적용됩니다.'
              : '⚠️ 라이선스 만료 무료모드: 데모 크레딧으로만 배팅이 가능합니다. 정상적인 USDT 배팅 및 온체인 영수증을 연동하려면 상단 탭에서 VIP 구독을 개시해 주십시오.'}
          </p>
        </div>
      </div>

      {/* 2. Side Tabs and Dashboard Grid */}
      <div className="flex flex-col lg:flex-row">
        {/* Nav list - Left column */}
        <div className="lg:w-56 bg-slate-950/60 border-r border-slate-850 p-2 space-y-1">
          <span className="text-slate-600 text-4xs font-black uppercase tracking-wider block p-2">Classic Mini Games</span>
          
          <button
            id="tab-select-tetris"
            onClick={() => { setActiveGame('TETRIS'); setTetrisRewardMsg(''); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
              activeGame === 'TETRIS' ? 'bg-slate-800 text-emerald-400 border border-slate-750' : 'text-slate-400 hover:bg-slate-900/60'
            }`}
          >
            <span>🧩 펜타그램 테트리스</span>
            <ChevronRight size={12} className={activeGame === 'TETRIS' ? 'text-emerald-400' : 'text-slate-700'} />
          </button>

          <button
            id="tab-select-pong"
            onClick={() => { setActiveGame('PONG'); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
              activeGame === 'PONG' ? 'bg-slate-800 text-emerald-400 border border-slate-750' : 'text-slate-400 hover:bg-slate-900/60'
            }`}
          >
            <span>🏓 사이버 핑퐁 (Classic)</span>
            <ChevronRight size={12} className={activeGame === 'PONG' ? 'text-emerald-400' : 'text-slate-700'} />
          </button>

          <div className="h-px bg-slate-900 my-2" />
          <span className="text-slate-600 text-4xs font-black uppercase tracking-wider block p-2">Casino Mini Games</span>

          <button
            id="tab-select-slots"
            onClick={() => { setActiveGame('SLOTS'); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
              activeGame === 'SLOTS' ? 'bg-slate-800 text-emerald-400 border border-slate-750' : 'text-slate-400 hover:bg-slate-900/60'
            }`}
          >
            <span>🎰 네온 크립토 슬롯머신</span>
            <ChevronRight size={12} className={activeGame === 'SLOTS' ? 'text-emerald-400' : 'text-slate-700'} />
          </button>

          <button
            id="tab-select-blackjack"
            onClick={() => { setActiveGame('BLACKJACK'); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
              activeGame === 'BLACKJACK' ? 'bg-slate-800 text-emerald-400 border border-slate-750' : 'text-slate-400 hover:bg-slate-900/60'
            }`}
          >
            <span>🃏 Web3 정통 블랙잭</span>
            <ChevronRight size={12} className={activeGame === 'BLACKJACK' ? 'text-emerald-400' : 'text-slate-700'} />
          </button>

          <button
            id="tab-select-roulette"
            onClick={() => { setActiveGame('ROULETTE'); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
              activeGame === 'ROULETTE' ? 'bg-slate-800 text-emerald-400 border border-slate-750' : 'text-slate-400 hover:bg-slate-900/60'
            }`}
          >
            <span>🎡 BSC 룰렛 디바이스</span>
            <ChevronRight size={12} className={activeGame === 'ROULETTE' ? 'text-emerald-400' : 'text-slate-700'} />
          </button>
        </div>

        {/* Main interactive screen workspace - Right column */}
        <div className="flex-grow p-6 bg-slate-900/30">
          
          {/* ======================================= */}
          {/* S1: TETRIS WORKSPACE */}
          {/* ======================================= */}
          {activeGame === 'TETRIS' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start" id="tetris-game-frame">
              <div className="md:col-span-7 flex justify-center bg-slate-950 p-4 rounded-2xl border border-slate-850">
                {/* Visual grid render */}
                <div className="grid grid-cols-10 gap-0.5 max-w-[240px] w-full aspect-[1/2] bg-slate-900 p-1 border border-slate-800 rounded-lg">
                  {grid.map((row, r) => 
                    row.map((cell, c) => {
                      // Check if matches falling block
                      let isMovingCell = false;
                      let cellType = cell;
                      if (currentPiece && tetrisPlaying) {
                        const pr = r - currentPiece.y;
                        const pc = c - currentPiece.x;
                        if (pr >= 0 && pr < currentPiece.shape.length && pc >= 0 && pc < currentPiece.shape[0].length) {
                          if (currentPiece.shape[pr][pc] !== 0) {
                            isMovingCell = true;
                            cellType = currentPiece.type;
                          }
                        }
                      }

                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`w-full aspect-square rounded-xs border-[0.5px] transition-all duration-75 ${
                            isMovingCell || cellType !== ''
                              ? COLORS[cellType as keyof typeof COLORS] || 'bg-slate-800'
                              : 'bg-[#0f172a] border-slate-900'
                          }`}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tetris stats and side commands */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">가이드 & 조작계터미널</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-2xs">
                    <div className="bg-slate-900 p-2 rounded border border-slate-805">
                      <span className="text-slate-500 block">SCORE</span>
                      <span className="text-white font-extrabold text-sm">{tetrisScore}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-805">
                      <span className="text-slate-500 block">LEVEL</span>
                      <span className="text-white font-extrabold text-sm">{tetrisLevel}</span>
                    </div>
                  </div>

                  {/* Play controls */}
                  <div className="pt-2">
                    {!tetrisPlaying && !tetrisGameOver ? (
                      <button
                        id="btn-play-tetris"
                        onClick={startTetris}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                      >
                        <Play size={13} fill="currentColor" />
                        테트리스 시작하기
                      </button>
                    ) : (
                      <button
                        id="btn-reset-tetris"
                        onClick={startTetris}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw size={12} />
                        다시 시작하기
                      </button>
                    )}
                  </div>

                  {/* Instruction keyboard mapping */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-805 text-3xs text-slate-400 space-y-1 font-mono">
                    <p className="text-white font-bold mb-1">🎮 조작 가이드</p>
                    <p>← / → : 좌우 이동</p>
                    <p>↑ 화살표: 블록 회전</p>
                    <p>↓ 화살표: 소프트 드롭 (가속)</p>
                    <p>Spacebar: 하드 드롭 (즉시 강하)</p>
                    <p className="text-slate-500 border-t border-slate-800 pt-1.5 mt-1 sm:text-4xs">※ 라인 클리어 시 점수에 따라 실제 {isVip ? 'USDT' : '데모 크레딧'}로 환원 정산됩니다. (10 PTS = 1 USDT)</p>
                  </div>
                </div>

                {/* Reward Alert status */}
                {tetrisRewardMsg && (
                  <div className="bg-emerald-950/40 border border-emerald-900/30 p-3 rounded-xl text-emerald-400 text-2xs animate-pulse font-sans">
                    {tetrisRewardMsg}
                  </div>
                )}
                {tetrisGameOver && !tetrisRewardMsg && (
                  <div className="bg-red-950/40 border border-red-900/30 p-3 rounded-xl text-red-300 text-2xs font-sans">
                    💥 GAME OVER! 블록이 가득 찼습니다. 다시 전열을 정비해 보세요!
                  </div>
                )}

                {/* Mobile screen direction buttons overlay */}
                {tetrisPlaying && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col items-center gap-2">
                    <button id="ctrl-tetris-up" onClick={rotatePiece} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer text-xs">▲</button>
                    <div className="flex gap-4">
                      <button id="ctrl-tetris-left" onClick={moveLeft} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer text-xs">◀</button>
                      <button id="ctrl-tetris-down" onClick={moveDown} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer text-xs">▼</button>
                      <button id="ctrl-tetris-right" onClick={moveRight} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer text-xs">▶</button>
                    </div>
                    <button id="ctrl-tetris-space" onClick={dropHard} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-3xs mt-1 cursor-pointer">스페이스 (하드드롭)</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* S2: PONG WORKSPACE */}
          {/* ======================================= */}
          {activeGame === 'PONG' && (
            <div className="space-y-4" id="pong-game-frame">
              <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-850">
                <div className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  PLAYER: <span className="font-mono text-white text-sm ml-1">{pongScore.player}</span>
                </div>
                
                <span className="text-3xs text-slate-500 font-mono">가상 퐁 아레나: 매치 5승제 선취시 배당 즉각 수령</span>
                
                <div className="text-blue-400 font-bold flex items-center gap-1 text-xs">
                  CPU: <span className="font-mono text-white text-sm ml-1">{pongScore.cpu}</span>
                </div>
              </div>

              {/* High-fidelity gaming view canvas */}
              <div className="relative bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex flex-col items-center p-2">
                <canvas
                  id="pong-screen-canvas"
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full max-w-[550px] aspect-[3/2] bg-[#070b13] rounded-lg border border-slate-900 cursor-none"
                />

                {/* Overlapped Play Trigger UI screen */}
                {!pongPlaying && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                    <h5 className="text-white text-base font-extrabold">사이버 핑퐁 토너먼트 가동</h5>
                    <p className="text-slate-400 text-2xs mt-1.5 max-w-sm mb-4 leading-relaxed">
                      컴퓨터 CPU와 모의 거래속도 반사 테스트를 수행합니다. <br />
                      마우스 포인터를 게임 화면 위로 서빙하여 좌측 패들을 조절해 주십시오. 5점 달성 시 {isVip ? '20 USDT' : '100 크레딧'} 보너스가 즉시 주어집니다.
                    </p>
                    
                    <button
                      id="btn-play-pong"
                      onClick={startPong}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/25 transition cursor-pointer"
                    >
                      핑퐁 탁구 경기 개시
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* S3: SLOT MACHINE WORKSPACE */}
          {/* ======================================= */}
          {activeGame === 'SLOTS' && (
            <div className="space-y-6" id="slots-game-frame">
              {/* Reels structure container */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 flex flex-col items-center">
                <span className="text-slate-500 text-4xs uppercase tracking-widest font-bold mb-4 font-mono">[NEON LIQUID CRYPTO SLOT]</span>
                
                <div className="flex gap-4 justify-center items-center mb-6">
                  {slotReels.map((reelValue, i) => (
                    <div
                      key={i}
                      id={`slot-reel-${i}`}
                      className={`w-20 h-24 bg-slate-900 border-2 ${
                        slotSpinning ? 'border-indigo-500 animate-pulse' : 'border-slate-800'
                      } rounded-xl flex items-center justify-center text-4xl shadow-lg transition-transform`}
                    >
                      {reelValue}
                    </div>
                  ))}
                </div>

                {/* Betting selection slider & button */}
                <div className="w-full max-w-md bg-slate-900/60 p-4 rounded-xl border border-slate-805 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-bold block">배팅액 선택</span>
                    <div className="flex gap-1.5">
                      {([5, 10, 20, 50] as const).map((amount) => (
                        <button
                          key={amount}
                          id={`btn-slotbet-${amount}`}
                          type="button"
                          onClick={() => setSlotBet(amount)}
                          className={`px-2.5 py-1 text-3xs font-black rounded border cursor-pointer ${
                            slotBet === amount
                              ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 text-2xs">현재 배팅: <span className="font-mono text-white font-bold">{slotBet} USDT/CR</span></span>
                    <button
                      id="btn-spin-slots"
                      onClick={spinSlots}
                      disabled={slotSpinning}
                      className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg shadow-yellow-500/10 cursor-pointer disabled:opacity-50"
                    >
                      {slotSpinning ? '슬롯 회전 중...' : '🎰 레버 당기기 (Spin)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Slot payoff alerts and symbols instruction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">🎰 당첨 배당 판넬</h4>
                  <div className="bg-slate-955 bg-slate-950/70 p-4 rounded-xl border border-slate-850 text-3xs text-slate-400 space-y-2 font-mono">
                    <div className="flex justify-between items-center text-yellow-400 font-bold select-none border-b border-slate-900 pb-1.5">
                      <span>⭐ ⭐ ⭐ Triple Stars</span>
                      <span>50배 대박</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 select-none">
                      <span>💎 💎 💎 Triple Diamonds</span>
                      <span>25배 당첨</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 select-none">
                      <span>🪙 🪙 🪙 Triple BNB Coins</span>
                      <span>15배 당첨</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 select-none">
                      <span>🟢 🟢 🟢 Triple USDT Tokens</span>
                      <span>10배 당첨</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 select-none">
                      <span>동일한 2개 매치 시 (Double Match)</span>
                      <span>보증 2배 환불</span>
                    </div>
                  </div>
                </div>

                {slotPayoutMsg && (
                  <div className="bg-slate-950 border border-slate-850 p-6 rounded-xl flex items-center justify-center text-center animate-in fade-in duration-100">
                    <p className="text-sm font-sans text-white font-extrabold tracking-tight whitespace-pre-wrap leading-relaxed">
                      {slotPayoutMsg}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* S4: BLACKJACK WORKSPACE */}
          {/* ======================================= */}
          {activeGame === 'BLACKJACK' && (
            <div className="space-y-6" id="blackjack-game-frame">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6 relative">
                
                {/* Dealer side hand */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-mono text-3xs font-bold uppercase tracking-wider">Dealer Hand</span>
                    {blackjackState !== 'BETTING' && (
                      <span className="text-3xs text-slate-405 font-mono">
                        카드 가치: {blackjackState === 'PLAYING' ? `${dealerHand[0]?.num || 0} + ?` : calculateHandValue(dealerHand)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2.5 min-h-[90px] pt-1">
                    {dealerHand.map((card, i) => {
                      const isHidden = blackjackState === 'PLAYING' && i === 1;
                      const isRed = ['♥', '♦'].includes(card.suit);

                      return (
                        <div
                          key={i}
                          id={`dealer-card-${i}`}
                          className={`w-16 h-22 rounded-lg flex flex-col justify-between p-2 shadow-md transition-all ${
                            isHidden
                              ? 'bg-indigo-900 border-2 border-indigo-700 items-center justify-center'
                              : 'bg-white text-slate-950 border border-slate-205 font-sans'
                          }`}
                        >
                          {isHidden ? (
                            <Zap size={20} className="text-indigo-400 animate-pulse mt-4" />
                          ) : (
                            <>
                              <div className={`text-xs font-bold leading-none ${isRed ? 'text-red-650' : 'text-slate-950'}`}>
                                {card.value}
                              </div>
                              <div className={`text-2xl font-bold self-center ${isRed ? 'text-red-650' : 'text-slate-950'}`}>
                                {card.suit}
                              </div>
                              <div className={`text-xs font-bold leading-none self-end scale-y-[-1] ${isRed ? 'text-red-500' : 'text-slate-950'}`}>
                                {card.value}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {dealerHand.length === 0 && (
                      <div className="text-slate-600 text-3xs italic pt-4">카드가 배분되지 않았습니다.</div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-900" />

                {/* Player side hand */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-mono text-3xs font-bold uppercase tracking-wider">Your Hand</span>
                    {playerHand.length > 0 && (
                      <span className="text-3xs text-emerald-400 font-mono font-bold">
                        최종 가치 합계: {calculateHandValue(playerHand)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2.5 min-h-[90px] pt-1">
                    {playerHand.map((card, i) => {
                      const isRed = ['♥', '♦'].includes(card.suit);
                      return (
                        <div
                          key={i}
                          id={`player-card-${i}`}
                          className="w-16 h-22 bg-white text-slate-950 rounded-lg flex flex-col justify-between p-2 shadow-md font-sans border border-slate-205"
                        >
                          <div className={`text-xs font-bold leading-none ${isRed ? 'text-red-500' : 'text-slate-950'}`}>
                            {card.value}
                          </div>
                          <div className={`text-2xl font-bold self-center ${isRed ? 'text-red-550' : 'text-slate-950'}`}>
                            {card.suit}
                          </div>
                          <div className={`text-xs font-bold leading-none self-end scale-y-[-1] ${isRed ? 'text-red-500' : 'text-slate-950'}`}>
                            {card.value}
                          </div>
                        </div>
                      );
                    })}
                    {playerHand.length === 0 && (
                      <div className="text-slate-600 text-3xs italic pt-4">배팅 후 경기를 진행하십시오.</div>
                    )}
                  </div>
                </div>

                {/* Standard command control panel */}
                <div className="bg-slate-900 border border-slate-805 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {blackjackState === 'BETTING' ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                      <div className="flex-grow">
                        <label className="text-slate-500 text-4xs uppercase tracking-wider block font-bold font-mono">가상 블랙잭 배팅액</label>
                        <select
                          id="select-blackjack-bet"
                          value={blackjackBet}
                          onChange={(e) => setBlackjackBet(parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 mt-1"
                        >
                          <option value={10}>10 USDT / CR</option>
                          <option value={20}>20 USDT / CR</option>
                          <option value={50}>50 USDT / CR</option>
                          <option value={100}>100 USDT / CR (VIP Max)</option>
                        </select>
                      </div>

                      <button
                        id="btn-deal-blackjack"
                        onClick={dealBlackjack}
                        className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition uppercase tracking-wide shrink-0 font-sans"
                      >
                        배팅 후 딜 (Deal Card)
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs">
                        <span className="text-slate-500 text-3xs font-mono block">Bet Escrow</span>
                        <span className="text-yellow-400 font-extrabold font-mono">{blackjackBet} USDT / CR</span>
                      </div>

                      <div className="flex gap-2">
                        {blackjackState === 'PLAYING' && (
                          <>
                            <button
                              id="btn-hit-blackjack"
                              onClick={hitBlackjack}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-lg cursor-pointer"
                            >
                              + HIT (카드 받기)
                            </button>
                            <button
                              id="btn-stand-blackjack"
                              onClick={standBlackjack}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                            >
                              ✓ STAND (유지)
                            </button>
                          </>
                        )}

                        {blackjackState === 'GAME_OVER' && (
                          <button
                            id="btn-reset-blackjack"
                            onClick={resetBlackjack}
                            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg cursor-pointer"
                          >
                            새로운 라운드 진행
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Status message board */}
              {blackjackStatusMsg && (
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl text-center">
                  <p className="text-xs font-sans text-slate-300 font-bold leading-normal">
                    {blackjackStatusMsg}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* S5: BETTING ROULETTE WORKSPACE */}
          {/* ======================================= */}
          {activeGame === 'ROULETTE' && (
            <div className="space-y-6" id="roulette-game-frame">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 flex flex-col items-center gap-6">
                <span className="text-slate-500 text-4xs uppercase tracking-widest font-bold font-mono">[BSC RANDOM WHEEL ROULETTE]</span>
                
                {/* Conveyor-belt visual roulette reel selection */}
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-2 rounded-xl relative overflow-hidden flex flex-col items-center">
                  <div className="h-6 w-0.5 bg-yellow-500 absolute top-0 z-10 shrink-0" />
                  
                  <div className="flex gap-1.5 transition-transform overflow-hidden py-4 w-full justify-center">
                    {/* Render slice window */}
                    {[-2, -1, 0, 1, 2].map((offsetIndex) => {
                      const idx = (wheelOffset + offsetIndex + ROULETTE_NUMBERS.length) % ROULETTE_NUMBERS.length;
                      const item = ROULETTE_NUMBERS[idx];
                      
                      return (
                        <div
                          key={offsetIndex}
                          className={`w-12 h-14 rounded-lg flex items-center justify-center font-bold text-sm text-white ${
                            item.color === 'green' ? 'bg-emerald-600 shadow-emerald-500/10' :
                            item.color === 'red' ? 'bg-red-600 shadow-red-500/10' : 'bg-slate-950'
                          } border border-slate-800 shrink-0 ${offsetIndex === 0 ? 'scale-110 ring-2 ring-yellow-400' : 'opacity-40'}`}
                        >
                          {item.num}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bets configuration table board */}
                <div className="w-full max-w-lg space-y-4">
                  <div className="space-y-1 bg-slate-900 border border-slate-805 p-4 rounded-xl">
                    <label className="text-slate-500 text-4xs uppercase font-extrabold block">베팅 구역 선택</label>
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {(['RED', 'BLACK', 'EVEN', 'ODD', 'ZERO'] as const).map((bType) => (
                        <button
                          key={bType}
                          id={`btn-roulette-option-${bType}`}
                          type="button"
                          onClick={() => setRouletteBetType(bType)}
                          className={`py-2 rounded-lg text-4xs font-black cursor-pointer uppercase transition ${
                            rouletteBetType === bType
                              ? bType === 'RED' ? 'bg-red-650 text-white' :
                                bType === 'BLACK' ? 'bg-slate-800 text-emerald-400' :
                                bType === 'ZERO' ? 'bg-emerald-600 text-white' :
                                'bg-yellow-500 text-slate-950'
                              : 'bg-slate-950 border border-slate-805 text-slate-400 hover:border-slate-705'
                          }`}
                        >
                          {bType === 'RED' ? '🔴 RED' :
                           bType === 'BLACK' ? '⚫ BLACK' :
                           bType === 'ZERO' ? '🟢 0' :
                           bType === 'EVEN' ? 'EVEN' : 'ODD'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 border border-slate-805 p-4 rounded-xl">
                    {/* Amount */}
                    <div>
                      <label className="text-slate-500 text-4xs uppercase font-extrabold block">베팅 머니액 (USDT/CR)</label>
                      <select
                        id="select-roulette-bet"
                        value={rouletteBetAmount}
                        onChange={(e) => setRouletteBetAmount(parseInt(e.target.value))}
                        className="w-full bg-slate-955 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 mt-1"
                      >
                        <option value={10}>10 USDT / CR</option>
                        <option value={25}>25 USDT / CR</option>
                        <option value={50}>50 USDT / CR</option>
                        <option value={100}>100 USDT / CR</option>
                      </select>
                    </div>

                    {/* Trigger spin */}
                    <div className="flex items-end">
                      <button
                        id="btn-spin-roulette"
                        onClick={spinRoulette}
                        disabled={rouletteSpinning}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg shadow-teal-500/15 cursor-pointer disabled:opacity-50 text-xs"
                      >
                        {rouletteSpinning ? '스핀 휠 구동 중...' : '🎡 룰렛 휠 회전시키기'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Roulette output statements */}
              {rouletteStatusMsg && (
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl text-center">
                  <p className="text-xs font-sans text-slate-300 font-bold leading-normal">
                    {rouletteStatusMsg}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
