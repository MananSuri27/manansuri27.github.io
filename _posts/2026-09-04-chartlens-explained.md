---
layout: post
title: "Which bar is the model talking about? ChartLens explained"
description: "How ChartLens grounds a multimodal LLM's chart answers to specific bars, points, and sectors, and why that makes hallucinations easy to catch."
date: 2026-09-04 12:00:00
tags: charts multimodal attribution hallucination
categories: research
thumbnail: assets/img/papers/chartlens/hero.png
related_posts: false
toc:
  beginning: true
---

Put a bar chart in front of a multimodal LLM and ask in how many countries the number of import documents in 2005 is above the 2005 average across countries. It answers "3" in a full sentence, instantly, and with total confidence. Now ask yourself how you would check that. You would have to read six bars, compute a mean, and count. The model did none of that visibly. If it misread one bar, the text would look exactly the same.

Text LLMs got a partial fix for this years ago: citations. Make the model point at its source and a human can verify the claim in seconds. Charts never had an equivalent. Our ACL 2025 paper, [ChartLens: Fine-grained Visual Attribution in Charts](/papers/chartlens/), with Puneet Mathur, Nedim Lipka, Franck Dernoncourt, Ryan Rossi, and Dinesh Manocha, gives charts their citations: the specific bars, points, or pie sectors that an answer rests on.

## The idea in one picture

<div class="fig-svg">
<svg viewBox="0 0 900 290" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Before: a chart answer with no way to check it. After: ChartLens highlights the bars that support the answer so a reader can verify it.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>

<text class="t b" x="225" y="30" text-anchor="middle">Chart QA today</text>
<rect class="n" x="30" y="45" width="390" height="230" rx="10"/>
<rect x="60" y="80" width="20" height="90" fill="#2698BA" opacity="0.8"/>
<rect x="90" y="90" width="20" height="80" fill="#2698BA" opacity="0.8"/>
<rect x="120" y="120" width="20" height="50" fill="#2698BA" opacity="0.8"/>
<rect x="150" y="110" width="20" height="60" fill="#2698BA" opacity="0.8"/>
<rect x="180" y="110" width="20" height="60" fill="#2698BA" opacity="0.8"/>
<rect x="210" y="100" width="20" height="70" fill="#2698BA" opacity="0.8"/>
<path class="n" d="M54 170 H244"/>
<rect class="n" x="270" y="70" width="130" height="90" rx="10"/>
<text class="s" x="335" y="95" text-anchor="middle">Q: how many</text>
<text class="s" x="335" y="113" text-anchor="middle">countries above</text>
<text class="s" x="335" y="131" text-anchor="middle">the 2005 average?</text>
<text class="t b" x="335" y="152" text-anchor="middle">Ans: 3</text>
<text class="t b" x="225" y="215" text-anchor="middle" fill="#F29105">Which bars is that based on?</text>
<text class="s" x="225" y="238" text-anchor="middle">The answer looks fine whether it is right or wrong.</text>
<text class="s" x="225" y="256" text-anchor="middle">Nothing in the output points back at the chart.</text>

<path class="flow" d="M425 160 H470"/>
<path d="M470 154 L480 160 L470 166 Z" fill="#B509AC"/>

<text class="t b" x="675" y="30" text-anchor="middle">Chart QA + ChartLens</text>
<rect class="n acc" x="480" y="45" width="390" height="230" rx="10"/>
<rect x="510" y="80" width="20" height="90" fill="#2698BA" opacity="0.8"/>
<rect x="507" y="77" width="26" height="93" rx="4" fill="none" stroke="#00ab37" stroke-width="3"/>
<rect x="540" y="90" width="20" height="80" fill="#2698BA" opacity="0.8"/>
<rect x="537" y="87" width="26" height="83" rx="4" fill="none" stroke="#00ab37" stroke-width="3"/>
<rect x="570" y="120" width="20" height="50" fill="#2698BA" opacity="0.8"/>
<rect x="600" y="110" width="20" height="60" fill="#2698BA" opacity="0.8"/>
<rect x="630" y="110" width="20" height="60" fill="#2698BA" opacity="0.8"/>
<rect x="660" y="100" width="20" height="70" fill="#2698BA" opacity="0.8"/>
<rect x="657" y="97" width="26" height="73" rx="4" fill="none" stroke="#00ab37" stroke-width="3"/>
<path class="n" d="M504 170 H694"/>
<rect class="n" x="720" y="70" width="130" height="90" rx="10"/>
<text class="s" x="785" y="95" text-anchor="middle">Q: how many</text>
<text class="s" x="785" y="113" text-anchor="middle">countries above</text>
<text class="s" x="785" y="131" text-anchor="middle">the 2005 average?</text>
<text class="t b" x="785" y="152" text-anchor="middle">Ans: 3</text>
<text class="t b" x="675" y="215" text-anchor="middle" fill="#00ab37">These three bars. Count them: 3.</text>
<text class="s" x="675" y="238" text-anchor="middle">Attribution = the bars, points, or sectors that</text>
<text class="s" x="675" y="256" text-anchor="middle">support the answer, so a reader can verify it.</text>

</svg>
<div class="fig-caption">Left: a chart answer with nothing pointing back at the chart. Right: the same answer with the three bars that support it highlighted, so verifying it means counting to three.</div>
</div>

<div class="callout"><span class="callout-label">Key idea</span>Do not ask the model for pixel coordinates; MLLMs are bad at that. Find the chart's elements first with segmentation, stamp a label on each one, and ask the model which labels support the answer (set-of-marks prompting). Attribution runs after the answer exists, so it is a check on any chart QA system rather than a new one.</div>

## Walkthrough: the documents-per-shipment chart

The running example is Figure 1 of the paper, a PlotQA-style chart of the number of documents required per shipment to import goods, for six countries in 2005, 2006, and 2007. I redraw it below so each stage can be shown on the same bars.

