---
layout: post
title: "Answering questions over a pile of PDFs: VisDoM explained"
description: "Why multi-document QA breaks when the answer is in a table or a chart, and how VisDoMRAG fuses visual and textual retrieval to fix it."
date: 2026-09-02 12:00:00
tags: rag multimodal documents benchmarks
categories: research
thumbnail: assets/img/papers/visdom/hero.png
related_posts: false
toc:
  beginning: true
---

Picture a folder of eight arXiv papers, about 129 pages in all, and one question: "Which model performs best on the Ubuntu dataset for text lengths between 60 and 90 words?" The answer is a single cell in a single table on a single page of one of those papers. Nothing in the running text says it out loud. To get it right you have to find the right paper, find the right page, find the right column, and then read a number off a table.

Most document QA demos skip all of that by starting from one PDF. Our NAACL 2025 paper, [VisDoM](/papers/visdom/), is about the version of the problem that analysts, scientists and lawyers actually have: a question over a collection of documents where the evidence is usually visual. We built a benchmark for it (VisDoMBench) and a retrieval-augmented method that answers it (VisDoMRAG). This post traces that Ubuntu question through VisDoMRAG one stage at a time.

## The idea in one picture

A retrieval-augmented generation (RAG) system for PDFs has to pick a modality. Retrieve text and the model reads tables as flattened OCR strings. Retrieve page images and the model sees the table as pixels, which is better for tables and charts but leaves it alone with whatever it misreads. Our answer is to do both, in two independent pipelines, and then make a language model check the two reasoning chains against each other before committing.

