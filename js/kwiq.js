class Component extends DCLogic {
  hexToRgba(hex, a) {
    if (!hex || hex[0] !== '#') return 'rgba(0,108,132,' + a + ')';
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  applyProps() {
    const root = document.querySelector('[data-dash-root]');
    if (!root) return;
    const a = this.props.accent || '#006C84';
    root.style.setProperty('--action', a);
    root.style.setProperty('--action-hover', a);
    root.style.setProperty('--action-hover-fill', this.hexToRgba(a, 0.1));
    const g = root.querySelector('[data-greeting]');
    if (g) g.textContent = 'Welcome Home, ' + (this.props.agentFirstName || 'Nina');
    const name = this.props.agentFirstName || 'Nina';
    const hi = root.querySelector('[data-kwiq-hello]');
    if (hi) hi.textContent = 'Let’s get to work, ' + name;
    const u = root.querySelector('[data-unread]');
    if (u) {
      const n = (this.props.unreadCount === undefined || this.props.unreadCount === null) ? 211 : this.props.unreadCount;
      if (n > 0) { u.textContent = n; u.style.display = ''; }
      else { u.style.display = 'none'; }
    }
  }

  wire() {
    const root = document.querySelector('[data-dash-root]');
    if (!root || this._wired) return;
    this._wired = true;
    const checkSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-11"/></svg>';

    const setSeg = (which) => {
      const my = root.querySelector('[data-seg="my"]');
      const team = root.querySelector('[data-seg="team"]');
      const act = (el) => { el.style.background = '#fff'; el.style.color = 'var(--action)'; el.style.boxShadow = 'inset 0 0 0 1.5px var(--action)'; };
      const ina = (el) => { el.style.background = 'transparent'; el.style.color = 'var(--label-secondary)'; el.style.boxShadow = 'none'; };
      if (which === 'my') { act(my); ina(team); } else { act(team); ina(my); }
    };

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-seg]');
      if (seg) { setSeg(seg.dataset.seg); return; }

      const tc = e.target.closest('[data-task-check]');
      if (tc) {
        const row = tc.closest('[data-task-row]');
        const name = row && row.querySelector('[data-task-name]');
        if (tc.dataset.done === '1') {
          tc.dataset.done = '0';
          tc.style.color = 'var(--label-tertiary)';
          if (name) { name.style.textDecoration = 'none'; name.style.color = 'var(--label-primary)'; }
        } else {
          tc.dataset.done = '1';
          tc.style.color = 'var(--kw-green)';
          if (name) { name.style.textDecoration = 'line-through'; name.style.color = 'var(--label-tertiary)'; }
        }
        return;
      }

      const lc = e.target.closest('[data-lead-check]');
      if (lc) {
        if (lc.dataset.on === '1') {
          lc.dataset.on = '0';
          lc.style.background = '#fff';
          lc.style.borderColor = 'var(--label-tertiary)';
          lc.innerHTML = '';
        } else {
          lc.dataset.on = '1';
          lc.style.background = 'var(--action)';
          lc.style.borderColor = 'var(--action)';
          lc.innerHTML = checkSvg;
        }
        return;
      }

      if (e.target.closest('[data-kwiq-open]')) { this.kwiqOpen(); return; }
      if (e.target.closest('[data-kwiq-expand]')) { this.kwiqPopOut(); return; }
      if (e.target.closest('[data-kwiq-chrome-close]')) { if (this._kwiqExpanded) this.kwiqToggleExpand(); return; }
      if (e.target.closest('[data-kwiq-close]') || e.target.closest('[data-kwiq-overlay]')) { this.kwiqClose(); return; }
      if (e.target.closest('[data-kwiq-newchat]')) { this.kwiqNewChat(); return; }
      if (e.target.closest('[data-kwiq-hist-toggle]')) { this.kwiqHistToggle(); return; }
      if (e.target.closest('[data-kwiq-hist-edit]')) { this.kwiqHistEdit(); return; }
      if (e.target.closest('[data-kwiq-learn]')) { e.preventDefault(); return; }
      const hDel = e.target.closest('[data-kwiq-hist-del]');
      if (hDel) {
        const item = hDel.closest('[data-kwiq-hist-item]');
        if (item === this._kwiqHistActive) this.kwiqNewChat();
        item.remove();
        return;
      }
      const hItem = e.target.closest('[data-kwiq-hist-item]');
      if (hItem) { if (hItem !== this._kwiqHistActive) this.kwiqHistOpen(hItem); return; }
      const la = e.target.closest('[data-lead-action]');
      if (la) {
        const name = la.getAttribute('data-lead-name');
        const act = la.getAttribute('data-lead-action');
        if (act === 'email') {
          if (!this._kwiqOpen) this.kwiqOpen();
          this.kwiqEmailDraft(name);
          return;
        }
        const verb = act === 'call' ? 'Starting a call to' : 'Opening a text to';
        const msgs = root.querySelector('[data-kwiq-messages]');
        const empty = root.querySelector('[data-kwiq-empty]');
        this.kwiqEnterChat();
        msgs.appendChild(this.kwiqMakeKwiq(verb + ' ' + name + '…'));
        msgs.scrollTop = msgs.scrollHeight;
        return;
      }
      const et = e.target.closest('[data-email-tone]');
      if (et) { this.kwiqEmailPick(et); return; }
      const eu = e.target.closest('[data-email-use]');
      if (eu) {
        const m = root.querySelector('[data-kwiq-messages]');
        m.appendChild(this.kwiqMakeKwiq('Done — the email is open in your drafts, ready to review and send.'));
        m.scrollTop = m.scrollHeight;
        return;
      }
      if (e.target.closest('[data-deck-open]')) { this.kwiqDeckOpen(); return; }
      if (e.target.closest('[data-deck-download]')) { const m = root.querySelector('[data-kwiq-messages]'); m.appendChild(this.kwiqMakeKwiq('Your presentation is downloading as a PDF — I also saved a copy to your Designs.')); m.scrollTop = m.scrollHeight; return; }
      if (e.target.closest('[data-deck-prev]')) { this.kwiqDeckGo((this._deckIdx || 0) - 1); return; }
      if (e.target.closest('[data-deck-next]')) { this.kwiqDeckGo((this._deckIdx || 0) + 1); return; }
      if (e.target.closest('[data-deck-close]') || e.target === root.querySelector('[data-deck-overlay]')) { this.kwiqDeckClose(); return; }
      const socOpt = e.target.closest('[data-soc-opt]');
      if (socOpt) { this.kwiqSocialPick(socOpt); return; }
      const socCreate = e.target.closest('[data-soc-create]');
      if (socCreate) { this.kwiqSocialCreate(socCreate); return; }
      const socAngle = e.target.closest('[data-soc-angle]');
      if (socAngle) { this.kwiqSocialAngle(socAngle); return; }
      const socCopy = e.target.closest('[data-soc-copy]');
      if (socCopy) { this.kwiqSocialCopy(socCopy); return; }
      const socRegen = e.target.closest('[data-soc-regen]');
      if (socRegen) { this.kwiqSocialRegen(socRegen); return; }
      const retry = e.target.closest('[data-kwiq-retry]');
      if (retry) { this.kwiqRetry(retry); return; }
      const connect = e.target.closest('[data-connect]');
      if (connect) { this.kwiqConnectContacts(connect); return; }
      const addNum = e.target.closest('[data-add-number]');
      if (addNum) { this.kwiqAddNumber(addNum); return; }
      const f2opt = e.target.closest('[data-f2-opt]');
      if (f2opt) { this.kwiqF2Pick(f2opt); return; }
      const scopeOpt = e.target.closest('[data-scope-opt]');
      if (scopeOpt) { this.kwiqScopePick(scopeOpt); return; }
      if (e.target.closest('[data-cma-open]')) { this.kwiqCmaPreview(); return; }
      if (e.target.closest('[data-cma-print]')) { e.preventDefault(); this.kwiqCmaPrint(); return; }
      if (e.target.closest('[data-cma-close]') || e.target === root.querySelector('[data-cma-overlay]')) { this.kwiqCmaClose(); return; }
      const pr = e.target.closest('[data-kwiq-prompt]');
      if (pr) { this.kwiqSend(pr.textContent); return; }
      if (e.target.closest('[data-kwiq-send]')) { const i = root.querySelector('[data-kwiq-input]'); this.kwiqSend(i && i.value); return; }
    });

    const msgsEl2 = root.querySelector('[data-kwiq-messages]');
    if (msgsEl2) {
      // Edge fades: fade the top/bottom of the message column only when content overflows that way.
      const updateFades = () => {
        const top = msgsEl2.scrollTop > 2;
        const bottom = msgsEl2.scrollTop + msgsEl2.clientHeight < msgsEl2.scrollHeight - 2;
        msgsEl2.style.setProperty('--kwiq-ft', top ? '40px' : '0px');
        msgsEl2.style.setProperty('--kwiq-fb', bottom ? '40px' : '0px');
      };
      msgsEl2.addEventListener('scroll', () => {
        msgsEl2.setAttribute('data-scrolling', '');
        clearTimeout(this._scrollHideT);
        this._scrollHideT = setTimeout(() => msgsEl2.removeAttribute('data-scrolling'), 900);
        updateFades();
      }, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(updateFades).observe(msgsEl2);
      // Response cascade: new messages fade + rise in, top to bottom. A row whose column holds
      // several blocks (intro, cards, actions) staggers those blocks individually.
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animateIn = (el, delay) => {
        el.style.animation = 'kwiqRespIn .45s cubic-bezier(.16,1,.3,1) ' + delay + 'ms both';
        el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
      };
      new MutationObserver((muts) => {
        muts.forEach((m) => m.addedNodes.forEach((node) => {
          if (reduce || node.nodeType !== 1 || node.hasAttribute('data-kwiq-empty')) return;
          const only = node.children.length === 1 ? node.children[0] : null;
          const blocks = only && only.children.length > 1 ? Array.from(only.children) : [node];
          blocks.forEach((b, i) => animateIn(b, Math.min(i, 6) * 90));
        }));
        requestAnimationFrame(updateFades);
      }).observe(msgsEl2, { childList: true });
    }
    const inp = root.querySelector('[data-kwiq-input]');
    if (inp) inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.kwiqSend(inp.value); }
    });
    document.addEventListener('keydown', (e) => {
      if (this._deckOpen) {
        if (e.key === 'Escape') { this.kwiqDeckClose(); return; }
        if (e.key === 'ArrowRight') { this.kwiqDeckGo((this._deckIdx || 0) + 1); return; }
        if (e.key === 'ArrowLeft') { this.kwiqDeckGo((this._deckIdx || 0) - 1); return; }
        return;
      }
      if (this._cmaBuilder) { if (e.key === 'Escape') this.kwiqCmaBuilderClose(true); return; }
      if (e.key === 'Escape') this.kwiqClose();
    });
    window.addEventListener('resize', () => { if (this._deckOpen) this.kwiqDeckScale(); if (this._kwiqOpen) this.kwiqApply(); });
  }

  kwiqSparkle() {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M8.5 2 Q8.5 9 15.5 9 Q8.5 9 8.5 16 Q8.5 9 1.5 9 Q8.5 9 8.5 2 Z M18 2 Q18 6 22 6 Q18 6 18 10 Q18 6 14 6 Q18 6 18 2 Z M14 15 Q14 18.5 17.5 18.5 Q14 18.5 14 22 Q14 18.5 10.5 18.5 Q14 18.5 14 15 Z"/></svg>';
  }
  kwiqApply() {
    const root = document.querySelector('[data-dash-root]');
    if (!root) return;
    const dr = root.querySelector('[data-kwiq-drawer]');
    const ov = root.querySelector('[data-kwiq-overlay]');
    const bodyRow = root.querySelector('[data-body-row]');
    const open = this._kwiqOpen;
    // Modal: card floats over a dimmed app; clicking the backdrop closes it.
    dr.style.transform = open ? 'translateY(0)' : 'translateY(14px)';
    dr.style.opacity = open ? '1' : '0';
    dr.style.pointerEvents = open ? 'auto' : 'none';
    if (bodyRow) bodyRow.style.marginRight = '0';
    if (ov) { ov.style.opacity = open ? '1' : '0'; ov.style.pointerEvents = open ? 'auto' : 'none'; }
    // Lock background scroll while KWIQ owns the screen.
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  kwiqSetExpandIcon() {
    const root = document.querySelector('[data-dash-root]');
    const btn = root && root.querySelector('[data-kwiq-expand]');
    if (!btn) return;
    const out = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-8 8"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/></svg>';
    const inn = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M14 9l-4 3 4 3" /></svg>';
    btn.innerHTML = this._kwiqExpanded ? inn : out;
    btn.title = this._kwiqExpanded ? 'Dock to side' : 'Open in new window';
  }
  kwiqToggleExpand() {
    this._kwiqExpanded = !this._kwiqExpanded;
    this.kwiqApply();
    this.kwiqSetExpandIcon();
  }
  kwiqPopOut() {
    // If a popped-out window is already open, just focus it.
    if (this._kwiqWin && !this._kwiqWin.closed) { this._kwiqWin.focus(); return; }
    const root = document.querySelector('[data-dash-root]');
    const cssEl = document.querySelector('link[href*="colors_and_type"]');
    const cssHref = cssEl ? cssEl.href : 'colors_and_type.css';
    const sparkle = this.kwiqSparkle();
    // Reuse the live workspace markup so styling stays identical.
    const msgsEl = root.querySelector('[data-kwiq-messages]');
    const composerEl = root.querySelector('[data-kwiq-composer]');
    const msgsHTML = msgsEl ? msgsEl.outerHTML : '';
    const composerHTML = composerEl ? composerEl.outerHTML : '';
    const W = 560, H = 760;
    const left = (window.screen && window.screen.availWidth ? window.screen.availWidth - W - 40 : 80);
    const feats = 'popup=yes,noopener=no,width=' + W + ',height=' + H + ',left=' + left + ',top=80';
    const win = window.open('', 'kwiqWorkspace', feats);
    if (!win) {
      // Popups blocked — fall back to the in-page window so KWIQ still opens.
      if (!this._kwiqExpanded) this.kwiqToggleExpand();
      return;
    }
    this._kwiqWin = win;
    const doc =
'<!DOCTYPE html><html><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1">' +
'<title>KWIQ Workspace</title>' +
'<link rel="stylesheet" href="' + cssHref + '">' +
'<style>' +
'*{box-sizing:border-box;}html,body{margin:0;padding:0;height:100%;}' +
'body{font-family:var(--font-sans);background:#fff;color:var(--label-primary);display:flex;flex-direction:column;}' +
'*::-webkit-scrollbar{width:10px;height:10px;}*::-webkit-scrollbar-thumb{background:var(--kw-neutral-300);border-radius:8px;border:2px solid #fff;}' +
'@keyframes kwiqDot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-4px);opacity:1}}' +
'[data-kwiq-prompt]{transition:background .14s ease,box-shadow .14s ease,transform .14s ease;}' +
'[data-kwiq-prompt]:hover{background:var(--neutral-actionHoverFill, rgba(61, 66, 77, 0.10))!important;box-shadow:var(--shadow04);transform:translateY(-1px);}' +
'[data-kwiq-prompt]:active{transform:translateY(0);box-shadow:none;}' +
'.kw-bar{flex:none;display:flex;align-items:center;gap:10px;height:52px;padding:0 18px;border-bottom:1px solid var(--divider);background:#fff;}' +
'.kw-mark{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#00b4d2,#006c84);display:flex;align-items:center;justify-content:center;}' +
'.kw-mark svg{width:18px;height:18px;}' +
'</style></head><body>' +
'<div class="kw-bar"><span class="kw-mark">' + sparkle + '</span>' +
'<span style="font:var(--fw-extrabold) 17px/1 var(--font-sans);color:var(--label-primary);letter-spacing:.2px;">KWIQ</span>' +
'<span style="font:var(--fw-regular) 13px/1 var(--font-sans);color:var(--label-tertiary);">Workspace</span></div>' +
msgsHTML + composerHTML +
'<script>(function(){' +
'var msgs=document.querySelector("[data-kwiq-messages]");' +
'var empty=document.querySelector("[data-kwiq-empty]");' +
'var input=document.querySelector("[data-kwiq-input]");' +
'var SP=' + JSON.stringify(sparkle) + ';' +
'function userBubble(t){var d=document.createElement("div");d.style.cssText="align-self:flex-end;max-width:84%;background:var(--neutral-containerTinted, #E4E5E7);color:var(--label-primary);padding:11px 15px;border-radius:var(--4, 16px);font:var(--fw-regular) 14px/20px var(--font-sans);";d.textContent=t;return d;}' +
'function kwiqBubble(t){var row=document.createElement("div");row.style.cssText="display:flex;gap:10px;align-items:flex-start;";var b=document.createElement("div");b.style.cssText="color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);max-width:84%;";b.textContent=t;row.appendChild(b);return row;}' +
'function send(t){t=(t||"").trim();if(!t)return;if(empty)empty.style.display="none";msgs.appendChild(userBubble(t));msgs.scrollTop=msgs.scrollHeight;setTimeout(function(){msgs.appendChild(kwiqBubble("Working on it — here in your KWIQ workspace. Drag this window to your second monitor and keep it open alongside Command."));msgs.scrollTop=msgs.scrollHeight;},650);}' +
'document.addEventListener("click",function(e){var c=e.target.closest("[data-kwiq-prompt]");if(c){send(c.textContent);if(input)input.value="";return;}var s=e.target.closest("[data-kwiq-send]");if(s){send(input&&input.value);if(input)input.value="";return;}var sc=e.target.closest("[data-kwiq-sharing-close]");if(sc){var bar=sc.closest("[data-kwiq-sharing]");if(bar)bar.style.display="none";return;}});' +
'if(input)input.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();send(input.value);input.value="";}});' +
'window.focus();if(input)input.focus();' +
'})();<\/script>' +
'</body></html>';
    win.document.open();
    win.document.write(doc);
    win.document.close();
    // KWIQ now lives in its own window — close the in-dashboard panel.
    this._kwiqExpanded = false;
    this.kwiqClose();
    this.kwiqSetExpandIcon();
  }
  kwiqChime() {
    // Soft two-note Web Audio cue (D5 → A5) played once on open — motion for the ears.
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = this._actx || (this._actx = new Ctx());
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      [[587.33, 0], [880, 0.12]].forEach((n) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = n[0];
        const t = now + n[1];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + 0.55);
      });
    } catch (e) {}
  }
  kwiqPlayEntrance() {
    // Staggered fade+rise cascade over the welcome surface, top to bottom:
    // salutation → composer → prompt chips. Replays on every open, self-cleans.
    const root = document.querySelector('[data-dash-root]');
    const empty = root && root.querySelector('[data-kwiq-empty]');
    if (!empty || getComputedStyle(empty).display === 'none') return;
    const seq = [
      empty.querySelector('[data-kwiq-eyebrow]'),
      empty.querySelector('[data-kwiq-hello]'),
      empty.querySelector('[data-kwiq-sub]'),
      empty.querySelector('[data-kwiq-composer-slot]'),
    ].concat(Array.from(empty.querySelectorAll('[data-kwiq-prompt]'))).filter(Boolean);
    seq.forEach((el, i) => {
      el.style.animation = 'none';
      void el.offsetWidth; // force reflow so the animation can replay
      el.style.animation = 'kwiqIn .6s cubic-bezier(.16,1,.3,1) ' + (i * 0.07).toFixed(3) + 's both';
      const clean = () => {
        el.style.animation = '';
        el.style.opacity = '';
        el.style.transform = '';
        el.removeEventListener('animationend', clean);
      };
      el.addEventListener('animationend', clean);
    });
  }
  kwiqPhStart() {
    // Rotating placeholder examples: current line fades out + up, next rises in from below.
    const examples = [
      'Draft a follow-up for the buyers I showed homes to Saturday',
      'Who in my database is most likely to sell this year?',
      'Pull comps for 412 Rollingwood Dr',
      'Write a listing description for a 3-bed craftsman with a big yard',
      'Remind me to call the Parks after their inspection',
      'Which past clients have a home anniversary this month?',
      'Plan my day around my 2pm listing appointment',
    ];
    const el = document.querySelector('[data-dash-root] [data-kwiq-ph-text]');
    if (!el) return;
    this.kwiqPhStop();
    this._phIdx = 0;
    el.textContent = examples[0];
    el.removeAttribute('data-out'); el.removeAttribute('data-below');
    this._phTimer = setInterval(() => {
      el.setAttribute('data-out', '');
      this._phSwapT = setTimeout(() => {
        this._phIdx = (this._phIdx + 1) % examples.length;
        el.textContent = examples[this._phIdx];
        el.removeAttribute('data-out');
        el.setAttribute('data-below', '');
        void el.offsetWidth; // commit the below position before animating in
        el.removeAttribute('data-below');
      }, 400);
    }, 3200);
  }
  kwiqPhStop() {
    clearInterval(this._phTimer);
    clearTimeout(this._phSwapT);
  }
  kwiqSparkleAnim(kind) {
    // Restartable: clear, force reflow, re-set so every open replays from the top.
    const el = document.querySelector('[data-dash-root] [data-kwiq-eyebrow]');
    if (!el) return;
    el.removeAttribute('data-anim');
    void el.offsetWidth;
    el.setAttribute('data-anim', kind);
  }
  kwiqOpen() {
    this._kwiqOpen = true;
    this.kwiqApply();
    this.kwiqWelcomeLayout();
    // Open in the active state: focus the composer right away so the gradient outline/glow
    // fades in alongside the entrance cascade.
    this.kwiqSparkleAnim('load');
    this.kwiqPhStart();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.kwiqPlayEntrance();
      const inp = document.querySelector('[data-dash-root] [data-kwiq-input]');
      if (inp) inp.focus({ preventScroll: true });
    }));
  }
  kwiqClose() {
    this._kwiqOpen = false;
    this.kwiqCmaBuilderClose(true);
    this.kwiqPhStop();
    this.kwiqApply();
  }
  kwiqNewChat() {
    this.kwiqHistSetActive(null);
    this._f2Await = false; this._f2Repairs = 0;
    this._scopeAwait = false; this._scopeRepairs = 0;
    const root = document.querySelector('[data-dash-root]');
    const msgs = root.querySelector('[data-kwiq-messages]');
    const empty = root.querySelector('[data-kwiq-empty]');
    this.kwiqCmaBuilderClose(false);
    [...msgs.children].forEach(c => { if (c !== empty) c.remove(); });
    if (empty) empty.style.display = 'flex';
    const dr = root.querySelector('[data-kwiq-drawer]');
    if (dr) dr.removeAttribute('data-kwiq-chat');
    this.kwiqSetChatTitle('New chat');
    this.kwiqWelcomeLayout();
  }
  kwiqHistSetActive(item) {
    const root = document.querySelector('[data-dash-root]');
    root.querySelectorAll('[data-kwiq-hist-item][data-active]').forEach(el => el.removeAttribute('data-active'));
    if (item) item.setAttribute('data-active', '');
    this._kwiqHistActive = item || null;
  }
  kwiqChatTitle(text) {
    // Short, sentence-case summary of the agent's ask for the response header.
    const t = (text || '').trim();
    const l = t.toLowerCase();
    if (this.kwiqIsCallList(t)) return 'Priority leads for today';
    if (this.kwiqIsCMA(t)) { const a = this.kwiqParseAddress(t); return a ? 'CMA for ' + a : l.includes('rollingwood') ? 'Rollingwood CMA' : 'Comparative market analysis'; }
    if (this.kwiqIsOpenHouse(t)) return 'Open house leads';
    if (this.kwiqIsDeck(t)) return 'Listing presentation';
    if (this.kwiqIsSocial(t)) return 'Social post for your listing';
    if (this.kwiqIsDisambig(t)) return 'Catching up with your people';
    if (/plan my day|my day|schedule|calendar/.test(l)) return 'Plan for today';
    if (l.includes('pipeline')) return 'Pipeline summary';
    if (l.includes('follow-up') || l.includes('follow up')) return 'Follow-up email draft';
    if (l.includes('listing description')) return 'Listing description';
    if (l.includes('likely to sell')) return 'Likely sellers in your database';
    if (l.includes('anniversar')) return 'Home anniversaries this month';
    if (/^remind/.test(l)) return 'Reminder';
    let s = t.split(/[.?!\n]/)[0].trim() || t;
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (s.length > 48) s = s.slice(0, 48).replace(/\s+\S*$/, '') + '…';
    return s;
  }
  kwiqSetChatTitle(text) {
    const el = document.querySelector('[data-dash-root] [data-kwiq-chat-title]');
    if (!el) return;
    el.textContent = text;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  }
  kwiqHistAdd(text) {
    // A fresh conversation is logged at the top of Today, titled by its first message.
    const root = document.querySelector('[data-dash-root]');
    const list = root.querySelector('[data-kwiq-hist-group="today"] [data-kwiq-hist-list]');
    const tpl = root.querySelector('[data-kwiq-hist-item]');
    if (!list) return;
    const item = tpl ? tpl.cloneNode(true) : document.createElement('button');
    item.setAttribute('data-kwiq-hist-item', '');
    item.removeAttribute('data-active');
    if (tpl) item.firstElementChild.textContent = text; else item.textContent = text;
    list.prepend(item);
    this.kwiqHistSetActive(item);
  }
  kwiqHistOpen(item) {
    // Prototype: reopening a past chat replays its title as the opening ask.
    const title = item.firstElementChild ? item.firstElementChild.textContent : item.textContent;
    this.kwiqNewChat();
    this.kwiqHistSetActive(item);
    this.kwiqSend(title);
    this.kwiqSetChatTitle(title); // a saved chat keeps its own name in the header
  }
  kwiqHistToggle() {
    const root = document.querySelector('[data-dash-root]');
    const dr = root.querySelector('[data-kwiq-drawer]');
    const btn = root.querySelector('[data-kwiq-hist-toggle]');
    const closed = dr.toggleAttribute('data-history-closed');
    if (btn) {
      btn.setAttribute('aria-expanded', closed ? 'false' : 'true');
      btn.title = btn.ariaLabel = closed ? 'Show chat history' : 'Hide chat history';
    }
  }
  kwiqHistEdit() {
    const root = document.querySelector('[data-dash-root]');
    const h = root.querySelector('[data-kwiq-history]');
    const btn = root.querySelector('[data-kwiq-hist-edit]');
    const on = h.toggleAttribute('data-editing');
    if (btn) btn.textContent = on ? 'Done' : 'Edit';
  }
  kwiqWelcomeLayout() {
    // Welcome surface: input sits centered, above the prompt chips.
    const root = document.querySelector('[data-dash-root]');
    const slot = root.querySelector('[data-kwiq-composer-slot]');
    const comp = root.querySelector('[data-kwiq-composer]');
    if (slot && comp && comp.parentElement !== slot) slot.appendChild(comp);
  }
  kwiqEnterChat() {
    // Conversation surface: dock the input back to the bottom, hide welcome.
    const root = document.querySelector('[data-dash-root]');
    const main = root.querySelector('[data-kwiq-main]');
    const disc = root.querySelector('[data-kwiq-disclaimer]');
    const comp = root.querySelector('[data-kwiq-composer]');
    const empty = root.querySelector('[data-kwiq-empty]');
    if (comp && main && comp.nextElementSibling !== disc) main.insertBefore(comp, disc);
    if (empty) empty.style.display = 'none';
    const dr = root.querySelector('[data-kwiq-drawer]');
    if (dr) dr.setAttribute('data-kwiq-chat', '');
  }
  kwiqMakeUser(text) {
    const w = document.createElement('div');
    w.style.cssText = 'align-self:flex-end;max-width:82%;background:var(--neutral-containerTinted, #E4E5E7);color:var(--label-primary);padding:11px 15px;border-radius:var(--4, 16px);font:var(--fw-regular) 14px/20px var(--font-sans);white-space:pre-wrap;word-break:break-word;';
    w.textContent = text;
    return w;
  }
  kwiqMakeRow(inner) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;max-width:92%;align-self:flex-start;';
    row.appendChild(inner);
    return row;
  }
  kwiqMakeKwiq(text) {
    const b = document.createElement('div');
    b.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);white-space:pre-wrap;word-break:break-word;';
    b.textContent = text;
    return this.kwiqMakeRow(b);
  }
  kwiqMakeTyping() {
    const b = document.createElement('div');
    b.style.cssText = 'padding:8px 0;display:flex;gap:5px;align-items:center;';
    b.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:var(--label-tertiary);animation:kwiqDot 1.2s infinite;"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--label-tertiary);animation:kwiqDot 1.2s infinite .2s;"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--label-tertiary);animation:kwiqDot 1.2s infinite .4s;"></span>';
    return this.kwiqMakeRow(b);
  }
  kwiqIsCMA(text) {
    const t = (text || '').toLowerCase();
    return t.includes('cma') || (t.includes('comparative market') ) || (t.includes('rollingwood') && (t.includes('analysis') || t.includes('saved search') || t.includes('comp')));
  }
  kwiqIsOpenHouse(text) {
    const t = (text || '').toLowerCase();
    return t.includes('rosewood') || t.includes('6578') || (t.includes('open house') && t.includes('lead'));
  }
  kwiqLeadCard(name, detail, color) {
    const card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:11px;background:#fff;box-shadow:var(--shadow04);border-radius:12px;padding:9px 11px;';
    const init = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const av = document.createElement('span');
    av.style.cssText = 'width:38px;height:38px;flex:none;border-radius:50%;background:' + color + ';color:#fff;display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 13px/1 var(--font-sans);';
    av.textContent = init;
    const info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;';
    info.innerHTML = '<div style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div><div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + detail + '</div>';
    const phone = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l1.6 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4z"/></svg>';
    const chat = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a7.5 7.5 0 0 1-10.8 6.7L4 20l1.8-5.2A7.5 7.5 0 1 1 21 11.5z"/></svg>';
    const mail = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>';
    const btn = (action, svg, title) => '<button data-lead-action="' + action + '" data-lead-name="' + name + '" title="' + title + '" style="width:34px;height:34px;border:none;border-radius:8px;background:var(--kw-system-tint);color:var(--action);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s;">' + svg + '</button>';
    const acts = document.createElement('div');
    acts.style.cssText = 'display:flex;gap:5px;flex:none;';
    acts.innerHTML = btn('call', phone, 'Call ' + name) + btn('text', chat, 'Text ' + name) + btn('email', mail, 'Email ' + name);
    card.appendChild(av); card.appendChild(info); card.appendChild(acts);
    return card;
  }
  kwiqMakeOpenHouseLeads() {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const intro = document.createElement('div');
    intro.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    intro.textContent = "Here are the 5 leads who signed in at the 6578 Rosewood Avenue open house. Reach out while it's still fresh:";
    col.appendChild(intro);
    const leads = [
      ['Jordan Blake', 'Visited 1:05 PM · Pre-approved buyer', '#006C84'],
      ['Maria Chen', 'Visited 1:40 PM · Browsing, no agent', '#6730B4'],
      ['Devin Carter', 'Visited 2:15 PM · Relocating buyer', '#A73B06'],
      ['Priya Nair', 'Visited 2:50 PM · Cash buyer', '#0F5EAD'],
      ['Tom Walsh', 'Visited 3:25 PM · Needs to sell first', '#026E24'],
    ];
    leads.forEach(([n, d, c]) => col.appendChild(this.kwiqLeadCard(n, d, c)));
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;align-self:stretch;';
    row.appendChild(col);
    return row;
  }
  kwiqIsCallList(text) {
    const t = (text || '').toLowerCase();
    return t.includes('contacts to call') || t.includes('find contacts') || (t.includes('call') && t.includes('today')) || (t.includes('who') && t.includes('call'));
  }
  kwiqCallCard(name, tag, reason, opener, color, opts) {
    opts = opts || {};
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:9px;';
    const init = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const phone = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l1.6 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4z"/></svg>';
    const chat = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a7.5 7.5 0 0 1-10.8 6.7L4 20l1.8-5.2A7.5 7.5 0 1 1 21 11.5z"/></svg>';
    const mail = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>';
    const btn = (action, svg, title) => '<button data-lead-action="' + action + '" data-lead-name="' + name + '" title="' + title + '" style="width:34px;height:34px;border:none;border-radius:8px;background:var(--kw-system-tint);color:var(--action);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s;">' + svg + '</button>';
    const disBtn = (svg, title) => '<button title="' + title + '" disabled style="width:34px;height:34px;border:none;border-radius:8px;background:var(--kw-neutral-100);color:var(--kw-neutral-300);cursor:not-allowed;display:flex;align-items:center;justify-content:center;">' + svg + '</button>';
    let actions, note = '';
    if (opts.noPhone) {
      note = '<div style="display:flex;align-items:center;gap:7px;font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--kw-yellow-hover);"><span style="width:6px;height:6px;border-radius:50%;background:var(--kw-yellow-hover);"></span>No phone number on file — add one to call or text.</div>';
      actions = '<div style="display:flex;gap:6px;align-items:center;">' + disBtn(phone, 'No phone number') + disBtn(chat, 'No phone number') + btn('email', mail, 'Email ' + name)
        + '<button data-add-number data-lead-name="' + name + '" style="margin-left:auto;border:none;cursor:pointer;border-radius:8px;padding:0 13px;height:34px;background:var(--action);color:#fff;font:var(--fw-bold) 12px/1 var(--font-sans);">Add number</button></div>';
    } else {
      actions = '<div style="display:flex;gap:6px;">' + btn('call', phone, 'Call ' + name) + btn('text', chat, 'Text ' + name) + btn('email', mail, 'Email ' + name) + '</div>';
    }
    card.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">'
        + '<span style="width:36px;height:36px;flex:none;border-radius:50%;background:' + color + ';color:#fff;display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 13px/1 var(--font-sans);">' + init + '</span>'
        + '<div style="flex:1;min-width:0;"><div style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div></div>'
        + '<span style="font:var(--fw-bold) 11px/14px var(--font-sans);color:var(--action);background:var(--kw-system-tint);padding:3px 9px;border-radius:999px;white-space:nowrap;">' + tag + '</span>'
      + '</div>'
      + '<div style="font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);"><span style="font-weight:700;color:var(--label-primary);">Why call: </span>' + reason + '</div>'
      + '<div style="background:var(--kw-neutral-100);border-radius:8px;padding:9px 11px;font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);"><span style="font-weight:700;color:var(--label-primary);">Try opening with: </span>&ldquo;' + opener + '&rdquo;</div>'
      + note + actions;
    return card;
  }
  kwiqMakeCallList() {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const intro = document.createElement('div');
    intro.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    intro.textContent = "These four contacts are worth a call today. Here's why each matters and a quick way to open the conversation:";
    col.appendChild(intro);
    const list = [
      ['Carter Dean', 'New lead', 'A Facebook lead from 5 days ago that still has no first touch — calling now, before another agent does, gives you the best shot at converting.', "Hi Carter, thanks for your interest! What kind of home are you hoping to find?", '#006C84'],
      ['Alexis Nichols', 'New lead', 'Also a 5-day-old Facebook lead with no contact yet. A quick call shows responsiveness and starts building trust early.', "Hi Alexis, I saw you were browsing homes — want me to send a few that fit what you're after?", '#6730B4'],
      ['Joanne Rice', 'Going cold', "Joanne came in 6 days ago and hasn't heard back. Reach her today to re-engage before the lead goes stale.", "Hi Joanne, just checking in — are you still looking in the area? Happy to help however I can.", '#A73B06'],
      ['Marcus Webb', 'Past client', 'Closed about 11 months ago. A near-anniversary check-in is a natural, low-pressure moment to nurture the relationship and ask for referrals.', "Hi Marcus, hard to believe it's almost a year in the new place! How's it treating you?", '#026E24'],
    ];
    list.forEach(([n, tag, r, o, c]) => col.appendChild(this.kwiqCallCard(n, tag, r, o, c)));
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;align-self:stretch;';
    row.appendChild(col);
    return row;
  }
  kwiqIsDeck(text) {
    const t = (text || '').toLowerCase();
    return t.includes('pitch deck') || t.includes('listing presentation') || t.includes('presentation') || t.includes('deck');
  }
  kwiqDeckBuildSlides() {
    const agent = (this.props.agentFirstName || 'Nina') + ' Royals';
    const A = 'var(--action)';
    const s = [];
    s.push(`<div style="width:100%;height:100%;background:linear-gradient(135deg,#0c6f88,#062f3a);color:#fff;padding:60px 70px;display:flex;flex-direction:column;justify-content:space-between;font-family:var(--font-sans);box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:13px;"><span style="width:42px;height:42px;border-radius:9px;background:#CE011F;display:flex;align-items:center;justify-content:center;font:800 18px/1 var(--font-sans);color:#fff;">kw</span><span style="font:700 15px/1 var(--font-sans);letter-spacing:2.5px;text-transform:uppercase;opacity:.85;">${agent} Team</span></div>
      <div><div style="font:800 62px/62px var(--font-sans);letter-spacing:-1.5px;">Listing<br>Presentation</div><div style="margin-top:20px;font:400 22px/30px var(--font-sans);opacity:.92;">Prepared for the sellers of<br><span style="font-weight:700;">6578 Rosewood Avenue</span></div></div>
      <div style="font:700 18px/24px var(--font-sans);">${agent}<span style="font-weight:400;opacity:.8;"> · Listing Specialist</span></div>
    </div>`);
    s.push(`<div style="width:100%;height:100%;background:#fff;padding:54px 64px;display:flex;flex-direction:column;gap:26px;font-family:var(--font-sans);color:var(--label-primary);box-sizing:border-box;">
      <div style="font:800 42px/46px var(--font-sans);">Meet ${agent}</div>
      <div style="display:flex;gap:34px;align-items:flex-start;"><span style="width:118px;height:118px;flex:none;border-radius:50%;background:linear-gradient(135deg,#0c6f88,#062f3a);color:#fff;display:flex;align-items:center;justify-content:center;font:800 40px/1 var(--font-sans);">NR</span><div style="flex:1;"><div style="font:400 19px/30px var(--font-sans);color:var(--label-secondary);">A lifelong resident of the area, I've helped over 120 families buy and sell with honesty, sharp negotiation, and white-glove service. Selling your home is deeply personal — and I treat it that way, every step of the way.</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;">${['12 yrs experience','Top 1% local agent','500+ families served'].map(c=>`<span style="background:var(--kw-system-tint);color:${A};font:700 14px/18px var(--font-sans);padding:8px 16px;border-radius:999px;">${c}</span>`).join('')}</div></div></div>
    </div>`);
    const cols=[['Sharp Pricing','Data-driven CMAs that price your home to sell for top dollar.'],['Bold Marketing','Pro photography, video, and reach across 100+ channels.'],['True Advocacy','Expert negotiation that protects your bottom line.']];
    s.push(`<div style="width:100%;height:100%;background:#fff;padding:50px 64px;display:flex;flex-direction:column;gap:26px;font-family:var(--font-sans);color:var(--label-primary);box-sizing:border-box;">
      <div style="font:800 42px/46px var(--font-sans);">Why Sellers Choose Me</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;flex:1;">${cols.map(([t,d],i)=>`<div style="background:var(--kw-neutral-100);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:11px;"><span style="width:44px;height:44px;border-radius:11px;background:${A};color:#fff;display:flex;align-items:center;justify-content:center;font:800 20px/1 var(--font-sans);">${i+1}</span><div style="font:800 22px/26px var(--font-sans);">${t}</div><div style="font:400 16px/23px var(--font-sans);color:var(--label-secondary);">${d}</div></div>`).join('')}</div>
      <div style="background:var(--kw-system-tint);border-radius:12px;padding:16px 22px;font:400 17px/25px var(--font-sans);color:var(--label-primary);">&ldquo;${agent} sold our home in 9 days, over asking. We couldn't have asked for a better experience.&rdquo; <span style="font-weight:700;color:${A};">— The Hendersons</span></div>
    </div>`);
    const stats=[['120+','Homes Sold'],['18 days','Avg. on Market'],['99%','List-to-Sale Price'],['$48M','Total Volume']];
    s.push(`<div style="width:100%;height:100%;background:linear-gradient(135deg,#0c6f88,#062f3a);color:#fff;padding:56px 64px;display:flex;flex-direction:column;gap:34px;font-family:var(--font-sans);box-sizing:border-box;">
      <div style="font:800 42px/46px var(--font-sans);">My Track Record</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:26px;flex:1;">${stats.map(([n,l])=>`<div style="display:flex;flex-direction:column;justify-content:center;gap:6px;border-left:4px solid rgba(255,255,255,.4);padding-left:22px;"><div style="font:800 50px/52px var(--font-sans);">${n}</div><div style="font:400 18px/24px var(--font-sans);opacity:.85;">${l}</div></div>`).join('')}</div>
    </div>`);
    const mk=['Professional photography, video & 3D tours','Syndication to 100+ search sites','Targeted social media ad campaigns','Open houses & broker tours','Direct outreach to my buyer database'];
    s.push(`<div style="width:100%;height:100%;background:#fff;padding:54px 64px;display:flex;flex-direction:column;gap:24px;font-family:var(--font-sans);color:var(--label-primary);box-sizing:border-box;">
      <div style="font:800 42px/46px var(--font-sans);">How I'll Market Your Home</div>
      <div style="display:flex;flex-direction:column;gap:14px;flex:1;justify-content:center;">${mk.map(m=>`<div style="display:flex;align-items:center;gap:16px;"><span style="width:32px;height:32px;flex:none;border-radius:50%;background:var(--kw-system-tint);color:${A};display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-11"/></svg></span><span style="font:600 20px/26px var(--font-sans);color:var(--label-primary);">${m}</span></div>`).join('')}</div>
    </div>`);
    s.push(`<div style="width:100%;height:100%;background:#fff;padding:54px 64px;display:flex;flex-direction:column;gap:22px;font-family:var(--font-sans);color:var(--label-primary);box-sizing:border-box;">
      <div style="font:800 42px/46px var(--font-sans);">Pricing Your Home Right</div>
      <div style="font:400 19px/28px var(--font-sans);color:var(--label-secondary);max-width:740px;">Homes priced right sell faster and for more. I'll build a comparative market analysis from recent nearby sales to position 6578 Rosewood Avenue in the sweet spot — attracting strong offers without leaving money on the table.</div>
      <div style="margin-top:14px;"><div style="height:18px;border-radius:999px;background:linear-gradient(90deg,#cfe9ef,${A},#cfe9ef);position:relative;"><span style="position:absolute;left:50%;top:-9px;transform:translateX(-50%);width:4px;height:36px;border-radius:3px;background:var(--label-primary);"></span></div><div style="display:flex;justify-content:space-between;margin-top:12px;font:700 15px/20px var(--font-sans);color:var(--label-tertiary);"><span>Underpriced</span><span style="color:${A};">The Sweet Spot</span><span>Overpriced</span></div></div>
    </div>`);
    const steps=['Prepare & Stage','Launch & Market','Show & Tour','Review Offers','Close & Celebrate'];
    s.push(`<div style="width:100%;height:100%;background:#fff;padding:54px 64px;display:flex;flex-direction:column;gap:34px;font-family:var(--font-sans);color:var(--label-primary);box-sizing:border-box;">
      <div style="font:800 42px/46px var(--font-sans);">The Path to Sold</div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex:1;">${steps.map((st,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;"><span style="width:54px;height:54px;border-radius:50%;background:${A};color:#fff;display:flex;align-items:center;justify-content:center;font:800 22px/1 var(--font-sans);">${i+1}</span><span style="font:700 16px/22px var(--font-sans);">${st}</span></div>`).join('')}</div>
    </div>`);
    s.push(`<div style="width:100%;height:100%;background:linear-gradient(135deg,#0c6f88,#062f3a);color:#fff;padding:64px 70px;display:flex;flex-direction:column;justify-content:center;gap:22px;font-family:var(--font-sans);box-sizing:border-box;">
      <div style="font:800 54px/58px var(--font-sans);letter-spacing:-1px;">Let's Get Your<br>Home Sold</div>
      <div style="font:400 22px/30px var(--font-sans);opacity:.9;">Ready when you are. Let's talk strategy and timeline.</div>
      <div style="margin-top:14px;font:700 19px/30px var(--font-sans);">${agent}<br><span style="font-weight:400;opacity:.85;">(555) 123-4567 · nina@ninaroyalsteam.com</span></div>
    </div>`);
    return s;
  }
  kwiqMakeDeckCard() {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const intro = document.createElement('div');
    intro.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    intro.textContent = "I built a listing presentation you can use to win the listing — your story, track record, and marketing plan in 8 slides. Preview it below, then open to present or download to share.";
    col.appendChild(intro);
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:12px;overflow:hidden;';
    card.innerHTML =
      '<div style="aspect-ratio:16/9;background:linear-gradient(135deg,#0c6f88,#062f3a);color:#fff;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;">'
        + '<span style="font:800 11px/1 var(--font-sans);letter-spacing:2px;text-transform:uppercase;opacity:.85;">Nina Royals Team</span>'
        + '<span style="font:800 26px/28px var(--font-sans);">Listing<br>Presentation</span>'
        + '<span style="font:600 12px/16px var(--font-sans);opacity:.85;">6578 Rosewood Avenue</span>'
      + '</div>'
      + '<div style="padding:11px 13px;display:flex;align-items:center;gap:10px;">'
        + '<div style="flex:1;min-width:0;"><div style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);">Listing Presentation</div><div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">8 slides · PDF</div></div>'
        + '<button data-deck-download title="Download" style="width:36px;height:36px;border:none;border-radius:8px;background:var(--kw-neutral-100);color:var(--label-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg></button>'
        + '<button data-deck-open style="border:none;border-radius:8px;background:var(--action);color:#fff;cursor:pointer;font:var(--fw-bold) 14px/1 var(--font-sans);padding:10px 18px;">Open</button>'
      + '</div>';
    col.appendChild(card);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;align-self:stretch;';
    row.appendChild(col);
    return row;
  }
  kwiqCmaPdfHref() { return (window.__resources && window.__resources.cmaPdf) ? window.__resources.cmaPdf : encodeURI('assets/Rollingwood CMA.pdf'); }
  async kwiqCmaBlobUrl() {
    if (this._cmaBlobUrl) return this._cmaBlobUrl;
    const href = this.kwiqCmaPdfHref();
    if (/^blob:/.test(href)) { this._cmaBlobUrl = href; return href; }
    try {
      const res = await fetch(href);
      const blob = await res.blob();
      this._cmaBlobUrl = URL.createObjectURL(blob);
    } catch (err) {
      this._cmaBlobUrl = href;
    }
    return this._cmaBlobUrl;
  }
  kwiqLoadPdfJs() { return Promise.resolve(null); }
  kwiqCmaReportHTML() {
    const S0 = this._cmaSubject || {};
    const subj = { addr: this._cmaAddr || S0.addr || '1255 Kings Road', city: S0.city || 'Austin, TX 78746', beds: S0.beds || 5, baths: S0.bath || 5.5, sqft: S0.area || 5400, lot: S0.lot || 0.82, year: S0.year || 2018, garage: S0.garage || 3, zip: S0.zip || '78746' };
    const live = !!S0.lat0;
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const sel = this._cmaSel || {};
    const wantComps = parseInt(sel.comps, 10) || 5;
    const statusLabel = Array.isArray(sel.status) ? sel.status.join(' + ') : (sel.status && sel.status !== 'All' ? sel.status : 'Sold + active');
    const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
    const big = (v) => '$' + (v / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    const signed = (v) => (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toLocaleString('en-US');
    const round25 = (v) => Math.round(v / 25000) * 25000;
    const statusColor = (s) => s === 'Active' ? { c: 'var(--kw-green)', b: 'var(--kw-green-tint)' } : s === 'Pending' ? { c: 'var(--kw-yellow-hover)', b: 'var(--kw-yellow-tint)' } : { c: 'var(--action)', b: 'var(--kw-system-tint)' };
    let comps = this._cmaComps && this._cmaComps.length ? this._cmaComps.slice() : [
      { addr: '208 Ashworth Drive', city: 'Austin, TX 78746', status: 'Sold', price: 9250000, beds: 6, bath: 7, area: 6662, lot: 0.40, sold: 'Mar 2026' },
      { addr: '3111 Stratford Place', city: 'Austin, TX 78746', status: 'Sold', price: 8995000, beds: 5, bath: 6, area: 6026, lot: 1.17, sold: 'Feb 2026' },
      { addr: '101 Stratford Reserve', city: 'Austin, TX 78746', status: 'Sold', price: 7950000, beds: 6, bath: 6, area: 6021, lot: 1.56, sold: 'Jan 2026' },
      { addr: '2308 Bridle Path', city: 'Austin, TX 78703', status: 'Pending', price: 8750000, beds: 5, bath: 6, area: 5810, lot: 0.74, sold: 'Listed' },
      { addr: '400 Academy Drive', city: 'Austin, TX 78746', status: 'Active', price: 8400000, beds: 5, bath: 5, area: 5210, lot: 1.00, sold: 'Active' },
      { addr: '1810 Wood Hollow', city: 'Austin, TX 78746', status: 'Sold', price: 7650000, beds: 5, bath: 5, area: 5040, lot: 0.66, sold: 'Dec 2025' },
    ].slice(0, Math.min(wantComps, 6));
    const S1 = { beds: subj.beds, bath: subj.baths, area: subj.sqft, lot: subj.lot };
    const rates = this.kwiqCmaRates(comps);
    comps = comps.map((c, i) => Object.assign({ n: i + 1 }, this.kwiqCmaAdjust(c, S1, rates), c));
    const adjVals = comps.map(c => c.adjusted);
    const { estimate, low, high } = this.kwiqCmaValue(comps, S1);
    const suggested = round25(estimate * 0.99);
    // Confidence from how closely the adjusted comps agree (coefficient of variation) and how many there are.
    const mean = adjVals.reduce((t, v) => t + v, 0) / adjVals.length;
    const cv = adjVals.length > 1 ? Math.sqrt(adjVals.reduce((t, v) => t + (v - mean) * (v - mean), 0) / (adjVals.length - 1)) / mean : 1;
    const conf = comps.length >= 4 && cv < 0.08 ? { t: 'High confidence', c: 'var(--kw-green)', b: 'var(--kw-green-tint)' }
      : comps.length >= 3 && cv < 0.15 ? { t: 'Medium confidence', c: 'var(--kw-yellow-hover)', b: 'var(--kw-yellow-tint)' }
      : { t: 'Low confidence', c: 'var(--kw-red)', b: 'var(--kw-red-tint)' };
    const confWhy = comps.length + ' comps · adjusted prices vary by about ' + Math.round(cv * 100) + '% (high confidence needs 4+ comps under 8%)';
    const pos = Math.max(5, Math.min(95, ((estimate - low) / (high - low)) * 100));

    // --- price positioning chart (SVG) ---
    const dmin = Math.min.apply(null, adjVals.concat([low]));
    const dmax = Math.max.apply(null, adjVals.concat([high]));
    const CW = 760, padX = 46;
    const X = (v) => padX + ((v - dmin) / (dmax - dmin)) * (CW - padX * 2);
    const dots = comps.map(c => '<circle cx="' + X(c.adjusted).toFixed(1) + '" cy="64" r="6.5" fill="var(--action)" opacity="0.85"></circle>').join('');
    const estX = X(estimate).toFixed(1);
    const chart = '<svg viewBox="0 0 ' + CW + ' 110" width="100%" style="display:block;">'
      + '<line x1="' + padX + '" y1="64" x2="' + (CW - padX) + '" y2="64" stroke="var(--divider)" stroke-width="2"></line>'
      + '<rect x="' + X(low).toFixed(1) + '" y="61" width="' + (X(high) - X(low)).toFixed(1) + '" height="6" rx="3" fill="var(--kw-system-tint)"></rect>'
      + dots
      + '<line x1="' + estX + '" y1="30" x2="' + estX + '" y2="86" stroke="var(--action)" stroke-width="2.5" stroke-dasharray="4 3"></line>'
      + '<circle cx="' + estX + '" cy="64" r="8" fill="#fff" stroke="var(--action)" stroke-width="3"></circle>'
      + '<text x="' + estX + '" y="22" text-anchor="middle" font-family="var(--font-sans)" font-size="12" font-weight="800" fill="var(--action)">Subject est. ' + big(estimate) + '</text>'
      + '<text x="' + padX + '" y="100" text-anchor="start" font-family="var(--font-sans)" font-size="11" fill="var(--label-tertiary)">' + big(dmin) + '</text>'
      + '<text x="' + (CW - padX) + '" y="100" text-anchor="end" font-family="var(--font-sans)" font-size="11" fill="var(--label-tertiary)">' + big(dmax) + '</text>'
      + '</svg>';

    const sectionLabel = (t) => '<div style="font:var(--fw-extrabold) 12px/16px var(--font-sans);letter-spacing:.07em;text-transform:uppercase;color:var(--label-tertiary);margin-bottom:14px;">' + t + '</div>';
    const specTile = (label, val) => '<div style="flex:1;min-width:96px;text-align:center;padding:14px 10px;background:var(--kw-neutral-100);border-radius:10px;"><div style="font:var(--fw-extrabold) 20px/24px var(--font-sans);color:var(--label-primary);">' + val + '</div><div style="margin-top:3px;font:var(--fw-regular) 11px/14px var(--font-sans);color:var(--label-tertiary);text-transform:uppercase;letter-spacing:.04em;">' + label + '</div></div>';
    const kpiTile = (label, val, delta, tone) => {
      const dc = tone === 'up' ? 'var(--kw-green)' : tone === 'down' ? 'var(--kw-red)' : 'var(--label-tertiary)';
      return '<div style="flex:1;min-width:150px;padding:15px 16px;border:1px solid var(--divider);border-radius:10px;"><div style="font:var(--fw-regular) 11px/14px var(--font-sans);color:var(--label-tertiary);text-transform:uppercase;letter-spacing:.05em;">' + label + '</div><div style="margin-top:6px;font:var(--fw-extrabold) 22px/26px var(--font-sans);color:var(--label-primary);">' + val + '</div><div style="margin-top:3px;font:var(--fw-bold) 12px/16px var(--font-sans);color:' + dc + ';">' + delta + '</div></div>';
    };
    const houseIcon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--label-tertiary)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>';
    const compCard = (c) => {
      const sc = statusColor(c.status);
      const lines = [['Living area', c.adj.sqft], ['Beds', c.adj.bed], ['Baths', c.adj.bath], ['Lot size', c.adj.lot]].filter(x => x[1] !== 0);
      const adjHTML = (lines.length ? lines.map(x => '<div style="display:flex;justify-content:space-between;gap:10px;font:var(--fw-regular) 12px/19px var(--font-sans);"><span style="color:var(--label-tertiary);">' + x[0] + '</span><span style="font-weight:700;color:' + (x[1] > 0 ? 'var(--kw-green)' : 'var(--kw-red)') + ';">' + signed(x[1]) + '</span></div>').join('') : '<div style="font:var(--fw-regular) 12px/19px var(--font-sans);color:var(--label-tertiary);">No adjustments needed</div>')
        + '<div style="display:flex;justify-content:space-between;gap:10px;margin-top:7px;padding-top:7px;border-top:1px solid var(--divider);font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);"><span>Adjusted</span><span>' + money(c.adjusted) + '</span></div>';
      return '<div data-cma-comp style="display:flex;gap:14px;padding:16px;border:1px solid var(--divider);border-radius:12px;background:#fff;flex-wrap:wrap;">'
        + '<span style="width:84px;height:84px;flex:none;border-radius:10px;background:var(--kw-neutral-100);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">'
        + '<span style="position:absolute;top:6px;left:6px;z-index:1;width:22px;height:22px;border-radius:50%;background:var(--action);color:#fff;display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 11px/1 var(--font-sans);">' + c.n + '</span>' + (c.photo ? '<img src="' + c.photo.replace(/"/g, '&quot;') + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:10px;">' : houseIcon) + '</span>'
        + '<div style="flex:1;min-width:170px;display:flex;flex-direction:column;gap:7px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;"><div style="font:var(--fw-bold) 15px/19px var(--font-sans);color:var(--label-primary);">' + c.addr + '</div><span style="padding:3px 10px;border-radius:999px;background:' + sc.b + ';color:' + sc.c + ';font:var(--fw-bold) 11px/16px var(--font-sans);">' + c.status + '</span></div>'
        + '<div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + c.city + ' · ' + c.sold + '</div>'
        + '<div style="font:var(--fw-extrabold) 19px/24px var(--font-sans);color:var(--label-primary);">' + money(c.price) + '</div>'
        + '<div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-secondary);">' + c.beds + ' bd · ' + c.bath + ' ba · ' + c.area.toLocaleString('en-US') + ' sq ft · ' + c.lot.toFixed(2) + ' ac</div>'
        + (c.courtesy ? '<div style="font:var(--fw-regular) 11px/14px var(--font-sans);color:var(--label-tertiary);">Listing courtesy of ' + c.courtesy.replace(/</g, '&lt;') + '</div>' : '')
        + '</div>'
        + '<div style="width:210px;flex:1 1 180px;min-width:170px;border-left:1px solid var(--divider);padding-left:14px;"><div style="font:var(--fw-bold) 11px/16px var(--font-sans);text-transform:uppercase;letter-spacing:.05em;color:var(--label-tertiary);margin-bottom:6px;">Adjustments</div>' + adjHTML + '</div>'
        + '</div>';
    };

    const pad = 'padding:0 30px;';
    return '<div style="width:100%;max-width:820px;background:#fff;border-radius:14px;box-shadow:var(--shadow12);overflow:hidden;border-top:3px solid var(--action);">'
      // Header
      + '<div style="padding:26px 30px 22px;border-bottom:1px solid var(--divider);display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;">'
      + '<div><div style="font:var(--fw-extrabold) 12px/16px var(--font-sans);color:var(--action);text-transform:uppercase;letter-spacing:.08em;">KWIQ · Comparative Market Analysis</div>'
      + '<div style="margin-top:5px;font:var(--fw-extrabold) 28px/32px var(--font-sans);color:var(--label-primary);">' + subj.addr + '</div>'
      + '<div style="margin-top:3px;font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);">' + subj.city + ' · ' + comps.length + ' comparables · ' + statusLabel + '</div></div>'
      + '<div style="text-align:right;"><div style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);">Nina Royals</div>'
      + '<div style="font:var(--fw-regular) 12px/17px var(--font-sans);color:var(--label-tertiary);">Royals Realtors<br>+1 (512) 465-1234<br>nina.royals@royalsrealtors.com<br>Prepared ' + today + '</div></div>'
      + '</div>'
      // Estimated value hero + range bar
      + '<div style="padding:26px 30px 24px;border-bottom:1px solid var(--divider);">'
      + '<div style="font:var(--fw-extrabold) 12px/16px var(--font-sans);letter-spacing:.07em;text-transform:uppercase;color:var(--label-tertiary);">Estimated market value</div>'
      + '<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-top:6px;"><div style="font:var(--fw-extrabold) 44px/48px var(--font-sans);color:var(--label-primary);letter-spacing:-.01em;">' + big(estimate) + '</div>'
      + '<span title="' + confWhy + '" style="display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;background:' + conf.b + ';color:' + conf.c + ';font:var(--fw-bold) 12px/16px var(--font-sans);">' + conf.t + '</span>'
      + '<span style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + confWhy + '</span></div>'
      + '<div style="margin-top:20px;position:relative;height:8px;border-radius:999px;background:var(--kw-neutral-200);">'
      + '<div style="position:absolute;left:0;right:0;top:0;bottom:0;border-radius:999px;background:var(--kw-system-tint);"></div>'
      + '<div style="position:absolute;left:' + pos.toFixed(1) + '%;top:50%;width:18px;height:18px;border-radius:50%;background:#fff;border:4px solid var(--action);transform:translate(-50%,-50%);box-shadow:var(--shadow04);"></div></div>'
      + '<div style="margin-top:8px;display:flex;justify-content:space-between;font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--label-secondary);"><span>Low ' + big(low) + '</span><span>High ' + big(high) + '</span></div>'
      + '</div>'
      // Subject specs
      + '<div style="' + pad + 'padding-top:24px;">' + sectionLabel('Subject property')
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;">' + specTile('Beds', subj.beds) + specTile('Baths', subj.baths) + specTile('Living area', subj.sqft.toLocaleString('en-US')) + specTile('Lot (ac)', subj.lot.toFixed(2)) + specTile('Year built', subj.year) + (live ? specTile('Parking', subj.garage || '—') : specTile('Garage', subj.garage)) + '</div></div>'
      // Market KPIs
      + this.kwiqCmaMarketHTML(live, subj.zip, pad, sectionLabel, kpiTile)
      // Positioning chart
      + '<div style="' + pad + 'padding-top:26px;">' + sectionLabel('Price positioning')
      + '<div style="padding:6px 4px 4px;border:1px solid var(--divider);border-radius:12px;">' + chart + '</div>'
      + '<div style="margin-top:8px;font:var(--fw-regular) 12px/18px var(--font-sans);color:var(--label-tertiary);">Each dot is a comparable’s price after adjustments. The dashed line marks the subject’s estimated value.</div></div>'
      // Comparable sales
      + '<div style="' + pad + 'padding-top:26px;">' + sectionLabel('Comparable sales · adjusted')
      + '<div style="display:flex;flex-direction:column;gap:12px;">' + comps.map(compCard).join('') + '</div></div>'
      // Suggested list price
      + '<div style="' + pad + 'padding-top:26px;padding-bottom:6px;"><div style="padding:22px 24px;background:var(--kw-system-tint);border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;">'
      + '<div><div style="font:var(--fw-extrabold) 12px/16px var(--font-sans);letter-spacing:.06em;text-transform:uppercase;color:var(--action);">Suggested list price</div><div style="margin-top:4px;font:var(--fw-extrabold) 34px/38px var(--font-sans);color:var(--label-primary);">' + big(suggested) + '</div></div>'
      + '<div style="flex:1;min-width:240px;font:var(--fw-regular) 13px/19px var(--font-sans);color:var(--label-secondary);">Based on ' + comps.length + ' adjusted comparables, list between <b>' + big(low) + '</b> and <b>' + big(estimate) + '</b> to draw competitive interest while protecting your seller’s equity.</div>'
      + '</div></div>'
      // Footer
      + '<div style="padding:22px 30px 26px;font:var(--fw-regular) 12px/18px var(--font-sans);color:var(--label-tertiary);">Prepared by Nina Royals · Royals Realtors on ' + today + '. ' + (live
        ? 'Comparable sales and market figures from KW Unified Listing Service (MLS data), deemed reliable but not guaranteed. Adjustments are rules of thumb scaled to local prices. This is a comparative market analysis, not an appraisal.'
        : 'Estimates derive from adjusted comparable sales and public records; they are not an appraisal. Figures are illustrative.') + '</div>'
      + '</div>';
  }
  // Live ZIP-level stats from kwiqUlsMarket; the sample CMA keeps its illustrative figures.
  kwiqCmaMarketHTML(live, zip, pad, sectionLabel, kpiTile) {
    const m = this._cmaMarket;
    if (!live) return '<div style="' + pad + 'padding-top:26px;">' + sectionLabel('Local market · 78746') + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
      + kpiTile('Median $/sq ft', '$1,604', '+3.2% MoM', 'up') + kpiTile('Median days on market', '38', '−6 vs. last qtr', 'up') + kpiTile('List-to-sold ratio', '98.4%', '+0.6%', 'up')
      + kpiTile('Active inventory', '27 homes', '−4 MoM', 'down') + kpiTile('Median sold price', '$8.4M', '+5.1% YoY', 'up') + kpiTile('Months of supply', '3.1', 'Balanced market', 'flat') + '</div></div>';
    if (!m || !m.now.n) return '';
    const pct = (a, b) => b ? (a - b) / b * 100 : 0;
    const sgn = (v, unit, dp) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(dp == null ? 1 : dp) + unit;
    const tone = (v, goodUp) => Math.abs(v) < 0.05 ? 'flat' : (v > 0) === goodUp ? 'up' : 'down';
    const vs = ' vs. prior 6 mo';
    const big = (v) => v >= 1e6 ? '$' + (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : '$' + Math.round(v / 1000) + 'K';
    const n = m.now, b = m.before;
    const d1 = pct(n.ppsf, b.ppsf), d2 = n.dom - b.dom, d3 = (n.ratio - b.ratio) * 100, d5 = pct(n.price, b.price);
    const mos = n.n ? m.active / (n.n / 6) : 0;
    const label = mos < 4 ? 'Seller’s market' : mos <= 6 ? 'Balanced market' : 'Buyer’s market';
    const has = b.n > 0;
    return '<div style="' + pad + 'padding-top:26px;">' + sectionLabel('Local market · ' + zip + ' · ' + m.typeLabel + ' · last 6 months')
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
      + kpiTile('Median $/sq ft', '$' + Math.round(n.ppsf).toLocaleString('en-US'), has ? sgn(d1, '%') + vs : '—', tone(d1, true))
      + kpiTile('Median days on market', String(Math.round(n.dom)), has ? sgn(d2, ' days', 0) + vs : '—', tone(d2, false))
      + kpiTile('Sale-to-list ratio', (n.ratio * 100).toFixed(1) + '%', has ? sgn(d3, ' pts') + vs : '—', tone(d3, true))
      + kpiTile('Active inventory', m.active + ' homes', 'Listed now', 'flat')
      + kpiTile('Median sold price', big(n.price), has ? sgn(d5, '%') + vs : '—', tone(d5, true))
      + kpiTile('Months of supply', mos.toFixed(1), label, 'flat')
      + '</div><div style="margin-top:8px;font:var(--fw-regular) 12px/18px var(--font-sans);color:var(--label-tertiary);">' + n.n + ' closed sales in the last 6 months, ' + b.n + ' in the 6 months before.</div></div>';
  }
  // Download: print only the report so the browser's "Save as PDF" captures what's on screen.
  async kwiqCmaPrint() {
    await this.kwiqCmaPreview();
    const pages = document.querySelector('[data-dash-root] [data-cma-pages]');
    await Promise.all([...pages.querySelectorAll('img')].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); })));
    const html = document.documentElement, title = document.title;
    document.title = (this._cmaTitle || ((this._cmaAddr || 'CMA') + ' CMA')).replace(/[\\/:*?"<>|]/g, '');
    html.classList.add('kw-print-cma');
    const done = () => { html.classList.remove('kw-print-cma'); document.title = title; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 50);
  }
  async kwiqCmaPreview() {
    const root = document.querySelector('[data-dash-root]');
    const ov = root.querySelector('[data-cma-overlay]');
    const pages = root.querySelector('[data-cma-pages]');
    const loading = root.querySelector('[data-cma-loading]');
    if (!ov) return;
    ov.style.opacity = '1'; ov.style.pointerEvents = 'auto';
    const t = root.querySelector('[data-cma-ov-title]');
    if (t) t.textContent = this._cmaTitle || ((this._cmaAddr || 'Rollingwood') + ' CMA');
    if (loading) loading.style.display = 'none';
    const key = (this._cmaAddr || '') + '|' + JSON.stringify(this._cmaSel || {}) + '|' + (this._cmaMarket ? this._cmaMarket.key : '');
    if (this._cmaRenderedKey !== key) {
      pages.innerHTML = this.kwiqCmaReportHTML();
      this._cmaRenderedKey = key;
    }
    const sc = root.querySelector('[data-cma-scroll]');
    if (sc) sc.scrollTop = 0;
  }
  kwiqCmaClose() {
    const root = document.querySelector('[data-dash-root]');
    const ov = root.querySelector('[data-cma-overlay]');
    if (ov) { ov.style.opacity = '0'; ov.style.pointerEvents = 'none'; }
  }
  kwiqParseAddress(text) {
    const re = /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,3}\s+(?:Rd|Road|St|Street|Ave|Avenue|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Way|Pl|Place|Ter|Terrace|Cir|Circle|Pkwy|Trl|Trail|Path|Hwy|Highway)\b\.?/i;
    const m = (text || '').match(re);
    return m ? m[0].trim().replace(/\.$/, '') : null;
  }
  kwiqScrollToCard(row) {
    requestAnimationFrame(() => {
      try { row.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      catch (e) {
        const msgs = document.querySelector('[data-dash-root] [data-kwiq-messages]');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
      }
    });
  }
  kwiqCmaChipStyle(on) {
    return 'cursor:pointer;border-radius:999px;padding:7px 14px;font:var(--fw-bold) 13px/16px var(--font-sans);transition:background .12s,color .12s,border-color .12s;'
      + (on ? 'border:1px solid var(--action);background:var(--action);color:#fff;' : 'border:1px solid var(--divider);background:#fff;color:var(--label-secondary);');
  }
  kwiqCmaIntro(text) {
    const d = document.createElement('div');
    d.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    d.textContent = text;
    return d;
  }
  kwiqCmaActionRow(buttons) {
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;padding-top:4px;';
    buttons.forEach(b => foot.appendChild(b));
    return foot;
  }
  kwiqCmaButton(text, attr, primary) {
    const b = document.createElement('button');
    b.setAttribute(attr, '');
    b.textContent = text;
    b.style.cssText = 'border:none;cursor:pointer;border-radius:8px;padding:10px 18px;font:var(--fw-bold) 14px/1 var(--font-sans);'
      + (primary ? 'background:var(--action);color:#fff;' : 'background:var(--kw-neutral-100);color:var(--label-secondary);');
    return b;
  }
  // ============ CMA flow: settings (filters + map) → results (keep / swap / drop) → report ============
  // Map space is a 640×320 SVG; 110 units ≈ 1 mile. Subject sits at (330,170).
  // `fresh` rebuilds the sample set (live ULS data replaces this._cmaData in kwiqCmaAutoBuild).
  kwiqCmaData(fresh) {
    if (this._cmaData && !fresh) return this._cmaData;
    const hoods = [
      { name: 'Westlake Hills', pts: [[0,0],[230,0],[250,120],[215,250],[0,260]], lx: 105, ly: 120 },
      { name: 'Rollingwood', pts: [[230,0],[400,0],[410,120],[395,235],[215,250],[250,120]], lx: 318, ly: 62 },
      { name: 'Tarrytown', pts: [[400,0],[640,0],[640,200],[430,210],[410,120]], lx: 540, ly: 60 },
      { name: 'Barton Creek', pts: [[0,260],[215,250],[395,235],[430,210],[640,200],[640,320],[0,320]], lx: 250, ly: 300 },
    ];
    const districts = [
      { name: 'Eanes ISD', pts: [[0,0],[420,0],[430,130],[450,220],[470,320],[0,320]], lx: 150, ly: 196 },
      { name: 'Austin ISD', pts: [[420,0],[640,0],[640,320],[470,320],[450,220],[430,130]], lx: 545, ly: 250 },
    ];
    // m = months since the sale closed (sold only); hue drives the placeholder photo tile.
    const pool = [
      { id: 1, addr: '208 Ashworth Drive', city: 'Austin, TX 78746', x: 290, y: 120, status: 'Sold', price: 9250000, beds: 6, bath: 7, area: 6662, lot: 0.40, year: 2019, m: 7, hue: 196 },
      { id: 2, addr: '3111 Stratford Place', city: 'Austin, TX 78746', x: 470, y: 110, status: 'Sold', price: 8995000, beds: 5, bath: 6, area: 6026, lot: 1.17, year: 2016, m: 8, hue: 28 },
      { id: 3, addr: '101 Stratford Reserve', city: 'Austin, TX 78746', x: 455, y: 140, status: 'Sold', price: 7950000, beds: 6, bath: 6, area: 6021, lot: 1.56, year: 2015, m: 9, hue: 150 },
      { id: 4, addr: '2308 Bridle Path', city: 'Austin, TX 78703', x: 500, y: 80, status: 'Pending', price: 8750000, beds: 5, bath: 6, area: 5810, lot: 0.74, year: 2017, hue: 260 },
      { id: 5, addr: '400 Academy Drive', city: 'Austin, TX 78746', x: 380, y: 210, status: 'Active', price: 8400000, beds: 5, bath: 5, area: 5210, lot: 1.00, year: 2014, hue: 12 },
      { id: 6, addr: '1810 Wood Hollow', city: 'Austin, TX 78746', x: 200, y: 150, status: 'Sold', price: 7650000, beds: 5, bath: 5, area: 5040, lot: 0.66, year: 2012, m: 10, hue: 90 },
      { id: 7, addr: '2 Wildwood Drive', city: 'Austin, TX 78746', x: 260, y: 200, status: 'Sold', price: 6850000, beds: 5, bath: 5, area: 4890, lot: 0.55, year: 2008, m: 2, hue: 330 },
      { id: 8, addr: '3401 Pecos Street', city: 'Austin, TX 78703', x: 540, y: 150, status: 'Sold', price: 5975000, beds: 4, bath: 4.5, area: 4420, lot: 0.38, year: 2003, m: 4, hue: 48 },
      { id: 9, addr: '1102 Rock Creek Drive', city: 'Austin, TX 78746', x: 150, y: 230, status: 'Active', price: 7295000, beds: 5, bath: 5.5, area: 5350, lot: 1.10, year: 2020, hue: 210 },
      { id: 10, addr: '4505 Ridge Oak Drive', city: 'Austin, TX 78746', x: 310, y: 280, status: 'Sold', price: 6400000, beds: 5, bath: 4.5, area: 4980, lot: 0.92, year: 2006, m: 5, hue: 120 },
      { id: 11, addr: '8 Rollingwood Circle', city: 'Austin, TX 78746', x: 350, y: 150, status: 'Sold', price: 8100000, beds: 5, bath: 6, area: 5620, lot: 0.71, year: 2021, m: 1, hue: 180 },
      { id: 12, addr: '3 Rivercrest Drive', city: 'Austin, TX 78746', x: 240, y: 90, status: 'Expired', price: 9900000, beds: 6, bath: 7, area: 6900, lot: 1.30, year: 2018, hue: 300 },
      { id: 13, addr: '2700 Barton Creek Blvd', city: 'Austin, TX 78735', x: 420, y: 290, status: 'Sold', price: 5600000, beds: 4, bath: 4, area: 4300, lot: 0.80, year: 1999, m: 11, hue: 70 },
      { id: 14, addr: '1407 Westover Road', city: 'Austin, TX 78703', x: 575, y: 110, status: 'Sold', price: 7200000, beds: 5, bath: 5, area: 5150, lot: 0.45, year: 2019, m: 12, hue: 230 },
      { id: 15, addr: '5 Treemont Court', city: 'Austin, TX 78746', x: 180, y: 280, status: 'Sold', price: 6050000, beds: 4, bath: 5, area: 4700, lot: 1.05, year: 2010, m: 18, hue: 160 },
      { id: 16, addr: '1919 Hidden Valley', city: 'Austin, TX 78746', x: 270, y: 40, status: 'Pending', price: 7800000, beds: 5, bath: 5.5, area: 5480, lot: 0.88, year: 2016, hue: 20 },
    ];
    const inPoly = (x, y, pts) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
      }
      return inside;
    };
    const subject = { x: 330, y: 170, beds: 5, bath: 5.5, area: 5400, lot: 0.82, year: 2018 };
    pool.forEach(c => {
      c.hood = (hoods.find(h => inPoly(c.x, c.y, h.pts)) || {}).name;
      c.district = (districts.find(d => inPoly(c.x, c.y, d.pts)) || {}).name;
    });
    this._cmaData = { hoods, districts, pool, subject, inPoly };
    return this._cmaData;
  }
  kwiqCmaDefaults() {
    return { comps: '5', status: ['Sold'], within: '12', mode: 'radius', radius: 1.5, hoods: ['Rollingwood'], districts: ['Eanes ISD'], poly: [], polyClosed: false, beds: [4, 6], baths: [4, 7], sqft: [4000, 7000], year: [1995, 2026] };
  }
  kwiqCmaWhen(c) {
    if (c.status !== 'Sold') return c.status === 'Active' ? 'Listed now' : c.status === 'Pending' ? 'Under contract' : 'Listing expired';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (c.closeDate) { const d = new Date(c.closeDate); return 'Sold ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
    const idx = (2026 * 12 + 9) - c.m; // prototype "today" is Oct 2026
    return 'Sold ' + months[idx % 12] + ' ' + Math.floor(idx / 12);
  }
  kwiqCmaStatusColor(s) {
    return { Sold: 'var(--action)', Active: 'var(--kw-green)', Pending: 'var(--kw-orange)', Expired: 'var(--kw-neutral-500)' }[s] || 'var(--action)';
  }
  kwiqCmaInArea(c, st) {
    const d = this.kwiqCmaData();
    if (st.mode === 'radius') return this.kwiqCmaMi(c) <= st.radius + 1e-6;
    if (st.mode === 'hoods') return st.hoods.indexOf(c.hood) > -1;
    if (st.mode === 'districts') return st.districts.indexOf(c.district) > -1;
    if (st.mode === 'draw') return st.polyClosed && st.poly.length > 2 ? d.inPoly(c.x, c.y, st.poly) : true;
    return true;
  }
  kwiqCmaScore(c) {
    const s = this.kwiqCmaSubj();
    const pen = Math.abs(c.area - s.area) / s.area * 60 + Math.abs(c.beds - s.beds) * 5 + Math.abs(c.bath - s.bath) * 4
      + Math.abs(c.year - s.year) * 0.5 + this.kwiqCmaMi(c) * 4 + (c.m ? c.m * 0.6 : 0);
    return Math.max(52, Math.min(99, Math.round(100 - pen)));
  }
  kwiqCmaMatches(st) {
    const within = parseInt(st.within, 10) || 99;
    return this.kwiqCmaData().pool.filter(c =>
      st.status.indexOf(c.status) > -1
      && (c.status !== 'Sold' || c.m <= within)
      && this.kwiqCmaInArea(c, st)
      && c.beds >= st.beds[0] && c.beds <= st.beds[1]
      && c.bath >= st.baths[0] && c.bath <= st.baths[1]
      && c.area >= st.sqft[0] && c.area <= st.sqft[1]
      && c.year >= st.year[0] && c.year <= st.year[1]
    ).sort((a, b) => this.kwiqCmaScore(b) - this.kwiqCmaScore(a));
  }
  // Stylized map: land, river, creek, park, main roads; overlay depends on the area mode.
  kwiqCmaMapSVG(st, opts) {
    opts = opts || {};
    const d = this.kwiqCmaData();
    const S = this.kwiqCmaSubj();
    const P = (pts) => pts.map(p => p[0] + ',' + p[1]).join(' ');
    let s = '<svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;height:100%;' + (st.mode === 'draw' && !opts.results && !st.polyClosed ? 'cursor:crosshair;' : '') + '">';
    s += '<rect width="640" height="320" style="fill:#EEF0EC"></rect>';
    s += '<path d="M0 26 C120 10 210 34 330 18 S540 6 640 22 L640 0 L0 0Z" style="fill:#CFE2EE"></path>';
    s += '<path d="M0 300 C90 270 170 312 260 286 S420 250 500 276 S600 300 640 288" style="fill:none;stroke:#CFE2EE;stroke-width:7;stroke-linecap:round"></path>';
    s += '<path d="M150 40 L215 52 L222 104 L160 96Z" style="fill:#DCEBD8"></path><path d="M478 238 L560 226 L574 278 L494 290Z" style="fill:#DCEBD8"></path>';
    const road = (dd, w) => '<path d="' + dd + '" style="fill:none;stroke:#D6D9DE;stroke-width:' + (w + 2) + ';stroke-linecap:round"></path><path d="' + dd + '" style="fill:none;stroke:#fff;stroke-width:' + w + ';stroke-linecap:round"></path>';
    s += road('M440 0 C432 90 446 200 466 320', 7);
    s += road('M0 210 C140 196 260 182 330 170 S520 132 640 120', 6);
    s += road('M0 70 C150 64 300 82 420 60 S560 40 640 44', 4);
    s += road('M300 0 C310 90 320 140 330 170 S350 260 340 320', 3);
    s += road('M120 320 C150 260 180 220 230 180', 3);
    const lab = (x, y, t, o) => '<text x="' + x + '" y="' + y + '" text-anchor="middle" style="font:700 10px Mulish, sans-serif;fill:#8A8F99;letter-spacing:.06em;' + (o || '') + '">' + t + '</text>';
    s += lab(452, 290, 'MOPAC', 'font-size:8px;') + lab(96, 192, 'BEE CAVES RD', 'font-size:8px;');
    if (opts.base) return s + '</svg>';
    // area overlay
    const sel = 'fill:rgba(0,108,132,.14);stroke:var(--action);stroke-width:2;';
    const idle = 'fill:rgba(255,255,255,0);stroke:#A9AEB8;stroke-width:1.2;stroke-dasharray:4 4;';
    if (st.mode === 'radius') {
      s += '<circle cx="' + S.x + '" cy="' + S.y + '" r="' + (st.radius * 110) + '" style="fill:rgba(0,108,132,.10);stroke:var(--action);stroke-width:2;stroke-dasharray:6 5"></circle>';
    } else if (st.mode === 'hoods') {
      d.hoods.forEach(h => { const on = st.hoods.indexOf(h.name) > -1; s += '<polygon data-hood="' + h.name + '" points="' + P(h.pts) + '" style="' + (on ? sel : idle) + (opts.results ? '' : 'cursor:pointer;') + '"></polygon>'; });
      d.hoods.forEach(h => { s += lab(h.lx, h.ly, h.name.toUpperCase(), 'pointer-events:none;fill:' + (st.hoods.indexOf(h.name) > -1 ? 'var(--action)' : '#8A8F99') + ';'); });
    } else if (st.mode === 'districts') {
      d.districts.forEach(h => { const on = st.districts.indexOf(h.name) > -1; s += '<polygon data-district="' + h.name + '" points="' + P(h.pts) + '" style="' + (on ? sel : idle) + (opts.results ? '' : 'cursor:pointer;') + '"></polygon>'; });
      d.districts.forEach(h => { s += lab(h.lx, h.ly, h.name.toUpperCase(), 'pointer-events:none;fill:' + (st.districts.indexOf(h.name) > -1 ? 'var(--action)' : '#8A8F99') + ';'); });
    } else if (st.mode === 'draw' && st.poly.length) {
      s += st.polyClosed
        ? '<polygon points="' + P(st.poly) + '" style="' + sel + '"></polygon>'
        : '<polyline points="' + P(st.poly) + '" style="fill:none;stroke:var(--action);stroke-width:2;stroke-dasharray:6 5"></polyline>';
      if (!st.polyClosed) st.poly.forEach((p, i) => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 0 ? 6 : 4) + '" style="fill:#fff;stroke:var(--action);stroke-width:2;pointer-events:none"></circle>'; });
    }
    // pins
    if (opts.results) {
      opts.results.forEach(r => {
        const fill = r.state === 'drop' ? 'var(--kw-neutral-300)' : r.state === 'keep' ? 'var(--action)' : '#fff';
        const txt = r.state === 'keep' ? '#fff' : r.state === 'drop' ? '#fff' : 'var(--label-primary)';
        s += '<g style="pointer-events:none"><circle cx="' + r.c.x + '" cy="' + r.c.y + '" r="11" style="fill:' + fill + ';stroke:' + (r.state === 'drop' ? '#fff' : 'var(--action)') + ';stroke-width:2;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))"></circle>'
          + '<text x="' + r.c.x + '" y="' + (r.c.y + 4) + '" text-anchor="middle" style="font:800 11px Mulish, sans-serif;fill:' + txt + '">' + r.n + '</text></g>';
      });
    } else if (opts.subjectOnly) {
      d.hoods.forEach(h => { s += lab(h.lx, h.ly, h.name.toUpperCase()); });
      const w = Math.max(120, S.addr.length * 6.4 + 24), lx = Math.max(4, Math.min(636 - w, S.x - w / 2)), ly = S.y - 64;
      s += '<g style="pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))"><rect x="' + lx + '" y="' + ly + '" width="' + w + '" height="28" rx="6" style="fill:#fff"></rect><text x="' + (lx + w / 2) + '" y="' + (ly + 18) + '" text-anchor="middle" style="font:700 11px Mulish, sans-serif;fill:#282B33">' + S.addr + '</text></g>';
    } else {
      const match = this.kwiqCmaMatches(st).map(c => c.id);
      d.pool.forEach(c => {
        const on = match.indexOf(c.id) > -1;
        s += '<circle cx="' + c.x + '" cy="' + c.y + '" r="' + (on ? 6 : 4) + '" style="pointer-events:none;' + (on ? 'fill:' + this.kwiqCmaStatusColor(c.status) + ';stroke:#fff;stroke-width:2;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))' : 'fill:#fff;stroke:#B4B9C2;stroke-width:1.5') + '"></circle>';
      });
    }
    s += '<g style="pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))"><path d="M' + S.x + ' ' + (S.y + 2) + ' l-11 -14 a14 14 0 1 1 22 0z" style="fill:var(--label-primary)"></path>'
      + '<path d="M' + (S.x - 6) + ' ' + (S.y - 19) + ' l6 -5 l6 5 v6 h-12z" style="fill:#fff"></path></g>';
    return s + '</svg>';
  }
  kwiqCmaSection(title, hint) {
    const g = document.createElement('div');
    g.innerHTML = '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:9px;"><span style="font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);">' + title + '</span>'
      + (hint ? '<span data-cma-hint style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + hint + '</span>' : '') + '</div>';
    return g;
  }
  kwiqCmaChips(opts, isOn, onPick) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
    const paint = () => wrap.querySelectorAll('button').forEach(b => { b.style.cssText = this.kwiqCmaChipStyle(isOn(b.__v)); b.setAttribute('aria-pressed', isOn(b.__v) ? 'true' : 'false'); });
    opts.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.__v = o.v; b.textContent = o.t;
      b.addEventListener('click', () => { onPick(o.v); paint(); });
      wrap.appendChild(b);
    });
    paint();
    wrap.__paint = paint;
    return wrap;
  }
  // Dual-thumb range: two stacked native ranges; the filled segment is painted between them.
  kwiqCmaRange(label, val, min, max, step, fmt, onChange) {
    const box = document.createElement('div');
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;"><span style="font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--label-secondary);">' + label + '</span>'
      + '<span data-v style="font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--label-primary);"></span></div>'
      + '<div data-cma-range style="position:relative;height:24px;"><div data-track style="position:absolute;left:0;right:0;top:10px;height:4px;border-radius:999px;background:var(--kw-neutral-200);"></div></div>';
    const holder = box.querySelector('[data-cma-range]');
    const track = box.querySelector('[data-track]');
    const out = box.querySelector('[data-v]');
    const mk = (v) => { const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = v; i.setAttribute('aria-label', label + (holder.children.length === 1 ? ' minimum' : ' maximum')); holder.appendChild(i); return i; };
    const a = mk(val[0]), b = mk(val[1]);
    const paint = () => {
      let lo = parseFloat(a.value), hi = parseFloat(b.value);
      if (lo > hi) { const t = lo; lo = hi; hi = t; }
      const p = (v) => ((v - min) / (max - min)) * 100;
      track.style.background = 'linear-gradient(90deg,var(--kw-neutral-200) ' + p(lo) + '%,var(--action) ' + p(lo) + '%,var(--action) ' + p(hi) + '%,var(--kw-neutral-200) ' + p(hi) + '%)';
      out.textContent = lo === hi ? fmt(lo) : fmt(lo) + ' – ' + fmt(hi);
      return [lo, hi];
    };
    [a, b].forEach(i => i.addEventListener('input', () => onChange(paint())));
    paint();
    return box;
  }
  // ---- Subject property (step 1) ----
  kwiqCmaSubj() { return this._cmaSubject || this.kwiqCmaData().subject; }
  kwiqCmaMi(c) { const s = this.kwiqCmaSubj(); return Math.hypot(c.x - s.x, c.y - s.y) / 110; }
  // Sample property records the address field can resolve to (stand-in for public-record lookup).
  kwiqCmaSubjects() {
    return [
      { addr: '1255 Kings Road', city: 'Austin, TX 78746', x: 330, y: 170, beds: 5, bath: 5.5, area: 5400, lot: 0.82, year: 2018, garage: 3, type: 'Residential', sub: 'Single family' },
      { addr: '412 Rollingwood Drive', city: 'Austin, TX 78746', x: 300, y: 135, beds: 5, bath: 5, area: 5050, lot: 0.70, year: 2012, garage: 3, type: 'Residential', sub: 'Single family' },
      { addr: '3205 Pecos Street', city: 'Austin, TX 78703', x: 520, y: 165, beds: 4, bath: 4.5, area: 4600, lot: 0.42, year: 2006, garage: 2, type: 'Residential', sub: 'Single family' },
      { addr: '1508 Rivercrest Court', city: 'Austin, TX 78746', x: 190, y: 120, beds: 6, bath: 6.5, area: 6400, lot: 1.20, year: 2020, garage: 4, type: 'Residential', sub: 'Single family' },
      { addr: '2810 Barton Creek Terrace', city: 'Austin, TX 78735', x: 360, y: 270, beds: 4, bath: 4, area: 4300, lot: 0.60, year: 2003, garage: 3, type: 'Residential', sub: 'Townhouse' },
    ];
  }
  kwiqCmaFindSubject(addr) {
    const norm = (s) => (s || '').toLowerCase().replace(/[.,]/g, '').replace(/\b(drive)\b/g, 'dr').replace(/\b(road)\b/g, 'rd').replace(/\b(street)\b/g, 'st').replace(/\b(court)\b/g, 'ct').replace(/\b(terrace)\b/g, 'ter').replace(/\s+/g, ' ').trim();
    const hit = this.kwiqCmaSubjects().find(s => norm(s.addr) === norm(addr));
    const base = hit || Object.assign({}, this.kwiqCmaSubjects()[0], { addr: addr });
    return Object.assign({}, base);
  }
  kwiqCmaSubtypes(type) {
    return { 'Residential': ['Single family', 'Condominium', 'Townhouse', 'Manufactured'], 'Residential income': ['Duplex', 'Triplex', 'Fourplex'], 'Land': ['Residential lot', 'Acreage'], 'Commercial': ['Office', 'Retail', 'Mixed use'] }[type] || [];
  }
  kwiqCmaRecenter(st, s) {
    const r100 = (v) => Math.round(v / 100) * 100;
    st.beds = [Math.max(1, s.beds - 1), Math.min(8, s.beds + 1)];
    st.baths = [Math.max(1, Math.floor((s.bath - 1.5) * 2) / 2), Math.min(8, Math.ceil((s.bath + 1.5) * 2) / 2)];
    st.sqft = [Math.max(1000, r100(s.area * 0.75)), Math.min(10000, r100(s.area * 1.3))];
    st.year = [Math.max(1950, s.year - 20), 2026];
  }
  kwiqCmaStepLabel(n) { return ['Property', 'Search area', 'Filters', 'Review comps', 'Create'][n - 1]; }
  kwiqCmaPropertyStep(sess, inner, status, setNext, rerender) {
    const subj = sess.subject;
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;';
    // Left: map placeholder until an address is chosen, then the populated map.
    const left = document.createElement('div');
    left.style.cssText = 'flex:1 1 480px;min-width:0;';
    const map = document.createElement('div');
    map.style.cssText = 'position:relative;height:460px;border-radius:12px;overflow:hidden;border:1px solid var(--divider);background:#EEF0EC;';
    if (subj) {
      map.innerHTML = this.kwiqCmaMapSVG({ mode: 'none' }, { subjectOnly: true });
      map.style.animation = 'kwiqRespIn .5s cubic-bezier(.16,1,.3,1) both';
    } else {
      map.innerHTML = '<div style="position:absolute;inset:0;filter:grayscale(1);opacity:.35;">' + this.kwiqCmaMapSVG({ mode: 'none' }, { base: true }) + '</div>'
        + '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:24px;">'
        + '<span style="width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:var(--shadow04);display:flex;align-items:center;justify-content:center;color:var(--label-tertiary);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span>'
        + '<div style="font:var(--fw-bold) 16px/20px var(--font-sans);color:var(--label-primary);">No property selected yet</div>'
        + '<div style="max-width:280px;font:var(--fw-regular) 14px/20px var(--font-sans);color:var(--label-secondary);">Add an address on the right and the map will show the property and its surroundings.</div></div>';
    }
    left.appendChild(map);
    // Right: subject property form.
    const right = document.createElement('div');
    right.style.cssText = 'flex:0 1 360px;min-width:300px;background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px;';
    const field = (label, control, hint) => {
      const w = document.createElement('label');
      w.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-width:0;';
      w.innerHTML = '<span style="font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--label-secondary);">' + label + '</span>';
      w.appendChild(control);
      if (hint) { const h = document.createElement('span'); h.style.cssText = 'font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);'; h.textContent = hint; w.appendChild(h); }
      return w;
    };
    const input = (val, attrs) => {
      const i = document.createElement('input');
      i.setAttribute('data-cma-field', '');
      Object.keys(attrs || {}).forEach(k => i.setAttribute(k, attrs[k]));
      i.value = val == null ? '' : val;
      i.style.cssText = 'width:100%;box-sizing:border-box;height:40px;padding:0 12px;border:1px solid var(--divider);border-radius:4px;background:#fff;font:var(--fw-regular) 14px/20px var(--font-sans);color:var(--label-primary);';
      return i;
    };
    const select = (opts, val) => {
      const s = document.createElement('select');
      s.setAttribute('data-cma-field', '');
      s.innerHTML = opts.map(o => '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>').join('');
      s.style.cssText = 'width:100%;box-sizing:border-box;height:40px;padding:0 10px;border:1px solid var(--divider);border-radius:4px;background:#fff;font:var(--fw-regular) 14px/20px var(--font-sans);color:var(--label-primary);';
      if (!subj) { s.disabled = true; s.style.color = 'var(--label-tertiary)'; s.style.background = 'var(--kw-neutral-100)'; }
      return s;
    };
    right.innerHTML = '<div style="font:var(--fw-bold) 16px/20px var(--font-sans);color:var(--label-primary);">Subject property</div>';
    const validate = () => {
      const ok = !!(subj && (sess.title || '').trim() && subj.beds > 0 && subj.bath > 0 && subj.area > 0);
      status.innerHTML = !subj ? 'Add an address to continue.'
        : ok ? '<b style="color:var(--label-primary);">' + subj.beds + ' bd · ' + subj.bath + ' ba · ' + Number(subj.area).toLocaleString('en-US') + ' sqft</b> · ' + subj.sub
        : 'Fill in the title, beds, baths, and square footage to continue.';
      setNext('Next', ok);
    };
    // Title
    const title = input(sess.title, { placeholder: 'e.g., CMA for 1255 Kings Road', 'aria-label': 'CMA title' });
    title.addEventListener('input', () => { sess.title = title.value; sess.titleEdited = true; const c = this._cmaBuilder && this._cmaBuilder.el.querySelector('[data-cma-crumb-title]'); if (c) c.textContent = sess.title || 'New CMA'; validate(); });
    right.appendChild(field('Title', title));
    // Address with type-ahead suggestions
    const addrWrap = document.createElement('div');
    addrWrap.style.cssText = 'position:relative;';
    const addr = input(subj ? subj.addr + ', ' + subj.city : '', { placeholder: 'Start typing an address', autocomplete: 'off', role: 'combobox', 'aria-expanded': 'false', 'aria-label': 'Property address' });
    addr.style.paddingLeft = '36px';
    const pinIcon = document.createElement('span');
    pinIcon.style.cssText = 'position:absolute;left:12px;top:10px;color:var(--label-tertiary);display:flex;pointer-events:none;';
    pinIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
    const list = document.createElement('div');
    list.setAttribute('role', 'listbox');
    list.style.cssText = 'display:none;position:absolute;left:0;right:0;top:44px;z-index:3;background:#fff;border-radius:8px;box-shadow:var(--shadow12, 0 6px 24px rgba(0,0,0,.14));padding:6px;max-height:240px;overflow:auto;';
    const showList = () => {
      const q = addr.value.toLowerCase().trim();
      const hits = this.kwiqCmaSubjects().filter(s => !q || (s.addr + ' ' + s.city).toLowerCase().indexOf(q) > -1 || q.indexOf(s.addr.toLowerCase().split(' ')[0]) === 0 && (s.addr + ' ' + s.city).toLowerCase().indexOf(q.split(' ').slice(1).join(' ')) > -1);
      list.innerHTML = hits.length
        ? hits.map((s, i) => '<button type="button" role="option" data-i="' + this.kwiqCmaSubjects().findIndex(x => x.addr === s.addr) + '" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:none;background:transparent;border-radius:6px;padding:8px 10px;cursor:pointer;"><span style="color:var(--label-tertiary);display:flex;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><span><span style="display:block;font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);">' + s.addr + '</span><span style="display:block;font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + s.city + '</span></span></button>').join('')
        : '<div style="padding:10px;font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-tertiary);">No matching addresses. Try a street number and name.</div>';
      list.style.display = 'block';
      addr.setAttribute('aria-expanded', 'true');
    };
    const hideList = () => { list.style.display = 'none'; addr.setAttribute('aria-expanded', 'false'); };
    addr.addEventListener('focus', showList);
    addr.addEventListener('input', showList);
    addr.addEventListener('blur', () => setTimeout(hideList, 150));
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => {
      const o = e.target.closest('[data-i]');
      if (!o) return;
      const rec = Object.assign({}, this.kwiqCmaSubjects()[parseInt(o.getAttribute('data-i'), 10)]);
      sess.subject = rec;
      sess.addr = rec.addr;
      if (!sess.titleEdited || !(sess.title || '').trim()) { sess.title = 'CMA for ' + rec.addr; sess.titleEdited = false; }
      this.kwiqCmaRecenter(sess.st, rec);
      this.kwiqSetChatTitle(sess.title);
      rerender();
    });
    addrWrap.appendChild(pinIcon); addrWrap.appendChild(addr); addrWrap.appendChild(list);
    right.appendChild(field('Address', addrWrap, subj ? 'Details below come from public records. Edit anything that’s off.' : ''));
    // Beds / baths / sq ft
    const num = (key, step, lab) => {
      const i = input(subj ? subj[key] : '', { type: 'number', min: '0', step: String(step), 'aria-label': lab });
      if (!subj) { i.disabled = true; i.style.background = 'var(--kw-neutral-100)'; }
      i.addEventListener('input', () => { subj[key] = parseFloat(i.value) || 0; validate(); });
      return i;
    };
    const two = document.createElement('div');
    two.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;';
    two.appendChild(field('Beds', num('beds', 1, 'Beds')));
    two.appendChild(field('Baths', num('bath', 0.5, 'Baths')));
    right.appendChild(two);
    right.appendChild(field('Square footage', num('area', 50, 'Square footage')));
    // Property type + subtype
    const types = ['Residential', 'Residential income', 'Land', 'Commercial'];
    const type = select(types, subj ? subj.type : 'Residential');
    const subtype = select(this.kwiqCmaSubtypes(subj ? subj.type : 'Residential'), subj ? subj.sub : 'Single family');
    type.addEventListener('change', () => { subj.type = type.value; const subs = this.kwiqCmaSubtypes(type.value); subj.sub = subs[0]; subtype.innerHTML = subs.map(o => '<option>' + o + '</option>').join(''); validate(); });
    subtype.addEventListener('change', () => { subj.sub = subtype.value; validate(); });
    const two2 = document.createElement('div');
    two2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;';
    two2.appendChild(field('Property type', type));
    two2.appendChild(field('Property subtype', subtype));
    right.appendChild(two2);
    grid.appendChild(left); grid.appendChild(right);
    inner.appendChild(grid);
    validate();
  }
  // Compact in-chat card for a CMA that's being built in the expanded view.
  kwiqMakeCmaLauncher(sess) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro(sess.subject
      ? 'I opened the CMA builder for ' + sess.subject.addr + ' and filled in the property details from public records. Check them, then pick your search area and filters. You can come back to the chat anytime and pick up where you left off.'
      : 'Let’s build your CMA. I opened the builder so you can start with the subject property. You can come back to the chat anytime and pick up where you left off.'));
    const card = document.createElement('div');
    card.setAttribute('data-cma-card', 'launcher');
    card.style.cssText = 'display:flex;align-items:center;gap:14px;background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:14px 16px;';
    const text = document.createElement('div');
    text.style.cssText = 'flex:1;min-width:0;';
    const go = document.createElement('button');
    go.type = 'button';
    go.innerHTML = this.kwiqCmaIcon('expand') + '<span>Continue</span>';
    go.style.cssText = 'flex:none;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border:none;border-radius:4px;background:var(--container-background);box-shadow:var(--shadow04);cursor:pointer;color:var(--label-primary);font:var(--fw-bold) 13px/16px var(--font-sans);';
    go.addEventListener('click', () => this.kwiqCmaBuilderOpen(sess, card, sess.step));
    card.innerHTML = '<span style="width:40px;height:40px;flex:none;border-radius:10px;background:var(--kw-system-tint);color:var(--action);display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M10 21v-6h4v6"/></svg></span>';
    card.appendChild(text); card.appendChild(go);
    card.__render = () => {
      text.innerHTML = '<div style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + ((sess.title || '').trim() || 'New CMA') + '</div>'
        + '<div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + (sess.subject ? sess.subject.addr : 'No subject property yet') + ' · Step ' + sess.step + ' of 5: ' + this.kwiqCmaStepLabel(sess.step) + '</div>';
    };
    card.__render();
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  kwiqCmaStartBuilder(addr) {
    const sess = { addr: '', subject: null, title: '', titleEdited: false, st: this.kwiqCmaDefaults(), step: 1, maxStep: 1 };
    if (addr) {
      sess.subject = this.kwiqCmaFindSubject(addr);
      sess.addr = sess.subject.addr;
      sess.title = 'CMA for ' + sess.subject.addr;
      this.kwiqCmaRecenter(sess.st, sess.subject);
    }
    const msgs = this.kwiqMsgs();
    const typing = this.kwiqMakeTyping();
    msgs.appendChild(typing);
    setTimeout(() => {
      typing.remove();
      const row = this.kwiqMakeCmaLauncher(sess);
      msgs.appendChild(row);
      this.kwiqCmaBuilderOpen(sess, row.querySelector('[data-cma-card="launcher"]'), 1);
    }, 600);
  }
  // ---- Shared CMA building blocks (used by the inline cards and the expanded builder) ----
  kwiqCmaIcon(name) {
    return {
      keep: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
      swap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4L3 8l4 4"/><path d="M3 8h13"/><path d="M17 20l4-4-4-4"/><path d="M21 16H8"/></svg>',
      drop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      expand: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-7 7"/><path d="M10 20H4v-6"/><path d="M4 20l7-7"/></svg>',
      check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    }[name];
  }
  kwiqCmaCountHTML(st) {
    const n = this.kwiqCmaMatches(st).length, want = parseInt(st.comps, 10);
    return n === 0 ? 'No homes match these settings. Try widening the area or ranges.'
      : '<b style="color:var(--label-primary);">' + n + (n === 1 ? ' home matches' : ' homes match') + '</b>' + (n < want ? ' · fewer than the ' + want + ' you asked for' : n > want ? ' · I’ll show the top ' + want : '');
  }
  kwiqCmaAreaLabel(st) {
    if (st.mode === 'radius') return 'Within ' + st.radius + ' mi';
    if (st.mode === 'hoods') return st.hoods.length ? st.hoods.join(', ') : 'No neighborhoods selected';
    if (st.mode === 'districts') return st.districts.length ? st.districts.join(', ') : 'No districts selected';
    return st.polyClosed ? 'Custom drawn area' : 'Custom area (not closed yet)';
  }
  // Area picker: mode tabs + map + mode-specific controls + legend. Calls onChange after any edit.
  kwiqCmaAreaUI(addr, st, onChange, opts) {
    opts = opts || {};
    const d = this.kwiqCmaData();
    const tabs = document.createElement('div');
    tabs.setAttribute('role', 'tablist');
    tabs.style.cssText = opts.vertical ? 'display:flex;flex-direction:column;gap:8px;' : 'display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:var(--kw-neutral-100);margin-bottom:10px;';
    // Neighborhood and district outlines only exist for the sample map, so live data offers radius and draw.
    const modes = [['radius', 'Radius', 'Distance from the property'], ['hoods', 'Neighborhoods', 'Pick one or more neighborhoods'], ['districts', 'School district', 'Match the subject’s schools'], ['draw', 'Draw', 'Sketch a custom boundary']].filter(m => !d.live || m[0] === 'radius' || m[0] === 'draw');
    const paintTabs = () => tabs.querySelectorAll('button').forEach(b => {
      const on = b.__m === st.mode;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.style.cssText = opts.vertical
        ? 'text-align:left;cursor:pointer;border-radius:12px;padding:10px 12px;background:#fff;' + (on ? 'border:2px solid var(--action);padding:9px 11px;' : 'border:1px solid var(--divider);')
        : 'border:none;cursor:pointer;border-radius:999px;padding:6px 12px;font:var(--fw-bold) 12px/16px var(--font-sans);' + (on ? 'background:#fff;color:var(--label-primary);box-shadow:var(--shadow04);' : 'background:transparent;color:var(--label-secondary);');
    });
    modes.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.__m = m[0];
      if (opts.vertical) b.innerHTML = '<div style="font:var(--fw-bold) 14px/20px var(--font-sans);color:var(--label-primary);">' + m[1] + '</div><div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + m[2] + '</div>';
      else b.textContent = m[1];
      b.addEventListener('click', () => { st.mode = m[0]; paintTabs(); renderControls(); changed(); });
      tabs.appendChild(b);
    });
    const map = document.createElement('div');
    map.setAttribute('data-cma-map', '');
    map.style.cssText = 'position:relative;height:' + (opts.mapHeight || 260) + 'px;border-radius:12px;overflow:hidden;border:1px solid var(--divider);user-select:none;background:#EEF0EC;';
    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin-top:8px;font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-secondary);';
    legend.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;"><svg width="12" height="14" viewBox="0 0 24 28"><path d="M12 28 L1 14 a14 14 0 1 1 22 0z" style="fill:var(--label-primary)"></path></svg>' + addr + '</span>'
      + ['Sold','Active','Pending','Expired'].map(s => '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:50%;background:' + this.kwiqCmaStatusColor(s) + ';"></span>' + s + '</span>').join('');
    const controls = document.createElement('div');
    controls.style.cssText = 'margin-top:' + (opts.vertical ? '16px' : '10px') + ';';
    const renderMap = () => { map.innerHTML = this.kwiqCmaMapSVG(st); };
    const changed = () => { renderMap(); onChange(); };
    const note = (t) => { const n = document.createElement('div'); n.style.cssText = 'font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);'; n.textContent = t; return n; };
    const renderControls = () => {
      controls.innerHTML = '';
      if (st.mode === 'radius') {
        const box = document.createElement('div');
        box.style.cssText = 'display:flex;align-items:center;gap:12px;';
        box.innerHTML = '<span style="font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--label-secondary);white-space:nowrap;">Radius</span><div data-cma-range style="position:relative;height:24px;flex:1;"><div data-track style="position:absolute;left:0;right:0;top:10px;height:4px;border-radius:999px;"></div><input type="range" min="0.25" max="3" step="0.25" aria-label="Search radius in miles"></div><span data-v style="font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--label-primary);min-width:44px;text-align:right;"></span>';
        const inp = box.querySelector('input'), tr = box.querySelector('[data-track]'), out = box.querySelector('[data-v]');
        const paint = () => { const p = (st.radius - 0.25) / 2.75 * 100; tr.style.background = 'linear-gradient(90deg,var(--action) ' + p + '%,var(--kw-neutral-200) ' + p + '%)'; out.textContent = st.radius + ' mi'; };
        inp.value = st.radius;
        inp.addEventListener('input', () => { st.radius = parseFloat(inp.value); paint(); changed(); });
        paint();
        controls.appendChild(box);
      } else if (st.mode === 'hoods' || st.mode === 'districts') {
        const list = st.mode === 'hoods' ? st.hoods : st.districts;
        const src = st.mode === 'hoods' ? d.hoods : d.districts;
        const chips = this.kwiqCmaChips(src.map(h => ({ v: h.name, t: h.name })), v => list.indexOf(v) > -1, v => { const i = list.indexOf(v); if (i > -1) list.splice(i, 1); else list.push(v); changed(); });
        chips.setAttribute('data-cma-area-chips', '');
        controls.appendChild(chips);
        const n = note(st.mode === 'hoods' ? 'Tap neighborhoods on the map or here to include them.' : 'Tap a school district on the map or here to include it.');
        n.style.marginTop = '8px';
        controls.appendChild(n);
      } else {
        const box = document.createElement('div');
        box.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;';
        box.appendChild(note(st.polyClosed ? 'Shape set. Only homes inside it count as comps.' : st.poly.length ? 'Keep clicking to add points. Click the first point to close the shape.' : 'Click the map to drop points and draw your own search area.'));
        const clear = this.kwiqCmaButton('Clear shape', 'data-cma-clear', false);
        clear.type = 'button';
        clear.style.padding = '8px 14px';
        clear.disabled = !st.poly.length;
        if (!st.poly.length) clear.style.opacity = '.5';
        clear.addEventListener('click', () => { st.poly = []; st.polyClosed = false; renderControls(); changed(); });
        box.appendChild(clear);
        controls.appendChild(box);
      }
    };
    map.addEventListener('click', (e) => {
      if (st.mode === 'hoods' || st.mode === 'districts') {
        const attr = st.mode === 'hoods' ? 'data-hood' : 'data-district';
        const hit = e.target.closest('[' + attr + ']');
        if (!hit) return;
        const list = st.mode === 'hoods' ? st.hoods : st.districts;
        const v = hit.getAttribute(attr), i = list.indexOf(v);
        if (i > -1) list.splice(i, 1); else list.push(v);
        const chips = controls.querySelector('[data-cma-area-chips]');
        if (chips && chips.__paint) chips.__paint();
        changed();
      } else if (st.mode === 'draw' && !st.polyClosed) {
        const svg = map.querySelector('svg');
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        const first = st.poly[0];
        if (first && st.poly.length > 2 && Math.hypot(p.x - first[0], p.y - first[1]) < 14) st.polyClosed = true;
        else st.poly.push([Math.round(p.x), Math.round(p.y)]);
        renderControls(); changed();
      }
    });
    paintTabs(); renderControls(); renderMap();
    return { tabs, map, legend, controls };
  }
  kwiqCmaCriteriaUI(st, onChange) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:20px;';
    const g1 = this.kwiqCmaSection('How many comps?');
    g1.appendChild(this.kwiqCmaChips(['3','5','6','10'].map(v => ({ v, t: v })), v => st.comps === v, v => { st.comps = v; onChange(); }));
    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;flex-wrap:wrap;gap:20px 32px;';
    const g2 = this.kwiqCmaSection('Status', 'Select all that apply');
    const g3 = this.kwiqCmaSection('Sold within');
    const syncWithin = () => { const on = st.status.indexOf('Sold') > -1; g3.style.opacity = on ? '1' : '.45'; g3.style.pointerEvents = on ? '' : 'none'; };
    g2.appendChild(this.kwiqCmaChips(['Sold','Active','Pending','Expired'].map(v => ({ v, t: v })), v => st.status.indexOf(v) > -1, v => {
      const i = st.status.indexOf(v);
      if (i > -1) { if (st.status.length > 1) st.status.splice(i, 1); } else st.status.push(v);
      syncWithin(); onChange();
    }));
    g3.appendChild(this.kwiqCmaChips(['3','6','12','24'].map(v => ({ v, t: v + ' mo' })), v => st.within === v, v => { st.within = v; onChange(); }));
    row2.appendChild(g2); row2.appendChild(g3);
    syncWithin();
    wrap.appendChild(g1); wrap.appendChild(row2);
    return wrap;
  }
  kwiqCmaFiltersUI(st, onChange, cols) {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:' + (cols === 1 ? '1fr' : 'repeat(auto-fit,minmax(240px,1fr))') + ';gap:' + (cols === 1 ? '22px' : '14px 28px') + ';';
    const num = (v) => Math.round(v).toLocaleString('en-US');
    grid.appendChild(this.kwiqCmaRange('Beds', st.beds, 1, 8, 1, v => v + (v === 8 ? '+' : ''), v => { st.beds = v; onChange(); }));
    grid.appendChild(this.kwiqCmaRange('Baths', st.baths, 1, 8, 0.5, v => v + (v === 8 ? '+' : ''), v => { st.baths = v; onChange(); }));
    grid.appendChild(this.kwiqCmaRange('Square feet', st.sqft, 1000, 10000, 100, v => num(v) + (v === 10000 ? '+' : ''), v => { st.sqft = v; onChange(); }));
    grid.appendChild(this.kwiqCmaRange('Year built', st.year, 1950, 2026, 1, v => String(v), v => { st.year = v; onChange(); }));
    return grid;
  }
  // Curation session: the comps shown (slots) and the next-best matches waiting to swap in (bench).
  kwiqCmaPick(sess) {
    const sig = JSON.stringify([sess.st, sess.subject && [sess.subject.addr, sess.subject.beds, sess.subject.bath, sess.subject.area]]);
    if (sess.slots && sess.sig === sig) return;
    const all = this.kwiqCmaMatches(sess.st), want = parseInt(sess.st.comps, 10);
    sess.slots = all.slice(0, want).map((c, i) => ({ n: i + 1, c, state: 'review' }));
    sess.bench = all.slice(want);
    sess.total = all.length;
    sess.sig = sig;
  }
  kwiqCmaAct(sess, n, act) {
    const s = sess.slots.find(x => String(x.n) === String(n));
    if (!s) return;
    if (act === 'keep') s.state = s.state === 'keep' ? 'review' : 'keep';
    else if (act === 'drop') s.state = 'drop';
    else if (act === 'undo') s.state = 'review';
    else if (act === 'swap' && sess.bench.length) { sess.bench.push(s.c); s.c = sess.bench.shift(); s.state = 'review'; }
  }
  kwiqCmaRowHTML(s, canSwap) {
    const c = s.c, dropped = s.state === 'drop';
    const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
    const btn = (kind, label, on, disabled, tip) => '<button type="button" data-act="' + kind + '" title="' + (tip || label) + '"' + (disabled ? ' disabled' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '" style="display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px;border-radius:999px;cursor:' + (disabled ? 'default' : 'pointer') + ';font:var(--fw-bold) 12px/16px var(--font-sans);opacity:' + (disabled ? '.4' : '1') + ';'
      + (on ? 'border:1px solid var(--action);background:var(--action);color:#fff;' : 'border:1px solid var(--divider);background:#fff;color:var(--label-secondary);') + '">' + this.kwiqCmaIcon(kind) + label + '</button>';
    const status = '<span style="display:inline-flex;align-items:center;gap:5px;font:var(--fw-bold) 11px/14px var(--font-sans);color:' + this.kwiqCmaStatusColor(c.status) + ';"><span style="width:7px;height:7px;border-radius:50%;background:' + this.kwiqCmaStatusColor(c.status) + ';"></span>' + this.kwiqCmaWhen(c) + '</span>';
    return '<div data-n="' + s.n + '" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--divider);">'
      + '<span style="width:24px;height:24px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 11px/1 var(--font-sans);' + (s.state === 'keep' ? 'background:var(--action);color:#fff;' : dropped ? 'background:var(--kw-neutral-300);color:#fff;' : 'background:#fff;color:var(--label-primary);border:2px solid var(--action);') + '">' + s.n + '</span>'
      + '<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;opacity:' + (dropped ? '.45' : '1') + ';">'
      + '<span aria-hidden="true" style="width:56px;height:44px;flex:none;border-radius:8px;background:linear-gradient(135deg,hsl(' + c.hue + ' 30% 78%),hsl(' + ((c.hue + 40) % 360) + ' 28% 58%));display:flex;align-items:flex-end;justify-content:center;overflow:hidden;">' + (c.photo ? '<img src="' + c.photo.replace(/"/g, '&quot;') + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;">' : '<svg width="40" height="28" viewBox="0 0 40 28"><path d="M4 28V14L20 3l16 11v14z" fill="rgba(255,255,255,.75)"/><rect x="16" y="17" width="8" height="11" fill="rgba(0,0,0,.18)"/></svg>') + '</span>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="display:flex;align-items:center;gap:8px;"><span style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + (dropped ? 'text-decoration:line-through;' : '') + '">' + c.addr + '</span><span title="How closely this home matches the subject" style="flex:none;padding:1px 7px;border-radius:999px;background:var(--kw-system-tint);color:var(--action);font:var(--fw-bold) 11px/16px var(--font-sans);">' + this.kwiqCmaScore(c) + '% match</span></div>'
      + '<div style="margin-top:2px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;">' + status + '<span style="font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--label-primary);">' + money(c.price) + '</span><span style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + money(c.price / c.area) + '/sqft</span></div>'
      + '<div style="margin-top:2px;font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-secondary);">' + c.beds + ' bd · ' + c.bath + ' ba · ' + c.area.toLocaleString('en-US') + ' sqft · Built ' + c.year + (c.hood ? ' · ' + c.hood : '') + ' · ' + this.kwiqCmaMi(c).toFixed(1) + ' mi</div>'
      + '</div></div>'
      + '<div style="flex:none;display:flex;gap:6px;">' + (dropped
        ? '<button type="button" data-act="undo" style="height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--divider);background:#fff;color:var(--action);cursor:pointer;font:var(--fw-bold) 12px/16px var(--font-sans);">Undo</button>'
        : btn('keep', s.state === 'keep' ? 'Kept' : 'Keep', s.state === 'keep') + btn('swap', 'Swap', false, !canSwap, canSwap ? 'Swap for the next-best match' : 'No more matches to swap in. Widen your settings for more.') + btn('drop', 'Drop', false))
      + '</div></div>';
  }
  kwiqCmaTally(sess) {
    const live = sess.slots.filter(s => s.state !== 'drop');
    const kept = sess.slots.filter(s => s.state === 'keep').length;
    let range = '—';
    if (live.length) {
      const area = this.kwiqCmaSubj().area;
      const ppsf = live.map(s => s.c.price / s.c.area).sort((a, b) => a - b);
      const r = (v) => '$' + (Math.round(v * area / 50000) * 0.05).toFixed(2) + 'M';
      range = r(ppsf[0]) + ' – ' + r(ppsf[ppsf.length - 1]);
    }
    return { live: live.length, kept, dropped: sess.slots.length - live.length, review: live.length - kept, range };
  }
  kwiqCmaHeader(title, onExpand) {
    const h = document.createElement('div');
    h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-2px 0 -4px;';
    h.innerHTML = '<span style="font:var(--fw-bold) 15px/20px var(--font-sans);color:var(--label-primary);">' + title + '</span>';
    const b = document.createElement('button');
    b.type = 'button';
    b.title = 'Expand to a full view';
    b.innerHTML = this.kwiqCmaIcon('expand') + '<span>Expand</span>';
    b.style.cssText = 'display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:none;border-radius:4px;background:var(--container-background);box-shadow:var(--shadow04);cursor:pointer;color:var(--label-primary);font:var(--fw-bold) 12px/16px var(--font-sans);';
    b.addEventListener('click', onExpand);
    h.appendChild(b);
    return h;
  }
  kwiqCmaFinish(sess, srcCard) {
    const live = sess.slots.filter(s => s.state !== 'drop').map(s => s.c);
    if (!live.length) return;
    if (srcCard) { srcCard.style.opacity = '.65'; srcCard.style.pointerEvents = 'none'; }
    this._cmaSubject = sess.subject || this._cmaSubject;
    this._cmaAddr = sess.subject ? sess.subject.addr : sess.addr;
    this._cmaTitle = (sess.title || '').trim();
    this._cmaSel = { comps: String(live.length), status: sess.st.status.slice(), ids: live.map(c => c.id) };
    this._cmaComps = live.map(c => ({ addr: c.addr, city: c.city, status: c.status, price: c.price, beds: c.beds, bath: c.bath, area: c.area, lot: c.lot, photo: c.photo || '', courtesy: c.courtesy || '', sold: c.status === 'Sold' ? this.kwiqCmaWhen(c).replace('Sold ', '') : c.status === 'Active' ? 'Active' : c.status === 'Pending' ? 'Listed' : 'Expired' }));
    this._cmaMarket = null;
    const subj = this._cmaSubject || {};
    const market = subj.lat0 && subj.zip ? this.kwiqUlsMarket(subj).catch(() => null) : Promise.resolve(null);
    const timeout = new Promise(r => setTimeout(() => r(null), 12000));
    this.kwiqRunLoader(['Adjusting your ' + live.length + ' comps for size, beds & baths…', 'Checking recent neighborhood trends…', 'Formatting your CMA report…'], 2200, () => Promise.race([market, timeout]).then(m => { this._cmaMarket = m; this.kwiqMsgs().appendChild(this.kwiqMakeCMACard()); this.kwiqSiteOffer(); }));
  }

  // ---- Inline settings card ----
  kwiqMakeCmaSettings(addr, preset, sess) {
    sess = sess || { addr, st: preset ? JSON.parse(JSON.stringify(preset)) : this.kwiqCmaDefaults(), step: 1, maxStep: 1 };
    if (!sess.subject) { sess.subject = this.kwiqCmaFindSubject(addr); sess.title = sess.title || 'CMA for ' + sess.subject.addr; }
    this._cmaSubject = sess.subject;
    const st = sess.st;
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro(preset ? 'Here are your settings for ' + addr + '. Adjust anything and I’ll pull a fresh set.' : 'Happy to build a CMA for ' + addr + '. Set how I should find comps and I’ll pull a set for you to review, or expand for a guided, step-by-step view.'));
    const card = document.createElement('div');
    card.setAttribute('data-cma-card', 'settings');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:20px;';
    card.__sess = sess;
    const count = document.createElement('span');
    const find = this.kwiqCmaButton('Find comps', 'data-cma-find', true);
    const update = () => {
      count.innerHTML = this.kwiqCmaCountHTML(st);
      const none = !this.kwiqCmaMatches(st).length;
      find.disabled = none; find.style.opacity = none ? '.5' : ''; find.style.cursor = none ? 'default' : 'pointer';
    };
    card.appendChild(this.kwiqCmaHeader('CMA settings', () => this.kwiqCmaBuilderOpen(sess, card, sess.step)));
    card.appendChild(this.kwiqCmaCriteriaUI(st, update));
    const g4 = this.kwiqCmaSection('Search area');
    const area = this.kwiqCmaAreaUI(addr, st, update);
    g4.appendChild(area.tabs); g4.appendChild(area.map); g4.appendChild(area.legend); g4.appendChild(area.controls);
    card.appendChild(g4);
    const g5 = this.kwiqCmaSection('Property filters');
    g5.appendChild(this.kwiqCmaFiltersUI(st, update));
    card.appendChild(g5);
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:14px;border-top:1px solid var(--divider);';
    count.setAttribute('aria-live', 'polite');
    count.style.cssText = 'font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);';
    find.type = 'button';
    find.addEventListener('click', () => {
      if (!this.kwiqCmaMatches(st).length) return;
      card.style.opacity = '.65'; card.style.pointerEvents = 'none';
      this.kwiqRunLoader(['Searching ' + (st.mode === 'radius' ? st.radius + ' mi around ' + addr : 'your search area') + '…', 'Filtering by status, size & age…', 'Ranking by similarity…'], 1800, () => {
        const row = this.kwiqMakeCmaResults(addr, st, sess);
        this.kwiqMsgs().appendChild(row);
        this.kwiqScrollToCard(row);
      });
    });
    foot.appendChild(count); foot.appendChild(find);
    card.appendChild(foot);
    update();
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  // ---- Inline results card ----
  kwiqMakeCmaResults(addr, st, sess) {
    sess = sess || { addr, st, step: 4, maxStep: 4 };
    sess.st = st;
    if (!sess.subject) { sess.subject = this.kwiqCmaFindSubject(addr); sess.title = sess.title || 'CMA for ' + sess.subject.addr; }
    this._cmaSubject = sess.subject;
    this.kwiqCmaPick(sess);
    sess.step = 4; sess.maxStep = Math.max(sess.maxStep || 1, 4);
    const want = parseInt(st.comps, 10);
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro(sess.total > want
      ? 'I found ' + sess.total + ' matches and ranked the ' + want + ' most similar to ' + addr + '. Keep the ones you like, drop the misses, or swap one for the next-best match.'
      : 'I found ' + sess.total + ' match' + (sess.total === 1 ? '' : 'es') + ' for ' + addr + (sess.total < want ? ' — fewer than the ' + want + ' you asked for, so you may want to widen your settings.' : '.') + ' Keep the ones you like or drop the misses.'));
    const card = document.createElement('div');
    card.setAttribute('data-cma-card', 'results');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;';
    const map = document.createElement('div');
    map.style.cssText = 'height:200px;border-radius:12px;overflow:hidden;border:1px solid var(--divider);';
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;';
    const summary = document.createElement('div');
    summary.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;padding:12px 14px;border-radius:12px;background:var(--kw-neutral-100);';
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
    const adjust = this.kwiqCmaButton('Adjust settings', 'data-cma-readjust', false);
    const create = this.kwiqCmaButton('Create CMA', 'data-cma-build', true);
    adjust.type = create.type = 'button';
    foot.appendChild(adjust); foot.appendChild(create);
    const render = () => {
      map.innerHTML = this.kwiqCmaMapSVG(st, { results: sess.slots });
      list.innerHTML = sess.slots.map(s => this.kwiqCmaRowHTML(s, sess.bench.length > 0)).join('');
      const t = this.kwiqCmaTally(sess);
      summary.innerHTML = '<span style="font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);"><b style="color:var(--label-primary);">' + t.kept + ' kept</b> · ' + t.dropped + ' dropped · ' + t.review + ' to review</span>'
        + '<span style="font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);">Value range from ' + t.live + ' comp' + (t.live === 1 ? '' : 's') + ': <b style="color:var(--label-primary);">' + t.range + '</b></span>';
      create.disabled = !t.live;
      create.style.opacity = t.live ? '' : '.5';
      create.textContent = t.live ? 'Create CMA with ' + t.live + ' comp' + (t.live === 1 ? '' : 's') : 'Create CMA';
    };
    card.__render = render;
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const n = b.closest('[data-n]').getAttribute('data-n'), act = b.getAttribute('data-act');
      this.kwiqCmaAct(sess, n, act);
      render();
      if (act === 'swap') { const r = list.querySelector('[data-n="' + n + '"]'); if (r) r.style.animation = 'kwiqRespIn .45s cubic-bezier(.16,1,.3,1) both'; }
    });
    adjust.addEventListener('click', () => {
      card.style.opacity = '.65'; card.style.pointerEvents = 'none';
      const row = this.kwiqMakeCmaSettings(addr, st, { addr, st: JSON.parse(JSON.stringify(st)), subject: sess.subject, title: sess.title, step: 2, maxStep: 2 });
      this.kwiqMsgs().appendChild(row);
      this.kwiqScrollToCard(row);
    });
    create.addEventListener('click', () => this.kwiqCmaFinish(sess, card));
    card.appendChild(this.kwiqCmaHeader('Review comps', () => this.kwiqCmaBuilderOpen(sess, card, 4)));
    card.appendChild(map); card.appendChild(list); card.appendChild(summary); card.appendChild(foot);
    render();
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }

  // ---- Expanded, step-by-step builder (covers the chat area of the modal) ----
  kwiqCmaBuilderOpen(sess, srcCard, step) {
    this.kwiqCmaBuilderClose(false);
    const main = document.querySelector('[data-dash-root] [data-kwiq-main]');
    if (!main) return;
    sess.step = step || sess.step || 1;
    sess.maxStep = Math.max(sess.maxStep || 1, sess.step);
    const el = document.createElement('div');
    el.setAttribute('data-cma-builder', '');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'CMA builder');
    el.style.cssText = 'position:absolute;inset:0;z-index:5;background:var(--page-background);display:flex;flex-direction:column;animation:kwiqBuilderIn .32s cubic-bezier(.16,1,.3,1) both;';
    main.appendChild(el);
    this._cmaBuilder = { el, sess, srcCard };
    this.kwiqCmaBuilderRender();
  }
  kwiqCmaBuilderClose(sync) {
    const b = this._cmaBuilder;
    if (!b) return;
    this._cmaBuilder = null;
    b.el.remove();
    if (!sync || !b.srcCard || !b.srcCard.isConnected) return;
    // Bring the inline card in line with whatever changed in the builder.
    const kind = b.srcCard.getAttribute('data-cma-card');
    if ((kind === 'results' || kind === 'launcher') && b.srcCard.__render) { b.srcCard.__render(); return; }
    if (kind === 'settings') {
      const fresh = this.kwiqMakeCmaSettings(b.sess.addr, null, b.sess).querySelector('[data-cma-card="settings"]');
      b.srcCard.replaceWith(fresh);
    }
  }
  kwiqCmaBuilderRender() {
    const b = this._cmaBuilder;
    if (!b) return;
    const { el, sess } = b;
    if (sess.subject) this._cmaSubject = sess.subject;
    const st = sess.st, addr = sess.subject ? sess.subject.addr : (sess.addr || 'the property');
    const steps = [1, 2, 3, 4, 5].map(n => this.kwiqCmaStepLabel(n));
    el.innerHTML = '';

    // Header: breadcrumb back to chat, stepper
    const head = document.createElement('div');
    head.style.cssText = 'flex:none;position:relative;display:flex;align-items:center;gap:16px;height:72px;padding:0 24px 0 16px;';
    head.innerHTML = '<span style="position:absolute;left:16px;right:16px;bottom:0;height:1px;background:var(--divider);"></span>';
    // Breadcrumb back to the chat (minimizes the builder; the inline card keeps everything in sync).
    const crumb = document.createElement('div');
    crumb.style.cssText = 'flex:none;display:flex;align-items:center;gap:8px;min-width:0;';
    const backToChat = document.createElement('button');
    backToChat.type = 'button';
    backToChat.title = 'Back to chat';
    backToChat.setAttribute('aria-label', 'Back to chat');
    backToChat.setAttribute('data-cma-crumb', '');
    backToChat.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
    backToChat.style.cssText = 'width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;border:none;border-radius:8px;background:transparent;cursor:pointer;color:var(--label-primary);';
    backToChat.addEventListener('click', () => this.kwiqCmaBuilderClose(true));
    const crumbTitle = document.createElement('span');
    crumbTitle.style.cssText = 'font:var(--fw-bold) 16px/24px var(--font-sans);color:var(--label-primary);white-space:nowrap;';
    crumbTitle.setAttribute('data-cma-crumb-title', '');
    crumbTitle.textContent = (sess.title || '').trim() || 'New CMA';
    crumb.appendChild(backToChat); crumb.appendChild(crumbTitle);
    head.appendChild(crumb);
    const stepper = document.createElement('ol');
    stepper.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:6px;list-style:none;margin:0;padding:0;min-width:0;';
    steps.forEach((label, i) => {
      const n = i + 1, done = n < sess.step, cur = n === sess.step, reach = n <= sess.maxStep;
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;align-items:center;gap:6px;';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.disabled = !reach || cur;
      if (cur) btn.setAttribute('aria-current', 'step');
      btn.style.cssText = 'display:inline-flex;align-items:center;gap:8px;border:none;background:transparent;padding:6px 8px;border-radius:999px;cursor:' + (reach && !cur ? 'pointer' : 'default') + ';font:var(--fw-bold) 13px/16px var(--font-sans);color:' + (cur ? 'var(--label-primary)' : reach ? 'var(--label-secondary)' : 'var(--label-tertiary)') + ';';
      btn.innerHTML = '<span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 11px/1 var(--font-sans);' + (done ? 'background:var(--action);color:#fff;' : cur ? 'background:var(--action);color:#fff;box-shadow:0 0 0 3px var(--kw-system-tint);' : 'background:var(--kw-neutral-200);color:var(--label-secondary);') + '">' + (done ? this.kwiqCmaIcon('check') : n) + '</span>' + label;
      btn.addEventListener('click', () => go(n));
      li.appendChild(btn);
      if (n < steps.length) { const sep = document.createElement('span'); sep.setAttribute('aria-hidden', 'true'); sep.style.cssText = 'width:24px;height:2px;border-radius:2px;background:' + (n < sess.step ? 'var(--action)' : 'var(--kw-neutral-200)') + ';'; li.appendChild(sep); }
      stepper.appendChild(li);
    });
    stepper.style.justifyContent = 'flex-end';
    head.appendChild(stepper);
    el.appendChild(head);

    // Body
    const body = document.createElement('div');
    body.style.cssText = 'flex:1;min-height:0;overflow-y:auto;padding:24px;';
    const inner = document.createElement('div');
    inner.style.cssText = 'max-width:1080px;margin:0 auto;animation:kwiqRespIn .4s cubic-bezier(.16,1,.3,1) both;';
    body.appendChild(inner);
    const panel = (pad) => { const p = document.createElement('div'); p.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:' + (pad || '20px') + ';'; return p; };
    const heading = (t, sub) => { const h = document.createElement('div'); h.style.cssText = 'margin-bottom:16px;'; h.innerHTML = '<div style="font:var(--fw-extrabold) 20px/24px var(--font-sans);color:var(--label-primary);">' + t + '</div>' + (sub ? '<div style="margin-top:4px;font:var(--fw-regular) 14px/20px var(--font-sans);color:var(--label-secondary);">' + sub + '</div>' : ''); return h; };

    // Footer
    const foot = document.createElement('div');
    foot.style.cssText = 'flex:none;position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;';
    foot.innerHTML = '<span style="position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--divider);"></span>';
    const status = document.createElement('span');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);';
    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;';
    const back = this.kwiqCmaButton('Back', 'data-cma-back', false);
    const next = this.kwiqCmaButton('Next', 'data-cma-next', true);
    back.type = next.type = 'button';
    if (sess.step === 1) back.style.visibility = 'hidden';
    btns.appendChild(back); btns.appendChild(next);
    foot.appendChild(status); foot.appendChild(btns);
    const setNext = (label, ok) => { next.textContent = label; next.disabled = !ok; next.style.opacity = ok ? '' : '.5'; next.style.cursor = ok ? 'pointer' : 'default'; };
    const refreshCount = () => { status.innerHTML = this.kwiqCmaCountHTML(st); const ok = this.kwiqCmaMatches(st).length > 0; setNext(sess.step === 3 ? 'Find comps' : 'Next', ok); };
    const go = (n) => { sess.step = n; sess.maxStep = Math.max(sess.maxStep, n); this.kwiqCmaBuilderRender(); };

    if (sess.step === 1) {
      inner.appendChild(sess.subject
        ? heading('Confirm the subject property', 'Check the details from public records. I’ll use them to find and adjust comparable sales.')
        : heading('Which property is this CMA for?', 'Add the subject property. I’ll use it to find and adjust comparable sales.'));
      this.kwiqCmaPropertyStep(sess, inner, status, setNext, () => this.kwiqCmaBuilderRender());
      next.addEventListener('click', () => go(2));
    } else if (sess.step === 2) {
      inner.appendChild(heading('Where should I look for comps?', 'Choose how to define the search area. Pins update as you go.'));
      const grid = document.createElement('div');
      grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;';
      const area = this.kwiqCmaAreaUI(addr, st, refreshCount, { vertical: true, mapHeight: 460 });
      const left = document.createElement('div'); left.style.cssText = 'flex:1 1 480px;min-width:0;';
      left.appendChild(area.map); left.appendChild(area.legend);
      const right = panel(); right.style.flex = '0 1 320px';
      right.appendChild(this.kwiqCmaSection('Search by'));
      right.appendChild(area.tabs); right.appendChild(area.controls);
      grid.appendChild(left); grid.appendChild(right);
      inner.appendChild(grid);
      refreshCount();
      next.addEventListener('click', () => go(3));
    } else if (sess.step === 3) {
      const s = this.kwiqCmaSubj();
      inner.appendChild(heading('What should count as a comp?', 'Subject: ' + s.beds + ' bd · ' + s.bath + ' ba · ' + s.area.toLocaleString('en-US') + ' sqft · Built ' + s.year + ' · ' + this.kwiqCmaAreaLabel(st)));
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;align-items:start;';
      const a = panel(); a.appendChild(heading('Listing criteria')); a.firstChild.style.cssText = 'margin-bottom:16px;'; a.firstChild.firstChild.style.fontSize = '16px';
      a.appendChild(this.kwiqCmaCriteriaUI(st, refreshCount));
      const f = panel(); f.appendChild(heading('Property filters')); f.firstChild.firstChild.style.fontSize = '16px';
      f.appendChild(this.kwiqCmaFiltersUI(st, refreshCount, 1));
      grid.appendChild(a); grid.appendChild(f);
      inner.appendChild(grid);
      refreshCount();
      next.addEventListener('click', () => {
        if (!this.kwiqCmaMatches(st).length) return;
        next.disabled = true; next.textContent = 'Finding comps…';
        setTimeout(() => { this.kwiqCmaPick(sess); go(4); }, 700);
      });
    } else if (sess.step === 4) {
      this.kwiqCmaPick(sess);
      const want = parseInt(st.comps, 10);
      inner.appendChild(heading('Review your comps', sess.total > want ? 'Ranked the ' + want + ' most similar of ' + sess.total + ' matches. Keep, drop, or swap until the set looks right.' : sess.total + ' match' + (sess.total === 1 ? '' : 'es') + ' found. Keep the ones you like or drop the misses.'));
      const grid = document.createElement('div');
      grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;';
      const listPanel = panel('4px 20px 8px'); listPanel.style.flex = '1 1 520px'; listPanel.style.minWidth = '0';
      const list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;margin-top:-1px;';
      listPanel.appendChild(list);
      const side = document.createElement('div');
      side.style.cssText = 'flex:0 1 380px;min-width:280px;position:sticky;top:0;display:flex;flex-direction:column;gap:12px;';
      const map = document.createElement('div');
      map.style.cssText = 'height:300px;border-radius:12px;overflow:hidden;border:1px solid var(--divider);';
      const sum = panel('16px');
      side.appendChild(map); side.appendChild(sum);
      grid.appendChild(listPanel); grid.appendChild(side);
      inner.appendChild(grid);
      const render = () => {
        map.innerHTML = this.kwiqCmaMapSVG(st, { results: sess.slots });
        list.innerHTML = sess.slots.map(s => this.kwiqCmaRowHTML(s, sess.bench.length > 0)).join('');
        const t = this.kwiqCmaTally(sess);
        const stat = (v, l) => '<div style="flex:1;"><div style="font:var(--fw-extrabold) 20px/24px var(--font-sans);color:var(--label-primary);">' + v + '</div><div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + l + '</div></div>';
        sum.innerHTML = '<div style="display:flex;gap:12px;">' + stat(t.kept, 'Kept') + stat(t.review, 'To review') + stat(t.dropped, 'Dropped') + '</div>'
          + '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--divider);font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">Value range from ' + t.live + ' comp' + (t.live === 1 ? '' : 's') + '</div><div style="font:var(--fw-extrabold) 20px/28px var(--font-sans);color:var(--label-primary);">' + t.range + '</div>';
        status.innerHTML = '<b style="color:var(--label-primary);">' + t.live + ' comp' + (t.live === 1 ? '' : 's') + '</b> will go into your CMA';
        setNext('Next', t.live > 0);
      };
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn || btn.disabled) return;
        const n = btn.closest('[data-n]').getAttribute('data-n'), act = btn.getAttribute('data-act');
        this.kwiqCmaAct(sess, n, act);
        render();
        if (act === 'swap') { const r = list.querySelector('[data-n="' + n + '"]'); if (r) r.style.animation = 'kwiqRespIn .45s cubic-bezier(.16,1,.3,1) both'; }
      });
      render();
      list.firstChild && (list.firstChild.style.borderTop = 'none');
      next.addEventListener('click', () => go(5));
    } else {
      this.kwiqCmaPick(sess);
      const t = this.kwiqCmaTally(sess);
      const live = sess.slots.filter(s => s.state !== 'drop');
      inner.style.maxWidth = '760px';
      inner.appendChild(heading('Ready to create your CMA', 'I’ll adjust each comp against ' + addr + ' and build a report you can review and share.'));
      const p = panel();
      const rng = (v, f) => v[0] === v[1] ? f(v[0]) : f(v[0]) + ' – ' + f(v[1]);
      const rows = [
        ['Search area', this.kwiqCmaAreaLabel(st)],
        ['Status', st.status.join(', ') + (st.status.indexOf('Sold') > -1 ? ' · sold within ' + st.within + ' mo' : '')],
        ['Beds / baths', rng(st.beds, String) + ' bd · ' + rng(st.baths, String) + ' ba'],
        ['Square feet', rng(st.sqft, v => v.toLocaleString('en-US'))],
        ['Year built', rng(st.year, String)],
      ];
      p.innerHTML = '<div style="font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);margin-bottom:4px;">Settings</div>'
        + rows.map(r => '<div style="display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-top:1px solid var(--divider);"><span style="font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-tertiary);">' + r[0] + '</span><span style="font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);text-align:right;">' + r[1] + '</span></div>').join('')
        + '<div style="font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);margin:18px 0 4px;">Comps (' + live.length + ')</div>'
        + live.map(s => '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--divider);"><span style="width:20px;height:20px;flex:none;border-radius:50%;background:var(--action);color:#fff;display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 10px/1 var(--font-sans);">' + s.n + '</span><span style="flex:1;min-width:0;font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);">' + s.c.addr + '</span><span style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + this.kwiqCmaWhen(s.c) + '</span><span style="width:96px;text-align:right;font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);">$' + s.c.price.toLocaleString('en-US') + '</span></div>').join('')
        + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;padding:14px 16px;border-radius:12px;background:var(--kw-neutral-100);"><span style="font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);">Estimated value range</span><span style="font:var(--fw-extrabold) 18px/24px var(--font-sans);color:var(--label-primary);">' + t.range + '</span></div>';
      inner.appendChild(p);
      status.innerHTML = 'You can still go back and change anything.';
      setNext('Create CMA', t.live > 0);
      next.addEventListener('click', () => {
        const src = b.srcCard;
        this.kwiqCmaBuilderClose(false);
        this.kwiqCmaFinish(sess, src && src.isConnected ? src : null);
      });
    }
    back.addEventListener('click', () => go(Math.max(1, sess.step - 1)));
    el.appendChild(body);
    el.appendChild(foot);
  }
  kwiqMsgs() { return document.querySelector('[data-dash-root] [data-kwiq-messages]'); }
  kwiqCmaAsk(text) {
    this.kwiqEnterChat();
    // Build a best-practice draft right away; only ask for the property when the prompt doesn't name one.
    const addr = this.kwiqParseAddress(text);
    if (addr) this.kwiqCmaAutoBuild(addr); else this.kwiqCmaAskAddress();
  }

  // ============ Auto-built CMA: best-practice draft the agent can tweak ============
  // One adjustment model for the draft card and the report: adjust each comp toward the subject.
  // Rates scale with the comps' market instead of fixed dollars: living area at 40% of median $/sqft
  // (land is already in the price), a bed at 2% and a bath at 1% of median price, lot at 5% of median
  // price per acre, capped at ±10% of the comp's price so acreage can't swamp the value.
  kwiqCmaRates(comps) {
    const med = (a) => { const v = a.filter(x => x > 0).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : 0; };
    const price = med(comps.map(c => c.price)), ppsf = med(comps.map(c => c.area ? c.price / c.area : 0));
    const r = (v, n) => Math.max(n, Math.round(v / n) * n);
    return price ? { sqft: r(ppsf * 0.4, 5), bed: r(price * 0.02, 1000), bath: r(price * 0.01, 1000), lot: r(price * 0.05, 1000), lotCap: 0.1 }
      : { sqft: 300, bed: 50000, bath: 30000, lot: 400000, lotCap: 0.1 };
  }
  kwiqCmaAdjust(c, s, R) {
    R = R || this.kwiqCmaRates([c]);
    const cap = c.price * R.lotCap;
    const adj = { sqft: Math.round((s.area - c.area) * R.sqft), bed: (s.beds - c.beds) * R.bed, bath: Math.round((s.bath - c.bath) * R.bath), lot: Math.round(Math.max(-cap, Math.min(cap, ((s.lot || 0) - (c.lot || 0)) * R.lot))) };
    adj.total = adj.sqft + adj.bed + adj.bath + adj.lot;
    return { adj, adjusted: c.price + adj.total };
  }
  kwiqCmaValue(comps, s) {
    if (!comps.length) return null;
    const R = this.kwiqCmaRates(comps);
    const r25 = (v) => Math.round(v / 25000) * 25000;
    const estimate = r25(comps.reduce((t, c) => t + this.kwiqCmaAdjust(c, s, R).adjusted, 0) / comps.length);
    return { estimate, low: r25(estimate * 0.94), high: r25(estimate * 1.06), rates: R };
  }
  // Start tight (sold in 6 mo, 1 mi, ±20% size) and widen one notch at a time until there are at least 4 closed sales.
  kwiqCmaAutoSettings(s) {
    this._cmaSubject = s;
    const r100 = (v) => Math.round(v / 100) * 100;
    const ladder = [[6, 1, 0.2], [6, 1.5, 0.2], [12, 1.5, 0.2], [12, 2, 0.25], [12, 2.5, 0.3], [24, 3, 0.35]];
    const trail = [];
    let st;
    for (const [within, radius, pct] of ladder) {
      st = this.kwiqCmaDefaults();
      this.kwiqCmaRecenter(st, s);
      Object.assign(st, { comps: '5', status: ['Sold'], within: String(within), mode: 'radius', radius, sqft: [Math.max(1000, r100(s.area * (1 - pct))), Math.min(10000, r100(s.area * (1 + pct)))] });
      const n = this.kwiqCmaMatches(st).length;
      trail.push({ within, radius, pct, n });
      if (n >= 4) break;
    }
    return { st, trail };
  }
  kwiqCmaAskAddress() {
    const msgs = this.kwiqMsgs();
    const typing = this.kwiqMakeTyping();
    msgs.appendChild(typing);
    setTimeout(() => {
      typing.remove();
      const col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
      col.appendChild(this.kwiqCmaIntro('Happy to build a CMA. Which property is it for? Pick one or type the address, and I’ll take care of the comps.'));
      const chips = document.createElement('div');
      chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
      this.kwiqCmaSubjects().slice(0, 4).forEach(s => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = s.addr;
        b.style.cssText = this.kwiqCmaChipStyle(false);
        b.addEventListener('click', () => {
          if (!this._cmaAwaitAddr) return;
          this._cmaAwaitAddr = false;
          chips.style.opacity = '.5'; chips.style.pointerEvents = 'none';
          msgs.appendChild(this.kwiqMakeUser(s.addr));
          this.kwiqCmaAutoBuild(s.addr);
        });
        chips.appendChild(b);
      });
      col.appendChild(chips);
      msgs.appendChild(this.kwiqMakeRow(col));
      msgs.scrollTop = msgs.scrollHeight;
      this._cmaAwaitAddr = true;
    }, 600);
  }
  kwiqCmaAutoBuild(addr) {
    // Live ULS data when the local server has credentials; otherwise the sample homes.
    const live = this.kwiqUlsLoad(addr).catch(e => ({ error: e.message }));
    const lines = ['Looking up ' + addr + '…', 'Finding closed sales nearby…', 'Matching size, beds & baths…', 'Ranking the best comps…'];
    this.kwiqRunLoader(lines, 650 * lines.length, () => live.then(r => {
      let subject, source;
      if (r && r.subject) {
        this._cmaData = Object.assign({}, this.kwiqCmaData(true), { pool: r.pool, subject: r.subject, hoods: [], districts: [], live: true });
        subject = r.subject; source = 'live';
      } else {
        this._cmaData = null;
        subject = this.kwiqCmaFindSubject(addr);
        source = r && r.error === 'notFound' ? 'notFound' : 'sample';
      }
      const { st, trail } = this.kwiqCmaAutoSettings(subject);
      const sess = { addr: subject.addr, subject, title: 'CMA for ' + subject.addr, titleEdited: false, st, trail, auto: JSON.parse(JSON.stringify(st)), autoSubj: JSON.stringify(subject), step: 4, maxStep: 5, source };
      const row = this.kwiqMakeCmaDraft(sess);
      this.kwiqMsgs().appendChild(row);
      this.kwiqScrollToCard(row);
    }));
  }

  // ============ ULS (KW Unified Listing Service) via the local server's /api/uls proxy ============
  async kwiqUlsLoad(addr) {
    const post = (body) => fetch('/api/uls/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error('ULS ' + r.status + ' ' + t.slice(0, 200)); }));
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\b(drive|dr)\b/g, 'dr').replace(/\b(road|rd)\b/g, 'rd').replace(/\b(street|st)\b/g, 'st').replace(/\s+/g, ' ').trim();
    // 1. Subject. `fullStreetAddress` is an exact, case-sensitive match, so try the spellings MLSs use.
    const rows = (await this.kwiqUlsFindAddress(addr, post)).filter(l => this.kwiqUlsLatLng(l.coordinates));
    const same = rows.filter(l => norm(this.kwiqUlsAddr(l)) === norm(addr));
    // A property has one record per listing; use the latest one that has the home's details.
    const raw = (same.length || (rows[0] && rows[0]._fuzzy) ? same : rows).find(l => l.property && l.property.totalBed && l.property.livingArea) || same[0] || (rows[0] && !rows[0]._fuzzy ? rows[0] : null);
    if (!raw) return { error: 'notFound' };
    const subj = this.kwiqUlsMap(raw);
    const [lat0, lng0] = this.kwiqUlsLatLng(raw.coordinates);
    Object.assign(subj, { x: 330, y: 170, lat0, lng0, garage: (raw.property && raw.property.parking && raw.property.parking.parkingTotal) || 0, lastStatus: subj.status, lastDate: raw.closeDate || raw.listDate || '' });
    // 2. Pool: everything the widest auto-search step could use (3 mi, 24 months, ±35% size, ±1 bed), plus nearby actives and pendings.
    const since = new Date(); since.setMonth(since.getMonth() - 24);
    const near = { geoNear: { coordinates: raw.coordinates, radiusMi: 3 } };
    const like = Object.assign(raw.propertySubtype ? { propertySubtypeGranular: [raw.propertySubtype] } : {},
      subj.area ? { livingArea: { min: Math.round(subj.area * 0.65), max: Math.round(subj.area * 1.35) } } : {},
      subj.beds ? { bedrooms: { min: Math.max(0, subj.beds - 1), max: subj.beds + 1 } } : {});
    const all = async (filters) => {
      const q = (offset) => post({ query: { filters, location: near }, pagination: { max: 100, offset } });
      const first = await q(0);
      const total = Math.min(Number(first.pagination && first.pagination.total) || 0, 500);
      const rest = [];
      for (let o = 100; o < total; o += 100) rest.push(q(o));
      return [first].concat(await Promise.all(rest));
    };
    const pages = [].concat(...await Promise.all([
      all(Object.assign({ listingCategory: ['sold'], closeDate: { min: since.toISOString() } }, like)),
      all(Object.assign({ listingStatus: ['active', 'pending'] }, like)),
    ]));
    const seen = new Set([raw.id]);
    const pool = [];
    pages.forEach(p => (p.results || []).forEach(l => {
      if (seen.has(l.id) || (l.marketingInfo && l.marketingInfo.displayListing === false)) return;
      seen.add(l.id);
      const c = this.kwiqUlsMap(l);
      if (!c || !(c.price > 0) || !(c.area > 0) || norm(c.addr) === norm(subj.addr)) return;
      // Project lat/lng onto the stylized map: subject at (330,170), 110 units per mile.
      c.x = Math.round(330 + (c.lng - lng0) * 69.17 * Math.cos(lat0 * Math.PI / 180) * 110);
      c.y = Math.round(170 - (c.lat - lat0) * 69 * 110);
      pool.push(c);
    }));
    return { subject: subj, pool };
  }
  // ZIP-level market stats for the report: last 6 months of closed sales vs the 6 months before, plus active inventory.
  async kwiqUlsMarket(subj) {
    const post = (body) => fetch('/api/uls/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('ULS ' + r.status)));
    const base = Object.assign({ postalCode: subj.zip }, subj.subtype ? { propertySubtypeGranular: [subj.subtype] } : {});
    const ago = (mo) => { const d = new Date(); d.setMonth(d.getMonth() - mo); return d.toISOString(); };
    const sold = async (min, max) => {
      const q = (offset) => post({ query: { filters: Object.assign({ listingCategory: ['sold'], closeDate: max ? { min, max } : { min } }, base) }, pagination: { max: 100, offset } });
      const first = await q(0);
      const total = Math.min(Number(first.pagination && first.pagination.total) || 0, 500);
      const rest = [];
      for (let o = 100; o < total; o += 100) rest.push(q(o));
      return [].concat(...[first].concat(await Promise.all(rest)).map(p => p.results || []));
    };
    const med = (a) => { const v = a.filter(x => x > 0 && isFinite(x)).sort((x, y) => x - y); if (!v.length) return 0; const h = Math.floor(v.length / 2); return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };
    const stats = (rows) => {
      const f = (l) => l.financials || {}, area = (l) => ((l.property || {}).livingArea || {}).value;
      return {
        n: rows.length,
        ppsf: med(rows.map(l => f(l).closePrice / area(l))),
        dom: med(rows.map(l => l.daysOnMarket)),
        ratio: med(rows.map(l => f(l).closePrice / (f(l).currentListPrice || f(l).originalListPrice))),
        price: med(rows.map(l => f(l).closePrice)),
      };
    };
    const [now, before, act] = await Promise.all([
      sold(ago(6)), sold(ago(12), ago(6)),
      post({ query: { filters: Object.assign({ listingStatus: ['active'] }, base) }, pagination: { max: 1 } }),
    ]);
    const typeLabel = { singleFamilyDetached: 'single-family', townhouse: 'townhomes', condominium: 'condos' }[subj.subtype] || 'homes';
    return { key: subj.zip + '|' + now.length, now: stats(now), before: stats(before), active: Number(act.pagination && act.pagination.total) || 0, typeLabel };
  }
  // Returns every record at the address, trying common spellings in order and stopping at the first hit.
  async kwiqUlsFindAddress(addr, post) {
    const SUF = { dr: 'Drive', rd: 'Road', st: 'Street', ln: 'Lane', ave: 'Avenue', blvd: 'Boulevard', ct: 'Court', cir: 'Circle', pl: 'Place', ter: 'Terrace', trl: 'Trail', pkwy: 'Parkway', hwy: 'Highway', cv: 'Cove', way: 'Way', path: 'Path' };
    const ABBR = {}; Object.keys(SUF).forEach(k => { ABBR[SUF[k].toLowerCase()] = k.charAt(0).toUpperCase() + k.slice(1); });
    const title = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    const words = addr.replace(/[.,]/g, ' ').trim().split(/\s+/);
    const last = words[words.length - 1].toLowerCase();
    const body = words.slice(0, -1);
    const longSuf = SUF[last] || title(last), shortSuf = ABBR[last] || title(last);
    const variants = [...new Set([
      addr.trim(),
      body.map(title).concat(longSuf).join(' '),
      body.map(title).concat(shortSuf).join(' '),
      body.map((w, i) => i === 0 ? w : w.toUpperCase()).concat(longSuf).join(' '),
    ])];
    for (const v of variants) {
      const r = await post({ query: { filters: { fullStreetAddress: v } }, sort: { sortField: 'mlsUpdateDate', sortOrder: 'desc' }, pagination: { max: 20 } });
      if (r.results && r.results.length) return r.results;
    }
    // Last resort: free-text search, which also returns other properties; the caller keeps exact matches only.
    const r = await post({ query: { filters: { text: addr } }, pagination: { max: 20 } });
    return (r.results || []).map(l => Object.assign(l, { _fuzzy: true }));
  }
  // ULS coordinates may come as [lng, lat] (GeoJSON) or [lat, lng]; US longitudes are negative.
  kwiqUlsLatLng(c) {
    if (!Array.isArray(c) || c.length < 2 || typeof c[0] !== 'number') return null;
    return c[0] < 0 && c[1] > 0 ? [c[1], c[0]] : [c[0], c[1]];
  }
  kwiqUlsAddr(l) {
    const a = l.address || {};
    return a.primaryAddress || [a.streetNumber, a.streetName].filter(Boolean).join(' ') || a.displayAddress || '';
  }
  kwiqUlsMap(l) {
    const ll = this.kwiqUlsLatLng(l.coordinates);
    if (!ll) return null;
    const p = l.property || {}, a = l.address || {}, f = l.financials || {}, mk = l.marketingInfo || {}, loc = p.location || {};
    // ULS returns the unit as `units` (the spec says `unitType`); accept either.
    const dim = (d, unit) => { if (!d || !d.value) return 0; const u = d.units || d.unitType; return u === unit ? d.value : unit === 'ACRES' && u === 'SQ_FT' ? d.value / 43560 : unit === 'SQ_FT' && u === 'SQ_MT' ? d.value * 10.764 : unit === 'ACRES' && u === 'HECTARES' ? d.value * 2.471 : d.value; };
    const s = (l.listStatus || '') + ' ' + (l.listCategory || '');
    const status = /sold|closed/i.test(s) ? 'Sold' : /pending|undercontract/i.test(s) ? 'Pending' : /active|comingsoon|sale/i.test(s) ? 'Active' : 'Expired';
    const closeDate = status === 'Sold' && l.closeDate ? l.closeDate : '';
    const photos = (l.photos || []).slice().sort((x, y) => (x.photoOrder || 0) - (y.photoOrder || 0));
    const id = String(l.id);
    let hue = 0; for (let i = 0; i < id.length; i++) hue = (hue * 31 + id.charCodeAt(i)) % 360;
    return {
      id, addr: this.kwiqUlsAddr(l), city: [a.city, [a.state, a.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      lat: ll[0], lng: ll[1], status,
      price: (status === 'Sold' ? f.closePrice : 0) || f.currentListPrice || f.originalListPrice || 0,
      // totalBath counts half baths as whole ones, so prefer full + half / 2.
      beds: p.totalBed || 0, bath: p.fullBath ? p.fullBath + 0.5 * (p.halfBaths || 0) : (p.totalBath || 0),
      area: Math.round(dim(p.livingArea, 'SQ_FT')), lot: Math.round(dim(p.lotSize, 'ACRES') * 100) / 100, year: p.yearBuilt || 0,
      closeDate, m: closeDate ? Math.max(0, Math.round((Date.now() - new Date(closeDate)) / (30.44 * 864e5))) : undefined,
      photo: mk.displayPhoto === false || !photos.length ? '' : photos[0].photoUrl,
      courtesy: mk.courtesyOfList || '', hue,
      hood: (loc.neighborhoods && loc.neighborhoods[0] && loc.neighborhoods[0].name) || loc.subdivision || '',
      district: ((loc.schools || []).find(x => x.district) || {}).district || '',
      zip: a.postalCode || '', subtype: l.propertySubtype || '',
      type: 'Residential', sub: l.propertySubtype === 'townhouse' ? 'Townhouse' : l.propertySubtype === 'condominium' ? 'Condominium' : 'Single family',
    };
  }
  // What I did and why, one row per best practice. `step` is the builder step that edits it.
  kwiqCmaPractices(sess) {
    const st = sess.st, a = sess.auto, s = sess.subject;
    const fmt = (v) => Math.round(v).toLocaleString('en-US');
    const rng = (v, f) => v[0] === v[1] ? f(v[0]) : f(v[0]) + '–' + f(v[1]);
    const same = (keys) => keys.every(k => JSON.stringify(st[k]) === JSON.stringify(a[k]));
    const soldOnly = st.status.length === 1 && st.status[0] === 'Sold';
    const others = this.kwiqCmaData().pool.filter(c => (c.status === 'Active' || c.status === 'Pending') && this.kwiqCmaInArea(c, st)).length;
    const want = parseInt(st.comps, 10), shown = Math.min(sess.total, want);
    const R = this.kwiqCmaRates((sess.slots || []).filter(x => x.state !== 'drop').map(x => x.c));
    const k = (v) => v >= 1000 ? '$' + Math.round(v / 1000) + 'K' : '$' + v;
    const rateText = '$' + R.sqft + '/sqft · ' + k(R.bed) + ' per bed · ' + k(R.bath) + ' per bath · ' + k(R.lot) + ' per acre of lot (max ±10%)';
    const rows = [
      { step: 1, edited: JSON.stringify(s) !== sess.autoSubj, title: sess.source === 'live' ? 'Started from the latest MLS record' : 'Started from public records', did: s.beds + ' bd · ' + s.bath + ' ba · ' + fmt(s.area) + ' sqft · built ' + s.year, why: 'Every comp is measured against these details, so give them a quick check.' },
      { step: 3, edited: !same(['status', 'within']), title: soldOnly ? 'Used closed sales from the last ' + st.within + ' months' : 'Used ' + st.status.join(', ').toLowerCase() + ' listings', did: soldOnly ? 'Sold homes only' : 'Includes listings that haven’t closed', why: 'Closed sales are proven prices. Fresher is better, and 6 months is ideal.' },
      { step: 2, edited: !same(['mode', 'radius', 'hoods', 'districts', 'poly']), title: st.mode === 'radius' ? 'Searched within ' + st.radius + ' mi' : 'Searched ' + this.kwiqCmaAreaLabel(st), did: 'Centered on ' + s.addr, why: 'Buyers compare homes with the same schools, commute, and neighborhood feel.' },
      { step: 3, edited: !same(['beds', 'baths', 'sqft', 'year']), title: 'Matched similar homes', did: rng(st.sqft, fmt) + ' sqft · ' + rng(st.beds, String) + ' bd · ' + rng(st.baths, String) + ' ba · built ' + st.year[0] + ' or later', why: 'The more alike the homes, the smaller the adjustments and the more reliable the value.' },
      { step: 4, edited: false, title: 'Picked the ' + shown + ' closest match' + (shown === 1 ? '' : 'es'), did: 'Ranked ' + sess.total + ' match' + (sess.total === 1 ? '' : 'es') + ' by size, age, distance, and sale date', why: 'Appraisers typically lean on 3 to 6 strong comps.' },
      { step: 0, edited: false, title: 'Adjusted each comp to match ' + s.addr, did: rateText, why: 'Rates scale with this market’s prices. Adjust the comp toward the subject, never the other way around.' },
    ];
    if (soldOnly && others) rows.splice(2, 0, { step: 3, edited: false, title: 'Left out ' + others + ' active and pending listing' + (others === 1 ? '' : 's'), did: 'Nearby, but not used for value', why: 'They show your seller the competition, but their prices aren’t proven until they close.' });
    // Widening note only while the area and timing are still mine.
    const t = sess.trail || [], f = t[0], l = t[t.length - 1];
    let note = '';
    if (t.length > 1 && same(['within', 'mode', 'radius', 'sqft'])) {
      const parts = [];
      if (l.radius !== f.radius) parts.push('searched out to ' + l.radius + ' mi');
      if (l.within !== f.within) parts.push('went back ' + l.within + ' months');
      if (l.pct !== f.pct) parts.push('allowed ±' + Math.round(l.pct * 100) + '% in size');
      note = 'Only ' + f.n + ' home' + (f.n === 1 ? '' : 's') + ' sold within ' + f.radius + ' mi in the last ' + f.within + ' months, so I ' + (parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0]) + ' to get enough comps.';
    }
    return { rows, note };
  }
  kwiqCmaPracticesHTML(sess) {
    const { rows, note } = this.kwiqCmaPractices(sess);
    const tick = '<span aria-hidden="true" style="width:20px;height:20px;flex:none;margin-top:1px;border-radius:50%;background:var(--kw-system-tint);color:var(--action);display:flex;align-items:center;justify-content:center;">' + this.kwiqCmaIcon('check') + '</span>';
    return (note ? '<div style="display:flex;gap:10px;margin:2px 0 6px;padding:10px 12px;border-radius:8px;background:var(--kw-neutral-100);font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-secondary);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex:none;color:var(--action);"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg><span>' + note + '</span></div>' : '')
      + rows.map(r => '<div style="display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid var(--divider);">' + tick
        + '<div style="flex:1;min-width:0;">'
        + '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;"><span style="font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);">' + r.title + '</span>'
        + (r.edited ? '<span style="padding:1px 7px;border-radius:999px;background:var(--kw-neutral-100);color:var(--label-secondary);font:var(--fw-bold) 11px/16px var(--font-sans);">Changed by you</span>' : '') + '</div>'
        + '<div style="margin-top:1px;font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-secondary);">' + r.did + '</div>'
        + '<div style="margin-top:2px;font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + r.why + '</div></div>'
        + (r.step ? '<button type="button" data-cma-goto="' + r.step + '" style="flex:none;border:none;background:transparent;padding:2px 4px;cursor:pointer;color:var(--action);font:var(--fw-bold) 12px/18px var(--font-sans);">Change</button>' : '')
        + '</div>').join('');
  }
  // ---- Inline draft card: value, comps (keep / swap / drop), how I built it ----
  kwiqMakeCmaDraft(sess) {
    this._cmaSubject = sess.subject;
    const addr = sess.subject.addr;
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const src = sess.source === 'live' ? ' from live MLS data' : '';
    const miss = sess.source === 'notFound' ? 'I couldn’t find ' + addr + ' in KW listing data, so this draft uses sample homes. ' : '';
    col.appendChild(this.kwiqCmaIntro(miss + 'I built a draft CMA for ' + addr + src + ' using standard CMA best practices, so there’s nothing to set up. Here’s what I did and why. Tweak anything that doesn’t look right, then create the report.'));
    const card = document.createElement('div');
    card.setAttribute('data-cma-card', 'results');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;';
    const value = document.createElement('div');
    const map = document.createElement('div');
    map.style.cssText = 'height:200px;border-radius:12px;overflow:hidden;border:1px solid var(--divider);';
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;';
    const how = document.createElement('div');
    const howHead = document.createElement('button');
    howHead.type = 'button';
    howHead.setAttribute('aria-expanded', 'true');
    howHead.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;border:none;background:transparent;padding:0 0 8px;cursor:pointer;text-align:left;';
    const howBody = document.createElement('div');
    const paintHow = () => {
      const open = howHead.getAttribute('aria-expanded') === 'true';
      howHead.innerHTML = '<span style="font:var(--fw-bold) 14px/20px var(--font-sans);color:var(--label-primary);">How I built this</span><span style="font:var(--fw-bold) 12px/16px var(--font-sans);color:var(--action);">' + (open ? 'Hide' : 'Show') + '</span>';
      howBody.style.display = open ? '' : 'none';
    };
    howHead.addEventListener('click', () => { howHead.setAttribute('aria-expanded', howHead.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); paintHow(); });
    how.appendChild(howHead); how.appendChild(howBody);
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;padding-top:14px;border-top:1px solid var(--divider);';
    const adjust = this.kwiqCmaButton('Adjust settings', 'data-cma-readjust', false);
    const create = this.kwiqCmaButton('Create CMA', 'data-cma-build', true);
    adjust.type = create.type = 'button';
    foot.appendChild(adjust); foot.appendChild(create);
    const big = (v) => '$' + (v / 1000000).toFixed(2) + 'M';
    const render = () => {
      this._cmaSubject = sess.subject;
      this.kwiqCmaPick(sess);
      const live = sess.slots.filter(s => s.state !== 'drop').map(s => s.c);
      const v = this.kwiqCmaValue(live, sess.subject);
      value.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:8px 16px;flex-wrap:wrap;padding:14px 16px;border-radius:12px;background:var(--kw-system-tint);">'
        + '<div><div style="font:var(--fw-extrabold) 11px/16px var(--font-sans);letter-spacing:.07em;text-transform:uppercase;color:var(--action);">Estimated value</div><div style="font:var(--fw-extrabold) 28px/32px var(--font-sans);color:var(--label-primary);">' + (v ? big(v.estimate) : '—') + '</div></div>'
        + '<div style="text-align:right;"><div style="font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);">' + (v ? 'Range <b style="color:var(--label-primary);">' + big(v.low) + ' – ' + big(v.high) + '</b>' : 'Add a comp to see a value') + '</div>'
        + '<div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">From ' + live.length + ' adjusted comp' + (live.length === 1 ? '' : 's') + '</div></div></div>';
      map.innerHTML = this.kwiqCmaMapSVG(sess.st, { results: sess.slots });
      list.innerHTML = sess.slots.map(s => this.kwiqCmaRowHTML(s, sess.bench.length > 0)).join('');
      howBody.innerHTML = this.kwiqCmaPracticesHTML(sess);
      paintHow();
      create.disabled = !live.length;
      create.style.opacity = live.length ? '' : '.5';
      create.textContent = live.length ? 'Create CMA with ' + live.length + ' comp' + (live.length === 1 ? '' : 's') : 'Create CMA';
    };
    card.__render = render;
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const n = b.closest('[data-n]').getAttribute('data-n'), act = b.getAttribute('data-act');
      this.kwiqCmaAct(sess, n, act);
      render();
      if (act === 'swap') { const r = list.querySelector('[data-n="' + n + '"]'); if (r) r.style.animation = 'kwiqRespIn .45s cubic-bezier(.16,1,.3,1) both'; }
    });
    howBody.addEventListener('click', (e) => {
      const g = e.target.closest('[data-cma-goto]');
      if (g) this.kwiqCmaBuilderOpen(sess, card, parseInt(g.getAttribute('data-cma-goto'), 10));
    });
    adjust.addEventListener('click', () => this.kwiqCmaBuilderOpen(sess, card, 2));
    create.addEventListener('click', () => this.kwiqCmaFinish(sess, card));
    card.appendChild(this.kwiqCmaHeader('Draft CMA · ' + addr, () => this.kwiqCmaBuilderOpen(sess, card, 4)));
    card.appendChild(value); card.appendChild(map); card.appendChild(list); card.appendChild(how); card.appendChild(foot);
    render();
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  // ============ Shared loading treatment: pulsing dots + cycling message ============
  kwiqMakeLoader() {
    const b = document.createElement('div');
    b.style.cssText = 'padding:4px 0;display:flex;gap:11px;align-items:center;';
    const dots = document.createElement('span');
    dots.style.cssText = 'display:flex;gap:5px;align-items:center;flex:none;';
    dots.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:var(--label-tertiary);animation:kwiqDot 1.2s infinite;"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--label-tertiary);animation:kwiqDot 1.2s infinite .2s;"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--label-tertiary);animation:kwiqDot 1.2s infinite .4s;"></span>';
    const msg = document.createElement('span');
    msg.style.cssText = 'font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);transition:opacity .18s ease;';
    b.appendChild(dots); b.appendChild(msg);
    const row = this.kwiqMakeRow(b);
    return { row: row, set: (t) => { msg.style.opacity = '0'; setTimeout(() => { msg.textContent = t; msg.style.opacity = '1'; }, 130); } };
  }
  kwiqLoaderLines(kind) {
    const sets = {
      cma: ['Pulling comparable sales nearby…', 'Adjusting for beds, baths & lot size…', 'Checking recent neighborhood trends…', 'Formatting your CMA report…'],
      leads: ['Scanning your recent activity…', 'Ranking who’s most worth reaching…', 'Pulling context for each contact…'],
      deck: ['Gathering the listing highlights…', 'Laying out your slides…', 'Polishing the design…'],
      social: ['Reviewing the listing details…', 'Finding the right hook…', 'Writing your caption…', 'Adding hashtags…'],
      email: ['Reviewing the contact’s history…', 'Finding the right angle…', 'Drafting a few options…'],
      'default': ['Working on it…', 'Pulling the details together…', 'Almost there…'],
    };
    return sets[kind] || sets['default'];
  }
  // Appends a loader, cycles through `lines` over `duration` ms, then removes it and runs `done`.
  kwiqRunLoader(lines, duration, done) {
    const msgs = this.kwiqMsgs();
    const loader = this.kwiqMakeLoader();
    msgs.appendChild(loader.row);
    msgs.scrollTop = msgs.scrollHeight;
    let i = 0;
    loader.set(lines[0]);
    const step = Math.max(520, Math.floor(duration / lines.length));
    const iv = setInterval(() => { i++; if (i < lines.length) loader.set(lines[i]); }, step);
    setTimeout(() => {
      clearInterval(iv);
      loader.row.remove();
      done();
      msgs.scrollTop = msgs.scrollHeight;
    }, duration);
  }
  // ============ Error state demo (network failure + retry) ============
  kwiqIsErrorDemo(text) { return (text || '').trim().toLowerCase() === 'f6'; }
  kwiqErrorDemo() {
    this.kwiqEnterChat();
    this.kwiqRunLoader(this.kwiqLoaderLines('leads'), 1300, () => { this.kwiqMsgs().appendChild(this.kwiqMakeErrorCard()); });
  }
  kwiqMakeErrorCard() {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const card = document.createElement('div');
    card.setAttribute('data-kwiq-error', '');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:12px;';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:flex-start;gap:11px;';
    head.innerHTML = '<span style="width:34px;height:34px;flex:none;border-radius:50%;background:var(--kw-red-tint);color:var(--kw-red);display:flex;align-items:center;justify-content:center;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg></span>'
      + '<div style="flex:1;min-width:0;"><div style="font:var(--fw-bold) 15px/20px var(--font-sans);color:var(--label-primary);">Could not load your call list.</div>'
      + '<div style="margin-top:3px;font:var(--fw-regular) 13px/19px var(--font-sans);color:var(--label-secondary);">I couldn’t reach the server, so nothing loaded — this looks like a connection issue on our end, not a change to your contacts. Your data is safe.</div></div>';
    const status = document.createElement('div');
    status.style.cssText = 'display:inline-flex;align-items:center;gap:7px;align-self:flex-start;background:var(--kw-red-tint);color:var(--kw-red);border-radius:999px;padding:5px 11px;font:var(--fw-bold) 12px/16px var(--font-sans);';
    status.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:var(--kw-red);"></span>Network error · request timed out';
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;align-items:center;';
    foot.appendChild(this.kwiqCmaButton('Retry', 'data-kwiq-retry', true));
    const note = document.createElement('span');
    note.style.cssText = 'font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);';
    note.textContent = 'I’ll pick up right where we left off.';
    foot.appendChild(note);
    card.appendChild(head); card.appendChild(status); card.appendChild(foot);
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  kwiqRetry(btn) {
    const card = btn.closest('[data-kwiq-error]');
    if (card) { card.style.opacity = '.55'; card.style.pointerEvents = 'none'; }
    this.kwiqRunLoader(this.kwiqLoaderLines('leads'), 1400, () => { this.kwiqMsgs().appendChild(this.kwiqMakeCallList()); });
  }
  // ============ Missing-source / connect demo (F3): no contacts synced ============
  kwiqIsNoContacts(text) { return (text || '').trim().toLowerCase() === 'f3'; }
  kwiqNoContacts() {
    this.kwiqEnterChat();
    const msgs = this.kwiqMsgs();
    this.kwiqRunLoader(['Checking your Command contacts…'], 1000, () => { msgs.appendChild(this.kwiqMakeConnectCard()); });
  }
  kwiqMakeConnectCard() {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const card = document.createElement('div');
    card.setAttribute('data-connect-card', '');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:12px;';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:flex-start;gap:11px;';
    head.innerHTML = '<span style="width:34px;height:34px;flex:none;border-radius:50%;background:var(--kw-system-tint);color:var(--action);display:flex;align-items:center;justify-content:center;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4z"/><path d="M4 4v16"/><circle cx="11.5" cy="10" r="2"/><path d="M8.5 16c0-1.7 1.3-2.6 3-2.6s3 .9 3 2.6"/></svg></span>'
      + '<div style="flex:1;min-width:0;"><div style="font:var(--fw-bold) 15px/20px var(--font-sans);color:var(--label-primary);">I don’t see any contacts in Command yet.</div>'
      + '<div style="margin-top:3px;font:var(--fw-regular) 13px/19px var(--font-sans);color:var(--label-secondary);">Import your database and I’ll build your first call list — even a phone export works.</div></div>';
    const status = document.createElement('div');
    status.style.cssText = 'display:inline-flex;align-items:center;gap:7px;align-self:flex-start;background:var(--kw-system-tint);color:var(--action);border-radius:999px;padding:5px 11px;font:var(--fw-bold) 12px/16px var(--font-sans);';
    status.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:var(--action);"></span>Missing source · Contacts not connected';
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
    const mk = (label, src, primary) => {
      const b = document.createElement('button');
      b.setAttribute('data-connect', '');
      b.setAttribute('data-connect-src', src);
      b.textContent = label;
      b.style.cssText = 'border:none;cursor:pointer;border-radius:8px;padding:10px 16px;font:var(--fw-bold) 13px/1 var(--font-sans);' + (primary ? 'background:var(--action);color:#fff;' : 'background:var(--kw-neutral-100);color:var(--label-secondary);');
      return b;
    };
    actions.appendChild(mk('Import CSV / phone export', 'your CSV export', true));
    actions.appendChild(mk('Connect Google', 'Google Contacts', false));
    actions.appendChild(mk('Connect Outlook', 'Outlook', false));
    card.appendChild(head); card.appendChild(status); card.appendChild(actions);
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  kwiqConnectContacts(btn) {
    const card = btn.closest('[data-connect-card]');
    if (card) { card.style.opacity = '.55'; card.style.pointerEvents = 'none'; }
    const src = btn.getAttribute('data-connect-src') || 'your database';
    const msgs = this.kwiqMsgs();
    this.kwiqRunLoader(['Connecting to ' + src + '…', 'Importing your contacts…', 'Cleaning up duplicates…', 'Building your first call list…'], 2600, () => {
      msgs.appendChild(this.kwiqMakeKwiq('Imported 428 contacts from ' + src + '. ✓ Here’s your first call list — I prioritized who’s most worth reaching today.'));
      msgs.appendChild(this.kwiqMakeCallList());
    });
  }
  // ============ Partial-data disclosure demo (F3 Partial) ============
  kwiqIsPartial(text) { return (text || '').trim().toLowerCase() === 'f3 partial'; }
  kwiqPartialContacts() {
    this.kwiqEnterChat();
    const msgs = this.kwiqMsgs();
    this.kwiqRunLoader(this.kwiqLoaderLines('leads'), 1400, () => { msgs.appendChild(this.kwiqMakePartialCallList()); });
  }
  kwiqMakePartialCallList() {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const intro = document.createElement('div');
    intro.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    intro.textContent = 'Here’s who to call today:';
    col.appendChild(intro);
    // Source-disclosure banner — states exactly which sources the list is built from.
    const banner = document.createElement('div');
    banner.style.cssText = 'display:flex;gap:9px;align-items:flex-start;background:var(--kw-neutral-100);border:1px solid var(--divider);border-radius:10px;padding:10px 12px;';
    banner.innerHTML = '<span style="flex:none;color:var(--label-tertiary);margin-top:1px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg></span>'
      + '<div style="font:var(--fw-regular) 12px/17px var(--font-sans);color:var(--label-secondary);">This list is based on <b style="color:var(--label-primary);">Command</b> and <b style="color:var(--label-primary);">Google Contacts</b>. Outlook isn’t connected yet, so some people may be missing — and a few contacts are missing details like phone numbers.</div>';
    col.appendChild(banner);
    const people = [
      ['Carter Dean', 'New lead', 'Fresh Facebook ad lead — call while it’s hot.', 'Hi Carter, thanks for reaching out about your home search — got a couple minutes?', '#006C84', null],
      ['Priya Nair', 'Past client', 'Nearing her home anniversary, but there’s no number on file.', 'Hi Priya, thinking of you as you approach a year in the home — how’s it feeling?', '#6730B4', { noPhone: true }],
      ['Alexis Nichols', 'New lead', 'Fresh Facebook ad lead — worth a quick first call.', 'Hi Alexis, saw you were exploring homes — happy to help you narrow it down.', '#A73B06', null],
    ];
    people.forEach(p => col.appendChild(this.kwiqCallCard(p[0], p[1], p[2], p[3], p[4], p[6])));
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;align-self:stretch;';
    row.appendChild(col);
    return row;
  }
  kwiqAddNumber(btn) {
    const name = btn.getAttribute('data-lead-name') || 'this contact';
    this.kwiqMsgs().appendChild(this.kwiqMakeKwiq('Sure — what’s the best number for ' + name + '? I’ll save it to their Command profile so you can call or text right from here.'));
    this.kwiqMsgs().scrollTop = this.kwiqMsgs().scrollHeight;
  }
  // ============ Intent disambiguation demo (F2): one question, one repair max ============
  kwiqIsDisambig(text) {
    const t = (text || '').trim().toLowerCase();
    if (t === 'f2') return true;
    return /catch me up|my people|catch up on my (people|contacts|sphere|folks)|check in on my people/.test(t);
  }
  kwiqDisambig() {
    this.kwiqEnterChat();
    this._f2Await = true; this._f2Repairs = 0;
    const msgs = this.kwiqMsgs();
    const typing = this.kwiqMakeTyping();
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
      typing.remove();
      msgs.appendChild(this.kwiqMakeDisambig('Just so I catch you up the right way — do you want to know who you should contact today?', [['leads', 'Yes, who to contact today'], ['other', 'No — something else']]));
      msgs.scrollTop = msgs.scrollHeight;
    }, 600);
  }
  kwiqMakeDisambig(q, options) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro(q));
    const chips = document.createElement('div');
    chips.setAttribute('data-f2-card', '');
    chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
    options.forEach(([val, label]) => {
      const b = document.createElement('button');
      b.setAttribute('data-f2-opt', '');
      b.setAttribute('data-f2-val', val);
      b.textContent = label;
      b.style.cssText = this.kwiqCmaChipStyle(false);
      chips.appendChild(b);
    });
    col.appendChild(chips);
    return this.kwiqMakeRow(col);
  }
  kwiqF2Pick(el) {
    const card = el.closest('[data-f2-card]');
    if (card) { card.style.pointerEvents = 'none'; card.style.opacity = '.7'; }
    const val = el.getAttribute('data-f2-val');
    if (val === 'other') { this.kwiqF2Repair(); return; }
    this._f2Await = false;
    this.kwiqF2Resolve(val);
  }
  kwiqF2Repair() {
    // The single allowed repair turn: offer the alternatives once, then commit.
    if (this._f2Repairs >= 1) {
      this._f2Await = false;
      this.kwiqMsgs().appendChild(this.kwiqMakeKwiq('No problem — tell me what you’d like and I’ll jump in. I can surface new leads, in-progress follow-ups, or past clients to reconnect with.'));
      return;
    }
    this._f2Repairs++;
    const m = this.kwiqMsgs();
    const typing = this.kwiqMakeTyping();
    m.appendChild(typing); m.scrollTop = m.scrollHeight;
    setTimeout(() => {
      typing.remove();
      m.appendChild(this.kwiqMakeDisambig('No problem — which people did you mean?', [['followups', 'Follow-ups in progress'], ['past', 'Past clients & sphere']]));
      m.scrollTop = m.scrollHeight;
    }, 600);
  }
  kwiqF2Classify(text) {
    const t = (text || '').toLowerCase();
    if (/lead|new|fresh|facebook|prospect/.test(t)) return 'leads';
    if (/follow|active|pipeline|deal|in progress|escrow|under contract|offer/.test(t)) return 'followups';
    if (/past|sphere|client|repeat|referr|database|nurtur|anniversar/.test(t)) return 'past';
    return null;
  }
  kwiqF2Resolve(val) {
    const msgs = this.kwiqMsgs();
    this.kwiqRunLoader(this.kwiqLoaderLines('leads'), 1200, () => {
      if (val === 'followups') msgs.appendChild(this.kwiqMakeKwiq('Here’s who to follow up with today:\n\n• Marcus Webb — nearing his one-year home anniversary; a warm check-in keeps the referral door open.\n• Last weekend’s Rosewood open-house visitors — reach out while it’s still fresh.\n\nWant me to draft a message for any of them?'));
      else if (val === 'past') msgs.appendChild(this.kwiqMakeKwiq('From your past clients and sphere, these are worth a touch today:\n\n• Marcus Webb — almost a year in his home; perfect moment for a check-in.\n• Anyone hitting a home-buying anniversary this month.\n\nWant me to draft a friendly note or start a SmartPlan?'));
      else msgs.appendChild(this.kwiqMakeCallList());
    });
  }
  // ============ Audience-scope chips demo (F2 Chips) ============
  kwiqIsScopeChips(text) { return (text || '').trim().toLowerCase() === 'f2 chips'; }
  kwiqScopeChips() {
    this.kwiqEnterChat();
    this._scopeAwait = true; this._scopeRepairs = 0;
    const msgs = this.kwiqMsgs();
    const typing = this.kwiqMakeTyping();
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
      typing.remove();
      msgs.appendChild(this.kwiqMakeScopeChips('Happy to line up your calls — who do you want to focus on today?'));
      msgs.scrollTop = msgs.scrollHeight;
    }, 600);
  }
  kwiqMakeScopeChips(q) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro(q));
    const chips = document.createElement('div');
    chips.setAttribute('data-scope-card', '');
    chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
    [['recruits', 'Recruits'], ['clients', 'Clients'], ['transactions', 'Active transactions'], ['everyone', 'Everyone']].forEach(([val, label]) => {
      const b = document.createElement('button');
      b.setAttribute('data-scope-opt', '');
      b.setAttribute('data-scope-val', val);
      b.textContent = label;
      b.style.cssText = this.kwiqCmaChipStyle(false);
      chips.appendChild(b);
    });
    col.appendChild(chips);
    return this.kwiqMakeRow(col);
  }
  kwiqScopePick(el) {
    const card = el.closest('[data-scope-card]');
    if (card) { card.style.pointerEvents = 'none'; card.style.opacity = '.7'; }
    this._scopeAwait = false;
    this.kwiqScopeResolve(el.getAttribute('data-scope-val'));
  }
  kwiqScopeClassify(text) {
    const t = (text || '').toLowerCase();
    if (/recruit|agent|hire|attract|talent/.test(t)) return 'recruits';
    if (/client|past|sphere|database|repeat|referr/.test(t)) return 'clients';
    if (/transaction|active|escrow|under contract|deal|closing|pending/.test(t)) return 'transactions';
    if (/every|all|both|whole|mix/.test(t)) return 'everyone';
    return null;
  }
  kwiqScopeResolve(val) {
    const msgs = this.kwiqMsgs();
    this.kwiqRunLoader(this.kwiqLoaderLines('leads'), 1200, () => {
      msgs.appendChild(this.kwiqMakeScopedCallList(val));
    });
  }
  kwiqMakeScopedCallList(val) {
    if (val === 'everyone' || !val) return this.kwiqMakeCallList();
    const DATA = {
      recruits: {
        intro: 'Here’s who to call for recruiting today:',
        people: [
          ['Jordan Blake', 'Top producer', 'Engaged with your last two posts and may be open to a move.', 'Hi Jordan, loved your recent Elm St sale — do you ever take calls about what a move could look like?', '#006C84'],
          ['Maria Chen', 'Newly licensed', 'Just got licensed with no team yet — a great mentorship fit.', 'Hi Maria, congrats on the license! Are you still deciding where to hang it?', '#6730B4'],
          ['Devin Carter', 'Wants support', 'Mentioned wanting better tech and support at his current brokerage.', 'Hi Devin, you mentioned wanting stronger tools — worth a quick chat this week?', '#A73B06'],
        ],
      },
      clients: {
        intro: 'Here’s who to call from your clients & sphere today:',
        people: [
          ['Marcus Webb', 'Anniversary', 'Almost a year in his home — perfect time for a check-in.', 'Hi Marcus, hard to believe it’s almost a year — how’s the house treating you?', '#026E24'],
          ['The Alvarez Family', 'Past buyer', 'Bought two years ago; may know someone entering the market this spring.', 'Hi! Thinking of you both — anyone in your circle talking about a move this year?', '#0F5EAD'],
        ],
      },
      transactions: {
        intro: 'Here’s who to call on your active transactions today:',
        people: [
          ['Priya Nair', 'Buyer · 6578 Rosewood', 'Option period ends tomorrow — confirm the inspection.', 'Hi Priya, quick one on Rosewood — are we set for the inspection before the option ends?', '#006C84'],
          ['First United Lending', 'Lender · 1255 Kings Rd', 'Appraisal is ordered — check the timeline stays on track.', 'Hi, checking on the Kings Rd appraisal — are we still on track to close on schedule?', '#0F5EAD'],
        ],
      },
    };
    const d = DATA[val] || DATA.recruits;
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const intro = document.createElement('div');
    intro.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    intro.textContent = d.intro;
    col.appendChild(intro);
    d.people.forEach(p => col.appendChild(this.kwiqCallCard(p[0], p[1], p[2], p[3], p[4])));
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;align-self:stretch;';
    row.appendChild(col);
    return row;
  }
  // ============ Social post flow: ask → generate → present ============
  kwiqIsSocial(text) {
    const t = (text || '').toLowerCase();
    return t.includes('social') || t.includes('caption') || t.includes('instagram') || t.includes('facebook post') || t.includes('linkedin post') || (t.includes('post') && (t.includes('listing') || t.includes('social') || t.includes('insta')));
  }
  kwiqSocialQuestions() {
    return [
      { key: 'platform', label: 'Platform', opts: ['Instagram', 'Facebook', 'LinkedIn', 'X'], def: 'Instagram' },
      { key: 'type', label: 'Post type', opts: ['Just listed', 'Open house', 'Price improved', 'Just sold'], def: 'Just listed' },
      { key: 'tone', label: 'Tone', opts: ['Professional', 'Warm', 'Bold'], def: 'Warm' },
    ];
  }
  kwiqSocialAsk(text) {
    this.kwiqEnterChat();
    const listing = this.kwiqParseAddress(text) || '6578 Rosewood Avenue';
    const msgs = this.kwiqMsgs();
    const typing = this.kwiqMakeTyping();
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
      typing.remove();
      const row = this.kwiqMakeSocialQuestions(listing, null);
      row.style.animation = 'kwiqIn .45s cubic-bezier(.16,1,.3,1) both';
      msgs.appendChild(row);
      this.kwiqScrollToCard(row);
    }, 700);
  }
  kwiqMakeSocialQuestions(listing, preset) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro('Let’s craft a post for ' + listing + '. A couple of quick choices:'));
    const card = document.createElement('div');
    card.setAttribute('data-soc-card-q', '');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:12px;padding:15px 16px 16px;display:flex;flex-direction:column;gap:15px;';
    card.__listing = listing;
    const sel = {};
    this.kwiqSocialQuestions().forEach(q => {
      sel[q.key] = (preset && preset[q.key]) || q.def;
      const group = document.createElement('div');
      const lab = document.createElement('div');
      lab.style.cssText = 'font:var(--fw-bold) 13px/18px var(--font-sans);color:var(--label-primary);margin-bottom:9px;';
      lab.textContent = q.label;
      const chips = document.createElement('div');
      chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
      q.opts.forEach(opt => {
        const b = document.createElement('button');
        b.setAttribute('data-soc-opt', '');
        b.setAttribute('data-soc-q', q.key);
        b.setAttribute('data-soc-val', opt);
        b.textContent = opt;
        b.style.cssText = this.kwiqCmaChipStyle(sel[q.key] === opt);
        chips.appendChild(b);
      });
      group.appendChild(lab); group.appendChild(chips);
      card.appendChild(group);
    });
    card.__sel = sel;
    card.appendChild(this.kwiqCmaActionRow([this.kwiqCmaButton('Generate post', 'data-soc-create', true)]));
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  kwiqSocialPick(el) {
    const card = el.closest('[data-soc-card-q]');
    if (!card) return;
    const q = el.getAttribute('data-soc-q');
    const v = el.getAttribute('data-soc-val');
    card.__sel[q] = v;
    card.querySelectorAll('[data-soc-opt][data-soc-q="' + q + '"]').forEach(b => {
      b.style.cssText = this.kwiqCmaChipStyle(b.getAttribute('data-soc-val') === v);
    });
  }
  kwiqSocialCreate(btn) {
    const card = btn.closest('[data-soc-card-q]');
    if (!card) return;
    card.style.opacity = '.65'; card.style.pointerEvents = 'none';
    const o = Object.assign({ listing: card.__listing }, card.__sel);
    this.kwiqRunLoader(this.kwiqLoaderLines('social'), 2200, () => { this.kwiqMsgs().appendChild(this.kwiqMakeSocialCard(o)); });
  }
  kwiqSocialDrafts(o) {
    const L = o.listing;
    const head = { 'Just listed': '✨ JUST LISTED', 'Open house': '📍 OPEN HOUSE THIS WEEKEND', 'Price improved': '📣 PRICE IMPROVEMENT', 'Just sold': '🔑 JUST SOLD' }[o.type] || '✨ JUST LISTED';
    const cta = { 'Just listed': 'DM me to schedule a private tour.', 'Open house': 'Join me Saturday 12–3pm — I’d love to see you there.', 'Price improved': 'Newly priced to move — let’s talk before it’s gone.', 'Just sold': 'Curious what your home is worth? Let’s chat.' }[o.type] || 'DM me to schedule a private tour.';
    const sign = o.tone === 'Professional' ? '\n\n— Nina Royals · Royals Realtors' : o.tone === 'Bold' ? '\n\nThis one won’t last. 🔥' : '\n\nCan’t wait to show you around 💛';
    const bodies = {
      Lifestyle: 'Imagine morning coffee on the covered porch and easy evenings under the oaks. ' + L + ' is the kind of home that just feels right the moment you walk in.',
      Features: '5 beds · 4 baths · chef’s kitchen · resort-style pool. Every inch of ' + L + ' was designed for the way you actually live.',
      Community: 'Tucked into one of the most sought-after pockets in town — top schools, walkable streets, and neighbors who wave. ' + L + ' puts it all at your doorstep.',
    };
    const typeTag = { 'Just listed': '#justlisted', 'Open house': '#openhouse', 'Price improved': '#pricedrop', 'Just sold': '#justsold' }[o.type] || '#justlisted';
    const tags = [typeTag, '#realestate', '#' + o.platform.replace(/\s/g, '').toLowerCase(), '#dreamhome', '#luxuryrealestate', '#forsale'].join(' ');
    return ['Lifestyle', 'Features', 'Community'].map(a => ({ angle: a, caption: head + '\n\n' + bodies[a] + '\n\n' + cta + sign, tags: tags }));
  }
  kwiqMakeSocialCard(o) {
    const drafts = this.kwiqSocialDrafts(o);
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro('Here’s an ' + o.platform + ' post for ' + o.listing + ' — switch the angle, copy it, or regenerate.'));
    const card = document.createElement('div');
    card.setAttribute('data-soc-card', '');
    card.__variants = drafts; card.__opts = o;
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;';
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;padding:12px 14px 0;';
    drafts.forEach((d, i) => {
      const b = document.createElement('button');
      b.setAttribute('data-soc-angle', i);
      b.textContent = d.angle;
      const on = i === 0;
      b.style.cssText = 'border:none;cursor:pointer;border-radius:999px;padding:6px 12px;font:var(--fw-bold) 12px/16px var(--font-sans);transition:background .12s,color .12s;' + (on ? 'background:var(--action);color:#fff;' : 'background:var(--kw-neutral-100);color:var(--label-secondary);');
      tabs.appendChild(b);
    });
    const headRow = document.createElement('div');
    headRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:12px 14px 0;';
    headRow.innerHTML = '<span style="background:var(--kw-system-tint);color:var(--action);border-radius:999px;padding:4px 11px;font:var(--fw-bold) 11px/16px var(--font-sans);">' + o.platform + '</span><span style="font:var(--fw-bold) 11px/16px var(--font-sans);color:var(--label-tertiary);text-transform:uppercase;letter-spacing:.05em;">' + o.type + '</span>';
    const img = document.createElement('div');
    img.style.cssText = 'margin:10px 14px 0;height:150px;border-radius:10px;background:var(--kw-system-tint);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--action);';
    img.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L5 20"/></svg><span style="font:var(--fw-bold) 11px/14px var(--font-sans);">Listing photo</span>';
    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 14px 4px;display:flex;flex-direction:column;gap:8px;';
    const cap = document.createElement('div');
    cap.setAttribute('data-soc-caption', '');
    cap.style.cssText = 'font:var(--fw-regular) 14px/21px var(--font-sans);color:var(--label-primary);white-space:pre-wrap;';
    cap.textContent = drafts[0].caption;
    const tg = document.createElement('div');
    tg.setAttribute('data-soc-tags', '');
    tg.style.cssText = 'font:var(--fw-bold) 13px/20px var(--font-sans);color:var(--action);';
    tg.textContent = drafts[0].tags;
    body.appendChild(cap); body.appendChild(tg);
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;padding:8px 14px 14px;';
    foot.appendChild(this.kwiqCmaButton('Copy caption', 'data-soc-copy', true));
    foot.appendChild(this.kwiqCmaButton('Regenerate', 'data-soc-regen', false));
    card.appendChild(tabs); card.appendChild(headRow); card.appendChild(img); card.appendChild(body); card.appendChild(foot);
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  kwiqSocialAngle(el) {
    const card = el.closest('[data-soc-card]');
    if (!card || !card.__variants) return;
    const i = +el.getAttribute('data-soc-angle');
    const d = card.__variants[i];
    if (!d) return;
    card.querySelector('[data-soc-caption]').textContent = d.caption;
    card.querySelector('[data-soc-tags]').textContent = d.tags;
    card.querySelectorAll('[data-soc-angle]').forEach((b, j) => {
      const on = j === i;
      b.style.background = on ? 'var(--action)' : 'var(--kw-neutral-100)';
      b.style.color = on ? '#fff' : 'var(--label-secondary)';
    });
  }
  kwiqSocialCopy(el) {
    const card = el.closest('[data-soc-card]');
    if (!card) return;
    const text = card.querySelector('[data-soc-caption]').textContent + '\n\n' + card.querySelector('[data-soc-tags]').textContent;
    const done = () => { el.textContent = 'Copied ✓'; setTimeout(() => { el.textContent = 'Copy caption'; }, 1400); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
      else done();
    } catch (e) { done(); }
  }
  kwiqSocialRegen(el) {
    const card = el.closest('[data-soc-card]');
    if (!card || !card.__opts) return;
    el.disabled = true; el.style.opacity = '.6';
    const o = card.__opts;
    this.kwiqRunLoader(this.kwiqLoaderLines('social'), 1600, () => { this.kwiqMsgs().appendChild(this.kwiqMakeSocialCard(o)); });
  }
  kwiqRunCMA() {
    const root = document.querySelector('[data-dash-root]');
    const msgs = root.querySelector('[data-kwiq-messages]');
    const empty = root.querySelector('[data-kwiq-empty]');
    this.kwiqEnterChat();
    const steps = [
      'Opening the Rollingwood saved search',
      'Pulling 8 comparable sales nearby',
      'Adjusting for beds, baths & lot size',
      'Calculating the suggested price range',
      'Formatting your CMA report',
    ];
    // Thinking card
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;box-shadow:var(--shadow04);border-radius:16px;padding:13px 16px;display:flex;flex-direction:column;gap:11px;flex:1;min-width:0;';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:9px;';
    head.innerHTML = '<span data-cma-spin style="width:15px;height:15px;flex:none;border:2px solid var(--kw-neutral-200);border-top-color:var(--action);border-radius:50%;animation:kwiqSpin .7s linear infinite;"></span><span data-cma-head style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);">Thinking through your CMA…</span>';
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:9px;';
    const items = steps.map((s) => {
      const it = document.createElement('div');
      it.style.cssText = 'display:flex;align-items:center;gap:10px;opacity:.35;transition:opacity .3s ease;';
      it.innerHTML = '<span data-dot style="width:16px;height:16px;flex:none;border-radius:50%;border:2px solid var(--kw-neutral-300);box-sizing:border-box;"></span><span style="font:var(--fw-regular) 13px/18px var(--font-sans);color:var(--label-secondary);">' + s + '</span>';
      list.appendChild(it);
      return it;
    });
    card.appendChild(head); card.appendChild(list);
    const row = this.kwiqMakeRow(card);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    const check = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-11"/></svg>';
    const reveal = (i) => {
      if (i >= items.length) return;
      const it = items[i];
      it.style.opacity = '1';
      // mark previous step done
      if (i > 0) {
        const dot = items[i - 1].querySelector('[data-dot]');
        dot.style.background = 'var(--kw-green)';
        dot.style.borderColor = 'var(--kw-green)';
        dot.style.display = 'flex'; dot.style.alignItems = 'center'; dot.style.justifyContent = 'center';
        dot.innerHTML = check;
      }
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(() => reveal(i + 1), 720);
    };
    reveal(0);
    const finishMs = 720 * (items.length + 1);
    setTimeout(() => {
      // last step done
      const dot = items[items.length - 1].querySelector('[data-dot]');
      dot.style.background = 'var(--kw-green)'; dot.style.borderColor = 'var(--kw-green)';
      dot.style.display = 'flex'; dot.style.alignItems = 'center'; dot.style.justifyContent = 'center';
      dot.innerHTML = check;
      const spin = head.querySelector('[data-cma-spin]');
      if (spin) spin.outerHTML = '<span style="width:16px;height:16px;flex:none;border-radius:50%;background:var(--kw-green);display:flex;align-items:center;justify-content:center;">' + check + '</span>';
      const h = head.querySelector('[data-cma-head]');
      if (h) h.textContent = 'CMA ready';
      msgs.appendChild(this.kwiqMakeCMACard());
      msgs.scrollTop = msgs.scrollHeight;
    }, finishMs);
  }
  // ============ CMA website: an Apple-style landing page for the seller, offered after the report ============
  kwiqSiteOffer() {
    const msgs = this.kwiqMsgs();
    const typing = this.kwiqMakeTyping();
    setTimeout(() => {
      msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
      setTimeout(() => {
        typing.remove();
        const col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
        col.appendChild(this.kwiqCmaIntro('Want me to turn this CMA into a website you can send your seller? It shows the value, the comps, and the market on one clean page.'));
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
        const pick = (yes) => {
          if (!this._siteAwait) return;
          this._siteAwait = false;
          row.style.opacity = '.5'; row.style.pointerEvents = 'none';
          msgs.appendChild(this.kwiqMakeUser(yes ? 'Yes, create the website' : 'Not now'));
          if (yes) this.kwiqSiteBuild();
          else msgs.appendChild(this.kwiqMakeKwiq('No problem. Just ask for a website for this CMA whenever you’re ready.'));
          msgs.scrollTop = msgs.scrollHeight;
        };
        [['Yes, create the website', true], ['Not now', false]].forEach(([t, yes]) => {
          const b = document.createElement('button');
          b.type = 'button'; b.textContent = t; b.style.cssText = this.kwiqCmaChipStyle(false);
          b.addEventListener('click', () => pick(yes));
          row.appendChild(b);
        });
        col.appendChild(row);
        msgs.appendChild(this.kwiqMakeRow(col));
        msgs.scrollTop = msgs.scrollHeight;
        this._siteAwait = true;
      }, 700);
    }, 500);
  }
  kwiqSiteBuild() {
    if (!this._cmaComps || !this._cmaComps.length) { this.kwiqMsgs().appendChild(this.kwiqMakeKwiq('Create a CMA first, and I’ll turn it into a website.')); return; }
    this.kwiqRunLoader(['Picking the best photos…', 'Writing the headlines…', 'Laying out your page…'], 2100, () => {
      this._siteHTML = this.kwiqSiteHTML();
      const row = this.kwiqMakeSiteCard();
      this.kwiqMsgs().appendChild(row);
      this.kwiqScrollToCard(row);
    });
  }
  kwiqSiteFileName() { return ((this._cmaAddr || 'CMA') + ' website').replace(/[\\/:*?"<>|]/g, '') + '.html'; }
  kwiqSiteDownload() {
    const url = URL.createObjectURL(new Blob([this._siteHTML || this.kwiqSiteHTML()], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url; a.download = this.kwiqSiteFileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  kwiqMakeSiteCard() {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    col.appendChild(this.kwiqCmaIntro('Your website for ' + (this._cmaAddr || 'this property') + ' is ready. Open it to preview, or download the page to host it or send it as a file.'));
    const card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:13px;background:#fff;box-shadow:var(--shadow04);border-radius:12px;padding:12px 14px;';
    const btn = (label, primary) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.style.cssText = 'flex:none;border:none;border-radius:8px;cursor:pointer;font:var(--fw-bold) 14px/1 var(--font-sans);padding:10px 18px;' + (primary ? 'background:var(--action);color:#fff;' : 'background:var(--kw-neutral-100);color:var(--label-secondary);'); return b; };
    card.innerHTML = '<span style="width:44px;height:52px;flex:none;border-radius:7px;background:var(--kw-system-tint);color:var(--action);display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 11px/1 var(--font-sans);letter-spacing:.5px;">WEB</span>'
      + '<div style="flex:1;min-width:0;"><div style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);">' + this.kwiqEsc(this._cmaAddr || 'CMA') + '</div><div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">Seller website · ' + this._cmaComps.length + ' comps</div></div>';
    const dl = btn('Download', false), open = btn('Open', true);
    dl.addEventListener('click', () => this.kwiqSiteDownload());
    open.addEventListener('click', () => this.kwiqSitePreview());
    card.appendChild(dl); card.appendChild(open);
    col.appendChild(card);
    return this.kwiqMakeRow(col);
  }
  kwiqSitePreview() {
    const root = document.querySelector('[data-dash-root]');
    let ov = root.querySelector('[data-site-overlay]');
    if (!ov) {
      ov = document.createElement('div');
      ov.setAttribute('data-site-overlay', '');
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-label', 'Website preview');
      ov.style.cssText = 'position:fixed;inset:0;z-index:140;background:rgba(16,18,24,.82);display:flex;flex-direction:column;align-items:center;padding:20px;gap:12px;';
      ov.innerHTML = '<div style="width:min(1200px,96vw);display:flex;align-items:center;gap:12px;color:#fff;">'
        + '<div style="flex:1;min-width:0;"><div data-site-title style="font:var(--fw-bold) 16px/20px var(--font-sans);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div><div style="font:var(--fw-regular) 12px/16px var(--font-sans);opacity:.7;">Website preview</div></div>'
        + '<div data-site-size style="display:flex;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.14);"><button type="button" data-w="100%" style="border:none;border-radius:999px;padding:7px 12px;cursor:pointer;font:var(--fw-bold) 12px/1 var(--font-sans);">Desktop</button><button type="button" data-w="390px" style="border:none;border-radius:999px;padding:7px 12px;cursor:pointer;font:var(--fw-bold) 12px/1 var(--font-sans);">Phone</button></div>'
        + '<button type="button" data-site-dl style="height:38px;padding:0 16px;border:none;border-radius:8px;background:rgba(255,255,255,.16);color:#fff;cursor:pointer;font:var(--fw-bold) 13px/1 var(--font-sans);">Download</button>'
        + '<button type="button" data-site-close title="Close" aria-label="Close" style="width:38px;height:38px;flex:none;border-radius:50%;border:none;background:rgba(255,255,255,.16);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg></button></div>'
        + '<div style="width:min(1200px,96vw);flex:1;min-height:0;display:flex;justify-content:center;"><iframe data-site-frame title="Website preview" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style="width:100%;height:100%;border:none;border-radius:12px;background:#fff;box-shadow:var(--shadow32);transition:width .3s ease;"></iframe></div>';
      root.appendChild(ov);
      const frame = ov.querySelector('[data-site-frame]');
      const paint = (w) => ov.querySelectorAll('[data-w]').forEach(b => { const on = b.getAttribute('data-w') === w; b.style.background = on ? '#fff' : 'transparent'; b.style.color = on ? 'var(--label-primary)' : '#fff'; });
      ov.querySelector('[data-site-size]').addEventListener('click', (e) => { const b = e.target.closest('[data-w]'); if (!b) return; frame.style.width = b.getAttribute('data-w'); paint(b.getAttribute('data-w')); });
      ov.querySelector('[data-site-dl]').addEventListener('click', () => this.kwiqSiteDownload());
      const close = () => { ov.style.display = 'none'; document.removeEventListener('keydown', ov.__esc); };
      ov.querySelector('[data-site-close]').addEventListener('click', close);
      ov.__esc = (e) => { if (e.key === 'Escape') close(); };
      ov.__paint = paint;
    }
    ov.style.display = 'flex';
    document.addEventListener('keydown', ov.__esc);
    ov.querySelector('[data-site-title]').textContent = (this._cmaAddr || 'CMA') + ' website';
    const frame = ov.querySelector('[data-site-frame]');
    frame.style.width = '100%'; ov.__paint('100%');
    frame.srcdoc = this._siteHTML || this.kwiqSiteHTML();
  }
  kwiqEsc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // The page itself: one self-contained HTML file (Mulish from Google Fonts, listing photos by URL).
  kwiqSiteHTML() {
    const E = (v) => this.kwiqEsc(v);
    const S0 = this._cmaSubject || {};
    const live = !!S0.lat0;
    const s = { addr: this._cmaAddr || S0.addr || '', city: S0.city || '', beds: S0.beds || 0, bath: S0.bath || 0, area: S0.area || 0, lot: S0.lot || 0, year: S0.year || '', photo: S0.photo || '', zip: S0.zip || '78746' };
    const comps = (this._cmaComps || []).slice();
    const S1 = { beds: s.beds, bath: s.bath, area: s.area, lot: s.lot };
    const R = this.kwiqCmaRates(comps);
    const v = this.kwiqCmaValue(comps, S1) || { estimate: 0, low: 0, high: 0 };
    const r25 = (x) => Math.round(x / 25000) * 25000;
    const list = r25(v.estimate * 0.99);
    const M = (x) => x >= 1e6 ? '$' + (x / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : '$' + Math.round(x / 1000) + 'K';
    const money = (x) => '$' + Math.round(x).toLocaleString('en-US');
    const words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    const count = words[comps.length] || String(comps.length);
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    // Market: live ZIP stats when we have them, otherwise the sample report's figures.
    const m = this._cmaMarket;
    const mk = live && m && m.now.n
      ? { ppsf: Math.round(m.now.ppsf), dom: Math.round(m.now.dom), ratio: m.now.ratio * 100, mos: m.active / (m.now.n / 6), n: m.now.n, type: m.typeLabel }
      : { ppsf: 1604, dom: 38, ratio: 98.4, mos: 3.1, n: 0, type: 'homes' };
    const market = mk.mos < 4 ? 'A seller’s market.' : mk.mos <= 6 ? 'A balanced market.' : 'A buyer’s market.';
    const marketWhy = mk.mos < 4 ? 'Homes are scarce, so well-priced ones move quickly.' : mk.mos <= 6 ? 'Buyers and sellers are evenly matched, so pricing right matters most.' : 'Buyers have choices, so presentation and price do the heavy lifting.';
    const sold = (c) => c.status === 'Sold' ? 'Sold ' + (c.sold || '') : c.status;
    const specs = [[s.beds, 'bedrooms'], [s.bath, 'baths'], [Number(s.area).toLocaleString('en-US'), 'square feet'], [Number(s.lot).toFixed(2), 'acres'], [s.year, 'built']].filter(x => x[0] && x[0] !== '0.00');
    const courtesy = [...new Set(comps.map(c => c.courtesy).filter(Boolean))];
    const agent = { name: 'Nina Royals', first: 'Nina', firm: 'Royals Realtors', phone: '(512) 465-1234', tel: '+15124651234', email: 'nina.royals@royalsrealtors.com' };
    const mail = 'mailto:' + agent.email + '?subject=' + encodeURIComponent(s.addr + ' — next steps');
    const house = '<svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true"><path d="M12 86V40L60 6l48 34v46z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M48 86V58h24v28" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
    const card = (c) => {
      const adj = this.kwiqCmaAdjust(c, S1, R).adjusted;
      return '<li class="comp"><div class="ph">' + (c.photo ? '<img src="' + E(c.photo) + '" alt="' + E(c.addr) + '" loading="lazy">' : house) + '</div>'
        + '<div class="cb"><p class="ca">' + E(c.addr) + '</p><p class="cp">' + money(c.price) + '</p><p class="cm">' + E(sold(c)) + '</p>'
        + '<p class="cs">' + c.beds + ' bd, ' + c.bath + ' ba, ' + Number(c.area).toLocaleString('en-US') + ' sq ft</p>'
        + '<p class="cx">Adjusted to ' + money(adj) + ' for your home</p></div></li>';
    };
    const css = `
