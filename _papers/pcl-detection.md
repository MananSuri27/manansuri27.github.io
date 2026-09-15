---
layout: paper
title: "Boosting Pre-trained Language Models with Task Specific Metadata and Cost Sensitive Learning"
short_title: "PiCkLe at SemEval-2022"
description: "PiCkLe at SemEval-2022 Task 4: BERT-family models with token-separated community keywords and cost-sensitive class weighting for detecting patronising language."
bibkey: suri-2022-pickle
authors:
  - name: Manan Suri
    url: /
    me: true
affiliations: "Netaji Subhas University of Technology, New Delhi"
venue: "16th International Workshop on Semantic Evaluation (SemEval-2022), at NAACL 2022"
venue_short: "SemEval-2022"
year: 2022
date: 2022-07-14
pdf: https://aclanthology.org/2022.semeval-1.63.pdf
publisher_url: https://aclanthology.org/2022.semeval-1.63/
publisher_label: "ACL Anthology"
code: https://github.com/MananSuri27/PatronisingAndCondescendingLanguage
figure: /assets/img/papers/pcl-detection/hero.png
figure_alt: "Plot of three decreasing curves of class weight against class size: inverse of number of samples, inverse of its square root, and the effective-number-of-samples weighting."
figure_caption: "The functions behind the three class weighting schemes we compare: Inverse Number of Samples (1/x), Inverse Square Root of Number of Samples (1/sqrt(x)) and Effective Number of Samples with beta = 0.99. Actual class weights include additional constants."
tldr: "Patronising and condescending language (PCL) toward vulnerable communities is subtle, and in the SemEval-2022 Task 4 data only 9.5% of paragraphs contain it. We fine-tune BERT, RoBERTa, DistilBERT and ALBERT with the paragraph's community keyword inserted as a token-separated second segment and with cost-sensitive class weights; Effective Number of Samples weighting plus metadata gives the best models in both subtasks."
highlights:
  - value: "9.5%"
    label: "of training paragraphs contain PCL"
  - value: "0.594"
    label: "dev F1, Subtask 1 (BERT + ENS weighting + metadata)"
  - value: "0.420"
    label: "dev average F1, Subtask 2 (RoBERTa + ENS + metadata)"
og_image: https://manansuri.com/assets/img/papers/pcl-detection/hero.png
---

## Abstract

This paper describes our system for Task 4 of SemEval 2022: Patronizing and Condescending Language Detection. Patronizing and Condescending Language (PCL) refers to language used with respect to vulnerable communities that portrays them in a pitiful way and is reflective of a sense of superiority. Task 4 involved binary classification (Subtask 1) and multi-label classification (Subtask 2) of Patronizing and Condescending Language (PCL). For our system, we experimented with fine-tuning different transformer-based pre-trained models including BERT, DistilBERT, RoBERTa and ALBERT. Further, we have used token separated metadata in order to improve our model by helping it contextualize different communities with respect to PCL. We faced the challenge of class imbalance, which we solved by experimenting with different class weighting schemes. Our models were effective in both subtasks, with the best performance coming out of models with Effective Number of Samples (ENS) class weighting and token separated metadata in both subtasks. For subtask 1 and subtask 2, our best models were finetuned BERT and RoBERTa models respectively.

## The problem

PCL is language that may sound kind or helpful but reflects a sense of superiority toward a community. Unlike overtly offensive language, it works through subtle word choice, is often used unintentionally by people trying to help, and feeds stereotypes and surface-level solutions. That subtlety makes it hard to classify.

SemEval-2022 Task 4 is built on the Don't Patronize Me! dataset of news paragraphs about ten vulnerable communities (for example disabled, homeless, immigrant, refugees, women) from 20 countries. Subtask 1 is binary PCL detection, evaluated by F1 on the PCL class. Subtask 2 is multi-label classification into seven PCL categories (unbalanced power relations, shallow solution, presupposition, authority voice, metaphor, compassion, the-poorer-the-merrier), evaluated by average F1. The data is heavily imbalanced: only 9.5% of training paragraphs are PCL, and among those 72% carry the unbalanced-power-relations label while the-poorer-the-merrier appears in about 3%.

