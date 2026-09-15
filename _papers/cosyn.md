---
layout: paper
title: "CoSyn: Detecting Implicit Hate Speech in Online Conversations Using a Context Synergized Hyperbolic Network"
short_title: "CoSyn"
description: "EMNLP 2023: CoSyn detects implicit hate speech by fusing user history, social graph, and conversation context in hyperbolic space (+1.24-57.8% over baselines)."
bibkey: ghosh2023cosyn
authors:
  - name: Sreyan Ghosh
    url: https://sreyan88.github.io/
    equal: true
  - name: Manan Suri
    url: /
    me: true
    equal: true
  - name: Purva Chiniya
    equal: true
  - name: Utkarsh Tyagi
    equal: true
  - name: Sonal Kumar
    equal: true
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park; MIDAS Labs, IIIT-Delhi"
venue: "Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing (EMNLP 2023, Main)"
venue_short: "EMNLP 2023"
year: 2023
date: 2023-03-02
arxiv: "2303.03387"
pdf: https://aclanthology.org/2023.emnlp-main.377.pdf
publisher_url: https://aclanthology.org/2023.emnlp-main.377/
publisher_label: "ACL Anthology"
code: https://github.com/MananSuri27/CoSyn
figure: /assets/img/papers/cosyn/hero.png
figure_alt: "CoSyn architecture: a bias-invariant encoder feeds historical user utterances into the Hyperbolic Fourier Attention Network, a social graph into a Hyperbolic Graph Convolutional Network, and conversation-tree utterances into a Context-Synergized Hyperbolic Tree-LSTM that predicts whether hate speech is present."
figure_caption: "CoSyn. A user's historical utterances pass through the Hyperbolic Fourier Attention Network (HFAN), the social graph between users is modeled by a Hyperbolic Graph Convolutional Network (HGCN), and the Context-Synergized Hyperbolic Tree-LSTM (CSHT) combines the resulting user context with the conversation tree to classify the target utterance."
tldr: "Implicit hate in replies and comments often only reads as hate once you know who wrote it and what it responds to. CoSyn encodes a user's history, their social graph, and the conversation tree in hyperbolic space and fuses them with a context-synergized Tree-LSTM, beating all baselines on 6 conversational hate speech datasets by 1.24-57.8% absolute."
highlights:
  - value: "1.24-57.8%"
    label: "absolute improvement over baselines"
  - value: "6"
    label: "conversational hate speech datasets"
  - value: "3.8%"
    label: "F1 lost when moving to Euclidean space"
  - value: "70.23"
    label: "average micro-F1 across datasets"
og_image: https://manansuri.com/assets/img/papers/cosyn/hero.png
---

## Abstract

The tremendous growth of social media users interacting in online conversations has led to significant growth in hate speech affecting people from various demographics. Most of the prior works focus on detecting explicit hate speech, which is overt and leverages hateful phrases, with very little work focusing on detecting hate speech that is implicit or denotes hatred through indirect or coded language. In this paper, we present CoSyn, a context synergized neural network that explicitly incorporates user- and conversational-context for detecting implicit hate speech in online conversations. CoSyn introduces novel ways to encode these external contexts and employs a novel context interaction mechanism that clearly captures the interplay between them, making independent assessments of the amounts of information to be retrieved from these noisy contexts. Additionally, it carries out all these operations in the hyperbolic space to account for the scale-free dynamics of social media. We demonstrate the effectiveness of CoSyn on 6 hate speech datasets and show that CoSyn outperforms all our baselines in detecting implicit hate speech with absolute improvements in the range of 1.24% - 57.8%. We make our code available.

## The problem

Most hate speech detectors are built for explicit hate: overt slurs and hateful phrases that keyword-based systems and text classifiers can pick up. Implicit hate is delivered through sarcasm, euphemism, stereotypes, and coded language, and it has been used by extremist groups precisely because it evades such filters while preserving deniability.

In online conversations the problem gets harder. Replies and comments are short reactions to a parent post and carry little linguistic signal of their own. The example in the paper is a factual statement about a location, followed by a sarcastic reply that only reads as hateful in context. Prior work, including the Latent Hatred benchmark and knowledge-graph based classifiers, treats utterances in isolation and ignores conversational context, even though it accounts for a large share of implicit hate online. We extend the definition of implicit hate speech to cover utterances that convey hate only in the context of the dialogue, and build a model for it.

## Approach

CoSyn classifies whether a target utterance in a conversation tree implies hate, using two external contexts: the author's personal context (historical and social) and the conversational context. It has four components, and everything after the encoder runs in hyperbolic space because both social graphs and conversation trees are scale-free (power-law degree distributions and low hyperbolicity, measured across the datasets).

