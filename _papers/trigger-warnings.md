---
layout: paper
title: "Trigger Warnings: A Computational Approach to Understanding User-Tagged Trigger Warnings"
short_title: "Trigger Warnings"
description: "RANLP 2023: a Reddit dataset of 25,455 trigger-warning posts on self-harm, suicide, depression, and drug abuse, with topic models and intent classifiers."
bibkey: tyagi-etal-2023-trigger
authors:
  - name: Sarthak Tyagi
  - name: Adwita Arora
  - name: Krish Chopra
  - name: Manan Suri
    url: /
    me: true
affiliations: "Netaji Subhas University of Technology, New Delhi; Vellore Institute of Technology, Chennai"
venue: "Proceedings of the 8th Student Research Workshop associated with the International Conference on Recent Advances in Natural Language Processing (RANLP 2023)"
venue_short: "RANLP 2023 SRW"
year: 2023
date: 2023-09-04
pdf: https://aclanthology.org/2023.ranlp-stud.5.pdf
publisher_url: https://aclanthology.org/2023.ranlp-stud.5/
publisher_label: "ACL Anthology"
figure: /assets/img/papers/trigger-warnings/hero.png
figure_alt: "Framework diagram: Reddit posts collected through PRAW are parsed and cleaned, embedded with MiniLM-L6, reduced with UMAP and clustered with HDBSCAN inside BERTopic for topic modelling and keyword analysis, and combined with metadata embeddings for a classification module."
figure_caption: "Overall framework. Posts are collected from Reddit with PRAW, cleaned, and embedded with MiniLM-L6. The embeddings feed BERTopic (UMAP, HDBSCAN, c-TF-IDF) for topic modelling and keyword analysis, and are concatenated with metadata embeddings for post-intent classification."
tldr: "Trigger warnings are widely used online but there was no computational study of how users actually apply them. We build a Reddit dataset of 25,455 trigger-warning posts across self-harm, suicide, depression, and drug abuse, analyse sentiment, posting trends, and keyphrases, evaluate BERTopic topic quality, and train intent classifiers that reach F1 of 0.86-0.92."
highlights:
  - value: "25,455"
    label: "trigger-warning posts collected from Reddit"
  - value: "4"
    label: "domains: self-harm, suicide, depression, drug abuse"
  - value: "0.86-0.92"
    label: "F1 for post-intent classification"
  - value: "> 0.8"
    label: "topic diversity on every corpus"
og_image: https://manansuri.com/assets/img/papers/trigger-warnings/hero.png
---

## Abstract

Content and trigger warnings give information about the content of material prior to receiving it and are used by social media users to tag their content when discussing sensitive topics. Trigger warnings are known to yield benefits in terms of an increased individual agency to make an informed decision about engaging with content. At the same time, some studies contest the benefits of trigger warnings suggesting that they can induce anxiety and reinforce the traumatic experience of specific identities. Our study involves the analysis of the nature and implications of the usage of trigger warnings by social media users using empirical methods and machine learning. Further, we aim to study the community interactions associated with trigger warnings in online communities, precisely the diversity and content of responses and inter-user interactions. The domains of trigger warnings covered will include self-harm, drug abuse, suicide, and depression. The analysis of the above domains will assist in a better understanding of online behaviour associated with them and help in developing domain-specific datasets for further research.

## The problem

Trigger warnings let readers decide whether to engage with distressing content, but the evidence on their effect is mixed: some studies find they increase agency, others that they centre trauma and can make things worse. There is no agreed taxonomy of what deserves a warning, and no exhaustive list of triggers.

Prior computational work on trigger warnings is limited to assigning warnings to fan fiction. We were not aware of any study of how social media users themselves tag content with trigger warnings, what those posts talk about, or how communities respond. This paper is an initial study of that question, using Reddit data across four sensitive domains.

## Approach

