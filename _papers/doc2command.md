---
layout: paper
title: "Doc2Command: Furthering Language Guided Document Editing"
short_title: "Doc2Command"
description: "Doc2Command jointly grounds a natural-language edit request in a document image and generates a structured edit command. ICLR 2024 Tiny Papers track."
bibkey: suri2024doccommand
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Puneet Mathur
    url: https://research.adobe.com/person/puneet-mathur/
  - name: Ramit Sawhney
  - name: Preslav Nakov
    url: https://mbzuai.ac.ae/study/faculty/preslav-nakov/
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park; Adobe Research; MBZUAI"
venue: "ICLR 2024, Tiny Papers Track"
venue_short: "ICLR 2024"
year: 2024
date: 2024-05-07
publisher_url: https://openreview.net/forum?id=inQ9bW5AQz
publisher_label: "OpenReview"
figure: /assets/img/papers/doc2command/hero.png
figure_alt: "Doc2Command architecture: the user request is rendered onto the document image, encoded by a document image encoder, and decoded by a text decoder into an edit command and by a mask transformer into a segmentation map that yields the visual grounding."
figure_caption: "Doc2Command. The user request is rendered onto the document image and encoded once. A text decoder produces the structured edit command (action, component, initial state, final state) while a mask transformer produces a segmentation map that is upsampled and converted into the grounded region of interest."
tldr: "Turning a free-form edit request into something a document editor can execute needs two things at once: where on the page the edit applies, and what exactly to do. Doc2Command is a single multimodal Transformer that produces both, a grounded region of interest and a structured edit command, from the document image with the request rendered on it."
highlights:
  - value: "48.69%"
    label: "Top-1 RoI accuracy on DocEdit-PDF"
  - value: "86.1%"
    label: "component accuracy in generated commands"
  - value: "39.6%"
    label: "exact-match command generation"
og_image: https://manansuri.com/assets/img/papers/doc2command/hero.png
---

## Abstract

This short paper introduces Doc2Command, a multi-task multimodal model for language-guided document editing. Given a document image and a natural-language edit request, Doc2Command jointly localizes the region of interest that the request refers to and translates the request into a structured edit command with an action, a component, and its initial and final states. The request is rendered directly onto the document image so that a single image encoder processes language and layout together; a text decoder generates the command and a mask transformer produces the grounding as a segmentation map. Doc2Command later became the grounding and command generation component of [DocEdit-v2](/papers/docedit-v2/) (EMNLP 2024), and this summary is based on the description of the model in that paper.

## The problem

Edit requests in the DocEdit dataset are open-vocabulary and often ambiguous: "change the page number in the footer from 11 to 12" has to be resolved to a specific component on a dense page and to a precise action on that component. Prior work treated grounding and command generation as separate problems, and models that regress bounding box coordinates directly perform poorly on document images, where the target may be a single line of text among hundreds.

## Approach