<div class="walkthrough" markdown="1">
<div class="wt-title">Walkthrough: attributing "Ans: 3" to the bars that support it</div>
<div class="wt-step" data-label="Input" markdown="1">
<h4>1. A chart, a question, and someone's answer</h4>
<div class="fig-svg">
<svg viewBox="0 0 900 312" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The input: a grouped bar chart of documents required per shipment for six countries in 2005, 2006, and 2007, with the question and the answer 3.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
<text class="t b" x="315" y="20" text-anchor="middle">Number of documents required per shipment to import goods</text>
<rect x="230" y="30" width="12" height="12" fill="#1b6f88"/><text class="s" x="246" y="41">2005</text>
<rect x="300" y="30" width="12" height="12" fill="#2698BA"/><text class="s" x="316" y="41">2006</text>
<rect x="370" y="30" width="12" height="12" fill="#9dd3e6"/><text class="s" x="386" y="41">2007</text>
<line class="grid" x1="70" y1="270" x2="590" y2="270"/><text class="s" x="62" y="274" text-anchor="end">0</text>
<line class="grid" x1="70" y1="222" x2="590" y2="222"/><text class="s" x="62" y="226" text-anchor="end">2</text>
<line class="grid" x1="70" y1="174" x2="590" y2="174"/><text class="s" x="62" y="178" text-anchor="end">4</text>
<line class="grid" x1="70" y1="126" x2="590" y2="126"/><text class="s" x="62" y="130" text-anchor="end">6</text>
<line class="grid" x1="70" y1="78" x2="590" y2="78"/><text class="s" x="62" y="82" text-anchor="end">8</text>
<path class="n" d="M70 50 V270 H590"/>
<text class="s" transform="translate(22,160) rotate(-90)" text-anchor="middle">Documents required</text>
<rect x="80" y="54" width="22" height="216" fill="#1b6f88" opacity="0.9"/>
<rect x="102" y="54" width="22" height="216" fill="#2698BA" opacity="0.9"/>
<rect x="124" y="54" width="22" height="216" fill="#9dd3e6" opacity="0.9"/>
<rect x="167" y="78" width="22" height="192" fill="#1b6f88" opacity="0.9"/>
<rect x="189" y="78" width="22" height="192" fill="#2698BA" opacity="0.9"/>
<rect x="211" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.9"/>
<rect x="253" y="150" width="22" height="120" fill="#1b6f88" opacity="0.9"/>
<rect x="275" y="150" width="22" height="120" fill="#2698BA" opacity="0.9"/>
<rect x="297" y="150" width="22" height="120" fill="#9dd3e6" opacity="0.9"/>
<rect x="340" y="126" width="22" height="144" fill="#1b6f88" opacity="0.9"/>
<rect x="362" y="126" width="22" height="144" fill="#2698BA" opacity="0.9"/>
<rect x="384" y="126" width="22" height="144" fill="#9dd3e6" opacity="0.9"/>
<rect x="427" y="126" width="22" height="144" fill="#1b6f88" opacity="0.9"/>
<rect x="449" y="126" width="22" height="144" fill="#2698BA" opacity="0.9"/>
<rect x="471" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.9"/>
<rect x="514" y="102" width="22" height="168" fill="#1b6f88" opacity="0.9"/>
<rect x="536" y="102" width="22" height="168" fill="#2698BA" opacity="0.9"/>
<rect x="558" y="102" width="22" height="168" fill="#9dd3e6" opacity="0.9"/>
<text class="s" x="113" y="290" text-anchor="middle">Algeria</text>
<text class="s" x="200" y="290" text-anchor="middle">Angola</text>
<text class="s" x="286" y="290" text-anchor="middle">Antigua and</text>
<text class="s" x="286" y="306" text-anchor="middle">Barbuda</text>
<text class="s" x="373" y="290" text-anchor="middle">Argentina</text>
<text class="s" x="460" y="290" text-anchor="middle">Armenia</text>
<text class="s" x="546" y="290" text-anchor="middle">Australia</text>
<rect class="n inp" x="630" y="60" width="260" height="204" rx="10"/>
<text class="s b" x="642" y="80" fill="#2698BA" style="opacity:1">Question</text>
<text class="s" x="642" y="100">In how many countries, is the</text>
<text class="s" x="642" y="117">number of documents required</text>
<text class="s" x="642" y="134">per shipment to import goods</text>
<text class="s" x="642" y="151">in 2005 greater than the</text>
<text class="s" x="642" y="168">average number of documents</text>
<text class="s" x="642" y="185">required per shipment to</text>
<text class="s" x="642" y="202">import goods in 2005 taken</text>
<text class="s" x="642" y="219">over all countries?</text>
<rect x="642" y="230" width="70" height="22" rx="6" fill="#2698BA" opacity="0.18"/><text class="t b" x="677" y="246" text-anchor="middle">Ans: 3</text>
</svg>
</div>

The input (chart $$ c $$ plus response $$ v $$) is the image and a question-answer pair. The answer could come from any system, a chart QA model or a person; ChartLens does not regenerate it. The job is to return the set of chart regions that justify "3", and it has to be relevant (every region matters), complete (nothing needed is missing), and precise (nothing extra).

