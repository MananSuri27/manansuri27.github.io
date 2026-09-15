---
layout: paper
title: "Frames2LoRA: Parametric Video Internalization for Vision-Language Models"
short_title: "Frames2LoRA"
description: "Frames2LoRA turns a video into a LoRA adapter in one forward pass, so a frozen VLM answers with zero visual tokens in context. arXiv preprint, 2026."
bibkey: suri2026frames2lora
authors:
  - name: Manan Suri
    url: /
    me: true
    equal: true
  - name: Sarvesh Baskar
    url: https://sarvesh-369.github.io/
    equal: true
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "University of Maryland, College Park"
venue: "arXiv preprint"
venue_short: "arXiv"
year: 2026
date: 2026-06-03
arxiv: "2606.04351"
pdf: https://arxiv.org/pdf/2606.04351
code: https://github.com/frames2lora/Frames2LoRA
website: https://frames2lora.github.io/
checkpoints: https://huggingface.co/MananSuri27/Frames2LoRA-SmolVLM-ckpts
hf_paper: https://huggingface.co/papers/2606.04351
blog: /blog/2026/frames2lora-explained/
press:
  - title: "Teaching AI to See Faster"
    url: https://www.cs.umd.edu/article/2026/07/teaching-ai-see-faster
    outlet: UMD Department of Computer Science
    date: July 2026
figure: /assets/img/papers/frames2lora/hero.png
figure_alt: "Frames2LoRA overview. Training: a frozen VLM encodes the video, a Perceiver hypernetwork reads its layer-wise hidden states and emits LoRA factors that are injected into a second frozen copy of the VLM. Inference: the adapter is generated once and the VLM answers text queries without video tokens."
figure_caption: "Frames2LoRA overview. Training (left): a frozen VLM encodes the video into layer-wise hidden states; the trainable Perceiver hypernetwork maps them to LoRA adapter weights in a single forward pass, and the adapter-augmented frozen VLM is trained against teacher-generated targets. Inference (right): the adapter is generated once per video, and the frozen VLM answers arbitrary text queries with no visual tokens in context."
tldr: "Video is expensive for VLMs because every frame costs hundreds of tokens and every repeated query pays that cost again. Frames2LoRA encodes a video into a LoRA adapter in one forward pass, so a frozen VLM answers with zero visual tokens in context: outputs are statistically non-inferior to video-in-context inference on all five captioning benchmarks, with up to 1,500x fewer answer-time tokens and 6-80x faster time-to-first-token."
highlights:
  - value: "1,500x"
    label: "fewer answer-time visual tokens (up to)"
  - value: "6-80x"
    label: "faster query time-to-first-token"
  - value: "0"
    label: "visual tokens in context at query time"
  - value: "1,024"
    label: "frames handled stably, trained on 12"
demo: /assets/img/papers/frames2lora/demo.gif
demo_caption: "Animated overview from the project page: a frozen VLM encodes the video, the Perceiver hypernetwork emits a LoRA adapter in one forward pass, and the adapter-augmented frozen VLM answers text queries with no visual tokens."
og_image: https://manansuri.com/assets/img/papers/frames2lora/hero.png
---
## Abstract

Formerly titled Video2LoRA (arXiv v1).

Processing video in vision-language models is expensive: each frame occupies hundreds of tokens, and inference cost scales with every frame and every repeated query. We introduce Frames2LoRA, a method for parametric video internalization. A perceiver hypernetwork reads the intermediate representations produced layer-by-layer as a frozen VLM encodes a video, and generates a Low-Rank Adaptation (LoRA) adapter in a single forward pass. Unlike standard LoRA fine-tuning, which requires iterative gradient updates, Frames2LoRA predicts these weights directly from the video.

