---
layout: paper
title: "WADER: A Weak-labelling framework for Data augmentation in tExt Regression Tasks"
short_title: "WADER"
description: "SemEval-2023: WADER augments text regression data with translation, weak labels, and difference-based sampling for multilingual tweet intimacy prediction."
bibkey: suri-etal-2023-wader
authors:
  - name: Manan Suri
    url: /
    me: true
    equal: true
  - name: Aaryak Garg
    equal: true
  - name: Divya Chaudhary
    url: https://www.khoury.northeastern.edu/people/divya-chaudhary/
  - name: Ian Gorton
    url: https://www.khoury.northeastern.edu/people/ian-gorton/
  - name: Bijendra Kumar
    url: http://nsut.ac.in/en/node/242
affiliations: "Netaji Subhas University of Technology, New Delhi; Northeastern University, Seattle"
venue: "Proceedings of the 17th International Workshop on Semantic Evaluation (SemEval-2023), co-located with ACL 2023"
venue_short: "SemEval 2023"
year: 2023
date: 2023-07-13
pdf: https://aclanthology.org/2023.semeval-1.267.pdf
publisher_url: https://aclanthology.org/2023.semeval-1.267/
publisher_label: "ACL Anthology"
code: https://github.com/Darthfire/wader
figure: /assets/img/papers/wader/hero.png
figure_alt: "WADER flowchart: a labelled corpus is sampled by label distribution above a threshold, translated into other languages, scored by a baseline model, filtered by difference-based sampling into a weakly labelled corpus, and merged back into the training set."
figure_caption: "The WADER data augmentation flow. Under-represented labels are selected by distribution-based sampling, translated, weakly labelled by a baseline model trained on gold data, filtered by the difference between predicted and inherited labels, and added to the training set."
tldr: "Text regression datasets such as tweet intimacy are imbalanced and, in the multilingual case, missing whole languages. WADER translates under-represented examples, labels them with a baseline model, keeps the translations whose predicted label stays close to the original, and fine-tunes XLM-RoBERTa and XLNet on the result, improving on the gold-only baselines in the SemEval-2023 Task 9 shared task."
og_image: https://manansuri.com/assets/img/papers/wader/hero.png
---

## Abstract

Intimacy is an essential element of human relationships and language is a crucial means of conveying it. Textual intimacy analysis can reveal social norms in different contexts and serve as a benchmark for testing computational models' ability to understand social information. In this paper, we propose a novel weak-labeling strategy for data augmentation in text regression tasks called WADER. WADER uses data augmentation to address the problems of data imbalance and data scarcity and provides a method for data augmentation in cross-lingual, zero-shot tasks. We benchmark the performance of State-of-the-Art pre-trained multilingual language models using WADER and analyze the use of sampling techniques to mitigate bias in data and optimally select augmentation candidates. Our results show that WADER outperforms the baseline model and provides a direction for mitigating data imbalance and scarcity in text regression tasks.

## The problem

SemEval-2023 Task 9 (Multilingual Tweet Intimacy Analysis) asks systems to predict a continuous intimacy score from 1 to 5 for tweets. Training data (the MINT dataset, 9,491 tweets) covers six languages: English, Spanish, Italian, Portuguese, French, and Chinese. The test set adds four unseen languages: Hindi, Arabic, Dutch, and Korean. Evaluation is Pearson's r.

Two problems make this hard. The labels are heavily skewed toward the low end of the scale: 75% of training tweets have an intimacy score of 2.667 or less, so high-intimacy examples are scarce. And the zero-shot languages have no training data at all. Text data augmentation is well studied for classification and NER, but we are not aware of prior work targeting text regression, where augmented examples need a continuous label rather than a class.

## Approach

WADER is a weak-labelling pipeline that turns translation into a source of labelled regression data.

- **Distribution-based sampling.** Because not every label needs augmentation, we select candidate tweets above a label threshold p (3.2 in our runs), which targets the under-represented high-intimacy region.
- **Translation.** Each sampled tweet is translated with the Google Translate API. For an unseen language, sampled tweets from every training language are translated into it. For a seen language, tweets are translated into every other language and back-translated into the source. The translated pool contains 49,774 sentences.
- **Label validation.** A baseline model (XLM-RoBERTa or XLNet fine-tuned on gold data only) predicts an intimacy score for every translated sentence.
- **Difference-based sampling.** We keep translations whose predicted score is within a threshold beta of the label inherited from the source tweet, using beta = 0.1, 0.2, and 0.3 (5,102, 10,581, and 16,187 sentences respectively). The mean difference over the whole pool is 0.62, and 75% of sentences are within 0.86.