</div>
<div class="wt-step" data-label="Segment" markdown="1">
<h4>2. Find every bar</h4>
<div class="fig-svg">
<svg viewBox="0 0 900 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Segmentation: each of the 18 bars becomes a dashed contour with sampled points inside it, produced by Otsu thresholding, contour splitting, filtering, and SAM.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
<text class="t b" x="315" y="20" text-anchor="middle">Number of documents required per shipment to import goods</text>
<rect x="230" y="30" width="12" height="12" fill="#1b6f88"/><text class="s" x="246" y="41">2005</text>
<rect x="300" y="30" width="12" height="12" fill="#2698BA"/><text class="s" x="316" y="41">2006</text>
<rect x="370" y="30" width="12" height="12" fill="#9dd3e6"/><text class="s" x="386" y="41">2007</text>
<line class="grid" x1="70" y1="270" x2="590" y2="270"/><text class="s" x="62" y="274" text-anchor="end">0</text>
<line class="grid" x1="70" y1="222" x2="590" y2="222"/><text class="s" x="62" y="226" text-anchor="end">2</text>
<line class="grid" x1="70" y1="174" x2="590" y2="174"/><text class="s" x="62" y="178" text-anchor="end">4</text>
<line class="grid" x1="70" y1="126" x2="590" y2="126"/><text class="s" x="62" y="130" text-anchor="end">6</text>
<line class="grid" x1="70" y1="78" x2="590" y2="78"/><text class="s" x="62" y="82" text-anchor="end">8</text>
<path class="n" d="M70 50 V270 H590"/>
<text class="s" transform="translate(22,160) rotate(-90)" text-anchor="middle">Documents required</text>
<rect x="80" y="54" width="22" height="216" fill="#1b6f88" opacity="0.25"/>
<rect class="n acc" x="80" y="54" width="22" height="216" stroke-dasharray="4 3"/>
<circle cx="91" cy="108" r="2.5" fill="#B509AC"/>
<circle cx="91" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="91" cy="216" r="2.5" fill="#B509AC"/>
<rect x="102" y="54" width="22" height="216" fill="#2698BA" opacity="0.25"/>
<rect class="n acc" x="102" y="54" width="22" height="216" stroke-dasharray="4 3"/>
<circle cx="113" cy="108" r="2.5" fill="#B509AC"/>
<circle cx="113" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="113" cy="216" r="2.5" fill="#B509AC"/>
<rect x="124" y="54" width="22" height="216" fill="#9dd3e6" opacity="0.25"/>
<rect class="n acc" x="124" y="54" width="22" height="216" stroke-dasharray="4 3"/>
<circle cx="135" cy="108" r="2.5" fill="#B509AC"/>
<circle cx="135" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="135" cy="216" r="2.5" fill="#B509AC"/>
<rect x="167" y="78" width="22" height="192" fill="#1b6f88" opacity="0.25"/>
<rect class="n acc" x="167" y="78" width="22" height="192" stroke-dasharray="4 3"/>
<circle cx="178" cy="126" r="2.5" fill="#B509AC"/>
<circle cx="178" cy="174" r="2.5" fill="#B509AC"/>
<circle cx="178" cy="222" r="2.5" fill="#B509AC"/>
<rect x="189" y="78" width="22" height="192" fill="#2698BA" opacity="0.25"/>
<rect class="n acc" x="189" y="78" width="22" height="192" stroke-dasharray="4 3"/>
<circle cx="200" cy="126" r="2.5" fill="#B509AC"/>
<circle cx="200" cy="174" r="2.5" fill="#B509AC"/>
<circle cx="200" cy="222" r="2.5" fill="#B509AC"/>
<rect x="211" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.25"/>
<rect class="n acc" x="211" y="78" width="22" height="192" stroke-dasharray="4 3"/>
<circle cx="222" cy="126" r="2.5" fill="#B509AC"/>
<circle cx="222" cy="174" r="2.5" fill="#B509AC"/>
<circle cx="222" cy="222" r="2.5" fill="#B509AC"/>
<rect x="253" y="150" width="22" height="120" fill="#1b6f88" opacity="0.25"/>
<rect class="n acc" x="253" y="150" width="22" height="120" stroke-dasharray="4 3"/>
<circle cx="264" cy="180" r="2.5" fill="#B509AC"/>
<circle cx="264" cy="210" r="2.5" fill="#B509AC"/>
<circle cx="264" cy="240" r="2.5" fill="#B509AC"/>
<rect x="275" y="150" width="22" height="120" fill="#2698BA" opacity="0.25"/>
<rect class="n acc" x="275" y="150" width="22" height="120" stroke-dasharray="4 3"/>
<circle cx="286" cy="180" r="2.5" fill="#B509AC"/>
<circle cx="286" cy="210" r="2.5" fill="#B509AC"/>
<circle cx="286" cy="240" r="2.5" fill="#B509AC"/>
<rect x="297" y="150" width="22" height="120" fill="#9dd3e6" opacity="0.25"/>
<rect class="n acc" x="297" y="150" width="22" height="120" stroke-dasharray="4 3"/>
<circle cx="308" cy="180" r="2.5" fill="#B509AC"/>
<circle cx="308" cy="210" r="2.5" fill="#B509AC"/>
<circle cx="308" cy="240" r="2.5" fill="#B509AC"/>
<rect x="340" y="126" width="22" height="144" fill="#1b6f88" opacity="0.25"/>
<rect class="n acc" x="340" y="126" width="22" height="144" stroke-dasharray="4 3"/>
<circle cx="351" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="351" cy="198" r="2.5" fill="#B509AC"/>
<circle cx="351" cy="234" r="2.5" fill="#B509AC"/>
<rect x="362" y="126" width="22" height="144" fill="#2698BA" opacity="0.25"/>
<rect class="n acc" x="362" y="126" width="22" height="144" stroke-dasharray="4 3"/>
<circle cx="373" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="373" cy="198" r="2.5" fill="#B509AC"/>
<circle cx="373" cy="234" r="2.5" fill="#B509AC"/>
<rect x="384" y="126" width="22" height="144" fill="#9dd3e6" opacity="0.25"/>
<rect class="n acc" x="384" y="126" width="22" height="144" stroke-dasharray="4 3"/>
<circle cx="395" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="395" cy="198" r="2.5" fill="#B509AC"/>
<circle cx="395" cy="234" r="2.5" fill="#B509AC"/>
<rect x="427" y="126" width="22" height="144" fill="#1b6f88" opacity="0.25"/>
<rect class="n acc" x="427" y="126" width="22" height="144" stroke-dasharray="4 3"/>
<circle cx="438" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="438" cy="198" r="2.5" fill="#B509AC"/>
<circle cx="438" cy="234" r="2.5" fill="#B509AC"/>
<rect x="449" y="126" width="22" height="144" fill="#2698BA" opacity="0.25"/>
<rect class="n acc" x="449" y="126" width="22" height="144" stroke-dasharray="4 3"/>
<circle cx="460" cy="162" r="2.5" fill="#B509AC"/>
<circle cx="460" cy="198" r="2.5" fill="#B509AC"/>
<circle cx="460" cy="234" r="2.5" fill="#B509AC"/>
<rect x="471" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.25"/>
<rect class="n acc" x="471" y="78" width="22" height="192" stroke-dasharray="4 3"/>
<circle cx="482" cy="126" r="2.5" fill="#B509AC"/>
<circle cx="482" cy="174" r="2.5" fill="#B509AC"/>
<circle cx="482" cy="222" r="2.5" fill="#B509AC"/>
<rect x="514" y="102" width="22" height="168" fill="#1b6f88" opacity="0.25"/>
<rect class="n acc" x="514" y="102" width="22" height="168" stroke-dasharray="4 3"/>
<circle cx="524" cy="144" r="2.5" fill="#B509AC"/>
<circle cx="524" cy="186" r="2.5" fill="#B509AC"/>
<circle cx="524" cy="228" r="2.5" fill="#B509AC"/>
<rect x="536" y="102" width="22" height="168" fill="#2698BA" opacity="0.25"/>
<rect class="n acc" x="536" y="102" width="22" height="168" stroke-dasharray="4 3"/>
<circle cx="546" cy="144" r="2.5" fill="#B509AC"/>
<circle cx="546" cy="186" r="2.5" fill="#B509AC"/>
<circle cx="546" cy="228" r="2.5" fill="#B509AC"/>
<rect x="558" y="102" width="22" height="168" fill="#9dd3e6" opacity="0.25"/>
<rect class="n acc" x="558" y="102" width="22" height="168" stroke-dasharray="4 3"/>
<circle cx="568" cy="144" r="2.5" fill="#B509AC"/>
<circle cx="568" cy="186" r="2.5" fill="#B509AC"/>
<circle cx="568" cy="228" r="2.5" fill="#B509AC"/>
<text class="s" x="113" y="290" text-anchor="middle">Algeria</text>
<text class="s" x="200" y="290" text-anchor="middle">Angola</text>
<text class="s" x="286" y="290" text-anchor="middle">Antigua and</text>
<text class="s" x="286" y="306" text-anchor="middle">Barbuda</text>
<text class="s" x="373" y="290" text-anchor="middle">Argentina</text>
<text class="s" x="460" y="290" text-anchor="middle">Armenia</text>
<text class="s" x="546" y="290" text-anchor="middle">Australia</text>
<rect class="n" x="640" y="45" width="240" height="48" rx="10"/><text class="t b" x="652" y="65">Otsu threshold</text><text class="s" x="652" y="83">RGB + HSV, invert if dark</text>
<path class="flow" d="M760 93 V107"/>
<rect class="n" x="640" y="107" width="240" height="48" rx="10"/><text class="t b" x="652" y="127">Contours</text><text class="s" x="652" y="145">split by unique pixel value</text>
<path class="flow" d="M760 155 V169"/>
<rect class="n" x="640" y="169" width="240" height="48" rx="10"/><text class="t b" x="652" y="189">Filter</text><text class="s" x="652" y="207">solidity + area thresholds</text>
<path class="flow" d="M760 217 V231"/>
<rect class="n acc" x="640" y="231" width="240" height="48" rx="10"/><text class="t b" x="652" y="251">SAM</text><text class="s" x="652" y="269">n points per candidate as prompts</text>
<text class="s" x="760" y="300" text-anchor="middle">Output: one tight mask per bar; grid lines</text><text class="s" x="760" y="318" text-anchor="middle">and labels get weak masks and drop out</text>
</svg>
</div>

