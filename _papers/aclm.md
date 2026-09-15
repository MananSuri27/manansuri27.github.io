---
layout: paper
title: "ACLM: A Selective-Denoising based Generative Data Augmentation Approach for Low-Resource Complex NER"
short_title: "ACLM"
description: "ACL 2023: ACLM augments low-resource complex NER by fine-tuning BART on attention-guided selective masking, beating neural baselines by 1-36% F1."
bibkey: ghosh-etal-2023-aclm
authors:
  - name: Sreyan Ghosh
    url: https://sreyan88.github.io/
  - name: Utkarsh Tyagi
  - name: Manan Suri
    url: /
    me: true
  - name: Sonal Kumar
  - name: S Ramaneswaran
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park; Netaji Subhas University of Technology; NVIDIA"
venue: "Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (ACL 2023, Long Papers)"
venue_short: "ACL 2023"
year: 2023
date: 2023-06-01
arxiv: "2306.00928"
pdf: https://aclanthology.org/2023.acl-long.8.pdf
publisher_url: https://aclanthology.org/2023.acl-long.8/
publisher_label: "ACL Anthology"
code: https://github.com/Sreyan88/ACLM
figure: /assets/img/papers/aclm/hero.png
figure_alt: "Overview of ACLM: keyword selection from a fine-tuned NER model's attention map, selective masking, labelled sequence linearization, dynamic masking, and mixner template mixing feed a BART model that is fine-tuned on text reconstruction and then generates augmented sentences."
figure_caption: "Overview of ACLM. A sentence is turned into a template in four steps (keyword selection from attention maps, selective masking, labelled sequence linearization, dynamic masking). ACLM is fine-tuned to reconstruct the original sentence from the template, then generates new augmentations from fresh templates; mixner concatenates templates of semantically similar sentences for extra diversity."
tldr: "Existing NER data augmentation places complex named entities in the wrong context and produces incoherent sentences. ACLM keeps the entities and the keywords they attend to, masks everything else, and fine-tunes BART to fill the gaps, improving low-resource complex NER by 1-36% absolute over neural baselines across monolingual, cross-lingual, and multilingual settings."
highlights:
  - value: "1-36%"
    label: "absolute F1 gain over neural baselines"
  - value: "10"
    label: "languages evaluated on MultiCoNER"
  - value: "4"
    label: "extra domains (news, biomedical, science)"
  - value: "Lowest"
    label: "perplexity among compared augmenters"
og_image: https://manansuri.com/assets/img/papers/aclm/hero.png
---

## Abstract

Complex Named Entity Recognition (NER) is the task of detecting linguistically complex named entities in low-context text. In this paper, we present ACLM (Attention-map aware keyword selection for Conditional Language Model fine-tuning), a novel data augmentation approach, based on conditional generation, to address the data scarcity problem in low-resource complex NER. ACLM alleviates the context-entity mismatch issue, a problem existing NER data augmentation techniques suffer from and often generates incoherent augmentations by placing complex named entities in the wrong context. ACLM builds on BART and is optimized on a novel text reconstruction or denoising task: we use selective masking (aided by attention maps) to retain the named entities and certain keywords in the input sentence that provide contextually relevant additional knowledge or hints about the named entities. Compared with other data augmentation strategies, ACLM can generate more diverse and coherent augmentations preserving the true word sense of complex entities in the sentence. We demonstrate the effectiveness of ACLM both qualitatively and quantitatively on monolingual, cross-lingual, and multilingual complex NER across various low-resource settings. ACLM outperforms all our neural baselines by a significant margin (1%-36%). In addition, we demonstrate the application of ACLM to other domains that suffer from data scarcity (e.g., biomedical). In practice, ACLM generates more effective and factual augmentations for these domains than prior methods.

## The problem

Standard NER benchmarks such as CoNLL 2003 test "easy" proper-name entities in well-formed news text. Complex NER benchmarks like MultiCoNER instead contain short, low-context sentences with emerging and semantically ambiguous entities (movie titles in comments, product names, political groups). We found that a state-of-the-art NER model drops by 23% when moved from CoNLL 2003 to MultiCoNER, and by 31.8% in a low-resource setting with only 500 training samples.

