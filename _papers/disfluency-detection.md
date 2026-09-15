---
layout: paper
title: "A novel multimodal dynamic fusion network for disfluency detection in spoken utterances"
short_title: "MDFN"
description: "MDFN fuses BERT and wav2vec 2.0 features through cross-modal encoders for span-level disfluency detection, reaching 95.7 F1 on Switchboard (arXiv 2022)."
bibkey: ghosh2022novel
authors:
  - name: Sreyan Ghosh
    url: https://sreyan88.github.io/
    equal: true
  - name: Utkarsh Tyagi
    equal: true
  - name: Sonal Kumar
    equal: true
  - name: Manan Suri
    url: /
    me: true
    equal: true
  - name: Rajiv Ratn Shah
    url: https://www.iiitd.ac.in/rajivratn
affiliations: "University of Maryland, College Park; MIDAS Labs, IIIT-Delhi; Cisco Systems, Bangalore; Netaji Subhas University of Technology"
venue: "arXiv preprint"
venue_short: "arXiv 2022"
year: 2022
date: 2022-11-27
arxiv: "2211.14700"
pdf: https://arxiv.org/pdf/2211.14700
figure: /assets/img/papers/disfluency-detection/hero.png
figure_alt: "Architecture diagram of MDFN: a pre-trained text encoder and a pre-trained acoustic encoder feed three cross-modal encoder blocks; the resulting speech-aware word representation and gated word-aware speech representation are concatenated and passed to an endpoint span extractor and span classifier."
figure_caption: "The MDFN architecture. Cross-modal encoders A and B produce speech-aware word representations (R); encoder C produces word-aware speech representations (Q), which are scaled by an acoustic gate (E). The concatenated representation feeds an endpoint span extractor with length and morph embeddings, followed by a span classifier."
tldr: "Disfluency detection is usually treated as a text-only tagging task even though disfluencies originate in speech. MDFN adds a small multimodal interaction module over BERT and wav2vec 2.0 to fuse text and acoustic cues, and reaches 95.7 F1 on the English Switchboard test set, 1.5 points above the previous state of the art."
highlights:
  - value: "95.7"
    label: "F1 on Switchboard test set"
  - value: "+1.5 pts"
    label: "F1 over prior state of the art"
  - value: "98.7"
    label: "recall on disfluent spans"
og_image: https://manansuri.com/assets/img/papers/disfluency-detection/hero.png
---

## Abstract

Disfluency, though originating from human spoken utterances, is primarily studied as a uni-modal text-based Natural Language Processing (NLP) task. Based on early-fusion and self-attention-based multimodal interaction between text and acoustic modalities, in this paper, we propose a novel multimodal architecture for disfluency detection from individual utterances. Our architecture leverages a multimodal dynamic fusion network that adds minimal parameters over an existing text encoder commonly used in prior art to leverage the prosodic and acoustic cues hidden in speech. Through experiments, we show that our proposed model achieves state-of-the-art results on the widely used English Switchboard for disfluency detection and outperforms prior unimodal and multimodal systems in literature by a significant margin. In addition, we make a thorough qualitative analysis and show that, unlike text-only systems, which suffer from spurious correlations in the data, our system overcomes this problem through additional cues from speech signals.

## The problem

When people speak, they repeat, restart, and correct themselves. A disfluency has a reparandum (the part to remove), an optional interregnum such as "uh", and a repair. Detecting and removing reparandums matters because language understanding systems trained on fluent text are easily misled by disfluent input.

Most state-of-the-art systems on the Switchboard corpus tag disfluencies from transcripts alone. Text carries rich semantics and syntax, but disfluency originates in speech, and cues such as prosody, pitch and stutter are ignored. The few systems that did use speech relied on hand-engineered acoustic features and simple concatenation with text features, which cannot capture fine-grained interactions between the two modalities.

## Approach

**Contextualised representations.** The transcript is encoded with BERT-base, giving a 768-dimensional embedding per token. The raw audio is encoded with wav2vec 2.0 (the robust wav2vec 2.0-large fine-tuned on Switchboard), giving a 768-dimensional embedding per frame. No hand-crafted acoustic features are needed.

**Multimodal Interaction Module (MMI).** Three Cross-Modal Encoder (CME) blocks, each a transformer layer built around cross-modal attention, align the two streams:

- **Speech-aware word representations:** block A uses the speech embeddings as queries and token embeddings as keys and values; block B then uses the original tokens as queries over that output, so the result R is indexed by word rather than by frame.
- **Word-aware speech representations:** block C uses the token embeddings as queries and the speech embeddings as keys and values, giving Q.
- **Acoustic gate:** a sigmoid gate computed from [R; Q] scales Q so that redundant or noisy speech frames contribute less.