Before any language model is involved, classical vision finds the candidates. We binarize the image with Otsu thresholding on both RGB and HSV, invert if the background is dark, extract contours, and split each contour by unique pixel value so a group of touching bars separates into three. Solidity and area thresholds drop stray shapes. Because these heuristics are brittle on low-contrast charts and can pick up grid lines or labels, we sample $$ n $$ points inside each candidate and hand them to the Segment Anything Model (SAM), which returns a tight mask per bar and only weak masks for grid lines and text, so those fall away. For this chart the result is eighteen masks.

</div>
<div class="wt-step" data-label="Marks" markdown="1">
<h4>3. Stamp a label on each element</h4>
<div class="fig-svg">
<svg viewBox="0 0 900 312" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Set-of-marks: every bar carries a numeric label from 1 to 18, drawn on the image.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
<text class="t b" x="315" y="20" text-anchor="middle">Number of documents required per shipment to import goods</text>
<rect x="230" y="30" width="12" height="12" fill="#1b6f88"/><text class="s" x="246" y="41">2005</text>
<rect x="300" y="30" width="12" height="12" fill="#2698BA"/><text class="s" x="316" y="41">2006</text>
<rect x="370" y="30" width="12" height="12" fill="#9dd3e6"/><text class="s" x="386" y="41">2007</text>
<line class="grid" x1="70" y1="270" x2="590" y2="270"/><text class="s" x="62" y="274" text-anchor="end">0</text>
<line class="grid" x1="70" y1="222" x2="590" y2="222"/><text class="s" x="62" y="226" text-anchor="end">2</text>
<line class="grid" x1="70" y1="174" x2="590" y2="174"/><text class="s" x="62" y="178" text-anchor="end">4</text>
<line class="grid" x1="70" y1="126" x2="590" y2="126"/><text class="s" x="62" y="130" text-anchor="end">6</text>
<line class="grid" x1="70" y1="78" x2="590" y2="78"/><text class="s" x="62" y="82" text-anchor="end">8</text>
<path class="n" d="M70 50 V270 H590"/>
<text class="s" transform="translate(22,160) rotate(-90)" text-anchor="middle">Documents required</text>
<rect x="80" y="54" width="22" height="216" fill="#1b6f88" opacity="0.9"/>
<circle cx="91" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="91" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">1</text>
<rect x="102" y="54" width="22" height="216" fill="#2698BA" opacity="0.9"/>
<circle cx="113" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="113" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">2</text>
<rect x="124" y="54" width="22" height="216" fill="#9dd3e6" opacity="0.9"/>
<circle cx="135" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="135" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">3</text>
<rect x="167" y="78" width="22" height="192" fill="#1b6f88" opacity="0.9"/>
<circle cx="178" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="178" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">4</text>
<rect x="189" y="78" width="22" height="192" fill="#2698BA" opacity="0.9"/>
<circle cx="200" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="200" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">5</text>
<rect x="211" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.9"/>
<circle cx="222" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="222" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">6</text>
<rect x="253" y="150" width="22" height="120" fill="#1b6f88" opacity="0.9"/>
<circle cx="264" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="264" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">7</text>
<rect x="275" y="150" width="22" height="120" fill="#2698BA" opacity="0.9"/>
<circle cx="286" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="286" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">8</text>
<rect x="297" y="150" width="22" height="120" fill="#9dd3e6" opacity="0.9"/>
<circle cx="308" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="308" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">9</text>
<rect x="340" y="126" width="22" height="144" fill="#1b6f88" opacity="0.9"/>
<circle cx="351" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="351" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">10</text>
<rect x="362" y="126" width="22" height="144" fill="#2698BA" opacity="0.9"/>
<circle cx="373" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="373" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">11</text>
<rect x="384" y="126" width="22" height="144" fill="#9dd3e6" opacity="0.9"/>
<circle cx="395" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="395" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">12</text>
<rect x="427" y="126" width="22" height="144" fill="#1b6f88" opacity="0.9"/>
<circle cx="438" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="438" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">13</text>
<rect x="449" y="126" width="22" height="144" fill="#2698BA" opacity="0.9"/>
<circle cx="460" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="460" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">14</text>
<rect x="471" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.9"/>
<circle cx="482" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="482" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">15</text>
<rect x="514" y="102" width="22" height="168" fill="#1b6f88" opacity="0.9"/>
<circle cx="524" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="524" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">16</text>
<rect x="536" y="102" width="22" height="168" fill="#2698BA" opacity="0.9"/>
<circle cx="546" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="546" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">17</text>
<rect x="558" y="102" width="22" height="168" fill="#9dd3e6" opacity="0.9"/>
<circle cx="568" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="568" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">18</text>
<text class="s" x="113" y="290" text-anchor="middle">Algeria</text>
<text class="s" x="200" y="290" text-anchor="middle">Angola</text>
<text class="s" x="286" y="290" text-anchor="middle">Antigua and</text>
<text class="s" x="286" y="306" text-anchor="middle">Barbuda</text>
<text class="s" x="373" y="290" text-anchor="middle">Argentina</text>
<text class="s" x="460" y="290" text-anchor="middle">Armenia</text>
<text class="s" x="546" y="290" text-anchor="middle">Australia</text>
<rect class="n acc" x="640" y="60" width="240" height="150" rx="10"/>
<text class="t b" x="652" y="84" fill="#B509AC">Set of marks</text>
<text class="s" x="652" y="108">18 elements, 18 labels.</text>
<text class="s" x="652" y="128">Label k is drawn on bar k.</text>
<text class="s" x="652" y="148">The model never sees pixel</text>
<text class="s" x="652" y="168">coordinates; it refers to</text>
<text class="s" x="652" y="188">bars by label only.</text>
<text class="s" x="760" y="245" text-anchor="middle">Algeria = 1, 2, 3 | Angola = 4, 5, 6</text>
<text class="s" x="760" y="265" text-anchor="middle">... | Armenia = 13, 14, 15 | Australia = 16, 17, 18</text>
</svg>
</div>

