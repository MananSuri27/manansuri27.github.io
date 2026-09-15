---
layout: paper
title: "Omni2LoRA: Coherence-Preserving Parametric Memory for Efficient Omni Language Models"
short_title: "Omni2LoRA"
description: "Omni2LoRA compresses audio-visual recordings into a fixed-budget LoRA memory, with GRPO rank allocation that preserves cross-modal coherence. arXiv, 2026."
bibkey: mathur2026omni2lora
authors:
  - name: Puneet Mathur
    url: https://research.adobe.com/person/puneet-mathur/
  - name: Manan Suri
    url: /
    me: true
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park"
venue: "arXiv preprint"
venue_short: "arXiv"
year: 2026
date: 2026-08-10
arxiv: "2608.09227"
pdf: https://arxiv.org/pdf/2608.09227
website: https://omni2lora.github.io/
figure: /assets/img/papers/omni2lora/hero.png
figure_alt: "Three-panel overview contrasting token-space compression, which prunes a long joint audio-visual token stream and can break audio-video links, with Omni2LoRA, which uses a frozen encoder and a Perceiver hypernetwork to produce a recording-specific LoRA memory compressed by GRPO rank allocation, so a frozen omni model answers questions with no video, audio, or multimodal tokens in context."
figure_caption: "Omni2LoRA internalizes an audio-visual recording into a reusable LoRA memory. Token-space compression (left) keeps pruned multimodal tokens in context and can sever the audio-video anchors that reasoning depends on. Omni2LoRA (center) encodes the recording once into a recording-specific adapter, compresses it with coherence-aware GRPO rank allocation, and then answers every later question with zero multimodal tokens in the active context (right)."
tldr: "Omni language models pay for long joint audio-visual token streams on every query, and pruning those tokens in isolation destroys the cross-modal anchors that reasoning needs. Omni2LoRA encodes a recording into a LoRA adapter with a Perceiver hypernetwork and learns, with GRPO and a modality-ablated counterfactual reward, which rank directions to keep under a fixed budget: at a 30% rank budget it beats full-context inference and the strongest token-compression baselines by 8-12% average accuracy on four audio-visual QA benchmarks, with up to 12x lower time-to-first-token."
highlights:
  - value: "0"
    label: "multimodal tokens in context at answer time"
  - value: "30%"
    label: "rank budget used for the main results"
  - value: "8-12%"
    label: "average accuracy gain over the strongest baseline"
  - value: "12x"
    label: "lower query time-to-first-token (up to)"
og_image: https://manansuri.com/assets/img/papers/omni2lora/hero.png
---
## Abstract

Omnimodal language models (OLMs) enable unified audio-visual understanding, but processing long joint token sequences makes inference computationally prohibitive. While recent token compression methods attempt to alleviate this burden, compressing modalities in isolation often destroys the temporal cross-modal anchors necessary for coherent reasoning. We introduce Omni2LoRA, a two-stage framework for efficient parametric memory compression via coherence-preserving context distillation that bypasses the token bottleneck entirely. First, a Perceiver hypernetwork processes intermediate representations from a frozen OLM to encode the multimodal context into a full-rank Low-Rank Adaptation (LoRA) adapter in a single forward pass. To prevent the resulting parameter footprint from scaling linearly with recording length, we optimize a discrete rank allocation policy via Group Relative Policy Optimization (GRPO) that uses a modality-ablated counterfactual reward to explicitly penalize the loss of audio-visual coherence, forcing the model to allocate its fixed sub-linear rank budget to synergistic cross-modal anchors rather than isolated visual features.

