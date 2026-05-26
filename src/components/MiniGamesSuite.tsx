import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, ShieldAlert, ShieldCheck, Globe, HelpCircle, 
  RotateCcw, Sliders, Play, Award, Volume2, Coins, ArrowRightLeft,
  XCircle, CheckCircle, Flame, RefreshCw, Layers, Sparkles
} from 'lucide-react';
import { GeolocationState, BlockedCountry } from '../types';
import { BLOCKED_COUNTRIES, SAFE_COUNTRIES } from '../data';

interface MiniGamesSuiteProps {
  onAddTransaction: (hash: string, action: string, amount: number, status: 'SUCCESS' | 'FAILED') => void;
  usdtBalance: number;
  onDeductUsdt: (amount: number) => void;
  onAddUsdt: (amount: number) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

type ModeType = 'TETRIS' | 'PONG' | 'SLOT' | 'BLACKJACK' | 'ROULETTE';

export const MiniGamesSuite: React.FC<MiniGamesSuiteProps> = ({
  onAddTransaction,
  usdtBalance,
  onDeductUsdt,
  onAddUsdt,
  triggerToast,
}) => {
  // 1. Geolocation Access Block State
  const [geo, setGeo] = useState<GeolocationState>(() => {
    const saved = localStorage.getItem('FUTUA_MINI_GEO');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Default: Simulate access from South Korea (Blocked) as the user metadata indicates local time & location
    return {
      ip: '211.234.56.78',
      countryCode: 'KR',
      countryName: '대한민국 (South Korea)',
      isBlocked: true,
      detectedMethod: 'MANUAL_SIMULATION',
    };
  });

  // 2. Active suite view mode
  const [activeGame, setActiveGame] = useState<ModeType>('TETRIS');

  // 3. User Game Balance (Virtual Arcade Coins)
  const [arcadeCoins, setArcadeCoins] = useState<number>(() => {
    const saved = localStorage.getItem('FUTUA_ARCADE_COINS');
    return saved ? parseInt(saved) : 500;
  });

  // Save state helpers
  useEffect(() => {
    localStorage.setItem('FUTUA_MINI_GEO', JSON.stringify(geo));
  }, [geo]);

  useEffect(() => {
    localStorage.setItem('FUTUA_ARCADE_COINS', arcadeCoins.toString());
  }, [arcadeCoins]);

  // Handle auto lookup on mount to simulate high fidelity
  useEffect(() => {
    const checkIp = async () => {
      // Fetch user's real public IP as a high-fidelity demonstration, with fallback gracefully
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.country_code) {
          const isBlockedCountry = BLOCKED_COUNTRIES.some(c => c.code === data.country_code);
          const countryMatch = BLOCKED_COUNTRIES.find(c => c.code === data.country_code) || 
                               SAFE_COUNTRIES.find(c => c.code === data.country_code);
          
          setGeo({
            ip: data.ip || '127.0.0.1',
            countryCode: data.country_code,
            countryName: countryMatch ? `${countryMatch.nameKO} (${countryMatch.nameEN})` : data.country_name || 'Altered State',
            isBlocked: isBlockedCountry,
            detectedMethod: 'API'
          });
        }
      } catch {
        // Safe sandbox fallback
      }
    };
    checkIp();
  }, []);

  // Set selected custom nation (simulate VPN location switch)
  const handleVpnSwitch = (countryCode: string) => {
    const isBlockedCountry = BLOCKED_COUNTRIES.some(c => c.code === countryCode);
    const countryObj = BLOCKED_COUNTRIES.find(c => c.code === countryCode) || 
                       SAFE_COUNTRIES.find(c => c.code === countryCode);
    
    if (!countryObj) return;

    // Allocate random IP in region range
    const pre = countryCode === 'KR' ? '211.234.' : 
                countryCode === 'US' ? '182.22.' :
                countryCode === 'JP' ? '133.43.' : 
                countryCode === 'CN' ? '114.240.' : '62.14.';
    const suffix = `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;

    setGeo({
      ip: pre + suffix,
      countryCode: countryCode,
      countryName: `${countryObj.nameKO} (${countryObj.nameEN})`,
      isBlocked: isBlockedCountry,
      detectedMethod: 'MANUAL_SIMULATION',
    });

    if (isBlockedCountry) {
      triggerToast('error', `시뮬레이션 국가가 [${countryObj.nameKO}]으로 변경되어 미니게임 접근이 규제 차단되었습니다.`);
    } else {
      triggerToast('success', `성공적으로 [${countryObj.nameKO} IP] 우회 터널이 활성화되어 미니게임이 전면 잠금 해제되었습니다!`);
    }
  };

  // Convert USDT to Game Coins (and vice versa)
  const handleSwapUsdtToCoins = (usdtAmount: number) => {
    if (usdtBalance < usdtAmount) {
      triggerToast('error', '지갑의 가상 USDT 잔액이 부족합니다. 수도꼭지를 통해 충전 하십시오.');
      return;
    }
    onDeductUsdt(usdtAmount);
    setArcadeCoins(prev => prev + usdtAmount * 100);
    triggerToast('success', `${usdtAmount} USDT를 ${usdtAmount * 100} 아케이드 크레딧으로 환전 수납 완료!`);
  };

  const handleSwapCoinsToUsdt = (coinUnits: number) => {
    if (arcadeCoins < coinUnits) {
      triggerToast('error', '교환에 필요한 아케이드 크레딧 잔고가 부족합니다.');
      return;
    }
    const usdtGain = coinUnits / 100;
    setArcadeCoins(prev => prev - coinUnits);
    onAddUsdt(usdtGain);
    triggerToast('success', `${coinUnits} 크레딧을 ${usdtGain} USDT 캐시로 전환 정산 완료!`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden mt-6" id="minigames-section">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header */}
      <div className="pb-4 border-b border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-2.5 bg-purple-500/15 text-purple-400 font-bold text-4xs uppercase tracking-wider rounded-lg border border-purple-500/20 flex items-center gap-1">
              <Gamepad2 size={11} className="animate-bounce" />
              <span>Futua Port Extended Arcade</span>
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1.5">블록체인 지갑 연합 아케이드 미니게임 센터</h3>
          <p className="text-slate-400 text-xs mt-1">
            획득한 점수와 크레딧은 실시간 BSC USDT 스마트 스왑으로 상호 교환 정산 보존이 가능합니다.
          </p>
        </div>

        {/* Dynamic Credit Swap Wallet */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-850">
          <div className="text-xs">
            <span className="text-slate-500 text-4xs uppercase font-bold block">아케이드 크레딧</span>
            <span className="text-amber-400 font-extrabold font-mono text-sm flex items-center gap-1 mt-0.5">
              <Coins size={14} />
              {arcadeCoins} <span className="text-3xs text-amber-500 font-normal">CRD</span>
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Swap Trigger Controls */}
          <div className="flex flex-col gap-1.5">
            <button
              id="btn-swap-usdt-1"
              onClick={() => handleSwapUsdtToCoins(5)}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-755 text-emerald-400 text-4xs font-bold rounded cursor-pointer leading-none flex items-center gap-1"
            >
              5 USDT ➡️ 500 CRD
            </button>
            <button
              id="btn-swap-coin-500"
              onClick={() => handleSwapCoinsToUsdt(500)}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-755 text-amber-500 text-4xs font-bold rounded cursor-pointer leading-none flex items-center gap-1"
            >
              500 CRD ➡️ 5 USDT
            </button>
          </div>
        </div>
      </div>

      {/* Geolocation IP Access Block Test Area & VPN Tunnel Switcher */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-900 rounded-lg shrink-0 text-slate-400">
              <Globe size={20} className="text-indigo-400" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold font-mono">가상 분산 네트워크 실시간 접속 노드 정보</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xs text-slate-500 mt-1 font-mono">
                <span>클라이언트 IP: <strong className="text-slate-300">{geo.ip}</strong></span>
                <span>•</span>
                <span>접속 권역: <strong className="text-teal-400">{geo.countryName}</strong></span>
                <span>•</span>
                <span>감지 방식: <span className="text-slate-400 font-bold bg-slate-900 px-1 py-0.2 rounded">{geo.detectedMethod}</span></span>
              </div>
            </div>
          </div>

          {/* Access indicator alert light */}
          <div>
            {geo.isBlocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-3xs font-bold">
                <ShieldAlert size={12} />
                특정 추가 기능 접속 차단됨 (VPN 확인 권장)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-3xs font-bold animate-pulse">
                <ShieldCheck size={12} />
                아케이드 부가 기능 접속 전면 허용
              </span>
            )}
          </div>
        </div>

        {/* VPN Simulation Panel */}
        <div className="pt-3 border-t border-slate-905 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <span className="text-4xs text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1">
            <Sliders size={11} className="text-indigo-400" />
            <span>VPN 지역 모사 스위치 (테스트용)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {/* Permitted locations */}
            <span className="text-4xs text-slate-650 flex items-center ml-1 select-none">허용 지역:</span>
            {SAFE_COUNTRIES.slice(0, 3).map(c => (
              <button
                key={c.code}
                id={`btn-vpn-safe-${c.code}`}
                onClick={() => handleVpnSwitch(c.code)}
                className={`px-2 py-1 text-4xs font-bold rounded cursor-pointer transition ${
                  geo.countryCode === c.code 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c.nameKO} ({c.code})
              </button>
            ))}

            {/* Blocked locations */}
            <span className="text-4xs text-slate-650 flex items-center ml-2 select-none">차단 규제 지역:</span>
            {BLOCKED_COUNTRIES.filter(c => ['KR', 'NO', 'CN', 'RU'].includes(c.code)).map(c => (
              <button
                key={c.code}
                id={`btn-vpn-blocked-${c.code}`}
                onClick={() => handleVpnSwitch(c.code)}
                className={`px-2 py-1 text-4xs font-bold rounded cursor-pointer transition ${
                  geo.countryCode === c.code 
                    ? 'bg-red-500 text-slate-950 font-extrabold' 
                    : 'bg-slate-905 text-red-400/70 hover:text-red-300 border border-red-950/20'
                }`}
              >
                {c.nameKO} ({c.code})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CORE DISPLAY WALL: SHOW ACCESS BANNED SCREEN IF IN BLOCKED LIST */}
      {geo.isBlocked ? (
        <div className="bg-slate-950 rounded-xl border border-red-520/20 p-10 text-center space-y-5" id="geoip-banned-splash">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert size={36} />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h4 className="text-lg font-black text-red-400">미니게임 규제 차단 안내</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              귀하의 감지된 네트워크 IP(<span className="font-mono text-white font-bold">{geo.ip}</span>)는 규제 정책 대상 국가인 **{geo.countryName}**으로 확인되었습니다. <br />
              지정된 미출시 사설 게임, 베팅 모사 엔진(Tetris, Pong, 슬롯, 블랙잭, 룰렛) 부가 기능의 탑재 운영이 국내 및 법규 정책으로 차단되어 제한을 적용받고 있습니다.
            </p>
            <p className="text-slate-500 text-3xs font-mono">
              ※ 우회를 확인하시려면 가상 국가/IP 우회 시뮬레이터(VPN) 버튼 목록 중 [미국, 일본, 싱가포르] 중 하나를 선택하여 상태를 즉각 잠금 해제 스위칭하십시오.
            </p>
          </div>
        </div>
      ) : (
        /* GAME CENTER WORKSPACE - SHOWN ONLY IF PERMITTED IP COUNTRY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="games-workspace">
          {/* Game Tab Selector Navigation */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <h5 className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold px-1">게임 목록 선택</h5>
            {[
              { id: 'TETRIS', label: '🕹️ 테트리스 (Tetris)', desc: '클래식 블록 퍼즐 게임' },
              { id: 'PONG', label: '🏓 퐁 챌린지 (Pong)', desc: 'CPU 대응 실시간 미니 피치' },
              { id: 'SLOT', label: '🎰 골든 릴 (Slot Multi)', desc: 'USDT 연동 가상 슬롯 다이알' },
              { id: 'BLACKJACK', label: '🃏 블랙잭 21 (BJ-21)', desc: '딜러 매칭 딜링 포인트 베팅' },
              { id: 'ROULETTE', label: '🎯 더블 룰렛 (Roulette)', desc: '37 포켓 행운 배수 베이' },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`game-tab-${tab.id}`}
                onClick={() => setActiveGame(tab.id as ModeType)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeGame === tab.id
                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg'
                    : 'bg-slate-950/70 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <div className="text-xs font-bold">{tab.label}</div>
                <div className="text-3xs text-slate-500 mt-0.5">{tab.desc}</div>
              </button>
            ))}
          </div>

          {/* Active Arcade Board Screen */}
          <div className="lg:col-span-9 bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col justify-between relative min-h-[460px]">
            {activeGame === 'TETRIS' && <TetrisGame creditBalance={arcadeCoins} onUpdateCredit={setArcadeCoins} triggerToast={triggerToast} />}
            {activeGame === 'PONG' && <PongGame creditBalance={arcadeCoins} onUpdateCredit={setArcadeCoins} triggerToast={triggerToast} />}
            {activeGame === 'SLOT' && <SlotGame creditBalance={arcadeCoins} onUpdateCredit={setArcadeCoins} triggerToast={triggerToast} />}
            {activeGame === 'BLACKJACK' && <BlackjackGame creditBalance={arcadeCoins} onUpdateCredit={setArcadeCoins} triggerToast={triggerToast} />}
            {activeGame === 'ROULETTE' && <RouletteGame creditBalance={arcadeCoins} onUpdateCredit={setArcadeCoins} triggerToast={triggerToast} />}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------ (1) TETRIS IMPLEMENTATION ------------------ */
interface SubGameProps {
  creditBalance: number;
  onUpdateCredit: React.Dispatch<React.SetStateAction<number>>;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const TetrisGame: React.FC<SubGameProps> = ({ creditBalance, onUpdateCredit, triggerToast }) => {
  const ROW_COUNT = 15;
  const COL_COUNT = 10;
  
  const [grid, setGrid] = useState<string[][]>(() => Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill('')));
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Current active tetris tetromino shape coordinate and block
  const [currentPiece, setCurrentPiece] = useState<{
    shape: string[][];
    color: string;
    row: number;
    col: number;
  } | null>(null);

  // Shapes config
  const PIECES = [
    { shape: [['I','I','I','I']], color: 'bg-cyan-500 border-cyan-400' },
    { shape: [['O','O'],['O','O']], color: 'bg-yellow-500 border-yellow-400' },
    { shape: [['T','T','T'],['','T','']], color: 'bg-purple-500 border-purple-400' },
    { shape: [['L','L','L'],['L','','']], color: 'bg-orange-500 border-orange-400' },
    { shape: [['Z','Z',''],['','Z','Z']], color: 'bg-red-500 border-red-400' }
  ];

  const spawnPiece = () => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    const newPiece = {
      shape: p.shape,
      color: p.color,
      row: 0,
      col: Math.floor((COL_COUNT - p.shape[0].length) / 2)
    };
    
    // Check initial overlap = game over
    if (checkCollision(newPiece.shape, newPiece.row, newPiece.col, grid)) {
      setGameOver(true);
      setIsPlaying(false);
      
      // Pay reward of scores
      if (score > 10) {
        const bonusCoins = Math.floor(score / 5);
        onUpdateCredit(prev => prev + bonusCoins);
        triggerToast('success', `게임 종료! 획득 점수로 ${bonusCoins} 아케이드 크레딧이 적립되었습니다.`);
      }
    } else {
      setCurrentPiece(newPiece);
    }
  };

  const handleStart = () => {
    // Collect entry cost
    if (creditBalance < 20) {
      triggerToast('error', '테트리스 가동비인 20 크레딧이 부족합니다.');
      return;
    }
    onUpdateCredit(prev => prev - 20);
    setGrid(Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill('')));
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    spawnPiece();
  };

  const checkCollision = (shape: string[][], r: number, c: number, currentGrid: string[][]) => {
    for (let rIdx = 0; rIdx < shape.length; rIdx++) {
      for (let cIdx = 0; cIdx < shape[rIdx].length; cIdx++) {
        if (shape[rIdx][cIdx] !== '') {
          const nextR = r + rIdx;
          const nextC = c + cIdx;
          if (nextR >= ROW_COUNT || nextC < 0 || nextC >= COL_COUNT) {
            return true;
          }
          if (nextR >= 0 && currentGrid[nextR][nextC] !== '') {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Move left / right / down
  const movePiece = (dir: number) => {
    if (!isPlaying || !currentPiece) return;
    const nextCol = currentPiece.col + dir;
    if (!checkCollision(currentPiece.shape, currentPiece.row, nextCol, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, col: nextCol } : null);
    }
  };

  const rotatePiece = () => {
    if (!isPlaying || !currentPiece) return;
    const shape = currentPiece.shape;
    // Transpose and reverse rows
    const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    if (!checkCollision(rotated, currentPiece.row, currentPiece.col, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, shape: rotated } : null);
    }
  };

  const dropPiece = () => {
    if (!isPlaying || !currentPiece) return;
    const nextRow = currentPiece.row + 1;
    if (!checkCollision(currentPiece.shape, nextRow, currentPiece.col, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, row: nextRow } : null);
    } else {
      // Lock piece inside grid
      const newGrid = grid.map(row => [...row]);
      for (let rIdx = 0; rIdx < currentPiece.shape.length; rIdx++) {
        for (let cIdx = 0; cIdx < currentPiece.shape[rIdx].length; cIdx++) {
          if (currentPiece.shape[rIdx][cIdx] !== '') {
            const lockedR = currentPiece.row + rIdx;
            const lockedC = currentPiece.col + cIdx;
            if (lockedR >= 0) {
              newGrid[lockedR][lockedC] = currentPiece.color;
            }
          }
        }
      }

      // Check cleared lines
      let linesCleared = 0;
      const filteredGrid = newGrid.filter(row => !row.every(cell => cell !== ''));
      const extraRows = ROW_COUNT - filteredGrid.length;
      if (extraRows > 0) {
        linesCleared = extraRows;
        const newRows = Array(extraRows).fill(null).map(() => Array(COL_COUNT).fill(''));
        setGrid([...newRows, ...filteredGrid]);
        setScore(prev => prev + linesCleared * 100);
      } else {
        setGrid(newGrid);
      }

      spawnPiece();
    }
  };

  // Use simple timer loop for piece descent
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      dropPiece();
    }, 900);
    return () => clearInterval(interval);
  }, [isPlaying, currentPiece, grid]);

  // Merge current active block to layout cells representation
  const renderGrid = () => {
    const copy = grid.map(row => [...row]);
    if (isPlaying && currentPiece) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== '') {
            const gridR = currentPiece.row + r;
            const gridC = currentPiece.col + c;
            if (gridR >= 0 && gridR < ROW_COUNT && gridC >= 0 && gridC < COL_COUNT) {
              copy[gridR][gridC] = currentPiece.color;
            }
          }
        }
      }
    }
    return copy;
  };

  const displayCells = renderGrid();

  return (
    <div className="flex flex-col md:flex-row gap-5 items-stretch h-full">
      {/* Game Board Canvas-like grid */}
      <div className="flex-grow flex items-center justify-center bg-slate-950 p-3 rounded-lg border border-slate-900">
        <div className="grid grid-cols-10 gap-[2px] bg-slate-900 border-2 border-slate-800 p-[3px] rounded">
          {displayCells.map((row, rIdx) => 
            row.map((cell, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`w-6 h-6 rounded-[2px] border ${cell || 'bg-slate-950 border-slate-910/30'}`}
              />
            ))
          )}
        </div>
      </div>

      {/* Control console right rail */}
      <div className="w-full md:w-[200px] flex flex-col justify-between bg-slate-900 p-4 border border-slate-850 rounded-lg">
        <div className="space-y-4">
          <div className="bg-slate-950 p-2 text-center rounded border border-slate-900">
            <span className="text-4xs text-slate-500 uppercase block font-mono">신장 기록 점수</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{score}</span>
          </div>

          {!isPlaying ? (
            <button
              id="btn-tetris-launch"
              onClick={handleStart}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <Play size={13} />
              게임 시작 (20 CRD 소모)
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <button onClick={() => movePiece(-1)} className="p-2 py-3 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded cursor-pointer border border-slate-800">◀ Left</button>
              <button onClick={rotatePiece} className="p-2 py-3 bg-slate-850 hover:bg-slate-800 text-yellow-400 font-bold text-xs rounded cursor-pointer border border-slate-800">↻ Rot</button>
              <button onClick={() => movePiece(1)} className="p-2 py-3 bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded cursor-pointer border border-slate-800">▶ Right</button>
              <button onClick={dropPiece} className="col-span-3 p-2 bg-purple-900/50 hover:bg-purple-900 text-cyan-400 font-bold text-xs rounded cursor-pointer border border-purple-900/30">🔽 Drop Down (Tick)</button>
            </div>
          )}

          {gameOver && (
            <div className="bg-red-950/40 p-3 rounded border border-red-900 text-center space-y-1">
              <span className="text-3xs text-red-400 font-bold uppercase block">GAME OVER</span>
              <span className="text-slate-400 text-3xs leading-none">블록이 꼭대기에 도달했습니다.</span>
            </div>
          )}
        </div>

        <div className="text-5xs text-slate-500 leading-snug font-sans pt-3 border-t border-slate-900 select-none">
          💡 게임 시작 시 20 CRD가 소진되며 라인을 완성해 격파할 때마다 보상 코인이 누적 적용됩니다.
        </div>
      </div>
    </div>
  );
};