Each mask gets an alphanumeric label drawn directly on the image, following set-of-marks (SoM) prompting. Reading left to right, Algeria's three bars become 1, 2, 3, Angola's 4, 5, 6, and so on through Australia's 16, 17, 18. From here on the model never has to name a position in pixels; it names a label, and we already know which mask that label points to.

<div class="tok-row"><span class="tok tok-b">Algeria 2005</span><span class="tok tok-b">Algeria 2006</span><span class="tok tok-b">Algeria 2007</span><span class="tok tok-b">...</span><span class="tok tok-b">Australia 2007</span><span class="tok-arrow">→</span><span class="tok tok-a">1</span><span class="tok tok-a">2</span><span class="tok tok-a">3</span><span class="tok tok-a">...</span><span class="tok tok-a">18</span></div>

</div>
<div class="wt-step" data-label="Validate" markdown="1">
<h4>4. The model checks the answer against the chart</h4>
<div class="fig-svg">
<svg viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Validation: the prompt with the marked chart and the response goes to the MLLM, which checks that the answer 3 is consistent with the chart.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>

<rect class="n inp" x="20" y="40" width="250" height="200" rx="10"/>
<text class="t b" x="145" y="66" text-anchor="middle" fill="#2698BA">Prompt</text>
<text class="s" x="34" y="92">Marked chart image (18 labels)</text>
<text class="s" x="34" y="112">What attribution means</text>
<text class="s" x="34" y="132">Few-shot text examples of</text>
<text class="s" x="34" y="150">question, answer, attribution</text>
<text class="s" x="34" y="176">Question + "Ans: 3"</text>
<text class="s" x="34" y="200">Think step by step:</text>
<text class="s" x="34" y="218">validate, then attribute</text>
<path class="flow" d="M275 140 H325"/>
<rect class="n acc" x="330" y="90" width="150" height="100" rx="10"/>
<text class="t b" x="405" y="132" text-anchor="middle">MLLM</text>
<text class="s" x="405" y="152" text-anchor="middle">(GPT-4o)</text>
<path class="flow" d="M485 140 H535"/>
<rect class="n ok" x="540" y="40" width="340" height="200" rx="10"/>
<text class="t b" x="710" y="66" text-anchor="middle" fill="#00ab37">Step 1: validation</text>
<text class="s" x="554" y="94">Read the 2005 bars (labels 1, 4, 7, 10, 13, 16):</text>
<text class="s" x="554" y="114">9, 8, 5, 6, 6, 7 documents</text>
<text class="s" x="554" y="140">Mean over six countries = 41 / 6 = 6.83</text>
<text class="s" x="554" y="166">Above the mean: 9, 8, 7 (three bars)</text>
<text class="t b" x="710" y="200" text-anchor="middle" fill="#00ab37">Answer 3 is consistent with the chart</text>
<text class="s" x="710" y="222" text-anchor="middle">continue to step 2</text>

</svg>
</div>

The marked image goes to the MLLM (GPT-4o in our experiments) with a prompt that explains what chart attribution is, gives a few textual examples of question, answer, and attribution, and asks for chain-of-thought reasoning in two steps. Step one is validation: is the answer consistent with the chart? For our question the model has to read the six 2005 bars, take their mean, and count how many exceed it.

<div class="tok-row"><span class="tok tok-b">1: 9</span><span class="tok tok-b">4: 8</span><span class="tok tok-b">7: 5</span><span class="tok tok-b">10: 6</span><span class="tok tok-b">13: 6</span><span class="tok tok-b">16: 7</span><span class="tok-arrow">→</span><span class="tok">mean 6.83</span><span class="tok-arrow">→</span><span class="tok tok-c">9, 8, 7 above</span><span class="tok-arrow">→</span><span class="tok tok-c">count 3 ✓</span></div>

