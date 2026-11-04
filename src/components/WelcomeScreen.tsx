import { useEffect, useState, type ReactNode } from 'react';
import './welcome-screen.css';

/** Runs once per page opening; the application starts loading underneath. */
export function WelcomeScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setLeaving(true), reduced ? 600 : 2600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setVisible(false), 280);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  return <>
    <div inert={visible} aria-hidden={visible || undefined}>{children}</div>
    {visible && <section className={`ciapi-welcome${leaving ? ' ciapi-welcome--leaving' : ''}`} aria-label="Boas-vindas ao CIAPI">
      <div className="ciapi-welcome__content">
        <div className="ciapi-welcome__art" aria-hidden="true">
          <span className="ciapi-welcome__halo" />
          <WelcomeCouple />
          <span className="ciapi-welcome__heart">♥</span>
        </div>
        <p className="ciapi-welcome__brand">CIAPI</p>
        <h1>Que bom ter você aqui!</h1>
        <p className="ciapi-welcome__subtitle">Cuidar de pessoas é o que nos une.</p>
        <span className="ciapi-welcome__line" aria-hidden="true" />
      </div>
      <button type="button" className="ciapi-welcome__skip" onClick={() => setLeaving(true)}>Entrar no aplicativo <span aria-hidden="true">→</span></button>
    </section>}
  </>;
}

