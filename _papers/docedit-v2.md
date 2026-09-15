---
layout: paper
title: "DocEdit-v2: Document Structure Editing Via Multimodal LLM Grounding"
short_title: "DocEdit-v2"
description: "DocEdit-v2 grounds natural-language edit requests in document images and edits HTML structure with GPT-4V or Gemini, up to 30 points better. EMNLP 2024."
bibkey: suri-etal-2024-docedit
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Puneet Mathur
    url: https://research.adobe.com/person/puneet-mathur/
  - name: Franck Dernoncourt
    url: https://research.adobe.com/person/franck-dernoncourt/
  - name: Rajiv Jain
    url: https://research.adobe.com/person/rajiv-jain/
  - name: Vlad I Morariu
    url: https://research.adobe.com/person/vlad-morariu/
  - name: Ramit Sawhney
  - name: Preslav Nakov
    url: https://mbzuai.ac.ae/study/faculty/preslav-nakov/
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park; Adobe Research; MBZUAI"
venue: "EMNLP 2024 (Main Conference)"
venue_short: "EMNLP 2024"
year: 2024
date: 2024-10-21
arxiv: "2410.16472"
pdf: https://arxiv.org/pdf/2410.16472
publisher_url: https://aclanthology.org/2024.emnlp-main.867/
publisher_label: "ACL Anthology"
hf_paper: https://huggingface.co/papers/2410.16472
figure: /assets/img/papers/docedit-v2/hero.png
figure_alt: "DocEdit-v2 pipeline: Doc2Command produces a visual grounding box and a structured edit command, Command Reformulation rewrites the command into an LMM instruction, and Document Editing applies it."
figure_caption: "Core of the DocEdit-v2 pipeline. Doc2Command turns the document image and user request into a grounded region of interest and a structured edit command; Command Reformulation rewrites the command as an instruction for a generalist multimodal model; Document Editing then applies it to the HTML+CSS representation of the page."
tldr: "Editing a document from a natural-language request requires grounding the request in the page and turning it into a precise action, and both steps are where prior systems failed. DocEdit-v2 combines Doc2Command (joint region-of-interest segmentation and command generation), LLM-based Command Reformulation, and multimodal prompting of GPT-4V or Gemini to edit the document's HTML, improving command generation by 2-33%, region detection by 12-31%, and end-to-end editing by 1-12% on the DocEdit dataset."
highlights:
  - value: "48.69%"
    label: "Top-1 RoI detection (previous best 36.50%)"
  - value: "86.1%"
    label: "component accuracy in edit commands"
  - value: "+30 pts"
    label: "edit correctness with grounding and reformulation (GPT-4V)"
  - value: "17,808"
    label: "document image pairs in DocEdit-PDF"
og_image: https://manansuri.com/assets/img/papers/docedit-v2/hero.png
---

## Abstract

Document structure editing involves manipulating localized textual, visual, and layout components in document images based on the user's requests. Past works have shown that multimodal grounding of user requests in the document image and identifying the accurate structural components and their associated attributes remain key challenges for this task. To address these, we introduce the DocEdit-v2, a novel framework that performs end-to-end document editing by leveraging Large Multimodal Models (LMMs). It consists of three novel components: (1) Doc2Command to simultaneously localize edit regions of interest (RoI) and disambiguate user edit requests into edit commands. (2) LLM-based Command Reformulation prompting to tailor edit commands originally intended for specialized software into edit instructions suitable for generalist LMMs. (3) Moreover, DocEdit-v2 processes these outputs via Large Multimodal Models like GPT-4V and Gemini, to parse the document layout, execute edits on grounded Region of Interest (RoI), and generate the edited document image. Extensive experiments on the DocEdit dataset show that DocEdit-v2 significantly outperforms strong baselines on edit command generation (2-33%), RoI bounding box detection (12-31%), and overall document editing (1-12%) tasks.

## The problem

Language-guided document editing takes a document image and a request like "make the numbered items 9 and 9A into sub-headings a and b" and has to produce the edited document. Three things make this hard: the request has to be grounded to the right region of a dense page, the request has to be turned into a precise action on a specific component with specific attributes, and the edit has to be applied without disturbing the rest of the document.