Data augmentation is the usual remedy for scarce labels, but existing NER augmenters break down on complex entities. Swapping entities between sentences or replacing them with synonyms leads to context-entity mismatch (the name of a book dropped into a sentence about a movie), and fine-tuned language models struggle to invent new context around entities they have never seen. The resulting incoherent or non-factual augmentations hurt learning, especially in knowledge-sensitive domains such as biomedical NER.

## Approach

ACLM reframes augmentation as conditional generation: keep the entities, keep the few words that explain them, and ask a denoising model to rewrite everything else. A sentence becomes a template through a four-step process:

- **Keyword selection.** A XLM-RoBERTa NER model fine-tuned only on gold data provides attention maps. Summing attention over the last four layers, we pick the top p% of non-entity tokens that the entities attend to most, ignoring punctuation, stop words, and other entities.
- **Selective masking.** Every non-entity token outside the keyword set is replaced by a mask token, and contiguous masks are collapsed.
- **Labelled sequence linearization.** Label tokens are inserted before and after each entity so the model sees entity types and boundaries during fine-tuning and generation.
- **Dynamic masking.** At every training and generation round, a masking rate sampled from a Gaussian hides a small, random subset of the keywords, which increases context and length diversity.

ACLM is built on mBART-50-large and fine-tuned to reconstruct the original sentence from its template, a selective version of the denoising objective BART is pre-trained on. At generation time, each training sentence is corrupted R times to produce R augmentations, with top-k sampling and beam search for diversity. Post-processing removes augmentations that are too similar to the original sentence and strips the label tokens, and the augmented data is concatenated with the gold data to fine-tune the NER model.

