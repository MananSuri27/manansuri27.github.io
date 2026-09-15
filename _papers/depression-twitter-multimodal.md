---
layout: paper
title: "Multimodal Analysis and Modality Fusion for Detection of Depression from Twitter Data"
short_title: "Multimodal Depression Detection"
description: "AI4SG at AAAI 2023: fusing Doc2Vec tweet features with EfficientNetV2 image features detects depression at 99.3% accuracy, 17.36 points above text alone."
bibkey: semwal2023multimodal
authors:
  - name: Nalin Semwal
  - name: Manan Suri
    url: /
    me: true
  - name: Divya Chaudhary
    url: https://www.khoury.northeastern.edu/people/divya-chaudhary/
  - name: Ian Gorton
    url: https://www.khoury.northeastern.edu/people/ian-gorton/
  - name: Bijendra Kumar
    url: http://nsut.ac.in/en/node/242
affiliations: "Netaji Subhas University of Technology, New Delhi; Khoury College of Computer Sciences, Northeastern University, Seattle"
venue: "AI4SG: Workshop on Artificial Intelligence for Social Good at AAAI 2023"
venue_short: "AI4SG @ AAAI 2023"
year: 2023
date: 2023-02-13
pdf: https://amulyayadav.github.io/AI4SG2023/images/31.pdf
publisher_url: https://amulyayadav.github.io/AI4SG2023/
publisher_label: "Workshop page"
figure: /assets/img/papers/depression-twitter-multimodal/hero.png
figure_alt: "Modality fusion concept: an image passes through a CNN and text through Doc2Vec feature extraction; the two feature vectors are concatenated and fed to a dense network with two outputs."
figure_caption: "The early-fusion model. Profile or background images are encoded by an EfficientNetV2 CNN and tweets by Doc2Vec; the concatenated 2304-unit vector is classified by a two-layer dense network."
tldr: "Tweets and profile images each carry signal about depression, but they are usually modelled separately. On over 10 million tweets and roughly 10,000 images from self-reported diagnosed and control users, an early-fusion model combining Doc2Vec text features with EfficientNetV2 image features reaches 99.3% accuracy, 17.36 points above the best text-only model and 35.99 points above the best image-only model."
highlights:
  - value: "99.3%"
    label: "accuracy of the fusion model"
  - value: "+17.36 pts"
    label: "over the best text-only model"
  - value: "+35.99 pts"
    label: "over the best image-only model"
  - value: "10M+"
    label: "tweets from 5,243 users"
og_image: https://manansuri.com/assets/img/papers/depression-twitter-multimodal/hero.png
---

## Abstract

It is established that social media is not only a possible cause of mental health disorders, but a strong indicator. Great predictive information is contained in both text posts and images posted, which can be exploited by classification models. In this work, we evaluate and compare a number of different approaches to the detection of depression from social media activity. We use publicly available twitter posts and profile and background images as our predictive features. We test classical machine learning approaches, sequential models such as LSTMs, and Convolutional Neural Networks. Additionally, we implement and test a modality fusion model which fuses textual and image-based features to achieve greater accuracy. This fusion model outperforms the best textual and image models tested by a full 17.36 percentage points and 35.99 percentage points respectively, indicating that the information contained in text and images is complementary and is best exploited in conjunction.

## The problem

Posts on Twitter and Reddit are an established indicator of depression, and most detection work encodes text into fixed-length vectors and applies classifiers such as logistic regression or random forests. Profile and background images have been used less often, though they too carry information about mental health.

Two questions were open when we did this work: whether richer text representations (Word2Vec, Doc2Vec) and sequential models (LSTMs, GRUs) help, and whether fusing text with images gives a better classifier than either modality alone. This paper runs both comparisons on a large, newly collected dataset.

## Approach