Trained for SmolVLM2 500M and 2.2B on video summarization and captioning, Frames2LoRA enables the same frozen VLM to answer queries from the adapter alone, with zero visual tokens in its context at query time. Frames2LoRA is statistically non-inferior and equivalent to direct video-in-context inference across all five captioning benchmarks at both model scales, and across seven of eight video question answering benchmark-scale pairings. Although trained only on 12 frames at 384px, it remains stable up to 1,024 frames and 1024px, where direct video-in-context inference often degenerates. Across this sweep, it reduces answer-time visual-token load by up to 1,500x and query TTFT by 6-80x, while preserving video-faithful outputs. We also find that independently generated adapters for non-overlapping video segments can compose in rank space, suggesting a path toward chunked long-video internalization.

## The problem

Video understanding in VLMs is built on a token-heavy abstraction: frames are encoded as visual tokens and concatenated into the model's context window. Each frame at standard resolution contributes hundreds of tokens, so a clip of a few dozen frames produces tens of thousands of tokens before any text query is added. Past a capacity threshold the model does not degrade gracefully; it produces repetitive or incoherent text unrelated to the video.

Frame subsampling, visual token compression, long-context architectures, and streaming memory all reduce this burden without removing it. Visual tokens remain in context at query time, every query re-pays the encoding cost, and every approach eventually hits the same ceiling. We take a different route: rather than fitting more video into the context window, we remove it from the query entirely by storing the video in the model's parameters before any query is issued.

## Approach

Frames2LoRA converts a video into a video-specific LoRA adapter in a single forward pass. Both the video encoder and the answer model are frozen copies of the same SmolVLM2 backbone; only the hypernetwork is trained.

- **Video encoder.** A frozen SmolVLM2 encodes the sampled frames together with an internalization instruction. We keep the text-side hidden states from every transformer layer, giving a stack of layer-indexed video-conditioned states rather than a single pooled vector.
- **Perceiver hypernetwork.** For each layer slice, an encoder resampler attends from learned latent queries to the hidden states, and a decoder resampler emits one latent per target module and LoRA rank direction. A shared projection head maps each rank latent to the LoRA factors A and B. The factors are scaled by learned multipliers, with the B scale initialized to zero so the adapter starts as a null perturbation.
- **Dynamic LoRA injection.** The generated factors are added to the frozen linear layers using the standard LoRA update. Each video receives its own adapter; in our experiments the adapters target the MLP down-projection modules of the text decoder with rank 16.
- **Training objective.** The hypernetwork is trained with teacher-forced cross-entropy over response tokens. Targets are cached generations from a frozen SmolVLM2 teacher that saw the video frames; the student answer model sees only the text prompt plus the generated adapter. Training uses 12 uniformly sampled frames at 384px, on single-scene, adjacent multi-scene, and full-video spans from FineVideo mixed 60/30/10. Audio is excluded.

