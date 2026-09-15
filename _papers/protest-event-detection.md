---
layout: paper
title: "Multilingual Protest Event Detection using Transformer-based Models"
short_title: "Protest Event Detection"
description: "NSUT-NLP at CASE 2022 Task 1: multilingual BERT with translation-based data augmentation for protest news detection in seven languages, four of them zero-shot."
bibkey: suri-etal-2022-nsut
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Krish Chopra
  - name: Adwita Arora
affiliations: "Netaji Subhas University of Technology, New Delhi"
venue: "5th Workshop on Challenges and Applications of Automated Extraction of Socio-political Events from Text (CASE 2022), at EMNLP 2022"
venue_short: "CASE 2022"
year: 2022
date: 2022-12-07
pdf: https://aclanthology.org/2022.case-1.23.pdf
publisher_url: https://aclanthology.org/2022.case-1.23/
publisher_label: "ACL Anthology"
figure: /assets/img/papers/protest-event-detection/hero.png
figure_alt: "Graph showing the original English, Spanish and Portuguese training sets being translated into augmented English, Spanish and Portuguese sets, and the augmented English set being translated into Hindi, Urdu, Mandarin and Turkish."
figure_caption: "Data augmentation using translation. Each directed edge is a translation from a source to a target language; dashed edges carry only positively labelled samples and solid edges carry both classes. The augmented English set is then translated to create training data for the four zero-shot languages."
tldr: "Protest news detection at CASE 2022 came with skewed labels, little Spanish and Portuguese data, and no training data at all for Hindi, Urdu, Mandarin and Turkish. We fine-tune multilingual BERT on training sets built by translating positive samples across languages, reaching a macro-F1 of 0.806 on English and covering all seven evaluation languages."
highlights:
  - value: "7"
    label: "languages evaluated"
  - value: "4"
    label: "zero-shot languages trained on translated data"
  - value: "0.806"
    label: "macro-F1 on English (rank 5)"
og_image: https://manansuri.com/assets/img/papers/protest-event-detection/hero.png
---

## Abstract

Event detection, specifically in the socio-political domain, has posed a long-standing challenge to researchers in the NLP domain. Therefore, the creation of automated techniques that perform classification of the large amounts of accessible data on the Internet becomes imperative. This paper is a summary of the efforts we made in participating in Task 1 of CASE 2022. We use state-of-art multilingual BERT (mBERT) with further fine-tuning to perform document classification in English, Portuguese, Spanish, Urdu, Hindi, Turkish and Mandarin. In the document classification subtask, we were able to achieve F1 scores of 0.8062, 0.6445, 0.7302, 0.5671, 0.6555, 0.7545 and 0.6702 in English, Spanish, Portuguese, Hindi, Urdu, Mandarin and Turkish respectively achieving a rank of 5 in English and 7 on the remaining language tasks.

## The problem

Subtask 1 of CASE 2022 Task 1 is document-level binary classification: given a news article, decide whether it reports a protest event that has happened or is ongoing. Scheduled events, rumours and speculation count as negative. The metric is macro-F1.

The data makes this harder than a standard text classification task. Training data exists only for English (9,324 documents), Spanish (1,000) and Portuguese (1,487), and in each the positive class is a minority (positive ratios of 0.205, 0.131 and 0.132). Hindi, Urdu, Turkish and Mandarin have test sets but no training data at all, so they are a zero-shot setting. A model trained naively would lean toward the negative class and have nothing to learn from for four of the seven languages.

## Approach

**Data augmentation by translation.** We treat the three available datasets as a resource for each other. Positive samples from Spanish and Portuguese are translated into English and added to the English set. The Spanish and Portuguese sets are extended with the full English set and each other's data, translated into the target language. For Hindi, Urdu, Mandarin and Turkish, the final augmented English set is translated into each language to create training data where none existed. Translation used the googletrans library. After augmentation the English, Hindi, Urdu, Mandarin and Turkish sets have 9,652 documents, Spanish 10,521 and Portuguese 10,942, with the positive class now the majority (for example 7,412 positive vs 2,240 negative in the English set).

**Fine-tuning multilingual BERT.** Our classifier is bert-base-multilingual-cased, trained on Wikipedia in 104 languages with a shared 110k WordPiece vocabulary (12 layers, 768 hidden dimensions, 12 heads, 110M parameters). We stack a dropout layer and a dense layer on the [CLS] representation, with a two-neuron sigmoid output and a decision threshold of 0.62 for the positive class.

{% include figure.html path="assets/img/papers/protest-event-detection/fig-model.png" class="img-fluid rounded" zoomable=true caption="The classifier: mBERT encodes the tokenised document, and the [CLS] feature vector passes through dropout and a fully connected layer with sigmoid activation to predict event or no event." %}