Earlier work generated software-specific edit commands but stopped short of producing an edited document, and pixel-level generative models struggle to reproduce text-dense pages faithfully. Large multimodal models are good at layout parsing and code synthesis, but handing them a raw request and a page image leaves the grounding and disambiguation to chance.

## Approach

DocEdit-v2 treats document editing as editing the document's HTML+CSS representation, which preserves hierarchy and separates content from style, and it builds the prompt for that edit in three stages.

- **Doc2Command.** A multi-task multimodal Transformer that performs region-of-interest segmentation and edit command generation jointly. The user request is rendered as a text box on top of the document image, and the combined image is encoded by a Pix2Struct ViT encoder with variable-resolution patching. A text decoder generates the structured command `ACTION(<Component>, <Initial State>, <Final State>)`, and a DETR-style mask transformer predicts a three-class segmentation map (region of interest, rendered request, rest of the page) that is converted to a bounding box at inference. Training uses a weighted sum of the text loss and a focal-plus-dice segmentation loss. Doc2Command is described in more detail on its own page, [Doc2Command](/papers/doc2command/).
- **Command Reformulation prompting.** Commands generated from the DocEdit dataset are written for specialized editing software and often underspecify the action or component. An LLM (GPT-4 or Gemini Pro) rewrites the generated command, given the original request, into an instruction suitable for a generalist multimodal model.
- **Generative document editing.** GPT-4V or Gemini receives the document image with the grounded bounding box drawn as a set-of-marks cue, the reformulated instruction, and the document's HTML+CSS, and produces the edited HTML+CSS. Both input and ground-truth documents are converted to HTML+CSS with constrained prompts (standard class names, flexbox layout, embedded CSS, placeholders for media) so that outputs can be compared fairly.

{% include figure.html path="assets/img/papers/docedit-v2/fig-system.png" class="img-fluid rounded" zoomable=true caption="Full DocEdit-v2 pipeline on a real example. The request to convert items 9 and 9A into a main heading with sub-headings is grounded to the right rows, turned into a REPLACE command, reformulated as a modify-text instruction, and applied to produce the edited HTML+CSS document." %}