- **Bias-invariant encoder.** A SentenceBERT encoder is fine-tuned with an additional loss over self-attention maps and ground-truth hate spans, which reduces keyword bias, a long-standing problem in hate speech classification.
- **Hyperbolic Fourier Attention Network (HFAN).** A user's past utterances are encoded, passed through a 2D Discrete Fourier Transform (over time and embedding dimensions) to surface recurring ideologies and opinions, then through a Hyperbolic GRU and Hyperbolic Attention with an Einstein midpoint to produce a historical user representation.
- **Hyperbolic Graph Convolutional Network (HGCN).** Users are nodes in a social graph with retweet, mention, reply, and follow edges. HGCN aggregates neighbours' HFAN representations in the Poincare ball so a user's embedding also reflects their community.
- **Context-Synergized Hyperbolic Tree-LSTM (CSHT).** A bidirectional Tree-LSTM in hyperbolic space walks the conversation tree. Its cell takes both the utterance and the author's user context as inputs and uses separate gates to decide independently how much to take from each noisy source, then a dense layer and binary cross-entropy produce the prediction.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CoSyn pipeline: the target comment, its conversation tree, the author's past posts and the social graph are encoded; HFAN and HGCN build the user context in hyperbolic space and the context-synergized Tree-LSTM fuses it with the conversation to predict implicit hate.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.75; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
  </style>
  <!-- inputs -->
  <rect class="n" x="15" y="20" width="150" height="60" rx="10"/>
  <text class="t" x="90" y="45" text-anchor="middle" font-weight="600">User history</text>
  <text class="s" x="90" y="65" text-anchor="middle">last 100 posts</text>
  <rect class="n" x="15" y="130" width="150" height="60" rx="10"/>
  <text class="t" x="90" y="155" text-anchor="middle" font-weight="600">Social graph</text>
  <text class="s" x="90" y="175" text-anchor="middle">retweet, reply, follow</text>
  <rect class="n" x="15" y="240" width="150" height="60" rx="10"/>
  <text class="t" x="90" y="265" text-anchor="middle" font-weight="600">Conversation</text>
  <text class="s" x="90" y="285" text-anchor="middle">tree + target comment</text>
  <!-- encoder -->
  <path class="flow" d="M165 50 H210"/>
  <path class="flow" d="M165 160 H210" style="animation-delay:.2s"/>
  <path class="flow" d="M165 270 H210" style="animation-delay:.4s"/>
  <rect class="n acc" x="215" y="20" width="110" height="280" rx="10"/>
  <text class="t" x="270" y="150" text-anchor="middle" font-weight="600">Encoder</text>
  <text class="s" x="270" y="170" text-anchor="middle">SentenceBERT</text>
  <text class="s" x="270" y="188" text-anchor="middle">bias-invariant</text>
  <!-- hyperbolic region -->
  <rect class="n" x="360" y="10" width="370" height="300" rx="14" stroke-dasharray="4 4"/>
  <text class="s" x="545" y="30" text-anchor="middle">Hyperbolic space (Poincare ball)</text>
  <path class="flow" d="M325 60 H375" style="animation-delay:.5s"/>
  <path class="flow" d="M325 160 H375" style="animation-delay:.7s"/>
  <path class="flow" d="M325 260 H575" style="animation-delay:.9s"/>
  <!-- HFAN -->
  <rect class="n acc" x="380" y="40" width="140" height="70" rx="10"/>
  <text class="t" x="450" y="63" text-anchor="middle" font-weight="600">HFAN</text>
  <text class="s" x="450" y="81" text-anchor="middle">2D Fourier + hyp. GRU</text>
  <text class="s" x="450" y="97" text-anchor="middle">+ hyp. attention</text>
  <!-- HGCN -->
  <rect class="n acc" x="380" y="140" width="140" height="70" rx="10"/>
  <text class="t" x="450" y="163" text-anchor="middle" font-weight="600">HGCN</text>
  <text class="s" x="450" y="181" text-anchor="middle">aggregate neighbours'</text>
  <text class="s" x="450" y="197" text-anchor="middle">HFAN embeddings</text>
  <g class="pulse">
    <circle class="n" cx="545" cy="150" r="5"/><circle class="n" cx="565" cy="135" r="5"/><circle class="n" cx="565" cy="165" r="5"/><circle class="n" cx="585" cy="150" r="5"/>
    <path class="n" d="M550 148 L560 138 M550 152 L560 163 M570 138 L580 148 M570 163 L580 152"/>
  </g>
  <path class="flow" d="M450 110 V140" style="animation-delay:.8s"/>
  <path class="flow" d="M520 175 H560 V225" style="animation-delay:1s"/>
  <!-- CSHT -->
  <rect class="n acc" x="580" y="230" width="140" height="70" rx="10"/>
  <text class="t" x="650" y="253" text-anchor="middle" font-weight="600">CSHT</text>
  <text class="s" x="650" y="271" text-anchor="middle">hyperbolic Tree-LSTM,</text>
  <text class="s" x="650" y="287" text-anchor="middle">separate gates per context</text>
  <text class="s" x="640" y="215" text-anchor="middle">user context</text>
  <!-- output -->
  <path class="flow" d="M720 265 H760" style="animation-delay:1.2s"/>
  <rect class="n" x="765" y="235" width="125" height="60" rx="10"/>
  <text class="t" x="827" y="259" text-anchor="middle" font-weight="600">Hate / not</text>
  <text class="s" x="827" y="279" text-anchor="middle">implicit included</text>