**Training details.** Models were built in Keras with HuggingFace transformers and trained on a Google Colab GPU with binary cross-entropy and Adam. We tried learning rates of 1e-5, 3e-5 and 5e-5 and found 3e-5 best, with a maximum length of 512 tokens, batch size 6, dropout 0.2 and 4 epochs.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="English, Spanish and Portuguese protest news corpora are expanded by translating samples across languages and into four zero-shot languages, then multilingual BERT is fine-tuned to classify documents in seven languages.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.75; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    .d1 { animation-delay: 0.4s; } .d2 { animation-delay: 0.8s; } .d3 { animation-delay: 1.2s; } .d4 { animation-delay: 1.6s; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/>
    </marker>
  </defs>
  <!-- corpora -->
  <rect class="n" x="20" y="60" width="170" height="150" rx="10"/>
  <text class="t" x="105" y="86" text-anchor="middle">Training corpora</text>
  <text class="s" x="105" y="110" text-anchor="middle">English 9,324 docs</text>
  <text class="s" x="105" y="128" text-anchor="middle">Spanish 1,000 docs</text>
  <text class="s" x="105" y="146" text-anchor="middle">Portuguese 1,487</text>
  <text class="s" x="105" y="172" text-anchor="middle">positives 13–21%</text>
  <text class="s" x="105" y="190" text-anchor="middle">no HI / UR / ZH / TR</text>
  <!-- augmentation -->
  <rect class="n acc" x="250" y="60" width="200" height="150" rx="10" stroke-width="2"/>
  <text class="t" x="350" y="86" text-anchor="middle">Translation</text>
  <text class="t" x="350" y="104" text-anchor="middle">augmentation</text>
  <text class="s" x="350" y="128" text-anchor="middle">positives shared</text>
  <text class="s" x="350" y="146" text-anchor="middle">across EN / ES / PT</text>
  <text class="s" x="350" y="172" text-anchor="middle">augmented EN →</text>
  <text class="s" x="350" y="190" text-anchor="middle">HI, UR, ZH, TR sets</text>
  <!-- mBERT -->
  <rect class="n" x="510" y="60" width="180" height="150" rx="10"/>
  <text class="t" x="600" y="86" text-anchor="middle">mBERT fine-tuning</text>
  <text class="s" x="600" y="110" text-anchor="middle">bert-base-</text>
  <text class="s" x="600" y="126" text-anchor="middle">multilingual-cased</text>
  <text class="s" x="600" y="150" text-anchor="middle">[CLS] → dropout</text>
  <text class="s" x="600" y="166" text-anchor="middle">→ dense, sigmoid</text>
  <text class="s" x="600" y="190" text-anchor="middle">threshold 0.62</text>
  <!-- output -->
  <rect class="n" x="750" y="60" width="130" height="150" rx="10"/>
  <text class="t" x="815" y="94" text-anchor="middle">Document</text>
  <text class="t" x="815" y="112" text-anchor="middle">classification</text>
  <text class="s" x="815" y="146" text-anchor="middle">protest event</text>
  <text class="s" x="815" y="164" text-anchor="middle">reported?</text>
  <text class="s" x="815" y="190" text-anchor="middle">yes / no</text>
  <!-- flows -->
  <path class="flow" d="M190,135 L248,135" marker-end="url(#ah)"/>
  <path class="flow d1" d="M450,135 L508,135" marker-end="url(#ah)"/>
  <path class="flow d2" d="M690,135 L748,135" marker-end="url(#ah)"/>
  <!-- language chips -->
  <text class="s" x="450" y="250" text-anchor="middle">evaluated on seven test sets, four of them zero-shot</text>
  <g class="pulse"><rect class="n acc" x="88" y="262" width="88" height="30" rx="15"/><text class="t" x="132" y="282" text-anchor="middle">English</text></g>
  <g class="pulse d1"><rect class="n acc" x="192" y="262" width="88" height="30" rx="15"/><text class="t" x="236" y="282" text-anchor="middle">Spanish</text></g>
  <g class="pulse d1"><rect class="n acc" x="296" y="262" width="100" height="30" rx="15"/><text class="t" x="346" y="282" text-anchor="middle">Portuguese</text></g>
  <g class="pulse d2"><rect class="n" x="412" y="262" width="80" height="30" rx="15"/><text class="t" x="452" y="282" text-anchor="middle">Hindi</text></g>
  <g class="pulse d3"><rect class="n" x="508" y="262" width="80" height="30" rx="15"/><text class="t" x="548" y="282" text-anchor="middle">Urdu</text></g>
  <g class="pulse d3"><rect class="n" x="604" y="262" width="96" height="30" rx="15"/><text class="t" x="652" y="282" text-anchor="middle">Mandarin</text></g>
  <g class="pulse d4"><rect class="n" x="716" y="262" width="88" height="30" rx="15"/><text class="t" x="760" y="282" text-anchor="middle">Turkish</text></g>