- **Dataset.** Using the PRAW client we collected posts from r/selfharm and r/SelfHarmScars (self-harm), r/SuicideWatch (suicide), r/Depression and r/MentalHealth (depression), and r/RedditorsInRecovery (drug abuse), from 2013 to 2022. A search phrase combines trigger-warning mentions ("trigger warning", "tw", "TW", "Trigger Warning") with a curated keyword list per community, matched in the title or body. The final dataset has 4,322 self-harm, 7,090 suicide, 11,606 depression, and 2,437 drug-abuse posts, with metadata such as score, comment count, flair, and NSFW status. HTML, URLs, emoticons, and special characters are removed.
- **Exploratory analysis.** VADER sentiment over the compound score, a trend analysis of posting frequency by year, and KeyBERT keyphrase extraction (top 5 keywords per corpus by cosine similarity to the document embedding).
- **Topic modelling.** BERTopic with MiniLM-L6 embeddings, UMAP, HDBSCAN, and c-TF-IDF, evaluated with UMass, C_V, and C_UCI coherence and with topic diversity and inverted rank-biased overlap (IRBO) through the OCTIS framework.
- **Intent classification.** Link flair text (questions, advice requests, rants, and so on) is binned into semantically similar classes; untagged posts are labelled manually. Post embeddings from MiniLM-L6 are concatenated with metadata (comments, likes, score, upvote ratio) and fed to XGBoost and LightGBM classifiers under 10-fold stratified sampling with a 70:30 split.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Trigger warnings framework: Reddit posts collected with PRAW are cleaned and embedded with MiniLM-L6; the embeddings feed BERTopic for topic modelling and keyword analysis, and combine with metadata for intent classification.">
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
  <!-- 1 reddit -->
  <rect class="n" x="15" y="110" width="140" height="100" rx="10"/>
  <text class="t" x="85" y="138" text-anchor="middle" font-weight="600">Reddit posts</text>
  <text class="s" x="85" y="160" text-anchor="middle">PRAW, 2013-2022</text>
  <text class="s" x="85" y="178" text-anchor="middle">"tw" + keyword</text>
  <text class="s" x="85" y="196" text-anchor="middle">25,455 posts</text>
  <path class="flow" d="M155 160 H195"/>
  <!-- 2 clean -->
  <rect class="n acc" x="200" y="110" width="140" height="100" rx="10"/>
  <text class="t" x="270" y="138" text-anchor="middle" font-weight="600">Clean + embed</text>
  <text class="s" x="270" y="160" text-anchor="middle">strip HTML, URLs,</text>
  <text class="s" x="270" y="178" text-anchor="middle">emoticons</text>
  <text class="s" x="270" y="196" text-anchor="middle">MiniLM-L6 (384-d)</text>
  <g class="fade1"><rect class="n" x="205" y="40" width="130" height="20" rx="4"/><text class="s" x="270" y="54" text-anchor="middle">r/SuicideWatch</text></g>
  <g class="fade2"><rect class="n" x="205" y="65" width="130" height="20" rx="4"/><text class="s" x="270" y="79" text-anchor="middle">r/Depression</text></g>
  <path class="flow" d="M340 160 H380" style="animation-delay:.3s"/>
  <!-- 3 branches -->
  <rect class="n acc" x="385" y="20" width="160" height="80" rx="10"/>
  <text class="t" x="465" y="46" text-anchor="middle" font-weight="600">BERTopic</text>
  <text class="s" x="465" y="66" text-anchor="middle">UMAP + HDBSCAN</text>
  <text class="s" x="465" y="84" text-anchor="middle">+ c-TF-IDF</text>
  <rect class="n acc" x="385" y="120" width="160" height="80" rx="10"/>
  <text class="t" x="465" y="146" text-anchor="middle" font-weight="600">KeyBERT + VADER</text>
  <text class="s" x="465" y="166" text-anchor="middle">top-5 keyphrases,</text>
  <text class="s" x="465" y="184" text-anchor="middle">sentiment, trends</text>
  <rect class="n acc" x="385" y="220" width="160" height="80" rx="10"/>
  <text class="t" x="465" y="246" text-anchor="middle" font-weight="600">+ metadata</text>
  <text class="s" x="465" y="266" text-anchor="middle">comments, score,</text>
  <text class="s" x="465" y="284" text-anchor="middle">upvote ratio</text>
  <path class="flow" d="M380 160 V60 H385" style="animation-delay:.5s"/>
  <path class="flow" d="M380 160 V260 H385" style="animation-delay:.5s"/>
  <!-- 4 outputs -->
  <path class="flow" d="M545 60 H590" style="animation-delay:.8s"/>
  <path class="flow" d="M545 160 H590" style="animation-delay:.8s"/>
  <path class="flow" d="M545 260 H590" style="animation-delay:.8s"/>
  <rect class="n" x="595" y="25" width="140" height="70" rx="10"/>
  <text class="t" x="665" y="50" text-anchor="middle" font-weight="600">Topic modelling</text>
  <text class="s" x="665" y="70" text-anchor="middle">coherence, diversity</text>
  <rect class="n" x="595" y="125" width="140" height="70" rx="10"/>
  <text class="t" x="665" y="150" text-anchor="middle" font-weight="600">Keyword analysis</text>
  <text class="s" x="665" y="170" text-anchor="middle">per community</text>
  <rect class="n" x="595" y="225" width="140" height="70" rx="10"/>
  <text class="t" x="665" y="250" text-anchor="middle" font-weight="600">Intent classifier</text>
  <text class="s" x="665" y="270" text-anchor="middle">XGBoost / LightGBM</text>
  <path class="flow" d="M735 260 H775" style="animation-delay:1.1s"/>
  <g class="pulse">
    <rect class="n" x="780" y="230" width="110" height="60" rx="10"/>
    <text class="t" x="835" y="255" text-anchor="middle" font-weight="600">F1 0.86-0.92</text>
    <text class="s" x="835" y="275" text-anchor="middle">4 communities</text>
  </g>
