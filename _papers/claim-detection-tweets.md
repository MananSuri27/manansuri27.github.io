---
layout: paper
title: "Multimodal BERT for Identifying Claims in Tweets"
short_title: "Asatya at CheckThat! 2022"
description: "Asatya at CLEF 2022 CheckThat!: BERT plus Twitter engagement and author features, with translated training data, ranked 2nd on verifiability and harmfulness."
bibkey: DBLP:conf/clef/SuriKD22
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Prajeet Katari
  - name: Saumay Dudeja
affiliations: "Netaji Subhas University of Technology, New Delhi"
venue: "Working Notes of CLEF 2022, CheckThat! Lab (CEUR Workshop Proceedings, Vol. 3180)"
venue_short: "CLEF 2022"
year: 2022
date: 2022-09-05
pdf: https://ceur-ws.org/Vol-3180/paper-55.pdf
publisher_url: https://ceur-ws.org/Vol-3180/
publisher_label: "CEUR-WS"
code: https://github.com/MananSuri27/MultimodalTweetAnalysis
figure: /assets/img/papers/claim-detection-tweets/hero.png
figure_alt: "System diagram: tweet text is preprocessed and encoded by BERT, while categorical and numerical features fetched from the Twitter API pass through separate MLPs; a combining module and fully connected layers produce the prediction."
figure_caption: "The multimodal framework. The tweet text is preprocessed and encoded by BERT; categorical features (verified, url) and numerical features (followers, following, posts, likes, retweets) fetched through the Twitter API pass through separate MLPs before a combining module and fully connected layers make the prediction."
tldr: "Whether a tweet is check-worthy, verifiable or harmful depends not only on its words but on who posted it and how much engagement it got. We combine BERT with numerical and categorical features pulled from the Twitter API, train on English data augmented with translated Bulgarian and Dutch tweets, and rank 2nd on both the verifiable-claim and harmful-tweet subtasks of CheckThat! 2022 Task 1."
highlights:
  - value: "2nd"
    label: "of 10 teams, Subtask 1B (verifiable claims)"
  - value: "2nd"
    label: "of 11 teams, Subtask 1C (harmful tweets)"
  - value: "0.749"
    label: "accuracy on Subtask 1B (winner 0.761)"
og_image: https://manansuri.com/assets/img/papers/claim-detection-tweets/hero.png
---

## Abstract

The paper presents an overview of our submission to the fifth edition of the CheckThat! Lab challenge. Specifically, our team participated in subtasks 1A, 1B and 1C under task 1, which aimed to identify relevant claims in tweets. More specifically, the three subtasks deal with evaluating the check-worthiness, presence of verifiable facts and presence of harmful content in the tweets, respectively. The lab provided us datasets for the three subtasks in multiple languages including English, Dutch and Bulgarian. A total of 14, 10 and 12 teams participated in the subtasks 1A, 1B and 1C respectively, out of which we ranked 9th, 2nd and 2nd, respectively. In this paper, we discuss our methodology for the subtasks, which includes data augmentation to increase the size of our training dataset, followed by preprocessing of the tweets and feature extraction for the tweets from the Twitter API to gain more data points that can help gauge the credibility and/or authenticity of the tweet. Finally, we discuss the structure of our Multimodal model which uses numerical and categorical features in addition to the textual data from tweets.

## The problem

The CheckThat! Lab at CLEF 2022 targets disinformation on Twitter. Task 1 asks systems to identify relevant claims in tweets through three binary subtasks: 1A, is the tweet worth fact-checking; 1B, does it contain a verifiable factual claim; 1C, is it harmful to society. Subtasks 1A and 1C are scored by F1 on the positive class and 1B by accuracy. We submitted for the English test sets.

The datasets are small (2,122 English training tweets for 1A, 3,324 for 1B and 3,323 for 1C), mostly about COVID-19, and imbalanced. They also contain only the tweet text and topic, even though whether a claim is check-worthy or harmful depends on who is posting it and how far it has spread.

## Approach

**Preprocessing.** We remove hashtags, URLs and @mentions, and replace numeric values with the token "number" so the model can pick up on the presence of a figure, which is a strong signal of verifiability, without memorising specific values. Because a link may still matter, the presence of a URL is kept as a categorical feature.

**Data augmentation by translation.** We translate the Bulgarian and Dutch training sets into English with the googletrans library and append them to the English data, choosing only languages with similar scripts and semantics to preserve information. This grows the training sets to 4,916 tweets for 1A, 7,984 for 1B and 7,977 for 1C.