We also introduce two automated metrics for HTML document editing, DOM Tree Edit Distance (Zhang-Shasha) and CSS IoU over property-value pairs, alongside a three-part human evaluation of Style Replication, Content Replication, and Edit Correctness. CSS IoU correlates at 0.73 with human Style Replication judgments.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DocEdit-v2: a document image and user request go through Doc2Command, which outputs a grounded region and an edit command; the command is reformulated by an LLM and a large multimodal model edits the document's HTML+CSS.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.8; }
    .m { fill: currentColor; font-size: 11px; font-family: monospace; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <!-- inputs -->
  <rect class="n" x="15" y="40" width="130" height="70" rx="8"/>
  <text class="t" x="80" y="63" text-anchor="middle">Document image</text>
  <rect class="n" x="60" y="72" width="40" height="28" rx="2"/>
  <path class="n" d="M66 80 h28 M66 87 h28 M66 94 h18"/>
  <rect class="n" x="15" y="210" width="130" height="70" rx="8"/>
  <text class="t" x="80" y="233" text-anchor="middle">User request</text>
  <text class="s" x="80" y="253" text-anchor="middle">"make items 9 and 9A</text>
  <text class="s" x="80" y="269" text-anchor="middle">sub-headings a, b"</text>
  <!-- doc2command -->
  <rect class="n acc" x="185" y="125" width="140" height="70" rx="8" stroke-width="2"/>
  <text class="t" x="255" y="150" text-anchor="middle">Doc2Command</text>
  <text class="s" x="255" y="168" text-anchor="middle">request rendered</text>
  <text class="s" x="255" y="184" text-anchor="middle">onto the page</text>
  <!-- outputs -->
  <rect class="n" x="365" y="40" width="150" height="70" rx="8"/>
  <text class="t" x="440" y="63" text-anchor="middle">Grounded RoI</text>
  <text class="s" x="440" y="81" text-anchor="middle">segmentation map</text>
  <text class="s" x="440" y="97" text-anchor="middle">&#8594; bounding box</text>
  <rect class="n" x="365" y="210" width="150" height="70" rx="8"/>
  <text class="t" x="440" y="233" text-anchor="middle">Edit command</text>
  <text class="m" x="440" y="253" text-anchor="middle">REPLACE(bullet,</text>
  <text class="m" x="440" y="268" text-anchor="middle">9 and 9A, a and b)</text>
  <!-- reformulation -->
  <rect class="n" x="555" y="210" width="150" height="70" rx="8"/>
  <text class="t" x="630" y="233" text-anchor="middle">Reformulation</text>
  <text class="s" x="630" y="251" text-anchor="middle">GPT-4 / Gemini Pro</text>
  <text class="s" x="630" y="268" text-anchor="middle">rewrite as instruction</text>
  <!-- LMM editor -->
  <rect class="n acc" x="745" y="100" width="140" height="120" rx="8" stroke-width="2"/>
  <text class="t" x="815" y="124" text-anchor="middle">GPT-4V / Gemini</text>
  <text class="s" x="815" y="144" text-anchor="middle">page + RoI marks</text>
  <text class="s" x="815" y="160" text-anchor="middle">+ instruction</text>
  <text class="s" x="815" y="176" text-anchor="middle">+ HTML+CSS</text>
  <text class="t pulse" x="815" y="204" text-anchor="middle" style="fill:#B509AC">edited HTML+CSS</text>
  <!-- flows -->
  <path class="flow" d="M145 75 H165 V145 H185"/>
  <path class="flow" d="M145 245 H165 V175 H185" style="animation-delay:0.1s"/>
  <path class="flow" d="M325 145 H345 V75 H365" style="animation-delay:0.4s"/>
  <path class="flow" d="M325 175 H345 V245 H365" style="animation-delay:0.5s"/>
  <path class="flow" d="M515 245 H555" style="animation-delay:0.8s"/>
  <path class="flow" d="M80 280 V300 H630 V280" style="animation-delay:0.8s"/>
  <path class="flow" d="M515 75 H725 V130 H745" style="animation-delay:1.0s"/>
  <path class="flow" d="M705 245 H725 V190 H745" style="animation-delay:1.2s"/>
  <text class="s fade1" x="620" y="66" text-anchor="middle">set-of-marks cue</text>
  <text class="s fade1" x="355" y="296" text-anchor="middle" style="animation-delay:0.7s">original request</text>
</svg>
<div class="anim-caption">DocEdit-v2: Doc2Command grounds the request and emits a structured command, an LLM reformulates the command into an instruction, and GPT-4V or Gemini edits the page's HTML+CSS with the grounded region marked.</div>
</div>

## Example

The paper's Figure 1 (shown above) walks one request through the whole pipeline. Each stage's output is transcribed below.

<div class="paper-example" markdown="1">
<span class="ex-label">User request + document image</span>
<div class="ex-row">Text "Delta Electricity" with the numbering 9 and 9A are converted to main heading "9" and sub heading to "a" and "b" (on a "Register of Facility Providers" page listing numbered corporations).</div>
<span class="ex-label">Doc2Command output</span>
<div class="ex-row"><strong>Visual grounding:</strong> a bounding box around list items 9 (Delta Electricity) and 9A (Duke Energy Australia).<br><strong>Edit command:</strong> <code>REPLACE(BULLET, BULLETS AS 9 AND 9A, BULLETS AS A AND B)</code></div>
<span class="ex-label">Reformulated command</span>
<div class="ex-row"><code>modify(text, "Delta Electricity" with numbering 9 and 9A, main heading "9" and sub headings "a" and "b")</code></div>
<span class="ex-label">Edited HTML+CSS document</span>
<div class="ex-row"><span class="ex-good">Item 9 becomes a heading with two sub-items: "9. a. Delta Electricity (being a corporation established under the Energy Services Corporations Act 1995 (NSW)) b. Duke Energy Australia Trading and marketing A.C.N. 063 050 168 Pty Limited", and the rest of the list is unchanged.</span></div>
</div>

The second example (Figure 3 of the paper) shows why Command Reformulation matters: the raw Doc2Command command is correct but underspecified, and the generalist model edits the wrong "22".

{% include figure.html path="assets/img/papers/docedit-v2/ex-reformulation.png" class="img-fluid rounded" zoomable=true caption="Figure 3 of the paper. Left: the document edited from the raw Doc2Command command. Centre: the request and page. Right: the document edited from the reformulated command." %}

<div class="paper-example" markdown="1">
<span class="ex-label">User request</span>
<div class="ex-row">Changed the page number from 22 to 202.</div>
<span class="ex-label">Doc2Command command</span>
<div class="ex-row"><code>MODIFY(TEXT, 22, 202)</code> &mdash; <span class="ex-bad">the edited document targets the "(22)" operating-cost cell in the table and the footer still reads 22.</span></div>
<span class="ex-label">Reformulated command</span>
<div class="ex-row"><code>MODIFY(TEXT, page number 22, page number 202)</code> &mdash; <span class="ex-good">the edited document's footer reads "page number 202".</span></div>
</div>

## Results

All experiments use the DocEdit-PDF dataset (17,808 document image pairs with edit requests and ground-truth commands), evaluated on the official test split. The main result is the end-to-end editing ablation with GPT-4V as the editing model.

| Setting (GPT-4V as editor) | Tree Edit Distance | CSS IoU | Edit Correctness (%) | Human total (%) |
|---|---|---|---|---|
| GPT-4V only: raw request + page | 24.13 | 0.245 | 27.45 | 55.92 |
| + visual grounding | 24.02 | 0.250 | 45.28 | 62.59 |
| + command generation | 23.54 | 0.247 | 49.32 | 64.19 |
| + command generation + reformulation | 23.27 | 0.245 | 51.87 | 65.49 |
| + visual grounding + command generation | 23.72 | 0.251 | 55.33 | 66.79 |
| **DocEdit-v2: grounding + command + reformulation** | **23.15** | **0.252** | **57.41** | **67.28** |

<p class="table-note">Source: Table 3 of the paper. Tree Edit Distance is the Zhang-Shasha distance between DOM trees (lower is better); CSS IoU is over property-value pairs, Edit Correctness is the human rating of whether the requested edit was made, and Human total averages Style Replication, Content Replication, and Edit Correctness (higher is better).</p>

| Setting (Gemini as editor) | Tree Edit Distance | CSS IoU | Edit Correctness (%) | Human total (%) |
|---|---|---|---|---|
| Gemini only: raw request + page | 62.95 | 0.333 | 15.79 | 45.61 |
| + visual grounding | 54.63 | 0.332 | 39.22 | 54.79 |
| + command generation + reformulation | 53.89 | 0.341 | 40.44 | 56.69 |
| **DocEdit-v2: grounding + command + reformulation** | **52.24** | **0.367** | **44.73** | **58.77** |

<p class="table-note">Source: Table 4 of the paper, same metrics.</p>

- Grounding plus reformulation raises GPT-4V's Edit Correctness by 29.96 points (27.45 to 57.41) and its overall human score by 11.36 points; with Gemini the gains are 28.94 and 13.16 points.
- Visual grounding alone is the single biggest lever (+17.83 Edit Correctness for GPT-4V, +23.43 for Gemini); Command Reformulation adds a further 2-3 points on top of the generated command.
- **Command generation (Table 1).** Doc2Command reaches 39.6% exact match, 0.86 ROUGE-L, and 86.1% component accuracy, against 37.6%, 0.83, and 40.7% for DocEditor and 14.3%, 0.78, and 75.03% for GPT-4 with in-context examples.
- **RoI bounding box detection (Table 2).** Doc2Command achieves 48.69% Top-1 accuracy, ahead of DocEditor at 36.50%, TransVG at 25.34%, and ReSC-Large at 17.04%. Both tables are reproduced on the [Doc2Command page](/papers/doc2command/).
- CSS IoU correlates at 0.73 with human Style Replication judgments, which is why the automated metrics track the human ones in the tables above.

## Resources

- [Paper on arXiv](https://arxiv.org/abs/2410.16472) and the [ACL Anthology page](https://aclanthology.org/2024.emnlp-main.867/)
- [Hugging Face Papers page](https://huggingface.co/papers/2410.16472)
- [Adobe Research publication page](https://research.adobe.com/publication/doceditagent-document-structure-editing-via-multimodal-llm-grounding/)
- [Doc2Command](/papers/doc2command/), the grounding and command generation component, first presented at ICLR 2024 (Tiny Papers)
- Data: the experiments use the DocEdit-PDF split of the DocEdit dataset (Mathur et al., 2023); no code release accompanies this paper
- [All publications](/publications/)
