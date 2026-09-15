// Step-through walkthroughs for blog posts: one .wt-step visible at a time,
// with dots, prev/next buttons and keyboard arrows. Without JS all steps show.
(function () {
  function init(wt) {
    var steps = Array.prototype.slice.call(wt.querySelectorAll('.wt-step'));
    if (steps.length < 2) return;
    var i = 0;
    var nav = document.createElement('div');
    nav.className = 'wt-nav';
    var prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'wt-btn'; prev.textContent = '← Prev';
    var next = document.createElement('button');
    next.type = 'button'; next.className = 'wt-btn'; next.textContent = 'Next →';
    var dots = document.createElement('div');
    dots.className = 'wt-dots';
    var label = document.createElement('div');
    label.className = 'wt-label';
    steps.forEach(function (s, k) {
      var d = document.createElement('button');
      d.type = 'button'; d.className = 'wt-dot';
      d.setAttribute('aria-label', 'Step ' + (k + 1));
      d.addEventListener('click', function () { show(k); });
      dots.appendChild(d);
    });
    function show(k) {
      i = (k + steps.length) % steps.length;
      steps.forEach(function (s, j) { s.classList.toggle('wt-active', j === i); });
      Array.prototype.forEach.call(dots.children, function (d, j) { d.classList.toggle('wt-active', j === i); });
      label.textContent = (i + 1) + ' / ' + steps.length + (steps[i].dataset.label ? ' · ' + steps[i].dataset.label : '');
    }
    prev.addEventListener('click', function () { show(i - 1); });
    next.addEventListener('click', function () { show(i + 1); });
    wt.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
    });
    wt.tabIndex = 0;
    nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(label); nav.appendChild(next);
    wt.appendChild(nav);
    wt.classList.add('wt-ready');
    show(0);
  }
  function ready() { Array.prototype.forEach.call(document.querySelectorAll('.walkthrough'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