**Span classification.** R and Q are concatenated into the final representation M. Instead of tagging tokens, the model enumerates candidate spans up to a maximum length and classifies each as disfluent or fluent from the concatenation of its start-token representation, end-token representation and a learned length embedding, followed by the heuristic decoding of prior span-classification work.

**Training.** Models are implemented in PyTorch with HuggingFace checkpoints and trained for 20 epochs with batch size 32 and Adam at a learning rate of 1e-5. Data follows the standard Switchboard split, with lowercasing and removal of punctuation and partial words.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A transcript is encoded by BERT and the audio by wav2vec 2.0; three cross-modal encoders align the streams, an acoustic gate fuses them dynamically, and a span extractor labels disfluent spans.">
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
  <rect class="n" x="20" y="50" width="130" height="62" rx="8"/>
  <text class="t" x="85" y="76" text-anchor="middle">Transcript</text>
  <text class="s" x="85" y="96" text-anchor="middle">tokens w1 … wM</text>
  <rect class="n" x="20" y="208" width="130" height="62" rx="8"/>
  <text class="t" x="85" y="234" text-anchor="middle">Audio</text>
  <text class="s" x="85" y="254" text-anchor="middle">raw waveform</text>
  <!-- encoders -->
  <rect class="n" x="200" y="50" width="140" height="62" rx="8"/>
  <text class="t" x="270" y="76" text-anchor="middle">BERT-base</text>
  <text class="s" x="270" y="96" text-anchor="middle">768-d per token</text>
  <rect class="n" x="200" y="208" width="140" height="62" rx="8"/>
  <text class="t" x="270" y="234" text-anchor="middle">wav2vec 2.0</text>
  <text class="s" x="270" y="254" text-anchor="middle">768-d per frame</text>
  <!-- cross-modal encoders -->
  <rect class="n acc" x="400" y="40" width="190" height="240" rx="10" stroke-width="2"/>
  <text class="t" x="495" y="66" text-anchor="middle">Cross-modal</text>
  <text class="t" x="495" y="84" text-anchor="middle">encoders</text>
  <g class="pulse">
    <rect class="n" x="416" y="100" width="158" height="66" rx="6"/>
    <text class="s" x="495" y="120" text-anchor="middle">A, B: speech-aware</text>
    <text class="s" x="495" y="136" text-anchor="middle">word representation</text>
    <text class="t" x="495" y="156" text-anchor="middle">R</text>
  </g>
  <g class="pulse d2">
    <rect class="n" x="416" y="180" width="158" height="66" rx="6"/>
    <text class="s" x="495" y="200" text-anchor="middle">C: word-aware</text>
    <text class="s" x="495" y="216" text-anchor="middle">speech representation</text>
    <text class="t" x="495" y="236" text-anchor="middle">Q</text>
  </g>
  <text class="s" x="495" y="268" text-anchor="middle">cross-modal attention</text>
  <!-- dynamic fusion -->
  <rect class="n" x="640" y="100" width="110" height="120" rx="8"/>
  <text class="t" x="695" y="128" text-anchor="middle">Dynamic</text>
  <text class="t" x="695" y="146" text-anchor="middle">fusion</text>
  <text class="s" x="695" y="172" text-anchor="middle">gate σ([R;Q])</text>
  <text class="s" x="695" y="190" text-anchor="middle">M = [R ; g⊙Q]</text>
  <!-- span extraction -->
  <rect class="n" x="780" y="100" width="100" height="120" rx="8"/>
  <text class="t" x="830" y="128" text-anchor="middle">Span</text>
  <text class="t" x="830" y="146" text-anchor="middle">extraction</text>
  <text class="s" x="830" y="172" text-anchor="middle">start, end,</text>
  <text class="s" x="830" y="188" text-anchor="middle">length emb.</text>
  <text class="s" x="830" y="206" text-anchor="middle">disfluent?</text>
  <!-- flows -->
  <path class="flow" d="M150,81 L198,81" marker-end="url(#ah)"/>
  <path class="flow" d="M150,239 L198,239" marker-end="url(#ah)"/>
  <path class="flow d1" d="M340,81 L398,81" marker-end="url(#ah)"/>
  <path class="flow d1" d="M340,239 L398,239" marker-end="url(#ah)"/>
  <path class="flow d2" d="M590,160 L638,160" marker-end="url(#ah)"/>
  <path class="flow d3" d="M750,160 L778,160" marker-end="url(#ah)"/>
  <text class="s fade1" x="370" y="160" text-anchor="middle">queries ↔ keys</text>