- **Dataset.** We collected tweets from 1 January 2017 to 1 June 2022 matching self-diagnosis patterns such as "i have/was (just) (been) diagnosed with depression". After removing retweets, duplicates, users with fewer than 100 tweets, and users without a profile or background image, the Diagnosis group has 2,970 users and 6.1 million tweets. A Control group was built from tweets containing "the" on a single day (1 June 2022), filtered the same way with overlapping users removed, giving 2,273 users and 4.6 million tweets. Profile and background images were resized to 512x512. Data was anonymised and is not released.
- **Text features and models.** After tokenisation, stop-word removal, lemmatisation, and stemming, we compare TF-IDF character 2/4-grams and word 1/2/3-grams with logistic regression, ridge classifiers, gradient boosted trees, random forests, and a two-hidden-layer ANN (256 and 32 neurons, dropout 0.2). We also train the ANN on Doc2Vec vectors and a three-layer bidirectional LSTM with 1D convolution on Word2Vec (skip-gram) embeddings.
- **Image models.** EfficientNetV2 backbones (B0, S, B3, M) pretrained on ImageNet, frozen, with a single sigmoid dense layer fine-tuned for 20 epochs.
- **Modality fusion.** Following Gallo et al. (2020), an early-fusion model concatenates the 1024-unit Doc2Vec vector of a tweet with the 1280-unit flattened EfficientNetV2 feature map of the author's profile image (and separately the background image), giving 2304-unit inputs to a two-hidden-layer ANN trained for 50 epochs.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Early-fusion pipeline: a tweet is encoded by Doc2Vec into 1024 units and the author's profile or background image by a frozen EfficientNetV2 into 1280 units; the concatenated 2304-unit vector feeds a two-layer dense network that predicts depression versus control.">
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
  <rect class="n" x="15" y="50" width="140" height="80" rx="10"/>
  <text class="t" x="85" y="78" text-anchor="middle" font-weight="600">Tweet text</text>
  <text class="s" x="85" y="98" text-anchor="middle">tokenised, stemmed</text>
  <text class="s" x="85" y="116" text-anchor="middle">10M+ tweets</text>
  <rect class="n" x="15" y="190" width="140" height="80" rx="10"/>
  <text class="t" x="85" y="218" text-anchor="middle" font-weight="600">Profile image</text>
  <text class="s" x="85" y="238" text-anchor="middle">or background image</text>
  <text class="s" x="85" y="256" text-anchor="middle">512 x 512</text>
  <path class="flow" d="M155 90 H205"/>
  <path class="flow" d="M155 230 H205" style="animation-delay:.2s"/>
  <!-- encoders -->
  <rect class="n acc" x="210" y="40" width="160" height="100" rx="10"/>
  <text class="t" x="290" y="68" text-anchor="middle" font-weight="600">Doc2Vec</text>
  <text class="s" x="290" y="90" text-anchor="middle">document embedding</text>
  <text class="s" x="290" y="108" text-anchor="middle">1024 units</text>
  <rect class="n acc" x="210" y="180" width="160" height="100" rx="10"/>
  <text class="t" x="290" y="208" text-anchor="middle" font-weight="600">EfficientNetV2</text>
  <text class="s" x="290" y="230" text-anchor="middle">ImageNet weights, frozen</text>
  <text class="s" x="290" y="248" text-anchor="middle">pooled + flattened: 1280</text>
  <!-- concat -->
  <path class="flow" d="M370 90 H440 V144" style="animation-delay:.4s"/>
  <path class="flow" d="M370 230 H440 V176" style="animation-delay:.4s"/>
  <g class="pulse">
    <circle class="n acc" cx="440" cy="160" r="16"/>
    <path class="n acc" d="M432 160 H448 M440 152 V168"/>
  </g>
  <text class="s" x="440" y="254" text-anchor="middle">concat</text>
  <text class="s" x="440" y="270" text-anchor="middle">2304 units</text>
  <path class="flow" d="M456 160 H500" style="animation-delay:.7s"/>
  <!-- dense -->
  <rect class="n acc" x="505" y="100" width="170" height="120" rx="10"/>
  <text class="t" x="590" y="128" text-anchor="middle" font-weight="600">Dense classifier</text>
  <text class="s" x="590" y="150" text-anchor="middle">256 -> 32 -> 2</text>
  <text class="s" x="590" y="168" text-anchor="middle">softmax, dropout 0.2</text>
  <text class="s" x="590" y="186" text-anchor="middle">Adam, lr 0.001</text>
  <text class="s" x="590" y="204" text-anchor="middle">50 epochs, batch 32</text>
  <path class="flow" d="M675 160 H720" style="animation-delay:1s"/>
  <!-- output -->
  <rect class="n" x="725" y="110" width="165" height="100" rx="10"/>
  <text class="t" x="807" y="138" text-anchor="middle" font-weight="600">Depression /</text>
  <text class="t" x="807" y="156" text-anchor="middle" font-weight="600">control</text>
  <text class="s" x="807" y="178" text-anchor="middle">99.3% accuracy</text>
  <text class="s" x="807" y="196" text-anchor="middle">F1 95.61, AUC 93.2</text>