</svg>
<div class="anim-caption">Positive samples are translated across the English, Spanish and Portuguese corpora, the augmented English set is translated into the four zero-shot languages, and one mBERT classifier is fine-tuned per language to decide whether a document reports a protest event.</div>
</div>

## Example

Two worked examples of the augmentation recipe, with the sizes reported in the paper.

<div class="paper-example" markdown="1">
<span class="ex-label">Input (few-shot language)</span>
<div class="ex-row">Spanish training set as provided: 1,000 documents with a positive ratio of 0.131.</div>
<span class="ex-label">Output (augmented training set)</span>
<div class="ex-row">Original Spanish data + the full English set (both classes) translated into Spanish + Portuguese samples translated into Spanish = <strong>10,521 documents, 8,281 positive and 2,240 negative</strong>. The model fine-tuned on this set scores a macro-F1 of 0.6445 on the 671-document Spanish test set.</div>
</div>

<div class="paper-example" markdown="1">
<span class="ex-label">Input (zero-shot language)</span>
<div class="ex-row">Hindi: a 268-document test set and no training data at all.</div>
<span class="ex-label">Output (augmented training set)</span>
<div class="ex-row">The final augmented English set (9,652 documents: 7,412 positive, 2,240 negative) translated into Hindi with googletrans. The same recipe produces the Urdu, Mandarin and Turkish training sets. The Hindi model scores a macro-F1 of 0.5671; Mandarin, built the same way, reaches 0.7545.</div>
</div>

## Results

Macro-F1 of our system on the CASE 2022 Subtask 1 test sets, alongside the data each model was trained on:

| Language | Original train docs | Train docs after augmentation | Test docs | Macro-F1 | Rank |
|---|---|---|---|---|---|
| English | 9,324 | 9,652 | 3,871 | **0.8062** | 5 |
| Mandarin | none (zero-shot) | 9,652 | 300 | **0.7545** | 7 |
| Portuguese | 1,487 | 10,942 | 671 | **0.7302** | 7 |
| Turkish | none (zero-shot) | 9,652 | 300 | **0.6702** | 7 |
| Urdu | none (zero-shot) | 9,652 | 299 | **0.6555** | 7 |
| Spanish | 1,000 | 10,521 | 671 | **0.6445** | 7 |
| Hindi | none (zero-shot) | 9,652 | 268 | **0.5671** | 7 |

<p class="table-note">Source: Tables 1, 3 and 4 of the paper. Metric is macro-F1 on the official test sets. Higher is better.</p>

- English is the strongest result at 0.8062 macro-F1 (rank 5), consistent with multilingual BERT's strongest contextualisation being in English.
- The zero-shot languages are competitive: Mandarin (0.7545) and Turkish (0.6702) score above Spanish, which has 1,000 native training documents, so translated training data is a workable substitute when none exists.
- A single recipe (translate, fine-tune bert-base-multilingual-cased, threshold at 0.62) covers all seven evaluation languages.

Label distribution of the training sets after augmentation:

| Training set | Negative (label 0) | Positive (label 1) | Total | Positive ratio before augmentation |
|---|---|---|---|---|
| English, Hindi, Urdu, Mandarin, Turkish | 2,240 | 7,412 | 9,652 | 0.205 (English) |
| Spanish | 2,240 | 8,281 | 10,521 | 0.131 |
| Portuguese | 2,240 | 8,702 | 10,942 | 0.132 |

<p class="table-note">Source: Table 3 and Section 3.2 of the paper. Augmentation turns the positive class from a 13 to 21 percent minority into the majority.</p>

## Resources

- Paper on the [ACL Anthology](https://aclanthology.org/2022.case-1.23/) ([PDF](https://aclanthology.org/2022.case-1.23.pdf), [video presentation](https://aclanthology.org/2022.case-1.23.mp4))
- Shared task data and details: [CASE 2022 Task 1, Multilingual Protest News Detection](https://github.com/emerging-welfare/case-2022-multilingual-event)
- Model: [bert-base-multilingual-cased](https://huggingface.co/bert-base-multilingual-cased) on Hugging Face
- Related: class weighting for imbalanced text classification in my [SemEval-2022 PCL detection paper](/papers/pcl-detection/)
- Related: translation-based augmentation for tweet classification in my [CheckThat! 2022 paper](/papers/claim-detection-tweets/)
- More of my work on [the publications page](/publications/)