Across three omnimodal backbones (Qwen2.5-Omni-3B/7B, InteractiveOmni-4B), Omni2LoRA operating at a 30% rank budget outperforms direct full-context inference and strong token-compression baselines (OmniZip, OMAC, O-MARC) on four audio-visual question answering benchmarks, improving average accuracy by 8-12% over the strongest baseline and remaining stable under compression ratios as tight as 75%, where token-pruning methods degrade sharply. By converting multimodal memory into a fixed-budget, reusable parameter state, our method drives answer-time multimodal-token load to zero, cutting per-query Time to First Token (TTFT) by up to 12x relative to full-context inference and amortizing to under 0.5s after a handful of queries, establishing a robust paradigm for long-context omnimodal memory compression.

## The problem

Omni models reason jointly over what is seen and what is heard, which matters for real-world video where speech, ambient sound, scene transitions, and visual actions provide complementary evidence. But video frames and audio waveforms are both token-intensive, so their joint stream inflates context length, memory, and latency, and pushing a model past its capacity leads to lost cross-modal alignment or incoherent repetition.

Token compression methods prune or merge this stream, but compressing audio and video in isolation can remove exactly the evidence that joint reasoning depends on. A sound is only meaningful once grounded in the visible scene, and a visual event may stay ambiguous without its audio. Naively moving the recording into parameter space does not solve this either: an adapter generated for every temporal chunk grows linearly with recording length, and under a fixed budget the visually dominant features crowd out the brief acoustic anchors.

## Approach

Omni2LoRA extends the parametric internalization idea of [Frames2LoRA](/papers/frames2lora/) from silent video to synchronized audio-visual recordings, and adds a learned compression stage so the adapter footprint stays fixed regardless of recording length.

{% include figure.html path="assets/img/papers/omni2lora/fig-method.png" class="img-fluid rounded" zoomable=true caption="Overview of Omni2LoRA. Stage 1: a frozen omni encoder produces layer-wise hidden states for each temporal chunk; a Perceiver hypernetwork maps them to a full-rank bank of candidate LoRA slots, trained with cross-entropy against teacher captions. Stage 2: a scoring network selects a fixed-budget subset of slots by sequential without-replacement sampling and is optimized with GRPO, where the advantage is reshaped using joint, visual-only, and audio-only reference rollouts so that allocations which drop cross-modal evidence are penalized." %}