## Approach

**Fine-tuning pre-trained language models.** We compare BERT, RoBERTa, DistilBERT and ALBERT, each with a dropout layer and a dense classification layer on top of the [CLS] (or `<s>` for RoBERTa) representation. Subtask 1 uses a sigmoid output; Subtask 2 uses sigmoid activations in the final layer so labels are not mutually exclusive.

**Token-separated metadata.** Each paragraph comes with a keyword naming the community it concerns. The same word can mean different things in different communities: "home" in a paragraph tagged refugee refers to a place in the country of origin, while in one tagged homeless it refers to accommodation. We add the keyword to the input as a second segment separated by the model's own special tokens, so BERT-style models see `[CLS] keyword [SEP] paragraph [SEP]` and RoBERTa sees `<s> keyword </s> paragraph </s>`. This reuses the pre-trained segment handling, adds no parameters, and lets the model learn how the metadata interacts with the text.

**Cost-sensitive learning.** Rather than resampling the data, which gave only marginal gains in our experiments, we multiply the loss for each class by a class weight. We compare three weighting schemes: Inverse Number of Samples (INS, weight proportional to 1/n), Inverse Square Root of Number of Samples (ISNS, proportional to 1/sqrt(n)), and Effective Number of Samples (ENS, proportional to (1 - beta)/(1 - beta^n), following Cui et al.), with beta = 0.9997 for Subtask 1 and 0.99 for Subtask 2.

**Training details.** Models were built in Keras with HuggingFace transformers on a Google Colab GPU, with learning rate 2e-5, maximum length 256, batch size 16 and 2 epochs, using the organisers' practice split for train and dev.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A paragraph and its community keyword are packed into one token-separated input, encoded by a pre-trained transformer, trained with a class-weighted cost-sensitive loss, and classified into PCL labels.">
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
  <!-- input -->
  <rect class="n" x="20" y="90" width="210" height="120" rx="10"/>
  <text class="t" x="125" y="118" text-anchor="middle">Paragraph + keyword</text>
  <text class="s" x="125" y="142" text-anchor="middle">[CLS] keyword [SEP]</text>
  <text class="s" x="125" y="160" text-anchor="middle">paragraph [SEP]</text>
  <text class="s fade1" x="125" y="188" text-anchor="middle">e.g. keyword = homeless</text>
  <!-- transformer -->
  <rect class="n" x="290" y="90" width="180" height="120" rx="10"/>
  <text class="t" x="380" y="118" text-anchor="middle">Transformer</text>
  <text class="s" x="380" y="142" text-anchor="middle">BERT / RoBERTa /</text>
  <text class="s" x="380" y="160" text-anchor="middle">DistilBERT / ALBERT</text>
  <text class="s" x="380" y="188" text-anchor="middle">[CLS] → dropout → dense</text>
  <!-- cost sensitive loss -->
  <rect class="n acc" x="530" y="90" width="180" height="120" rx="10" stroke-width="2"/>
  <text class="t" x="620" y="118" text-anchor="middle">Cost-sensitive</text>
  <text class="t" x="620" y="136" text-anchor="middle">loss</text>
  <text class="s" x="620" y="160" text-anchor="middle">loss × weight[class]</text>
  <text class="s" x="620" y="178" text-anchor="middle">ENS: (1−β)/(1−β^n)</text>
  <text class="s" x="620" y="196" text-anchor="middle">INS · ISNS · ENS</text>
  <!-- labels -->
  <rect class="n" x="770" y="90" width="110" height="120" rx="10"/>
  <text class="t" x="825" y="118" text-anchor="middle">PCL labels</text>
  <text class="s" x="825" y="142" text-anchor="middle">Subtask 1:</text>
  <text class="s" x="825" y="158" text-anchor="middle">PCL / not</text>
  <text class="s" x="825" y="180" text-anchor="middle">Subtask 2:</text>
  <text class="s" x="825" y="196" text-anchor="middle">7 categories</text>
  <!-- flows -->
  <path class="flow" d="M230,150 L288,150" marker-end="url(#ah)"/>
  <path class="flow d1" d="M470,150 L528,150" marker-end="url(#ah)"/>
  <path class="flow d2" d="M710,150 L768,150" marker-end="url(#ah)"/>
  <!-- class weight bars -->
  <text class="s" x="620" y="244" text-anchor="middle">ENS class weights (Subtask 1)</text>
  <g class="pulse d2">
    <rect class="acc" x="470" y="256" width="237" height="12" rx="3" fill="#B509AC" opacity="0.8"/>
    <text class="s" x="460" y="266" text-anchor="end">PCL 11.85</text>
  </g>
  <g class="pulse d3">
    <rect x="470" y="276" width="56" height="12" rx="3" fill="currentColor" opacity="0.5"/>
    <text class="s" x="460" y="286" text-anchor="end">non-PCL 2.80</text>
  </g>
  <text class="s fade1" x="380" y="244" text-anchor="middle">only 9.5% of paragraphs are PCL</text>