- **One visual input.** Rather than encoding the request as text, we render it as a text box on top of the document image and feed the combined image to a pre-trained Vision Transformer encoder borrowed from Pix2Struct. The image is not scaled to a fixed resolution; the scaling factor is chosen to fit as many fixed-size patches as the encoder's sequence length allows, which keeps the model robust to extreme document aspect ratios.
- **Edit command generation.** A pre-trained Pix2Struct text decoder autoregressively generates the command `ACTION(<Component>, <Initial State>, <Final State>)` from the patch embeddings.
- **Multimodal grounding as segmentation.** A DETR-style mask transformer with three learnable class embeddings (region of interest, rendered request, remaining document) produces class masks by a scalar product with the patch embeddings. The masks are upsampled to image size, softmaxed, and converted at inference into a bounding box from the largest contiguous region around the mask centroid.
- **Training.** The decoder and mask transformer are fine-tuned jointly with a weighted loss, a text loss for the command and a segmentation loss that sums focal and dice loss.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Doc2Command: the user request is rendered onto the document image, encoded once by a Pix2Struct ViT encoder, and decoded by a text decoder into an edit command and by a mask transformer into a segmentation map that becomes the grounded bounding box.">
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
  <rect class="n" x="15" y="50" width="130" height="66" rx="8"/>
  <text class="t" x="80" y="73" text-anchor="middle">Document image</text>
  <rect class="n" x="60" y="82" width="40" height="26" rx="2"/>
  <path class="n" d="M66 90 h28 M66 97 h28 M66 104 h18"/>
  <rect class="n" x="15" y="204" width="130" height="66" rx="8"/>
  <text class="t" x="80" y="227" text-anchor="middle">User request</text>
  <text class="s" x="80" y="245" text-anchor="middle">"change page number</text>
  <text class="s" x="80" y="261" text-anchor="middle">from 22 to 202"</text>
  <!-- render -->
  <rect class="n" x="185" y="125" width="140" height="70" rx="8"/>
  <text class="t" x="255" y="148" text-anchor="middle">Render request</text>
  <text class="s" x="255" y="166" text-anchor="middle">as a text box on</text>
  <text class="s" x="255" y="182" text-anchor="middle">top of the page</text>
  <!-- encoder -->
  <rect class="n acc" x="365" y="115" width="150" height="90" rx="8" stroke-width="2"/>
  <text class="t" x="440" y="140" text-anchor="middle">Pix2Struct ViT</text>
  <text class="t" x="440" y="158" text-anchor="middle">encoder</text>
  <text class="s" x="440" y="178" text-anchor="middle">variable-resolution</text>
  <text class="s" x="440" y="194" text-anchor="middle">patches</text>
  <!-- heads -->
  <rect class="n" x="555" y="40" width="150" height="70" rx="8"/>
  <text class="t" x="630" y="63" text-anchor="middle">Text decoder</text>
  <text class="s" x="630" y="81" text-anchor="middle">autoregressive</text>
  <text class="s" x="630" y="97" text-anchor="middle">command tokens</text>
  <rect class="n" x="555" y="210" width="150" height="70" rx="8"/>
  <text class="t" x="630" y="233" text-anchor="middle">Mask transformer</text>
  <text class="s" x="630" y="251" text-anchor="middle">3 classes: RoI, request,</text>
  <text class="s" x="630" y="267" text-anchor="middle">rest of page</text>
  <!-- outputs -->
  <rect class="n" x="745" y="40" width="140" height="70" rx="8"/>
  <text class="t" x="815" y="63" text-anchor="middle">Edit command</text>
  <text class="m pulse" x="815" y="83" text-anchor="middle" style="fill:#B509AC">MODIFY(text,</text>
  <text class="m pulse" x="815" y="98" text-anchor="middle" style="fill:#B509AC">22, 202)</text>
  <rect class="n" x="745" y="210" width="140" height="70" rx="8"/>
  <text class="t" x="815" y="233" text-anchor="middle">Grounded RoI</text>
  <text class="s" x="815" y="251" text-anchor="middle">seg. map upsampled</text>
  <text class="s" x="815" y="267" text-anchor="middle">&#8594; bounding box</text>
  <!-- flows -->
  <path class="flow" d="M145 83 H165 V145 H185"/>
  <path class="flow" d="M145 237 H165 V175 H185" style="animation-delay:0.1s"/>
  <path class="flow" d="M325 160 H365" style="animation-delay:0.4s"/>
  <path class="flow" d="M515 145 H535 V75 H555" style="animation-delay:0.7s"/>
  <path class="flow" d="M515 175 H535 V245 H555" style="animation-delay:0.8s"/>
  <path class="flow" d="M705 75 H745" style="animation-delay:1.1s"/>
  <path class="flow" d="M705 245 H745" style="animation-delay:1.2s"/>
  <text class="s fade1" x="345" y="105" text-anchor="middle">one visual input</text>
  <text class="s fade1" x="535" y="300" text-anchor="middle" style="animation-delay:1s">joint loss: text + focal + dice</text>
</svg>
<div class="anim-caption">Doc2Command: the request is rendered onto the page and encoded once; a text decoder writes the command and a mask transformer segments the region of interest, which is converted to a bounding box.</div>
</div>

## Example

The end-to-end example from the DocEdit-v2 paper (its Figure 1) shows what Doc2Command produces for one request before the later stages take over.

{% include figure.html path="assets/img/papers/doc2command/ex-pipeline.png" class="img-fluid rounded" zoomable=true caption="Figure 1 of the DocEdit-v2 paper. Doc2Command takes the document image and request and returns the grounded region (items 9 and 9A) and the structured edit command; the later stages reformulate the command and edit the HTML+CSS." %}

