---
layout: paper
title: "The Geometry of Multilingual Language Models: A Fairness Lens"
short_title: "Multilingual Geometry"
description: "ICLR 2023 Tiny Papers: mBERT, MiniLM, and XLM-R represent languages in separable subspaces, and low-resource languages are represented worse."
bibkey: shah2023the
authors:
  - name: Cheril Shah
  - name: Yashashree Chandak
  - name: Manan Suri
    url: /
    me: true
venue: "ICLR 2023 Tiny Papers Track"
venue_short: "ICLR 2023 Tiny Papers"
year: 2023
date: 2023-05-13
arxiv: "2305.07839"
publisher_url: https://openreview.net/forum?id=dGuMR8tLDs
publisher_label: "OpenReview"
figure: /assets/img/papers/multilingual-geometry-fairness/hero.png
figure_alt: "Three panels for mBERT: a 3D PCA scatter of Arabic, German, English, Hindi, and Urdu sentence embeddings forming separate clusters; a heatmap of the Cross-lingual Similarity Index between 15 languages; and a heatmap of the Geometric Separability Index between language pairs, mostly near 1."
figure_caption: "mBERT on 300 parallel XNLI sentences in 15 languages. Left: top-3 PCA components for Hindi, Urdu, German, English, and Arabic. Middle: Cross-lingual Similarity Index (Gamma) between language pairs. Right: Geometric Separability Index (Phi), which is close to 1 for almost every pair."
tldr: "Multilingual encoders are supposed to share one embedding space across languages, but we find each language occupies its own geometry: language pairs are almost perfectly separable, similarity is highest within language families and for high-resource languages, and low-resource languages such as Swahili and Urdu are represented worse in all three models studied."
og_image: https://manansuri.com/assets/img/papers/multilingual-geometry-fairness/hero.png
---

## Abstract

Understanding the representations of different languages in multilingual language models is essential for comprehending their cross-lingual properties, predicting their performance on downstream tasks, and identifying any biases across languages. In our study, we analyze the geometry of three multilingual language models in Euclidean space and find that all languages are represented by unique geometries. Using a geometric separability index we find that although languages tend to be closer according to their linguistic family, they are almost separable with languages from other families. We also introduce a Cross-Lingual Similarity Index to measure the distance of languages with each other in the semantic space. Our findings indicate that the low-resource languages are not represented as good as high resource languages in any of the models.

## The problem

Multilingual transformers such as mBERT and XLM-R are trained on many languages in a single model, and a common assumption is that they form an interlingua: translations of the same sentence land near each other in a shared space. Whether that actually holds, and whether it holds equally for high- and low-resource languages, matters for cross-lingual transfer and for fairness across languages.

Measuring this is not straightforward. Models like XLM-R are highly anisotropic (any two random embeddings already have high cosine similarity), so raw cosine similarity between languages is hard to interpret.

## Approach

We take 300 parallel sentences from XNLI-15way across 15 languages (English, French, Spanish, German, Greek, Bulgarian, Russian, Turkish, Arabic, Vietnamese, Thai, Chinese, Hindi, Swahili, Urdu) and embed them with three multilingual models: bert-base-multilingual-cased (mBERT), Multilingual-MiniLM-L12-H384, and xlm-roberta-base. We study the geometry with three tools:

- **PCA visualisation.** The top three principal components of the embeddings for a group of languages, plotted in 3D.
- **Cross-lingual Similarity Index (Gamma).** For a language pair, the mean cosine similarity between embeddings of parallel sentences, divided by the model's anisotropy (the average cosine similarity between randomly sampled sentence pairs). Values near 1/Anisotropy mean the languages share a region of the space; values at or below 1 mean the pair is no closer than random sentences.
- **Language Separability (Phi).** Treating each language as a cluster, the pairwise Geometric Separability Index, which measures how often a point's nearest neighbour has the same language label.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Analysis pipeline: 300 parallel XNLI sentences in 15 languages are embedded by mBERT, MiniLM and XLM-R; per-language embeddings are compared with PCA, the cross-lingual similarity index and the geometric separability index to compare how fairly languages are represented.">
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
  <!-- 1 data -->
  <rect class="n" x="15" y="110" width="140" height="100" rx="10"/>
  <text class="t" x="85" y="138" text-anchor="middle" font-weight="600">XNLI-15way</text>
  <text class="s" x="85" y="160" text-anchor="middle">300 parallel</text>
  <text class="s" x="85" y="178" text-anchor="middle">sentences x</text>
  <text class="s" x="85" y="196" text-anchor="middle">15 languages</text>
  <path class="flow" d="M155 160 H195"/>
  <!-- 2 models -->
  <rect class="n acc" x="200" y="95" width="150" height="130" rx="10"/>
  <text class="t" x="275" y="122" text-anchor="middle" font-weight="600">Multilingual</text>
  <text class="t" x="275" y="140" text-anchor="middle" font-weight="600">encoder</text>
  <text class="s" x="275" y="164" text-anchor="middle">mBERT</text>
  <text class="s" x="275" y="182" text-anchor="middle">Multilingual MiniLM</text>
  <text class="s" x="275" y="200" text-anchor="middle">XLM-R base</text>
  <path class="flow" d="M350 160 H390" style="animation-delay:.3s"/>
  <!-- 3 per-language embeddings -->
  <rect class="n acc" x="395" y="95" width="150" height="130" rx="10"/>
  <text class="t" x="470" y="122" text-anchor="middle" font-weight="600">Per-language</text>
  <text class="t" x="470" y="140" text-anchor="middle" font-weight="600">embeddings</text>
  <g class="pulse">
    <circle cx="430" cy="175" r="4" fill="#B509AC"/><circle cx="440" cy="185" r="4" fill="#B509AC"/><circle cx="436" cy="168" r="4" fill="#B509AC"/>
    <circle class="n" cx="480" cy="195" r="4"/><circle class="n" cx="490" cy="188" r="4"/><circle class="n" cx="485" cy="205" r="4"/>
    <circle class="n" cx="510" cy="165" r="4" stroke-dasharray="2 2"/><circle class="n" cx="520" cy="175" r="4" stroke-dasharray="2 2"/><circle class="n" cx="512" cy="182" r="4" stroke-dasharray="2 2"/>
  </g>
  <text class="s" x="470" y="218" text-anchor="middle">one cluster per language</text>
  <!-- 4 measures -->
  <path class="flow" d="M545 130 H585" style="animation-delay:.6s"/>
  <path class="flow" d="M545 160 H585" style="animation-delay:.7s"/>
  <path class="flow" d="M545 190 H585" style="animation-delay:.8s"/>
  <rect class="n acc" x="590" y="30" width="150" height="70" rx="10"/>
  <text class="t" x="665" y="55" text-anchor="middle" font-weight="600">PCA (top 3)</text>
  <text class="s" x="665" y="75" text-anchor="middle">where each language sits</text>
  <rect class="n acc" x="590" y="125" width="150" height="70" rx="10"/>
  <text class="t" x="665" y="150" text-anchor="middle" font-weight="600">Similarity (Gamma)</text>
  <text class="s" x="665" y="170" text-anchor="middle">mean cosine / anisotropy</text>
  <rect class="n acc" x="590" y="220" width="150" height="70" rx="10"/>
  <text class="t" x="665" y="245" text-anchor="middle" font-weight="600">Separability (Phi)</text>
  <text class="s" x="665" y="265" text-anchor="middle">nearest-neighbour label</text>
  <path class="flow" d="M585 130 V65 H590" style="animation-delay:.6s"/>
  <path class="flow" d="M585 190 V255 H590" style="animation-delay:.8s"/>
  <!-- 5 fairness -->
  <path class="flow" d="M740 65 H775 V160" style="animation-delay:1s"/>
  <path class="flow" d="M740 160 H775" style="animation-delay:1s"/>
  <path class="flow" d="M740 255 H775 V160" style="animation-delay:1s"/>
  <rect class="n" x="780" y="110" width="110" height="100" rx="10"/>
  <text class="t" x="835" y="138" text-anchor="middle" font-weight="600">Fairness</text>
  <text class="t" x="835" y="156" text-anchor="middle" font-weight="600">comparison</text>
  <text class="s" x="835" y="178" text-anchor="middle">high vs. low</text>
  <text class="s" x="835" y="196" text-anchor="middle">resource, families</text>