</svg>
<div class="anim-caption">The community keyword rides along as a second, token-separated segment; a fine-tuned transformer classifies the paragraph and a class-weighted loss (INS, ISNS or ENS) keeps the rare PCL classes from being drowned out.</div>
</div>

## Example

Two paragraphs from the dataset (Table 4 of the paper) that both talk about "home" in different senses. The first line of each row is the serial number, paragraph ID, keyword, country and annotation, exactly as stored in the dataset.

<div class="paper-example" markdown="1">
<span class="ex-label">Input (dataset rows)</span>
<div class="ex-row"><code>496 @@26214070 refugee hk 3</code><br>"Hundreds of thousands of Rohingya refugees living in sprawling camps in Bangladesh are celebrating the Muslim holiday of Eid al-Adha, praying for better lives as they wonder if they'll ever again celebrate at their homes in Myanmar. People streamed into makeshift mosques in the camps, the children dressed in new clothing. Those who could afford it feasted on buffalo meat. Muslims often..."</div>
<div class="ex-row"><code>350 @@21894186 homeless lk 4</code><br>"It can not be right to allow homes to sit empty while many struggle to find somewhere to live, others having to sleep rough on pavements during Christmas, hoping against hope, for some charity to provide shelter. The number left homeless and destitute is alarming not necessarily at Christmas?"</div>
<span class="ex-label">Output (token-separated model input)</span>
<div class="ex-row">BERT-style models see <code>[CLS] refugee [SEP] Hundreds of thousands of Rohingya refugees ... [SEP]</code> and <code>[CLS] homeless [SEP] It can not be right to allow homes ... [SEP]</code>; RoBERTa sees <code>&lt;s&gt; refugee &lt;/s&gt; ... &lt;/s&gt;</code>. With the "refugee" tag, "home" refers to a place in the country of origin; with "homeless", it refers to accommodation or the lack of it, and the keyword gives the model that context without any new parameters.</div>
</div>

## Results

Development-set results (all models use token-separated metadata). Subtask 1 reports F1 on the PCL class; Subtask 2 reports the average F1 over the seven categories.

| Model | No weighting | INS | ISNS | ENS |
|---|---|---|---|---|
| BERT, Subtask 1 | 0.503 | 0.552 | 0.553 | **0.594** |
| RoBERTa, Subtask 1 | 0.546 | 0.502 | 0.571 | 0.544 |
| DistilBERT, Subtask 1 | 0.503 | 0.484 | 0.542 | 0.539 |
| ALBERT, Subtask 1 | 0.376 | 0.333 | 0.474 | 0.510 |
| BERT, Subtask 2 | 0.196 | 0.261 | 0.241 | 0.272 |
| RoBERTa, Subtask 2 | 0.299 | 0.417 | 0.405 | **0.420** |
| DistilBERT, Subtask 2 | 0.185 | 0.257 | 0.210 | 0.269 |
| ALBERT, Subtask 2 | 0.191 | 0.257 | 0.233 | 0.262 |

