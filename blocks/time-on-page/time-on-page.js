const pad = (n) => String(n).padStart(2, '0');

function split(ms) {
  const total = Math.floor(ms / 1000);
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

function format(ms) {
  const { h, m, s } = split(ms);
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function toDuration(ms) {
  const { h, m, s } = split(ms);
  return `PT${h}H${m}M${s}S`;
}

export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  const hasLabel = cell && cell.textContent.trim();

  const label = document.createElement('div');
  label.className = 'time-on-page-label';
  if (hasLabel) label.append(...cell.childNodes);

  const time = document.createElement('time');
  time.className = 'time-on-page-value';
  time.setAttribute('role', 'timer');

  block.replaceChildren(...(hasLabel ? [label, time] : [time]));

  let accumulated = 0;
  let visibleSince = document.hidden ? null : 0;
  let interval;

  const elapsed = () => accumulated
    + (visibleSince === null ? 0 : performance.now() - visibleSince);

  const render = () => {
    const ms = elapsed();
    time.textContent = format(ms);
    time.dateTime = toDuration(ms);
  };

  const stop = () => {
    clearInterval(interval);
    interval = null;
  };

  const tick = () => {
    if (!block.isConnected) {
      stop();
      return;
    }
    render();
  };

  const start = () => {
    if (interval) return;
    render();
    interval = setInterval(tick, 1000);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (visibleSince !== null) accumulated += performance.now() - visibleSince;
      visibleSince = null;
      render();
      stop();
    } else {
      visibleSince = performance.now();
      start();
    }
  });

  if (document.hidden) render();
  else start();
}