{% include figure.html path="assets/img/papers/frames2lora/fig-scaling.png" class="img-fluid rounded" zoomable=true caption="Change in mean Token-F1 from replacing in-context video tokens with Frames2LoRA on VDC background captioning, across frame count (rows) and resolution (columns). Trained only at 12 frames and 384px, Frames2LoRA stays close to the base model across the sweep and overtakes it at high frame counts and 1024px, where video-in-context inference degenerates." %}

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frames2LoRA: video frames pass through a frozen VLM whose layer-wise hidden states feed a Perceiver hypernetwork that emits LoRA weights; the adapter-augmented frozen VLM then answers text queries with zero visual tokens.">
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

  <!-- 1. Video frames -->
  <rect class="n" x="20" y="120" width="125" height="110" rx="10"/>
  <rect class="n pulse" x="38" y="138" width="46" height="32" rx="3"/>
  <rect class="n pulse d1" x="50" y="146" width="46" height="32" rx="3"/>
  <rect class="n pulse d2" x="62" y="154" width="46" height="32" rx="3"/>
  <text class="t" x="82" y="208" text-anchor="middle">Video frames</text>
  <text class="s" x="82" y="224" text-anchor="middle">12 frames at 384px</text>

  <!-- 2. Frozen VLM encoder -->
  <rect class="n" x="185" y="120" width="145" height="110" rx="10"/>
  <text class="t" x="257" y="142" text-anchor="middle">Frozen VLM</text>
  <text class="s" x="257" y="158" text-anchor="middle">encodes video</text>
  <g class="pulse d1">
    <rect class="n acc" x="203" y="167" width="108" height="9" rx="2"/>
    <rect class="n acc" x="203" y="180" width="108" height="9" rx="2"/>
    <rect class="n acc" x="203" y="193" width="108" height="9" rx="2"/>
  </g>
  <text class="s" x="257" y="220" text-anchor="middle">layer-wise states</text>

  <!-- 3. Perceiver hypernetwork -->
  <rect class="n acc" x="370" y="120" width="160" height="110" rx="10" stroke-width="2"/>
  <text class="t" x="450" y="150" text-anchor="middle">Perceiver</text>
  <text class="t" x="450" y="168" text-anchor="middle">hypernetwork</text>
  <text class="s" x="450" y="192" text-anchor="middle">the only trained part</text>
  <text class="s" x="450" y="208" text-anchor="middle">one forward pass</text>

  <!-- 4. LoRA weights -->
  <rect class="n" x="570" y="120" width="130" height="110" rx="10"/>
  <text class="t" x="635" y="150" text-anchor="middle">LoRA adapter</text>
  <text class="s" x="635" y="172" text-anchor="middle">A, B per layer</text>
  <text class="s" x="635" y="188" text-anchor="middle">rank 16</text>
  <text class="s" x="635" y="208" text-anchor="middle">built once per video</text>

  <!-- 5. Frozen VLM + adapter -->
  <rect class="n" x="740" y="120" width="140" height="110" rx="10"/>
  <text class="t" x="810" y="150" text-anchor="middle">Frozen VLM</text>
  <text class="t" x="810" y="168" text-anchor="middle">+ adapter</text>
  <text class="s" x="810" y="192" text-anchor="middle">0 visual tokens</text>
  <text class="s" x="810" y="208" text-anchor="middle">in context</text>

  <!-- query in, answer out -->
  <rect class="n" x="740" y="262" width="140" height="42" rx="8"/>
  <text class="t" x="810" y="288" text-anchor="middle">Text query</text>
  <path class="flow d3" d="M810,262 L810,232" marker-end="url(#ah)"/>
  <text class="s" x="732" y="252" text-anchor="end">any number</text>
  <text class="s" x="732" y="266" text-anchor="end">of queries</text>

  <rect class="n" x="740" y="18" width="140" height="42" rx="8"/>
  <text class="t" x="810" y="44" text-anchor="middle">Answer</text>
  <path class="flow d4" d="M810,120 L810,62" marker-end="url(#ah)"/>

  <!-- flows between boxes -->
  <path class="flow" d="M145,175 L183,175" marker-end="url(#ah)"/>
  <path class="flow d1" d="M330,175 L368,175" marker-end="url(#ah)"/>
  <path class="flow d2" d="M530,175 L568,175" marker-end="url(#ah)"/>
  <path class="flow d3" d="M700,175 L738,175" marker-end="url(#ah)"/>

  <!-- phase labels -->
  <text class="s" x="360" y="70" text-anchor="middle">Internalize once (frames → weights)</text>
  <path class="n" d="M20,80 L700,80" stroke-dasharray="2 4" opacity="0.5"/>
  <text class="s fade1" x="360" y="100" text-anchor="middle">every later query re-uses the adapter and pays no per-frame token cost</text>
</svg>
<div class="anim-caption">Frames2LoRA in one pass: frames go through a frozen VLM, its layer-wise hidden states drive a Perceiver hypernetwork that writes a rank-16 LoRA adapter, and the same frozen VLM plus adapter answers every later text query with zero visual tokens in context.</div>
</div>

## Example