</svg>
<div class="anim-caption">The target comment, its conversation tree, the author's recent posts, and the social graph are encoded once; HFAN and HGCN turn history and neighbours into a hyperbolic user context, and CSHT walks the conversation tree with separate gates for the utterance and the user before predicting hate.</div>
</div>

## Example

One of the four ICHCL test conversation trees from Figure 4 of the paper. Locations appear anonymised as #LOC. The comment carries no hateful keyword and only reads as hostile in the context of the parent post and the author's history.

<div class="paper-example" markdown="1">
<span class="ex-label">Input: conversation tree</span>
<div class="ex-row" markdown="1">

- **User 7 (parent post):** At the high-level meeting, key decisions of waiving customs duty on oxygen and oxygen related equipment; COVID-19 vaccines were taken.
- **User 8 (comment, target):** High level meeting was the excuse I made in college events I was organizing, when there was a problem
- **User 9 (reply):** Thank you #LOC f\*\*\*\* sake. About time. #LOC needs to learn from this and be well prepared for these types of events.

</div>
<span class="ex-label">Output: prediction for the comment by User 8 (gold: implicit hate)</span>
<div class="ex-row" markdown="1">

- SentenceBERT with classification head: <span class="ex-bad">wrong</span>
- CoSyn without user context: <span class="ex-bad">wrong</span>
- CoSyn: <span class="ex-good">hateful (correct)</span>

</div>
<span class="ex-label">Output: prediction for the reply by User 9 (gold: explicit hate)</span>
<div class="ex-row" markdown="1">

- SentenceBERT with classification head: <span class="ex-bad">wrong</span>
- CoSyn without user context: <span class="ex-good">correct</span>
- CoSyn: <span class="ex-good">hateful (correct)</span>

</div>
</div>

{% include figure.html path="assets/img/papers/cosyn/ex-thread.png" class="img-fluid rounded" zoomable=true caption="Figure 1 of the paper: a factual parent post followed by two replies that only read as hateful in context." %}

{% include figure.html path="assets/img/papers/cosyn/ex-trees.png" class="img-fluid rounded" zoomable=true caption="Figure 4 of the paper: four ICHCL conversation trees with the predictions of SentenceBERT (1), CoSyn without user context (2), and CoSyn (3), the historical hateful engagement of each author (colour bar), and the social relations between authors (centre). I marks implicit and E explicit hate." %}

## Results

We evaluate on six conversational hate speech datasets (Reddit, GAB, DIALOCONAN, CAD, ICHCL, and Latent Hatred), reporting micro-F1 averaged over 3 seeds. Because the original datasets do not mark implicit versus explicit hate, we added MTurk annotations (three workers per utterance, with complete conversations shown) to evaluate an implicit subset.

<div class="table-responsive" markdown="1">

| Overall F1 | Reddit | CAD | DIALOCONAN | GAB | ICHCL | Latent Hatred |
|---|---|---|---|---|---|---|
| SentenceBERT | 71.12 | 46.89 | 46.23 | 50.31 | 79.86 | 58.82 |
| DUCK | 60.10 | 30.66 | 28.60 | 62.78 | 78.36 | 56.00 |
| MRIL | 58.91 | 34.41 | 40.82 | 61.21 | 66.71 | 57.32 |
| Madhu et al. | 70.58 | 50.47 | 46.45 | 52.94 | 82.01 | 59.52 |
| **CoSyn (ours)** | **76.23** | **73.26** | **51.02** | **66.71** | **89.53** | **64.65** |

</div>

<p class="table-note">Source: Table 1 of the paper, overall micro-F1 on the full test sets; four of the thirteen baselines shown. Higher is better.</p>

<div class="table-responsive" markdown="1">

