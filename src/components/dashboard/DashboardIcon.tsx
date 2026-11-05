import { useId } from 'react';

export type DashboardIconName = 'people' | 'active' | 'attendance' | 'holiday' | 'medical' | 'reports' | 'birthday' | 'agenda' | 'sunrise' | 'search-person' | 'inactive-person' | 'new-person' | 'personnel' | 'document' | 'settings' | 'shield' | 'heart';

const palettes: Record<DashboardIconName, [string, string, string]> = {
  'search-person': ['#8ad9ff','#3297e4','#196eb5'], 'inactive-person': ['#d6bded','#a387c3','#7c619b'],
  'new-person': ['#88ebc8','#2fb68d','#15896a'], personnel: ['#a9c6ff','#5e91e4','#3b65b1'],
  document:['#d4bcff','#9a76da','#7152af'], settings:['#bfb7f4','#8673ce','#62539e'], shield:['#95d9c7','#43a38e','#2b796a'], heart:['#8ae2c9','#36b696','#198d76'],
  people: ['#6bd6ff', '#1689dc', '#1065ab'], active: ['#70e9a6', '#16ad68', '#087f4c'],
  attendance: ['#c9a2ff', '#9357df', '#6936b3'], holiday: ['#ffd777', '#ff9a28', '#db7616'],
  medical: ['#75e7cf', '#23bba2', '#0b8e80'], reports: ['#79d5ff', '#298fe5', '#1769bc'],
  birthday: ['#ffc0d0', '#f4789a', '#cb4b74'], agenda: ['#caa4ff', '#9e62e4', '#7640b9'],
  sunrise: ['#ffe384', '#ffbe30', '#f29c1d'],
};

