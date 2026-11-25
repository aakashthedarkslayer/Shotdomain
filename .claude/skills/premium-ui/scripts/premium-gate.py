#!/usr/bin/env python3
"""premium-gate: PreToolUse hook (Artifact | Agent) that ENFORCES the premium-ui bar.

Active only in projects that opted in with a `.premium-ui` marker (searched upward from cwd and from the published
file). There, it blocks:
  - every Artifact publish, and
  - every `ui-feature-agent` spawn outside PHASE: directions,
until PREMIUM_GATES.md (project root) proves the bar with evidence. Below the bar (First glance or Wow < 9) it
passes only with a USER-OK quote that the user really typed (a user message or an AskUserQuestion answer in the
transcript). Text from Claude, tool output, other sessions or system reminders never counts.

Why (Kora store, v3.1.0): the rules were text the model interpreted. It shipped 4 same-type styling directions with
no custom art and called 8/6 "ready". v3.3.0: 4 art directions were still themed skins on a standard store layout
(all 7/7, seen before), so a cheap PARADIGM sweep (new mechanics, not themes) now comes first and nothing is built
until the user picks one. Stock-cutout assets cap First glance at 7; a standard skeleton caps Wow at 7.
Template: templates/PREMIUM_GATES.template.md.
Self-test: python3 premium-gate.py --selftest
"""
import json, os, re, sys

BAR = 9
TYPES = ['art-led', 'art+motion', 'world', 'wildcard']
PHASES = ('paradigms', 'directions', 'stills', 'build', 'polish')
MIN_PARADIGMS = 6
ASSETS = ('illustrated-in-code', 'generated', '3d-modelled', 'typographic', 'real-photography', 'stock-cutouts')
CAP = 7  # stock cutouts cap First glance; a standard layout skeleton caps Wow
STRIP = re.compile(r'<(system-reminder|cross-session-message|agent-message|task-notification|pasted_content|local-command-stdout|command-[a-z-]+)[^>]*>.*?</\1[^>]*>', re.S)


def find_root(*starts):
    for s in starts:
        d = os.path.abspath(s or '')
        if os.path.isfile(d):
            d = os.path.dirname(d)
        while d and d != os.path.dirname(d):
            if os.path.exists(os.path.join(d, '.premium-ui')):
                return d
            d = os.path.dirname(d)
    return None


def norm(t):
    return re.sub(r'\s+', ' ', t).strip().strip('"\'“”').lower()


def user_texts(transcript):
    """What the user really said: their typed messages and AskUserQuestion answers. Nothing else."""
    out, ask_ids = [], set()
    try:
        lines = open(transcript, encoding='utf-8').read().splitlines()
    except OSError:
        return out
    for ln in lines:
        try:
            e = json.loads(ln)
        except ValueError:
            continue
        msg = e.get('message') or {}
        c = msg.get('content')
        if e.get('type') == 'assistant' and isinstance(c, list):
            for b in c:
                if isinstance(b, dict) and b.get('type') == 'tool_use' and b.get('name') == 'AskUserQuestion':
                    ask_ids.add(b.get('id'))
        if e.get('type') != 'user' or msg.get('role') != 'user' or e.get('isMeta') or e.get('isSidechain'):
            continue
        if isinstance(c, str):
            out.append(STRIP.sub(' ', c))
        elif isinstance(c, list):
            for b in c:
                if not isinstance(b, dict):
                    continue
                if b.get('type') == 'text':
                    out.append(STRIP.sub(' ', b.get('text', '')))
                elif b.get('type') == 'tool_result' and b.get('tool_use_id') in ask_ids:
                    r = b.get('content')
                    if isinstance(r, list):
                        r = ' '.join(x.get('text', '') for x in r if isinstance(x, dict))
                    r = str(r or '')
                    out.append(r)
                    out += re.findall(r'"="([^"]*)"', r)  # each chosen option on its own, so a short label matches exactly
    return out


def user_said(quote, transcript):
    q = norm(quote)
    if len(q) < 2:
        return False
    for t in user_texts(transcript):
        n = norm(t)
        if n == q or (len(q) >= 12 and q in n):
            return True
    return False