</div>
<div class="wt-step" data-label="Attribute" markdown="1">
<h4>5. The model names the marks that support it</h4>
<div class="fig-svg">
<svg viewBox="0 0 900 312" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Attribution: the MLLM returns labels 1, 4, and 16; those three 2005 bars for Algeria, Angola, and Australia are highlighted and the others fade.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
<text class="t b" x="315" y="20" text-anchor="middle">Number of documents required per shipment to import goods</text>
<rect x="230" y="30" width="12" height="12" fill="#1b6f88"/><text class="s" x="246" y="41">2005</text>
<rect x="300" y="30" width="12" height="12" fill="#2698BA"/><text class="s" x="316" y="41">2006</text>
<rect x="370" y="30" width="12" height="12" fill="#9dd3e6"/><text class="s" x="386" y="41">2007</text>
<line class="grid" x1="70" y1="270" x2="590" y2="270"/><text class="s" x="62" y="274" text-anchor="end">0</text>
<line class="grid" x1="70" y1="222" x2="590" y2="222"/><text class="s" x="62" y="226" text-anchor="end">2</text>
<line class="grid" x1="70" y1="174" x2="590" y2="174"/><text class="s" x="62" y="178" text-anchor="end">4</text>
<line class="grid" x1="70" y1="126" x2="590" y2="126"/><text class="s" x="62" y="130" text-anchor="end">6</text>
<line class="grid" x1="70" y1="78" x2="590" y2="78"/><text class="s" x="62" y="82" text-anchor="end">8</text>
<path class="n" d="M70 50 V270 H590"/>
<text class="s" transform="translate(22,160) rotate(-90)" text-anchor="middle">Documents required</text>
<rect x="80" y="54" width="22" height="216" fill="#1b6f88" opacity="0.9"/>
<rect x="77" y="51" width="28" height="219" rx="4" fill="none" stroke="#00ab37" stroke-width="3"/>
<circle cx="91" cy="67" r="10" fill="#fff" stroke="#00ab37" stroke-width="1.5"/><text x="91" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#00ab37">1</text>
<rect x="102" y="54" width="22" height="216" fill="#2698BA" opacity="0.22"/>
<circle cx="113" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="113" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">2</text>
<rect x="124" y="54" width="22" height="216" fill="#9dd3e6" opacity="0.22"/>
<circle cx="135" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="135" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">3</text>
<rect x="167" y="78" width="22" height="192" fill="#1b6f88" opacity="0.9"/>
<rect x="164" y="75" width="28" height="195" rx="4" fill="none" stroke="#00ab37" stroke-width="3"/>
<circle cx="178" cy="91" r="10" fill="#fff" stroke="#00ab37" stroke-width="1.5"/><text x="178" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#00ab37">4</text>
<rect x="189" y="78" width="22" height="192" fill="#2698BA" opacity="0.22"/>
<circle cx="200" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="200" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">5</text>
<rect x="211" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.22"/>
<circle cx="222" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="222" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">6</text>
<rect x="253" y="150" width="22" height="120" fill="#1b6f88" opacity="0.22"/>
<circle cx="264" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="264" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">7</text>
<rect x="275" y="150" width="22" height="120" fill="#2698BA" opacity="0.22"/>
<circle cx="286" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="286" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">8</text>
<rect x="297" y="150" width="22" height="120" fill="#9dd3e6" opacity="0.22"/>
<circle cx="308" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="308" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">9</text>
<rect x="340" y="126" width="22" height="144" fill="#1b6f88" opacity="0.22"/>
<circle cx="351" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="351" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">10</text>
<rect x="362" y="126" width="22" height="144" fill="#2698BA" opacity="0.22"/>
<circle cx="373" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="373" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">11</text>
<rect x="384" y="126" width="22" height="144" fill="#9dd3e6" opacity="0.22"/>
<circle cx="395" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="395" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">12</text>
<rect x="427" y="126" width="22" height="144" fill="#1b6f88" opacity="0.22"/>
<circle cx="438" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="438" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">13</text>
<rect x="449" y="126" width="22" height="144" fill="#2698BA" opacity="0.22"/>
<circle cx="460" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="460" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">14</text>
<rect x="471" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.22"/>
<circle cx="482" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="482" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">15</text>
<rect x="514" y="102" width="22" height="168" fill="#1b6f88" opacity="0.9"/>
<rect x="510" y="99" width="28" height="171" rx="4" fill="none" stroke="#00ab37" stroke-width="3"/>
<circle cx="524" cy="115" r="10" fill="#fff" stroke="#00ab37" stroke-width="1.5"/><text x="524" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#00ab37">16</text>
<rect x="536" y="102" width="22" height="168" fill="#2698BA" opacity="0.22"/>
<circle cx="546" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="546" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">17</text>
<rect x="558" y="102" width="22" height="168" fill="#9dd3e6" opacity="0.22"/>
<circle cx="568" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="568" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">18</text>
<text class="s" x="113" y="290" text-anchor="middle">Algeria</text>
<text class="s" x="200" y="290" text-anchor="middle">Angola</text>
<text class="s" x="286" y="290" text-anchor="middle">Antigua and</text>
<text class="s" x="286" y="306" text-anchor="middle">Barbuda</text>
<text class="s" x="373" y="290" text-anchor="middle">Argentina</text>
<text class="s" x="460" y="290" text-anchor="middle">Armenia</text>
<text class="s" x="546" y="290" text-anchor="middle">Australia</text>
<rect class="n acc" x="640" y="60" width="240" height="130" rx="10"/>
<text class="t b" x="652" y="84" fill="#B509AC">Step 2: attribution</text>
<text class="s" x="652" y="108">"Supporting elements:</text>
<text class="t b" x="652" y="130">1, 4, 16"</text>
<text class="s" x="652" y="156">Algeria 2005, Angola 2005,</text>
<text class="s" x="652" y="176">Australia 2005</text>
<text class="t b" x="760" y="230" text-anchor="middle" fill="#00ab37">3 highlighted bars = Ans: 3</text>
<text class="s" x="760" y="252" text-anchor="middle">A reader checks the answer</text>
<text class="s" x="760" y="270" text-anchor="middle">against three bars, not eighteen.</text>
</svg>
</div>

Step two is attribution: which labeled elements support the answer? The model returns 1, 4, and 16, the 2005 bars for Algeria, Angola, and Australia. We map those labels back to their SAM masks and highlight them. The reader's verification problem has shrunk from "read this chart" to "count these three bars", and the count matches the answer.

<div class="tok-row"><span class="tok tok-b">Ans: 3</span><span class="tok-arrow">→</span><span class="tok tok-a">MLLM</span><span class="tok-arrow">→</span><span class="tok tok-c">1</span><span class="tok tok-c">4</span><span class="tok tok-c">16</span><span class="tok-arrow">→</span><span class="tok tok-c">3 bars, consistent</span></div>