:root{--ink:#1D1D1F;--ink2:#6E6E73;--paper:#FFFFFF;--mist:#F5F5F7;--night:#000000;--teal:#006C84;--teal-hi:#2BB3D0;--line:#D2D2D7}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{font-family:Mulish,system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--paper);font-size:17px;line-height:1.47;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}
a{color:inherit}
:focus-visible{outline:3px solid var(--teal-hi);outline-offset:3px;border-radius:6px}
.wrap{width:min(1024px,100% - 44px);margin:0 auto}
nav{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.72);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);border-bottom:1px solid rgba(0,0,0,.08)}
nav .wrap{height:52px;display:flex;align-items:center;justify-content:space-between;gap:16px}
nav b{font-weight:800;font-size:17px;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pill{display:inline-flex;align-items:center;justify-content:center;border-radius:980px;background:var(--teal);color:#fff;text-decoration:none;font-weight:700;white-space:nowrap}
nav .pill{font-size:13px;padding:6px 14px}
.pill.big{font-size:17px;padding:13px 24px}
.link{color:var(--teal);text-decoration:none;font-weight:700;font-size:17px}
.link:hover,.pill:hover{text-decoration:underline;text-underline-offset:3px}
section{padding:96px 0}
.hero{padding:72px 0 0;text-align:center}
.hero h1{font-weight:800;font-size:clamp(44px,8vw,88px);line-height:1.02;letter-spacing:-.035em;text-wrap:balance}
.hero .sub{margin:14px auto 0;max-width:30ch;font-size:clamp(21px,2.6vw,28px);line-height:1.2;font-weight:400;color:var(--ink2);text-wrap:balance}
.hero .cta{margin-top:28px;display:flex;gap:28px;justify-content:center;align-items:center;flex-wrap:wrap}
.hero .shot{margin:56px auto 0;width:min(1180px,100%);aspect-ratio:16/8;overflow:hidden;background:var(--mist);display:flex;align-items:center;justify-content:center;color:#C7C7CC}
.hero .shot img{width:100%;height:100%;object-fit:cover}
.hero .noshot{height:72px}
.specs{padding:56px 0;border-bottom:1px solid var(--line)}
.specs ul{list-style:none;display:flex;justify-content:center;flex-wrap:wrap;gap:24px 56px;text-align:center}
.specs strong{display:block;font-weight:800;font-size:clamp(30px,4vw,40px);letter-spacing:-.02em;line-height:1.1}
.specs span{color:var(--ink2);font-size:14px}
.value{background:var(--night);color:#F5F5F7;text-align:center;padding:128px 0}
.value .k{font-size:21px;color:#A1A1A6}
.value .num{display:block;margin-top:8px;font-weight:800;font-size:clamp(84px,17vw,200px);line-height:.95;letter-spacing:-.05em;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#FFFFFF 30%,#8FD8EA 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.value .range{margin:28px auto 0;max-width:34ch;font-size:clamp(19px,2.2vw,24px);line-height:1.3;color:#A1A1A6;text-wrap:balance}
.value .range b{color:#F5F5F7;font-weight:700}
.value .bar{margin:44px auto 0;width:min(560px,100%);height:6px;border-radius:6px;background:#1D1D1F;position:relative}
.value .bar i{position:absolute;left:0;right:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,#1D1D1F,var(--teal) 30%,var(--teal-hi) 50%,var(--teal) 70%,#1D1D1F)}
.value .bar em{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#fff;box-shadow:0 0 0 6px rgba(43,179,208,.25)}
.value .ends{width:min(560px,100%);margin:12px auto 0;display:flex;justify-content:space-between;font-size:14px;color:#86868B}
.comps{background:var(--mist)}
h2{font-weight:800;font-size:clamp(36px,5.6vw,56px);line-height:1.05;letter-spacing:-.03em;text-wrap:balance}
.lede{margin-top:16px;max-width:46ch;font-size:clamp(19px,2vw,21px);line-height:1.38;color:var(--ink2)}
.rail{list-style:none;display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding:48px max(22px,calc((100% - 1024px)/2)) 8px;scrollbar-width:none}
.rail::-webkit-scrollbar{display:none}
.comp{flex:0 0 min(340px,82vw);scroll-snap-align:start;background:#fff;border-radius:28px;overflow:hidden}
.comp .ph{aspect-ratio:4/3;background:#E8E8ED;display:flex;align-items:center;justify-content:center;color:#C7C7CC}
.comp .ph img{width:100%;height:100%;object-fit:cover}
.cb{padding:24px 26px 28px}
.ca{font-weight:700;font-size:17px;line-height:1.25}
.cp{margin-top:10px;font-weight:800;font-size:32px;letter-spacing:-.02em;line-height:1.1}
.cm{color:var(--ink2);font-size:15px}
.cs{margin-top:14px;font-size:15px}
.cx{margin-top:4px;font-size:15px;color:var(--teal);font-weight:700}
.hint{margin-top:18px;font-size:14px;color:var(--ink2)}
.market .grid{margin-top:64px;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.market .grid strong{display:block;font-weight:800;font-size:clamp(44px,6vw,64px);letter-spacing:-.035em;line-height:1}
.market .grid p{margin-top:10px;font-size:17px;color:var(--ink2);max-width:22ch}
.plan{text-align:center;border-top:1px solid var(--line)}
.plan h2{font-size:clamp(48px,8vw,96px);letter-spacing:-.04em}
.plan .lede{margin:18px auto 0;text-align:center}
.plan .cta{margin-top:36px;display:flex;gap:28px;justify-content:center;align-items:center;flex-wrap:wrap}
footer{background:var(--mist);padding:28px 0 40px;font-size:12px;line-height:1.5;color:var(--ink2)}
footer p+p{margin-top:8px}
@media (max-width:734px){section{padding:72px 0}.value{padding:96px 0}.market .grid{grid-template-columns:1fr;gap:32px;margin-top:40px}.hero .shot{aspect-ratio:4/3}.specs ul{gap:20px 32px}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;
    const body = '<nav><div class="wrap"><b>' + E(s.addr) + '</b><a class="pill" href="' + mail + '">Talk to ' + agent.first + '</a></div></nav>'
      + '<main>'
      + '<header class="hero"><div class="wrap"><h1>' + E(s.addr) + '</h1><p class="sub">What your home is worth today, and how to sell it well.</p>'
      + '<div class="cta"><a class="pill big" href="#value">See the value</a><a class="link" href="#plan">See the plan</a></div></div>'
      + (s.photo ? '<div class="shot"><img src="' + E(s.photo) + '" alt="' + E(s.addr) + '"></div>' : '<div class="noshot"></div>') + '</header>'
      + (specs.length ? '<section class="specs" aria-label="Home details"><div class="wrap"><ul>' + specs.map(x => '<li><strong>' + E(x[0]) + '</strong><span>' + x[1] + '</span></li>').join('') + '</ul></div></section>' : '')
      + '<section class="value" id="value"><div class="wrap"><p class="k">Estimated market value</p>'
      + '<strong class="num" data-to="' + v.estimate + '">' + M(v.estimate) + '</strong>'
      + '<p class="range">Most likely between <b>' + M(v.low) + '</b> and <b>' + M(v.high) + '</b>, based on ' + count.toLowerCase() + ' nearby homes like yours, adjusted to match it.</p>'
      + '<div class="bar" aria-hidden="true"><i></i><em></em></div><div class="ends" aria-hidden="true"><span>' + M(v.low) + '</span><span>' + M(v.high) + '</span></div></div></section>'
      + '<section class="comps" aria-labelledby="comps-h"><div class="wrap"><h2 id="comps-h">' + count + ' homes like yours.<br>Recently sold.</h2>'
      + '<p class="lede">Each price is adjusted for differences in size, bedrooms, baths, and lot, so you can compare it straight to your home.</p></div>'
      + '<ul class="rail">' + comps.map(card).join('') + '</ul><div class="wrap"><p class="hint">Swipe or scroll sideways to see them all.</p></div></section>'
      + '<section class="market" aria-labelledby="market-h"><div class="wrap"><h2 id="market-h">' + market + '</h2><p class="lede">' + marketWhy + ' Here’s how ' + E(mk.type) + ' in ' + E(s.zip) + ' sold over the last six months.</p>'
      + '<div class="grid"><div><strong>$' + mk.ppsf.toLocaleString('en-US') + '</strong><p>per square foot, the typical sale price</p></div>'
      + '<div><strong>' + mk.dom + ' days</strong><p>from listing to sold, for the typical home</p></div>'
      + '<div><strong>' + mk.ratio.toFixed(0) + '%</strong><p>of the asking price, what sellers typically got</p></div></div></div></section>'
      + '<section class="plan" id="plan" aria-labelledby="plan-h"><div class="wrap"><h2 id="plan-h">List at ' + M(list) + '.</h2>'
      + '<p class="lede">Priced to draw strong interest in the first weeks on the market while protecting your equity.</p>'
      + '<div class="cta"><a class="pill big" href="' + mail + '">Talk to ' + agent.first + '</a><a class="link" href="tel:' + agent.tel + '">Call ' + agent.phone + '</a></div></div></section>'
      + '</main><footer><div class="wrap"><p>Prepared for you by ' + agent.name + ', ' + agent.firm + ', on ' + today + '.</p>'
      + '<p>This is a comparative market analysis, not an appraisal. ' + (live ? 'Listing data from KW Unified Listing Service, deemed reliable but not guaranteed.' : 'Figures are illustrative.') + '</p>'
      + (courtesy.length ? '<p>Comparable listings courtesy of ' + courtesy.map(E).join('; ') + '.</p>' : '') + '</div></footer>';
    // One orchestrated moment: the value counts up when it first scrolls into view.
    const js = `(function(){var el=document.querySelector('.num[data-to]');if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
var to=+el.getAttribute('data-to'),fmt=function(x){return '$'+(x/1e6).toFixed(2)+'M'},done=false;
var io=new IntersectionObserver(function(es){if(done||!es[0].isIntersecting)return;done=true;io.disconnect();var t0=performance.now(),d=1400;
(function f(t){var p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,4);el.textContent=fmt(to*(.82+.18*e));if(p<1)requestAnimationFrame(f);else el.textContent=${JSON.stringify(M(v.estimate))};})(t0);},{threshold:.6});io.observe(el);})();`;
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>' + E(s.addr) + ' · What your home is worth</title>'
      + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
      + '<link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;700;800&display=swap" rel="stylesheet">'
      + '<style>' + css + '</style></head><body>' + body + '<script>' + js + '</' + 'script></body></html>';
  }
  kwiqMakeCMACard() {
    const href = this.kwiqCmaPdfHref();
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const intro = document.createElement('div');
    intro.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    intro.textContent = 'Your CMA for ' + (this._cmaAddr || 'this property') + ' is ready, built from ' + ((this._cmaComps || []).length || 'the selected') + ' adjusted comps, with adjustments, pricing, and notes in one report. Open it to review, or download to share with your seller.';
    col.appendChild(intro);
    const card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:13px;background:#fff;box-shadow:var(--shadow04);border-radius:12px;padding:12px 14px;';
    card.innerHTML =
      '<span style="width:44px;height:52px;flex:none;border-radius:7px;background:var(--kw-red-tint);color:var(--kw-red);display:flex;align-items:center;justify-content:center;font:var(--fw-extrabold) 11px/1 var(--font-sans);letter-spacing:.5px;">PDF</span>'
      + '<div style="flex:1;min-width:0;"><div style="font:var(--fw-bold) 14px/18px var(--font-sans);color:var(--label-primary);">' + (this._cmaTitle || ((this._cmaAddr || 'Rollingwood') + ' CMA')) + '</div><div style="font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);">' + ((this._cmaComps || []).length || 6) + ' adjusted comps · Comparative Market Analysis</div></div>'
      + '<button type="button" data-cma-print title="Save as PDF" style="flex:none;border:none;border-radius:8px;background:var(--kw-neutral-100);color:var(--label-secondary);cursor:pointer;font:var(--fw-bold) 14px/1 var(--font-sans);padding:10px 18px;">Download</button>'
      + '<button data-cma-open style="flex:none;border:none;border-radius:8px;background:var(--action);color:#fff;cursor:pointer;font:var(--fw-bold) 14px/1 var(--font-sans);padding:10px 18px;">Open</button>';
    col.appendChild(card);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;align-self:stretch;';
    row.appendChild(col);
    return row;
  }
  kwiqDeckScale() {
    const root = document.querySelector('[data-dash-root]');
    const stage = root && root.querySelector('[data-deck-stage]');
    const frame = root && root.querySelector('[data-deck-frame]');
    if (!stage || !frame) return;
    frame.style.transform = 'scale(' + (stage.clientWidth / 960) + ')';
  }
  kwiqDeckGo(n) {
    const slides = this._deckSlides || (this._deckSlides = this.kwiqDeckBuildSlides());
    const i = Math.max(0, Math.min(slides.length - 1, n));
    this._deckIdx = i;
    const root = document.querySelector('[data-dash-root]');
    root.querySelector('[data-deck-frame]').innerHTML = slides[i];
    const c = root.querySelector('[data-deck-counter]');
    if (c) c.textContent = (i + 1) + ' / ' + slides.length;
    this.kwiqDeckScale();
  }
  kwiqDeckOpen() {
    this._deckOpen = true;
    this.kwiqDeckGo(this._deckIdx || 0);
    const ov = document.querySelector('[data-dash-root] [data-deck-overlay]');
    ov.style.opacity = '1'; ov.style.pointerEvents = 'auto';
    requestAnimationFrame(() => this.kwiqDeckScale());
  }
  kwiqDeckClose() {
    this._deckOpen = false;
    const ov = document.querySelector('[data-dash-root] [data-deck-overlay]');
    if (ov) { ov.style.opacity = '0'; ov.style.pointerEvents = 'none'; }
  }
  kwiqReply(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('organize') || t.includes('my day') || t.includes('schedule') || t.includes('prioritize') || t.includes('plan my day') || t.includes('focus')) return "Here's how I'd shape your day, Nina — pick the approach that fits:\n\n1. Lead-first power hour — start by reaching out to your 3 new Facebook leads (Carter, Alexis, Joanne) while they're still fresh.\n2. Knock out the High-priority task — Build Your Contacts Databank, then your two Medium tasks.\n3. Time-block the essentials — a morning prospecting block, midday calls/appointments, and a short admin wrap-up.\n\nWhy it matters: reaching new leads quickly is the single biggest driver of whether they convert — every hour you wait lowers your odds of connecting. Protecting dedicated time for lead gen and appointments is what keeps your pipeline full and grows your GCI, instead of letting admin work crowd out income-producing activity.\n\nWant me to turn one of these into tasks and block the time on your calendar?";
    if (t.includes('pipeline')) return "Your pipeline is light right now — 0 opportunities logged YTD and 152 leads still waiting on first contact. The fastest way to fill it is to work those new leads today. Want me to pull the 3 newest and draft outreach?";
    if (t.includes('call') || t.includes('contacts to call')) return "These are worth a call today: your 3 newest leads — Carter Dean, Alexis Nichols, and Joanne Rice. They're all fresh Facebook ad leads, so calling now gives you the best shot at connecting. Want a quick opening script for each?";
    if (t.includes('social')) return "Happy to. Share the listing address and one or two highlights — price, a standout room, the neighborhood — and I'll write a ready-to-post caption with a few relevant hashtags.";
    if (t.includes('listing')) return "Let's make it shine. Give me the address, beds/baths, square footage, and a couple of standout features, and I'll draft a polished listing description you can drop straight into the MLS and your marketing.";
    if (t.includes('comp')) return "Send me the subject property and a recent nearby sale, and I'll compare price per square foot, beds/baths, and days on market so you can price or advise with confidence.";
    if (t.includes('market update') || t.includes('market')) return "I'll draft a friendly market update email for your database. Tell me the area you want to feature and I'll pull in recent sales and trends, then close with a clear call to action.";
    if (t.includes('lead')) return "You have 152 leads that haven't been contacted yet — 3 came in this week: Carter Dean, Alexis Nichols, and Joanne Rice, all from Facebook ads. Want me to draft a first-touch message or enroll them in a SmartPlan?";
    if (t.includes('email') || t.includes('follow')) return "Here's a draft for Carter Dean:\n\nHi Carter, thanks for reaching out about your home search! I'd love to learn what you're looking for. Are you free for a quick call this week?\n\nWant me to adjust the tone or save it as a task?";
    if (t.includes('task') || t.includes('due') || t.includes('today')) return "You have 3 open tasks: Build Your Contacts Databank (High), Connect Applications (Medium), and Launch Agent Site (Medium). Want me to reprioritize or mark any complete?";
    if (t.includes('smartplan') || t.includes('plan')) return "A New Buyer SmartPlan usually runs a welcome email, a needs-assessment call task, and a weekly listings digest. Want me to set it up and enroll your 3 newest leads?";
    if (t.includes('goal') || t.includes('gci')) return "You're at the start of the year — nothing logged YTD yet. Set a GCI target and I'll break it into the weekly leads and appointments you'll need to hit it.";
    return "Happy to help. I can summarize your pipeline, draft outreach, surface today's tasks, or build a SmartPlan. Where would you like to start?";
  }
  kwiqSend(text) {
    text = (text || '').trim();
    if (!text) return;
    const root = document.querySelector('[data-dash-root]');
    const msgs = root.querySelector('[data-kwiq-messages]');
    const empty = root.querySelector('[data-kwiq-empty]');
    const dr0 = root.querySelector('[data-kwiq-drawer]');
    if (dr0 && !dr0.hasAttribute('data-kwiq-chat')) this.kwiqSetChatTitle(this.kwiqChatTitle(text));
    this.kwiqEnterChat();
    if (!this._kwiqHistActive) this.kwiqHistAdd(text);
    const inp = root.querySelector('[data-kwiq-input]');
    msgs.appendChild(this.kwiqMakeUser(text));
    if (inp) inp.value = '';
    msgs.scrollTop = msgs.scrollHeight;
    if (this._f2Await) {
      const t = text.trim().toLowerCase();
      if (/^(yes|yep|yeah|yup|sure|correct|please|do that|that one|contact|today)/.test(t)) { this._f2Await = false; this.kwiqF2Resolve('leads'); return; }
      const cls = this.kwiqF2Classify(text);
      if (cls) { this._f2Await = false; this.kwiqF2Resolve(cls); return; }
      if (this._f2Repairs < 1) { this.kwiqF2Repair(); return; }
      this._f2Await = false;
      this.kwiqMsgs().appendChild(this.kwiqMakeKwiq('I’ll go with who to contact today — just say the word if you meant something else.'));
      this.kwiqF2Resolve('leads');
      return;
    }
    if (this._scopeAwait) {
      const cls = this.kwiqScopeClassify(text);
      if (cls) { this._scopeAwait = false; this.kwiqScopeResolve(cls); return; }
      if (this._scopeRepairs < 1) {
        this._scopeRepairs++;
        const m = this.kwiqMsgs();
        const typing = this.kwiqMakeTyping();
        m.appendChild(typing); m.scrollTop = m.scrollHeight;
        setTimeout(() => { typing.remove(); m.appendChild(this.kwiqMakeScopeChips('No problem — pick a focus and I’ll pull the right people:')); m.scrollTop = m.scrollHeight; }, 600);
        return;
      }
      this._scopeAwait = false;
      this.kwiqMsgs().appendChild(this.kwiqMakeKwiq('I’ll line up calls across everyone for now — say “recruits,” “clients,” or “active transactions” to narrow it.'));
      this.kwiqScopeResolve('everyone');
      return;
    }
    if (this._siteAwait) {
      this._siteAwait = false;
      const t = text.trim().toLowerCase();
      if (/^(yes|yep|yeah|yup|sure|ok|okay|please|do it|go ahead|create|make|build)/.test(t)) { this.kwiqSiteBuild(); return; }
      if (/^(no|nope|not now|later|skip|maybe later)/.test(t)) { this.kwiqMsgs().appendChild(this.kwiqMakeKwiq('No problem. Just ask for a website for this CMA whenever you’re ready.')); return; }
    }
    if (this._cmaComps && /\b(website|landing page|web page|site)\b/i.test(text) && !this.kwiqIsCMA(text)) { this.kwiqSiteBuild(); return; }
    if (this._cmaAwaitAddr) {
      this._cmaAwaitAddr = false;
      const a = this.kwiqParseAddress(text);
      if (a) { this.kwiqCmaAutoBuild(a); return; }
    }
    if (this.kwiqIsErrorDemo(text)) { this.kwiqErrorDemo(); return; }
    if (this.kwiqIsPartial(text)) { this.kwiqPartialContacts(); return; }
    if (this.kwiqIsNoContacts(text)) { this.kwiqNoContacts(); return; }
    if (this.kwiqIsScopeChips(text)) { this.kwiqScopeChips(); return; }
    if (this.kwiqIsDisambig(text)) { this.kwiqDisambig(); return; }
    if (this.kwiqIsCMA(text)) { this.kwiqCmaAsk(text); return; }
    if (this.kwiqIsSocial(text)) { this.kwiqSocialAsk(text); return; }
    let kind = 'default', make;
    if (this.kwiqIsOpenHouse(text)) { kind = 'leads'; make = () => this.kwiqMakeOpenHouseLeads(); }
    else if (this.kwiqIsCallList(text)) { kind = 'leads'; make = () => this.kwiqMakeCallList(); }
    else if (this.kwiqIsDeck(text)) { kind = 'deck'; make = () => this.kwiqMakeDeckCard(); }
    else { make = () => this.kwiqMakeKwiq(this.kwiqReply(text)); }
    const dur = kind === 'default' ? 1300 : 1600;
    this.kwiqRunLoader(this.kwiqLoaderLines(kind), dur, () => {
      this.kwiqMsgs().appendChild(make());
    });
  }

  kwiqEmailDrafts(name) {
    const first = (name || '').split(' ')[0];
    const known = {
      'Marcus Webb': [
        { tone: 'Warm check-in', subject: "Almost a year in the new place!", body: "Hi " + first + ",\n\nHard to believe it's almost a year since you got the keys — how's the home treating you? I'd love to hear how you've settled in.\n\nIf there's ever anything you need, from a trusted contractor to a quick value check, I'm only a message away.\n\nWarmly,\nNina" },
        { tone: 'Referral ask', subject: "A quick hello — and a small favor", body: "Hi " + first + ",\n\nIt's hard to believe it's been nearly a year! I hope the place still feels like home.\n\nIf you know anyone thinking about buying or selling this year, I'd be grateful for the introduction — taking great care of your friends would mean a lot to me.\n\nAlways here if you need anything,\nNina" },
        { tone: 'Brief', subject: "Checking in", body: "Hi " + first + ",\n\nAlmost a year in — just wanted to say hello and see how everything's going. Anything I can help with?\n\nNina" },
      ],
    };
    if (known[name]) return known[name];
    return [
      { tone: 'Warm intro', subject: "Great to connect, " + first, body: "Hi " + first + ",\n\nThanks for reaching out about your home search! I'd love to learn what you're looking for and how I can help.\n\nAre you free for a quick call this week?\n\nTalk soon,\nNina" },
      { tone: 'Direct', subject: "Your home search", body: "Hi " + first + ",\n\nI'd love to help with your search. What are the top things on your list — area, budget, and timing?\n\nReply here or grab a time that works and we'll go from there.\n\nNina" },
      { tone: 'Value-first', subject: "A few homes you might like", body: "Hi " + first + ",\n\nBased on what you've been browsing, I can put together a short list of homes that fit — and flag new ones the moment they hit the market.\n\nWant me to send your first set this week?\n\nNina" },
    ];
  }
  kwiqEmailCard(name, drafts) {
    const card = document.createElement('div');
    card.setAttribute('data-email-card', '');
    card.__drafts = drafts;
    card.style.cssText = 'display:flex;flex-direction:column;background:#fff;box-shadow:var(--shadow04);border-radius:12px;overflow:hidden;';
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;padding:11px 13px 2px;';
    drafts.forEach((d, i) => {
      const b = document.createElement('button');
      b.setAttribute('data-email-tone', i);
      b.textContent = d.tone;
      const on = i === 0;
      b.style.cssText = 'border:none;cursor:pointer;border-radius:999px;padding:6px 12px;font:var(--fw-bold) 12px/16px var(--font-sans);transition:background .12s,color .12s;' + (on ? 'background:var(--action);color:#fff;' : 'background:var(--kw-neutral-100);color:var(--label-secondary);');
      tabs.appendChild(b);
    });
    const body = document.createElement('div');
    body.style.cssText = 'padding:11px 14px 12px;display:flex;flex-direction:column;gap:7px;';
    const to = document.createElement('div');
    to.style.cssText = 'font:var(--fw-regular) 12px/16px var(--font-sans);color:var(--label-tertiary);';
    to.innerHTML = '<span style="font-weight:700;color:var(--label-secondary);">To:</span> ' + name;
    const subj = document.createElement('div');
    subj.setAttribute('data-email-subject', '');
    subj.style.cssText = 'font:var(--fw-bold) 15px/20px var(--font-sans);color:var(--label-primary);';
    subj.textContent = drafts[0].subject;
    const bodyText = document.createElement('div');
    bodyText.setAttribute('data-email-body', '');
    bodyText.style.cssText = 'font:var(--fw-regular) 14px/21px var(--font-sans);color:var(--label-secondary);white-space:pre-wrap;border-top:1px solid var(--divider);padding-top:9px;margin-top:2px;';
    bodyText.textContent = drafts[0].body;
    body.appendChild(to); body.appendChild(subj); body.appendChild(bodyText);
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;padding:0 14px 13px;';
    const use = document.createElement('button');
    use.setAttribute('data-email-use', '');
    use.textContent = 'Use this draft';
    use.style.cssText = 'border:none;cursor:pointer;border-radius:8px;padding:9px 16px;font:var(--fw-bold) 13px/17px var(--font-sans);background:var(--action);color:#fff;';
    foot.appendChild(use);
    card.appendChild(tabs); card.appendChild(body); card.appendChild(foot);
    return card;
  }
  kwiqMakeEmailDraft(name) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:10px;flex:1;min-width:0;';
    const intro = document.createElement('div');
    intro.style.cssText = 'color:var(--label-primary);padding:2px 0;font:var(--fw-regular) 14px/20px var(--font-sans);';
    intro.textContent = "Here are a few drafts for " + name + " — pick the tone that fits. You can tweak any of them before sending:";
    col.appendChild(intro);
    col.appendChild(this.kwiqEmailCard(name, this.kwiqEmailDrafts(name)));
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;align-self:stretch;';
    row.appendChild(col);
    return row;
  }
  kwiqEmailDraft(name) {
    this.kwiqEnterChat();
    this.kwiqRunLoader(this.kwiqLoaderLines('email'), 1600, () => {
      this.kwiqMsgs().appendChild(this.kwiqMakeEmailDraft(name));
    });
  }
  kwiqEmailPick(el) {
    const card = el.closest('[data-email-card]');
    if (!card || !card.__drafts) return;
    const idx = +el.getAttribute('data-email-tone');
    const d = card.__drafts[idx];
    if (!d) return;
    card.querySelector('[data-email-subject]').textContent = d.subject;
    card.querySelector('[data-email-body]').textContent = d.body;
    card.querySelectorAll('[data-email-tone]').forEach((c, i) => {
      const on = i === idx;
      c.style.background = on ? 'var(--action)' : 'var(--kw-neutral-100)';
      c.style.color = on ? '#fff' : 'var(--label-secondary)';
    });
  }

  componentDidMount() { this.applyProps(); this.wire(); }
  componentDidUpdate() { this.applyProps(); }
  renderVals() { return {}; }
}