The retained weakly labelled sentences are added to the gold training set. We fine-tune xlm-roberta-base and xlnet-base-cased with a single linear head and a clamp to [1, 5], trained for 2 epochs with Adam, batch size 8, and learning rate 4e-5. Six ensembles of these models, combined by mean prediction, are also evaluated.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="WADER pipeline: under-represented labels are sampled from the labelled corpus, translated, scored by a baseline model, kept as weak labels when the prediction is close to the inherited label, and added to the training set.">
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
  <!-- 1 corpus -->
  <rect class="n" x="15" y="60" width="130" height="90" rx="10"/>
  <text class="t" x="80" y="88" text-anchor="middle" font-weight="600">Labelled corpus</text>
  <text class="s" x="80" y="108" text-anchor="middle">9,491 tweets</text>
  <text class="s" x="80" y="126" text-anchor="middle">6 languages, 1-5</text>
  <path class="flow" d="M145 105 H185"/>
  <!-- 2 sampling -->
  <rect class="n acc" x="190" y="50" width="140" height="110" rx="10"/>
  <text class="t" x="260" y="76" text-anchor="middle" font-weight="600">Distribution</text>
  <text class="t" x="260" y="94" text-anchor="middle" font-weight="600">sampling</text>
  <text class="s" x="260" y="116" text-anchor="middle">keep tweets with</text>
  <text class="s" x="260" y="134" text-anchor="middle">score above p = 3.2</text>
  <path class="flow" d="M330 105 H370" style="animation-delay:.3s"/>
  <!-- 3 translation -->
  <rect class="n acc" x="375" y="50" width="140" height="110" rx="10"/>
  <text class="t" x="445" y="76" text-anchor="middle" font-weight="600">Translation</text>
  <text class="s" x="445" y="98" text-anchor="middle">to unseen languages</text>
  <text class="s" x="445" y="116" text-anchor="middle">+ back-translation</text>
  <text class="s" x="445" y="134" text-anchor="middle">49,774 sentences</text>
  <path class="flow" d="M515 105 H555" style="animation-delay:.6s"/>
  <!-- 4 baseline inference -->
  <rect class="n acc" x="560" y="50" width="140" height="110" rx="10"/>
  <text class="t" x="630" y="76" text-anchor="middle" font-weight="600">Baseline model</text>
  <text class="s" x="630" y="98" text-anchor="middle">XLM-R / XLNet</text>
  <text class="s" x="630" y="116" text-anchor="middle">trained on gold only</text>
  <text class="s" x="630" y="134" text-anchor="middle">predicts a score</text>
  <path class="flow" d="M700 105 H740" style="animation-delay:.9s"/>
  <!-- 5 difference sampling -->
  <rect class="n acc" x="745" y="50" width="145" height="110" rx="10"/>
  <text class="t" x="817" y="76" text-anchor="middle" font-weight="600">Difference</text>
  <text class="t" x="817" y="94" text-anchor="middle" font-weight="600">sampling</text>
  <text class="s" x="817" y="116" text-anchor="middle">|pred - label| &lt; beta</text>
  <text class="s" x="817" y="134" text-anchor="middle">beta = 0.1 / 0.2 / 0.3</text>
  <g class="fade1"><rect class="n" x="750" y="175" width="135" height="20" rx="4"/><text class="s" x="817" y="189" text-anchor="middle">diff 0.08: kept</text></g>
  <g class="fade2"><rect class="n" x="750" y="200" width="135" height="20" rx="4"/><text class="s" x="817" y="214" text-anchor="middle">diff 0.86: dropped</text></g>
  <!-- 6 weak labels back to training set -->
  <path class="flow" d="M817 225 V265 H520" style="animation-delay:1.2s"/>
  <rect class="n" x="330" y="235" width="185" height="60" rx="10"/>
  <text class="t" x="422" y="259" text-anchor="middle" font-weight="600">Weakly labelled set</text>
  <text class="s" x="422" y="279" text-anchor="middle">5,102 / 10,581 / 16,187</text>
  <path class="flow" d="M330 265 H175" style="animation-delay:1.5s"/>
  <rect class="n" x="15" y="235" width="155" height="60" rx="10"/>
  <text class="t" x="92" y="259" text-anchor="middle" font-weight="600">Training set</text>
  <text class="s" x="92" y="279" text-anchor="middle">gold + weak labels</text>
  <g class="pulse"><path class="n" d="M92 235 V150" stroke-dasharray="3 3"/></g>
</svg>
<div class="anim-caption">Tweets above the label threshold are translated (and back-translated), scored by a baseline model trained on gold data only, kept when the predicted score stays within beta of the inherited label, and merged into the training set as weak labels.</div>
</div>