</svg>
<div class="anim-caption">Each tweet is embedded by Doc2Vec and the author's profile (or background) image by a frozen EfficientNetV2; the concatenated 2304-unit vector is classified by a small dense network, and the two modalities together far outperform either alone.</div>
</div>

## Results

| Type | Model | Feature | Accuracy | F1 | AUC |
|---|---|---|---|---|---|
| Classical | Logistic regression | Character 4-gram | 62.90% | 63.13% | 68.24% |
| Classical | Gradient boosted trees | Word 1-gram | 70.46% | 68.40% | 72.83% |
| Classical | Random forest | Character 4-gram | 71.14% | 69.03% | 72.40% |
| Classical | ANN | Character 4-gram | 81.94% | 92.10% | 83.43% |
| Classical | ANN | Doc2Vec vectors | 64.30% | 63.32% | 70.47% |
| Sequential | Bidirectional LSTM | Word2Vec vectors | 64.93% | 65.04% | 71.04% |
| Image | EfficientNetV2B0 | Images | 59.88% | 62.12% | 57.76% |
| Image | EfficientNetV2M | Images | 63.31% | 68.50% | 63.10% |
| **Fusion** | **CNN + ANN** | **Doc2Vec + EfficientNetV2B0 feature map** | **99.30%** | **95.61%** | **93.20%** |

<p class="table-note">Source: Table 1 of the paper; the best feature set is shown for each classical model. Held-out validation split (1% of the more than 10 million tweets). Higher is better.</p>

- **Text-only models.** The ANN on character 4-grams is the best text-only model at 81.94% accuracy (F1 92.1%), followed by the ANN on character 2-grams at 81.3%. Richer embeddings on their own do not beat TF-IDF here: the ANN on Doc2Vec vectors reaches 64.3% and the bidirectional LSTM on Word2Vec embeddings 64.93% (63.01% with pre-processed text).
- **Image-only models.** The best CNN, EfficientNetV2M, reaches 63.31% accuracy, comparable to or better than several text-only models, confirming that profile and background images carry substantial signal.
- **Modality fusion.** Doc2Vec features plus the EfficientNetV2B0 feature map reach 99.3% accuracy, 95.61% F1, and 93.2% AUC, 17.36 percentage points above the best text model and 35.99 above the best image model. The information in the two modalities is complementary and is best exploited together.

### Dataset

| Group | Users | Tweets | Images | Collection rule |
|---|---|---|---|---|
| Diagnosis | 2,970 | 6.1 million | profile + background per user | self-reported depression diagnosis, 1 Jan 2017 to 1 Jun 2022 |
| Control | 2,273 | 4.6 million | profile + background per user | tweets containing "the" on 1 Jun 2022, no overlap with Diagnosis |

<p class="table-note">Source: the Dataset section of the paper. Both groups drop retweets, duplicates, users with fewer than 100 tweets, and users without a profile or background image; images are resized to 512x512. In total over 10 million tweets and roughly 10,000 images. The data were anonymised and kept private.</p>

## Resources

- Paper: [PDF](https://amulyayadav.github.io/AI4SG2023/images/31.pdf) · [AI4SG 2023 workshop page](https://amulyayadav.github.io/AI4SG2023/)
- Related: [Trigger Warnings](/papers/trigger-warnings/), our RANLP 2023 study of user-tagged trigger warnings on Reddit; [WADER](/papers/wader/), with the same advisors
- [All publications](/publications/)
