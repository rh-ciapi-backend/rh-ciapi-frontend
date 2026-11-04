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

/** Vector illustration inspired by the CIAPI icon, with independent waving arms. */
function WelcomeCouple() {
  return <svg className="ciapi-welcome__couple" viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#142439" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="164" cy="319" rx="117" ry="9" fill="#152637" stroke="none" />
      {/* Armchair */}
      <path d="M168 175Q165 153 188 153H256Q279 153 278 181L267 276H165Z" fill="#6AA85E" />
      <path d="M158 218Q139 208 143 235L153 282H263L281 235Q290 209 273 209Q258 210 255 237H170Q170 218 158 218Z" fill="#80BB6B" />
      <path d="M158 279L153 312M261 279L268 312" stroke="#BB8752" strokeWidth="7" />
      {/* Grandfather */}
      <path d="M74 201L78 306H99L108 224L115 306H136L134 200Z" fill="#183F70" />
      <path d="M78 304L68 316Q69 326 101 319L100 304ZM115 304L116 319Q146 325 145 315L134 304Z" fill="#343A43" />
      <path d="M74 116Q57 133 64 201Q96 215 139 201L137 132L116 112Z" fill="#1478C4" />
      <path d="M85 114L99 139L108 124L119 136L122 113" fill="#D9F0FA" />
      <path d="M77 128Q62 128 68 156Q75 179 120 184L126 170L91 153L88 138" fill="#B9E2F5" />
      <path d="M119 170Q131 163 140 170L148 177Q149 186 140 187L121 183Z" fill="#FFCD86" />
      <path d="M85 61Q83 35 108 34Q140 31 146 59L139 87L87 84Z" fill="#DCE2E7" />
      <path d="M86 75Q75 67 76 81Q77 91 87 91M139 78Q151 74 147 88L139 94" fill="#FFCD86" />
      <path d="M88 56Q103 43 126 57L141 67L137 96Q130 118 111 119Q88 116 84 94Z" fill="#FFCD86" />
      <path d="M84 73L105 77L101 91L82 85ZM114 80L137 86L132 100L111 93ZM104 82L113 85" fill="#D5EAF0" />
      <path d="M105 103Q113 110 122 105" strokeWidth="2.5" />
      {/* His raised arm rotates at the shoulder. */}
      <g className="ciapi-welcome__wave ciapi-welcome__wave--man">
        <path d="M133 132Q142 145 155 134L171 107L159 98L141 117Q128 113 128 126Z" fill="#B9E2F5" />
        <path d="M158 101L150 89Q147 82 152 80L161 89L156 69Q155 62 160 63L167 82L166 59Q167 53 172 57L176 81L180 63Q183 58 186 63L184 86L191 77Q197 74 197 80L186 101Q176 113 167 109Z" fill="#FFCD86" />
      </g>
      {/* Grandmother */}
      <path d="M198 272L196 306L208 309L220 270M229 272L236 306L249 305L248 267" fill="#FFCD86" />
      <path d="M196 302L188 313Q190 324 210 315L211 306ZM236 303L237 315Q260 323 263 314L248 303Z" fill="#81509C" />
      <path d="M173 220L207 213Q235 213 245 236L252 271Q220 287 186 271L184 250Z" fill="#E6A4E9" />
      <path d="M177 160Q153 166 155 197L171 241L196 234L190 177L210 168Q228 178 234 217L216 228L197 223" fill="#BD6DCE" />
      <path d="M185 167L202 233L214 229L201 167" fill="#F3B9F4" />
      <path d="M214 222Q200 216 198 229Q197 238 207 236L222 230" fill="#FFCD86" />
      <path d="M164 131Q149 108 171 91Q198 74 218 101L220 135Z" fill="#DCE2E7" />
      <path d="M165 126Q154 120 155 132Q156 142 166 143M214 126Q226 120 224 133L215 142" fill="#FFCD86" />
      <path d="M164 121Q178 114 189 100Q198 113 216 120L214 144Q207 163 190 164Q172 162 164 143Z" fill="#FFCD86" />
      <path d="M176 132L180 133M201 132L205 131M184 146Q191 153 199 145" strokeWidth="2.5" />
      <g className="ciapi-welcome__wave ciapi-welcome__wave--woman">
        <path d="M166 176Q157 171 151 184L141 201Q135 205 133 196L127 176L114 181L120 209Q129 226 144 217L169 190Q175 181 166 176Z" fill="#BD6DCE" />
        <path d="M114 183L105 170L100 152Q100 146 105 148L112 162L110 139Q110 132 115 135L120 157L123 137Q125 132 128 137L128 160L134 149Q140 146 139 152L133 175Q129 188 121 187Z" fill="#FFCD86" />
      </g>
    </g>
  </svg>;
}