Two real evaluation outputs from the [project page](https://frames2lora.github.io/), comparing the base SmolVLM2 prompted with the video in context against Frames2LoRA answering from the generated adapter alone (no video tokens). Token-F1 is against the benchmark reference.

<div class="paper-example" markdown="1">
<span class="ex-label">Input (CaReBench: Caption)</span>
<div class="ex-row">Prompt: "Describe the video in as much useful visual detail as possible. Include the main activity, visible people or objects, scene context, appearance, and any important visual details that help explain what is happening."</div>
<div class="ex-row">Reference (trimmed): "This video depicts a scene of a man lighting a pipe with a lighter. The man in the video is smoking a pipe held in his mouth, supported by his left hand, while his right hand grips the lighter. His right forearm features a large black tattoo. ... dressed in a loose-fitting black tank top. He is seated next to a window ... with a brick wall behind him and a wooden door on the right. ..."</div>
<span class="ex-label">Output</span>
<div class="ex-row">Base model, video in context (token-F1 0.32): "A young man with tattoos on his arms is sitting in a room with a brick wall and a wooden door. He is holding a lighter and <span class="ex-bad">a piece of paper. He is blowing on the paper and then putting it in his mouth.</span>"</div>
<div class="ex-row">Frames2LoRA, zero visual tokens (token-F1 <span class="ex-good">0.56</span>): "A person is smoking a cigarette in a room with a brick wall and a wooden door. The person is wearing a black tank top and has tattoos on their arms. They are holding the cigarette in their right hand and using their left hand to light it with a lighter."</div>
</div>

<div class="paper-example" markdown="1">
<span class="ex-label">Input (VidCapBench)</span>
<div class="ex-row">Question: "What is the weather like in the scene? Answer only the question, in one sentence."</div>
<div class="ex-row">Reference: "Rainy day."</div>
<span class="ex-label">Output</span>
<div class="ex-row">Base model, video in context (token-F1 0.85): <span class="ex-good">"It is raining."</span></div>
<div class="ex-row">Frames2LoRA, zero visual tokens (token-F1 0.80): <span class="ex-good">"The video shows a rainy day with a wet path and trees."</span></div>
</div>

Both answers are video-faithful; the adapter-only answer is a little more verbose, which is the pattern the paper reports for token-F1 on short-answer QA.

## Results

All comparisons use the same videos, prompts, references, frame sampling, and decoding for the video-in-context baseline and Frames2LoRA. Quality is measured with token-level F1 and a Qwen3-30B LLM judge (Spearman 0.823 with human ratings on 200 examples), with paired bootstrap 95% confidence intervals and formal non-inferiority (NI, margin 0.15 on the rescaled judge score) and equivalence (Eq) tests.

| Captioning benchmark | Base 500M | Frames2LoRA 500M | Base 2.2B | Frames2LoRA 2.2B | Eq / NI |
|---|---|---|---|---|---|
| ActivityNet Captions | 0.428 | **0.356** | 0.576 | **0.492** | Y / Y |
| PLM-RDCap | 0.308 | **0.263** | 0.326 | **0.316** | Y / Y |
| PLM-RCap | 0.252 | **0.242** | 0.270 | **0.287** | Y / Y |
| VDC (aggregate) | 0.515 | **0.406** | 0.539 | **0.511** | Y / Y |
| CaReBench | 0.334 | **0.278** | 0.437 | **0.369** | Y / Y |
| Average | 0.367 | **0.309** | 0.430 | **0.395** | Y / Y |

<p class="table-note">Source: Table 1 of the paper (LLM-judge score, rescaled to [0, 1]). Eq / NI list the equivalence and non-inferiority outcomes, which are identical at both scales. Higher is better. The same table's token-F1 averages are 0.243 vs 0.242 (500M) and 0.250 vs 0.250 (2.2B).</p>

| Video QA benchmark (zero-shot) | Base 500M | Frames2LoRA 500M | Base 2.2B | Frames2LoRA 2.2B | Eq / NI |
|---|---|---|---|---|---|
| NExT-QA (open) | 0.501 | **0.547** | 0.597 | **0.610** | Y / Y |
| ActivityNet-QA | 0.524 | **0.541** | 0.627 | **0.531** | Y / Y |
| PLM-SGQA | 0.390 | **0.317** | 0.493 | **0.295** | Y / Y (500M); fails (2.2B) |
| VidCapBench | 0.502 | **0.451** | 0.551 | **0.475** | Y / Y |
| Average | 0.487 | **0.460** | 0.562 | **0.477** | Y / Y |

<p class="table-note">Source: Table 4 of the paper (LLM-judge score). Frames2LoRA is trained only on captioning; QA is zero-shot. Higher is better.</p>

- **Captioning.** Frames2LoRA passes both non-inferiority and equivalence on all 10 benchmark-scale combinations under the LLM judge and all 10 under token-F1. It recovers 91.9% of the base model's judge score at 2.2B and 84.2% at 500M; on PLM-RCap at 500M it beats the base by +0.026 token-F1 (+14.7%).
- **Video QA, zero-shot.** 7 of 8 benchmark-scale pairings pass the judge tests; on NExT-QA it surpasses the base at both scales. The one failure is PLM-SGQA at 2.2B.
- **Frame and resolution generalization.** Sweeping 8 to 1,024 frames and 224 to 1024px on VDC background captioning, Frames2LoRA stays stable everywhere (average token-F1 change of -0.012 at 500M) and beats the base by +0.12 to +0.13 token-F1 at 1024px and high frame counts, where direct inference degenerates into repetitive output.
- **Efficiency.** Query TTFT drops by a geometric mean of 6.7x (500M) and 20.1x (2.2B), with maxima of 17.2x and 79.1x; answer-time input tokens fall by 150x and 302x on average, reaching 713x and 1,507x. On VidCapBench (100 videos, 1,523 queries), average TTFT including the one-time internalization falls from 6.45s to 0.55s at 500M and 7.06s to 0.58s at 2.2B.
- **Chunk composition.** Internalizing two temporal halves independently and concatenating the LoRA ranks retains 93.1% (500M) and 86.2% (2.2B) of the single-video adapter's token-F1 on VDC, with no training for composition.
- **Where it is weakest.** Camera-style captions in VDC recover only 42.3% of the base judge score at 500M, rising to 82.0% at 2.2B.

## Resources

- [arXiv: 2606.04351](https://arxiv.org/abs/2606.04351) and [PDF](https://arxiv.org/pdf/2606.04351)
- [Project page](https://frames2lora.github.io/) with a qualitative-example explorer
- [Code on GitHub](https://github.com/frames2lora/Frames2LoRA)
- [SmolVLM2 checkpoints on Hugging Face](https://huggingface.co/MananSuri27/Frames2LoRA-SmolVLM-ckpts) (500M and 2.2B)
- [Hugging Face Papers page](https://huggingface.co/papers/2606.04351)
- [Explainer post](/blog/2026/frames2lora-explained/) on this site
- Follow-up work extending the idea to audio-visual context: [Omni2LoRA](/papers/omni2lora/)
- UMD CS coverage: [Teaching AI to See Faster](https://www.cs.umd.edu/article/2026/07/teaching-ai-see-faster)
- [All publications](/publications/)

### Quick start

From the repository README: install with `uv`, download a checkpoint, and run inference over a JSONL manifest with one row per video.

```bash
git clone https://github.com/frames2lora/Frames2LoRA.git
cd Frames2LoRA
uv sync

uv run huggingface-cli download MananSuri27/Frames2LoRA-SmolVLM-ckpts \
  --local-dir checkpoints/Frames2LoRA-SmolVLM-ckpts

# manifest.jsonl, one line per video:
# {"id":"sample-0001","video_path":"/path/to/video.mp4","prompt":"Describe what is happening in this video.","task_type":"caption"}

uv run python -m scripts.frames2lora.infer \
  --checkpoint checkpoints/Frames2LoRA-SmolVLM-ckpts/frames2lora-smolvlm2-500m-best-ce.pt \
  --manifest /path/to/manifest.jsonl \
  --output outputs/tiny_generations.jsonl
```