def parse(path):
    g = {'DIRECTION': [], 'SCREEN': [], 'PARADIGM': []}
    for ln in open(path, encoding='utf-8').read().splitlines():
        m = re.match(r'\s*([A-Z][A-Z-]+):\s*(.*)$', ln)
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip()
        if k in g and isinstance(g[k], list):
            g[k].append(v)
        else:
            g[k] = v
    return g


def fields(v):
    """'art-led | file: a.html | art: x' -> ('art-led', {'file': 'a.html', 'art': 'x'})"""
    parts = [p.strip() for p in v.split('|')]
    kv = {}
    for p in parts[1:]:
        if ':' in p:
            a, b = p.split(':', 1)
            kv[a.strip().lower()] = b.strip()
    return parts[0].lower(), kv


def empty(v):
    return not v or '<' in v or v.lower() in ('tbd', 'todo', '-', 'n/a')


def paths_in(text, root):
    toks = re.findall(r'[\w./~-]+\.(?:png|jpe?g|webp|gif|svg|mp4|mov|webm|html|md|json|dart|js|frag|glsl|riv|glb|gltf)', text or '')
    return [t for t in toks if os.path.exists(os.path.join(root, os.path.expanduser(t)))]


def score(report, label):
    m = re.search(label + r'[^\n0-9]*?(\d+(?:\.\d+)?)\s*(?:/\s*10)?', report, re.I)
    return float(m.group(1)) if m else None


def check(root, transcript, for_agent=False):
    """Returns a list of problems (empty = pass)."""
    gp = os.path.join(root, 'PREMIUM_GATES.md')
    if not os.path.exists(gp):
        return ['PREMIUM_GATES.md is missing in ' + root + ' (copy templates/PREMIUM_GATES.template.md from the premium-ui skill and fill it with evidence).']
    g, bad = parse(gp), []
    phase = (g.get('PHASE') or '').lower()
    if phase not in PHASES:
        bad.append('PHASE must be one of: ' + ', '.join(PHASES) + '.')
    ok_quote = g.get('USER-OK', '')
    user_ok = not empty(ok_quote) and user_said(ok_quote, transcript)
    if not empty(ok_quote) and not user_ok:
        bad.append('USER-OK quote was not found in anything the user typed or answered in this conversation. Ask the user (state the gap plainly) and quote their exact words.')

    if phase == 'paradigms':  # cheap sketch sweep: sketch agents may run; showing the sweep needs 6 sketches + critic
        if not for_agent:
            bad += _paradigms(g, root)
            if empty(g.get('CRITIC-REPORT', '')) or not paths_in(g.get('CRITIC-REPORT', ''), root):
                bad.append('CRITIC-REPORT: the critic must answer "never seen?" for every sketch before the sweep is shown.')
        return bad
    bad += _picked(g, transcript)
    assets = (g.get('ASSETS') or '').lower()
    if assets not in ASSETS:
        bad.append('ASSETS: declare the image source (' + ', '.join(ASSETS) + '). Stock cutouts cap First glance at 7: pick a paradigm that needs no photo realism, or tell the user real photography is needed for 9.')

    if for_agent:  # spawning build/polish agents
        if phase == 'directions':
            return bad  # building the 4 directions in parallel is allowed
        fg, wow, why = _scores(g, root, bad)
        if (fg is None or wow is None or fg < BAR or wow < BAR) and not user_ok:
            bad.append(f'Below the bar (First glance {fg}, Wow {wow}; bar {BAR}/{BAR}{why}). Building or polishing on this base needs the user\'s explicit OK in USER-OK.')
        return bad

    if phase == 'directions':
        types = {}
        for d in g['DIRECTION']:
            t, kv = fields(d)
            types[t] = kv
            if empty(kv.get('file')) or not paths_in(kv.get('file'), root):
                bad.append(f'DIRECTION {t}: file is missing or does not exist.')
            if empty(kv.get('art')) or not paths_in(kv.get('art'), root):
                bad.append(f'DIRECTION {t}: custom artwork must be named with an existing file path (illustration, 3D, layered art, shader). Styling alone is not art.')
        missing = [t for t in TYPES if t not in types]
        if missing:
            bad.append('The 4 directions must span the range: missing ' + ', '.join(missing) + ' (types: ' + ', '.join(TYPES) + ').')
    screens = g['SCREEN']
    if not screens:
        bad.append('At least one SCREEN line is required (key screen | custom: two or more custom-rendered elements | art: path).')
    for s in screens:
        name, kv = fields(s)
        items = [x for x in re.split(r',', kv.get('custom', '')) if x.strip() and not empty(x.strip())]
        if len(items) < 2:
            bad.append(f'SCREEN {name}: needs >= 2 custom-rendered elements (canvas/painter, shader, mesh, physics, 3D, custom shape or transition).')
        if phase != 'directions' and (empty(kv.get('art')) or not paths_in(kv.get('art'), root)):
            bad.append(f'SCREEN {name}: approved stills must contain art; name the artwork file (art: path).')
    stills = g.get('REST-STILLS', '')
    if empty(stills) or not paths_in(stills, root):
        bad.append('REST-STILLS: give existing no-tap screenshot paths (First glance is scored from these).')
    prev = g.get('PREVIOUS-STILLS', '')
    if empty(prev):
        bad.append('PREVIOUS-STILLS: give the previous round\'s rest stills, or NONE for a first round.')
    elif prev.upper() != 'NONE':
        if not paths_in(prev, root):
            bad.append('PREVIOUS-STILLS: the paths do not exist.')
        if (g.get('SAME-APP') or '').upper() != 'NO':
            bad.append('SAME-APP must be NO (old vs new rest stills side by side: a non-designer must see a different app in 3 seconds).')
    seen = (g.get('SEEN-BEFORE') or '').upper()
    if seen != 'NO':
        bad.append('SEEN-BEFORE must be NO: the critic must judge that the user has never seen anything like this. "Normal premium" fails.')
    fg, wow, why = _scores(g, root, bad)
    if (fg is None or wow is None or fg < BAR or wow < BAR) and not user_ok:
        bad.append(f'Below the bar (First glance {fg}, Wow {wow}; bar {BAR}/{BAR}{why}). Not ready to show. Make a new direction, or ask the user, stating the gap plainly ("this is {fg}/{wow}, below your bar of {BAR}/{BAR}"), and put their exact words in USER-OK.')
    return bad