/* ------------------ (2) PONG IMPLEMENTATION ------------------ */
const PongGame: React.FC<SubGameProps> = ({ creditBalance, onUpdateCredit, triggerToast }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // States inside refs for persistent non-flicker loop access
  const loopRef = useRef<number | null>(null);
  const gameState = useRef({
    playerY: 60,
    cpuY: 60,
    ballX: 150,
    ballY: 100,
    ballDX: 3.5,
    ballDY: 1.8,
    paddleWidth: 8,
    paddleHeight: 45,
    canvasWidth: 300,
    canvasHeight: 180,
    ballRadius: 5
  });

  const handleStart = () => {
    if (creditBalance < 15) {
      triggerToast('error', 'PONG 참가비인 15 아케이드 크레딧이 부족합니다.');
      return;
    }
    onUpdateCredit(prev => prev - 15);
    setPlayerScore(0);
    setCpuScore(0);
    setGameOver(false);
    setIsPlaying(true);
    
    // Reset ball positions
    gameState.current.ballX = 150;
    gameState.current.ballY = 100;
    gameState.current.ballDX = 3.5;
    gameState.current.ballDY = 1.8;
  };

  // Move paddle using button click simulation
  const handleMovePaddle = (dir: 'UP' | 'DOWN') => {
    if (!isPlaying) return;
    const step = 22;
    const current = gameState.current;
    if (dir === 'UP') {
      current.playerY = Math.max(0, current.playerY - step);
    } else {
      current.playerY = Math.min(current.canvasHeight - current.paddleHeight, current.playerY + step);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPlayerScore = 0;
    let localCpuScore = 0;

    const loop = () => {
      const g = gameState.current;

      // 1. Move ball
      g.ballX += g.ballDX;
      g.ballY += g.ballDY;

      // Wall reflections (Top & bottom)
      if (g.ballY - g.ballRadius <= 0 || g.ballY + g.ballRadius >= g.canvasHeight) {
        g.ballDY = -g.ballDY;
      }

      // CPU tracking simulation (Smooth intercept)
      const cpuCenter = g.cpuY + g.paddleHeight / 2;
      if (cpuCenter < g.ballY - 5) {
        g.cpuY = Math.min(g.canvasHeight - g.paddleHeight, g.cpuY + 1.8);
      } else if (cpuCenter > g.ballY + 5) {
        g.cpuY = Math.max(0, g.cpuY - 1.8);
      }

      // Ball and Left Paddle (Player) collision
      if (g.ballDX < 0 && g.ballX - g.ballRadius <= g.paddleWidth) {
        if (g.ballY >= g.playerY && g.ballY <= g.playerY + g.paddleHeight) {
          g.ballDX = -g.ballDX;
          // Add extra velocity spin response
          g.ballDX *= 1.05;
        } else {
          // Out of bound - CPU scores
          localCpuScore += 1;
          setCpuScore(localCpuScore);
          resetBall(1);
        }
      }

      // Ball and Right Paddle (CPU) collision
      if (g.ballDX > 0 && g.ballX + g.ballRadius >= g.canvasWidth - g.paddleWidth) {
        if (g.ballY >= g.cpuY && g.ballY <= g.cpuY + g.paddleHeight) {
          g.ballDX = -g.ballDX;
        } else {
          // Player scores
          localPlayerScore += 1;
          setPlayerScore(localPlayerScore);
          resetBall(-1);
        }
      }

      // Score target thresholds to finish
      if (localPlayerScore >= 5 || localCpuScore >= 5) {
        setIsPlaying(false);
        setGameOver(true);
        if (localPlayerScore >= 5) {
          onUpdateCredit(prev => prev + 40);
          triggerToast('success', '승리! CPU를 무찌르고 승부 수당인 40 크레딧을 전액 거머쥐었습니다!');
        } else {
          triggerToast('info', '패배! 컴파일 노드가 승리를 앗아갔습니다. 승무 수당이 반락됩니다.');
        }
        return;
      }

      // 2. Render Canvas Frame
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, g.canvasWidth, g.canvasHeight);

      // Dash line down center
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(g.canvasWidth / 2, 0);
      ctx.lineTo(g.canvasWidth / 2, g.canvasHeight);
      ctx.stroke();

      // Draw Paddles
      ctx.fillStyle = '#3b82f6'; // Player paddle
      ctx.fillRect(2, g.playerY, g.paddleWidth, g.paddleHeight);

      ctx.fillStyle = '#ef4444'; // CPU paddle
      ctx.fillRect(g.canvasWidth - 2 - g.paddleWidth, g.cpuY, g.paddleWidth, g.paddleHeight);

      // Draw Ball
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, g.ballRadius, 0, Math.PI * 2);
      ctx.fill();

      loopRef.current = requestAnimationFrame(loop);
    };

    const resetBall = (direction: number) => {
      const g = gameState.current;
      g.ballX = g.canvasWidth / 2;
      g.ballY = g.canvasHeight / 2;
      g.ballDX = direction * 3.5;
      g.ballDY = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.5);
    };

    loopRef.current = requestAnimationFrame(loop);

    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col md:flex-row gap-5 items-stretch h-full">
      {/* Pong Arena Area */}
      <div className="flex-grow flex flex-col justify-center items-center bg-slate-950 p-4 border border-slate-900 rounded-lg">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={180} 
          className="border border-slate-800 rounded bg-[#020617] max-w-full"
        />

        {/* Tactical interactive tactile buttons */}
        {isPlaying && (
          <div className="flex gap-4 mt-4 w-full justify-center">
            <button 
              onClick={() => handleMovePaddle('UP')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 rounded-lg text-xs font-bold leading-none cursor-pointer"
            >
              ▲ Paddle Up
            </button>
            <button 
              onClick={() => handleMovePaddle('DOWN')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-800 rounded-lg text-xs font-bold leading-none cursor-pointer"
            >
              ▼ Paddle Down
            </button>
          </div>
        )}
      </div>

      {/* Controller Rail */}
      <div className="w-full md:w-[200px] flex flex-col justify-between bg-slate-900 p-4 border border-slate-850 rounded-lg">
        <div className="space-y-4">
          <div className="bg-slate-950 p-2 rounded border border-slate-900">
            <span className="text-4xs text-slate-500 uppercase block text-center">퐁 실시간 스코어</span>
            <div className="flex justify-around items-center font-mono mt-1">
              <span className="text-blue-400 font-extrabold text-sm">YOU: {playerScore}</span>
              <span className="text-slate-600 text-3xs">:</span>
              <span className="text-red-400 font-extrabold text-sm">CPU: {cpuScore}</span>
            </div>
          </div>

          {!isPlaying ? (
            <button
              id="btn-pong-start"
              onClick={handleStart}
              className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <Play size={13} className="fill-slate-950" />
              게임 참가 (15 CRD 소모)
            </button>
          ) : (
            <div className="text-center bg-slate-950/40 border border-slate-950 py-3 rounded">
              <span className="text-emerald-400 text-3xs font-semibold animate-pulse block">&#9679; MATCH IN PROGRESS</span>
              <span className="text-slate-500 text-4xs">먼저 5점을 선취하면 아케이드 자금이 지급됩니다.</span>
            </div>
          )}

          {gameOver && (
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
              <div className="text-xs font-bold text-slate-300">
                {playerScore >= 5 ? '🏆 승인 정산 완료!' : '☄️ 실패(CPU 승리)'}
              </div>
            </div>
          )}
        </div>

        <div className="text-5xs text-slate-500 leading-snug pt-3 border-t border-slate-900 select-none">
          💡 방향 단추를 신속하게 입력하여 공의 패들 이탈을 방지하고 구석 경계치 반사 충과 기습을 활용하십시오.
        </div>
      </div>
    </div>
  );
};