**Feature extraction through the Twitter API.** For each tweet we fetch numerical features (author's followers, following and post counts; the tweet's likes and retweets) and categorical features (whether the author is verified; whether the tweet contains a URL). Missing values, for deleted tweets or private accounts, default to 0. The intuition is that a claim about vaccines from an account with political authority is more check-worthy than the same words from an anonymous account.

**Multimodal model.** The text is encoded by bert-base-uncased, and the categorical and numerical features pass through separate MLPs whose outputs are concatenated with the transformer output before the classification layer: `m = x || MLP(c) || MLP(n)`. We build this with the Multimodal-Toolkit for transformers with tabular data, using the `individual_mlps_on_cat_and_numerical_feats_then_concat` combine method, dropout 0.1, an MLP division ratio of 4, batch size 8, and 1 epoch per model on a Google Colab GPU.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Preprocessed tweet text is encoded by BERT while categorical and numerical features fetched from the Twitter API pass through separate MLPs; the outputs are concatenated and fully connected layers predict whether the tweet is a claim.">
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
  <!-- inputs -->
  <rect class="n" x="20" y="40" width="150" height="62" rx="8"/>
  <text class="t" x="95" y="66" text-anchor="middle">Tweet text</text>
  <text class="s" x="95" y="86" text-anchor="middle">preprocessed</text>
  <rect class="n" x="20" y="129" width="150" height="62" rx="8"/>
  <text class="t" x="95" y="155" text-anchor="middle">Categorical</text>
  <text class="s" x="95" y="175" text-anchor="middle">verified, has_url</text>
  <rect class="n" x="20" y="218" width="150" height="62" rx="8"/>
  <text class="t" x="95" y="244" text-anchor="middle">Numerical</text>
  <text class="s" x="95" y="264" text-anchor="middle">followers, likes, RTs</text>
  <text class="s fade1" x="95" y="304" text-anchor="middle">features via Twitter API</text>
  <!-- encoders -->
  <rect class="n" x="240" y="40" width="140" height="62" rx="8"/>
  <text class="t" x="310" y="66" text-anchor="middle">BERT</text>
  <text class="s" x="310" y="86" text-anchor="middle">bert-base-uncased</text>
  <rect class="n" x="240" y="129" width="140" height="62" rx="8"/>
  <text class="t" x="310" y="155" text-anchor="middle">MLP</text>
  <text class="s" x="310" y="175" text-anchor="middle">MLP(c)</text>
  <rect class="n" x="240" y="218" width="140" height="62" rx="8"/>
  <text class="t" x="310" y="244" text-anchor="middle">MLP</text>
  <text class="s" x="310" y="264" text-anchor="middle">MLP(n)</text>
  <!-- fusion -->
  <rect class="n acc" x="450" y="100" width="190" height="120" rx="10" stroke-width="2"/>
  <text class="t" x="545" y="128" text-anchor="middle">Concatenate</text>
  <text class="s" x="545" y="152" text-anchor="middle">m = x ‖ MLP(c) ‖ MLP(n)</text>
  <text class="s" x="545" y="178" text-anchor="middle">fully connected</text>
  <text class="s" x="545" y="196" text-anchor="middle">layers</text>
  <!-- prediction -->
  <rect class="n" x="710" y="100" width="170" height="120" rx="10"/>
  <text class="t" x="795" y="128" text-anchor="middle">Claim / no claim</text>
  <text class="s" x="795" y="152" text-anchor="middle">1A check-worthy</text>
  <text class="s" x="795" y="170" text-anchor="middle">1B verifiable</text>
  <text class="s" x="795" y="188" text-anchor="middle">1C harmful</text>
  <text class="s" x="795" y="208" text-anchor="middle">one model per subtask</text>
  <!-- flows -->
  <path class="flow" d="M170,71 L238,71" marker-end="url(#ah)"/>
  <path class="flow" d="M170,160 L238,160" marker-end="url(#ah)"/>
  <path class="flow" d="M170,249 L238,249" marker-end="url(#ah)"/>
  <path class="flow d1" d="M380,71 L420,71 L420,130 L448,130" marker-end="url(#ah)"/>
  <path class="flow d1" d="M380,160 L448,160" marker-end="url(#ah)"/>
  <path class="flow d1" d="M380,249 L420,249 L420,190 L448,190" marker-end="url(#ah)"/>
  <path class="flow d2" d="M640,160 L708,160" marker-end="url(#ah)"/>
</svg>
<div class="anim-caption">Each tweet becomes three inputs: the preprocessed text for BERT, and categorical and numerical features from the Twitter API for two small MLPs; their outputs are concatenated and fully connected layers make the binary prediction.</div>
</div>

## Example

The preprocessing step, on the tweet shown in Figure 4 of the paper:

