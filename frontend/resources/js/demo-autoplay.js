/*
 * DEMO 自動播放與導覽提示（簡版）
 */
export function runDemoGuide(steps) {
  let idx = 0;
  const next = () => {
    if (idx >= steps.length) return;
    const s = steps[idx++];
    if (s.highlight) {
      const el = document.querySelector(s.highlight);
      if (el) el.classList.add('ring-2','ring-amber-400');
      setTimeout(() => { if (el) el.classList.remove('ring-2','ring-amber-400'); }, s.duration || 1200);
    }
    if (typeof s.action === 'function') s.action();
    setTimeout(next, (s.duration || 1200) + (s.delay || 300));
  };
  next();
}

export function scrollToSelector(sel){
  const el = document.querySelector(sel);
  if (el) el.scrollIntoView({behavior:'smooth',block:'center'});
}