</div>
<div class="wt-step" data-label="Catching a hallucination" markdown="1">
<h4>6. The same pipeline on a wrong answer</h4>
<div class="fig-svg">
<svg viewBox="0 0 900 322" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The inconsistent case: for the Armenia question with answer 2006, the model flags the response as inconsistent and grounds it to bar 14, while the tallest Armenia bar is 15 (2007).">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
<text class="t b" x="315" y="20" text-anchor="middle">Number of documents required per shipment to import goods</text>
<rect x="230" y="30" width="12" height="12" fill="#1b6f88"/><text class="s" x="246" y="41">2005</text>
<rect x="300" y="30" width="12" height="12" fill="#2698BA"/><text class="s" x="316" y="41">2006</text>
<rect x="370" y="30" width="12" height="12" fill="#9dd3e6"/><text class="s" x="386" y="41">2007</text>
<line class="grid" x1="70" y1="270" x2="590" y2="270"/><text class="s" x="62" y="274" text-anchor="end">0</text>
<line class="grid" x1="70" y1="222" x2="590" y2="222"/><text class="s" x="62" y="226" text-anchor="end">2</text>
<line class="grid" x1="70" y1="174" x2="590" y2="174"/><text class="s" x="62" y="178" text-anchor="end">4</text>
<line class="grid" x1="70" y1="126" x2="590" y2="126"/><text class="s" x="62" y="130" text-anchor="end">6</text>
<line class="grid" x1="70" y1="78" x2="590" y2="78"/><text class="s" x="62" y="82" text-anchor="end">8</text>
<path class="n" d="M70 50 V270 H590"/>
<text class="s" transform="translate(22,160) rotate(-90)" text-anchor="middle">Documents required</text>
<rect x="80" y="54" width="22" height="216" fill="#1b6f88" opacity="0.22"/>
<circle cx="91" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="91" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">1</text>
<rect x="102" y="54" width="22" height="216" fill="#2698BA" opacity="0.22"/>
<circle cx="113" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="113" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">2</text>
<rect x="124" y="54" width="22" height="216" fill="#9dd3e6" opacity="0.22"/>
<circle cx="135" cy="67" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="135" y="71.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">3</text>
<rect x="167" y="78" width="22" height="192" fill="#1b6f88" opacity="0.22"/>
<circle cx="178" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="178" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">4</text>
<rect x="189" y="78" width="22" height="192" fill="#2698BA" opacity="0.22"/>
<circle cx="200" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="200" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">5</text>
<rect x="211" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.22"/>
<circle cx="222" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="222" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">6</text>
<rect x="253" y="150" width="22" height="120" fill="#1b6f88" opacity="0.22"/>
<circle cx="264" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="264" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">7</text>
<rect x="275" y="150" width="22" height="120" fill="#2698BA" opacity="0.22"/>
<circle cx="286" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="286" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">8</text>
<rect x="297" y="150" width="22" height="120" fill="#9dd3e6" opacity="0.22"/>
<circle cx="308" cy="163" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="308" y="167.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">9</text>
<rect x="340" y="126" width="22" height="144" fill="#1b6f88" opacity="0.22"/>
<circle cx="351" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="351" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">10</text>
<rect x="362" y="126" width="22" height="144" fill="#2698BA" opacity="0.22"/>
<circle cx="373" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="373" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">11</text>
<rect x="384" y="126" width="22" height="144" fill="#9dd3e6" opacity="0.22"/>
<circle cx="395" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="395" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">12</text>
<rect x="427" y="126" width="22" height="144" fill="#1b6f88" opacity="0.22"/>
<circle cx="438" cy="139" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="438" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">13</text>
<rect x="449" y="126" width="22" height="144" fill="#2698BA" opacity="0.9"/>
<rect x="446" y="123" width="28" height="147" rx="4" fill="none" stroke="#F29105" stroke-width="3"/>
<circle cx="460" cy="139" r="10" fill="#fff" stroke="#F29105" stroke-width="1.5"/><text x="460" y="143.5" text-anchor="middle" font-size="12" font-weight="600" fill="#F29105">14</text>
<rect x="471" y="78" width="22" height="192" fill="#9dd3e6" opacity="0.9"/>
<rect x="468" y="75" width="28" height="195" rx="4" fill="none" stroke="#00ab37" stroke-width="2" stroke-dasharray="5 4"/>
<circle cx="482" cy="91" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="482" y="95.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">15</text>
<rect x="514" y="102" width="22" height="168" fill="#1b6f88" opacity="0.22"/>
<circle cx="524" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="524" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">16</text>
<rect x="536" y="102" width="22" height="168" fill="#2698BA" opacity="0.22"/>
<circle cx="546" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="546" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">17</text>
<rect x="558" y="102" width="22" height="168" fill="#9dd3e6" opacity="0.22"/>
<circle cx="568" cy="115" r="10" fill="#fff" stroke="#B509AC" stroke-width="1.5"/><text x="568" y="119.5" text-anchor="middle" font-size="12" font-weight="600" fill="#B509AC">18</text>
<text class="s" x="113" y="290" text-anchor="middle">Algeria</text>
<text class="s" x="200" y="290" text-anchor="middle">Angola</text>
<text class="s" x="286" y="290" text-anchor="middle">Antigua and</text>
<text class="s" x="286" y="306" text-anchor="middle">Barbuda</text>
<text class="s" x="373" y="290" text-anchor="middle">Argentina</text>
<text class="s" x="460" y="290" text-anchor="middle">Armenia</text>
<text class="s" x="546" y="290" text-anchor="middle">Australia</text>
<rect class="n inp" x="630" y="40" width="260" height="136" rx="10"/>
<text class="s b" x="642" y="60" fill="#2698BA" style="opacity:1">Question</text>
<text class="s" x="642" y="80">In which year did Armenia</text>
<text class="s" x="642" y="97">have the maximum number of</text>
<text class="s" x="642" y="114">documents required per</text>
<text class="s" x="642" y="131">shipment to import goods?</text>
<rect x="642" y="142" width="70" height="22" rx="6" fill="#F29105" opacity="0.18"/><text class="t b" x="677" y="158" text-anchor="middle">Ans: 2006</text>
<rect class="n bad" x="630" y="188" width="260" height="122" rx="10"/>
<text class="t b" x="642" y="212" fill="#F29105">Validation: inconsistent</text>
<text class="s" x="642" y="234">Armenia: 6, 6, 8 documents,</text>
<text class="s" x="642" y="254">so the maximum is 2007 (15),</text>
<text class="s" x="642" y="274">not 2006. Attribution: 14.</text>
<text class="s" x="642" y="298" fill="#00ab37" style="opacity:1">dashed = the bar that would be right</text>
</svg>
</div>

Now the second question from Figure 1: "In which year did Armenia have the maximum number of documents required per shipment to import goods?" with the answer 2006. Armenia's bars read 6, 6, 8, so the maximum is 2007, and the validation step flags the response as inconsistent. The attribution still grounds the answer to the bar it depends on, Armenia's 2006 bar (mark 14), and one glance shows it is not the tallest of the three. That is what a chart-response misalignment looks like when it is made visible.

<div class="tok-row"><span class="tok tok-b">Ans: 2006</span><span class="tok-arrow">→</span><span class="tok tok-a">MLLM</span><span class="tok-arrow">→</span><span class="tok tok-d">inconsistent</span><span class="tok tok-d">14</span><span class="tok-arrow">→</span><span class="tok tok-c">15 is taller</span></div>

{% include figure.html path="assets/img/blog/chartlens/fig-intro.png" class="img-fluid rounded z-depth-1" zoomable=true caption="The same two cases as drawn in Figure 1 of the paper. (1) Attribution grounds each response to specific bars. (2) Verification: the count of 3 is consistent with the highlighted 2005 bars; the answer 2006 for Armenia is inconsistent with the highlighted bar." %}

</div>
</div>

## Under the hood

| Symbol | Meaning |
|---|---|
| $$ c \in \mathcal{C} $$ | A chart image, $$ c = \mathcal{I}^{w \times h \times 3} $$ |
| $$ v \in \mathcal{R}_c $$ | A response associated with chart $$ c $$ (a question and its answer) |
| $$ \mathcal{A}_{c,v} $$ | The attribution set: chart regions that support $$ v $$ |
| $$ a_i $$ | One region, corresponding to an element of $$ c $$ (bar, sector, point, line segment) |
| $$ f $$ | The attribution function ChartLens implements |
| $$ n $$ | Number of points sampled per candidate as SAM prompts |
| $$ D, G $$ | Detected regions (after IoU matching) and ground-truth regions |
{: .notation}

The task is post-hoc fine-grained visual attribution for charts. Given a chart and a response, produce

$$
\mathcal{A}_{c,v} = \{a_1, a_2, \ldots, a_n\}
$$

where each $$ a_i $$ is a distinct chart element that supports $$ v $$, subject to relevance (each $$ a_i $$ bears on $$ v $$), completeness ($$ \mathcal{A}_{c,v} $$ covers all the evidence needed to justify $$ v $$), and precision (no irrelevant parts of the chart). The whole method is a mapping

$$
f : (c, v) \mapsto \mathcal{A}_{c,v}
$$

and the design question is how to make an MLLM implement $$ f $$ when it cannot reliably output coordinates. ChartLens answers by turning region selection into label selection: the candidate set of elements is computed by segmentation, and the model chooses a subset of labels.