- **Stage 1, full-rank hypernetwork training.** The recording is split into non-overlapping temporal chunks. For each chunk, the frozen OLM encoder produces layer-wise hidden states, and a hierarchical Perceiver hypernetwork maps them to candidate LoRA factors for every target module, layer, and rank direction. The hypernetwork is trained with teacher-forced cross-entropy against cached teacher captions on VALOR-1M, with the encoder and answer model frozen. Once converged, it is frozen and treated as a deterministic mapping from a recording to a bank of rank-one candidate updates, called slots.
- **Stage 2, memory-augmented compression distillation.** A lightweight scoring network, conditioned on each chunk's pooled audio-visual summary and a positional embedding of (layer, module, rank), assigns a logit to every slot. Allocations under a fixed total rank budget are sampled sequentially without replacement, which keeps clipped importance-ratio training well defined. The policy is trained on FineVideo with a PPO-style clipped, KL-regularized objective; only the scoring network is updated.
- **Coherence-aware advantage shaping.** For each training query, the frozen answer model is scored under three full-token references: joint audio-visual, visual-only (audio masked), and audio-only (frames masked). The Audio-Visual Dependence Score is the gap between the joint reference and the best unimodal one, isolating queries that need both modalities. Each sampled allocation's degradation relative to the joint reference is amplified by this dependence score and subtracted from the standard group-relative GRPO advantage, so allocations that score well by luck while dropping cross-modal rank directions are penalized.
- **Inference.** The recording is processed once: the frozen hypernetwork builds the slot bank, the scoring network greedily keeps the top-budget slots, and the compact adapter is reused for every subsequent query. The frozen backbone answers with zero audio or visual tokens in its active context.

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Omni2LoRA: an audio-visual recording is encoded once by a frozen omni model, a Perceiver hypernetwork turns the hidden states into a full-rank bank of LoRA slots, a GRPO-trained scoring policy keeps a fixed 30 percent rank budget guided by joint, audio-only and visual-only counterfactual rewards, and the compact adapter lets the frozen model answer with zero multimodal tokens.">
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
    <marker id="ah3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/>
    </marker>
  </defs>

  <!-- 1. Recording -->
  <rect class="n" x="15" y="90" width="125" height="110" rx="10"/>
  <text class="t" x="77" y="118" text-anchor="middle">Audio-visual</text>
  <text class="t" x="77" y="136" text-anchor="middle">recording</text>
  <path class="n pulse" d="M35,170 l6,-10 l6,18 l6,-14 l6,10 l6,-6 l6,12 l6,-12 l6,8 l6,-4 l6,6 l6,-8 l6,4 l6,-2 l6,4" stroke-width="1.2"/>
  <text class="s" x="77" y="192" text-anchor="middle">temporal chunks</text>

  <!-- 2. Frozen OLM encoder -->
  <rect class="n" x="170" y="90" width="125" height="110" rx="10"/>
  <text class="t" x="232" y="118" text-anchor="middle">Frozen omni LM</text>
  <text class="s" x="232" y="136" text-anchor="middle">encodes once</text>
  <g class="pulse d1">
    <rect class="n acc" x="187" y="146" width="90" height="8" rx="2"/>
    <rect class="n acc" x="187" y="158" width="90" height="8" rx="2"/>
    <rect class="n acc" x="187" y="170" width="90" height="8" rx="2"/>
  </g>
  <text class="s" x="232" y="192" text-anchor="middle">layer-wise states</text>

  <!-- 3. Perceiver hypernetwork -->
  <rect class="n" x="325" y="90" width="125" height="110" rx="10"/>
  <text class="t" x="387" y="118" text-anchor="middle">Perceiver</text>
  <text class="t" x="387" y="136" text-anchor="middle">hypernetwork</text>
  <text class="s" x="387" y="160" text-anchor="middle">Stage 1: trained</text>
  <text class="s" x="387" y="176" text-anchor="middle">with CE, then</text>
  <text class="s" x="387" y="192" text-anchor="middle">frozen</text>

  <!-- 4. Full-rank slot bank -->
  <rect class="n" x="480" y="90" width="115" height="110" rx="10"/>
  <text class="t" x="537" y="118" text-anchor="middle">Full-rank</text>
  <text class="t" x="537" y="136" text-anchor="middle">slot bank</text>
  <g class="pulse d2">
    <rect class="n" x="497" y="148" width="14" height="14" rx="2"/><rect class="n" x="515" y="148" width="14" height="14" rx="2"/><rect class="n" x="533" y="148" width="14" height="14" rx="2"/><rect class="n" x="551" y="148" width="14" height="14" rx="2"/><rect class="n" x="569" y="148" width="14" height="14" rx="2"/>
  </g>
  <text class="s" x="537" y="180" text-anchor="middle">rank-1 updates</text>
  <text class="s" x="537" y="194" text-anchor="middle">per layer/module</text>

  <!-- 5. GRPO scoring policy -->
  <rect class="n acc" x="625" y="90" width="120" height="110" rx="10" stroke-width="2"/>
  <text class="t" x="685" y="118" text-anchor="middle">Scoring policy</text>
  <text class="s" x="685" y="136" text-anchor="middle">keeps 30% budget</text>
  <g class="pulse d3">
    <rect class="n acc" x="647" y="148" width="14" height="14" rx="2"/><rect class="n" x="665" y="148" width="14" height="14" rx="2" opacity="0.3"/><rect class="n acc" x="683" y="148" width="14" height="14" rx="2"/><rect class="n" x="701" y="148" width="14" height="14" rx="2" opacity="0.3"/><rect class="n" x="719" y="148" width="14" height="14" rx="2" opacity="0.3"/>
  </g>
  <text class="s" x="685" y="180" text-anchor="middle">Stage 2: GRPO,</text>
  <text class="s" x="685" y="194" text-anchor="middle">only part trained</text>

  <!-- reward box below the policy -->
  <rect class="n" x="600" y="235" width="170" height="70" rx="8"/>
  <text class="s" x="685" y="255" text-anchor="middle">coherence-aware reward:</text>
  <text class="s" x="685" y="271" text-anchor="middle">joint vs audio-only vs</text>
  <text class="s" x="685" y="287" text-anchor="middle">visual-only rollouts</text>
  <path class="flow d3" d="M685,235 L685,202" marker-end="url(#ah3)"/>

  <!-- 6. Compact adapter + frozen OLM -->
  <rect class="n" x="775" y="90" width="115" height="110" rx="10"/>
  <text class="t" x="832" y="118" text-anchor="middle">Frozen OLM</text>
  <text class="t" x="832" y="136" text-anchor="middle">+ adapter</text>
  <text class="s" x="832" y="160" text-anchor="middle">0 audio or</text>
  <text class="s" x="832" y="176" text-anchor="middle">video tokens</text>
  <text class="s" x="832" y="192" text-anchor="middle">in context</text>

  <!-- queries -->
  <rect class="n" x="775" y="245" width="115" height="42" rx="8"/>
  <text class="t" x="832" y="271" text-anchor="middle">Questions</text>
  <path class="flow d4" d="M832,245 L832,202" marker-end="url(#ah3)"/>
  <rect class="n" x="775" y="18" width="115" height="42" rx="8"/>
  <text class="t" x="832" y="44" text-anchor="middle">Answers</text>
  <path class="flow d4" d="M832,90 L832,62" marker-end="url(#ah3)"/>

  <!-- flows -->
  <path class="flow" d="M140,145 L168,145" marker-end="url(#ah3)"/>
  <path class="flow d1" d="M295,145 L323,145" marker-end="url(#ah3)"/>
  <path class="flow d2" d="M450,145 L478,145" marker-end="url(#ah3)"/>
  <path class="flow d2" d="M595,145 L623,145" marker-end="url(#ah3)"/>
  <path class="flow d3" d="M745,145 L773,145" marker-end="url(#ah3)"/>

  <text class="s" x="305" y="45" text-anchor="middle">Internalize once: recording → full-rank LoRA memory</text>
  <text class="s fade1" x="305" y="65" text-anchor="middle">then compress to a fixed rank budget that does not grow with recording length</text>