/** Soft, layered illustration with small articulated hands and expressive faces. */
function WelcomeCouple() {
  return <svg className="ciapi-welcome__couple" viewBox="0 0 360 380" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="welcome-backdrop" cx=".45" cy=".3" r=".8">
        <stop stopColor="#F5F3E8" /><stop offset="1" stopColor="#D4E7E2" />
      </radialGradient>
      <linearGradient id="welcome-skin" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FFE3BF" /><stop offset="1" stopColor="#EDB58D" />
      </linearGradient>
      <linearGradient id="welcome-blue" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#5498C3" /><stop offset="1" stopColor="#2D638E" />
      </linearGradient>
      <linearGradient id="welcome-lilac" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#C4A5D9" /><stop offset="1" stopColor="#9471B0" />
      </linearGradient>
      <linearGradient id="welcome-chair" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#8CBBA0" /><stop offset="1" stopColor="#548C77" />
      </linearGradient>
      <linearGradient id="welcome-hair" x1="0" y1="0" x2=".7" y2="1">
        <stop stopColor="#FFFFFF" /><stop offset="1" stopColor="#B5C3CA" />
      </linearGradient>
    </defs>
    {/* A quiet oval gives the characters a soft illustrated backdrop. */}
    <ellipse cx="180" cy="187" rx="153" ry="162" fill="url(#welcome-backdrop)" />
    <circle cx="291" cy="78" r="7" fill="#FFFFFF" opacity=".65" />
    <circle cx="65" cy="246" r="4" fill="#FFFFFF" opacity=".7" />
    <path d="M63 177Q48 161 52 146Q67 150 67 167M291 268Q311 256 309 240Q293 245 291 261" stroke="#B2CFC0" strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="181" cy="344" rx="112" ry="9" fill="#254F46" opacity=".15" />
    <g stroke="#475864" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Upholstered chair, curved cushions, and tapered wooden feet. */}
      <path d="M167 216L164 192Q163 175 181 175H258Q276 175 277 196L280 263L267 307H168Z" fill="url(#welcome-chair)" />
      <path d="M180 189Q213 182 260 191M176 198L180 245M266 200L265 239" stroke="#C1DFCB" opacity=".55" />
      <path d="M177 301L173 334M263 301L268 334" stroke="#A57D5E" strokeWidth="7" />
      <path d="M174 263Q151 252 151 269L157 296Q160 310 176 309H263Q280 308 282 291L289 265Q291 250 276 250Q262 251 261 273H181Z" fill="#83AE94" />
      <path d="M177 281Q214 276 258 283L258 298H178Z" fill="#699B82" stroke="none" />
      <path d="M157 269Q168 263 175 274M270 261Q279 253 286 259" stroke="#B9D5BE" />
      {/* Grandfather: relaxed posture, textured knit vest, and rounded shoes. */}
      <path d="M91 224L96 328H115L125 254L130 329H149L149 224Z" fill="#37526F" />
      <path d="M121 239L125 254M103 245L106 317M138 245L140 317" stroke="#607791" strokeWidth="1.8" />
      <path d="M96 323Q87 331 86 337Q87 345 115 340L117 325Z" fill="#4A515A" />
      <path d="M131 324L130 338Q142 346 160 340Q163 334 149 327Z" fill="#4A515A" />
      <path d="M91 336L111 335M137 336L153 337" stroke="#8E969E" strokeWidth="1.7" />
      <path d="M107 131Q87 135 85 158L89 226Q119 237 153 227L155 161Q153 137 136 131Z" fill="url(#welcome-blue)" />
      <path d="M106 129L119 150L132 131" fill="#F5F4EA" />
      <path d="M106 135L114 158L121 149L130 158L138 136" fill="#DBECF1" />
      <path d="M118 156L120 213M96 221Q122 228 146 222" stroke="#A2C9DD" strokeWidth="1.6" opacity=".65" />
      <path d="M134 181H146V195Q140 200 134 194Z" fill="#3A78A3" stroke="#96BFD3" strokeWidth="1.5" />
      <path d="M147 148Q160 145 163 168L168 194L192 201L188 214Q160 213 153 203L143 171" fill="#D6E9F0" />
      <path d="M187 201Q199 199 205 207Q208 214 201 217L188 213" fill="url(#welcome-skin)" />
      {/* His free arm waves on the outside, clear of both faces. */}
      <g className="ciapi-welcome__wave ciapi-welcome__wave--man">
        <path d="M98 143Q87 137 81 150L69 165Q65 167 62 159L53 132L40 137L49 172Q54 187 66 184Q82 183 103 159" fill="#D6E9F0" />
        <path d="M39 137L35 124L30 117Q27 112 31 111L38 117L35 99Q34 95 38 95L42 111L42 91Q43 87 46 90L48 110L51 94Q53 91 55 95L54 114L58 105Q61 102 63 106L57 125Q54 136 51 139Z" fill="url(#welcome-skin)" />
        <path d="M40 121Q48 116 51 122M42 132L51 130" stroke="#D39878" strokeWidth="1.3" />
        <path d="M39 138L53 133" stroke="#A2C5D5" strokeWidth="4" />
      </g>
      {/* Warm face, silver hair, clear eyes behind round glasses. */}
      <path d="M106 115L107 134Q118 145 133 132L134 114" fill="url(#welcome-skin)" />
      <path d="M91 83Q87 52 114 45Q145 38 153 66L149 102L96 102Z" fill="url(#welcome-hair)" />
      <ellipse cx="95" cy="99" rx="6" ry="9" fill="url(#welcome-skin)" />
      <ellipse cx="147" cy="98" rx="6" ry="9" fill="url(#welcome-skin)" />
      <path d="M98 76Q115 65 140 76L146 88L144 109Q140 128 123 131Q103 130 98 113L95 90Z" fill="url(#welcome-skin)" />
      <path d="M95 83Q98 64 116 64Q137 69 147 78L147 68Q140 49 121 51Q99 50 94 69Z" fill="url(#welcome-hair)" stroke="none" />
      <path d="M102 60Q113 51 128 55" stroke="white" strokeWidth="3" />
      <path d="M99 87Q106 82 114 86M129 85Q136 81 141 86" stroke="#87918F" strokeWidth="2" />
      <rect x="97" y="89" width="20" height="15" rx="6" fill="#EEF8F8" fillOpacity=".25" stroke="#536775" />
      <rect x="125" y="89" width="20" height="15" rx="6" fill="#EEF8F8" fillOpacity=".25" stroke="#536775" />
      <path d="M117 94Q121 91 125 94M94 92L97 94M145 94L149 91" stroke="#536775" />
      <path d="M105 96Q108 93 111 96M131 96Q134 93 137 96" stroke="#505E66" strokeWidth="1.9" />
      <path d="M120 98L118 108Q121 110 124 108" stroke="#C48E70" strokeWidth="1.4" />
      <ellipse cx="106" cy="110" rx="5" ry="3" fill="#E7A18A" opacity=".55" stroke="none" />
      <ellipse cx="136" cy="109" rx="5" ry="3" fill="#E7A18A" opacity=".55" stroke="none" />
      <path d="M112 115Q121 124 132 114Q125 132 112 115Z" fill="#B9776D" stroke="none" />
      <path d="M114 115Q122 120 130 115" stroke="#FFF9EB" strokeWidth="3" />
      {/* Grandmother: softly draped dress, cardigan, pearl earrings. */}
      <path d="M202 287L202 326Q206 333 214 327L222 287M236 287L240 326Q246 332 252 325L250 286" fill="url(#welcome-skin)" />
      <path d="M203 322Q197 325 194 333Q196 343 216 336L217 326L211 328Z" fill="#78617F" />
      <path d="M240 322L241 335Q258 342 266 335Q268 331 252 325L247 328Z" fill="#78617F" />
      <path d="M198 334L211 331M247 334L258 335" stroke="#B29BB7" strokeWidth="1.7" />
      <path d="M183 246Q204 237 226 246Q245 253 253 285Q221 304 192 291Q193 272 183 246Z" fill="#DDBADB" />
      <path d="M206 258Q216 269 215 291M233 264L241 286" stroke="#BE96C5" strokeWidth="1.8" />
      <path d="M189 192Q170 194 168 215L174 261L197 265L196 209L216 206L229 259L249 251L241 216Q236 193 218 191Z" fill="url(#welcome-lilac)" />
      <path d="M194 198Q204 215 217 198L229 255L198 260Z" fill="#F0DAE9" />
      <path d="M191 202L197 260M220 201L230 254" stroke="#E2C9E6" strokeWidth="2" />
      <circle cx="200" cy="228" r="1.6" fill="#AB86B9" stroke="none" />
      <circle cx="202" cy="242" r="1.6" fill="#AB86B9" stroke="none" />
      <path d="M178 210Q166 207 167 223L171 244Q173 257 188 258L214 256L214 243L189 243L188 221" fill="url(#welcome-lilac)" />
      <path d="M214 244Q220 239 227 241L234 247Q236 251 232 254L215 255Z" fill="url(#welcome-skin)" />
      <path d="M219 246L226 245M220 250L229 249" stroke="#D39B83" strokeWidth="1.2" />
      <g className="ciapi-welcome__wave ciapi-welcome__wave--woman">
        <path d="M232 201Q240 197 245 208L257 225Q262 229 265 217L272 192L284 196L277 227Q273 241 261 242Q250 241 237 226L226 214" fill="url(#welcome-lilac)" />
        <path d="M271 195Q267 190 268 182L263 173Q262 169 265 168L272 177L271 157Q272 153 275 156L278 174L280 152Q281 149 284 153L284 174L289 158Q291 155 293 159L290 179L296 171Q300 169 300 173L292 190L284 199Z" fill="url(#welcome-skin)" />
        <path d="M275 184Q282 178 286 184M277 192L284 190" stroke="#D39878" strokeWidth="1.3" />
        <path d="M272 196L284 200" stroke="#D5BBDF" strokeWidth="4" />
      </g>
      <path d="M196 178L195 197Q207 210 220 196L216 176" fill="url(#welcome-skin)" />
      <circle cx="233" cy="130" r="15" fill="#BCC9CE" />
      <path d="M174 150Q160 128 179 110Q200 91 224 106Q240 116 235 145L229 165L178 166Z" fill="url(#welcome-hair)" />
      <ellipse cx="176" cy="157" rx="6" ry="8" fill="url(#welcome-skin)" />
      <ellipse cx="231" cy="156" rx="6" ry="8" fill="url(#welcome-skin)" />
      <path d="M179 144Q194 140 202 125Q214 138 230 143L230 163Q226 184 207 189Q186 187 179 168Z" fill="url(#welcome-skin)" />
      <path d="M176 147Q172 126 187 117Q202 107 221 115" stroke="white" strokeWidth="3" />
      <path d="M186 148Q191 144 196 147M214 147Q219 144 224 148" stroke="#87918F" strokeWidth="1.6" />
      <path d="M187 156Q191 151 196 155M215 155Q219 151 223 156" stroke="#53606A" strokeWidth="2.1" />
      <path d="M205 155L202 165Q205 168 208 165" stroke="#CA937B" strokeWidth="1.4" />
      <ellipse cx="190" cy="166" rx="6" ry="3.5" fill="#E69D93" opacity=".6" stroke="none" />
      <ellipse cx="220" cy="166" rx="6" ry="3.5" fill="#E69D93" opacity=".6" stroke="none" />
      <path d="M196 173Q205 180 215 172Q206 190 196 173Z" fill="#B57675" stroke="none" />
      <path d="M198 173Q205 177 212 173" stroke="#FFF9EB" strokeWidth="3" />
      <circle cx="177" cy="169" r="3.5" fill="#FFF5DC" stroke="#B59879" strokeWidth="1" />
      <circle cx="232" cy="168" r="3.5" fill="#FFF5DC" stroke="#B59879" strokeWidth="1" />
      <path d="M200 204Q209 213 219 203" stroke="#FFF3DF" strokeWidth="3.5" />
    </g>
  </svg>;
}