<div class="fig-svg">
<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ChartLens architecture: chart and response, segmentation branches for bars/pies (heuristics plus SAM) and lines (LineFormer), a marked image, an MLLM that validates then attributes, and the output label set.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 13px; opacity: 0.8; }
    .b { font-weight: 600; }
    .acc { stroke: #B509AC; }
    .inp { stroke: #2698BA; }
    .ok { stroke: #00ab37; }
    .bad { stroke: #F29105; }
    .grid { stroke: currentColor; stroke-width: 1; opacity: 0.18; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>

<rect class="n inp" x="20" y="90" width="130" height="110" rx="10"/>
<text class="t b" x="85" y="118" text-anchor="middle">Chart c</text>
<text class="s" x="85" y="142" text-anchor="middle">+ response v</text>
<text class="s" x="85" y="162" text-anchor="middle">(question,</text>
<text class="s" x="85" y="180" text-anchor="middle">answer)</text>
<path class="flow" d="M155 145 H195"/>
<rect class="n acc" x="200" y="30" width="200" height="110" rx="10"/>
<text class="t b" x="300" y="55" text-anchor="middle">Bars, pie sectors</text>
<text class="s" x="300" y="77" text-anchor="middle">Otsu + contours</text>
<text class="s" x="300" y="95" text-anchor="middle">(pies: unroll radially)</text>
<text class="s" x="300" y="113" text-anchor="middle">then SAM point prompts</text>
<rect class="n acc" x="200" y="160" width="200" height="90" rx="10"/>
<text class="t b" x="300" y="185" text-anchor="middle">Lines</text>
<text class="s" x="300" y="207" text-anchor="middle">LineFormer, then split</text>
<text class="s" x="300" y="225" text-anchor="middle">into equal x-segments</text>
<path class="flow" d="M405 85 H445 V145"/>
<path class="flow" d="M405 205 H445 V145 H455"/>
<rect class="n acc" x="460" y="95" width="130" height="100" rx="10"/>
<text class="t b" x="525" y="122" text-anchor="middle">Marked image</text>
<text class="s" x="525" y="144" text-anchor="middle">one label per</text>
<text class="s" x="525" y="162" text-anchor="middle">element (SoM)</text>
<path class="flow" d="M595 145 H635"/>
<rect class="n acc" x="640" y="70" width="140" height="150" rx="10"/>
<text class="t b" x="710" y="96" text-anchor="middle">MLLM</text>
<text class="s" x="710" y="120" text-anchor="middle">few-shot + CoT</text>
<text class="s" x="710" y="142" text-anchor="middle">1. validate</text>
<text class="s" x="710" y="160" text-anchor="middle">2. attribute</text>
<text class="s" x="710" y="184" text-anchor="middle">lines: pairs of</text>
<text class="s" x="710" y="202" text-anchor="middle">marked points</text>
<path class="flow" d="M785 145 H825"/>
<rect class="n ok" x="830" y="105" width="60" height="80" rx="10"/>
<text class="t b" x="860" y="140" text-anchor="middle">A</text>
<text class="s" x="860" y="164" text-anchor="middle">labels</text>
<text class="s" x="450" y="285" text-anchor="middle">Scoring: labels map back to masks; bars and sectors match ground truth at IoU >= 0.9 and are scored with P, R, F1</text>

</svg>
<div class="fig-caption">The two stages. Mark generation produces one referable element per bar, sector, or line segment; attribution prompts an MLLM with the marked image and reads back the labels it cites.</div>
</div>

**Mark generation.** Bars follow the pipeline in step 2. Pie charts take the largest contour of the binarized image, fit its minimum enclosing circle, unroll the pie along the radial axis into a strip, and detect complete edges in that strip as sector boundaries, which map back to slices. Both then pass through SAM with sampled point prompts (`facebook/sam-vit-large`). Lines are thin, overlapping, and intersecting, so contour heuristics do not apply; we use LineFormer, a transformer-based line extractor, and divide each recovered line into equally spaced segments along its horizontal extent so that a point on a line has a mark to refer to.

**Attribution prompt.** The prompt has three parts: a description of chart attribution, few-shot textual examples of question-answer pairs with their attributions, and an instruction to reason step by step through validation (is the QA pair consistent with the chart?) and then attribution (which labeled elements support the answer?). For line charts the model returns pairs of marked points between which the attributed span lies; those pairs are treated as bounding-box corners.

**Scoring.** For bars and sectors, a predicted region counts as a match if it overlaps a ground-truth region at $$ \text{IoU} \geq 0.9 $$. With $$ D $$ the matched detections and $$ G $$ the ground truth,

$$
P = \frac{|D \cap G|}{|D|}, \qquad R = \frac{|D \cap G|}{|G|}, \qquad F1 = \frac{2 \cdot P \cdot R}{P + R}.
$$

Lines are scored by detection rate (the fraction of ground-truth points covered, a recall-like measure) and by the percentage of the chart's area the attribution covers, because a method can reach high detection by painting most of the chart.

**ChartVA-Eval.** To measure any of this we built a benchmark of 1,244 queries over three subsets. ChartVA-AITQA renders synthetic charts from airline SEC-filing tables (301 queries, 203 bar and 98 line charts, one attribution each). ChartVA-PlotQA uses synthetic scientific charts from World Bank Open Data, Open Government Data, and the Global Terrorism Database (595 queries, 396 bar and 199 line charts, 2.4 attributions on average, up to 12). ChartVA-ChartQA uses real charts from Statista, Pew Research, Our World in Data, and OECD, with pie charts oversampled (348 queries: 121 bar, 109 pie, 118 line). For the last two, GPT-4o drafted attributions from the underlying tables with template-specific prompts, and three annotators verified relevance and completeness with Cohen's kappa of 0.89 and 0.84.

## What the numbers say

Baselines are zero-shot GPT-4o bounding-box prompting, Kosmos-2, and LISA; ChartLens uses GPT-4o as its MLLM.

| Method | Bar: AITQA F1 | Bar: PlotQA F1 | Bar: ChartQA F1 | Pie: ChartQA F1 |
|---|---|---|---|---|
| Zero-shot GPT-4o | 22.77 | 3.30 | 7.75 | 7.17 |
| Kosmos-2 | 0.51 | 1.01 | 3.13 | 11.70 |
| LISA | 1.62 | 0.34 | 1.01 | 2.41 |
| **ChartLens** | **69.28** | **34.65** | **64.14** | **48.56** |

On line charts ChartLens covers 59.14%, 51.84%, and 77.8% of ground-truth points on the three subsets while flagging 1.25%, 9.98%, and 5.34% of the chart area; LISA and Kosmos-2 reach high detection mainly by covering 27% to 63% of the chart, so ChartLens uses 3 to 50 times less area. Across chart types this is a 26-66% improvement in fine-grained attribution over the baselines. Qualitatively, GPT-4o tries to be specific but cannot localize through text coordinates, and LISA and Kosmos-2 return generic components such as the whole pie regardless of the question.

## Try it

- Paper page: [/papers/chartlens/](/papers/chartlens/)
- arXiv: [2505.19360](https://arxiv.org/abs/2505.19360)
- Code and the ChartVA-Eval benchmark: [github.com/MananSuri27/ChartLens](https://github.com/MananSuri27/ChartLens)
- ACL Anthology: [2025.acl-long.1094](https://aclanthology.org/2025.acl-long.1094/)