## Results

All numbers are Pearson's r on the official test set. "beta-Model" is the model fine-tuned on gold labels plus the WADER set filtered at difference threshold beta.

<div class="table-responsive" markdown="1">

| System | Overall | Seen langs. | Unseen langs. | English | Italian | French | Korean | Arabic |
|---|---|---|---|---|---|---|---|---|
| Baseline XLM-RoBERTa | 0.52 | 0.65 | 0.35 | 0.60 | 0.64 | 0.60 | 0.37 | 0.42 |
| 0.1-XLM-RoBERTa | 0.52 | 0.66 | 0.34 | 0.61 | 0.67 | 0.63 | 0.35 | 0.48 |
| 0.2-XLM-RoBERTa | 0.52 | 0.67 | 0.33 | 0.63 | 0.67 | 0.64 | 0.38 | 0.49 |
| **0.3-XLM-RoBERTa** | **0.53** | **0.66** | **0.35** | **0.63** | **0.67** | **0.64** | **0.43** | **0.50** |
| Baseline XLNet | 0.38 | 0.51 | 0.22 | 0.62 | 0.47 | 0.47 | -0.03 | 0.05 |
| 0.3-XLNet | 0.42 | 0.52 | 0.29 | 0.61 | 0.53 | 0.50 | 0.16 | 0.19 |
| Ensemble-1 | 0.53 | 0.67 | 0.34 | 0.63 | 0.68 | 0.64 | 0.40 | 0.49 |
| Ensemble-6 (final submission) | 0.53 | 0.65 | 0.37 | 0.64 | 0.64 | 0.61 | 0.36 | 0.48 |

</div>

<p class="table-note">Source: Table 5 of the paper. Pearson's r on the SemEval-2023 Task 9 test set; Spanish, Portuguese, Chinese, Hindi, and Dutch columns omitted. The final submission (Ensemble 6) ranked 32nd overall, 34th on seen languages, and 29th on unseen languages in the shared task. Higher is better.</p>

- WADER improves on the transformer baselines in all categories except one, where it ties with an ensemble. With beta = 0.3, XLM-RoBERTa gains in English (0.60 to 0.63), Italian (0.64 to 0.67), French (0.60 to 0.64), Korean (0.37 to 0.43), and Arabic (0.42 to 0.50).
- XLNet benefits more in relative terms: 0.38 to 0.42 overall and 0.22 to 0.29 on unseen languages with beta = 0.3.
- Moderate beta values (0.2, 0.3) tend to beat the strictest filter (0.1): the larger, more diverse training sets act as a regulariser.
- XLM-RoBERTa consistently beats XLNet on multilingual data, which underlines the value of multilingual pre-training; XLNet only wins on English.

### Training data and augmentation sets

| Language | Tweets | Mean intimacy | 75th percentile |
|---|---|---|---|
| English | 1,587 | 1.89 | 2.4 |
| Chinese | 1,596 | 2.27 | 2.8 |
| French | 1,588 | 2.06 | 2.6 |
| Italian | 1,532 | 1.94 | 2.425 |
| Spanish | 1,592 | 2.21 | 2.8 |
| Portuguese | 1,596 | 2.16 | 2.8 |
| Overall | 9,491 | 2.09 | 2.67 |

<p class="table-note">Source: Table 1 of the paper (MINT training set). Intimacy is scored on a 1-5 scale.</p>

| Difference threshold beta | Weakly labelled sentences kept |
|---|---|
| 0.1 | 5,102 |
| 0.2 | 10,581 |
| 0.3 | 16,187 |

<p class="table-note">Source: Table 3 of the paper, out of 49,774 translated sentences. Over the whole pool the mean absolute difference between predicted and inherited label is 0.62, the median 0.47, and the 75th percentile 0.86 (Table 2).</p>

## Resources

- Paper: [ACL Anthology](https://aclanthology.org/2023.semeval-1.267/) · [arXiv:2303.02758](https://arxiv.org/abs/2303.02758) · [Hugging Face papers](https://huggingface.co/papers/2303.02758)
- Code: [github.com/Darthfire/wader](https://github.com/Darthfire/wader) (built on `simpletransformers`, `googletrans`, `pandas`, `scikit-learn`)
- Task: [SemEval-2023 Task 9, Multilingual Tweet Intimacy Analysis](https://arxiv.org/abs/2210.01108) (Pei et al., 2022)
- Related: [Multimodal depression detection from Twitter data](/papers/depression-twitter-multimodal/), another collaboration with the same advisors; [The Geometry of Multilingual Language Models](/papers/multilingual-geometry-fairness/), on how XLM-R represents seen and unseen languages
- [All publications](/publications/)