</svg>
<div class="anim-caption">Posts tagged with trigger warnings are pulled from six subreddits, cleaned and embedded with MiniLM-L6; the same embeddings drive BERTopic topic modelling, keyphrase and sentiment analysis, and, joined with post metadata, an intent classifier.</div>
</div>

## Example

Two posts from the paper's appendix, printed there as the highest-similarity matches for the KeyBERT keywords of their community.

<div class="paper-example" markdown="1">
<span class="ex-label">Input: post from the depression corpus</span>
<div class="ex-row" markdown="1">
"I am tired of fighting. My depression, anxiety, PTSD, and being jobless are destroying me."
</div>
<span class="ex-label">Output: top KeyBERT keyword</span>
<div class="ex-row" markdown="1">
**ptsd** (similarity 0.8209), the highest-ranked keyphrase for the depression community; VADER sentiment for this community is predominantly negative.
</div>
</div>

<div class="paper-example" markdown="1">
<span class="ex-label">Input: post from the suicide corpus (trimmed)</span>
<div class="ex-row" markdown="1">
"trigger warning for mentions of suicide and sexual assault possible spoilers for cyberpunk ... im posting this here instead of on the cyberpunk subreddit because this has less to do with the game and more to do with my reaction to it ..."
</div>
<span class="ex-label">Output: top KeyBERT keyword</span>
<div class="ex-row" markdown="1">
**game** (similarity 0.8591), the highest-ranked keyphrase for the suicide community, which the paper reads as users discussing narratives from games, films, and shows rather than only personal crises.
</div>
</div>

## Results

- **Sentiment.** The drug-abuse community has a strikingly high share of positive-sentiment posts, the depression community the highest share of negative sentiment, and the suicide community the highest share of neutral posts (often discussing narratives from films or laws rather than personal crises).
- **Trends.** Trigger-warning posting rises sharply from 2019 onward in all four communities, coinciding with COVID-19 isolation.
- **Keyphrases.** Top KeyBERT terms include "fun", "anxiety", "relapse", and "blades" for self-harm; "ptsd", "desperate", "relapsed" for depression; "relapse", "craving", "withdrawal" for drug abuse; and "game", "hurts", "cut", "urgent", "help" for suicide.