/** Bespoke vector icons: gradients, highlights and a small shadow stay crisp at every size. */
export default function DashboardIcon({ name, size = 58 }: { name: DashboardIconName; size?: number }) {
  const id = useId().replace(/:/g, '');
  const [light, mid, dark] = palettes[name];
  const fill = `url(#${id}-body)`;
  const edge = { stroke: dark, strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  let drawing;
  switch (name) {
    case 'people': case 'search-person': drawing = <>
      <rect x="9" y="17" width="46" height="39" rx="9" fill={fill} {...edge}/><rect x="14" y="22" width="36" height="28" rx="5" fill="#e5f7ff"/>
      <rect x="26" y="7" width="12" height="19" rx="6" fill={fill} {...edge}/><circle cx="32" cy="14" r="2" fill="#effaff"/>
      <circle cx="26" cy="33" r="5" fill={fill}/><path d="M17 46Q17 38 26 38Q35 38 35 46Z" fill={fill}/>
      <path d="M39 31H45M39 36H45M39 42H43" stroke="#72b9de" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M13 29V25Q13 21 17 21M14 52H43" stroke="#fff" strokeWidth="1.6" opacity=".55" fill="none"/>
      {name === 'search-person' && <g><circle cx="44" cy="42" r="10" fill="#eff9ff" stroke="#247ab6" strokeWidth="3"/><path d="M51 50L59 58" stroke="#247ab6" strokeWidth="5" strokeLinecap="round"/><path d="M39 40Q41 36 45 37" stroke="#9fdcff" strokeWidth="2" strokeLinecap="round"/></g>}
    </>; break;
    case 'active': case 'new-person': case 'inactive-person': drawing = <>
      <circle cx="28" cy="19" r="12" fill={fill} {...edge}/><path d="M9 48Q9 32 28 32Q46 32 47 48V54H9Z" fill={fill} {...edge}/>
      <path d="M14 45Q15 37 22 36M21 11Q25 8 29 9" stroke="#fff" strokeWidth="2" opacity=".5" strokeLinecap="round" fill="none"/>
      <circle cx="46" cy="46" r="14" fill="#ebfff4" stroke="#fff" strokeWidth="2"/><circle cx="46" cy="46" r="11" fill={fill} {...edge}/>
      {name === 'new-person' ? <path d="M46 40V52M40 46H52" stroke="white" strokeWidth="3.2" strokeLinecap="round"/> : name === 'inactive-person' ? <path d="M43 41V51M49 41V51" stroke="white" strokeWidth="3.2" strokeLinecap="round"/> : <path d="M40 46L44 50L52 41" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>}
    </>; break;
    case 'attendance': drawing = <>
      <rect x="10" y="12" width="36" height="45" rx="6" fill={fill} {...edge}/><rect x="15" y="18" width="26" height="33" rx="3" fill="#fbf7ff"/>
      <rect x="20" y="8" width="16" height="10" rx="3" fill={fill} {...edge}/><circle cx="28" cy="10" r="2.5" fill="#f2e8ff"/>
      <path d="M20 28L22 30L26 25M20 40L22 42L26 37" stroke={mid} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M31 28H36M31 39H36" stroke="#c2a7dc" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="46" cy="46" r="14" fill="#fdfaff" stroke={dark} strokeWidth="1.5"/><circle cx="46" cy="46" r="10" fill="#ede0ff"/>
      <path d="M46 39V46L51 49" stroke={dark} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
    </>; break;
    case 'holiday': case 'agenda': drawing = <>
      <rect x="9" y="13" width="46" height="43" rx="8" fill={fill} {...edge}/><path d="M10 29H54V49Q54 55 48 55H16Q10 55 10 49Z" fill={name === 'holiday' ? '#fff5dc' : '#f4eaff'} stroke={dark} strokeWidth="1.2"/>
      <path d="M20 8V21M44 8V21" stroke={dark} strokeWidth="6" strokeLinecap="round"/><path d="M19 8V19M43 8V19" stroke="#fff2d5" strokeWidth="2.3" strokeLinecap="round"/>
      <path d="M13 25V21Q13 17 16 17" stroke="white" strokeWidth="1.8" opacity=".6" fill="none"/>
      {name === 'holiday' ? <><circle cx="32" cy="41" r="6" fill={fill}/><path d="M32 31V29M32 53V51M22 41H20M44 41H42M24 33L23 32M40 33L41 32M24 49L23 50M40 49L41 50" stroke={mid} strokeWidth="2" strokeLinecap="round"/></> : <>{[23,32,41].map(x => [36,46].map(y => <rect key={`${x}-${y}`} x={x-2.5} y={y-2.5} width="5" height="5" rx="1.5" fill={fill}/>))}</>}
    </>; break;
    case 'medical': case 'document': drawing = <>
      <path d="M15 7H39L53 21V51Q53 57 47 57H15Q9 57 9 51V13Q9 7 15 7Z" fill={fill} {...edge}/>
      <path d="M17 12H37L48 23V49Q48 52 44 52H17Q14 52 14 49V15Q14 12 17 12Z" fill="#effff9"/>
      <path d="M38 8V21H51" fill={dark} stroke={dark} strokeWidth="1" strokeLinejoin="round"/>
      {name === 'document' ? <path d="M23 27H39M23 33H35" stroke={mid} strokeWidth="3" strokeLinecap="round"/> : <path d="M31 25V37M25 31H37" stroke={mid} strokeWidth="5" strokeLinecap="round"/>}
      <path d="M23 43H40M23 48H33" stroke="#7fcdbf" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 18V14Q12 10 16 10" stroke="white" strokeWidth="1.5" opacity=".6" fill="none"/>
    </>; break;
    case 'reports': case 'personnel': drawing = <>
      <path d="M7 15L23 8L41 14L57 8V49L41 56L23 50L7 57Z" fill={fill} {...edge}/>
      <path d="M23 8V50L41 56V14Z" fill="#c5ebff" opacity=".7"/>
      <path d="M11 19L19 15M11 24L19 20" stroke="#e6f8ff" strokeWidth="1.5" opacity=".7"/>
      <rect x="25" y="21" width="25" height="30" rx="3" fill="#f5fbff" stroke="#7cb8df"/>
      <path d="M31 43V36M38 43V30M45 43V26" stroke={mid} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M29 47H47" stroke="#9dcbeb" strokeWidth="1.3"/>
    </>; break;
    case 'birthday': drawing = <>
      <ellipse cx="32" cy="56" rx="25" ry="4" fill="#dfacc0" opacity=".6"/>
      <path d="M10 35Q32 25 54 35V50Q32 61 10 50Z" fill={fill} {...edge}/>
      <path d="M11 43Q32 53 53 43" stroke="#fff3e9" strokeWidth="4"/>
      <ellipse cx="32" cy="34" rx="22" ry="9" fill="#ffd4db" stroke="#cf7192" strokeWidth="1.3"/>
      <path d="M11 35Q15 42 18 35Q22 44 26 37Q31 44 35 37Q41 43 44 35Q49 42 53 35" stroke="#fff1ec" strokeWidth="3" strokeLinecap="round"/>
      {[21,32,43].map((x,i) => <g key={x}><path d={`M${x} 23V31`} stroke={i===1?'#a873d0':'#ed7293'} strokeWidth="4"/><path d={`M${x} 21Q${x-5} 17 ${x} 10Q${x+5} 17 ${x} 21Z`} fill="#ffc84a" stroke="#ef9c31" strokeWidth="1"/></g>)}
    </>; break;
    case 'settings': drawing = <><path d="M26 7H38L40 15L47 18L54 16L60 27L54 33L54 40L58 46L49 55L42 52L36 55L32 61L21 57L20 49L14 45L6 45L3 33L10 28L12 21L10 14L20 8L26 12Z" fill={fill} {...edge}/><circle cx="32" cy="33" r="15" fill="#f0ebff" stroke={dark} strokeWidth="2"/><circle cx="32" cy="33" r="7" fill={fill}/><path d="M21 20Q28 14 36 18" stroke="white" opacity=".6" strokeWidth="2" strokeLinecap="round"/></>;break;
    case 'shield': drawing = <><path d="M32 5Q43 13 56 14L53 38Q48 53 32 60Q16 53 11 38L8 14Q22 13 32 5Z" fill={fill} {...edge}/><path d="M32 12Q41 18 49 19L46 37Q43 46 32 52Q21 46 18 37L15 19Q24 18 32 12Z" fill="#e5fff5" opacity=".8"/><path d="M23 32L30 39L43 25" stroke={mid} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></>;break;
    case 'heart': drawing = <><path d="M32 56L10 35Q-2 20 11 10Q23 2 32 14Q42 2 54 10Q67 20 55 35Z" fill={fill} {...edge}/><path d="M9 29H22L27 20L35 42L41 29H56" stroke="#f0fffa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14Q20 10 25 16" stroke="white" opacity=".6" strokeWidth="2" strokeLinecap="round"/></>;break;
    case 'sunrise': drawing = <>
      <path d="M32 7V2M14 13L10 9M50 13L54 9M7 29H2M57 29H62" stroke="#ffc343" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="32" cy="29" r="17" fill={fill}/><path d="M22 16Q27 11 34 13" stroke="#fff4bf" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M3 40Q7 31 13 35Q14 24 23 29Q30 32 27 40ZM43 40Q42 31 49 32Q54 27 58 35Q64 33 64 40Z" fill="#d9edf8" stroke="white" strokeWidth="1.3"/>
      <path d="M0 56Q22 32 48 47L64 57Z" fill="#b3d98b"/><path d="M13 59Q41 37 64 47V59Z" fill="#80bd76"/><path d="M8 59Q30 46 58 43" stroke="#f8fcf2" strokeWidth="2.5"/>
    </>; break;
  }
  return <svg className={`ciapi-custom-icon ciapi-custom-icon--${name}`} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id={`${id}-body`} x1=".15" y1="0" x2=".8" y2="1"><stop stopColor={light}/><stop offset=".52" stopColor={mid}/><stop offset="1" stopColor={dark}/></linearGradient></defs>
    {drawing}
  </svg>;
}
