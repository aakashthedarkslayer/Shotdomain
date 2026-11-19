# Storage of a fully used account, from the limits in lib/plans.ts.
# Scheduled runs are stored twice: in the schedule's run folder (runsKept per
# schedule) and copied into capture history (historyKept captures, shared with
# one-off captures). PNG size and storage prices are estimates.
DEVICES = 4
MB = 1.5            # ESTIMATE: mean full-page PNG on a real site (range 0.5-3)
DISK = 0.15         # $/GB-month, disk volume (numbers.json assumption)
R2 = 0.015          # $/GB-month, Cloudflare R2 Standard (developers.cloudflare.com/r2/pricing)
plans = {
  'Studio / Lifetime': dict(sites=5, pages=25, runs=10, history=100, oneoff=150, net=9-0.95),
  'Agency': dict(sites=25, pages=100, runs=30, history=500, oneoff=500, net=29-(29*0.05+0.5)),
}
rows = []
for name, p in plans.items():
    sched_store = p['sites'] * p['pages'] * DEVICES * p['runs']
    for case, hist_pages in (('schedules used daily', p['pages']), ('history filled with largest one-off captures', p['oneoff'])):
        hist = p['history'] * hist_pages * DEVICES
        pngs = sched_store + hist
        gb = pngs * MB / 1000
        rows.append((name, case, sched_store, hist, pngs, gb, gb*DISK, gb*R2, p['net']))
print('| plan | case | schedule-run PNGs | history PNGs | total PNGs | GB at 1.5 MB | $/mo on disk ($0.15/GB) | $/mo on R2 ($0.015/GB) | net revenue $/mo |')
print('|---|---|---:|---:|---:|---:|---:|---:|---:|')
for r in rows:
    print(f'| {r[0]} | {r[1]} | {r[2]:,} | {r[3]:,} | {r[4]:,} | {r[5]:,.0f} | ${r[6]:,.2f} | ${r[7]:,.2f} | ' + f'${r[8]:.2f}' + ' |')
life = 79 - (79*0.05 + 0.5)
print(f'\nLifetime nets ${life:.2f} once.')
for r in rows[:2]:
    print(f'- {r[1]}: covers {life/r[6]:.0f} months on disk, {life/r[7]:.0f} months on R2 (storage only).')
print(f'\nDaily screenshots, schedules maxed: Studio {5*25*DEVICES:,}/day, Agency {25*100*DEVICES:,}/day.')