| Intent classification | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|
| Self-harm, BERTopic + XGBoost | 0.895 | 0.946 | 0.835 | 0.887 |
| **Self-harm, BERTopic + LightGBM** | **0.899** | **0.948** | **0.857** | **0.900** |
| **Suicide, BERTopic + XGBoost** | **0.920** | **0.944** | **0.890** | **0.916** |
| Suicide, BERTopic + LightGBM | 0.910 | 0.948 | 0.883 | 0.914 |
| **Depression, BERTopic + XGBoost** | **0.930** | **0.947** | **0.887** | **0.912** |
| Depression, BERTopic + LightGBM | 0.920 | 0.945 | 0.879 | 0.910 |
| Drug abuse, BERTopic + XGBoost | 0.890 | 0.930 | 0.796 | 0.857 |
| **Drug abuse, BERTopic + LightGBM** | **0.900** | **0.928** | **0.798** | **0.858** |

<p class="table-note">Source: Table 4 of the paper. Multi-class post-intent classification on held-out folds (10-fold stratified sampling, 70:30 split); bold marks the better model per corpus. Higher is better.</p>

| Topic model quality | Depression | Drug abuse | Self-harm | Suicide |
|---|---|---|---|---|
| UMass coherence | -0.562 | -0.693 | -0.532 | -0.631 |
| C_V coherence | 0.563 | 0.701 | 0.567 | 0.642 |
| C_UCI coherence | 0.547 | 0.701 | 0.511 | 0.621 |
| Topic diversity | 0.800 | 0.844 | 0.878 | 0.881 |
| IRBO | 0.821 | 0.854 | 0.882 | 0.884 |

<p class="table-note">Source: Tables 2 and 3 of the paper. BERTopic with MiniLM-L6 embeddings, evaluated through OCTIS. For C_V, C_UCI, diversity, and IRBO higher is better.</p>

- **Topic quality.** Drug abuse has the highest coherence (C_V 0.701, C_UCI 0.701), followed by suicide (C_V 0.642). Topic diversity is above 0.8 on every corpus, with IRBO between 0.821 and 0.884, so the topics are distinct and cover a wide range of themes.
- **Classification.** BERTopic embeddings plus XGBoost or LightGBM reach accuracy of 0.89-0.93 and F1 of 0.86-0.92 across the four communities, with the two gradient-boosting models performing evenly.

### Dataset

| | Self-harm | Suicide | Depression | Drug abuse |
|---|---|---|---|---|
| Posts | 4,322 | 7,090 | 11,606 | 2,437 |
| Average sentences per post | 4.70 | 6.55 | 7.54 | 8.09 |
| Mean proportion of unique tokens | 0.653 | 0.651 | 0.509 | 0.562 |

<p class="table-note">Source: Table 1 of the paper. Posts collected from r/selfharm, r/SelfHarmScars, r/SuicideWatch, r/Depression, r/MentalHealth, and r/RedditorsInRecovery, 2013-2022, with metadata (score, comment count, flair, NSFW flag).</p>

The paper states that the dataset will be released after acceptance. Future work named in the paper includes extending to Twitter, other languages, audio-visual modalities, and demographic analysis.

## Resources

- Paper: [ACL Anthology](https://aclanthology.org/2023.ranlp-stud.5/) · [PDF](https://aclanthology.org/2023.ranlp-stud.5.pdf) · [DOI 10.26615/issn.2603-2821.2023_005](https://doi.org/10.26615/issn.2603-2821.2023_005)
- Tools used: [PRAW](https://praw.readthedocs.io/en/stable/), [BERTopic](https://github.com/MaartenGr/BERTopic), [KeyBERT](https://github.com/MaartenGr/KeyBERT), [OCTIS](https://github.com/MIND-Lab/OCTIS)
- Related: [Multimodal depression detection from Twitter data](/papers/depression-twitter-multimodal/)
- [All publications](/publications/)