</svg>
<div class="anim-caption">Stage 1 turns a recording into a full-rank bank of rank-one LoRA slots through a frozen omni model and a Perceiver hypernetwork; Stage 2 trains a scoring policy with GRPO to keep a fixed 30% rank budget, using joint, audio-only, and visual-only reference rollouts so that slots carrying cross-modal evidence survive, and the compact adapter answers every later question with zero audio or video tokens in context.</div>
</div>

## Results

Evaluation covers three backbones (Qwen2.5-Omni-3B, InteractiveOmni-4B, Qwen2.5-Omni-7B) on UGC-AVQA, WorldSense, OmniVideoBench, and DailyOmni for accuracy, and VidCapBench for efficiency. Baselines are direct full-context inference plus the token-compression methods OmniZip, OMAC, and O-MARC, all at the same 32-frame setting and 30% retained ratio.

| Qwen2.5-Omni-7B, 32 frames | Retained | DailyOmni | UGC-AVQA | OmniVideo | WorldSense | Average |
|---|---|---|---|---|---|---|
| Full tokens | 100% | 56.3 | 54.1 | 34.6 | 43.6 | 47.2 |
| OmniZip | 30% | 51.8 | 52.7 | 30.0 | 39.6 | 43.5 |
| OMAC | 30% | 53.6 | 53.2 | 30.9 | 42.4 | 45.0 |
| O-MARC | 30% | 60.4 | 64.6 | 35.2 | 44.0 | 51.1 |
| **Omni2LoRA** | 30% | **63.6** | **68.0** | **36.6** | **45.8** | **53.2** |