**mixner** adds a second source of diversity: during generation, the template of a sentence is concatenated with the template of a semantically similar sentence (retrieved with multilingual Sentence-BERT), so ACLM produces sentences that combine context and entities from both.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ACLM pipeline: a labelled sentence goes through attention-based keyword selection and selective masking to form a template, optionally mixed with a similar template by mixner, then mBART generates new augmentations that are added to the NER training data.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.75; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    .fade2 { animation: fade 4s ease-in-out infinite; animation-delay: -2s; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <!-- 1 sentence -->
  <rect class="n" x="15" y="110" width="140" height="100" rx="10"/>
  <text class="t" x="85" y="140" text-anchor="middle" font-weight="600">Gold sentence</text>
  <text class="s" x="85" y="162" text-anchor="middle">entities + labels</text>
  <text class="s" x="85" y="180" text-anchor="middle">low context</text>
  <path class="flow" d="M155 160 H190"/>
  <!-- 2 keyword selection -->
  <rect class="n acc" x="195" y="95" width="150" height="130" rx="10"/>
  <text class="t" x="270" y="122" text-anchor="middle" font-weight="600">1. Keywords</text>
  <text class="s" x="270" y="144" text-anchor="middle">attention map of</text>
  <text class="s" x="270" y="162" text-anchor="middle">fine-tuned NER</text>
  <text class="s" x="270" y="180" text-anchor="middle">model: top p% of</text>
  <text class="s" x="270" y="198" text-anchor="middle">non-entity tokens</text>
  <g class="pulse">
    <rect class="n" x="230" y="30" width="12" height="12"/><rect x="246" y="30" width="12" height="12" style="fill:#B509AC;opacity:.7"/><rect class="n" x="262" y="30" width="12" height="12"/><rect x="278" y="30" width="12" height="12" style="fill:#B509AC;opacity:.7"/><rect class="n" x="294" y="30" width="12" height="12"/>
    <rect x="230" y="46" width="12" height="12" style="fill:#B509AC;opacity:.7"/><rect class="n" x="246" y="46" width="12" height="12"/><rect class="n" x="262" y="46" width="12" height="12"/><rect class="n" x="278" y="46" width="12" height="12"/><rect x="294" y="46" width="12" height="12" style="fill:#B509AC;opacity:.7"/>
  </g>
  <text class="s" x="270" y="78" text-anchor="middle">attention map</text>
  <path class="flow" d="M345 160 H380" style="animation-delay:.3s"/>
  <!-- 3 masking -->
  <rect class="n acc" x="385" y="95" width="150" height="130" rx="10"/>
  <text class="t" x="460" y="122" text-anchor="middle" font-weight="600">2. Template</text>
  <text class="s" x="460" y="144" text-anchor="middle">mask all other</text>
  <text class="s" x="460" y="162" text-anchor="middle">tokens, add label</text>
  <text class="s" x="460" y="180" text-anchor="middle">tokens, dynamic</text>
  <text class="s" x="460" y="198" text-anchor="middle">keyword masking</text>
  <g class="fade1"><rect class="n" x="395" y="245" width="130" height="20" rx="4"/><text class="s" x="460" y="259" text-anchor="middle">[M] enemy [M] guns</text></g>
  <g class="fade2"><rect class="n" x="395" y="270" width="130" height="20" rx="4"/><text class="s" x="460" y="284" text-anchor="middle">+ mixner template</text></g>
  <path class="flow" d="M535 160 H570" style="animation-delay:.6s"/>
  <!-- 4 mBART -->
  <rect class="n acc" x="575" y="95" width="150" height="130" rx="10"/>
  <text class="t" x="650" y="122" text-anchor="middle" font-weight="600">3. mBART-50</text>
  <text class="s" x="650" y="144" text-anchor="middle">fine-tuned to</text>
  <text class="s" x="650" y="162" text-anchor="middle">reconstruct the</text>
  <text class="s" x="650" y="180" text-anchor="middle">sentence, then</text>
  <text class="s" x="650" y="198" text-anchor="middle">generates R = 5</text>
  <text class="s" x="650" y="250" text-anchor="middle">top-k sampling</text>
  <text class="s" x="650" y="268" text-anchor="middle">+ beam search</text>
  <path class="flow" d="M725 160 H760" style="animation-delay:.9s"/>
  <!-- 5 augmented data -->
  <rect class="n" x="765" y="110" width="125" height="100" rx="10"/>
  <text class="t" x="827" y="140" text-anchor="middle" font-weight="600">Augmented</text>
  <text class="t" x="827" y="158" text-anchor="middle" font-weight="600">NER data</text>
  <text class="s" x="827" y="180" text-anchor="middle">gold + generated</text>
  <text class="s" x="827" y="198" text-anchor="middle">fine-tune NER</text>
</svg>
<div class="anim-caption">A gold sentence is reduced to its entities plus the keywords they attend to, everything else is masked, and mBART-50 is fine-tuned to fill the gaps; at generation time the same templates (optionally mixed with a similar sentence's template by mixner) yield new, coherent training sentences.</div>
</div>

## Example

The worked example from Figure 1 of the paper (MultiCoNER, English). Keywords selected from the attention map are *enemy, infantry, retired, swarmed, hidden ground, attack*; the only entity is *royal artillery* (GRP).

<div class="paper-example" markdown="1">
<span class="ex-label">Input: gold sentence</span>
<div class="ex-row" markdown="1">
he advanced, attacked the enemy's infantry with the lance, and then retired while the enemy swarmed out of hidden ground where [royal artillery]<sub>GRP</sub> guns could attack them.
</div>
<span class="ex-label">Template after selective masking and labelled sequence linearization</span>
<div class="ex-row" markdown="1">

```text
[M] enemy [M] infantry [M] retired [M] enemy swarmed [M] hidden ground [M]
<b-grp> royal <b-grp> <i-grp> artillery <i-grp> guns [M] attack [M]
```

</div>
<span class="ex-label">Template after dynamic masking (a few keywords dropped)</span>
<div class="ex-row" markdown="1">

```text
[M] enemy [M] infantry [M] swarmed [M] hidden ground [M]
<b-grp> royal <b-grp> <i-grp> artillery <i-grp> guns [M]
```

</div>
<span class="ex-label">Output: generated augmentations</span>
<div class="ex-row" markdown="1">

- <span class="ex-good">the enemy's infantry was attacked by [royal artillery]<sub>GRP</sub> guns.</span>
- <span class="ex-good">the enemy's infantry was swarmed to the ground with [royal artillery]<sub>GRP</sub> guns.</span>
- With mixner (template joined with that of the similar sentence "ashby was wounded in the right foot during one of three raids into [kentucky]<sub>LOC</sub> made by his regiment during 1862."): <span class="ex-good">ashby conducted raids across the line from [kentucky]<sub>LOC</sub> and the enemy were attacked and later retired by hidden ground [royal artillery]<sub>GRP</sub> guns.</span>

</div>
</div>

A second example from Figure 3 compares augmenters on a sentence about a game studio, where entity swapping and random word replacement break either coherence or factuality:

<div class="paper-example" markdown="1">
<span class="ex-label">Input: original sentence</span>
<div class="ex-row" markdown="1">
it was developed by a team led by former [blizzard entertainment]<sub>CORP</sub> employees, some of whom had overseen the creation of the [diablo]<sub>CW</sub> series.
</div>
<span class="ex-label">Output: augmentations by method</span>
<div class="ex-row" markdown="1">

- **LwTR:** <span class="ex-bad">it was developed by a makers led by, [blizzard entertainment]<sub>CORP</sub> ., some of whom had elevation the serving of the [diablo]<sub>CW</sub> 12th.</span> (random word replacement makes the sentence incoherent)
- **MELM:** <span class="ex-bad">it was developed by a team led by former [blizzago games]<sub>CORP</sub> employees, some of whom had overseen the creation of the [hablo]<sub>CW</sub> series.</span> (coherent, but the new entities do not exist)
- **ACLM:** <span class="ex-good">[blizzard entertainment]<sub>CORP</sub> employees have overseen the production of the animated films, including the production of the [diablo]<sub>CW</sub> series.</span>
- **ACLM + mixner:** <span class="ex-good">the team of the [blizzard entertainment]<sub>CORP</sub> had overseen the creation of the game [diablo]<sub>CW</sub> and many of its workers founded [pyro studios]<sub>CORP</sub> in the early 1960s.</span>

</div>
</div>

{% include figure.html path="assets/img/papers/aclm/ex-augmentations.png" class="img-fluid rounded" zoomable=true caption="Figure 3 of the paper: augmentations from LwTR, MELM, ACLM, and ACLM with mixner on a MultiCoNER sentence (top) and an NCBI Disease sentence (bottom), with the explanation of what each method gets right or wrong." %}

## Results

All experiments use MultiCoNER across 10 languages (English, Bengali, Hindi, German, Spanish, Korean, Dutch, Russian, Turkish, Chinese) with 100, 200, 500, and 1000 gold training sentences, reporting micro-F1 averaged over 3 seeds. Baselines include Gold-Only, LwTR, DAGA, MulDA, and MELM.

| Monolingual, average over 10 languages | 100 gold | 200 gold | 500 gold | 1000 gold |
|---|---|---|---|---|
| Gold-only | 24.97 | 38.06 | 45.86 | 44.40 |
| LwTR | 36.68 | 40.98 | 47.07 | 51.19 |
| DAGA | 16.51 | 28.20 | 35.60 | 42.68 |
| MELM | 30.51 | 36.24 | 41.51 | 44.00 |
| **ACLM (ours)** | **39.47** | **45.74** | **49.72** | **53.74** |

<p class="table-note">Source: Table 1 of the paper (Avg column). Micro-F1 on the MultiCoNER test sets, averaged over the 10 languages and 3 seeds. Higher is better.</p>

| Cross-lingual, English source | En to Hi | En to Bn | En to De | En to Zh | Avg |
|---|---|---|---|---|---|
| Gold-only (500) | 35.93 | 25.64 | 50.13 | 7.23 | 29.73 |
| LwTR (500) | 43.14 | 34.60 | 51.61 | 11.40 | 35.19 |
| MELM (500) | 34.97 | 27.17 | 44.31 | 7.31 | 28.44 |
| **ACLM (500)** | **44.36** | **35.59** | **54.04** | **16.27** | **37.57** |

<p class="table-note">Source: Table 1 of the paper (right half), 500 gold English sentences, zero-shot evaluation on the target language. Higher is better.</p>

| Other domains, 500 gold | CoNLL 2003 | BC2GM | NCBI Disease | TDMSci | Avg |
|---|---|---|---|---|---|
| Gold-Only | 84.82 | 55.56 | 75.75 | 47.04 | 65.79 |
| LwTR | 85.08 | 60.46 | 78.97 | 60.74 | 71.31 |
| DAGA | 81.82 | 51.23 | 78.09 | 57.66 | 67.20 |
| MELM | 83.51 | 56.83 | 75.11 | 57.80 | 68.31 |
| **ACLM (ours)** | **84.26** | **62.37** | **80.57** | **61.77** | **72.24** |

<p class="table-note">Source: Table 4 of the paper. F1 on news (CoNLL 2003), biomedical (BC2GM, NCBI Disease), and science (TDMSci) NER with 500 gold sentences. Higher is better.</p>

- **Monolingual complex NER:** ACLM achieves the best result in every language and every low-resource setting, with absolute gains of 1.5%-22% over the neural baselines MELM and DAGA.
- **Multilingual complex NER:** in the combined 10-language setting ACLM averages 51.40 / 53.45 / 55.90 / 58.27 F1 at 100 / 200 / 500 / 1000 sentences per language, versus 46.86 / 51.42 / 53.66 / 57.78 for Gold-Only (Table 2).
- **Generation quality:** at 500 gold sentences ACLM has the lowest GPT-2 perplexity of the compared augmenters (57.68 vs. 82.31 for MELM and 129.35 for LwTR) and the highest non-entity diversity (41.16 vs. 0.0 and 16.22) and length diversity (5.82 vs. 0.0 and 0.0) (Table 3).
- **Other domains:** ACLM has the best average F1 at both 200 (67.93) and 500 (72.24) gold sentences, and the best score on every dataset except CoNLL 2003 at 500, where LwTR leads.

### MultiCoNER at a glance

| Sentences | English | Hindi | Bengali | Chinese | Multi (11 languages) |
|---|---|---|---|---|---|
| Train | 15,300 | 15,300 | 15,300 | 15,300 | 168,300 |
| Dev | 800 | 800 | 800 | 800 | 8,800 |
| Test | 217,818 | 141,565 | 133,119 | 151,661 | 471,911 |

<p class="table-note">Source: Table 12 of the paper. Six entity classes: PER, LOC, GRP, CORP, CW (creative work), PROD. The low-resource experiments sample 100-1000 sentences from each training split.</p>

## Resources

- Paper: [ACL Anthology](https://aclanthology.org/2023.acl-long.8/) · [arXiv:2306.00928](https://arxiv.org/abs/2306.00928) · [Hugging Face papers](https://huggingface.co/papers/2306.00928)
- Code: [github.com/Sreyan88/ACLM](https://github.com/Sreyan88/ACLM)
- Dataset: [MultiCoNER](https://multiconer.github.io/) (Malmasi et al., 2022)
- Related: [CoSyn](/papers/cosyn/), a companion project from the same group on implicit hate speech
- [All publications](/publications/)

### Quick start

From the repository README: install the requirements, then run the training script with the language, dataset size, seed, masking rate, and number of generations.

```bash
pip install -r requirements.txt
cd ./src
# sh train_dynamic_multilingual.sh <language> <language label> <size of dataset> <flair batch size> <seed> <masking rate> <number of generations>
sh train_dynamic_multilingual.sh zh zh_CN 100 8 42 0.3 5
# with mixner
sh train_dynamic_multilingual_mixner.sh zh zh_CN 100 8 42 0.3 5
```
