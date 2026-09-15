---
layout: paper
title: "I Don't Feel so Good! Detecting Depressive Tendencies Using Transformer-Based Multimodal Frameworks"
short_title: "Depressive Tendencies"
description: "Cross-modal attention over BERT plus tweet and user metadata detects depressive tendencies in tweets, 12 F1 points above text-only BERT. MLNLP 2022 (ACM)."
bibkey: 10.1145/3578741.3578817
authors:
  - name: Manan Suri
    url: /
    me: true
  - name: Nalin Semwal
  - name: Divya Chaudhary
    url: https://www.khoury.northeastern.edu/people/divya-chaudhary/
  - name: Ian Gorton
    url: https://www.khoury.northeastern.edu/people/ian-gorton/
  - name: Bijendra Kumar
    url: http://nsut.ac.in/en/node/242
affiliations: "Netaji Subhas University of Technology; Northeastern University"
venue: "MLNLP 2022: 5th International Conference on Machine Learning and Natural Language Processing (ACM)"
venue_short: "MLNLP 2022"
year: 2022
date: 2022-12-23
publisher_url: https://doi.org/10.1145/3578741.3578817
publisher_label: "ACM DL"
figure: /assets/img/papers/depression-transformer-multimodal/hero.png
figure_alt: "Block diagram: BERT encodes the tweet text, tweet attributes and user attributes are fed alongside it into a combining layer, then a classification layer predicts depressive tendencies present or absent."
figure_caption: "The BERT + multimodal framework. The [CLS] output of BERT (x), a vector of tweet attributes (c) and a vector of user attributes (n) are merged by a combining layer (concatenation, MLP, or cross-modal attention) before a single classification layer."
tldr: "A single tweet rarely proves clinical depression, but it can show depressive tendencies, and the text alone ignores how the author and their audience behave on the platform. We collect and annotate 5,997 tweets with tweet and user metadata and show that a cross-modal attention model over BERT, tweet features and user features reaches an F1 of 0.866, 12 points above a text-only BERT baseline."
highlights:
  - value: "5,997"
    label: "tweets collected and manually annotated"
  - value: "0.83"
    label: "Cohen's kappa between annotators"
  - value: "0.866"
    label: "best F1 (cross-modal attention, all modalities)"
  - value: "+12 pts"
    label: "F1 over text-only BERT"
og_image: https://manansuri.com/assets/img/papers/depression-transformer-multimodal/hero.png
---

## Abstract

One of the most common mental illnesses that affects 5% of adults globally is depression. The advancement of social media has meant that more and more people have gained a platform to voice their thoughts and beliefs. People's social media interactions and posted content can be used to infer critical characteristics such as depressive tendencies which will allow for timely intervention and help. This paper describes a novel supervised approach to detect depressive tendencies in Twitter users using multimodal frameworks which account for user interaction and online behaviour in addition to the tweet content processed using transformers like BERT. The performance of three multimodal frameworks is described with different methods for combining modalities. The best result is obtained with a cross-modality based model which improves the baseline by 12% points.

## The problem

Most prior work on depression and social media tries to decide whether a user has depression, often starting from self-reported or clinically confirmed diagnoses. We look at a weaker but earlier signal: depressive tendencies. Following the distinction between a depressive state and a depressive disposition, a tendency is a probabilistic trait that raises the likelihood of experiencing the state. A single tweet cannot support a diagnosis, but it can show tendencies that serve as early warning signs.

Text-only models also ignore two things that prior studies say are distinctive for users with depression: how they use the platform (posting to express themselves rather than to interact) and how other users respond to their posts. We ask whether tweet features (likes, retweets, replies, hashtags, mentions) and user features (followers, following, tweet count) can supplement the tweet text when identifying depressive tendencies.

## Approach

**Data.** We built a list of 98 search phrases by studying online depression communities such as r/Depression and mapping phrases to PHQ-9 symptoms, then used the Twitter API to collect up to 100 tweets per phrase between 20 May and 12 June 2022, along with tweet and user metadata. After cleaning, 5,997 English tweets remained. Two trained annotators, supervised by a psychology professor, labelled each tweet with a yes or no answer to the question "Does this tweet imply the user is displaying tendencies which may be associated with symptoms of depression?" using PHQ-9-based criteria. 488 tweets were labelled as showing depressive tendencies, and inter-annotator agreement was a Cohen's kappa of 0.83. The dataset is anonymised and no tweets are quoted in the paper.

**Features.** Each example has three modalities: the tweet text, a vector of tweet attributes (retweet, reply, like and quote counts, creation time, hashtags, mentions) and a vector of user attributes (followers, following, tweet count, listed count).

**Three multimodal frameworks.** The text is encoded by BERT (bert-base-uncased); its [CLS] output x is combined with the tweet vector c and the user vector n into a multimodal representation m, which a single fully connected layer with ReLU turns into the prediction. We compare three combining layers:

- **Concatenation:** `m = x || c || n`.
- **MLP on tweet and user attributes:** `m = x || MLP(c || n)`, so the tabular features are first passed through a multilayer perceptron.
- **Cross-modal attention:** each modality is projected by a single-layer feed-forward network, and the tweet and user features are queried against the text feature to produce attention weights, giving m as an attention-weighted sum of the three projected modalities.

Each framework is trained with text plus tweet features, text plus user features, and text plus both, which acts as an ablation over the modalities. Models were trained for 2 epochs with Adam on an 8:1:1 stratified train/dev/test split.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tweet text is encoded by BERT while tweet and user feature vectors pass through small networks; a combining layer (concatenation, MLP or cross-modal attention) merges them before a classifier predicts whether depressive tendencies are present.">
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
  <text class="s" x="95" y="86" text-anchor="middle">[CLS] tweet [SEP]</text>
  <rect class="n" x="20" y="129" width="150" height="62" rx="8"/>
  <text class="t" x="95" y="155" text-anchor="middle">Tweet features</text>
  <text class="s" x="95" y="175" text-anchor="middle">likes, RTs, replies…</text>
  <rect class="n" x="20" y="218" width="150" height="62" rx="8"/>
  <text class="t" x="95" y="244" text-anchor="middle">User features</text>
  <text class="s" x="95" y="264" text-anchor="middle">followers, tweets…</text>
  <!-- encoders -->
  <rect class="n" x="240" y="40" width="140" height="62" rx="8"/>
  <text class="t" x="310" y="66" text-anchor="middle">BERT</text>
  <text class="s" x="310" y="86" text-anchor="middle">[CLS] output x</text>
  <rect class="n" x="240" y="129" width="140" height="62" rx="8"/>
  <text class="t" x="310" y="155" text-anchor="middle">Feed-forward</text>
  <text class="s" x="310" y="175" text-anchor="middle">tweet vector c</text>
  <rect class="n" x="240" y="218" width="140" height="62" rx="8"/>
  <text class="t" x="310" y="244" text-anchor="middle">Feed-forward</text>
  <text class="s" x="310" y="264" text-anchor="middle">user vector n</text>
  <!-- combining layer -->
  <rect class="n acc" x="450" y="40" width="210" height="240" rx="10" stroke-width="2"/>
  <text class="t" x="555" y="68" text-anchor="middle">Combining layer</text>
  <text class="s" x="555" y="86" text-anchor="middle">three frameworks</text>
  <g class="pulse">
    <rect class="n" x="468" y="102" width="174" height="44" rx="6"/>
    <text class="t" x="555" y="121" text-anchor="middle">Concatenation</text>
    <text class="s" x="555" y="138" text-anchor="middle">m = x ‖ c ‖ n</text>
  </g>
  <g class="pulse d2">
    <rect class="n" x="468" y="156" width="174" height="44" rx="6"/>
    <text class="t" x="555" y="175" text-anchor="middle">MLP</text>
    <text class="s" x="555" y="192" text-anchor="middle">m = x ‖ MLP(c ‖ n)</text>
  </g>
  <g class="pulse d4">
    <rect class="n acc" x="468" y="210" width="174" height="56" rx="6"/>
    <text class="t" x="555" y="231" text-anchor="middle">Cross-modal</text>
    <text class="t" x="555" y="247" text-anchor="middle">attention</text>
    <text class="s" x="555" y="261" text-anchor="middle">best: F1 0.866</text>
  </g>
  <!-- prediction -->
  <rect class="n" x="730" y="118" width="150" height="84" rx="8"/>
  <text class="t" x="805" y="146" text-anchor="middle">Classifier</text>
  <text class="s" x="805" y="166" text-anchor="middle">depressive tendency</text>
  <text class="s" x="805" y="184" text-anchor="middle">present / absent</text>
  <!-- flows -->
  <path class="flow" d="M170,71 L238,71" marker-end="url(#ah)"/>
  <path class="flow" d="M170,160 L238,160" marker-end="url(#ah)"/>
  <path class="flow" d="M170,249 L238,249" marker-end="url(#ah)"/>
  <path class="flow d1" d="M380,71 L448,71" marker-end="url(#ah)"/>
  <path class="flow d1" d="M380,160 L448,160" marker-end="url(#ah)"/>
  <path class="flow d1" d="M380,249 L448,249" marker-end="url(#ah)"/>
  <path class="flow d2" d="M660,160 L728,160" marker-end="url(#ah)"/>
  <text class="s fade1" x="695" y="148" text-anchor="middle">m</text>
</svg>
<div class="anim-caption">Each tweet contributes three modalities: BERT encodes the text, the tweet and user attribute vectors are projected, and a combining layer (concatenation, MLP or cross-modal attention) merges them before a single classification layer.</div>
</div>