/* ------------------ (3) SLOT MACHINE IMPLEMENTATION ------------------ */
const SlotGame: React.FC<SubGameProps> = ({ creditBalance, onUpdateCredit, triggerToast }) => {
  const SYMBOLS = ['🍇', '🍒', '🔔', '💎', '7️⃣', '🍀'];
  const [betCoins, setBetCoins] = useState(10);
  const [reels, setReels] = useState<string[]>(['🍒', '💎', '🍒']);
  const [spinning, setSpinning] = useState(false);
  const [outcome, setOutcome] = useState('');

  const handleSpin = () => {
    if (spinning) return;
    if (creditBalance < betCoins) {
      triggerToast('error', '베팅할 아케이드 크레딧 잔액이 부족합니다.');
      return;
    }
    onUpdateCredit(prev => prev - betCoins);
    setSpinning(true);
    setOutcome('');

    let spinsCount = 0;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      spinsCount += 1;
      if (spinsCount >= 10) {
        clearInterval(interval);
        
        // Final outcomes
        const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
        setReels(finalReels);
        setSpinning(false);

        // Matching calculations
        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          // Three match jackpot!
          const winMultiplier = finalReels[0] === '7️⃣' ? 12 : finalReels[0] === '💎' ? 8 : 4;
          const winnings = betCoins * winMultiplier;
          onUpdateCredit(prev => prev + winnings);
          setOutcome(`🎉 대성공 럭키 트리오! ${winnings} 크레딧 획득!`);
          triggerToast('success', `잭팟 당첨! 베팅액의 ${winMultiplier}배수 배분이 정산되었습니다.`);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
          // Two match
          const winnings = Math.floor(betCoins * 1.5);
          onUpdateCredit(prev => prev + winnings);
          setOutcome(`✨ 듀얼 페어 매칭 성공! ${winnings} 크레딧 환수!`);
        } else {
          setOutcome('💥 매칭 실패. 회전 슬롯이 엇갈렸습니다.');
        }
      }
    }, 120);
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center py-6 h-full">
      {/* Rolling visual wheels */}
      <div className="bg-slate-900 border-4 border-amber-500/30 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
        {reels.map((item, i) => (
          <div 
            key={i} 
            className={`w-18 h-18 text-3xl font-bold bg-slate-950 border-2 border-slate-800 rounded-xl flex items-center justify-center ${
              spinning ? 'animate-pulse scale-95 border-amber-500/20' : 'scale-100'
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {outcome && (
        <div className="text-center font-bold text-xs font-sans text-amber-400 mt-2">
          {outcome}
        </div>
      )}

      {/* Betting controllers */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-900 w-full max-w-sm">
        <div className="flex items-center gap-2 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-850">
          <span className="text-4xs text-slate-500 uppercase tracking-wider block font-semibold pl-1">베팅 강도</span>
          <div className="flex gap-1">
            {[10, 30, 50].map((v) => (
              <button
                key={v}
                disabled={spinning}
                onClick={() => setBetCoins(v)}
                className={`px-2 py-1 font-mono text-3xs font-extrabold rounded cursor-pointer ${
                  betCoins === v ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-spin-slots"
          onClick={handleSpin}
          disabled={spinning}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          {spinning ? (
            <>
              <RefreshCw className="animate-spin" size={13} />
              회전 롤링 캐스팅...
            </>
          ) : (
            <>
              <Sparkles size={13} className="fill-slate-950" />
              스핀 슬롯 레버 당기기
            </>
          )}
        </button>
      </div>
    </div>
  );
};


/* ------------------ (4) BLACKJACK IMPLEMENTATION ------------------ */
interface BJCard {
  suit: string;
  val: string;
  score: number;
}

const BlackjackGame: React.FC<SubGameProps> = ({ creditBalance, onUpdateCredit, triggerToast }) => {
  const [betCoins, setBetCoins] = useState(20);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYER_TURN' | 'ENDED'>('IDLE');
  
  const [playerHand, setPlayerHand] = useState<BJCard[]>([]);
  const [dealerHand, setDealerHand] = useState<BJCard[]>([]);
  const [dealOutcome, setDealOutcome] = useState('');

  // Generate card decks
  const drawCard = (): BJCard => {
    const suits = ['♠', '♥', '♦', '♣'];
    const vals = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const val = vals[Math.floor(Math.random() * vals.length)];
    
    let score = parseInt(val);
    if (['J','Q','K'].includes(val)) score = 10;
    if (val === 'A') score = 11;

    return { suit, val, score };
  };

  const getHandScore = (hand: BJCard[]) => {
    let sum = hand.reduce((acc, c) => acc + c.score, 0);
    let aceCount = hand.filter(c => c.val === 'A').length;
    while (sum > 21 && aceCount > 0) {
      sum -= 10;
      aceCount -= 1;
    }
    return sum;
  };

  const handleStartHand = () => {
    if (creditBalance < betCoins) {
      triggerToast('error', '베팅에 참여할 아케이드 자금이 모자랍니다.');
      return;
    }
    onUpdateCredit(prev => prev - betCoins);

    const p1 = drawCard();
    const p2 = drawCard();
    const d1 = drawCard();
    const d2 = drawCard();

    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setGameState('PLAYER_TURN');
    setDealOutcome('');
  };

  const handleHit = () => {
    if (gameState !== 'PLAYER_TURN') return;
    const nextCard = drawCard();
    const nextHand = [...playerHand, nextCard];
    setPlayerHand(nextHand);

    if (getHandScore(nextHand) > 21) {
      // Busted instantly
      setGameState('ENDED');
      setDealOutcome('💥 플레이어 버스트(21 초과)! 패배 처리되었습니다.');
    }
  };

  const handleStand = () => {
    if (gameState !== 'PLAYER_TURN') return;
    
    // Dealer hit rule - Dealer hits until 17 or higher
    let currentDealerHand = [...dealerHand];
    while (getHandScore(currentDealerHand) < 17) {
      currentDealerHand.push(drawCard());
    }
    setDealerHand(currentDealerHand);

    const playerScore = getHandScore(playerHand);
    const dealerScore = getHandScore(currentDealerHand);

    setGameState('ENDED');

    if (dealerScore > 21) {
      const payout = betCoins * 2;
      onUpdateCredit(prev => prev + payout);
      setDealOutcome(`🎉 딜러 버스트! 플레이어 승리! (${payout} 크레딧 배분)`);
    } else if (playerScore > dealerScore) {
      const payout = betCoins * 2;
      onUpdateCredit(prev => prev + payout);
      setDealOutcome(`🎉 플레이어 득점 우디! 승리! (${payout} 크레딧 배분)`);
    } else if (playerScore < dealerScore) {
      setDealOutcome('💥 딜러 득점 우세. 패배하였습니다.');
    } else {
      onUpdateCredit(prev => prev + betCoins); // push back bet
      setDealOutcome('🤝 무승부(Push). 배팅액이 반환되었습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-5 items-stretch h-full py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dealer Deck section */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xs text-red-400 font-bold uppercase font-mono tracking-widest">딜러의 마운트 덱 (Dealer)</span>
            {gameState !== 'IDLE' && (
              <span className="text-2xs font-mono font-bold text-slate-400">
                SCORE: {gameState === 'PLAYER_TURN' ? '?' : getHandScore(dealerHand)}
              </span>
            )}
          </div>
          
          <div className="flex gap-2 min-h-[70px] items-center">
            {dealerHand.map((card, idx) => (
              <div 
                key={idx} 
                className={`w-12 h-16 rounded-lg bg-white border border-slate-300 text-slate-950 font-bold flex flex-col justify-between p-1.5 shadow-md ${
                  gameState === 'PLAYER_TURN' && idx === 1 ? 'opacity-40 bg-slate-400 filter blur-[1px]' : ''
                }`}
              >
                {gameState === 'PLAYER_TURN' && idx === 1 ? (
                  <div className="text-slate-650 text-2xs m-auto">?</div>
                ) : (
                  <>
                    <div className="text-2xs leading-none">{card.val}</div>
                    <div className="text-lg text-center leading-none">{card.suit}</div>
                  </>
                )}
              </div>
            ))}
            {dealerHand.length === 0 && (
              <span className="text-4xs text-slate-500 font-mono">대기 레이턴시 셔플 중...</span>
            )}
          </div>
        </div>

        {/* Player Deck section */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xs text-blue-400 font-bold uppercase font-mono tracking-widest">나의 플레이어 카드 (You)</span>
            {playerHand.length > 0 && (
              <span className="text-2xs font-mono font-bold text-slate-400">
                SCORE: {getHandScore(playerHand)}
              </span>
            )}
          </div>

          <div className="flex gap-2 min-h-[70px] items-center">
            {playerHand.map((card, idx) => (
              <div 
                key={idx} 
                className="w-12 h-16 rounded-lg bg-white border border-slate-300 text-slate-950 font-bold flex flex-col justify-between p-1.5 shadow-md"
              >
                <div className="text-2xs leading-none">{card.val}</div>
                <div className="text-lg text-center leading-none">{card.suit}</div>
              </div>
            ))}
            {playerHand.length === 0 && (
              <span className="text-4xs text-slate-500 font-mono">가상 패 보충 대기 중</span>
            )}
          </div>
        </div>
      </div>

      {dealOutcome && (
        <div className="text-center font-bold text-amber-400 text-xs py-1 select-none">
          {dealOutcome}
        </div>
      )}

      {/* Controller actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-900 mt-auto">
        {gameState === 'IDLE' || gameState === 'ENDED' ? (
          <>
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">
              <span className="text-4xs text-slate-650 font-bold">베팅액:</span>
              <select 
                value={betCoins} 
                onChange={(e) => setBetCoins(parseInt(e.target.value))}
                className="bg-slate-900 text-slate-300 text-3xs border-none focus:outline-none focus:ring-0 px-1 py-0.5"
              >
                <option value={20}>20 CRD</option>
                <option value={50}>50 CRD</option>
                <option value={100}>100 CRD</option>
              </select>
            </div>
            
            <button
              onClick={handleStartHand}
              className="px-5 py-2 bg-purple-650 hover:bg-purple-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              카드 배분 받기 (Deal 딜링 수행)
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleHit}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              카드 받기 (Hit)
            </button>
            <button
              onClick={handleStand}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
            >
              차례 멈춤 (Stand)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


/* ------------------ (5) ROULETTE IMPLEMENTATION ------------------ */
const RouletteGame: React.FC<SubGameProps> = ({ creditBalance, onUpdateCredit, triggerToast }) => {
  const [betAmount, setBetAmount] = useState(25);
  const [betType, setBetType] = useState<'RED' | 'BLACK' | 'EVEN' | 'ODD'>('RED');
  const [spinning, setSpinning] = useState(false);
  const [wheelNumber, setWheelNumber] = useState<number | null>(null);
  const [wheelColor, setWheelColor] = useState<string>('');
  const [resultMsg, setResultMsg] = useState('');

  // 0 is green, others are alternating red/black
  const getNumberColor = (num: number) => {
    if (num === 0) return 'GREEN';
    const RED_NUMBS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return RED_NUMBS.includes(num) ? 'RED' : 'BLACK';
  };

  const handleRollRoulette = () => {
    if (spinning) return;
    if (creditBalance < betAmount) {
      triggerToast('error', '룰렛 베팅에 참가할 아케이드 자금이 모자랍니다.');
      return;
    }
    onUpdateCredit(prev => prev - betAmount);
    setSpinning(true);
    setResultMsg('');

    let ticks = 0;
    const interval = setInterval(() => {
      const randNum = Math.floor(Math.random() * 37);
      setWheelNumber(randNum);
      setWheelColor(getNumberColor(randNum));
      ticks += 1;
      
      if (ticks >= 15) {
        clearInterval(interval);
        
        // Final roll target value
        const finalNum = Math.floor(Math.random() * 37);
        const finalCol = getNumberColor(finalNum);
        
        setWheelNumber(finalNum);
        setWheelColor(finalCol);
        setSpinning(false);

        // Verification of winning state
        let won = false;
        if (betType === 'RED' && finalCol === 'RED') won = true;
        if (betType === 'BLACK' && finalCol === 'BLACK') won = true;
        
        if (finalNum !== 0) {
          if (betType === 'EVEN' && finalNum % 2 === 0) won = true;
          if (betType === 'ODD' && finalNum % 2 !== 0) won = true;
        }

        if (won) {
          const award = betAmount * 2;
          onUpdateCredit(prev => prev + award);
          setResultMsg(`🎉 승리! 배수 정산으로 ${award} 크레딧을 추가 정산 수납하였습니다!`);
          triggerToast('success', `룰렛 당첨 충족 완료 (배당금 ${award} 크레딧 지급)`);
        } else {
          setResultMsg(`💥 패배. 룰렛이 ${finalNum}(${finalCol === 'RED' ? '빨간색' : finalCol === 'BLACK' ? '검은색' : '초록색'})에 안착하였습니다.`);
        }
      }
    }, 100);
  };

  return (
    <div className="flex flex-col gap-5 items-center justify-center py-4 h-full">
      {/* Visual roulette dashboard center */}
      <div className="relative flex flex-col items-center justify-center">
        <div className={`w-28 h-28 rounded-full border-4 border-slate-800 bg-[#020617] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden transition-all text-center ${
          spinning ? 'animate-spin border-amber-500/30' : ''
        }`}>
          {wheelNumber !== null ? (
            <div className="space-y-1 z-10">
              <span className="text-3xl font-black font-mono text-white block">{wheelNumber}</span>
              <span className={`text-4xs px-2 py-0.5 rounded font-bold ${
                wheelColor === 'RED' ? 'bg-red-505/20 text-red-400' :
                wheelColor === 'BLACK' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-550/20 text-emerald-400'
              }`}>
                {wheelColor === 'RED' ? '빨간색 (Red)' : wheelColor === 'BLACK' ? '검은색 (Black)' : '영점 (Zero)'}
              </span>
            </div>
          ) : (
            <div className="text-slate-600 text-3xs font-mono">
              대기 중
            </div>
          )}
        </div>
      </div>

      {resultMsg && (
        <div className="text-center font-bold text-xs text-amber-400 py-1 select-none">
          {resultMsg}
        </div>
      )}

      {/* Betting controllers */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-900 w-full max-w-md mt-auto">
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded border border-slate-850">
          <span className="text-4xs text-slate-500 font-bold">베팅 유형 선택:</span>
          <div className="flex gap-1">
            {(['RED', 'BLACK', 'EVEN', 'ODD'] as const).map((t) => (
              <button
                key={t}
                disabled={spinning}
                onClick={() => setBetType(t)}
                className={`px-1.5 py-0.5 font-sans tracking-tight text-4xs font-bold rounded cursor-pointer ${
                  betType === t 
                    ? 'bg-purple-650 text-white' 
                    : 'bg-slate-900 text-slate-400 hover:text-slate-300'
                }`}
              >
                {t === 'RED' ? '🔴 RED' : t === 'BLACK' ? '⚫ BLACK' : t === 'EVEN' ? '짝수(EVEN)' : '홀수(ODD)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded border border-slate-850">
          <span className="text-4xs text-slate-500 font-bold">참여금액:</span>
          <select
            value={betAmount}
            onChange={(e) => setBetAmount(parseInt(e.target.value))}
            className="bg-slate-900 text-slate-300 text-4xs border-none focus:outline-none focus:ring-0 px-1 py-0.5"
          >
            <option value={10}>10 CRD</option>
            <option value={25}>25 CRD</option>
            <option value={50}>50 CRD</option>
            <option value={100}>100 CRD</option>
          </select>
        </div>

        <button
          onClick={handleRollRoulette}
          disabled={spinning}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl cursor-pointer disabled:opacity-50"
        >
          {spinning ? '룰렛 스핀 캐스팅 회전 중...' : '룰렛 휠 돌리기 (Spin)'}
        </button>
      </div>
    </div>
  );
};
