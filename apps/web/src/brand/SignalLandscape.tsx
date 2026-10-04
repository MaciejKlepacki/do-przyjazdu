export function SignalLandscape({ paused = false }: { paused?: boolean }) {
  return <svg className={`signal-landscape${paused ? ' signal-paused' : ''}`} viewBox="0 0 1200 460" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g className="landscape-contours">{Array.from({ length: 34 }, (_, i) => <path key={i} d={`M-100 ${95 + i * 13} C${180 + i * 3} ${-200 + i * 14}, ${245 + i * 4} ${480 + i * 10}, ${575 + i * 3} ${170 + i * 9} S${920 + i * 5} ${40 + i * 12}, 1340 ${200 + i * 14}`} />)}</g>
    <path className="landscape-route-bed" d="M-50 292H365C465 292 415 172 540 172H655C770 172 745 292 850 292H1250" />
    <path className="landscape-route" d="M-50 292H365C465 292 415 172 540 172H655C770 172 745 292 850 292H1250" pathLength="1" />
    <path className="landscape-packet" d="M-50 292H365C465 292 415 172 540 172H655C770 172 745 292 850 292H1250" pathLength="1" />
    <g className="landscape-waypoints"><circle cx="180" cy="292" r="7" /><circle cx="600" cy="172" r="7" /><circle cx="1020" cy="292" r="7" /></g>
  </svg>;
}