## Example

The dataset is anonymised, so the paper illustrates its annotation guideline with the kinds of tweet that the search phrases surface. The quotes below are the ones given in the paper's annotation criteria.

<div class="paper-example" markdown="1">
<span class="ex-label">Input (search phrase, collected tweet)</span>
<div class="ex-row">Phrase "I'm tired of feeling" returned, as a common result, the Lana Del Rey lyric "I'm tired of feeling like I'm f***ed up crazy".</div>
<div class="ex-row">Phrase "depression" returned third-person content such as "Millions of people feel depressed around the world".</div>
<span class="ex-label">Output (annotation)</span>
<div class="ex-row"><strong>Depressive tendency absent.</strong> References to lyrics or pop culture, and third-person descriptions such as raising awareness for mental health, are labelled absent. The same holds for sadness over a temporary cause ("Today's not a good day, I burnt my pizza in the oven") and for motivational content about past mental-health issues ("Before I started going to church, I used to feel hopeless all the time and felt like I didn't deserve to live").</div>
</div>

<div class="paper-example" markdown="1">
<span class="ex-label">Input (annotation question)</span>
<div class="ex-row">"Does this tweet imply the user is displaying tendencies which may be associated with symptoms of depression?"</div>
<span class="ex-label">Output (criteria for "present")</span>
<div class="ex-row"><strong>Depressive tendency present</strong> when the tweet describes hopelessness, being alone, or unambiguous suicidal indications; explicitly mentions requiring or accepting therapy or mental-health resources; shows low self-esteem, pessimism and guilt; describes the loss of pleasure in activities; or describes somatic symptoms such as constant fatigue, poor sleep and night ruminations. Ambiguous tweets default to present, since missing a person with depressive tendencies is the costlier error.</div>
</div>

## Results

Test-set results for the text-only baseline and the three multimodal frameworks, each with different feature combinations:

| Model | Features | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|---|
| BERT (baseline) | text | 0.955 | 0.7872 | 0.6981 | 0.74 |
| BERT + concat | text + user | 0.9666 | 0.7857 | 0.8301 | 0.8073 |
| BERT + concat | text + tweet | 0.9616 | 0.7962 | 0.8113 | 0.8037 |
| BERT + concat | text + user + tweet | 0.9700 | 0.8214 | 0.8679 | 0.844 |
| BERT + MLP | text + user + tweet | 0.9666 | 0.8214 | 0.8679 | 0.844 |
| BERT + cross-modal attention | text + user | 0.9633 | 0.8000 | 0.301 | 0.8148 |
| BERT + cross-modal attention | text + tweet | 0.9716 | 0.9750 | 0.7358 | 0.8387 |
| **BERT + cross-modal attention** | **text + user + tweet** | **0.9766** | **0.9545** | **0.7924** | **0.8659** |

<p class="table-note">Source: Table 2 of the paper (8 of its 10 rows; the MLP framework's text + user and text + tweet rows score 0.8037 and 0.8387 F1). Values are as printed in the paper, including the 0.301 recall entry. Higher is better.</p>

- The cross-modal attention model with all three modalities is the best system with an F1 of 0.8659 and accuracy of 0.9766, 12 points of F1 above the text-only baseline.
- Every framework gains from the extra modalities: concatenation and MLP with all three reach 0.844 F1, and even a single extra modality adds 6 to 10 F1 points over the baseline.
- In two of the three frameworks, text plus tweet features beats text plus user features, which suggests that how other users interact with a specific tweet is more informative than static user-level features.
- The paper also contributes the annotated dataset of 5,997 tweets, the 98 depression-related search phrases used to collect it, and a baseline for future work on detecting mental-health signals from social media activity.

Dataset built for the paper:

| Statistic | Value |
|---|---|
| Search phrases (mapped to PHQ-9 symptoms) | 98 |
| Collection window | 20 May to 12 June 2022 |
| Tweets after cleaning (English) | 5,997 |
| Labelled depressive tendency present | 488 |
| Annotators | 2, supervised by a psychology professor |
| Inter-annotator agreement (Cohen's kappa) | 0.83 |
| Train / dev / test split | 8 : 1 : 1, stratified |

<p class="table-note">Source: Sections 4 and 6 of the paper.</p>

## Resources

- Paper on the [ACM Digital Library](https://doi.org/10.1145/3578741.3578817) (MLNLP 2022, DOI 10.1145/3578741.3578817)
- Related: [Multimodal depression detection from Twitter data](/papers/depression-twitter-multimodal/), follow-up work with the same team fusing tweet text with profile images
- Related: the same tweet-and-user feature idea applied to claim detection in my [CheckThat! 2022 paper](/papers/claim-detection-tweets/)
- More of my work on [the publications page](/publications/)