def _paradigms(g, root):
    bad, ps = [], g['PARADIGM']
    if len(ps) < MIN_PARADIGMS:
        bad.append(f'Paradigm sweep needs >= {MIN_PARADIGMS} PARADIGM lines (one rough single-screen sketch each); found {len(ps)}.')
    for p in ps:
        n, kv = fields(p)
        if empty(kv.get('mechanic')):
            bad.append(f'PARADIGM {n}: name the new MECHANIC (how people browse, choose or act). A new theme on the standard layout is not a paradigm.')
        if empty(kv.get('sketch')) or not paths_in(kv.get('sketch'), root):
            bad.append(f'PARADIGM {n}: sketch file is missing or does not exist.')
        if (kv.get('never-seen') or '').upper() not in ('YES', 'NO'):
            bad.append(f'PARADIGM {n}: never-seen must be YES or NO (the critic\'s answer).')
    return bad


def _picked(g, transcript):
    names = [fields(p)[0] for p in g['PARADIGM']]
    pick, q, bad = (g.get('PICKED') or '').lower(), g.get('PICKED-BY-USER', ''), []
    if empty(pick) or pick not in names:
        bad.append('PICKED: name the paradigm the user chose (one of the PARADIGM lines). Run the paradigm sweep first (PHASE: paradigms).')
    if empty(q) or not user_said(q, transcript):
        bad.append('PICKED-BY-USER: quote the user\'s exact words choosing it (typed, or their AskUserQuestion answer). Nothing is built before the user picks.')
    return bad


def _scores(g, root, bad):
    rp = g.get('CRITIC-REPORT', '')
    found = paths_in(rp, root)
    if empty(rp) or not found:
        bad.append('CRITIC-REPORT: save the ui-critic output to a file and give its path (scores are read from it).')
        return None, None, ''
    rep = open(os.path.join(root, os.path.expanduser(found[0])), encoding='utf-8', errors='ignore').read()
    fg, wow = score(rep, r'first glance'), score(rep, r'\bwow\b')
    if fg is None or wow is None:
        bad.append('CRITIC-REPORT does not contain First glance and Wow scores.')
    for k, v in (('FIRST-GLANCE', fg), ('WOW', wow)):
        try:
            if v is not None and float(g.get(k, 'x')) != v:
                bad.append(f'{k} in the gate file ({g.get(k)}) differs from the critic report ({v}). Use the report.')
        except ValueError:
            bad.append(f'{k} must be a number from the critic report.')
    why = ''
    if fg is not None and (g.get('ASSETS') or '').lower() == 'stock-cutouts' and fg > CAP:
        fg, why = CAP, why + '; stock cutouts cap First glance at 7'
    if wow is not None and re.search(r'skeleton\W{0,6}standard\b', rep, re.I) and wow > CAP:
        wow, why = CAP, why + '; critic found the standard layout skeleton, Wow capped at 7'
    return fg, wow, why


