/* Softbound v3: shared note data (SCENE owns this file). ?n=120 seeds extra notes to prove the shelf scales. */
(function () {
  'use strict';
  var notes = [
    {id:1, title:"Kyoto in April", body:"Philosopher's Path at 6am before the crowds. Fushimi Inari, top gate at sunset. Ask Kenji about the tofu place in Arashiyama.", tag:"Travel", date:"Apr 2", mood:"calm"},
    {id:2, title:"Grandma's dal makhani", body:"Soak urad overnight. Butter at the end, never the start. Smoke with a hot coal in a steel bowl for 2 minutes.", tag:"Recipes", date:"Mar 28", mood:"warm"},
    {id:3, title:"Things to tell Mira", body:"The bakery reopened. That song from the wedding is called 'Saibo'. She was right about the blue sofa.", tag:"Personal", date:"Mar 25", mood:"tender"},
    {id:4, title:"Q3 launch ideas", body:"Waitlist with a referral ladder. Founder video, no slides. Ship the dark mode first, it's what people screenshot.", tag:"Work", date:"Mar 21", mood:"bright"},
    {id:5, title:"Books for the monsoon", body:"Pachinko. The Overstory. A Suitable Boy (finally). Re-read Invisible Cities.", tag:"Reading", date:"Mar 17", mood:"calm"}
  ];
  var n = 0;
  try { n = parseInt(new URLSearchParams(location.search).get('n'), 10) || 0; } catch (e) {}
  if (n > notes.length) {
    var tags = ['Travel', 'Recipes', 'Personal', 'Work', 'Reading', 'Ideas'];
    var words = ['Lisbon', 'Sourdough', 'Garden', 'Roadmap', 'Haiku', 'Ceramics', 'Monsoon', 'Market', 'Letters', 'Sketches', 'Tea', 'Harbour', 'Retro', 'Moodboard', 'Fern', 'Ramen', 'Atlas', 'Studio', 'Weekend', 'Kites'];
    var kinds = ['notes', 'list', 'plan', 'diary', 'ideas', 'draft'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (var i = notes.length; i < n; i++) {
      notes.push({id: i + 1, title: words[(i * 7) % words.length] + ' ' + kinds[(i * 3) % kinds.length], body: 'Seeded note ' + (i + 1) + '.',
        tag: tags[i % tags.length], date: months[i % 12] + ' ' + (1 + (i * 5) % 28), mood: 'calm'});
    }
  }
  window.SB_NOTES = notes;
  window.SB_CLOTH = {Travel:'#A9C8EE', Recipes:'#F5B98A', Personal:'#EFB3C2', Work:'#A8DCC4', Reading:'#F3DB8C', Ideas:'#CDBDF2'};
  window.SB_RIBBON = {Travel:'#E98C73', Recipes:'#5FA98A', Personal:'#8E7DD2', Work:'#EC8F94', Reading:'#6A93D3', Ideas:'#EBBE5E'};
  window.SB_INK = {Travel:'#2C4E78', Recipes:'#7A3F1C', Personal:'#80344B', Work:'#1E5A43', Reading:'#6A4C07', Ideas:'#4B3D8A'};
  // tag glyphs (24x24, evenodd fill), shared by the shelf chips and the note page (kept from v2)
  window.SB_GLYPH = {
    Ideas:'M12 2.5C12.9 8 16 11.1 21.5 12 16 12.9 12.9 16 12 21.5 11.1 16 8 12.9 2.5 12 8 11.1 11.1 8 12 2.5z',
    Travel:'M2.6 10.9 20.4 3.4c.7-.3 1.4.4 1.1 1.1l-7.5 17.8c-.3.8-1.4.7-1.6-.1l-1.9-7.1-7.1-1.9c-.8-.2-.9-1.3-.1-1.6z',
    Recipes:'M2.5 11.5h19a9.5 9.5 0 0 1-19 0zM7.5 3.6a1.1 1.1 0 0 1 2.2 0v4.6a1.1 1.1 0 0 1-2.2 0zM14.3 3.6a1.1 1.1 0 0 1 2.2 0v4.6a1.1 1.1 0 0 1-2.2 0z',
    Personal:'M12 21.2s-9-5.3-9-11.6A5 5 0 0 1 12 6.7a5 5 0 0 1 9 2.9c0 6.3-9 11.6-9 11.6z',
    Work:'M9 3.5h6A2 2 0 0 1 17 5.5V7h2.5A2.5 2.5 0 0 1 22 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-8A2.5 2.5 0 0 1 4.5 7H7V5.5a2 2 0 0 1 2-2zM9 5.5V7h6V5.5z',
    Reading:'M2 5.2c3.3-1.1 6.7-.8 9 1.3V20c-2.4-1.7-5.8-2-9-1.1zM22 5.2c-3.3-1.1-6.7-.8-9 1.3V20c2.4-1.7 5.8-2 9-1.1z'
  };
  window.SB_GLYPH_SVG = function (tag, size) { var d = window.SB_GLYPH[tag] || window.SB_GLYPH.Ideas;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="' + d + '"/></svg>'; };
  window.SB_WORDS = function (s) { return (String(s || '').trim().match(/\S+/g) || []).length; };
})();