<div class="paper-example" markdown="1">
<span class="ex-label">Input (raw tweet)</span>
<div class="ex-row">"There are now 10 new confirmed cases of #COVID19. Total now at 20, according to DOH | via @kristinesabillo https://twitter.com/kristinesabillo"</div>
<span class="ex-label">Output (text passed to BERT)</span>
<div class="ex-row">"There are now <strong>number</strong> new confirmed cases of . Total now at <strong>number</strong>, according to DOH | via"</div>
<div class="ex-row">Hashtags, URLs and @mentions are removed and numeric values become the token "number", so the model learns that a figure is present without memorising the value. The removed URL survives as the categorical feature <code>has_url = 1</code>.</div>
</div>

The feature-extraction step, on a tweet from the Subtask 1A training set (Figure 5 of the paper):

<div class="paper-example" markdown="1">
<span class="ex-label">Input (tweet and author)</span>
<div class="ex-row">{% include figure.html path="assets/img/papers/claim-detection-tweets/ex-features.png" class="img-fluid rounded" zoomable=true caption="A tweet from the Subtask 1A training set and the features fetched for it through the Twitter API." %}</div>
<span class="ex-label">Output (tabular features)</span>
<div class="ex-row">likes 17478, rts 14455, followers 958555, following 64763, posts 329424, verified 1, url 1. The same words posted by someone with strong political authority and a large audience are more likely to be check-worthy than from an anonymous account, which is what these features let the model see.</div>
</div>

## Results

On the English test sets of CheckThat! 2022 Task 1:

| Subtask | Metric | Asatya (ours) | Rank | Winning score |
|---|---|---|---|---|
| 1A: check-worthiness | F1 (positive class) | **0.500** | 9 of 13 | 0.698 |
| 1B: verifiable factual claim | Accuracy | **0.749** | 2 of 10 | 0.761 |
| 1C: harmful tweet | F1 (positive class) | **0.361** | 2 of 11 | 0.397 |

<p class="table-note">Source: Section 6 and Tables 5 to 7 of the paper (official leaderboard, English test sets). Higher is better.</p>

Top of the leaderboards for the two subtasks where we ranked second:

| Team (Subtask 1B) | Accuracy | Team (Subtask 1C) | F1 |
|---|---|---|---|
| Team_PoliMi-FlatEarthers | 0.761 | nicuBuliga | 0.397 |
| **Asatya** | **0.749** | **Asatya** | **0.361** |
| Team_NLP&IR@UNED | 0.725 | asavchev | 0.361 |
| asavchev | 0.713 | Team_NLP&IR@UNED | 0.347 |
| nicuBuliga | 0.709 | mkutlu | 0.329 |
| random baseline | 0.494 | random baseline | 0.200 |

<p class="table-note">Source: Tables 6 and 7 of the paper (top five teams plus the random baseline). Higher is better.</p>

- Subtask 1B: accuracy 0.749, rank 2 of the 10 teams that submitted, 0.012 behind the winner.
- Subtask 1C: F1 0.361, rank 2 of the 11 teams that submitted, and well clear of the random baseline at 0.200.
- Subtask 1A: F1 0.500, rank 9 of the 13 teams that submitted. Verifiability correlates with numbers and objective facts and harmfulness has recurring patterns, both of which the features and the "number" token capture directly; 1B and 1C also had the larger augmented training sets (7,984 and 7,977 tweets versus 4,916 for 1A).

Training data after translation-based augmentation:

| Subtask | English | Bulgarian (translated) | Dutch (translated) | Total |
|---|---|---|---|---|
| 1A | 2,122 | 1,871 | 923 | 4,916 |
| 1B | 3,324 | 2,710 | 1,950 | 7,984 |
| 1C | 3,323 | 2,708 | 1,946 | 7,977 |

<p class="table-note">Source: Table 4 of the paper. Augmentation grows the training sets by 231%, 240% and 240%.</p>

## Resources

- Paper: [CEUR-WS Vol. 3180, paper 55](https://ceur-ws.org/Vol-3180/paper-55.pdf)
- Code: [MananSuri27/MultimodalTweetAnalysis](https://github.com/MananSuri27/MultimodalTweetAnalysis)
- Shared task: [CheckThat! Lab at CLEF 2022](https://sites.google.com/view/clef2022-checkthat/home)
- Built with the [Multimodal-Toolkit](https://github.com/georgian-io/Multimodal-Toolkit) for transformers with tabular data and [bert-base-uncased](https://huggingface.co/bert-base-uncased)
- Related: the same tweet-and-user feature idea applied to depression signals in my [MLNLP 2022 paper](/papers/depression-transformer-multimodal/)
- Related: translation-based augmentation for protest news in my [CASE 2022 paper](/papers/protest-event-detection/)
- More of my work on [the publications page](/publications/)