<p class="table-note">Source: Tables 2 and 3 of the paper (dev set). Subtask 1: F1 on the PCL class; Subtask 2: average F1 across the seven categories. Bold marks the submitted systems. Higher is better.</p>

- Subtask 1: BERT with ENS weighting reaches an F1 of 0.594, up from 0.503 without class weighting. RoBERTa peaks at 0.571 (ISNS), DistilBERT at 0.542 (ISNS) and ALBERT at 0.510 (ENS).
- Subtask 2: RoBERTa with ENS weighting reaches an average F1 of 0.420, up from 0.299 without weighting. Every model and every weighting scheme improves on the unweighted baseline, and weighting lifts the rarest class (the-poorer-the-merrier) from 0.000 F1 to non-zero for BERT, RoBERTa and DistilBERT.
- Token-separated metadata helps every model in both subtasks with all other settings fixed (Table 5): Subtask 1 F1 rises for BERT from 0.556 to 0.595, RoBERTa 0.566 to 0.571, DistilBERT 0.510 to 0.534 and ALBERT 0.450 to 0.474; Subtask 2 average F1 rises for BERT from 0.229 to 0.272, RoBERTa 0.387 to 0.420, DistilBERT 0.249 to 0.269 and ALBERT 0.238 to 0.262.

Official test set (leaderboard):

| Subtask | Submitted model | Precision | Recall | F1 | Rank |
|---|---|---|---|---|---|
| 1: binary PCL detection | BERT + ENS + metadata | 0.46 | 0.5804 | **0.513** | 38 |
| 2: category classification | RoBERTa + ENS + metadata | – | – | **0.1515** (avg) | 35 |

<p class="table-note">Source: Table 7 of the paper. Subtask 2 per-category F1: unb 0.1091, sha 0.2254, pre 0.1439, aut 0.2101, met 0.1916, com 0.0651, the 0.1151. Both submissions score above the organisers' RoBERTa baseline; the Subtask 1 entry is in the top half of all systems and the Subtask 2 entry is among the top 20 systems on the rarest class, the-poorer-the-merrier.</p>

Data used for training and development (practice split of the Don't Patronize Me! dataset):

| Split | PCL | Non-PCL | unb | sha | pre | aut | met | com | the |
|---|---|---|---|---|---|---|---|---|---|
| Training | 794 | 7,581 | 574 | 160 | 162 | 192 | 363 | 145 | 29 |
| Development | 199 | 1,895 | 142 | 36 | 62 | 38 | 106 | 52 | 11 |
| ENS class weight (train) | 11.85 | 2.80 | 16.30 | 20.32 | 20.22 | 19.01 | 16.68 | 21.18 | 64.27 |

<p class="table-note">Source: Tables 1 and 6 of the paper. The test set has 3,831 rows. Category codes: unbalanced power relations, shallow solution, presupposition, authority voice, metaphor, compassion, the-poorer-the-merrier.</p>

## Resources

- Paper on the [ACL Anthology](https://aclanthology.org/2022.semeval-1.63/) ([PDF](https://aclanthology.org/2022.semeval-1.63.pdf), [video presentation](https://aclanthology.org/2022.semeval-1.63.mp4))
- Code: [MananSuri27/PatronisingAndCondescendingLanguage](https://github.com/MananSuri27/PatronisingAndCondescendingLanguage)
- Data: the [Don't Patronize Me! dataset](https://github.com/Perez-AlmendrosC/dontpatronizeme) and the [SemEval-2022 Task 4 page](https://sites.google.com/view/pcl-detection-semeval2022/)
- Related: translation-based augmentation for imbalanced multilingual classification in my [CASE 2022 protest detection paper](/papers/protest-event-detection/)
- More of my work on [the publications page](/publications/)