<div class="fig-svg">
<svg viewBox="0 0 900 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three ways to answer a question over a document collection: text-only RAG, visual-only RAG, and VisDoMRAG, which runs both and fuses them with a consistency check. GPT-4o averages on VisDoMBench: 37.3, 49.0, 50.0.">
  <style>
    .t { fill: currentColor; font-size: 14px; font-family: sans-serif; }
    .h { fill: currentColor; font-size: 15px; font-weight: bold; font-family: sans-serif; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; font-family: sans-serif; }
    .in { fill: rgba(38,152,186,0.15); stroke: #2698BA; stroke-width: 1.5; }
    .base { fill: rgba(242,145,5,0.15); stroke: #F29105; stroke-width: 1.5; }
    .acc { fill: rgba(181,9,172,0.15); stroke: #B509AC; stroke-width: 1.5; }
    .ok { fill: rgba(0,171,55,0.15); stroke: #00ab37; stroke-width: 1.5; }
    .box { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.85; }
    .ar { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.7; }
    .aacc { fill: none; stroke: #B509AC; stroke-width: 2; }
  </style>
  <defs>
    <marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.7"/></marker>
    <marker id="ma" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#B509AC"/></marker>
  </defs>
  <!-- column 1: text RAG -->
  <text class="h" x="150" y="26" text-anchor="middle">Text-only RAG</text>
  <rect class="in" x="60" y="42" width="180" height="44" rx="10"/>
  <text class="t" x="150" y="61" text-anchor="middle">PDFs, OCR'd into</text>
  <text class="t" x="150" y="78" text-anchor="middle">text chunks</text>
  <path class="ar" d="M150 86 V108" marker-end="url(#m)"/>
  <rect class="base" x="60" y="110" width="180" height="44" rx="10"/>
  <text class="t" x="150" y="129" text-anchor="middle">retrieve chunks,</text>
  <text class="t" x="150" y="146" text-anchor="middle">LLM reads text</text>
  <path class="ar" d="M150 154 V176" marker-end="url(#m)"/>
  <rect class="box" x="60" y="178" width="180" height="44" rx="10"/>
  <text class="t" x="150" y="197" text-anchor="middle">table rows arrive as</text>
  <text class="t" x="150" y="214" text-anchor="middle">flattened OCR text</text>
  <text class="h" x="150" y="262" text-anchor="middle" style="fill:#F29105">37.3</text>
  <text class="s" x="150" y="282" text-anchor="middle">GPT-4o avg. on VisDoMBench</text>

  <!-- column 2: visual RAG -->
  <text class="h" x="450" y="26" text-anchor="middle">Visual-only RAG</text>
  <rect class="in" x="360" y="42" width="180" height="44" rx="10"/>
  <text class="t" x="450" y="61" text-anchor="middle">PDFs, rendered as</text>
  <text class="t" x="450" y="78" text-anchor="middle">page images</text>
  <path class="ar" d="M450 86 V108" marker-end="url(#m)"/>
  <rect class="base" x="360" y="110" width="180" height="44" rx="10"/>
  <text class="t" x="450" y="129" text-anchor="middle">retrieve pages,</text>
  <text class="t" x="450" y="146" text-anchor="middle">LLM looks at pixels</text>
  <path class="ar" d="M450 154 V176" marker-end="url(#m)"/>
  <rect class="box" x="360" y="178" width="180" height="44" rx="10"/>
  <text class="t" x="450" y="197" text-anchor="middle">sees the table, but</text>
  <text class="t" x="450" y="214" text-anchor="middle">may misread a cell</text>
  <text class="h" x="450" y="262" text-anchor="middle" style="fill:#F29105">49.0</text>
  <text class="s" x="450" y="282" text-anchor="middle">GPT-4o avg. on VisDoMBench</text>

  <!-- column 3: VisDoMRAG -->
  <text class="h" x="750" y="26" text-anchor="middle" style="fill:#B509AC">VisDoMRAG (ours)</text>
  <rect class="in" x="660" y="42" width="180" height="44" rx="10"/>
  <text class="t" x="750" y="61" text-anchor="middle">PDFs, as page images</text>
  <text class="t" x="750" y="78" text-anchor="middle">and as text chunks</text>
  <path class="ar" d="M705 86 V108" marker-end="url(#m)"/>
  <path class="ar" d="M795 86 V108" marker-end="url(#m)"/>
  <rect class="box" x="660" y="110" width="84" height="44" rx="10"/>
  <text class="t" x="702" y="129" text-anchor="middle">visual</text>
  <text class="t" x="702" y="146" text-anchor="middle">branch</text>
  <rect class="box" x="756" y="110" width="84" height="44" rx="10"/>
  <text class="t" x="798" y="129" text-anchor="middle">textual</text>
  <text class="t" x="798" y="146" text-anchor="middle">branch</text>
  <path class="aacc" d="M702 154 V176" marker-end="url(#ma)"/>
  <path class="aacc" d="M798 154 V176" marker-end="url(#ma)"/>
  <rect class="acc" x="660" y="178" width="180" height="44" rx="10"/>
  <text class="t" x="750" y="197" text-anchor="middle">compare the two</text>
  <text class="t" x="750" y="214" text-anchor="middle">reasoning chains</text>
  <text class="h" x="750" y="262" text-anchor="middle" style="fill:#00ab37">50.0</text>
  <text class="s" x="750" y="282" text-anchor="middle">GPT-4o avg. on VisDoMBench</text>

  <text class="s" x="450" y="316" text-anchor="middle">Long context (every page in the prompt) scores 32.8 with the same model.</text>
</svg>
<div class="fig-caption">Three ways to answer the same question over a document collection. The averages are GPT-4o's end-to-end accuracy across the five VisDoMBench splits (Table 3 of the paper).</div>
</div>

<div class="callout"><span class="callout-label">Key idea</span>Run a visual RAG pipeline and a textual RAG pipeline in parallel, make each one write down its evidence and its reasoning, and let a final LLM call resolve the two chains (consistency-constrained modality fusion). The fusion step is where a number read off a table image gets reconciled with the OCR text that describes it.</div>

## Walkthrough: one question, 129 pages

<div class="walkthrough" markdown="1">
<div class="wt-title">Walkthrough: "Which model performs best on the Ubuntu dataset for text lengths between 60 and 90 words?"</div>
<div class="wt-step" data-label="The pile" markdown="1">
<h4>1. The pile of PDFs and the question</h4>

{% include figure.html path="assets/img/blog/visdom/fig-intro.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Figure 1 of the paper. In single-document QA (top) the grounding context is somewhere in the one PDF you were handed. In multi-document QA (bottom) the same question has to be answered from a collection: the KEHNN text-matching paper plus distractor papers on graph matching, time-series clustering, visual grounding, appearance maps and robust loss functions." %}

This is a PaperTab-style query from VisDoMBench. The document that answers it is "Knowledge Enhanced Hybrid Neural Network for Text Matching" (the KEHNN paper), and the evidence is its Table (b), the Ubuntu dataset results. Every query in the benchmark comes with distractor documents, so the collection spans roughly 50 to 200 pages and the system has to locate the document before it can locate the table.

</div>
<div class="wt-step" data-label="Two indexes" markdown="1">
<h4>2. Index the collection twice, in parallel</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The document collection is indexed twice in parallel: every page as an image with ColQwen2, and every page's OCR text as 3,000-character chunks embedded with BGE-1.5.">
  <style>
    .t { fill: currentColor; font-size: 14px; font-family: sans-serif; }
    .h { fill: currentColor; font-size: 15px; font-weight: bold; font-family: sans-serif; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; font-family: sans-serif; }
    .in { fill: rgba(38,152,186,0.15); stroke: #2698BA; stroke-width: 1.5; }
    .pg { fill: rgba(38,152,186,0.10); stroke: #2698BA; stroke-width: 1.2; }
    .box { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.85; }
    .ok { fill: rgba(0,171,55,0.15); stroke: #00ab37; stroke-width: 1.5; }
    .ar { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.7; }
    .ln { stroke: currentColor; stroke-width: 1; opacity: 0.35; }
  </style>
  <defs>
    <marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.7"/></marker>
  </defs>
  <!-- collection -->
  <rect class="in" x="20" y="60" width="200" height="180" rx="10"/>
  <text class="h" x="120" y="84" text-anchor="middle">Document collection</text>
  <rect class="pg" x="60" y="100" width="60" height="78" rx="4"/>
  <rect class="pg" x="72" y="108" width="60" height="78" rx="4"/>
  <rect class="pg" x="84" y="116" width="60" height="78" rx="4"/>
  <rect class="pg" x="96" y="124" width="60" height="78" rx="4"/>
  <text class="s" x="120" y="222" text-anchor="middle">8.4 documents, ~129 pages</text>
  <!-- visual index -->
  <path class="ar" d="M220 120 H300" marker-end="url(#m)"/>
  <rect class="box" x="305" y="40" width="270" height="110" rx="10"/>
  <text class="h" x="440" y="64" text-anchor="middle">Page images</text>
  <rect class="pg" x="325" y="78" width="40" height="52" rx="3"/>
  <rect class="pg" x="372" y="78" width="40" height="52" rx="3"/>
  <rect class="pg" x="419" y="78" width="40" height="52" rx="3"/>
  <rect class="pg" x="466" y="78" width="40" height="52" rx="3"/>
  <text class="t" x="530" y="100" text-anchor="middle">...</text>
  <text class="s" x="440" y="144" text-anchor="middle">one image per page, no OCR</text>
  <path class="ar" d="M575 95 H655" marker-end="url(#m)"/>
  <rect class="box" x="660" y="55" width="220" height="80" rx="10"/>
  <text class="h" x="770" y="80" text-anchor="middle">Visual index</text>
  <text class="t" x="770" y="100" text-anchor="middle">ColQwen2 embeds</text>
  <text class="t" x="770" y="118" text-anchor="middle">each page image</text>
  <!-- text index -->
  <path class="ar" d="M220 180 H300" marker-end="url(#m)"/>
  <rect class="box" x="305" y="165" width="270" height="110" rx="10"/>
  <text class="h" x="440" y="189" text-anchor="middle">OCR text chunks</text>
  <rect class="pg" x="325" y="200" width="70" height="40" rx="4"/>
  <line class="ln" x1="332" y1="212" x2="388" y2="212"/><line class="ln" x1="332" y1="220" x2="388" y2="220"/><line class="ln" x1="332" y1="228" x2="372" y2="228"/>
  <rect class="pg" x="402" y="200" width="70" height="40" rx="4"/>
  <line class="ln" x1="409" y1="212" x2="465" y2="212"/><line class="ln" x1="409" y1="220" x2="465" y2="220"/><line class="ln" x1="409" y1="228" x2="449" y2="228"/>
  <rect class="pg" x="479" y="200" width="70" height="40" rx="4"/>
  <line class="ln" x1="486" y1="212" x2="542" y2="212"/><line class="ln" x1="486" y1="220" x2="542" y2="220"/><line class="ln" x1="486" y1="228" x2="526" y2="228"/>
  <text class="s" x="440" y="262" text-anchor="middle">PyTesseract, 3,000 chars, 10% overlap</text>
  <path class="ar" d="M575 220 H655" marker-end="url(#m)"/>
  <rect class="box" x="660" y="180" width="220" height="80" rx="10"/>
  <text class="h" x="770" y="205" text-anchor="middle">Text index</text>
  <text class="t" x="770" y="225" text-anchor="middle">BGE-1.5 embeds each chunk</text>
  <text class="s" x="770" y="245" text-anchor="middle">keeps doc + page metadata</text>
</svg>
</div>

VisDoMRAG never chooses between pixels and text; it builds both indexes. The visual branch renders every page as an image and embeds it with a late-interaction visual retriever (ColQwen2; ColPali also works), with no OCR at all. The textual branch OCRs every page with PyTesseract, splits the text into 3,000-character chunks with 10% overlap (recursive split), keeps the source document and page number as metadata, and embeds each chunk with BGE-1.5. Both indexes are built once per collection.

</div>
<div class="wt-step" data-label="Retrieve" markdown="1">
<h4>3. Retrieve in both modalities</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The query is run against both indexes. The visual retriever returns the top-5 pages, one of which is the page of the KEHNN paper that holds the Ubuntu table. The text retriever returns the top-7 chunks, one of which is the OCR of that table. Distractor pages from other papers are also returned.">
  <style>
    .t { fill: currentColor; font-size: 14px; font-family: sans-serif; }
    .h { fill: currentColor; font-size: 15px; font-weight: bold; font-family: sans-serif; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; font-family: sans-serif; }
    .xs { fill: currentColor; font-size: 11px; opacity: 0.75; font-family: sans-serif; }
    .in { fill: rgba(38,152,186,0.15); stroke: #2698BA; stroke-width: 1.5; }
    .gr { fill: none; stroke: currentColor; stroke-width: 1.2; opacity: 0.5; }
    .ok { fill: rgba(0,171,55,0.15); stroke: #00ab37; stroke-width: 1.8; }
    .box { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.85; }
    .ar { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.7; }
  </style>
  <defs>
    <marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.7"/></marker>
  </defs>
  <!-- query -->
  <rect class="in" x="20" y="105" width="190" height="120" rx="10"/>
  <text class="h" x="115" y="130" text-anchor="middle">Query</text>
  <text class="t" x="115" y="152" text-anchor="middle">Which model performs</text>
  <text class="t" x="115" y="170" text-anchor="middle">best on the Ubuntu dataset</text>
  <text class="t" x="115" y="188" text-anchor="middle">for text lengths between</text>
  <text class="t" x="115" y="206" text-anchor="middle">60 and 90 words?</text>
  <path class="ar" d="M210 145 H250 V90 H285" marker-end="url(#m)"/>
  <path class="ar" d="M210 185 H250 V240 H285" marker-end="url(#m)"/>
  <!-- visual retrieval -->
  <rect class="box" x="290" y="20" width="590" height="135" rx="10"/>
  <text class="h" x="305" y="42">Visual retriever (ColQwen2), top-5 pages</text>
  <rect class="ok" x="305" y="55" width="92" height="82" rx="6"/>
  <text class="xs" x="351" y="76" text-anchor="middle">KEHNN paper,</text>
  <text class="xs" x="351" y="91" text-anchor="middle">page with</text>
  <text class="xs" x="351" y="106" text-anchor="middle">Table (b)</text>
  <text class="xs" x="351" y="121" text-anchor="middle" style="fill:#00ab37;opacity:1">Ubuntu dataset</text>
  <rect class="gr" x="410" y="55" width="92" height="82" rx="6"/>
  <text class="xs" x="456" y="88" text-anchor="middle">KEHNN paper,</text>
  <text class="xs" x="456" y="103" text-anchor="middle">another page</text>
  <rect class="gr" x="515" y="55" width="92" height="82" rx="6"/>
  <text class="xs" x="561" y="81" text-anchor="middle">Time Series</text>
  <text class="xs" x="561" y="96" text-anchor="middle">Clustering</text>
  <text class="xs" x="561" y="111" text-anchor="middle">paper</text>
  <rect class="gr" x="620" y="55" width="92" height="82" rx="6"/>
  <text class="xs" x="666" y="81" text-anchor="middle">Graph</text>
  <text class="xs" x="666" y="96" text-anchor="middle">Matching</text>
  <text class="xs" x="666" y="111" text-anchor="middle">paper</text>
  <rect class="gr" x="725" y="55" width="92" height="82" rx="6"/>
  <text class="xs" x="771" y="81" text-anchor="middle">Deep</text>
  <text class="xs" x="771" y="96" text-anchor="middle">Appearance</text>
  <text class="xs" x="771" y="111" text-anchor="middle">Maps paper</text>
  <text class="t" x="850" y="100" text-anchor="middle">k=5</text>
  <!-- textual retrieval -->
  <rect class="box" x="290" y="170" width="590" height="140" rx="10"/>
  <text class="h" x="305" y="192">Text retriever (BGE-1.5), top-7 chunks</text>
  <rect class="ok" x="305" y="205" width="150" height="48" rx="6"/>
  <text class="xs" x="380" y="225" text-anchor="middle">OCR of Table (b):</text>
  <text class="xs" x="380" y="240" text-anchor="middle" style="fill:#00ab37;opacity:1">"KEHNN 0.724 0.774 0.785 ..."</text>
  <rect class="gr" x="465" y="205" width="150" height="48" rx="6"/>
  <text class="xs" x="540" y="225" text-anchor="middle">KEHNN paper,</text>
  <text class="xs" x="540" y="240" text-anchor="middle">experiments section</text>
  <rect class="gr" x="625" y="205" width="150" height="48" rx="6"/>
  <text class="xs" x="700" y="225" text-anchor="middle">Robust Loss</text>
  <text class="xs" x="700" y="240" text-anchor="middle">Function paper</text>
  <rect class="gr" x="305" y="260" width="150" height="40" rx="6"/>
  <text class="xs" x="380" y="284" text-anchor="middle">Visual Grounding paper</text>
  <rect class="gr" x="465" y="260" width="150" height="40" rx="6"/>
  <text class="xs" x="540" y="284" text-anchor="middle">Time Series paper</text>
  <rect class="gr" x="625" y="260" width="150" height="40" rx="6"/>
  <text class="xs" x="700" y="284" text-anchor="middle">... two more chunks</text>
  <text class="t" x="850" y="255" text-anchor="middle">k=7</text>
</svg>
</div>

The same question is scored against both indexes. The visual retriever returns the top-5 pages, and the page of the KEHNN paper that carries Table (b) is among them; so are pages from distractor papers, which is what makes the later curation step necessary. The textual retriever returns the top-7 chunks, one of which is the OCR of that same table, flattened into a string like "KEHNN 0.724 0.774 0.785 0.791". We picked k=5 and k=7 as the smallest windows whose retrieved evidence overlapped the ground-truth evidence at ANLCS 0.7 or better (Figure 3 of the paper).

</div>
<div class="wt-step" data-label="Curate + reason" markdown="1">
<h4>4. Each branch curates evidence, reasons, then answers</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Each branch runs the same three prompts: evidence curation, chain-of-thought reasoning, answer. The visual branch reads the [60,90) column off the page image; the textual branch reads it from the OCR chunk. Both reach KEHNN.">
  <style>
    .t { fill: currentColor; font-size: 13px; font-family: sans-serif; }
    .h { fill: currentColor; font-size: 15px; font-weight: bold; font-family: sans-serif; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; font-family: sans-serif; }
    .in { fill: rgba(38,152,186,0.15); stroke: #2698BA; stroke-width: 1.5; }
    .ok { fill: rgba(0,171,55,0.15); stroke: #00ab37; stroke-width: 1.5; }
    .box { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.85; }
    .ar { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.7; }
    .lane { fill: none; stroke: currentColor; stroke-width: 1; opacity: 0.25; stroke-dasharray: 4 4; }
  </style>
  <defs>
    <marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.7"/></marker>
  </defs>
  <!-- headers -->
  <text class="h" x="290" y="24" text-anchor="middle">1. Evidence curation</text>
  <text class="h" x="565" y="24" text-anchor="middle">2. Chain of thought</text>
  <text class="h" x="810" y="24" text-anchor="middle">3. Answer</text>
  <!-- visual lane -->
  <rect class="lane" x="10" y="36" width="880" height="140" rx="10"/>
  <rect class="in" x="20" y="70" width="120" height="70" rx="10"/>
  <text class="t" x="80" y="96" text-anchor="middle">Visual branch</text>
  <text class="s" x="80" y="114" text-anchor="middle">5 page images</text>
  <path class="ar" d="M140 105 H165" marker-end="url(#m)"/>
  <rect class="box" x="170" y="48" width="240" height="116" rx="10"/>
  <text class="t" x="290" y="70" text-anchor="middle">Table (b) Ubuntu, column [60, 90):</text>
  <text class="t" x="290" y="90" text-anchor="middle">LSTM 0.732</text>
  <text class="t" x="290" y="108" text-anchor="middle">MV-LSTM 0.725</text>
  <text class="t" x="290" y="126" text-anchor="middle">KEHNN 0.785</text>
  <text class="s" x="290" y="150" text-anchor="middle">read off the page image</text>
  <path class="ar" d="M410 105 H435" marker-end="url(#m)"/>
  <rect class="box" x="440" y="48" width="250" height="116" rx="10"/>
  <text class="t" x="565" y="72" text-anchor="middle">"60 to 90 words" is the</text>
  <text class="t" x="565" y="90" text-anchor="middle">[60, 90) column. The largest</text>
  <text class="t" x="565" y="108" text-anchor="middle">value in it is 0.785, which</text>
  <text class="t" x="565" y="126" text-anchor="middle">belongs to the KEHNN row.</text>
  <path class="ar" d="M690 105 H715" marker-end="url(#m)"/>
  <rect class="ok" x="720" y="80" width="160" height="50" rx="10"/>
  <text class="h" x="800" y="111" text-anchor="middle" style="fill:#00ab37">KEHNN</text>
  <!-- textual lane -->
  <rect class="lane" x="10" y="188" width="880" height="140" rx="10"/>
  <rect class="in" x="20" y="222" width="120" height="70" rx="10"/>
  <text class="t" x="80" y="248" text-anchor="middle">Textual branch</text>
  <text class="s" x="80" y="266" text-anchor="middle">7 text chunks</text>
  <path class="ar" d="M140 257 H165" marker-end="url(#m)"/>
  <rect class="box" x="170" y="200" width="240" height="116" rx="10"/>
  <text class="t" x="290" y="222" text-anchor="middle">From the OCR chunk, the row</text>
  <text class="t" x="290" y="240" text-anchor="middle">"KEHNN 0.724 0.774 0.785 0.791"</text>
  <text class="t" x="290" y="258" text-anchor="middle">under header "[0,30) [30,60)</text>
  <text class="t" x="290" y="276" text-anchor="middle">[60,90) [90,inf)"</text>
  <text class="s" x="290" y="302" text-anchor="middle">verbalized from flattened text</text>
  <path class="ar" d="M410 257 H435" marker-end="url(#m)"/>
  <rect class="box" x="440" y="200" width="250" height="116" rx="10"/>
  <text class="t" x="565" y="224" text-anchor="middle">Third column is [60, 90).</text>
  <text class="t" x="565" y="242" text-anchor="middle">Third values: LSTM 0.732,</text>
  <text class="t" x="565" y="260" text-anchor="middle">MV-LSTM 0.725, KEHNN 0.785.</text>
  <text class="t" x="565" y="278" text-anchor="middle">KEHNN is highest.</text>
  <path class="ar" d="M690 257 H715" marker-end="url(#m)"/>
  <rect class="ok" x="720" y="232" width="160" height="50" rx="10"/>
  <text class="h" x="800" y="263" text-anchor="middle" style="fill:#00ab37">KEHNN</text>
</svg>
</div>

Neither branch is asked for an answer straight away. The LLM is prompted three times: first to pull out and write down the evidence that matters (evidence curation), then to link that evidence into an explicit argument (chain-of-thought reasoning), and only then to answer in the format the question type calls for (answer generation). In the visual branch the multimodal LLM reads the [60, 90) column off the page image: LSTM 0.732, MV-LSTM 0.725, KEHNN 0.785. In the textual branch the LLM has to recover the same column from the flattened OCR row. Curation is what stops the distractor pages and chunks from leaking into the reasoning.

</div>
<div class="wt-step" data-label="Fuse" markdown="1">
<h4>5. Fuse the two chains with a consistency check</h4>

<div class="fig-svg">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Modality fusion takes the curated evidence, reasoning chain and answer from both branches. If the chains agree, as for the Ubuntu question (KEHNN and KEHNN), the answer is confirmed. If they conflict, as in the PaperTab StackEx example (57.5% versus 298k), the LLM re-examines the evidence and reconciles to 330k.">
  <style>
    .t { fill: currentColor; font-size: 13px; font-family: sans-serif; }
    .h { fill: currentColor; font-size: 15px; font-weight: bold; font-family: sans-serif; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; font-family: sans-serif; }
    .acc { fill: rgba(181,9,172,0.15); stroke: #B509AC; stroke-width: 2; }
    .ok { fill: rgba(0,171,55,0.15); stroke: #00ab37; stroke-width: 1.5; }
    .bad { fill: rgba(242,145,5,0.15); stroke: #F29105; stroke-width: 1.5; }
    .box { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.85; }
    .ar { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.7; }
    .aacc { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
  <defs>
    <marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.7"/></marker>
    <marker id="ma" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#B509AC"/></marker>
  </defs>
  <!-- inputs -->
  <rect class="box" x="20" y="60" width="180" height="90" rx="10"/>
  <text class="h" x="110" y="84" text-anchor="middle">Visual branch</text>
  <text class="s" x="110" y="104" text-anchor="middle">evidence + chain</text>
  <text class="s" x="110" y="122" text-anchor="middle">+ answer</text>
  <rect class="box" x="20" y="210" width="180" height="90" rx="10"/>
  <text class="h" x="110" y="234" text-anchor="middle">Textual branch</text>
  <text class="s" x="110" y="254" text-anchor="middle">evidence + chain</text>
  <text class="s" x="110" y="272" text-anchor="middle">+ answer</text>
  <path class="aacc" d="M200 105 H240 V150 H265" marker-end="url(#ma)"/>
  <path class="aacc" d="M200 255 H240 V210 H265" marker-end="url(#ma)"/>
  <!-- fusion -->
  <rect class="acc" x="270" y="110" width="200" height="140" rx="10"/>
  <text class="h" x="370" y="138" text-anchor="middle" style="fill:#B509AC">Modality fusion</text>
  <text class="t" x="370" y="162" text-anchor="middle">Are the two reasoning</text>
  <text class="t" x="370" y="180" text-anchor="middle">chains consistent?</text>
  <text class="s" x="370" y="206" text-anchor="middle">one LLM call over both</text>
  <text class="s" x="370" y="224" text-anchor="middle">branches' outputs</text>
  <path class="ar" d="M470 150 H510 V80 H535" marker-end="url(#m)"/>
  <path class="ar" d="M470 210 H510 V280 H535" marker-end="url(#m)"/>
  <!-- agree -->
  <rect class="ok" x="540" y="30" width="340" height="110" rx="10"/>
  <text class="h" x="710" y="54" text-anchor="middle" style="fill:#00ab37">Chains agree: confirm</text>
  <text class="t" x="710" y="78" text-anchor="middle">Ubuntu question: KEHNN vs KEHNN,</text>
  <text class="t" x="710" y="96" text-anchor="middle">same cell, same column, same row</text>
  <text class="s" x="710" y="122" text-anchor="middle">final answer: KEHNN</text>
  <!-- disagree -->
  <rect class="bad" x="540" y="220" width="340" height="120" rx="10"/>
  <text class="h" x="710" y="244" text-anchor="middle" style="fill:#F29105">Chains conflict: re-examine</text>
  <text class="t" x="710" y="268" text-anchor="middle">StackEx question: visual says 57.5%,</text>
  <text class="t" x="710" y="286" text-anchor="middle">textual says 298k (the train split only)</text>
  <text class="t" x="710" y="304" text-anchor="middle">Fusion re-reads the table and sums</text>
  <text class="s" x="710" y="326" text-anchor="middle">final answer: 330k (train + valid + test)</text>
</svg>
</div>

A final LLM call receives the curated evidence, the reasoning chain and the answer from both branches and is asked whether the two chains are consistent (modality fusion). When they agree, as they do for the Ubuntu question, the answer is confirmed with two independent lines of evidence behind it. When they conflict, the LLM has to re-examine the evidence and reconcile the difference. The paper's PaperTab example (Figure 5) shows the conflict case: asked for the size of the StackEx keyphrase dataset, visual RAG latched onto 57.5% and textual RAG onto 298k, both wrong numbers from the right table; the fused reasoning summed the splits and answered around 330k.

</div>
<div class="wt-step" data-label="Answer" markdown="1">
<h4>6. The final answer, with its evidence attached</h4>

<div class="tok-row"><span class="tok tok-b">query</span><span class="tok-arrow">→</span><span class="tok tok-b">5 pages</span><span class="tok tok-b">7 chunks</span><span class="tok-arrow">→</span><span class="tok tok-a">visual chain</span><span class="tok tok-a">textual chain</span><span class="tok-arrow">→</span><span class="tok tok-a">fusion</span><span class="tok-arrow">→</span><span class="tok tok-c tok-hl">KEHNN</span></div>

The curated evidence survives to the output, so the answer arrives with the table it came from. Rebuilt from Table (b) of the KEHNN paper (the grounding context in Figure 1):

| Length | [0, 30) | [30, 60) | **[60, 90)** | [90, &infin;) |
|---|---|---|---|---|
| #Pair | 253578 | 207772 | 33618 | 5032 |
| LSTM | 0.707 | 0.748 | 0.732 | 0.718 |
| MV-LSTM | 0.726 | 0.752 | 0.725 | 0.694 |
| **KEHNN** | 0.724 | 0.774 | **0.785** | 0.791 |

Final answer: **KEHNN**. Because both branches wrote their evidence down before answering, the response is verifiable: you can point at the cell that produced it (the paper calls this implicit context attribution).

</div>
</div>

## Under the hood

| Symbol | Meaning |
|---|---|
| $$ q $$ | the query |
| $$ \mathcal{D} = \{d_1, \dots, d_n\} $$ | the document collection for that query (8.4 documents, 129 pages on average) |
| $$ \mathcal{P} $$, $$ \mathcal{C} $$ | all page images, and all OCR text chunks, of $$ \mathcal{D} $$ |
| $$ \mathbf{q}_i $$, $$ \mathbf{p}_j $$ | token-level embeddings of the query and of a page image (late-interaction retriever) |
| $$ k_v = 5 $$, $$ k_t = 7 $$ | number of retrieved pages and chunks |
| $$ E_m, R_m, a_m $$ | curated evidence, reasoning chain and answer of branch $$ m \in \{v, t\} $$ |
| $$ f_\theta $$ | the (frozen) LLM, prompted differently at each step |
{: .notation}

**Retrieval.** The visual retriever scores a page by late interaction (MaxSim): every query token embedding is matched to its most similar patch embedding of the page, and the similarities are summed.

$$
s(q, p) = \sum_{i=1}^{|q|} \max_{j} \, \langle \mathbf{q}_i, \mathbf{p}_j \rangle, \qquad
\mathcal{P}_q = \operatorname{top\text{-}k_v}_{p \in \mathcal{P}} s(q, p)
$$

The textual retriever is a dense bi-encoder (BGE-1.5), scoring chunks by embedding similarity to give $$ \mathcal{C}_q $$, the top-$$ k_t $$ chunks. We benchmarked BM25, MiniLM, MPNet and BGE-1.5 on the text side and ColPali and ColQwen2 on the visual side; ColQwen2 and BGE-1.5 were the best of each and are what the end-to-end numbers use.

**Per-branch prompting.** Each branch is the same three-call chain, applied to its own context:

$$
E_m = f_\theta(q, \mathcal{X}_m;\ \text{curate}), \quad
R_m = f_\theta(q, E_m;\ \text{reason}), \quad
a_m = f_\theta(q, E_m, R_m;\ \text{answer}), \qquad \mathcal{X}_v = \mathcal{P}_q,\ \mathcal{X}_t = \mathcal{C}_q
$$

The curation call is the one that does the multi-document work: it must isolate the paragraphs, table rows or figure details that bear on $$ q $$ and verbalize them in a structured form, dropping the distractor content that retrieval let through.

**Consistency-constrained fusion.** The final answer is one more LLM call over everything both branches produced, with the instruction to judge whether $$ R_v $$ and $$ R_t $$ are consistent and to reconcile them if not:

$$
a = f_\theta\big(q, (E_v, R_v, a_v), (E_t, R_t, a_t);\ \text{consistency}\big)
$$

This is a late-fusion design, in the spirit of self-consistency over chains of thought: each modality is processed independently and the chains are compared afterwards. The early-fusion alternative, appending the OCR text of the visually retrieved pages to the image prompt, scores 43.63 average with GPT-4o against 50.01 for late fusion.

<div class="fig-svg">
<svg viewBox="0 0 900 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VisDoMRAG architecture: query and document collection go to a visual RAG branch (ColQwen2, top-5 pages, multimodal LLM) and a textual RAG branch (PyTesseract OCR, 3,000-character chunks, BGE-1.5, top-7 chunks, LLM). Each branch runs evidence curation, chain-of-thought and answer prompts. Modality fusion checks consistency and emits the final answer.">
  <style>
    .t { fill: currentColor; font-size: 13px; font-family: sans-serif; }
    .h { fill: currentColor; font-size: 15px; font-weight: bold; font-family: sans-serif; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; font-family: sans-serif; }
    .in { fill: rgba(38,152,186,0.15); stroke: #2698BA; stroke-width: 1.5; }
    .acc { fill: rgba(181,9,172,0.15); stroke: #B509AC; stroke-width: 2; }
    .ok { fill: rgba(0,171,55,0.15); stroke: #00ab37; stroke-width: 1.5; }
    .box { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.85; }
    .flow { fill: none; stroke: currentColor; stroke-width: 1.5; opacity: 0.7; stroke-dasharray: 6 6; animation: dash 1.4s linear infinite; }
    .facc { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.4s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
  </style>
  <defs>
    <marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.7"/></marker>
    <marker id="ma" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#B509AC"/></marker>
  </defs>
  <!-- input -->
  <rect class="in" x="15" y="120" width="130" height="100" rx="10"/>
  <text class="h" x="80" y="146" text-anchor="middle">q, D</text>
  <text class="s" x="80" y="168" text-anchor="middle">query and</text>
  <text class="s" x="80" y="184" text-anchor="middle">collection of</text>
  <text class="s" x="80" y="200" text-anchor="middle">n documents</text>
  <path class="flow" d="M145 150 H180 V95 H205" marker-end="url(#m)"/>
  <path class="flow" d="M145 190 H180 V245 H205" marker-end="url(#m)"/>
  <!-- visual branch -->
  <rect class="box" x="210" y="20" width="440" height="140" rx="10"/>
  <text class="h" x="225" y="42">Visual RAG branch</text>
  <rect class="box" x="225" y="55" width="130" height="90" rx="10"/>
  <text class="t" x="290" y="78" text-anchor="middle">page images</text>
  <text class="t" x="290" y="96" text-anchor="middle">ColQwen2</text>
  <text class="s" x="290" y="116" text-anchor="middle">late interaction</text>
  <text class="s" x="290" y="132" text-anchor="middle">top k=5 pages</text>
  <path class="flow" d="M355 100 H380" marker-end="url(#m)"/>
  <rect class="box" x="385" y="55" width="250" height="90" rx="10"/>
  <text class="t" x="510" y="78" text-anchor="middle">multimodal LLM, three prompts</text>
  <text class="s" x="510" y="100" text-anchor="middle">curate evidence E_v</text>
  <text class="s" x="510" y="116" text-anchor="middle">reason step by step R_v</text>
  <text class="s" x="510" y="132" text-anchor="middle">answer a_v</text>
  <!-- textual branch -->
  <rect class="box" x="210" y="180" width="440" height="140" rx="10"/>
  <text class="h" x="225" y="202">Textual RAG branch</text>
  <rect class="box" x="225" y="215" width="130" height="90" rx="10"/>
  <text class="t" x="290" y="238" text-anchor="middle">OCR + chunks</text>
  <text class="t" x="290" y="256" text-anchor="middle">BGE-1.5</text>
  <text class="s" x="290" y="276" text-anchor="middle">3,000-char chunks</text>
  <text class="s" x="290" y="292" text-anchor="middle">top k=7 chunks</text>
  <path class="flow" d="M355 260 H380" marker-end="url(#m)"/>
  <rect class="box" x="385" y="215" width="250" height="90" rx="10"/>
  <text class="t" x="510" y="238" text-anchor="middle">LLM, same three prompts</text>
  <text class="s" x="510" y="260" text-anchor="middle">curate evidence E_t</text>
  <text class="s" x="510" y="276" text-anchor="middle">reason step by step R_t</text>
  <text class="s" x="510" y="292" text-anchor="middle">answer a_t</text>
  <!-- fusion -->
  <path class="facc" d="M650 100 H680 V140 H700" marker-end="url(#ma)"/>
  <path class="facc" d="M650 260 H680 V200 H700" marker-end="url(#ma)"/>
  <rect class="acc" x="705" y="110" width="120" height="120" rx="10"/>
  <text class="h" x="765" y="138" text-anchor="middle" style="fill:#B509AC">Fusion</text>
  <text class="s" x="765" y="160" text-anchor="middle">consistency</text>
  <text class="s" x="765" y="176" text-anchor="middle">check on</text>
  <text class="s" x="765" y="192" text-anchor="middle">R_v vs R_t</text>
  <text class="s" x="765" y="214" text-anchor="middle">late fusion</text>
  <path class="facc" d="M825 170 H845" marker-end="url(#ma)"/>
  <rect class="ok" x="850" y="145" width="40" height="50" rx="10"/>
  <text class="h" x="870" y="176" text-anchor="middle" style="fill:#00ab37">a</text>
</svg>
<div class="fig-caption">VisDoMRAG end to end. Grey boxes are retrieval and prompting steps shared with unimodal RAG; the fusion step is the contribution. Retrieval is bounded (5 pages and 7 chunks), so the context handed to the LLM does not grow with the size of the collection.</div>
</div>

**The benchmark.** VisDoMBench re-purposes five datasets that have public source documents and grounded evidence, de-duplicates questions across splits, drops trivial ones, and augments each question with distractor documents. Ambiguous questions (common in PaperTab and SciGraphQA) are rewritten by GPT-4o into more specific variants and a human annotator picks one, keeps the original, or discards the item, so that exactly one document answers each question.

| Split | Content | Queries | Docs | Avg. docs / query | Avg. pages / query |
|---|---|---|---|---|---|
| PaperTab | tables, text (scientific papers) | 377 | 297 | 10.82 | 113.10 |
| FetaTab | tables (Wikipedia) | 350 | 300 | 7.77 | 124.33 |
| SciGraphQA | charts (scientific papers) | 407 | 319 | 5.91 | 129.71 |
| SPIQA | tables, charts (scientific papers) | 586 | 117 | 9.51 | 135.58 |
| SlideVQA | slides (presentation decks) | 551 | 244 | 6.99 | 139.71 |
| **VisDoMBench** | tables, charts, slides, text | **2,271** | **1,277** | **8.36** | **128.69** |

Answers are scored with word-overlap F1 (the UDA variant for PaperTab, which handles binary and short-text answers). A retriever is credited with identifying the source document when at least $$ \lceil k/2 \rceil $$ of its top-$$ k $$ results come from the ground-truth document.

## What the numbers say

| Method | LLM | PaperTab | FetaTab | SciGraphQA | SPIQA | SlideVQA | Average |
|---|---|---|---|---|---|---|---|
| Long context | GPT-4o | 28.37 | 60.03 | 24.12 | 36.30 | 15.06 | 32.78 |
| Text RAG | GPT-4o | 37.34 | 60.82 | 29.74 | 42.80 | 15.97 | 37.33 |
| Visual RAG | GPT-4o | 42.01 | 61.89 | 31.12 | 43.28 | 66.82 | 49.02 |
| **VisDoMRAG** | GPT-4o | **44.11** | **63.28** | **31.36** | **44.09** | **67.22** | **50.01** |
| Long context | Qwen2-VL-7B | 8.23 | 23.10 | 16.74 | 9.93 | 2.46 | 12.09 |
| **VisDoMRAG** | Qwen2-VL-7B | **29.89** | **59.24** | **27.98** | **42.80** | **39.77** | **39.94** |

Across the benchmark VisDoMRAG improves end-to-end QA over long-context, text-only and visual-only baselines by 12-20%, for every LLM we tried (GPT-4o, Gemini 1.5 Flash, Qwen2-VL-7B). The biggest jump is for the small open model: Qwen2-VL goes from 12.09 with the whole collection in context to 39.94 with VisDoMRAG. On the retrieval side, ColQwen2 finds the right source document 96.94% of the time at k=5 versus 92.40% for BGE-1.5, and on SlideVQA the dense text retrievers collapse below 1% because slides carry almost no running text. Removing evidence curation, chain-of-thought and consistency prompting drops VisDoMRAG from 50.01 to 45.98.

## Try it

- Paper page on this site: [/papers/visdom/](/papers/visdom/)
- arXiv: [2412.10704](https://arxiv.org/abs/2412.10704); ACL Anthology: [2025.naacl-long.310](https://aclanthology.org/2025.naacl-long.310/)
- Code and the VisDoMBench splits: [github.com/MananSuri27/VisDoM](https://github.com/MananSuri27/VisDoM)