</svg>
<div class="anim-caption">MDFN encodes the transcript with BERT and the audio with wav2vec 2.0, aligns the two streams with three cross-modal encoders, fuses them through an acoustic gate, and classifies candidate spans as fluent or disfluent.</div>
</div>

## Example

Disfluencies come in five types. In the paper's notation the reparandum sits before the "+", an optional interregnum in braces, and the repair after it; detection means finding the reparandum spans.

<div class="paper-example" markdown="1">
<span class="ex-label">Input (disfluent utterances, Switchboard)</span>
<div class="ex-row">Repair: "[i do + i] ski yes"</div>
<div class="ex-row">Repetition: "but [i + i] grew up with cats"</div>
<div class="ex-row">Restart: "[you were + {uh}] he was waiting for what again"</div>
<div class="ex-row">Deletion: "[i that it just +] you know it's absolutely devastating"</div>
<div class="ex-row">Substitution: "the pen was kept [under + over] the table"</div>
<span class="ex-label">Output (spans to remove)</span>
<div class="ex-row">The bracketed reparandum before each "+" is the disfluent span: <span class="ex-bad">i do</span>, <span class="ex-bad">i</span>, <span class="ex-bad">you were</span>, <span class="ex-bad">i that it just</span>, <span class="ex-bad">under</span>.</div>
</div>

Where the acoustic modality pays off: two test utterances from the paper's qualitative analysis that the text-only state of the art marks as disfluent but that are fluent according to the ground truth.

<div class="paper-example" markdown="1">
<span class="ex-label">Input</span>
<div class="ex-row">1. "i finally got impaneled on one case on my next to the last day"</div>
<div class="ex-row">2. "and that is that money tends to stick where it lands first"</div>
<span class="ex-label">Output</span>
<div class="ex-row">Text-only Span Classification BERT-GCN: flags <span class="ex-bad">"on my"</span> in 1 and <span class="ex-bad">"that is"</span> in 2 as disfluent, reading the repeated "on" and "that" as repetitions.</div>
<div class="ex-row">MDFN (text + speech): <span class="ex-good">both utterances fluent</span>, matching the ground truth. The confidence and tone of the speaker in the audio reveal that these are ordinary, if loosely grammatical, sentences rather than restarts.</div>
</div>

## Results

Evaluation on the English Switchboard test set under the IO tagging scheme:

| Model | Precision | Recall | F1 |
|---|---|---|---|
| Self-trained | 87.5 | 93.8 | 90.6 |
| EGBC | 95.7 | 88.3 | 91.8 |
| BERT fine-tune | 94.7 | 89.8 | 92.2 |
| BERT-CRF-Aux | 94.6 | 91.2 | 92.9 |
| ELECTRA-CRF-Aux | 94.8 | 91.6 | 93.1 |
| Span Classification BERT-GCN | 95.2 | 93.2 | 94.2 |
| BERT span classifier (text-only baseline) | 95.1 | 93.0 | 94.1 |
| **MDFN (ours)** | **92.8** | **98.7** | **95.7** |

<p class="table-note">Source: Table 2 of the paper (8 of its 13 rows; earlier systems such as Semi-CRF, Bi-LSTM, attention-based and transition-based models score 85.4 to 87.5 F1). Higher is better.</p>

- MDFN reaches 95.7 F1, 1.5 points above the previous state of the art (Span Classification BERT-GCN, 94.2) and 1.6 points above the text-only span-classification BERT baseline built with the same span head.
- Recall on disfluent spans rises to 98.7, the highest in the table by 4.9 points, which is where the acoustic cues contribute most.
- The multimodal interaction module adds only three cross-modal encoder blocks and a gate on top of the text encoder used by prior work, with no hand-crafted acoustic features.
- Qualitative analysis shows the text-only model flags spurious repetitions (for example a repeated "on" or "that" in grammatically loose sentences) as disfluencies, while MDFN uses the speaker's tone and confidence to correctly call them fluent.

## Resources

- [arXiv 2211.14700](https://arxiv.org/abs/2211.14700) ([PDF](https://arxiv.org/pdf/2211.14700))
- Data: the [Switchboard corpus](https://catalog.ldc.upenn.edu/LDC97S62) (LDC97S62), standard disfluency split
- Encoders: [bert-base-uncased](https://huggingface.co/bert-base-uncased) and [wav2vec 2.0 large, robust, fine-tuned on Switchboard](https://huggingface.co/facebook/wav2vec2-large-robust-ft-swbd-300h) on Hugging Face
- More of my work on [the publications page](/publications/)
