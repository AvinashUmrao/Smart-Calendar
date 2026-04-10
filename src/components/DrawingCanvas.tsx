'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Trash2, Download, Undo2, Redo2, SlidersHorizontal, X } from 'lucide-react';

const PALETTE = [
  '#1c1917','#ef4444','#f97316','#f59e0b','#84cc16',
  '#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#d946ef','#ec4899',
  '#ffffff',
];

export default function DrawingCanvas() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const contextRef     = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef   = useRef(false);
  const lastPt         = useRef<{ x: number; y: number } | null>(null);

  const [color,        setColor]        = useState('#1c1917');
  const [brushSize,    setBrushSize]    = useState(5);
  const [tool,         setTool]         = useState<'pencil' | 'eraser'>('pencil');
  const [history,      setHistory]      = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showPanel,    setShowPanel]    = useState(false);   // mobile settings panel

  /* ── Init / resize canvas ── */
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Preserve existing content
    let snapshot: string | null = null;
    if (canvas.width > 0) snapshot = canvas.toDataURL();

    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (snapshot) {
      const img = new Image();
      img.src = snapshot;
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
    }
  }, []);

  useEffect(() => {
    initCanvas();
    saveHistory();
    const ro = new ResizeObserver(initCanvas);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Context style sync ── */
  useEffect(() => {
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth   = brushSize;
  }, [color, brushSize, tool]);

  /* ── History ── */
  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.toDataURL();
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(snap);
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [historyIndex]);

  const restoreSnapshot = (idx: number) => {
    const canvas = canvasRef.current;
    const ctx    = contextRef.current;
    if (!canvas || !ctx) return;
    const img = new Image();
    img.src = history[idx];
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };
  };

  const undo = () => { if (historyIndex > 0)                    { const i = historyIndex - 1; restoreSnapshot(i); setHistoryIndex(i); } };
  const redo = () => { if (historyIndex < history.length - 1)   { const i = historyIndex + 1; restoreSnapshot(i); setHistoryIndex(i); } };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = contextRef.current;
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    saveHistory();
  };

  /* ── Drawing helpers ── */
  const getPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e.nativeEvent) {
      const t = (e as React.TouchEvent).touches[0] || (e as React.TouchEvent).changedTouches[0];
      if (!t) return null;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const m = e as React.MouseEvent;
    return { x: m.clientX - rect.left, y: m.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pt = getPoint(e);
    if (!pt) return;
    lastPt.current = pt;
    isDrawingRef.current = true;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(pt.x, pt.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const pt = getPoint(e);
    if (!pt) return;
    const ctx = contextRef.current;
    if (!ctx) return;
    // Smooth line via quadratic curve
    if (lastPt.current) {
      const midX = (lastPt.current.x + pt.x) / 2;
      const midY = (lastPt.current.y + pt.y) / 2;
      ctx.quadraticCurveTo(lastPt.current.x, lastPt.current.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
    }
    lastPt.current = pt;
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPt.current = null;
    contextRef.current?.closePath();
    saveHistory();
  };

  const download = () => {
    const a = document.createElement('a');
    a.download = 'drawing.png';
    a.href = canvasRef.current!.toDataURL();
    a.click();
  };

  const activeCls = 'bg-[var(--theme-selection)] text-[var(--theme-selection-text)] shadow-md';
  const idleCls   = 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-accent-muted)]';

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl shadow-md">

        {/* Tool buttons */}
        <div className="flex items-center gap-1 p-1 bg-[var(--theme-bg)] rounded-xl border border-[var(--theme-border)]">
          <button title="Pencil (P)" onClick={() => setTool('pencil')}
            className={`p-2.5 rounded-lg transition-all ${tool === 'pencil' ? activeCls : idleCls}`}>
            <Pencil size={16} />
          </button>
          <button title="Eraser (E)" onClick={() => setTool('eraser')}
            className={`p-2.5 rounded-lg transition-all ${tool === 'eraser' ? activeCls : idleCls}`}>
            <Eraser size={16} />
          </button>
          <div className="w-px h-5 bg-[var(--theme-border)] mx-1" />
          <button title="Undo (Ctrl+Z)"  onClick={undo} disabled={historyIndex <= 0}
            className={`p-2.5 rounded-lg transition-all disabled:opacity-25 ${idleCls}`}>
            <Undo2 size={16} />
          </button>
          <button title="Redo (Ctrl+Y)"  onClick={redo} disabled={historyIndex >= history.length - 1}
            className={`p-2.5 rounded-lg transition-all disabled:opacity-25 ${idleCls}`}>
            <Redo2 size={16} />
          </button>
        </div>

        {/* Color swatches — hidden on xs, shown sm+ */}
        <div className="hidden sm:flex items-center gap-1 flex-wrap">
          {PALETTE.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool('pencil'); }}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-125 flex-shrink-0 ${
                color === c && tool === 'pencil' ? 'border-[var(--theme-text)] scale-110 shadow-md' : 'border-transparent'
              }`}
              style={{ backgroundColor: c, outline: c === '#ffffff' ? '1px solid var(--theme-border)' : undefined }}
            />
          ))}
          {/* Custom color */}
          <label className="relative w-7 h-7 rounded-full border-2 border-[var(--theme-border)] overflow-hidden cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
            title="Custom color">
            <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool('pencil'); }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }} />
          </label>
        </div>

        {/* Brush size — hidden on xs */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-1 bg-[var(--theme-bg)] rounded-xl border border-[var(--theme-border)] flex-1 min-w-[140px] max-w-[200px]">
          <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest whitespace-nowrap">{brushSize}px</span>
          <input type="range" min="1" max="50" value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="w-full accent-[var(--theme-accent)] cursor-pointer" />
        </div>

        {/* Mobile settings toggle */}
        <button onClick={() => setShowPanel(p => !p)}
          className={`sm:hidden ml-auto p-2.5 rounded-xl transition-all ${showPanel ? activeCls : idleCls}`}>
          {showPanel ? <X size={16} /> : <SlidersHorizontal size={16} />}
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 transition-all">
            <Trash2 size={14} /> <span className="hidden sm:inline">Clear</span>
          </button>
          <button onClick={download}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--theme-selection)] text-[var(--theme-selection-text)] text-[10px] font-bold uppercase tracking-wider shadow hover:opacity-90 active:scale-95 transition-all">
            <Download size={14} /> <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* ── Mobile expanded panel ── */}
      {showPanel && (
        <div className="sm:hidden flex flex-col gap-3 p-4 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest w-full">Color</span>
            {PALETTE.map(c => (
              <button key={c} onClick={() => { setColor(c); setTool('pencil'); setShowPanel(false); }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c && tool === 'pencil' ? 'border-[var(--theme-text)] scale-110 shadow-md' : 'border-transparent'
                }`}
                style={{ backgroundColor: c, outline: c === '#ffffff' ? '1px solid var(--theme-border)' : undefined }}
              />
            ))}
            <label className="relative w-8 h-8 rounded-full border-2 border-[var(--theme-border)] overflow-hidden cursor-pointer hover:scale-110 transition-transform"
              title="Custom color">
              <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool('pencil'); }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }} />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Brush Size</span>
              <span className="text-[10px] font-bold text-[var(--theme-text)]">{brushSize}px</span>
            </div>
            <input type="range" min="1" max="50" value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-full accent-[var(--theme-accent)] cursor-pointer" />
          </div>
          {/* Live brush preview */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Preview</span>
            <div className="flex-1 h-12 bg-[var(--theme-bg)] rounded-xl flex items-center justify-center border border-[var(--theme-border)]">
              <div className="rounded-full" style={{ width: Math.min(brushSize, 40), height: Math.min(brushSize, 40), backgroundColor: tool === 'eraser' ? '#aaa' : color }} />
            </div>
          </div>
        </div>
      )}

      {/* Live brush preview dot — desktop, top-right of canvas */}
      {/* ── Canvas ── */}
      <div ref={containerRef}
        className="flex-1 min-h-[340px] md:min-h-[460px] bg-white rounded-2xl border border-[var(--theme-border)] shadow-inner relative overflow-hidden touch-none"
        style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
      >
        <canvas ref={canvasRef}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          className="absolute inset-0 w-full h-full"
        />
        {/* Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-stone-900/75 backdrop-blur-sm text-white rounded-full text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none select-none hidden md:block">
          Hold & drag to draw
        </div>
        {/* Empty-state prompt */}
        {historyIndex === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-accent-muted)] flex items-center justify-center">
              <Pencil size={22} className="text-[var(--theme-text-muted)]" />
            </div>
            <p className="text-[11px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Start drawing…</p>
          </div>
        )}
      </div>
    </div>
  );
}