| Implicit-subset F1 | Reddit | CAD | DIALOCONAN | GAB | ICHCL | Latent Hatred |
|---|---|---|---|---|---|---|
| SentenceBERT | 76.05 | 49.01 | 34.75 | 40.03 | 37.32 | 38.46 |
| Graph NLI | 26.03 | 47.40 | 24.11 | 42.12 | 26.53 | 48.25 |
| FinerFact | 27.11 | 26.25 | 15.60 | 18.50 | 32.27 | 52.04 |
| Madhu et al. | 76.79 | 51.77 | 36.96 | 41.15 | 39.56 | 40.72 |
| **CoSyn (ours)** | **81.12** | **57.59** | **52.98** | **45.00** | **46.03** | **53.28** |

</div>

<p class="table-note">Source: Table 1 of the paper, micro-F1 on the MTurk-annotated implicit subsets. Higher is better.</p>

| Ablation (average over 6 datasets) | Overall F1 | Implicit F1 | Comment F1 | Reply F1 |
|---|---|---|---|---|
| **CoSyn (ours)** | **70.23** | **56.00** | **46.73** | **49.32** |
| without DFT | 67.54 | 54.52 | 45.22 | 46.92 |
| without HFAN | 66.62 | 54.68 | 45.44 | 47.04 |
| without HGCN | 66.56 | 53.28 | 45.12 | 46.32 |
| without HFAN and HGCN | 65.29 | 52.14 | 42.91 | 46.29 |
| without user context | 62.31 | 48.72 | 39.88 | 41.19 |
| bidirectional to unidirectional CSHT | 68.67 | 55.29 | 46.09 | 47.53 |
| hyperbolic to Euclidean | 66.47 | 54.83 | 45.44 | 47.41 |

<p class="table-note">Source: Table 2 of the paper. Higher is better.</p>

- CoSyn outperforms every baseline on both the full datasets and the implicit subsets, including the bias-invariant SentenceBERT baseline, which was the strongest competitor.
- Full-dataset absolute improvements over baselines: 5.1-35.2% on Reddit, 4.0-45.0% on CAD, 4.8-22.4% on DIALOCONAN, 3.9-42.7% on GAB, 9.7-38.4% on ICHCL, and 5.8-31.6% on Latent Hatred; on the implicit subsets, 5.1-57.9%, 8.6-31.3%, 18.2-40.7%, 2.9-28.5%, 8.2-19.5%, and 1.2-18.1% respectively.
- User context is the largest single contributor: removing it drops overall F1 from 70.23 to 62.31, and modelling it with HFAN and HGCN beats feeding mean-pooled history embeddings into CSHT. Replacing hyperbolic with Euclidean operations costs 3.8% F1.
- CoSyn has high precision on implicit hate, meaning fewer false positives than the baselines. The ICHCL trees in Figure 4 show that hateful users are strongly homophilous and consistently hateful over time, which is exactly the signal HFAN and HGCN capture.

### Datasets

| Dataset | Train convs. | Val convs. | Test convs. | Implicit (train) | Explicit (train) |
|---|---|---|---|---|---|
| Reddit | 13,382 | 4,461 | 4,461 | 1,160 | 905 |
| Latent Hatred | 12,485 | 4,162 | 4,162 | 3,246 | 590 |
| CAD | 13,584 | 4,526 | 5,307 | 1,004 | 1,507 |
| GAB | 18,300 | 6,100 | 6,100 | 2,435 | 3,653 |
| DIALOCONAN | 11,675 | 2,436 | 2,514 | 1,575 | 4,262 |
| ICHCL | 4,643 | 1,348 | 1,097 | 1,006 | 1,383 |

<p class="table-note">Source: Tables 3-8 of the paper. Implicit and explicit counts are the MTurk annotations on the hateful training utterances.</p>

## Resources

- Paper: [ACL Anthology](https://aclanthology.org/2023.emnlp-main.377/) · [arXiv:2303.03387](https://arxiv.org/abs/2303.03387) · [Hugging Face papers](https://huggingface.co/papers/2303.03387)
- Code: [github.com/MananSuri27/CoSyn](https://github.com/MananSuri27/CoSyn) (mirror at [github.com/Sreyan88/CoSyn](https://github.com/Sreyan88/CoSyn))
- Related: [ACLM](/papers/aclm/), our ACL 2023 work on data augmentation for complex NER
- [All publications](/publications/)

### Quick start

From the repository README (torch 1.11.0, geoopt 0.1.0, dgl 1.0.0):

```bash
git clone https://github.com/MananSuri27/CoSyn
cd CoSyn
pip3 install -r requirements.txt
# move the hyperbolic graph convolution into dgl
mv CoSyn/models/hgconv.py path-to-dgl/dgl/python/dgl/nn/pytorch/conv/
# build conversation trees and the social graph, then train
python3 utils/graphs.py
python3 utils/socialgraph.py
python3 main.py
```