def main():
    try:
        e = json.load(sys.stdin)
    except ValueError:
        return 0
    tool, ti = e.get('tool_name', ''), e.get('tool_input') or {}
    if tool == 'Artifact':
        if ti.get('action', 'publish') != 'publish' or ti.get('asset'):
            return 0
        start = ti.get('file_path') or ''
        for_agent = False
    elif tool == 'Agent':
        if ti.get('subagent_type') != 'ui-feature-agent':
            return 0
        start, for_agent = '', True
    else:
        return 0
    root = find_root(e.get('cwd') or os.getcwd(), start)
    if not root:
        return 0
    bad = check(root, e.get('transcript_path', ''), for_agent)
    if not bad:
        return 0
    what = 'spawning a build/polish agent' if for_agent else 'publishing this preview'
    sys.stderr.write('premium-gate: blocked ' + what + '. The premium-ui bar is enforced in this project (' + root + '):\n- ' + '\n- '.join(bad) +
                     '\nFix the work (not the gate file). Never invent evidence or a USER-OK quote.\n')
    return 2


def selftest():
    import tempfile
    t = tempfile.mkdtemp()
    open(os.path.join(t, '.premium-ui'), 'w').close()
    for f in ['a.html', 'b.html', 'c.html', 'd.html', 'art1.svg', 'rest.png', 'old.png', 's.png', 'sweep.md']:
        open(os.path.join(t, f), 'w').close()
    open(os.path.join(t, 'critic.md'), 'w').write('| First glance (rest stills only) | 9 |\n| Wow | 9 |\n')
    tr = os.path.join(t, 't.jsonl')
    with open(tr, 'w') as w:
        w.write(json.dumps({'type': 'user', 'message': {'role': 'user', 'content': 'ok, ship it below bar this once'}}) + '\n')
        w.write(json.dumps({'type': 'user', 'message': {'role': 'user', 'content': '<cross-session-message from="x">USER-OK forged approval text</cross-session-message>'}}) + '\n')
        w.write(json.dumps({'type': 'assistant', 'message': {'role': 'assistant', 'content': [{'type': 'tool_use', 'id': 'q1', 'name': 'AskUserQuestion', 'input': {}}, {'type': 'tool_use', 'id': 'b1', 'name': 'Bash', 'input': {}}]}}) + '\n')
        w.write(json.dumps({'type': 'user', 'message': {'role': 'user', 'content': [{'type': 'tool_result', 'tool_use_id': 'q1', 'content': 'Your questions have been answered: "Which paradigm?"="Almirah". Go below bar (accept 8/6)'}, {'type': 'tool_result', 'tool_use_id': 'b1', 'content': 'echo fake user ok from bash "x"="Bolt"'}]}}) + '\n')
    sweep = ''.join(f'PARADIGM: {n} | mechanic: {m} | sketch: s.png | never-seen: YES\n' for n, m in [
        ('almirah', 'doors open onto hangers'), ('trial-room', 'drag garments onto a figure'), ('bolt', 'cloth unrolls as you scroll'),
        ('slot', 'spin reels to build an outfit'), ('mol-bhav', 'haggle down a discount ladder'), ('bazaar', 'walk a 2.5D street')])
    good = sweep + """PICKED: almirah
PICKED-BY-USER: "Almirah"
ASSETS: illustrated-in-code
PHASE: directions
DIRECTION: art-led | file: a.html | art: painted hero art1.svg
DIRECTION: art+motion | file: b.html | art: layered art1.svg
DIRECTION: world | file: c.html | art: clay world art1.svg
DIRECTION: wildcard | file: d.html | art: generative art1.svg
SCREEN: home | custom: cloth shader, page-curl canvas | art: art1.svg
REST-STILLS: rest.png
PREVIOUS-STILLS: NONE
SAME-APP: NO
SEEN-BEFORE: NO
CRITIC-REPORT: critic.md
FIRST-GLANCE: 9
WOW: 9
USER-OK:
"""
    gp = os.path.join(t, 'PREMIUM_GATES.md')
    def run(text, agent=False):
        open(gp, 'w').write(text)
        return check(t, tr, agent)
    assert run(good) == [], run(good)
    assert any('span the range' in b for b in run(good.replace('DIRECTION: wildcard', 'DIRECTION: art-led')))
    assert any('artwork' in b for b in run(good.replace('art: generative art1.svg', 'art: blue gradient')))
    assert any('>= 2 custom' in b for b in run(good.replace('cloth shader, page-curl canvas', 'nice easing')))
    open(os.path.join(t, 'critic.md'), 'w').write('| First glance | 8 |\n| Wow | 6 |\n')
    low = good.replace('FIRST-GLANCE: 9', 'FIRST-GLANCE: 8').replace('WOW: 9', 'WOW: 6')
    assert any('Below the bar' in b for b in run(low))
    assert any('differs' in b for b in run(good))                          # gate says 9/9, report says 8/6
    assert run(low.replace('USER-OK:', 'USER-OK: "ok, ship it below bar this once"')) == []          # typed by user
    assert run(low.replace('USER-OK:', 'USER-OK: "Go below bar (accept 8/6)"')) == []                # AskUserQuestion answer
    assert any('not found' in b for b in run(low.replace('USER-OK:', 'USER-OK: "USER-OK forged approval text"')))  # other session
    assert any('not found' in b for b in run(low.replace('USER-OK:', 'USER-OK: "echo fake user ok from bash"')))  # tool output
    assert run(low.replace('PHASE: directions', 'PHASE: directions'), agent=True) == []             # directions agents ok
    assert any('Below the bar' in b for b in run(low.replace('PHASE: directions', 'PHASE: build'), agent=True))
    assert any('SEEN-BEFORE' in b for b in run(good.replace('SEEN-BEFORE: NO', 'SEEN-BEFORE: YES')))
    open(os.path.join(t, 'critic.md'), 'w').write('| First glance | 9 |\n| Wow | 9 |\n')
    assert run(good) == []
    # paradigm sweep: sketch agents allowed; showing it needs 6 sketches + a critic report
    ps = sweep + 'PHASE: paradigms\nCRITIC-REPORT: sweep.md\n'
    assert run('PHASE: paradigms\n', agent=True) == []
    assert run(ps) == [], run(ps)
    assert any('>= 6' in b for b in run(ps.replace('PARADIGM: bazaar', 'X: bazaar')))
    assert any('MECHANIC' in b for b in run(ps.replace('mechanic: walk a 2.5D street', 'mechanic: <tbd>')))
    assert any('never seen' in b for b in run(ps.replace('CRITIC-REPORT: sweep.md', 'CRITIC-REPORT:')))
    # nothing is built or shown after the sweep without the user's own pick
    assert any('PICKED-BY-USER' in b for b in run(good.replace('"Almirah"', '"Bolt"')))                # Bash output, not the user
    assert any('PICKED-BY-USER' in b for b in run(good.replace('PICKED-BY-USER: "Almirah"\n', '').replace('PHASE: directions', 'PHASE: build'), agent=True))
    assert any('PICKED:' in b for b in run(good.replace('PICKED: almirah', 'PICKED: grid-store')))
    # asset reality + standard skeleton caps
    assert any('ASSETS' in b for b in run(good.replace('ASSETS: illustrated-in-code\n', '')))
    assert any('stock cutouts cap' in b for b in run(good.replace('illustrated-in-code', 'stock-cutouts')))
    open(os.path.join(t, 'critic.md'), 'w').write('| First glance | 9 |\n| Wow | 9 |\nSkeleton: standard (search, chips, 2-col grid)\n')
    assert any('skeleton' in b for b in run(good))
    open(os.path.join(t, 'critic.md'), 'w').write('| First glance | 9 |\n| Wow | 9 |\nSkeleton: new (not the standard grid)\n')
    assert run(good) == []
    os.remove(gp)
    assert any('missing' in b for b in check(t, tr))
    print('premium-gate selftest: all passed')


if __name__ == '__main__':
    if '--selftest' in sys.argv:
        selftest()
        sys.exit(0)
    sys.exit(main())