<div class="paper-example" markdown="1">
<span class="ex-label">Input: document image + user request</span>
<div class="ex-row">Text "Delta Electricity" with the numbering 9 and 9A are converted to main heading "9" and sub heading to "a" and "b"</div>
<span class="ex-label">Output: grounding + edit command</span>
<div class="ex-row"><strong>Region of interest:</strong> a bounding box around list items 9 (Delta Electricity) and 9A (Duke Energy Australia).<br><strong>Command:</strong> <code>REPLACE(BULLET, BULLETS AS 9 AND 9A, BULLETS AS A AND B)</code></div>
</div>

Table 5 of the DocEdit-v2 paper lists generated commands next to the ground truth. Three of them:

<div class="paper-example" markdown="1">
<span class="ex-label">Request</span>
<div class="ex-row">Added page number 4 at the footer of the page.</div>
<span class="ex-label">Predicted vs. ground truth</span>
<div class="ex-row"><span class="ex-good"><code>add(text footer, none, Page 4)</code></span> &mdash; matches the ground truth exactly.</div>
<span class="ex-label">Request</span>
<div class="ex-row">Change the date "December 1, 2000" to December 11, 2020</div>
<span class="ex-label">Predicted vs. ground truth</span>
<div class="ex-row"><code>replace(text, December 1, 2000, December, 11, 2000)</code> vs. ground truth <code>modify(text, 1, 2000, 11, 2000)</code> &mdash; the generated command achieves the desired edit, but the ground truth does it with fewer changes.</div>
<span class="ex-label">Request</span>
<div class="ex-row">2-3 lines of text in the paragraph "(p) Issues, obtain" are changed to four separate bullet points. ...</div>
<span class="ex-label">Predicted vs. ground truth</span>
<div class="ex-row"><span class="ex-bad"><code>replace(bullet, dotted, 4 bullet points)</code></span> vs. ground truth <code>split(text, paragraph, split)</code> &mdash; the model mistakes a "split" action for a "replace" action.</div>
</div>

## Results

The numbers below are reported in the DocEdit-v2 paper, which evaluates Doc2Command on the test split of the DocEdit-PDF dataset (17,808 document image pairs with edit requests and ground-truth commands).

| System | Exact match (%) | Word overlap F1 | ROUGE-L | Action (%) | Component (%) |
|---|---|---|---|---|---|
| T5 (text only) | 20.4 | 0.79 | 0.76 | 81.4 | 29.8 |
| Multimodal Transformer | 31.6 | 0.82 | 0.83 | 83.1 | 32.4 |
| DocEditor | 37.6 | 0.87 | 0.83 | 87.6 | 40.7 |
| GPT-3.5 (in-context) | 10.1 | 0.77 | 0.77 | 75.93 | 73.37 |
| GPT-4 (in-context) | 14.3 | 0.78 | 0.78 | 81.57 | 75.03 |
| **Doc2Command** | **39.6** | **0.87** | **0.86** | **85.0** | **86.1** |

<p class="table-note">Source: Table 1 of the DocEdit-v2 paper, edit command generation. Action and Component are the accuracy of the predicted action and component fields. Higher is better.</p>

| System | Top-1 RoI accuracy (%) |
|---|---|
| ReSC-Large | 17.04 |
| TransVG | 25.34 |
| DocEditor | 36.50 |
| **Doc2Command** | **48.69** |

<p class="table-note">Source: Table 2 of the DocEdit-v2 paper, region-of-interest bounding box detection. Higher is better.</p>

- Doc2Command has the best exact match and ROUGE-L, and its component accuracy (86.1%) is more than 45 points above the task-specific DocEditor and about 11 points above GPT-4, which identifies components well but rarely reproduces the exact command.
- Treating grounding as segmentation rather than coordinate regression lifts Top-1 RoI accuracy by 12.19 points over DocEditor and by more than 23 points over the direct-regression baselines.
- Within DocEdit-v2, plugging Doc2Command's grounding and command into the GPT-4V editing prompt raises Edit Correctness from 27.45% to 55.33% (Table 3 of that paper).

## Resources

- [OpenReview page](https://openreview.net/forum?id=inQ9bW5AQz) for the ICLR 2024 Tiny Papers submission
- [DocEdit-v2](/papers/docedit-v2/), the EMNLP 2024 paper that builds an end-to-end document editing system around Doc2Command, with the full description of the model ([arXiv 2410.16472](https://arxiv.org/abs/2410.16472))
- [All publications](/publications/)