<p class="table-note">Source: Table 1 of the paper. DailyOmni, UGC-AVQA (overall), and WorldSense report accuracy (%); OmniVideo reports average score. Omni2LoRA's gains over O-MARC on DailyOmni, UGC-AVQA, OmniVideo, WorldSense, and the average are significant at p &lt; 0.05 (Wilcoxon signed-rank). Higher is better.</p>

| Four-benchmark average | Full tokens | OmniZip | OMAC | O-MARC | Omni2LoRA |
|---|---|---|---|---|---|
| Qwen2.5-Omni-3B | 44.1 | 41.0 | 42.8 | 45.8 | **47.3** |
| InteractiveOmni-4B | 46.0 | 42.6 | 44.1 | 45.8 | **47.6** |
| Qwen2.5-Omni-7B | 47.2 | 43.5 | 45.0 | 51.1 | **53.2** |

<p class="table-note">Source: Table 1 of the paper, average column for each backbone. Compression baselines and Omni2LoRA use a 30% retained ratio. Higher is better.</p>

- **Cross-modal coherence.** Gains are largest on UGC-AVQA, which strictly requires joint acoustic and visual evidence: 68.0% overall on the 7B backbone versus 64.6 for O-MARC and 54.1 for full tokens, with improvements on all four of its categories (event progression 68.2, scene or temporal transition 70.4, cross-scene alignment 63.5, fine-grained contrast 70.2).
- **Allocation ablation.** The uncompressed full-rank adapter reaches near parity with direct audio-visual inference (for example 50.3 vs 48.9 on UGC-AVQA at 3B). Under a 30% budget, uniform allocation and Frobenius-norm-scored allocation degrade sharply (44.9 and 47.9 on UGC-AVQA at 3B, versus 61.7 for the learned O2L-GRPO policy).
- **Compression ratio and long recordings.** On UGC-AVQA, Omni2LoRA holds 60.7 accuracy at 75% compression while OmniZip falls to 47.1, OMAC to 49.1, and O-MARC to 56.3. Sweeping 8 to 1,024 frames, the direct baseline collapses to 22.0 at 1,024 frames from context exhaustion, while Omni2LoRA improves monotonically to 46.2.
- **Efficiency.** On VidCapBench with the 7B backbone, single-question TTFT averages 0.49s including internalization, versus 6.03s for full-context inference and 3.45s for O-MARC. Amortized over repeated questions, latency falls to 0.82s per query (7B) and 0.72s (3B) after five queries and plateaus near 0.43s, while O-MARC stays at 3.6s to 4.2s.

### Evaluation benchmarks

| Benchmark | Videos | Queries | Metric |
|---|---|---|---|
| UGC-AVQA | 206 | 1,648 | Accuracy (%) |
| WorldSense | 1,662 | 3,172 | Accuracy (%) |
| OmniVideoBench | 628 | 1,000 | Average score |
| DailyOmni | 684 | 1,197 | Accuracy (%) |
| VidCapBench | 643 | 9,494 | TTFT (s) |

<p class="table-note">Source: Table 4 of the paper. UGC-AVQA figures are for the difficulty-filtered benchmark split; VidCapBench counts refer to the automatically-assessable subset. Stage 1 trains on VALOR-1M (about 1M clips) and Stage 2 on FineVideo (43,751 videos, about 219K queries).</p>

## Resources

- [arXiv: 2608.09227](https://arxiv.org/abs/2608.09227) and [PDF](https://arxiv.org/pdf/2608.09227)
- [Project page](https://omni2lora.github.io/)
- The video-only predecessor: [Frames2LoRA](/papers/frames2lora/) (paper page), its [code](https://github.com/frames2lora/Frames2LoRA) and [checkpoints](https://huggingface.co/MananSuri27/Frames2LoRA-SmolVLM-ckpts), and its [explainer post](/blog/2026/frames2lora-explained/)
- [All publications](/publications/)