</svg>
<div class="anim-caption">Three hundred parallel XNLI sentences in 15 languages are embedded by each model; the per-language clusters are compared with PCA, the Cross-lingual Similarity Index (Gamma), and the Geometric Separability Index (Phi) to see which languages the model represents well.</div>
</div>

## Results

- **Distinct geometries.** In mBERT the languages occupy clearly different orientations in PCA space. MiniLM and XLM-R embeddings are more compact because of high anisotropy, but languages still sit on different affine regions. In XLM-R, low-resource languages such as Urdu and Swahili are noticeably more dispersed than high-resource ones.
- **Similarity follows resources and families.** Gamma should be close to 1/Anisotropy for perfect translations, but it is not: it is higher for high-resource languages and for languages in the same family, consistent with a model that first represents a language in isolation and only contextualises it against others as it sees more text. Pre-training also matters; English has high Gamma in XLM-R, plausibly because of its cross-lingual pre-training.
- **Near-separable subspaces.** For mBERT and XLM-R, Phi between language clusters is extremely high, so languages form near-isolated vector spaces rather than an interlingua. MiniLM is the partial exception: Germanic, Romance, Slavic, and Hellenic languages are assimilated (low Phi), but other families are not.
- **Fairness implication.** Low average Gamma for low-resource languages points to a shortcoming in cross-lingual capability and a heavy dependence on data volume. High Phi within families suggests that separable language subspaces are easy to learn, but some intersection is needed for cross-lingual transfer, in line with prior findings that language distance in embedding space correlates with transfer performance.

| Language (family) | Gamma with English | Phi vs. English |
|---|---|---|
| German (Germanic) | 1.596 | 0.90 |
| Spanish (Romance) | 1.591 | 0.90 |
| French (Romance) | 1.574 | 0.91 |
| Russian (Slavic) | 1.496 | 0.97 |
| Vietnamese (Vietic) | 1.474 | 0.95 |
| Bulgarian (Slavic) | 1.410 | 0.97 |
| Greek (Hellenic) | 1.351 | 0.97 |
| Turkish (Turkic) | 1.283 | 0.95 |
| Arabic (Arabic) | 1.272 | 0.99 |
| Hindi (Hindustani) | 1.237 | 0.99 |
| Urdu (Hindustani) | 1.174 | 0.99 |
| Thai (Tai) | 1.096 | 0.97 |
| Swahili (Niger-Congo) | 1.048 | 0.97 |
| Chinese (Chinese) | 0.607 | 0.98 |

<p class="table-note">Source: Figure 1 (b, c) and Table 1 of the paper, mBERT. Gamma is the mean cosine similarity of parallel sentences divided by the model's anisotropy; its ceiling for mBERT is 1/Anisotropy = 2.456, and a value at or below 1 means the pair is no closer than random sentences. Phi is the Geometric Separability Index between the two language clusters (1 = fully separable). Higher Gamma and lower Phi indicate a more shared representation.</p>

| Model | 1/Anisotropy (ceiling of Gamma) |
|---|---|
| mBERT (bert-base-multilingual-cased) | 2.456 |
| Multilingual-MiniLM-L12-H384 | 1.12 |
| XLM-R (xlm-roberta-base) | 1.019 |

<p class="table-note">Source: diagonal of the Gamma heatmaps in Figures 1 and 2 of the paper. A ceiling close to 1 means the model is highly anisotropic: random sentence pairs already have cosine similarity near 1, which is why Gamma rather than raw cosine similarity is used to compare languages.</p>

## Resources

- Paper: [OpenReview](https://openreview.net/forum?id=dGuMR8tLDs) · [arXiv:2305.07839](https://arxiv.org/abs/2305.07839) · [Hugging Face papers](https://huggingface.co/papers/2305.07839) (the arXiv version carries the subtitle "An Equality Lens")
- Data: [XNLI](https://github.com/facebookresearch/XNLI) (Conneau et al., 2018)
- Models: [bert-base-multilingual-cased](https://huggingface.co/bert-base-multilingual-cased), [xlm-roberta-base](https://huggingface.co/xlm-roberta-base), [Multilingual-MiniLM-L12-H384](https://huggingface.co/microsoft/Multilingual-MiniLM-L12-H384)
- Related: [WADER](/papers/wader/), our SemEval-2023 work on multilingual tweet intimacy with XLM-RoBERTa
- [All publications](/publications/)
